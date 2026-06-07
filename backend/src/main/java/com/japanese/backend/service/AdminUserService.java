package com.japanese.backend.service;

import com.japanese.backend.dto.AdminUserRequest;
import com.japanese.backend.entity.Role;
import com.japanese.backend.entity.User;
import com.japanese.backend.repository.RoleRepository;
import com.japanese.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "LOCKED");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public List<Role> getRoles() {
        return roleRepository.findAll();
    }

    public User create(AdminUserRequest request) {
        User user = new User();
        apply(user, request, true);
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public User update(Long id, AdminUserRequest request) {
        User user = getUser(id);
        apply(user, request, false);
        return userRepository.save(user);
    }

    public User setStatus(Long id, String status) {
        User user = getUser(id);
        user.setStatus(normalizeStatus(status));
        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
    }

    private void apply(User user, AdminUserRequest request, boolean requirePassword) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Du lieu tai khoan khong hop le");
        }
        if (!StringUtils.hasText(request.fullName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten nguoi dung la bat buoc");
        }
        user.setFullName(request.fullName().trim());

        if (!StringUtils.hasText(request.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email la bat buoc");
        }
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email khong hop le");
        }
        userRepository.findByEmail(email)
                .filter(existing -> user.getId() == null || !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email da ton tai");
                });
        user.setEmail(email);

        if (StringUtils.hasText(request.password())) {
            if (request.password().length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mat khau phai co it nhat 6 ky tu");
            }
            user.setPassword(passwordEncoder.encode(request.password()));
        } else if (requirePassword) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mat khau la bat buoc khi tao tai khoan");
        }
        if (request.roleId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quyen la bat buoc");
        }
        user.setRole(roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong tim thay quyen")));
        user.setStatus(normalizeStatus(request.status()));
        user.setIsVerified(request.isVerified() == null ? true : request.isVerified());
    }

    private String normalizeStatus(String status) {
        String normalized = StringUtils.hasText(status) ? status.trim().toUpperCase(Locale.ROOT) : "ACTIVE";
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trang thai tai khoan khong hop le");
        }
        return normalized;
    }
}
