package com.social.socialmedia.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.social.socialmedia.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message,Long> {
    List<Message> findBySenderId(Long senderId);
    List<Message> findByReceiverId(Long receiverId);
    
    /**
     * Find messages from a specific sender to a specific receiver
     */
    @Query("SELECT m FROM Message m WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findBySenderIdAndReceiverId(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
    
    /**
     * Find unread messages for a receiver
     */
    List<Message> findByReceiverIdAndIsRead(Long receiverId, boolean isRead);
    
    /**
     * Count unread messages for a receiver
     */
    long countByReceiverIdAndIsRead(Long receiverId, boolean isRead);
    
    /**
     * Find most recent message between two users
     */
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :user1Id AND m.receiver.id = :user2Id) OR (m.sender.id = :user2Id AND m.receiver.id = :user1Id) ORDER BY m.createdAt DESC")
    List<Message> findMostRecentBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
}
