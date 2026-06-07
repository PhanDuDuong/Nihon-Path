package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "luot_lam_bai_tap")
@Getter
@Setter
public class ExerciseAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nguoi_dung_id")
    private Long userId;

    @Column(name = "bo_bai_tap_id")
    private Long exerciseSetId;

    @Column(name = "diem")
    private Double score;

    @Column(name = "so_cau_dung")
    private Integer correctCount;

    @Column(name = "so_cau_sai")
    private Integer wrongCount;

    @Column(name = "dap_an_json", columnDefinition = "json")
    private String answersJson;

    @Column(name = "nop_luc")
    private LocalDateTime submittedAt;
}
