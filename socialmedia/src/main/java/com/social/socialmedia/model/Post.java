package com.social.socialmedia.model;

import java.time.LocalDateTime;
import java.util.Base64;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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
import lombok.Data;

@Data 
@Entity
@Table(name = "posts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private UserInfo user;

    @Column(nullable = false)
    private String content;

    @Lob
    @Column(name = "mediaUrl", columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] mediaUrl;
    
    private String mediaType;
    
    @Transient
    private String mediaUrlBase64;
    
    @Column(nullable = false)
    private String visibility = "public";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Transient
    private Long userId;
    
    @Transient
    private String username;
    
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }
    
    public String getUsername() {
        return user != null ? user.getUsername() : null;
    }
    
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
