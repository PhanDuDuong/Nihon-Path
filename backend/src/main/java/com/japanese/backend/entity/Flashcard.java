package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Flashcard card data reused across decks. Vocabulary cards keep vocabularyId so
 * the service can reuse one card in many decks instead of duplicating content.
 */
@Entity
@Table(name = "the_ghi_nho")
@Getter
@Setter
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loai_the")
    private String cardType;

    @Column(name = "tu_vung_id")
    private Long vocabularyId;

    @Column(name = "chu_han_id")
    private Long kanjiId;

    @Column(name = "mat_truoc")
    private String frontText;

    @Column(name = "mat_sau")
    private String backText;

    @Column(name = "vi_du")
    private String exampleText;

    @Column(name = "dich_vi_du")
    private String exampleTranslation;

    @Column(name = "ghi_chu")
    private String noteText;

    @Column(name = "duong_dan_anh")
    private String imageUrl;

    @Column(name = "duong_dan_am_thanh")
    private String audioUrl;

    @Column(name = "nguoi_tao_id")
    private Long createdBy;

    @Column(name = "tao_luc")
    private LocalDateTime createdAt;

    @Column(name = "cap_nhat_luc")
    private LocalDateTime updatedAt;
}
