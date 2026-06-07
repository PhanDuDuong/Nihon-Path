package com.japanese.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request to create a user-owned deck from the deck selector popup or deck page.
 */
public record CreateFlashcardDeckRequest(
        @NotBlank(message = "Tên bộ flashcard là bắt buộc")
        @Size(max = 255, message = "Tên bộ flashcard tối đa 255 ký tự")
        String title,

        String description,
        String coverColor,
        Long levelId,
        Boolean isPublic
) {
}
