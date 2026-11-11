package com.stockflow.coach.retrieval;

import com.stockflow.coach.news.CoachNewsFinder;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 질문에 종목이 나오면, 답 아래에 그 종목의 최근 기사가 카드로 붙는다는 것을 모델에게 알린다.
 *
 * <p>기사 제목이나 내용은 일부러 주지 않는다. 주면 모델이 풀어 쓰면서 해석을 붙이거나 없는 내용을 지어낸다.
 * 기사는 화면이 원문 제목 그대로 보여 준다({@link CoachNewsFinder}).
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class StockNewsRetriever implements CoachContextRetriever {

    private final CoachNewsFinder newsFinder;

    @Override
    public List<CoachContextBlock> retrieve(String question) {
        return newsFinder.find(question)
                .map(news -> List.of(new CoachContextBlock("화면에 함께 표시되는 것", List.of(
                        news.stockName() + "의 최근 기사 " + news.items().size() + "건이 이 답 바로 아래에 카드로 표시됩니다(최신순, 제목과 언론사).",
                        "기사 내용은 여기에 없습니다. 기사 내용을 말하거나 좋은 소식인지 나쁜 소식인지 평가하지 마세요.",
                        "사거나 팔지, 오를지를 묻는 질문이면 그 판단은 대신할 수 없다고 먼저 말하세요.",
                        "어떤 질문이든 최근 소식을 아래에 모아 두었다고 한 문장으로 알려 주세요."))))
                .orElseGet(List::of);
    }
}
