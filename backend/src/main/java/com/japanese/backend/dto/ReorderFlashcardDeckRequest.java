package com.japanese.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request to save a user's manual card order inside one deck.
 */
public record ReorderFlashcardDeckRequest(
        @NotEmpty(message = "Danh sach cardIds la bat buoc")
        List<Long> cardIds
) {
}
