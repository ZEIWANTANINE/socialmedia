package com.social.socialmedia.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.social.socialmedia.model.Message;

public interface MessageRepository extends JpaRepository<Message,Long> {
    List<Message> findBySenderId(Long senderId);
    List<Message> findByReceiverId(Long receiverId);
}
