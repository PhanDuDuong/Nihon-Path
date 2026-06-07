package com.japanese.backend.dto;

import java.time.LocalDateTime;

public record LoginResponse(String token, UserSummary user) {
    public record UserSummary(Long id, String fullName, String email, String role, String status, LocalDateTime vipExpiresAt) {
    }
}
