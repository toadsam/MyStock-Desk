package com.stockflow.expense.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * 카드 승인 문자에서 금액·날짜·가게 이름을 뽑는다.
 *
 * <p>카드사마다 문장 순서가 조금씩 다르므로 위치가 아니라 단서로 찾는다.
 * 금액은 "누적", "잔액" 같은 꼬리 금액을 걸러낸 첫 번째 값을 쓰고,
 * 가게 이름은 승인 시각 뒤에 오는 덩어리에서 꼬리말을 떼어낸다.
 *
 * <p>승인취소 문자는 소비가 아니므로 건너뛴다.
 */
@Component
public class CardSmsParser {

    /** 결제 문자로 보기 위한 최소 조건: 금액이 있어야 한다. */
    private static final Pattern AMOUNT = Pattern.compile("([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\\s*원");
    private static final Pattern DATE_SLASH = Pattern.compile("(?<!\\d)(\\d{1,2})/(\\d{1,2})(?!\\d)");
    private static final Pattern DATE_DOT = Pattern.compile("(?<!\\d)(\\d{1,2})\\.(\\d{1,2})(?!\\d)");
    private static final Pattern DATE_FULL = Pattern.compile("(\\d{4})[-./](\\d{1,2})[-./](\\d{1,2})");
    private static final Pattern TIME = Pattern.compile("(?<!\\d)(\\d{1,2}):(\\d{2})(?::\\d{2})?(?!\\d)");

    /** 이 단어들 뒤에 붙은 금액은 결제 금액이 아니다. */
    private static final List<String> AMOUNT_NOISE = List.of("누적", "잔액", "한도", "합계", "총액", "잔여", "사용가능");

    /** 가게 이름 뒤에 흔히 붙는 꼬리말. */
    private static final Pattern MERCHANT_TAIL = Pattern.compile(
            "(누적|잔액|한도|합계|총액|잔여|사용가능|할부|일시불|승인|정상승인|체크승인).*$");

    private static final List<String> CANCEL_WORDS = List.of("취소", "승인취소", "매입취소", "환불");

    private static final List<String> CARD_ISSUERS = List.of(
            "신한", "국민", "KB국민", "삼성", "현대", "롯데", "우리", "하나", "농협", "NH", "BC", "비씨",
            "카카오뱅크", "케이뱅크", "토스뱅크", "씨티", "전북", "광주", "수협", "새마을");

    /** 사람이 지운 흔적, 발신 표시 등 파싱에 방해되는 토큰. */
    private static final Pattern NOISE_TOKENS = Pattern.compile(
            "\\[Web발신\\]|\\[국외발신\\]|\\[국제발신\\]|\\(광고\\)|<Web발신>");

    public List<Parsed> parse(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        List<Parsed> results = new ArrayList<>();
        for (String block : splitBlocks(text)) {
            Parsed parsed = parseBlock(block);
            if (parsed != null) {
                results.add(parsed);
            }
        }
        return results;
    }

    /**
     * 붙여넣은 덩어리를 메시지 단위로 나눈다.
     *
     * <p>한 줄에 한 건씩 붙여넣는 경우와 여러 줄짜리 문자를 통째로 붙여넣는 경우를
     * 모두 받아야 하므로, 발신 표시와 빈 줄로 먼저 자른 뒤
     * 조각 안에 완결된 결제 줄이 여럿이면 줄 단위로 한 번 더 자른다.
     */
    List<String> splitBlocks(String text) {
        String normalized = NOISE_TOKENS.matcher(text).replaceAll("\n\n");
        List<String> blocks = new ArrayList<>();
        for (String chunk : normalized.split("\\n\\s*\\n")) {
            if (chunk.isBlank()) {
                continue;
            }
            List<String> lines = Arrays.stream(chunk.split("\\r?\\n"))
                    .map(String::trim)
                    .filter(line -> !line.isEmpty())
                    .toList();
            long completeLines = lines.stream().filter(this::looksComplete).count();
            if (completeLines >= 2) {
                lines.stream().filter(this::looksComplete).forEach(blocks::add);
            } else if (!lines.isEmpty()) {
                blocks.add(String.join("\n", lines));
            }
        }
        return blocks;
    }

    /** 한 줄만으로 결제 한 건이 되는가. 금액과 날짜가 같이 있으면 그렇게 본다. */
    private boolean looksComplete(String line) {
        return AMOUNT.matcher(line).find()
                && (DATE_SLASH.matcher(line).find() || DATE_DOT.matcher(line).find() || DATE_FULL.matcher(line).find());
    }

