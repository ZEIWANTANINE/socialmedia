package com.social.socialmedia.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "user_settings")
public class UserSetting {
    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id" ,referencedColumnName = "id")
    private UserInfo user;

    private Boolean isPrivate = false;
    private Boolean notificationsEnabled = true;
    private String theme = "light";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructor
    public UserSetting() {
        this.isPrivate = false;
        this.notificationsEnabled = true;
        this.theme = "light";
    }

    public UserSetting(UserInfo user) {
        this.user = user;
        this.userId = user.getId();
        this.isPrivate = false;
        this.notificationsEnabled = true;
        this.theme = "light";
    }

    // Getter & Setter
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public Boolean getIsPrivate() { return isPrivate; }
    public void setIsPrivate(Boolean isPrivate) { this.isPrivate = isPrivate; }

    public Boolean getNotificationsEnabled() { return notificationsEnabled; }
    public void setNotificationsEnabled(Boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
