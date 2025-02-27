package com.social.socialmedia.controller;

import com.social.socialmedia.entity.AuthRequest;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.model.UserSetting;
import com.social.socialmedia.service.JwtService;
import com.social.socialmedia.service.UserInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
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
    public String registerUser(@RequestBody UserInfo userInfo) {
        return service.addUser(userInfo);
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
            return jwtService.generateToken(authRequest.getUsername());
        } else {
            throw new UsernameNotFoundException("Invalid user request!");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<String> loginUser(@RequestBody AuthRequest authRequest) {
        // Tìm người dùng theo email (username)
        UserInfo user = service.findByEmail(authRequest.getUsername());
        
        // Kiểm tra người dùng có tồn tại không
        if (user == null) {
            throw new UsernameNotFoundException("User not found!");
        }

        // Kiểm tra mật khẩu có đúng không
        if (!service.checkPassword(authRequest.getPassword(), user.getPassword())) {
            throw new UsernameNotFoundException("Invalid password!");
        }

        // Nếu đúng, tạo JWT token
        String token = jwtService.generateToken(authRequest.getUsername());
        return ResponseEntity.ok(token);
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
