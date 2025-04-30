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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.service.PostService;

@RestController
@RequestMapping("/posts")
public class PostController {
    @Autowired
    private PostService postService;

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        
        // Debug log: kiểm tra từng phần tử trong danh sách posts
        System.out.println("=== Controller getAllPosts() ===");
        System.out.println("Posts size from service: " + posts.size());
        
        // Debug chi tiết từng phần tử
        for (int i = 0; i < Math.min(posts.size(), 5); i++) {
            Object item = posts.get(i);
            System.out.println("Item " + i + " class: " + item.getClass().getName());
            if (item instanceof Post) {
                Post post = (Post) item;
                System.out.println("  - ID: " + post.getId() + ", Content: " + post.getContent());
                System.out.println("  - Has mediaUrlBase64: " + (post.getMediaUrlBase64() != null));
                System.out.println("  - User: " + (post.getUser() != null ? post.getUser().getUsername() : "null"));
            } else {
                System.out.println("  - Not a Post: " + item);
            }
        }
        
        // Lọc bỏ các phần tử không phải Post
        List<Post> validPosts = posts.stream()
            .filter(p -> p != null && p instanceof Post)
            .collect(java.util.stream.Collectors.toList());
            
        System.out.println("Valid posts size: " + validPosts.size());
        
        return ResponseEntity.ok(validPosts);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getPostsByUserId(@PathVariable Long userId) {
        List<Post> posts = postService.getPostsByUserId(userId);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPostById(@PathVariable Long postId) {
        Optional<Post> post = postService.getPostById(postId);
        return post.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long postId) {
        postService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/me")
    public ResponseEntity<List<Post>> getMyPosts(Authentication authentication) {
        String username = authentication.getName(); // Get the username from the JWT token
        List<Post> posts = postService.getPostsByUsername(username);
        return ResponseEntity.ok(posts);
    }

    @PostMapping(consumes = {"multipart/form-data"})
public ResponseEntity<Post> createPost(
    @RequestParam("content") String content,
    @RequestParam(value = "file", required = false) MultipartFile file,
    Authentication authentication
) {
    String username = authentication.getName(); // Lấy username từ JWT token
    Post savedPost = postService.createPostWithMedia(content, file, username);
    return ResponseEntity.ok(savedPost);
}
}
