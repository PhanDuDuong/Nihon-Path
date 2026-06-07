package com.japanese.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request for bulk import from raw text. Each line should use front|back|example|translation|note.
 */
public record ImportTextFlashcardRequest(
        @NotNull(message = "deckId la bat buoc")
        Long deckId,

        @NotBlank(message = "Nội dung import là bắt buộc")
        String rawText
) {
}
