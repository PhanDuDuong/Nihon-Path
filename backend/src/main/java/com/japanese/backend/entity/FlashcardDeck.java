package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Flashcard deck container. System preset decks have userId=null and isSystem=true,
 * while user-created decks belong to the logged-in user.
 */
@Entity
@Table(name = "bo_the_ghi_nho")
@Getter
@Setter
public class FlashcardDeck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nguoi_dung_id")
    private Long userId;

    @Column(name = "tieu_de")
    private String title;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String description;

    @Column(name = "mau_bia")
    private String coverColor;

    @Column(name = "loai_nguon")
    private String sourceType;

    @Column(name = "la_he_thong")
    private Boolean isSystem;

    @Column(name = "cong_khai")
    private Boolean isPublic;

    @Column(name = "cap_do_id")
    private Long levelId;

    @Column(name = "tao_luc")
    private LocalDateTime createdAt;

    @Column(name = "cap_nhat_luc")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FlashcardDeckCard> deckCards;
}
