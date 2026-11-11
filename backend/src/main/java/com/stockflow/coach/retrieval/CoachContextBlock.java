package com.stockflow.coach.retrieval;

import java.util.List;

/**
 * 코치에게 건네는 자료 한 묶음. 제목 하나와 "이름: 값" 꼴의 줄들이다.
 *
 * <p>줄에 들어가는 숫자는 전부 서버가 계산한 것이다. 모델은 이 숫자를 그대로 옮겨 쓸 뿐 계산하지 않는다.
 */
public record CoachContextBlock(String title, List<String> lines) {
}
