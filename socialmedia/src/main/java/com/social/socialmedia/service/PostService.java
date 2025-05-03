package com.social.socialmedia.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.model.Comment;
import com.social.socialmedia.model.Like;
import com.social.socialmedia.repository.PostRepository;
import com.social.socialmedia.repository.UserRepository;
import com.social.socialmedia.repository.UserSettingRepository;
import com.social.socialmedia.repository.CommentRepository;
import com.social.socialmedia.repository.LikeRepository;

import java.nio.file.Path;

@Service
public class PostService {
    @Autowired
    private PostRepository postRepository;
    @Autowired
    private UserSettingRepository userSettingRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private LikeRepository likeRepository;

    public List<Post> getAllPosts() {
        List<Post> posts = postRepository.findAll();
        System.out.println("===== Posts fetched from database =====");
        
        if (posts == null || posts.isEmpty()) {
            System.out.println("⚠️ No posts found or list is empty!");
            return List.of();
        }
        
        // Process each post to ensure data is correctly loaded
        for (Post post : posts) {
            // Initialize comments
            if (post.getCommentList() != null) {
                post.setComments(new ArrayList<>(post.getCommentList()));
            } else {
                post.setComments(new ArrayList<>());
            }
            
            // Initialize likes count
            if (post.getLikeList() != null) {
                post.setLikes(post.getLikeList().size());
            } else {
                post.setLikes(0);
            }
            
            // Set username from user if available
            if (post.getUser() != null) {
                post.setUsername(post.getUser().getUsername());
            }
            
            // Convert media to Base64 if exists
            if (post.getMediaUrl() != null) {
                post.convertMediaUrlToBase64();
            }
        }
        
        System.out.println("Post count: " + posts.size());
        return posts;
    }
    
    public List<Post> getPostsByUserId(Long userId) {
        return postRepository.findByUserId(userId);
    }

    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    public Post savePost(Post post) {
        return postRepository.save(post);
    }

