package com.social.socialmedia.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "notifications")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserInfo user;
    
    @Column(nullable = false)
    private String type;
    
    @Column(nullable = false)
    private String message;
    
    private String link;
    
    @Column(nullable = false)
    private boolean isRead = false;
    
    private Long relatedUserId;
    
    private Long relatedEntityId;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Constructor không tham số cho JPA
    public Notification() {}
    
    // Constructor cho thông báo kết bạn
    public Notification(UserInfo user, String type, String message, String link, Long relatedUserId, Long relatedEntityId) {
        this.user = user;
        this.type = type;
        this.message = message;
        this.link = link;
        this.relatedUserId = relatedUserId;
        this.relatedEntityId = relatedEntityId;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }
}
