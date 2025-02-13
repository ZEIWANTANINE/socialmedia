package com.social.socialmedia.repository;

import com.social.socialmedia.model.DeletedMessage;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeletedMessageRepository extends JpaRepository<DeletedMessage, Long> {

    List<DeletedMessage> findByUserId(Long userId);
    List<DeletedMessage> findByMessageId(Long messageId);
}
