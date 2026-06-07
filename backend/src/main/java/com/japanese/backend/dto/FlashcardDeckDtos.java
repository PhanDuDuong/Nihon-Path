package com.japanese.backend.dto;

import com.japanese.backend.entity.Flashcard;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTOs for deck list, deck detail, popup selectable state, and imports.
 */
public class FlashcardDeckDtos {

    public record DeckSummary(
            Long id,
            String title,
            String description,
            String coverColor,
            String sourceType,
            Boolean isSystem,
            Boolean isPublic,
            Long levelId,
            Long cardCount,
            LocalDateTime updatedAt
    ) {
    }

    public record DeckProgress(
            int totalCards,
            int learnedCards,
            int studiedCards,
            int completionPercent
    ) {
    }

    public record SelectableDeck(
            Long id,
            String title,
            String description,
            Boolean isPublic,
            Boolean selected,
            Long cardCount
    ) {
    }

    public record SelectableDeckResponse(
            Long vocabularyId,
            String vocabularyText,
            List<SelectableDeck> decks
    ) {
    }

    public record DeckDetail(
            DeckSummary deck,
            List<Flashcard> cards,
            DeckProgress progress
    ) {
    }

    public record ImportResult(
            Long deckId,
            int importedCount,
            int skippedCount,
            String message
    ) {
    }
}
