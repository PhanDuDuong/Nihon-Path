package com.japanese.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class PaymentDtos {
    private PaymentDtos() {
    }

    public record CreateVipPaymentRequest(String bankCode) {
    }

    public record VipPaymentResponse(
            String orderCode,
            String payUrl,
            Long amountVnd,
            Integer durationDays,
            LocalDateTime expiresAt
    ) {
    }

    public record VipStatusResponse(
            Boolean vipActive,
            LocalDateTime vipExpiresAt,
            Long priceVnd,
            Integer durationDays,
            List<PaymentOrderSummary> recentOrders
    ) {
    }

    public record PaymentOrderSummary(
            Long id,
            String orderCode,
            Long userId,
            String userEmail,
            String userFullName,
            Long amountVnd,
            String status,
            String provider,
            String bankCode,
            String vnpTransactionNo,
            String vnpResponseCode,
            String vnpTransactionStatus,
            LocalDateTime createdAt,
            LocalDateTime paidAt,
            LocalDateTime expiresAt
    ) {
    }

    public record AdminVipUserResponse(
            Long id,
            String fullName,
            String email,
            String role,
            String status,
            Boolean vipActive,
            LocalDateTime vipExpiresAt
    ) {
    }
}
