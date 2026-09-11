package com.stockflow.expense.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.expense.dto.ParseResultDto;
import com.stockflow.expense.dto.ParsedExpenseDto;
import com.stockflow.expense.entity.Expense;
import com.stockflow.expense.repository.ExpenseRepository;
import com.stockflow.global.exception.ExternalDataException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 문자와 캡처를 같은 모양의 후보 목록으로 바꾼다.
 *
 * <p>입력 경로는 여럿이지만 확인 화면은 하나이므로, 어느 경로로 들어와도
 * 여기서 카테고리 추측과 중복 검사를 똑같이 거쳐 {@link ParseResultDto} 로 나간다.
 * 저장은 하지 않는다. 사용자가 확인 화면에서 고른 것만 나중에 저장된다.
 */
@Service
@RequiredArgsConstructor
public class ExpenseImportService {

    /** 캡처 분석은 호출마다 비용이 든다. 한 사람이 하루에 부를 수 있는 횟수. */
    public static final int DAILY_IMAGE_LIMIT = 20;
    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;
    private static final List<String> ALLOWED_IMAGE_TYPES =
            List.of("image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic");

    /** 회원별 캡처 호출 횟수. 프로토타입이라 메모리에 둔다. 서버를 다시 띄우면 초기화된다. */
    private final Map<Long, ImageQuota> imageQuotas = new ConcurrentHashMap<>();

    private final CardSmsParser cardSmsParser;
    private final ReceiptImageParser receiptImageParser;
    private final MerchantCategoryGuesser merchantCategoryGuesser;
    private final ExpenseRepository expenseRepository;
    private final CurrentMemberProvider currentMemberProvider;

    public ParseResultDto parseSms(String text) {
        Long memberId = currentMemberProvider.currentMemberId();
        List<Expense> history = recentHistory(memberId);
        List<ParsedExpenseDto> items = new ArrayList<>();
        for (CardSmsParser.Parsed parsed : cardSmsParser.parse(text)) {
            items.add(toCandidate(
                    memberId,
                    history,
                    parsed.merchant(),
                    parsed.amount(),
                    parsed.date(),
                    "SMS",
                    parsed.rawText()));
        }
        List<String> warnings = new ArrayList<>();
        if (items.isEmpty()) {
            warnings.add("결제 문자를 찾지 못했습니다. 카드 승인 문자를 통째로 붙여넣었는지 확인해 주세요.");
        }
        return summarize(items, null, warnings);
    }

    public ParseResultDto parseImage(MultipartFile file) {
        Long memberId = currentMemberProvider.currentMemberId();
        validateImage(file);
        consumeImageQuota(memberId);

        ReceiptImageParser.Result read;
        try {
            read = receiptImageParser.read(file.getBytes(), file.getContentType());
        } catch (ExternalDataException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ExternalDataException("IMAGE_READ_FAILED", "이미지를 읽지 못했습니다.");
        }

        List<Expense> history = recentHistory(memberId);
        List<ParsedExpenseDto> items = new ArrayList<>();
        for (ReceiptImageParser.Item item : read.items()) {
            items.add(toCandidate(
                    memberId,
                    history,
                    item.merchant(),
                    item.amount(),
                    item.date(),
                    "IMAGE",
                    item.merchant() + " " + item.amount() + "원"));
        }

        List<String> warnings = new ArrayList<>(read.notes());
        if (items.isEmpty()) {
            warnings.add("화면에서 결제 내역을 찾지 못했습니다. 목록이 보이는 화면인지 확인해 주세요.");
        }
        warnings.add("읽어낸 금액과 가게 이름이 맞는지 저장 전에 확인해 주세요.");
        return summarize(items, read.reportedTotal(), warnings);
    }

    public int remainingImageQuota() {
        ImageQuota quota = imageQuotas.get(currentMemberProvider.currentMemberId());
        if (quota == null || !quota.date.equals(LocalDate.now())) {
            return DAILY_IMAGE_LIMIT;
        }
        return Math.max(0, DAILY_IMAGE_LIMIT - quota.count);
    }

    public boolean imageParsingAvailable() {
        return receiptImageParser.isEnabled();
    }

    private ParsedExpenseDto toCandidate(
            Long memberId,
            List<Expense> history,
            String merchant,
            BigDecimal amount,
            LocalDate spentDate,
            String source,
            String rawText
    ) {
        String cleanMerchant = merchant == null || merchant.isBlank() ? "미확인 가맹점" : merchant.trim();
        LocalDate date = spentDate == null ? LocalDate.now() : spentDate;
        String category = merchantCategoryGuesser.guess(cleanMerchant, history);
        boolean duplicate = expenseRepository
                .existsByMemberIdAndMerchantAndAmountAndSpentDate(memberId, cleanMerchant, amount, date);
        String warning = "미확인 가맹점".equals(cleanMerchant) ? "가게 이름을 읽지 못했습니다. 직접 입력해 주세요." : null;
        return new ParsedExpenseDto(category, cleanMerchant, amount, date, source, rawText, duplicate, warning)
                .withDuplicate(duplicate);
    }

    /**
     * 항목 합과 화면에 적힌 합계를 대조한다.
     *
     * <p>자릿수를 잘못 읽으면 열 배 차이가 나므로, 여기서 걸러 주지 않으면
     * 월 통계와 목표 달성률이 통째로 망가진다.
     */
    private ParseResultDto summarize(List<ParsedExpenseDto> items, BigDecimal reportedTotal, List<String> warnings) {
        BigDecimal total = items.stream()
                .map(ParsedExpenseDto::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        boolean matched = true;
        if (reportedTotal != null && reportedTotal.signum() > 0) {
            matched = reportedTotal.compareTo(total) == 0;
            if (!matched) {
                warnings.add("화면의 합계(" + reportedTotal.toPlainString() + "원)와 읽어낸 항목의 합("
                        + total.toPlainString() + "원)이 다릅니다. 금액을 다시 확인해 주세요.");
            }
        }
        int duplicates = (int) items.stream().filter(ParsedExpenseDto::duplicate).count();
        if (duplicates > 0) {
            warnings.add("이미 등록된 것으로 보이는 " + duplicates + "건은 기본으로 선택을 해제했습니다.");
        }
        return new ParseResultDto(items, items.size(), duplicates, total, reportedTotal, matched, warnings);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("이미지를 선택해 주세요.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("이미지는 10MB 이하만 올릴 수 있습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || ALLOWED_IMAGE_TYPES.stream().noneMatch(contentType::equalsIgnoreCase)) {
            throw new IllegalArgumentException("이미지 파일만 올릴 수 있습니다.");
        }
    }

    private void consumeImageQuota(Long memberId) {
        LocalDate today = LocalDate.now();
        ImageQuota quota = imageQuotas.compute(memberId, (key, current) ->
                current == null || !current.date.equals(today) ? new ImageQuota(today, 1) : current.increase());
        if (quota.count > DAILY_IMAGE_LIMIT) {
            throw new IllegalArgumentException(
                    "캡처 분석은 하루 " + DAILY_IMAGE_LIMIT + "장까지 가능합니다. 카드 문자 붙여넣기를 이용해 주세요.");
        }
    }

    private List<Expense> recentHistory(Long memberId) {
        return expenseRepository.findTop300ByMemberIdOrderBySpentDateDesc(memberId);
    }

    private record ImageQuota(LocalDate date, int count) {
        ImageQuota increase() {
            return new ImageQuota(date, count + 1);
        }
    }
}
