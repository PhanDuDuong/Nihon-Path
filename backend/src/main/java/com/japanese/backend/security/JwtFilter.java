package com.japanese.backend.security;

import com.japanese.backend.entity.User;
import com.japanese.backend.repository.RoleRepository;
import com.japanese.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String email = jwtService.extractEmail(token);
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    userRepository.findByEmail(email).ifPresent(this::authenticate);
                }
            } catch (RuntimeException ignored) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(User user) {
        downgradeExpiredVip(user);
        String roleName = user.getRole() != null ? user.getRole().getName().toUpperCase() : "USER";
        String prefixedRoleName = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(
                        new SimpleGrantedAuthority(roleName),
                        new SimpleGrantedAuthority(prefixedRoleName)
                )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void downgradeExpiredVip(User user) {
        String roleName = user.getRole() != null ? user.getRole().getName().toUpperCase() : "USER";
        boolean expiredVip = roleName.contains("VIP")
                && (user.getVipExpiresAt() == null || !user.getVipExpiresAt().isAfter(LocalDateTime.now()));
        if (!expiredVip) {
            return;
        }
        roleRepository.findByNameIgnoreCase("USER").ifPresent(role -> {
            user.setRole(role);
            userRepository.save(user);
        });
    }
}
