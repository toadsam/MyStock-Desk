package com.stockflow.coach.retrieval;

import com.stockflow.asset.dto.AssetSummaryDto;
import com.stockflow.dashboard.dto.MyWaveDashboardDto;
import com.stockflow.dashboard.dto.TodayDto;
import com.stockflow.dashboard.service.MyWaveDashboardService;
import com.stockflow.dashboard.service.TodayService;
import com.stockflow.expense.dto.ExpenseCategorySummaryDto;
import com.stockflow.expense.dto.ExpenseMonthlySummaryDto;
import com.stockflow.global.format.Formats;
import com.stockflow.goal.dto.GoalSummaryDto;
import com.stockflow.goal.dto.SavingGoalDto;
import com.stockflow.portfolio.dto.PortfolioDto;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 로그인한 사람의 가계부 숫자를 자료로 꺼낸다.
 *
 * <p>화면이 보여 주는 것과 같은 서비스(홈의 "오늘", 대시보드)에서 가져온다.
 * 그래야 코치가 말하는 숫자와 화면의 숫자가 어긋나지 않는다.
 *
 * <p>일부러 넣지 않는 것: 이름, 이메일, 계좌 이름, 금융기관, 가게 이름, 메모, 목표 이름, 종목 이름.
 * 금액과 항목 이름(식비, 카페 같은 분류)만 나간다.
 */
@Component
@RequiredArgsConstructor
public class MyNumbersRetriever implements CoachContextRetriever {

    /** 항목은 큰 것부터 여기까지만. 자잘한 항목까지 다 주면 답이 길어지고 비용만 는다. */
    private static final int MAX_CATEGORIES = 8;
    private static final int MAX_CATEGORY_NAME = 12;

    private final MyWaveDashboardService dashboardService;
    private final TodayService todayService;

    @Override
    public List<CoachContextBlock> retrieve(String question) {
        TodayDto today = todayService.today();
        MyWaveDashboardDto dashboard = dashboardService.dashboard(null);

        List<CoachContextBlock> blocks = new ArrayList<>();
        blocks.add(todayBlock(today));
        blocks.add(spendingBlock(dashboard.expenseSummary()));
        blocks.add(assetBlock(dashboard.assetSummary()));
        blocks.add(goalBlock(dashboard.goalSummary()));
        CoachContextBlock investment = investmentBlock(dashboard.portfolio());
        if (investment != null) {
            blocks.add(investment);
        }
        return blocks;
    }

    private CoachContextBlock todayBlock(TodayDto today) {
        List<String> lines = new ArrayList<>();
        lines.add("오늘 날짜: " + today.date());
        lines.add("이번 달 남은 날(오늘 포함): " + today.daysLeftInMonth() + "일");
        if (today.budgetSet()) {
            lines.add("이번 달 생활비 예산: " + Formats.won(today.monthlyLivingBudget()));
            lines.add("이번 달 남은 생활비: " + Formats.won(today.remainingLivingBudget()));
            lines.add("오늘 하루 예산: " + Formats.won(today.dailyBudget()));
            lines.add("오늘 더 써도 되는 돈: " + Formats.won(today.remainingToday()));
            if (positive(today.overToday())) {
                lines.add("오늘 예산을 넘긴 금액: " + Formats.won(today.overToday()));
            }
        } else {
            lines.add("이번 달 생활비 예산: 아직 정하지 않음");
        }
        lines.add("오늘 쓴 돈: " + Formats.won(today.spentToday()));
        return new CoachContextBlock("오늘과 이번 달 생활비", lines);
    }

    private CoachContextBlock spendingBlock(ExpenseMonthlySummaryDto spending) {
        List<String> lines = new ArrayList<>();
        if (spending == null || !positive(spending.totalAmount())) {
            lines.add("이번 달 소비 기록: 없음");
            return new CoachContextBlock("이번 달 소비", lines);
        }
        lines.add("이번 달 총 소비: " + Formats.won(spending.totalAmount()));
        lines.add("하루 평균 소비: " + Formats.won(spending.dailyAverageAmount()));
        if (positive(spending.previousMonthAmount())) {
            lines.add("지난달 같은 날까지의 소비: " + Formats.won(spending.previousMonthAmount()));
            if (spending.changeRate() != null) {
                lines.add("지난달 같은 날 대비 변화: " + Formats.rate(spending.changeRate()));
            }
        }
        List<ExpenseCategorySummaryDto> categories = spending.categories() == null ? List.of() : spending.categories();
        categories.stream().limit(MAX_CATEGORIES).forEach(category -> lines.add(
                "항목 " + categoryName(category.category()) + ": " + Formats.won(category.amount())
                        + " (" + category.count() + "건, 전체의 " + Formats.rate(category.ratio()) + ")"));
        return new CoachContextBlock("이번 달 소비", lines);
    }

