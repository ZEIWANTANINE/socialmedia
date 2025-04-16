package com.social.socialmedia.model;

import java.time.LocalDateTime;
import java.util.Base64;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserInfo user;

    @Column(nullable = false)
    private String content;

    @Lob
    @Column(name = "mediaUrl", columnDefinition = "LONGBLOB")
    private byte[] mediaUrl;
    private String mediaType;
    @Transient
    private String mediaUrlBase64;
    @Column(nullable = false)
    private String visibility = "public";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public byte[] getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(byte[] mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getMediaUrlBase64() {
        return mediaUrlBase64;
    }

    public void setMediaUrlBase64(String mediaUrlBase64) {
        this.mediaUrlBase64 = mediaUrlBase64;
    }
    public void convertMediaUrlToBase64() {
        if (this.mediaUrl != null) {
            this.mediaUrlBase64 = Base64.getEncoder().encodeToString(this.mediaUrl);
        }
    }
}
