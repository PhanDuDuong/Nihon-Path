package com.japanese.backend.controller;

import com.japanese.backend.dto.PaymentDtos.CreateVipPaymentRequest;
import com.japanese.backend.dto.PaymentDtos.VipPaymentResponse;
import com.japanese.backend.dto.PaymentDtos.VipStatusResponse;
import com.japanese.backend.service.VnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final VnpayPaymentService paymentService;

    @GetMapping("/vip/status")
    public VipStatusResponse getVipStatus(Principal principal) {
        return paymentService.getVipStatus(principal.getName());
    }

    @PostMapping("/vip/vnpay")
    public VipPaymentResponse createVipPayment(
            @RequestBody(required = false) CreateVipPaymentRequest request,
            Principal principal,
            HttpServletRequest servletRequest
    ) {
        return paymentService.createVipPayment(principal.getName(), request, clientIp(servletRequest));
    }

    @GetMapping("/vnpay/ipn")
    public Map<String, String> vnpayIpn(@RequestParam Map<String, String> params) {
        return paymentService.handleIpn(params);
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(paymentService.handleReturn(params)))
                .build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
