package com.social.socialmedia.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.multipart.MultipartFile;
import com.social.socialmedia.model.Post;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.model.UserSetting;
import com.social.socialmedia.repository.PostRepository;
import com.social.socialmedia.repository.UserRepository;
import com.social.socialmedia.repository.UserSettingRepository;

import java.nio.file.Path;

@Service
public class PostService {
    @Autowired
    private PostRepository postRepository;
    @Autowired
    private UserSettingRepository userSettingRepository;
    @Autowired
    private UserRepository userRepository;

    public List<Post> getAllPosts() {
        return postRepository.findAll().stream()
            .peek(post -> {
                if (post.getMediaUrl() != null) {
                    post.convertMediaUrlToBase64(); // Chuyển đổi mediaUrl sang Base64
                    post.setMediaUrl(null); // Xóa dữ liệu nhị phân để tránh trả về
                }
            })
            .collect(Collectors.toList());
    }

    public List<Post> getPostsByUserId(Long userId) {
        return postRepository.findByUserId(userId);
    }

    public Optional<Post> getPostById(Long postId) {
        return postRepository.findById(postId);
    }

    public Post savePost(Post post) {
        return postRepository.save(post);
    }

    public void deletePost(Long postId) {
        postRepository.deleteById(postId);
    }
    public List<Post> getPostsByUsername(String username) {
        UserInfo user = userRepository.findByEmail(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));
        System.out.println("Found user: " + user.getUsername()); // Log thông tin người dùng
    
        List<Post> posts = postRepository.findByUserUsername(user.getUsername());
        System.out.println("Fetched posts for user: " + posts); // Log danh sách bài viết
    
        return posts.stream()
            .peek(post -> {
                if (post.getMediaUrl() != null) {
                    System.out.println("Converting mediaUrl to Base64 for post ID: " + post.getId());
                    post.setMediaUrlBase64(Base64.getEncoder().encodeToString(post.getMediaUrl()));
                    post.setMediaUrl(null); // Xóa dữ liệu nhị phân để tránh trả về
                }
            })
            .collect(Collectors.toList());
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
        System.out.println("Found user: " + user.getUsername()); // Log thông tin người dùng
    
        Post post = new Post();
        post.setContent(content);
        post.setUser(user);
    
        if (file != null && !file.isEmpty()) {
            try {
                // Kiểm tra kích thước file (giới hạn 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new RuntimeException("File size exceeds the limit of 10MB");
            }
                String uploadsDir = "uploads/";
                Path uploadPath = Paths.get(uploadsDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                    System.out.println("Created uploads directory: " + uploadsDir); // Log tạo thư mục
                }
    
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath);
                System.out.println("Saved file to: " + filePath); // Log đường dẫn file
    
                post.setMediaUrl(file.getBytes());
                String contentType = file.getContentType();
                if (contentType != null) {
                    if (contentType.startsWith("image/")) {
                        post.setMediaType("image");
                    } else if (contentType.startsWith("video/")) {
                        post.setMediaType("video");
                    } else {
                        throw new RuntimeException("Unsupported media type: " + contentType);
                    }
                    System.out.println("Media type: " + post.getMediaType()); // Log loại media
                }
            } catch (IOException e) {
                System.err.println("Failed to upload file: " + e.getMessage()); // Log lỗi
                throw new RuntimeException("Failed to upload file", e);
            }
        }
    
        Post savedPost = postRepository.save(post);
        System.out.println("Saved post with media: " + savedPost); // Log bài viết đã lưu
    
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
}
