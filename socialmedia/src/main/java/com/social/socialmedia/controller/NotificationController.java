package com.social.socialmedia.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.socialmedia.model.Notification;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.NotificationService;
import com.social.socialmedia.service.UserInfoService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserInfoService userInfoService;

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/me")
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication authentication) {
        String email = authentication.getName();
        UserInfo user = userInfoService.findByEmail(email);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<Notification> notifications = notificationService.getNotificationsByUserId(user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/me/unread")
    public ResponseEntity<List<Notification>> getMyUnreadNotifications(Authentication authentication) {
        String email = authentication.getName();
        UserInfo user = userInfoService.findByEmail(email);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<Notification> notifications = notificationService.getUnreadNotifications(user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/me/count")
    public ResponseEntity<Long> getUnreadNotificationsCount(Authentication authentication) {
        String email = authentication.getName();
        UserInfo user = userInfoService.findByEmail(email);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        long count = notificationService.countUnreadNotifications(user.getId());
        return ResponseEntity.ok(count);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUserId(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/{notificationId}")
    public ResponseEntity<Notification> getNotificationById(@PathVariable Long notificationId) {
        Optional<Notification> notification = notificationService.getNotificationById(notificationId);
        return notification.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markNotificationAsRead(@PathVariable Long notificationId, Authentication authentication) {
        // Verify user owns this notification
        String email = authentication.getName();
        UserInfo user = userInfoService.findByEmail(email);
        
        Optional<Notification> notificationOpt = notificationService.getNotificationById(notificationId);
        if (notificationOpt.isPresent() && notificationOpt.get().getUser().getId().equals(user.getId())) {
            Notification readNotification = notificationService.markAsRead(notificationId);
            return ResponseEntity.ok(readNotification);
        }
        
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification, Authentication authentication) {
        String email = authentication.getName();
        UserInfo user = userInfoService.findByEmail(email);
        
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        notification.setUser(user);
        Notification savedNotification = notificationService.saveNotification(notification);
        return ResponseEntity.ok(savedNotification);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId, Authentication authentication) {
        // Verify user owns this notification
        String email = authentication.getName();
        UserInfo user = userInfoService.findByEmail(email);
        
        Optional<Notification> notificationOpt = notificationService.getNotificationById(notificationId);
        if (notificationOpt.isPresent() && notificationOpt.get().getUser().getId().equals(user.getId())) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.notFound().build();
    }
}
