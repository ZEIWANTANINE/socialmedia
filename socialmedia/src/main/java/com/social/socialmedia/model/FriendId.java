package com.social.socialmedia.model;
import java.util.Objects;

import jakarta.persistence.Embeddable;

@Embeddable
public class FriendId {
    private Long user1Id;
    private Long user2Id;
    
    // Các constructors
    public FriendId() {
        // Constructor mặc định cần thiết cho JPA
    }
    
    public FriendId(Long user1Id, Long user2Id) {
        this.user1Id = user1Id;
        this.user2Id = user2Id;
    }
    
    public Long getUser1Id() {
        return user1Id;
    }

    public void setUser1Id(Long user1Id) {
        this.user1Id = user1Id;
    }

    public Long getUser2Id() {
        return user2Id;
    }

    public void setUser2Id(Long user2Id) {
        this.user2Id = user2Id;
    }
    
    // Override equals() để so sánh hai đối tượng
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FriendId friendId = (FriendId) o;
        return Objects.equals(user1Id, friendId.user1Id) &&
               Objects.equals(user2Id, friendId.user2Id);
    }
 
    // Override hashCode() để đảm bảo hash nhất quán
    @Override
    public int hashCode() {
        return Objects.hash(user1Id, user2Id);
    }
    
    @Override
    public String toString() {
        return "FriendId{user1Id=" + user1Id + ", user2Id=" + user2Id + "}";
    }
}
