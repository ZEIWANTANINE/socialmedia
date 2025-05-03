package com.social.socialmedia.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.socialmedia.model.Like;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.repository.LikeRepository;

import java.util.HashMap;

@Service
public class LikeService {
    @Autowired
    private LikeRepository likeRepository;

    public List<Like> getAllLikes() {
        return likeRepository.findAll();
    }

    public List<Like> getLikesByUserId(Long userId) {
        return likeRepository.findByUserId(userId);
    }

    public List<Like> getLikesByPostId(Long postId) {
        return likeRepository.findByPostId(postId);
    }

    public Optional<Like> getLikeById(Long likeId) {
        return likeRepository.findById(likeId);
    }

    public Like saveLike(Like like) {
        return likeRepository.save(like);
    }

    public void deleteLike(Long likeId) {
        likeRepository.deleteById(likeId);
    }

    /**
     * Kiểm tra xem người dùng đã like bài viết chưa
     * @param post Bài viết cần kiểm tra
     * @param user Người dùng cần kiểm tra
     * @return true nếu người dùng đã like, false nếu chưa
     */
    public boolean hasLiked(Post post, UserInfo user) {
        return likeRepository.existsByPostAndUser(post, user);
    }

    /**
     * Thêm like cho bài viết
     * @param post Bài viết được like
     * @param user Người dùng thực hiện like
     * @return Đối tượng Like đã tạo
     */
    public Like addLike(Post post, UserInfo user) {
        // Kiểm tra xem đã like chưa
        if (hasLiked(post, user)) {
            throw new IllegalStateException("User has already liked this post");
        }

        Like like = new Like();
        like.setPost(post);
        like.setUser(user);
        like.setLiked(true);
        
        // Thêm like vào danh sách của post
        if (post.getLikeList() == null) {
            post.setLikeList(new ArrayList<>());
        }
        post.getLikeList().add(like);

        return likeRepository.save(like);
    }

    /**
     * Xóa like của bài viết
     * @param post Bài viết cần unlike
     * @param user Người dùng thực hiện unlike
     */
    public void removeLike(Post post, UserInfo user) {
        Optional<Like> likeOpt = likeRepository.findByPostAndUser(post, user);
        likeOpt.ifPresent(like -> {
            // Xóa khỏi danh sách của post nếu có
            if (post.getLikeList() != null) {
                post.getLikeList().remove(like);
            }
            likeRepository.delete(like);
        });
    }

    /**
     * Toggle like/unlike cho bài viết
     * @param post Bài viết cần toggle
     * @param user Người dùng thực hiện
     * @return Map chứa trạng thái like và số lượng like
     */
    public Map<String, Object> toggleLike(Post post, UserInfo user) {
        Map<String, Object> result = new HashMap<>();
        boolean liked;

        if (hasLiked(post, user)) {
            removeLike(post, user);
            liked = false;
        } else {
            addLike(post, user);
            liked = true;
        }

        long likeCount = likeRepository.countByPost(post);
        result.put("liked", liked);
        result.put("likeCount", likeCount);
        return result;
    }

    /**
     * Lấy số lượng like của bài viết
     * @param post Bài viết cần đếm like
     * @return Số lượng like
     */
    public long getLikeCount(Post post) {
        return likeRepository.countByPost(post);
    }

    /**
     * Lấy danh sách người đã like bài viết
     * @param post Bài viết cần lấy danh sách like
     * @return Danh sách Like
     */
    public List<Like> getLikesByPost(Post post) {
        return likeRepository.findByPostId(post.getId());
    }
}
