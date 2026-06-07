package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tu_vung")
@Getter
@Setter
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tu")
    private String word;

    @Column(name = "kanji")
    private String kanji;

    @Column(name = "cach_doc")
    private String reading;

    @Column(name = "nghia_vi")
    private String meaningVi;

    @Column(name = "nghia_en", columnDefinition = "TEXT")
    private String meaningEn;

    @Column(name = "loai_tu")
    private String wordType;

    @Column(name = "cap_do_id")
    private Long levelId;

    @Column(name = "ghi_chu_bai_hoc")
    private String lessonNote;

    @Column(name = "nguon")
    private String source;

    @Column(name = "ma_muc_nguon")
    private String sourceEntryId;

    @Column(name = "thong_dung")
    private Boolean isCommon;

    @Column(name = "the_uu_tien")
    private String priorityTags;

    @Column(name = "noi_dung_tim_kiem", columnDefinition = "TEXT")
    private String searchText;

    @Column(name = "tao_luc")
    private LocalDateTime createdAt;

    @Column(name = "cap_nhat_luc")
    private LocalDateTime updatedAt;

}
