package com.social.socialmedia.controller;

import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.socialmedia.model.UserSetting;
import com.social.socialmedia.service.UserSettingService;

@RestController
@RequestMapping("/auth/usersettings")
public class UserSettingController {
    @Autowired
    private UserSettingService userSettingService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserSetting> getUserSetting(@PathVariable Long userId) {
        Optional<UserSetting> userSetting = userSettingService.getUserSetting(userId);
        return userSetting.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<UserSetting> saveUserSetting(@RequestBody UserSetting userSetting) {
        UserSetting savedUserSetting = userSettingService.createUserSetting(userSetting);
        return ResponseEntity.ok(savedUserSetting);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUserSetting(@PathVariable Long userId) {
        userSettingService.deleteUserSetting(userId);
        return ResponseEntity.noContent().build();
    }
}
