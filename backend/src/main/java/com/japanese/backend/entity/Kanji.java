package com.japanese.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chu_han")
@Getter
@Setter
public class Kanji {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ky_tu")
    private String kanjiChar;

    @Column(name = "nghia_vi", columnDefinition = "TEXT")
    private String meaningVi;

    @Column(name = "am_han_viet")
    private String hanVietReading;

    @Column(name = "nghia_en", columnDefinition = "TEXT")
    private String meaningEn;

    @Column(name = "onyomi")
    private String onyomi;

    @Column(name = "kunyomi")
    private String kunyomi;

    @Column(name = "so_net")
    private Integer strokeCount;

    @Column(name = "bo_thu")
    private String radical;

    @Column(name = "nguon")
    private String source;

    @Column(name = "ma_muc_nguon")
    private String sourceEntryId;

    @Column(name = "nanori")
    private String nanori;

    @Column(name = "jlpt_cu")
    private String jlptLegacy;

    @Column(name = "du_lieu_net_but", columnDefinition = "TEXT")
    private String penStrokes;

    @Column(name = "duong_dan_gif_net")
    private String strokeGifUrl;

    @Column(name = "nguon_gif_net")
    private String strokeGifSource;

    @Column(name = "chat_luong_gif_net")
    private String strokeGifQuality;

    @Column(name = "hinh_dang", columnDefinition = "TEXT")
    private String shape;

    @Column(name = "ma_unicode")
    private String unicodeCodepoint;

    @Column(name = "lop_hoc")
    private Integer grade;

    @Column(name = "cap_do_id")
    private Long levelId;

    @Column(name = "tao_luc")
    private LocalDateTime createdAt;

    @Column(name = "cap_nhat_luc")
    private LocalDateTime updatedAt;
}
