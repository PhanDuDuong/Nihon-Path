package com.japanese.backend.controller;

import com.japanese.backend.dto.PaymentDtos.AdminVipUserResponse;
import com.japanese.backend.dto.PaymentDtos.PaymentOrderSummary;
import com.japanese.backend.service.VnpayPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/vip")
@RequiredArgsConstructor
public class AdminVipController {

    private final VnpayPaymentService paymentService;

    @GetMapping("/users")
    public List<AdminVipUserResponse> getVipUsers() {
        return paymentService.getVipUsers();
    }

    @GetMapping("/orders")
    public List<PaymentOrderSummary> getOrders() {
        return paymentService.getRecentOrders();
    }

    @PostMapping("/users/{userId}/extend")
    public AdminVipUserResponse extendVip(@PathVariable Long userId, @RequestParam(defaultValue = "30") Integer days) {
        return paymentService.extendVip(userId, days);
    }

    @PostMapping("/users/{userId}/cancel")
    public AdminVipUserResponse cancelVip(@PathVariable Long userId) {
        return paymentService.cancelVip(userId);
    }
}
