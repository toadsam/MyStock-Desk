package com.stockflow.notification.repository;

import com.stockflow.notification.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<Notification> findByMemberIdAndCategoryOrderByCreatedAtDesc(Long memberId, String category);

    List<Notification> findByMemberIdAndReadTrue(Long memberId);

    long countByMemberIdAndReadFalse(Long memberId);
}
