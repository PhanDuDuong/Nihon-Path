package com.japanese.backend.controller;

import com.japanese.backend.dto.AdminUserRequest;
import com.japanese.backend.entity.Role;
import com.japanese.backend.entity.User;
import com.japanese.backend.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<User> getUsers() {
        return adminUserService.getUsers();
    }

    @GetMapping("/roles")
    public List<Role> getRoles() {
        return adminUserService.getRoles();
    }

    @PostMapping
    public User create(@RequestBody AdminUserRequest request) {
        return adminUserService.create(request);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody AdminUserRequest request) {
        return adminUserService.update(id, request);
    }

    @PutMapping("/{id}/status")
    public User setStatus(@PathVariable Long id, @RequestParam String status) {
        return adminUserService.setStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        adminUserService.delete(id);
        return "Đã xóa tài khoản";
    }
}
