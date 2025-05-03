package com.social.socialmedia.controller;

import java.util.Optional;
import org.springframework.security.core.Authentication;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.service.PostService;
import com.social.socialmedia.service.LikeService;
import com.social.socialmedia.service.CommentService;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.UserInfoService;
import com.social.socialmedia.model.Comment;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;

@RestController
@RequestMapping("/posts")
@CrossOrigin(origins = "http://localhost:3000")
public class PostController {
    @Autowired
    private PostService postService;

    @Autowired
    private LikeService likeService;

    @Autowired
    private CommentService commentService;

    @Autowired
    private UserInfoService userInfoService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllPosts() {
        final UserInfo currentUser = getAuthenticatedUser();
        
        List<Post> posts = postService.getAllPosts();
        
        if (currentUser != null) {
            posts.forEach(post -> {
                boolean hasLiked = likeService.hasLiked(post, currentUser);
                post.setHasLiked(hasLiked);
            });
        }
        
        // Convert posts to simplified DTOs to avoid circular references
        List<Map<String, Object>> postsDto = posts.stream().map(post -> {
            Map<String, Object> postDto = new HashMap<>();
            postDto.put("id", post.getId());
            postDto.put("content", post.getContent());
            postDto.put("username", post.getUsername());
            postDto.put("createdAt", post.getCreatedAt());
            postDto.put("likes", post.getLikes());
            postDto.put("hasLiked", post.isHasLiked());
            postDto.put("mediaType", post.getMediaType());
            postDto.put("mediaUrlBase64", post.getMediaUrlBase64());
            
            // Convert comments to simplified DTOs
            List<Map<String, Object>> commentsDto = post.getComments().stream().map(comment -> {
                Map<String, Object> commentDto = new HashMap<>();
                commentDto.put("id", comment.getId());
                commentDto.put("content", comment.getContent());
                commentDto.put("createdAt", comment.getCreatedAt());
                
                // Include minimal user info for the comment
                Map<String, Object> userDto = new HashMap<>();
                userDto.put("username", comment.getUser().getUsername());
                commentDto.put("user", userDto);
                
                return commentDto;
            }).collect(Collectors.toList());
            
            postDto.put("comments", commentsDto);
            
            return postDto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(postsDto);
    }

    private UserInfo getAuthenticatedUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !authentication.getName().equals("anonymousUser")) {
                String username = authentication.getName();
                return userInfoService.findByEmail(username);
            }
        } catch (Exception e) {
            System.out.println("Error getting authentication: " + e.getMessage());
        }
        return null;
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        Optional<Post> postOpt = postService.getPostById(id);
        
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Post post = postOpt.get();
        
        // Apply same hasLiked logic
        final UserInfo currentUser = getAuthenticatedUser();
        if (currentUser != null) {
            boolean hasLiked = likeService.hasLiked(post, currentUser);
            post.setHasLiked(hasLiked);
        }
        
        // Convert to DTO to avoid circular references
        Map<String, Object> postDto = new HashMap<>();
        postDto.put("id", post.getId());
        postDto.put("content", post.getContent());
        postDto.put("username", post.getUsername());
        postDto.put("createdAt", post.getCreatedAt());
        postDto.put("likes", post.getLikes());
        postDto.put("hasLiked", post.isHasLiked());
        postDto.put("mediaType", post.getMediaType());
        postDto.put("mediaUrlBase64", post.getMediaUrlBase64());
        
        // Convert comments to simplified DTOs
        List<Map<String, Object>> commentsDto = post.getComments().stream().map(comment -> {
            Map<String, Object> commentDto = new HashMap<>();
            commentDto.put("id", comment.getId());
            commentDto.put("content", comment.getContent());
            commentDto.put("createdAt", comment.getCreatedAt());
            
            // Include minimal user info for the comment
            Map<String, Object> userDto = new HashMap<>();
            userDto.put("username", comment.getUser().getUsername());
            commentDto.put("user", userDto);
            
            return commentDto;
        }).collect(Collectors.toList());
        
        postDto.put("comments", commentsDto);
        
        return ResponseEntity.ok(postDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        Optional<Post> post = postService.getPostById(id);
        if (post.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UserInfo user = userInfoService.findByEmail(username);

        Post post = new Post();
        post.setContent(content);
        post.setUser(user);

        if (file != null && !file.isEmpty()) {
            post = postService.createPostWithMedia(content, file, username);
        } else {
            post = postService.createPostForUser(post, username);
        }

        // Convert to DTO to avoid circular references
        Map<String, Object> postDto = new HashMap<>();
        postDto.put("id", post.getId());
        postDto.put("content", post.getContent());
        postDto.put("username", post.getUsername());
        postDto.put("createdAt", post.getCreatedAt());
        postDto.put("likes", post.getLikes());
        postDto.put("hasLiked", post.isHasLiked());
        postDto.put("mediaType", post.getMediaType());
        postDto.put("mediaUrlBase64", post.getMediaUrlBase64());
        postDto.put("comments", new ArrayList<>());  // New post has no comments

        return ResponseEntity.ok(postDto);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UserInfo user = userInfoService.findByEmail(username);
        
        Optional<Post> postOpt = postService.getPostById(postId);
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Map<String, Object> result = likeService.toggleLike(postOpt.get(), user);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Map<String, Object>>> getPostsByUsername(@PathVariable String username) {
        final UserInfo currentUser = getAuthenticatedUser();
        
        List<Post> posts = postService.getPostsByUsername(username);
        
        // Process posts to set hasLiked property if user is authenticated
        if (currentUser != null) {
            posts.forEach(post -> {
                boolean hasLiked = likeService.hasLiked(post, currentUser);
                post.setHasLiked(hasLiked);
            });
        }
        
        // Convert posts to simplified DTOs to avoid circular references
        List<Map<String, Object>> postsDto = posts.stream().map(post -> {
            Map<String, Object> postDto = new HashMap<>();
            postDto.put("id", post.getId());
            postDto.put("content", post.getContent());
            postDto.put("username", post.getUsername());
            postDto.put("createdAt", post.getCreatedAt());
            postDto.put("likes", post.getLikes());
            postDto.put("hasLiked", post.isHasLiked());
            postDto.put("mediaType", post.getMediaType());
            postDto.put("mediaUrlBase64", post.getMediaUrlBase64());
            
            // Convert comments to simplified DTOs
            List<Map<String, Object>> commentsDto = post.getComments().stream().map(comment -> {
                Map<String, Object> commentDto = new HashMap<>();
                commentDto.put("id", comment.getId());
                commentDto.put("content", comment.getContent());
                commentDto.put("createdAt", comment.getCreatedAt());
                
                // Include minimal user info for the comment
                Map<String, Object> userDto = new HashMap<>();
                userDto.put("username", comment.getUser().getUsername());
                commentDto.put("user", userDto);
                
                return commentDto;
            }).collect(Collectors.toList());
            
            postDto.put("comments", commentsDto);
            
            return postDto;
        }).collect(Collectors.toList());
        
        System.out.println("Returning " + postsDto.size() + " posts DTO objects for user: " + username);
        return ResponseEntity.ok(postsDto);
    }
}