    public void deletePost(Long postId) {
        postRepository.deleteById(postId);
    }
    public List<Post> getPostsByUsername(String usernameOrEmail) {
        // First try to find user by email
        UserInfo user = null;
        try {
            Optional<UserInfo> userByEmail = userRepository.findByEmail(usernameOrEmail);
            if (userByEmail.isPresent()) {
                user = userByEmail.get();
                System.out.println("Found user by email: " + user.getUsername());
            } else {
                // If not found by email, try by username
                Optional<UserInfo> userByUsername = userRepository.findByUsername(usernameOrEmail);
                if (userByUsername.isPresent()) {
                    user = userByUsername.get();
                    System.out.println("Found user by username: " + user.getUsername());
                } else {
                    System.out.println("User not found by either email or username: " + usernameOrEmail);
                    return List.of();
                }
            }
        } catch (Exception e) {
            System.err.println("Error finding user: " + e.getMessage());
            return List.of();
        }

        // Now fetch posts by the user's username
        List<Post> posts;
        try {
            posts = postRepository.findByUserUsername(user.getUsername());
            System.out.println("Fetched " + posts.size() + " posts for user: " + user.getUsername());
        } catch (Exception e) {
            System.err.println("Error fetching posts: " + e.getMessage());
            return List.of();
        }

        if (posts.isEmpty()) {
            System.out.println("No posts found for user: " + usernameOrEmail);
            return List.of();
        }

        // Process each post to ensure data is correctly loaded
        for (Post post : posts) {
            try {
                System.out.println("Processing post ID: " + post.getId() + ", content: " + post.getContent());
                
                // Initialize comments
                if (post.getCommentList() != null) {
                    post.setComments(new ArrayList<>(post.getCommentList()));
                    System.out.println("  Comments: " + post.getCommentList().size());
                } else {
                    post.setComments(new ArrayList<>());
                    System.out.println("  No comments");
                }
                
                // Initialize likes count
                if (post.getLikeList() != null) {
                    post.setLikes(post.getLikeList().size());
                    System.out.println("  Likes: " + post.getLikeList().size());
                } else {
                    post.setLikes(0);
                    System.out.println("  No likes");
                }
                
                // Set username from user if available
                if (post.getUser() != null) {
                    post.setUsername(post.getUser().getUsername());
                    System.out.println("  Username: " + post.getUser().getUsername());
                } else {
                    System.out.println("  User is null!");
                }
                
                // Convert media to Base64 if exists
                if (post.getMediaUrl() != null) {
                    System.out.println("  Converting media for post ID: " + post.getId() + 
                                       ", media size: " + post.getMediaUrl().length + " bytes");
                    post.convertMediaUrlToBase64();
                    System.out.println("  Media URL base64 length: " + 
                                      (post.getMediaUrlBase64() != null ? post.getMediaUrlBase64().length() : 0));
                } else {
                    System.out.println("  No media");
                }
            } catch (Exception e) {
                System.err.println("Error processing post " + post.getId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("Returning " + posts.size() + " processed posts");
        return posts;
    }
    public Post createPostForUser(Post post, String username) {
        UserInfo user = userRepository.findByEmail(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));
        System.out.println("Found user: " + user.getUsername()); // Log thông tin người dùng
    
        post.setUser(user);
        Post savedPost = postRepository.save(post);
        System.out.println("Saved post: " + savedPost); // Log bài viết đã lưu
    
        return savedPost;
    }
    // Tạo bài viết với nội dung và file media (ảnh hoặc video)
    public Post createPostWithMedia(String content, MultipartFile file, String username) {
        UserInfo user = userRepository.findByEmail(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));
        System.out.println("Found user: " + user.getUsername());
    
        Post post = new Post();
        post.setContent(content);
        post.setUser(user);
    
        if (file != null && !file.isEmpty()) {
            try {
                if (file.getSize() > 10 * 1024 * 1024) {
                    throw new RuntimeException("File size exceeds the limit of 10MB");
                }
    
                // Lưu file tạm (nếu cần - không bắt buộc)
                String uploadsDir = "uploads/";
                Path uploadPath = Paths.get(uploadsDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                    System.out.println("Created uploads directory: " + uploadsDir);
                }
    
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath);
                System.out.println("Saved file to: " + filePath);
    
                byte[] fileBytes = file.getBytes();
                post.setMediaUrl(fileBytes); // Lưu binary vào DB
    
                String contentType = file.getContentType();
                if (contentType != null && (contentType.startsWith("image/") || contentType.startsWith("video/"))) {
                    post.setMediaType(contentType);
    
                    // Chuyển sang base64 và tạo data URL
                    String base64Encoded = Base64.getEncoder().encodeToString(fileBytes);
                    String base64Url = "data:" + contentType + ";base64," + base64Encoded;
                    post.setMediaUrlBase64(base64Url);
    
                    System.out.println("Generated base64 mediaUrl for post.");
                } else {
                    throw new RuntimeException("Unsupported media type: " + contentType);
                }
            } catch (IOException e) {
                System.err.println("Failed to upload file: " + e.getMessage());
                throw new RuntimeException("Failed to upload file", e);
            }
        }
    
        Post savedPost = postRepository.save(post);
        System.out.println("Saved post with media: " + savedPost);
    
        return savedPost;
    }
    
    // Lấy bài viết theo ID và chuyển đổi mediaUrl sang Base64
    public Optional<Post> getPostByIdWithMedia(Long postId) {
        return postRepository.findById(postId).map(post -> {
            System.out.println("Fetched post: " + post); // Log bài viết
    
            if (post.getMediaUrl() != null) {
                System.out.println("Converting mediaUrl to Base64 for post ID: " + post.getId());
                post.setMediaUrlBase64(Base64.getEncoder().encodeToString(post.getMediaUrl()));
                post.setMediaUrl(null); // Xóa dữ liệu nhị phân để tránh trả về
            }
    
            return post;
        });
    }

    public boolean toggleLike(Post post, UserInfo user) {
        Optional<Like> existingLike = likeRepository.findByPostAndUser(post, user);
        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            return false;
        } else {
            Like like = new Like();
            like.setPost(post);
            like.setUser(user);
            likeRepository.save(like);
            return true;
        }
    }

    public Comment addComment(Post post, UserInfo user, String content) {
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setPost(post);
        comment.setUser(user);
        return commentRepository.save(comment);
    }

    public List<Comment> getComments(Post post) {
        return commentRepository.findByPost(post);
    }
}
