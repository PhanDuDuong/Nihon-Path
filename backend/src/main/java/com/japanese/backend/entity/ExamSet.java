package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import com.japanese.backend.entity.converter.ExamQuestionListConverter;
import com.japanese.backend.entity.converter.ExamSectionListConverter;

@Entity
@Table(name = "bo_de_thi")
@Getter
@Setter
public class ExamSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tieu_de")
    private String title;

    @Column(name = "mo_ta")
    private String description;

    @Column(name = "ma_de")
    private String examCode;

    @Column(name = "trang_thai")
    private String status;

    @Column(name = "thang")
    private Integer month;

    @Column(name = "nam")
    private Integer year;

    @Column(name = "the")
    private String tags;

    @Column(name = "thu_muc")
    private String folderSlug;

    @Column(name = "duong_dan_am_thanh")
    private String audioUrl;

    @Column(name = "cap_do_id")
    private Long levelId;

    @Column(name = "thoi_luong_phut")
    private Integer durationMinutes;

    @Column(name = "mo_tu_ngay")
    private String availableFrom;

    @Column(name = "cho_xem_dap_an")
    private Boolean allowAnswerReview;

    @Column(name = "cho_lam_lai")
    private Boolean allowRetake;

    @Column(name = "so_lan_lam_toi_da")
    private Integer maxAttempts;

    @Convert(converter = ExamSectionListConverter.class)
    @Column(name = "cau_truc_json", columnDefinition = "json")
    private List<ExamSection> sections;

    @Convert(converter = ExamQuestionListConverter.class)
    @Column(name = "cau_hoi_json", columnDefinition = "json")
    private List<ExamQuestion> questions;

    @Transient
    private Boolean vipOnly;

    @Transient
    private Boolean locked;

    @Transient
    private Integer displayOrder;
}
