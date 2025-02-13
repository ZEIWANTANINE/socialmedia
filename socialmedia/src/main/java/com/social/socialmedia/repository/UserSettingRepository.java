package com.social.socialmedia.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.socialmedia.model.UserSetting;

public interface UserSettingRepository extends JpaRepository<UserSetting, Long> {
    
}
