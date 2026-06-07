package com.japanese.backend.dto;

import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String status,
        Boolean isVerified,
        LocalDateTime vipExpiresAt,
        String token
) {
}
