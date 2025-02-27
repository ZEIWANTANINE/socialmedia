package com.social.socialmedia.service;

import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.model.UserSetting;
import com.social.socialmedia.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserInfoService implements UserDetailsService {

    private final UserRepository repository;
    private final PasswordEncoder encoder;

    public UserInfoService(@Lazy UserRepository repository, @Lazy PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<UserInfo> userDetail = repository.findByEmail(username); // Assuming 'email' is used as username

        // Converting UserInfo to UserDetails
        return userDetail.map(UserInfoDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public String addUser(UserInfo userInfo) {
        // Encode password before saving the user
        userInfo.setPassword(encoder.encode(userInfo.getPassword()));
        // Set default role if not provided
        if (userInfo.getRoles() == null || userInfo.getRoles().isEmpty()) {
            userInfo.setRoles("ROLE_USER");
        }
        UserSetting userSetting = new UserSetting(userInfo);
        userInfo.setSettings(userSetting);
        repository.save(userInfo);
        return "User Added Successfully";
    }
    public UserInfo findByEmail(String email) {
        return repository.findByEmail(email).orElse(null);
    }
    
    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return encoder.matches(rawPassword, encodedPassword);
    }
    
}