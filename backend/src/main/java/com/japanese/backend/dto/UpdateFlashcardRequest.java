package com.japanese.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request to edit a card inside a user-owned deck.
 */
public record UpdateFlashcardRequest(
        @NotNull(message = "deckId la bat buoc")
        Long deckId,

        @NotBlank(message = "Mat truoc flashcard la bat buoc")
        String frontText,

        @NotBlank(message = "Mat sau flashcard la bat buoc")
        String backText,

        String exampleText,
        String exampleTranslation,
        String noteText,
        String imageUrl,
        String audioUrl
) {
}
