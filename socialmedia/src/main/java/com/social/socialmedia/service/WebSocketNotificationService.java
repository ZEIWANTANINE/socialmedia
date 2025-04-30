package com.social.socialmedia.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.social.socialmedia.model.Notification;
import com.social.socialmedia.model.UserInfo;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private NotificationService notificationService;

    /**
     * Gửi thông báo qua WebSocket đến người dùng cụ thể
     * 
     * @param user Người dùng nhận thông báo
     * @param notification Nội dung thông báo
     */
    public void sendPrivateNotification(UserInfo user, Notification notification) {
        // Lưu thông báo vào database
        Notification savedNotification = notificationService.saveNotification(notification);
        
        // Gửi thông báo qua WebSocket
        // Destination: /user/USERNAME/queue/notifications
        messagingTemplate.convertAndSendToUser(
            user.getEmail(), // Dùng email làm username vì email là duy nhất và được dùng cho đăng nhập
            "/queue/notifications",
            buildNotificationPayload(savedNotification)
        );
    }

    /**
     * Gửi thông báo cho nhiều người dùng (ví dụ: thông báo nhóm)
     * 
     * @param users Danh sách người dùng nhận thông báo
     * @param notificationContent Nội dung thông báo
     */
    public void sendBulkNotifications(Iterable<UserInfo> users, String type, String message, String link, Long relatedUserId, Long relatedEntityId) {
        for (UserInfo user : users) {
            Notification notification = new Notification(user, type, message, link, relatedUserId, relatedEntityId);
            sendPrivateNotification(user, notification);
        }
    }

    /**
     * Gửi thông báo kết bạn
     * 
     * @param sender Người gửi lời mời kết bạn
     * @param receiver Người nhận lời mời kết bạn
     * @param requestId ID của lời mời kết bạn
     */
    public void sendFriendRequestNotification(UserInfo sender, UserInfo receiver, Long requestId) {
        String message = sender.getUsername() + " đã gửi cho bạn lời mời kết bạn";
        String link = "/friend/requests";
        
        Notification notification = new Notification(
            receiver,
            "FRIEND_REQUEST",
            message,
            link,
            sender.getId(),
            requestId
        );
        
        sendPrivateNotification(receiver, notification);
    }
    
    /**
     * Gửi thông báo chấp nhận kết bạn
     */
    public void sendFriendRequestAcceptedNotification(UserInfo receiver, UserInfo sender, Long requestId) {
        String message = receiver.getUsername() + " đã chấp nhận lời mời kết bạn của bạn";
        String link = "/friend";
        
        Notification notification = new Notification(
            sender,
            "FRIEND_REQUEST_ACCEPTED",
            message,
            link,
            receiver.getId(),
            requestId
        );
        
        sendPrivateNotification(sender, notification);
    }

    /**
     * Tạo payload cho thông báo
     */
    private Map<String, Object> buildNotificationPayload(Notification notification) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", notification.getId());
        payload.put("type", notification.getType());
        payload.put("message", notification.getMessage());
        payload.put("link", notification.getLink());
        payload.put("isRead", notification.isRead());
        payload.put("createdAt", notification.getCreatedAt().toString());
        payload.put("relatedUserId", notification.getRelatedUserId());
        payload.put("relatedEntityId", notification.getRelatedEntityId());
        
        return payload;
    }
} 