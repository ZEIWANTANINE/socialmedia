package com.social.socialmedia.controller;

import java.util.List;
import java.util.Optional;


import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.socialmedia.model.DeletedMessage;
import com.social.socialmedia.service.DeletedMessageService;

@RestController
@RequestMapping("/api/deleted-messages")
public class DeletedMessageController {
    private final DeletedMessageService service;

    public DeletedMessageController(DeletedMessageService service) {
        this.service = service;
    }

    @GetMapping
    public List<DeletedMessage> getAllDeletedMessages() {
        return service.getAllDeletedMessages();
    }

    
    @PostMapping("/api/deletedmessages/save")
    public DeletedMessage saveDeletedMessage(@RequestBody DeletedMessage message) {
        return service.saveDeletedMessage(message);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DeletedMessage>> getDeletedMessagesByUserId(@PathVariable Long userId) {
        List<DeletedMessage> deletedMessages = service.getDeletedMessagesByUserId(userId);
        return ResponseEntity.ok(deletedMessages);
    }

    @GetMapping("/message/{messageId}")
    public ResponseEntity<List<DeletedMessage>> getDeletedMessagesByMessageId(@PathVariable Long messageId) {
        List<DeletedMessage> deletedMessages = service.getDeletedMessagesByMessageId(messageId);
        return ResponseEntity.ok(deletedMessages);
    }

    @GetMapping("/{deletedMessageId}")
    public ResponseEntity<DeletedMessage> getDeletedMessageById(@PathVariable Long deletedMessageId) {
        Optional<DeletedMessage> deletedMessage = service.getDeletedMessageById(deletedMessageId);
        return deletedMessage.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/api/deletedmessages")
    public ResponseEntity<DeletedMessage> createDeletedMessage(@RequestBody DeletedMessage deletedMessage, Authentication authentication) {
        // Assuming the username is stored in the JWT token
        String username = authentication.getName();
        // Set the user of the deleted message based on the authenticated user
        // You need to fetch the User entity based on the username
        // For example:
        // User user = userService.findByUsername(username);
        // deletedMessage.setUser(user);
        DeletedMessage savedDeletedMessage = service.saveDeletedMessage(deletedMessage);
        return ResponseEntity.ok(savedDeletedMessage);
    }

    @DeleteMapping("/{deletedMessageId}")
    public ResponseEntity<Void> deleteDeletedMessage(@PathVariable Long deletedMessageId) {
        service.deleteDeletedMessage(deletedMessageId);
        return ResponseEntity.noContent().build();
    }
}
