package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Join table between decks and flashcards. The unique DB constraint prevents the
 * same card from appearing twice in the same deck.
 */
@Entity
@Table(name = "chi_tiet_bo_the")
@Getter
@Setter
public class FlashcardDeckCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "bo_the_id")
    private FlashcardDeck deck;

    @ManyToOne
    @JoinColumn(name = "the_ghi_nho_id")
    private Flashcard flashcard;

    @Column(name = "thu_tu")
    private Integer cardOrder;

    @Column(name = "nguoi_them_id")
    private Long addedBy;

    @Column(name = "them_luc")
    private LocalDateTime addedAt;
}
