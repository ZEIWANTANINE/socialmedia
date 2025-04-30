package com.social.socialmedia.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.social.socialmedia.model.Notification;
import com.social.socialmedia.model.UserInfo;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(UserInfo user);
    List<Notification> findByUserAndIsReadOrderByCreatedAtDesc(UserInfo user, boolean isRead);
    long countByUserAndIsRead(UserInfo user, boolean isRead);
}
