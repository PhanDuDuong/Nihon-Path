package com.japanese.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.japanese.backend.dto.PaymentDtos.*;
import com.japanese.backend.entity.PaymentOrder;
import com.japanese.backend.entity.Role;
import com.japanese.backend.entity.User;
import com.japanese.backend.repository.PaymentOrderRepository;
import com.japanese.backend.repository.RoleRepository;
import com.japanese.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnpayPaymentService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final String PROVIDER = "VNPAY";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PAID = "PAID";
    private static final String STATUS_FAILED = "FAILED";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final ObjectMapper objectMapper;

    @Value("${vnpay.tmn-code:${VNPAY_TMN_CODE:}}")
    private String tmnCode;

    @Value("${vnpay.hash-secret:${VNPAY_HASH_SECRET:}}")
    private String hashSecret;

    @Value("${vnpay.pay-url:${VNPAY_PAY_URL:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}}")
    private String payUrl;

    @Value("${vnpay.return-url:${VNPAY_RETURN_URL:http://localhost:8080/api/payments/vnpay/return}}")
    private String returnUrl;

    @Value("${vnpay.frontend-result-url:${VNPAY_FRONTEND_RESULT_URL:http://localhost:5173/vip}}")
    private String frontendResultUrl;

    @Value("${vip.price-vnd:199000}")
    private Long vipPriceVnd;

    @Value("${vip.duration-days:30}")
    private Integer vipDurationDays;

    @Transactional
    public VipPaymentResponse createVipPayment(String email, CreateVipPaymentRequest request, String ipAddress) {
        ensureConfigured();
        User user = findUser(email);
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        LocalDateTime expiresAt = now.plusMinutes(15);

        PaymentOrder order = new PaymentOrder();
        order.setOrderCode("VIP" + System.currentTimeMillis() + user.getId());
        order.setUserId(user.getId());
        order.setProvider(PROVIDER);
        order.setAmountVnd(vipPriceVnd);
        order.setStatus(STATUS_PENDING);
        order.setBankCode(normalizeBankCode(request == null ? null : request.bankCode()));
        order.setCreatedAt(now);
        order.setExpiresAt(expiresAt);

        String url = buildPaymentUrl(order, user, ipAddress, expiresAt);
        order.setPayUrl(url);
        paymentOrderRepository.save(order);
        return new VipPaymentResponse(order.getOrderCode(), url, vipPriceVnd, vipDurationDays, expiresAt);
    }

    public VipStatusResponse getVipStatus(String email) {
        User user = findUser(email);
        downgradeIfExpired(user);
        List<PaymentOrderSummary> orders = paymentOrderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .limit(10)
                .map(order -> toOrderSummary(order, user))
                .toList();
        return new VipStatusResponse(isVipActive(user), user.getVipExpiresAt(), vipPriceVnd, vipDurationDays, orders);
    }

    @Transactional
    public Map<String, String> handleIpn(Map<String, String> params) {
        return handleVnpayCallback(params, true);
    }

    @Transactional
    public String handleReturn(Map<String, String> params) {
        Map<String, String> result = handleVnpayCallback(params, false);
        String orderCode = params.getOrDefault("vnp_TxnRef", "");
        String status = isSuccessfulVnpayPayment(params) ? "success" : "failed";
        return frontendResultUrl + "?payment=" + status + "&orderCode=" + encode(orderCode)
                + "&message=" + encode(result.getOrDefault("Message", ""));
    }

    @Transactional
    public List<AdminVipUserResponse> getVipUsers() {
        return userRepository.findAll().stream()
                .peek(this::downgradeIfExpired)
                .filter(user -> user.getVipExpiresAt() != null || roleName(user).contains("VIP"))
                .map(this::toAdminVipUser)
                .toList();
    }

    public List<PaymentOrderSummary> getRecentOrders() {
        Map<Long, User> users = new HashMap<>();
        return paymentOrderRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(order -> {
                    User user = users.computeIfAbsent(order.getUserId(), id -> userRepository.findById(id).orElse(null));
                    return toOrderSummary(order, user);
                })
                .toList();
    }

    @Transactional
    public AdminVipUserResponse extendVip(Long userId, Integer days) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        activateVip(user, days == null || days <= 0 ? vipDurationDays : days);
        return toAdminVipUser(user);
    }

    @Transactional
    public AdminVipUserResponse cancelVip(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        user.setVipExpiresAt(LocalDateTime.now(VIETNAM_ZONE));
        setRole(user, "USER");
        return toAdminVipUser(userRepository.save(user));
    }

    public boolean isVipActive(User user) {
        return user.getVipExpiresAt() != null && user.getVipExpiresAt().isAfter(LocalDateTime.now(VIETNAM_ZONE));
    }

    @Transactional
    public User downgradeIfExpired(User user) {
        if (user != null && roleName(user).contains("VIP") && !isVipActive(user)) {
            setRole(user, "USER");
            return userRepository.save(user);
        }
        return user;
    }

    private Map<String, String> handleVnpayCallback(Map<String, String> params, boolean ipn) {
        if (!verifySignature(params)) {
            return Map.of("RspCode", "97", "Message", "Invalid signature");
        }

        String orderCode = params.get("vnp_TxnRef");
        Optional<PaymentOrder> optionalOrder = paymentOrderRepository.findByOrderCode(orderCode);
        if (optionalOrder.isEmpty()) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        PaymentOrder order = optionalOrder.get();
        long paidAmount = parseLong(params.get("vnp_Amount")) / 100;
        if (!Objects.equals(order.getAmountVnd(), paidAmount)) {
            return Map.of("RspCode", "04", "Message", "Invalid amount");
        }

        if (STATUS_PAID.equals(order.getStatus())) {
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        order.setVnpResponseCode(responseCode);
        order.setVnpTransactionStatus(transactionStatus);
        order.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        order.setBankCode(params.getOrDefault("vnp_BankCode", order.getBankCode()));
        order.setRawResponse(toJson(params));

        if (isSuccessfulVnpayPayment(params)) {
            order.setStatus(STATUS_PAID);
            order.setPaidAt(LocalDateTime.now(VIETNAM_ZONE));
            paymentOrderRepository.save(order);
            User user = userRepository.findById(order.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
            activateVip(user, vipDurationDays);
            return Map.of("RspCode", "00", "Message", ipn ? "Confirm Success" : "Payment Success");
        }

        order.setStatus(STATUS_FAILED);
        paymentOrderRepository.save(order);
        return Map.of("RspCode", "00", "Message", ipn ? "Confirm Success" : "Payment Failed");
    }

    private boolean isSuccessfulVnpayPayment(Map<String, String> params) {
        return "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));
    }

    private void activateVip(User user, int days) {
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        LocalDateTime base = user.getVipExpiresAt() != null && user.getVipExpiresAt().isAfter(now)
                ? user.getVipExpiresAt()
                : now;
        user.setVipExpiresAt(base.plusDays(days));
        setRole(user, "VIP");
        userRepository.save(user);
    }

    private String buildPaymentUrl(PaymentOrder order, User user, String ipAddress, LocalDateTime expiresAt) {
        Map<String, String> data = new TreeMap<>();
        data.put("vnp_Version", "2.1.0");
        data.put("vnp_Command", "pay");
        data.put("vnp_TmnCode", tmnCode);
        data.put("vnp_Amount", String.valueOf(order.getAmountVnd() * 100));
        data.put("vnp_CurrCode", "VND");
        data.put("vnp_IpAddr", StringUtils.hasText(ipAddress) ? ipAddress : "127.0.0.1");
        data.put("vnp_Locale", "vn");
        data.put("vnp_OrderInfo", "Thanh toan VIP 30 ngay " + order.getOrderCode());
        data.put("vnp_OrderType", "other");
        data.put("vnp_ReturnUrl", returnUrl);
        data.put("vnp_TxnRef", order.getOrderCode());
        data.put("vnp_CreateDate", order.getCreatedAt().format(VNPAY_TIME));
        data.put("vnp_ExpireDate", expiresAt.format(VNPAY_TIME));
        if (StringUtils.hasText(order.getBankCode())) {
            data.put("vnp_BankCode", order.getBankCode());
        }
        if (StringUtils.hasText(user.getEmail())) {
            data.put("vnp_Bill_Email", user.getEmail());
        }

        String hashData = buildQuery(data);
        String query = hashData + "&vnp_SecureHash=" + hmacSha512(hashSecret, hashData);
        return payUrl + "?" + query;
    }

    private boolean verifySignature(Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        if (!StringUtils.hasText(secureHash)) {
            return false;
        }
        Map<String, String> data = new TreeMap<>();
        params.forEach((key, value) -> {
            if (key != null && key.startsWith("vnp_")
                    && !"vnp_SecureHash".equals(key)
                    && !"vnp_SecureHashType".equals(key)
                    && value != null) {
                data.put(key, value);
            }
        });
        String hashData = buildQuery(data);
        return secureHash.equalsIgnoreCase(hmacSha512(hashSecret, hashData));
    }

    private String buildQuery(Map<String, String> data) {
        List<String> parts = new ArrayList<>();
        data.forEach((key, value) -> parts.add(encode(key) + "=" + encode(value)));
        return String.join("&", parts);
    }

    private String hmacSha512(String secret, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            hmac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte item : bytes) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo chữ ký VNPAY");
        }
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(tmnCode) || !StringUtils.hasText(hashSecret)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình vnpay.tmn-code và vnpay.hash-secret trong D:/secrets/vnpay.properties"
            );
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập"));
    }

    private void setRole(User user, String roleName) {
        Role role = roleRepository.findByNameIgnoreCase(roleName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tìm thấy quyền " + roleName));
        user.setRole(role);
    }

    private String normalizeBankCode(String bankCode) {
        if (!StringUtils.hasText(bankCode) || "ALL".equalsIgnoreCase(bankCode)) {
            return null;
        }
        return bankCode.trim().toUpperCase(Locale.ROOT);
    }

    private AdminVipUserResponse toAdminVipUser(User user) {
        return new AdminVipUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                roleName(user),
                user.getStatus(),
                isVipActive(user),
                user.getVipExpiresAt()
        );
    }

    private PaymentOrderSummary toOrderSummary(PaymentOrder order, User user) {
        return new PaymentOrderSummary(
                order.getId(),
                order.getOrderCode(),
                order.getUserId(),
                user == null ? null : user.getEmail(),
                user == null ? null : user.getFullName(),
                order.getAmountVnd(),
                order.getStatus(),
                order.getProvider(),
                order.getBankCode(),
                order.getVnpTransactionNo(),
                order.getVnpResponseCode(),
                order.getVnpTransactionStatus(),
                order.getCreatedAt(),
                order.getPaidAt(),
                order.getExpiresAt()
        );
    }

    private String roleName(User user) {
        return user.getRole() == null ? "USER" : user.getRole().getName().toUpperCase(Locale.ROOT);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            return "{}";
        }
    }

    private long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (Exception exception) {
            return 0;
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
