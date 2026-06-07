package com.japanese.backend.repository;

import com.japanese.backend.entity.FlashcardDeck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for finding system and user-owned flashcard decks.
 */
public interface FlashcardDeckRepository extends JpaRepository<FlashcardDeck, Long> {

    List<FlashcardDeck> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<FlashcardDeck> findByUserIdAndTitleContainingIgnoreCaseOrderByUpdatedAtDesc(Long userId, String title);

    Optional<FlashcardDeck> findFirstByUserIdAndSourceTypeOrderByUpdatedAtDesc(Long userId, String sourceType);

    Optional<FlashcardDeck> findFirstByUserIdAndTitleIgnoreCaseOrderByUpdatedAtDesc(Long userId, String title);

    List<FlashcardDeck> findByIsSystemTrueOrderByUpdatedAtDesc();

    List<FlashcardDeck> findByIsSystemTrueAndTitleContainingIgnoreCaseOrderByUpdatedAtDesc(String title);

    List<FlashcardDeck> findByIsPublicTrueOrderByUpdatedAtDesc();
}
