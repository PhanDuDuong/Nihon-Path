package com.japanese.backend.dto;

public record AdminUserRequest(
        String fullName,
        String email,
        String password,
        Long roleId,
        String status,
        Boolean isVerified
) {
}
