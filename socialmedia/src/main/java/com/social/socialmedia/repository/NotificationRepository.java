package com.social.socialmedia.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.social.socialmedia.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findByUserId(Long userId);
}
