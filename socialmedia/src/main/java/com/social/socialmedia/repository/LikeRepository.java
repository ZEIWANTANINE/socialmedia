package com.social.socialmedia.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.social.socialmedia.model.Like;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.model.UserInfo;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    List<Like> findByUserId(Long userId);
    List<Like> findByPostId(Long postId);
    Optional<Like> findByPostAndUser(Post post, UserInfo user);
    boolean existsByPostAndUser(Post post, UserInfo user);
    long countByPost(Post post);
}
