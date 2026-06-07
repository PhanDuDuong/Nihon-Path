package com.japanese.backend.service;

import com.japanese.backend.dto.LoginRequest;
import com.japanese.backend.dto.LoginResponse;
import com.japanese.backend.dto.RegisterRequest;
import com.japanese.backend.dto.ForgotPasswordRequest;
import com.japanese.backend.entity.Role;
import com.japanese.backend.entity.User;
import com.japanese.backend.repository.RoleRepository;
import com.japanese.backend.repository.UserRepository;
import com.japanese.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String register(RegisterRequest request) {
        validateRegister(request);

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        Role role = roleRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus("ACTIVE");
        user.setIsVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setRole(role);

        userRepository.save(user);

        return "Đăng ký thành công";
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.getEmail()) || !StringUtils.hasText(request.getPassword())) {
            throw new RuntimeException("Vui lòng nhập email và mật khẩu");
        }

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Sai email hoặc mật khẩu"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Sai email hoặc mật khẩu");
        }

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Tài khoản bị khóa");
        }

        String token = jwtService.generateToken(user.getEmail());
        String role = user.getRole() != null ? user.getRole().getName() : "USER";
        LoginResponse.UserSummary summary = new LoginResponse.UserSummary(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                role,
                user.getStatus(),
                user.getVipExpiresAt()
        );
        return new LoginResponse(token, summary);
    }

    public String logout() {
        return "Đăng xuất thành công";
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        if (request == null
                || !StringUtils.hasText(request.getEmail())
                || !StringUtils.hasText(request.getNewPassword())
                || !StringUtils.hasText(request.getConfirmPassword())) {
            throw new RuntimeException("Vui lòng nhập đầy đủ thông tin");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new RuntimeException("Email không đúng định dạng");
        }

        if (request.getNewPassword().length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận chưa khớp");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "Đặt lại mật khẩu thành công";
    }

    private void validateRegister(RegisterRequest request) {
        if (request == null
                || !StringUtils.hasText(request.getFullName())
                || !StringUtils.hasText(request.getEmail())
                || !StringUtils.hasText(request.getPassword())) {
            throw new RuntimeException("Vui lòng nhập đầy đủ thông tin");
        }

        if (!EMAIL_PATTERN.matcher(request.getEmail().trim()).matches()) {
            throw new RuntimeException("Email không đúng định dạng");
        }

        if (request.getPassword().length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự");
        }
    }
}
