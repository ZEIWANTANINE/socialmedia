package com.social.socialmedia.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.social.socialmedia.model.FriendRequest;
import com.social.socialmedia.model.UserInfo;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByReceiverId(Long receiverId);
    List<FriendRequest> findBySenderId(Long senderId);
    List<FriendRequest> findByReceiverIdAndStatus(Long receiverId, String status);
    List<FriendRequest> findBySenderIdAndStatus(Long senderId, String status);
}
