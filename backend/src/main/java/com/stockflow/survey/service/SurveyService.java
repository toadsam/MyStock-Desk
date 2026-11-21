package com.stockflow.survey.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.global.exception.ForbiddenException;
import com.stockflow.global.exception.TooManyRequestsException;
import com.stockflow.member.repository.MemberRepository;
import com.stockflow.survey.dto.SurveySubmitRequest;
import com.stockflow.survey.dto.SurveySummaryDto;
import com.stockflow.survey.entity.SurveyResponse;
import com.stockflow.survey.repository.SurveyResponseRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SurveyService {

    private static final String USED = "USED";
    private static final int RECENT_COMMENTS = 50;
    private static final Pattern SEPARATOR = Pattern.compile(Pattern.quote(SurveyResponse.SEPARATOR));

    private final SurveyResponseRepository repository;
    private final SurveySubmitLimiter limiter;
    private final CurrentMemberProvider currentMemberProvider;
    private final MemberRepository memberRepository;
    private final Clock clock;
    private final int dailyLimit;
    private final Set<String> adminEmails;

    public SurveyService(
            SurveyResponseRepository repository,
            SurveySubmitLimiter limiter,
            CurrentMemberProvider currentMemberProvider,
            MemberRepository memberRepository,
            Clock clock,
            @Value("${stockflow.survey.daily-limit:500}") int dailyLimit,
            @Value("${stockflow.survey.admin-emails:}") String adminEmails
    ) {
        this.repository = repository;
        this.limiter = limiter;
        this.currentMemberProvider = currentMemberProvider;
        this.memberRepository = memberRepository;
        this.clock = clock;
        this.dailyLimit = dailyLimit;
        this.adminEmails = Arrays.stream(adminEmails.split(","))
                .map(email -> email.trim().toLowerCase(Locale.ROOT))
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    /** 설문 답 한 건을 받는다. 누가 보냈는지는 남기지 않는다. */
    @Transactional
    public void submit(SurveySubmitRequest request, String clientAddress) {
        limiter.acquire(clientAddress);
        // 주소를 바꿔 가며 쏟아부어도 표가 끝없이 커지지 않게, 하루에 받는 전체 건수에도 뚜껑을 둔다.
        LocalDateTime startOfToday = LocalDate.now(clock).atStartOfDay();
        if (repository.countByCreatedAtGreaterThanEqual(startOfToday) >= dailyLimit) {
            throw new TooManyRequestsException("오늘은 설문을 더 받을 수 없어요. 내일 다시 시도해 주세요.");
        }
        // 갈림길 반대쪽 질문의 답은 화면이 보내더라도 버린다. 써 보지 않은 사람의 만족도가 평균에 섞이면 안 된다.
        boolean used = USED.equals(request.path());
        repository.save(SurveyResponse.builder()
                .path(request.path())
                .satisfaction(used ? request.satisfaction() : null)
                .nps(used ? request.nps() : null)
                .best(used ? join(request.best()) : null)
                .pain(used ? join(request.pain()) : null)
                .whyNot(used ? null : join(request.whyNot()))
                .wouldHelp(used ? null : join(request.wouldHelp()))
                .situation(blankToNull(request.situation()))
                .invest(blankToNull(request.invest()))
                .spendChange(used ? blankToNull(request.spendChange()) : null)
                .comment(blankToNull(request.comment()))
                .createdAt(LocalDateTime.now(clock))
                .build());
    }

    /** 모인 답의 요약. {@code stockflow.survey.admin-emails} 에 적힌 계정만 볼 수 있다. */
    @Transactional(readOnly = true)
    public SurveySummaryDto summary() {
        requireAdmin();
        List<SurveyResponse> all = repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Integer> satisfactions = all.stream().map(SurveyResponse::getSatisfaction).filter(Objects::nonNull).toList();
        List<Integer> scores = all.stream().map(SurveyResponse::getNps).filter(Objects::nonNull).toList();
        long used = all.stream().filter(response -> USED.equals(response.getPath())).count();
        return new SurveySummaryDto(
                all.size(),
                used,
                all.size() - used,
                average(satisfactions),
                IntStream.rangeClosed(1, 5).mapToObj(score -> satisfactions.stream().filter(value -> value == score).count()).toList(),
                average(scores),
                npsScore(scores),
                tally(all, SurveyResponse::getBest),
                tally(all, SurveyResponse::getPain),
                tally(all, SurveyResponse::getWhyNot),
                tally(all, SurveyResponse::getWouldHelp),
                tally(all, SurveyResponse::getSituation),
                tally(all, SurveyResponse::getInvest),
                tally(all, SurveyResponse::getSpendChange),
                bySituation(all),
                all.stream()
                        .filter(response -> response.getComment() != null)
                        .limit(RECENT_COMMENTS)
                        .map(response -> new SurveySummaryDto.Comment(response.getPath(), response.getComment(), response.getCreatedAt()))
                        .toList()
        );
    }

    private void requireAdmin() {
        Long memberId = currentMemberProvider.currentMemberId();
        boolean admin = memberRepository.findById(memberId)
                .map(member -> member.getEmail() != null && adminEmails.contains(member.getEmail().trim().toLowerCase(Locale.ROOT)))
                .orElse(false);
        if (!admin) {
            throw new ForbiddenException("설문 결과는 관리자만 볼 수 있어요.");
        }
    }

    private static String join(List<String> choices) {
        if (choices == null || choices.isEmpty()) {
            return null;
        }
        return choices.stream().map(String::trim).distinct().collect(Collectors.joining(SurveyResponse.SEPARATOR));
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    private static Double average(List<Integer> values) {
        return values.isEmpty() ? null : Math.round(values.stream().mapToInt(Integer::intValue).average().orElse(0) * 10) / 10.0;
    }

    private static Integer npsScore(List<Integer> scores) {
        if (scores.isEmpty()) {
            return null;
        }
        long promoters = scores.stream().filter(score -> score >= 9).count();
        long detractors = scores.stream().filter(score -> score <= 6).count();
        return (int) Math.round((promoters - detractors) * 100.0 / scores.size());
    }

    /** 상황마다 만족도와 추천 지수를 따로 센다. "대학생만 보면 어떤가"를 보려고 둔다. */
    private static List<SurveySummaryDto.Segment> bySituation(List<SurveyResponse> all) {
        Map<String, List<SurveyResponse>> groups = all.stream()
                .filter(response -> response.getSituation() != null)
                .collect(Collectors.groupingBy(SurveyResponse::getSituation, LinkedHashMap::new, Collectors.toList()));
        return groups.entrySet().stream()
                .sorted(Comparator.comparingInt((Map.Entry<String, List<SurveyResponse>> entry) -> entry.getValue().size()).reversed())
                .map(entry -> {
                    List<SurveyResponse> group = entry.getValue();
                    List<Integer> satisfactions = group.stream().map(SurveyResponse::getSatisfaction).filter(Objects::nonNull).toList();
                    List<Integer> scores = group.stream().map(SurveyResponse::getNps).filter(Objects::nonNull).toList();
                    long used = group.stream().filter(response -> USED.equals(response.getPath())).count();
                    return new SurveySummaryDto.Segment(entry.getKey(), group.size(), used, average(satisfactions), npsScore(scores));
                })
                .toList();
    }

    private static List<SurveySummaryDto.Tally> tally(List<SurveyResponse> all, Function<SurveyResponse, String> column) {
        Map<String, Long> counts = all.stream()
                .map(column)
                .filter(Objects::nonNull)
                .flatMap(SEPARATOR::splitAsStream)
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .map(entry -> new SurveySummaryDto.Tally(entry.getKey(), entry.getValue()))
                .toList();
    }
}
