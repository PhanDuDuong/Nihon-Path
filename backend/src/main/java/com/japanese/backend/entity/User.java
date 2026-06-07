package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "nguoi_dung")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ho_ten")
    private String fullName;

    @Column(name = "email", unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "mat_khau")
    private String password;

    @Column(name = "trang_thai")
    private String status;

    @Column(name = "da_xac_thuc")
    private Boolean isVerified;

    @Column(name = "tao_luc")
    private LocalDateTime createdAt;

    @Column(name = "vip_het_han_luc")
    private LocalDateTime vipExpiresAt;

    @ManyToOne
    @JoinColumn(name = "vai_tro_id")
    private Role role;
}
