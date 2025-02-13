package com.social.socialmedia.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.social.socialmedia.model.DeletedMessage;
import com.social.socialmedia.repository.DeletedMessageRepository;

@Service
public class DeletedMessageService {
    @Autowired
    private DeletedMessageRepository deletedMessageRepository;

    public List<DeletedMessage> getAllDeletedMessages() {
        return deletedMessageRepository.findAll();
    }

    public List<DeletedMessage> getDeletedMessagesByUserId(Long userId) {
        return deletedMessageRepository.findByUserId(userId);
    }

    public List<DeletedMessage> getDeletedMessagesByMessageId(Long messageId) {
        return deletedMessageRepository.findByMessageId(messageId);
    }

    public Optional<DeletedMessage> getDeletedMessageById(Long deletedMessageId) {
        return deletedMessageRepository.findById(deletedMessageId);
    }

    public DeletedMessage saveDeletedMessage(DeletedMessage deletedMessage) {
        return deletedMessageRepository.save(deletedMessage);
    }

    public void deleteDeletedMessage(Long deletedMessageId) {
        deletedMessageRepository.deleteById(deletedMessageId);
    }
}
