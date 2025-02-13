package com.social.socialmedia.repository;
import com.social.socialmedia.model.UserInfo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<UserInfo, Integer> {
    Optional<UserInfo> findByUsername(String username);
    Optional<UserInfo> findByEmail(String email);
    @SuppressWarnings({ "null", "unchecked" })
    UserInfo save(UserInfo userInfo);
}
