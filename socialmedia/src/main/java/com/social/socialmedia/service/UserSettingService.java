package com.social.socialmedia.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.social.socialmedia.model.UserSetting;
import com.social.socialmedia.repository.UserSettingRepository;

@Service
public class UserSettingService {
    @Autowired
    private UserSettingRepository userSettingRepository;
    public Optional<UserSetting> getUserSetting(Long userId) {
        return userSettingRepository.findByUserId(userId);
    }
    public UserSetting createUserSetting(UserSetting userSetting) {
        return userSettingRepository.save(userSetting);
    }
    public void deleteUserSetting(Long userId) {
        userSettingRepository.deleteById(userId);
    }
    // Thêm phương thức để lấy thông tin người dùng theo ID
    public Optional<UserSetting> getUserProfile(Long userId) {
        return userSettingRepository.findById(userId);
    }
}
