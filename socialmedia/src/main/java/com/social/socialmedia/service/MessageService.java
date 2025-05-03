package com.social.socialmedia.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.social.socialmedia.model.Message;
import com.social.socialmedia.repository.MessageRepository;

@Service
public class MessageService {
    @Autowired
    private MessageRepository messageRepository;

    public List<Message> getAllMessages() {
        return messageRepository.findAll();
    }

    public List<Message> getMessagesBySenderId(Long senderId) {
        return messageRepository.findBySenderId(senderId);
    }

    public List<Message> getMessagesByReceiverId(Long receiverId) {
        return messageRepository.findByReceiverId(receiverId);
    }
    
    /**
     * Get messages sent from a specific sender to a specific receiver
     */
    public List<Message> getMessagesBySenderIdAndReceiverId(Long senderId, Long receiverId) {
        return messageRepository.findBySenderIdAndReceiverId(senderId, receiverId);
    }
    
    /**
     * Get conversation between two users (messages in both directions)
     */
    public List<Message> getConversation(Long userId1, Long userId2) {
        List<Message> messagesFrom1To2 = messageRepository.findBySenderIdAndReceiverId(userId1, userId2);
        List<Message> messagesFrom2To1 = messageRepository.findBySenderIdAndReceiverId(userId2, userId1);
        
        messagesFrom1To2.addAll(messagesFrom2To1);
        
        // Sort by creation time (oldest first)
        messagesFrom1To2.sort((m1, m2) -> m1.getCreatedAt().compareTo(m2.getCreatedAt()));
        
        return messagesFrom1To2;
    }
    
    /**
     * Get unread messages for a specific user
     */
    public List<Message> getUnreadMessages(Long receiverId) {
        return messageRepository.findByReceiverIdAndIsRead(receiverId, false);
    }

    public Optional<Message> getMessageById(Long messageId) {
        return messageRepository.findById(messageId);
    }

    public Message saveMessage(Message message) {
        return messageRepository.save(message);
    }

    public void deleteMessage(Long messageId) {
        messageRepository.deleteById(messageId);
    }
}
