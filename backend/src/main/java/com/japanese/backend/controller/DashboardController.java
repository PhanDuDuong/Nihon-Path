package com.japanese.backend.controller;

import com.japanese.backend.service.DashboardService;
import com.japanese.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    @GetMapping
    public Map<String, Object> getDashboard(Principal principal) {
        Long userId = userService.getUserIdByEmail(principal.getName());
        return dashboardService.getDashboard(userId);
    }
}