    private Parsed parseBlock(String block) {
        if (CANCEL_WORDS.stream().anyMatch(block::contains)) {
            return null;
        }
        BigDecimal amount = extractAmount(block);
        if (amount == null || amount.signum() <= 0) {
            return null;
        }
        LocalDate date = extractDate(block);
        String merchant = extractMerchant(block);
        String issuer = CARD_ISSUERS.stream().filter(block::contains).findFirst().orElse(null);
        return new Parsed(amount, date, merchant, issuer, block.replaceAll("\\s+", " ").trim());
    }

    BigDecimal extractAmount(String block) {
        Matcher matcher = AMOUNT.matcher(block);
        BigDecimal fallback = null;
        while (matcher.find()) {
            String head = block.substring(0, matcher.start());
            String noiseWindow = head.length() <= 8 ? head : head.substring(head.length() - 8);
            BigDecimal value = new BigDecimal(matcher.group(1).replace(",", ""));
            if (AMOUNT_NOISE.stream().anyMatch(noiseWindow::contains)) {
                continue;
            }
            return value;
        }
        matcher.reset();
        if (matcher.find()) {
            fallback = new BigDecimal(matcher.group(1).replace(",", ""));
        }
        return fallback;
    }

    LocalDate extractDate(String block) {
        Matcher full = DATE_FULL.matcher(block);
        if (full.find()) {
            return safeDate(
                    Integer.parseInt(full.group(1)),
                    Integer.parseInt(full.group(2)),
                    Integer.parseInt(full.group(3)));
        }
        Matcher slash = DATE_SLASH.matcher(block);
        if (slash.find()) {
            return monthDay(Integer.parseInt(slash.group(1)), Integer.parseInt(slash.group(2)));
        }
        Matcher dot = DATE_DOT.matcher(block);
        if (dot.find()) {
            return monthDay(Integer.parseInt(dot.group(1)), Integer.parseInt(dot.group(2)));
        }
        return LocalDate.now();
    }

    /**
     * 문자에는 보통 연도가 없다. 올해로 읽되 한참 미래가 되면 작년으로 되돌린다.
     *
     * <p>1월에 받은 12/28 문자는 작년 것이므로 되돌려야 한다. 반면 하루 이틀 앞선 날짜는
     * 기기 시계 차이일 뿐인데 그대로 되돌리면 1년을 통째로 틀리게 된다. 결제 문자가
     * 결제보다 먼저 오는 일은 없으므로, 며칠까지는 올해로 두고 그 너머만 작년으로 본다.
     */
    private static final int FUTURE_TOLERANCE_DAYS = 7;

    private LocalDate monthDay(int month, int day) {
        LocalDate today = LocalDate.now();
        LocalDate candidate = safeDate(today.getYear(), month, day);
        if (candidate == null) {
            return today;
        }
        return candidate.isAfter(today.plusDays(FUTURE_TOLERANCE_DAYS))
                ? candidate.minusYears(1)
                : candidate;
    }

    private LocalDate safeDate(int year, int month, int day) {
        try {
            return LocalDate.of(year, month, day);
        } catch (Exception ignored) {
            return null;
        }
    }

    String extractMerchant(String block) {
        String flattened = block.replaceAll("\\s+", " ").trim();
        Matcher time = TIME.matcher(flattened);
        String candidate = null;
        if (time.find()) {
            candidate = flattened.substring(time.end()).trim();
        }
        if (candidate == null || candidate.isBlank()) {
            String[] lines = block.split("\\r?\\n");
            for (int index = lines.length - 1; index >= 0; index--) {
                String line = lines[index].trim();
                if (!line.isEmpty() && !AMOUNT.matcher(line).find() && !looksComplete(line)) {
                    candidate = line;
                    break;
                }
            }
        }
        if (candidate == null || candidate.isBlank()) {
            return "";
        }
        candidate = MERCHANT_TAIL.matcher(candidate).replaceAll("").trim();
        candidate = candidate.replaceAll("[()\\[\\]<>]", " ").replaceAll("\\s+", " ").trim();
        candidate = candidate.replaceAll("^[-·,.]+", "").replaceAll("[-·,.]+$", "").trim();
        return candidate;
    }

    /** 파서가 돌려주는 원재료. 카테고리 추측과 중복 검사는 상위 서비스가 붙인다. */
    public record Parsed(
            BigDecimal amount,
            LocalDate date,
            String merchant,
            String issuer,
            String rawText
    ) {
    }
}
