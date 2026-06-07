package com.japanese.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    private String fullName;
    private String email;
    private String currentPassword;
    private String newPassword;
    private String confirmPassword;
}
