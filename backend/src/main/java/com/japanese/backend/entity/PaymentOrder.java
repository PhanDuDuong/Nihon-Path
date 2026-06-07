package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "don_thanh_toan")
@Getter
@Setter
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_don", nullable = false, unique = true)
    private String orderCode;

    @Column(name = "nguoi_dung_id", nullable = false)
    private Long userId;

    @Column(name = "nha_cung_cap", nullable = false)
    private String provider;

    @Column(name = "so_tien_vnd", nullable = false)
    private Long amountVnd;

    @Column(name = "trang_thai", nullable = false)
    private String status;

    @Column(name = "ma_ngan_hang")
    private String bankCode;

    @Column(name = "ma_giao_dich_vnpay")
    private String vnpTransactionNo;

    @Column(name = "ma_phan_hoi_vnpay")
    private String vnpResponseCode;

    @Column(name = "trang_thai_giao_dich_vnpay")
    private String vnpTransactionStatus;

    @Column(name = "duong_dan_thanh_toan", columnDefinition = "TEXT")
    private String payUrl;

    @Column(name = "tao_luc", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "thanh_toan_luc")
    private LocalDateTime paidAt;

    @Column(name = "het_han_luc")
    private LocalDateTime expiresAt;

    @Column(name = "phan_hoi_goc", columnDefinition = "TEXT")
    private String rawResponse;
}
