package com.social.socialmedia.controller;

import com.social.socialmedia.entity.AuthRequest;
import com.social.socialmedia.entity.AuthResponse;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.model.UserSetting;
import com.social.socialmedia.service.JwtService;
import com.social.socialmedia.service.UserInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserInfoService service;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome this endpoint is not secure";
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody UserInfo userInfo) {
        try {
            String response = service.addUser(userInfo);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registration failed: " + e.getMessage());
        }
    }

    @GetMapping("/user/userProfile")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public String userProfile() {
        return "Welcome to User Profile";
    }

    @GetMapping("/admin/adminProfile")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public String adminProfile() {
        return "Welcome to Admin Profile";
    }

    @PostMapping("/generateToken")
    public String authenticateAndGetToken(@RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );
        if (authentication.isAuthenticated()) {
            return jwtService.generateToken(authRequest.getUsername(), service.findByEmail(authRequest.getUsername()).getRoles());
        } else {
            throw new UsernameNotFoundException("Invalid user request!");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@RequestBody AuthRequest authRequest) {
        // Tìm người dùng theo email (username)
        UserInfo user = service.findByEmail(authRequest.getUsername());
        System.out.println(user + "loi5443");
        
        // Kiểm tra người dùng có tồn tại không
        if (user == null) {
            throw new UsernameNotFoundException("User not found!");
        }

        // Kiểm tra mật khẩu có đúng không
        if (!service.checkPassword(authRequest.getPassword(), user.getPassword())) {
            throw new UsernameNotFoundException("Invalid password!");
        }

        // Nếu đúng, tạo JWT token
        String token = jwtService.generateToken(user.getEmail(), user.getRoles());
        System.out.println(token + "456");
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @GetMapping("/settings")
    public ResponseEntity<UserSetting> getUserSettings(@RequestParam String email) {
        UserInfo user = service.findByEmail(email);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user.getSettings());
    }
    
}
