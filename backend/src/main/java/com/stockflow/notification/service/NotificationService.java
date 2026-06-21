package com.stockflow.notification.service;

import com.stockflow.auth.security.CurrentMemberProvider;
import com.stockflow.notification.dto.NotificationDto;
import com.stockflow.notification.dto.NotificationSummaryDto;
import com.stockflow.notification.entity.Notification;
import com.stockflow.notification.repository.NotificationRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentMemberProvider currentMemberProvider;

    public NotificationSummaryDto getNotifications(String category) {
        Long memberId = currentMemberProvider.currentMemberId();
        ensureDemoNotifications(memberId);
        List<Notification> notifications = category == null || category.isBlank() || "전체".equals(category)
                ? notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId)
                : notificationRepository.findByMemberIdAndCategoryOrderByCreatedAtDesc(memberId, category);
        return new NotificationSummaryDto(
                notificationRepository.countByMemberIdAndReadFalse(memberId),
                notifications.stream().map(NotificationDto::from).toList()
        );
    }

    @Transactional
    public NotificationDto markRead(Long id) {
        Notification notification = findOwned(id);
        notification.markRead();
        return NotificationDto.from(notification);
    }

    @Transactional
    public void markAllRead() {
        Long memberId = currentMemberProvider.currentMemberId();
        ensureDemoNotifications(memberId);
        notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId)
                .forEach(Notification::markRead);
    }

    @Transactional
    public void delete(Long id) {
        notificationRepository.delete(findOwned(id));
    }

    @Transactional
    public void deleteRead() {
        Long memberId = currentMemberProvider.currentMemberId();
        notificationRepository.deleteAll(notificationRepository.findByMemberIdAndReadTrue(memberId));
    }

    private Notification findOwned(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getMemberId().equals(currentMemberProvider.currentMemberId())) {
            throw new IllegalArgumentException("접근할 수 없는 알림입니다.");
        }
        return notification;
    }

    private void ensureDemoNotifications(Long memberId) {
        if (!notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId).isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        notificationRepository.saveAll(List.of(
                demo(memberId, "목표", "목표 달성률 업데이트", "\"다음 달까지 100만원 모으기\" 목표가 63% 달성되었어요.", "/goals", "green", now.minusMinutes(10)),
                demo(memberId, "소비", "소비 경고", "이번 달 카페/간식 지출이 지난 달보다 32% 증가했어요.", "/spending/detail", "orange", now.minusHours(1)),
                demo(memberId, "투자", "포트폴리오 변동", "국내 주식 비중이 2.3% 감소했어요. 현재 배분을 확인해보세요.", "/portfolio/allocation", "blue", now.minusHours(3)),
                demo(memberId, "AI 코치", "AI 코치 추천", "현금 비중을 10% 높이면 변동성 리스크를 줄일 수 있어요.", "/coach", "violet", now.minusDays(1)),
                demo(memberId, "이벤트", "관심 종목 리포트 알림", "삼성전자 리포트가 업데이트 되었어요.", "/company/005930", "yellow", now.minusDays(1).minusHours(9))
        ));
    }

    private Notification demo(Long memberId, String category, String title, String body, String targetPath, String tone, LocalDateTime createdAt) {
        return Notification.builder()
                .memberId(memberId)
                .category(category)
                .title(title)
                .body(body)
                .targetPath(targetPath)
                .tone(tone)
                .read(false)
                .createdAt(createdAt)
                .build();
    }
}
