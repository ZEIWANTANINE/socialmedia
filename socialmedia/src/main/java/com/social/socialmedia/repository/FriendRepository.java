package com.social.socialmedia.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.socialmedia.model.Friend;
import com.social.socialmedia.model.FriendId;

public interface FriendRepository extends JpaRepository<Friend, FriendId> {
    List<Friend> findByUser1Id(Long user1Id);
    List<Friend> findByUser2Id(Long user2Id);
    
}
