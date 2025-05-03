package com.social.socialmedia.service;

import com.social.socialmedia.model.Comment;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList;

@Service
public class CommentService {
    @Autowired
    private CommentRepository commentRepository;

    public Comment addComment(Post post, UserInfo user, String content) {
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setPost(post);
        comment.setUser(user);
        
        // Thêm comment vào danh sách của post
        if (post.getCommentList() == null) {
            post.setCommentList(new ArrayList<>());
        }
        post.getCommentList().add(comment);
        
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByPost(Post post) {
        return commentRepository.findByPost(post);
    }

    public void deleteComment(Long commentId) {
        commentRepository.deleteById(commentId);
    }
} 