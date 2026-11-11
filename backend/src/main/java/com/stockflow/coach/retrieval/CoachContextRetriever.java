package com.stockflow.coach.retrieval;

import java.util.List;

/**
 * 질문에 답하는 데 쓸 자료를 찾아 오는 자리.
 *
 * <p>코치는 "자료를 찾는다 → 자료와 질문을 모델에 준다 → 답을 검사한다" 순서로 움직인다.
 * 찾는 방법은 자료마다 다르다. 가계부 숫자는 DB 에서 정확히 꺼내고({@link MyNumbersRetriever}),
 * 나중에 금융 지식 글이나 공시가 생기면 뜻으로 찾는 검색기(벡터 검색)를 이 인터페이스로 하나 더 꽂는다.
 * 코치 쪽 코드는 그대로 둔다.
 *
 * <p>구현체는 개인을 알아볼 수 있는 글자(이름, 이메일, 계좌 이름, 가게 이름, 메모, 목표 이름)를
 * 돌려주면 안 된다. 여기서 나온 줄은 그대로 바깥 모델로 나간다.
 */
public interface CoachContextRetriever {

    /**
     * @param question 사용자의 질문. 지금 구현은 쓰지 않지만 뜻으로 찾는 검색기는 이것으로 찾는다.
     * @return 찾은 자료. 없으면 빈 목록.
     */
    List<CoachContextBlock> retrieve(String question);
}
