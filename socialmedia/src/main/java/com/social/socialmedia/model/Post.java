package com.social.socialmedia.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
    
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Comment> commentList = new ArrayList<>();
    
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Like> likeList = new ArrayList<>();
    
    @Transient
    private Long userId;
    
    @Transient
    private String username;
    
    @Transient
    private int likes;
    
    @Transient
    private List<Comment> comments;
    
    @Transient
    private boolean hasLiked;
    
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
        if (this.mediaUrl != null && this.mediaType != null) {
            try {
                String base64Encoded = Base64.getEncoder().encodeToString(this.mediaUrl);
                // Ensure the URL starts with the data: prefix
                if (!base64Encoded.startsWith("data:")) {
                    this.mediaUrlBase64 = "data:" + this.mediaType + ";base64," + base64Encoded;
                } else {
                    this.mediaUrlBase64 = base64Encoded;
                }
                System.out.println("Successfully converted media to base64 for post " + this.id + 
                              " (length: " + (this.mediaUrlBase64 != null ? this.mediaUrlBase64.length() : 0) + ")");
            } catch (Exception e) {
                System.err.println("Error converting media to base64 for post " + this.id + ": " + e.getMessage());
            }
        } else if (this.mediaUrl != null) {
            // Handle case where mediaType is null but mediaUrl exists
            try {
                String base64Encoded = Base64.getEncoder().encodeToString(this.mediaUrl);
                this.mediaUrlBase64 = "data:image/jpeg;base64," + base64Encoded; // Default to JPEG
                System.out.println("Converted media with unknown type to base64 for post " + this.id);
            } catch (Exception e) {
                System.err.println("Error converting media to base64 for post " + this.id + ": " + e.getMessage());
            }
        }
    }

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public boolean isHasLiked() {
        return hasLiked;
    }

    public void setHasLiked(boolean hasLiked) {
        this.hasLiked = hasLiked;
    }

    public List<Comment> getCommentList() {
        return commentList;
    }

    public void setCommentList(List<Comment> commentList) {
        this.commentList = commentList;
    }

    public List<Like> getLikeList() {
        return likeList;
    }

    public void setLikeList(List<Like> likeList) {
        this.likeList = likeList;
    }
}
