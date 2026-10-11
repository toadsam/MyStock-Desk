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

}
