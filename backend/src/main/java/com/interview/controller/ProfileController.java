package com.interview.controller;

import com.interview.model.UserProfile;
import com.interview.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserProfileRepository profileRepository;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return profileRepository.findByUserId(userDetails.getUsername())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.ok(new UserProfile()));
    }

    @PostMapping
    public ResponseEntity<?> saveProfile(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody UserProfile profile
    ) {
        try {
            String username = userDetails.getUsername();
            UserProfile existing = profileRepository.findByUserId(username)
                .orElse(new UserProfile());
            existing.setUserId(username);
            existing.setDomain(profile.getDomain());
            existing.setSubDomain(profile.getSubDomain());
            existing.setExperienceLevel(profile.getExperienceLevel());
            existing.setSkills(profile.getSkills());
            existing.setTargetRole(profile.getTargetRole());
            existing.setPreferredLanguage(profile.getPreferredLanguage());
            existing.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(profileRepository.save(existing));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}