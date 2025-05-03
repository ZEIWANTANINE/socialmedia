package com.social.socialmedia.controller;

import com.social.socialmedia.model.Comment;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.CommentService;
import com.social.socialmedia.service.PostService;
import com.social.socialmedia.service.UserInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/posts/{postId}/comments")
@CrossOrigin(origins = "http://localhost:3000")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private PostService postService;

    @Autowired
    private UserInfoService userInfoService;

    @PostMapping
    public ResponseEntity<?> addComment(
            @PathVariable Long postId,
            @RequestBody String content,
            Authentication authentication) {
        
        UserInfo user = userInfoService.findByEmail(authentication.getName());
        Optional<Post> postOpt = postService.getPostById(postId);
        
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Comment comment = commentService.addComment(postOpt.get(), user, content);
        return ResponseEntity.ok(comment);
    }

    @GetMapping
    public ResponseEntity<?> getComments(@PathVariable Long postId) {
        Optional<Post> postOpt = postService.getPostById(postId);
        
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        List<Comment> comments = commentService.getCommentsByPost(postOpt.get());
        return ResponseEntity.ok(comments);
    }
} 