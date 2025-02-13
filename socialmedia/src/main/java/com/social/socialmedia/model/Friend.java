package com.social.socialmedia.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "friends")
public class Friend {
    @EmbeddedId
    private FriendId id;

    @ManyToOne
    @MapsId("user1Id")
    @JoinColumn(name = "user1_id")
    private UserInfo user1;

    @ManyToOne
    @MapsId("user2Id")
    @JoinColumn(name = "user2_id")
    private UserInfo user2;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public FriendId getId() {
        return id;
    }

    public void setId(FriendId id) {
        this.id = id;
    }

    public UserInfo getUser1() {
        return user1;
    }

    public void setUser1(UserInfo user1) {
        this.user1 = user1;
    }

    public UserInfo getUser2() {
        return user2;
    }

    public void setUser2(UserInfo user2) {
        this.user2 = user2;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