    private CoachContextBlock assetBlock(AssetSummaryDto asset) {
        List<String> lines = new ArrayList<>();
        if (asset == null) {
            lines.add("자산 기록: 없음");
            return new CoachContextBlock("자산", lines);
        }
        lines.add("총자산: " + Formats.won(asset.totalAsset()));
        lines.add("계좌 잔액 합계: " + Formats.won(asset.accountBalance()));
        lines.add("투자 자산: " + Formats.won(asset.investmentAsset()));
        if (positive(asset.monthlyIncome())) {
            lines.add("이번 달 수입(예산에 적은 금액): " + Formats.won(asset.monthlyIncome()));
            lines.add("저축률(수입 중 저축 계획): " + Formats.rate(asset.savingRate()));
        }
        lines.add("이번 달 투자 계획에서 남은 금액: " + Formats.won(asset.investmentAvailableAmount()));
        return new CoachContextBlock("자산", lines);
    }

    private CoachContextBlock goalBlock(GoalSummaryDto goals) {
        List<String> lines = new ArrayList<>();
        SavingGoalDto main = goals == null ? null : goals.mainGoal();
        if (goals == null || goals.activeGoalCount() == 0 || main == null) {
            lines.add("진행 중인 목표: 없음");
            return new CoachContextBlock("목표", lines);
        }
        lines.add("진행 중인 목표 수: " + goals.activeGoalCount() + "개");
        lines.add("주요 목표의 목표 금액: " + Formats.won(main.targetAmount()));
        lines.add("주요 목표에 모은 금액: " + Formats.won(main.currentAmount()));
        lines.add("주요 목표까지 남은 금액: " + Formats.won(main.remainingAmount()));
        lines.add("주요 목표 달성률: " + Formats.rate(main.progressRate()));
        if (main.targetDate() != null) {
            lines.add("주요 목표일: " + main.targetDate());
        }
        if (main.remainingDays() != null) {
            lines.add("주요 목표일까지 남은 날: " + main.remainingDays() + "일");
        }
        if (positive(main.dailyRequiredAmount())) {
            lines.add("주요 목표를 위해 하루에 모아야 하는 돈: " + Formats.won(main.dailyRequiredAmount()));
        }
        return new CoachContextBlock("목표", lines);
    }

    /** 투자 기록이 없으면 묶음 자체를 주지 않는다. 0원짜리 줄은 "투자를 하고 있다"는 인상을 준다. */
    private CoachContextBlock investmentBlock(PortfolioDto portfolio) {
        if (portfolio == null || !positive(portfolio.totalEvaluationAmount())) {
            return null;
        }
        List<String> lines = new ArrayList<>();
        lines.add("투자 평가 금액: " + Formats.won(portfolio.totalEvaluationAmount()));
        lines.add("투자 원금: " + Formats.won(portfolio.totalPurchaseAmount()));
        lines.add("누적 수익률: " + Formats.rate(portfolio.totalReturnRate()));
        return new CoachContextBlock("투자(기록된 숫자만, 조언 금지)", lines);
    }

    /**
     * 항목 이름은 보통 정해진 분류지만 API 로는 아무 글자나 들어올 수 있다.
     * 줄바꿈, 기호, 숫자를 걷어 내고 길이를 자른다. 자료 줄 안에 지시문이나 전화번호 같은 것을 심지 못하게 한다.
     */
    private String categoryName(String raw) {
        String cleaned = raw == null ? "" : raw.replaceAll("[^A-Za-z가-힣 ]", "").trim();
        if (cleaned.isEmpty()) {
            return "기타";
        }
        return cleaned.length() > MAX_CATEGORY_NAME ? cleaned.substring(0, MAX_CATEGORY_NAME) : cleaned;
    }

    private boolean positive(BigDecimal value) {
        return value != null && value.signum() > 0;
    }
}
