package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Per-user memory state for a single flashcard. Deck-level progress is tracked
 * separately from deck metadata.
 */
@Entity
@Table(name = "tien_do_the_ghi_nho")
@Getter
@Setter
public class FlashcardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nguoi_dung_id")
    private Long userId;

    @Column(name = "the_ghi_nho_id")
    private Long flashcardId;

    @Column(name = "trang_thai_nho")
    private String memoryStatus;

    @Column(name = "so_lan_on")
    private Integer reviewCount;

    @Column(name = "on_lan_cuoi_luc")
    private LocalDateTime lastReviewedAt;

    @Column(name = "on_lan_tiep_luc")
    private LocalDateTime nextReviewAt;
}
