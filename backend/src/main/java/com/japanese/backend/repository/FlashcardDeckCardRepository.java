package com.japanese.backend.repository;

import com.japanese.backend.entity.FlashcardDeckCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for the many-to-many relation between flashcard decks and cards.
 */
public interface FlashcardDeckCardRepository extends JpaRepository<FlashcardDeckCard, Long> {

    boolean existsByDeck_IdAndFlashcard_Id(Long deckId, Long flashcardId);

    Optional<FlashcardDeckCard> findByDeck_IdAndFlashcard_Id(Long deckId, Long flashcardId);

    List<FlashcardDeckCard> findByDeck_IdOrderByCardOrderAscIdAsc(Long deckId);

    List<FlashcardDeckCard> findByDeck_IdAndFlashcard_IdIn(Long deckId, List<Long> flashcardIds);

    Long countByDeck_Id(Long deckId);

    void deleteByDeck_IdAndFlashcard_Id(Long deckId, Long flashcardId);
}
