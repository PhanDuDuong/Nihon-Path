package com.japanese.backend.controller;

import com.japanese.backend.entity.Flashcard;
import com.japanese.backend.entity.FlashcardProgress;
import com.japanese.backend.dto.FlashcardDeckDtos.ImportResult;
import com.japanese.backend.dto.ImportTextFlashcardRequest;
import com.japanese.backend.dto.ManualFlashcardRequest;
import com.japanese.backend.dto.UpdateFlashcardRequest;
import com.japanese.backend.service.FlashcardDeckService;
import com.japanese.backend.service.FlashcardService;
import com.japanese.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

/**
 * Flashcard card API. Existing review endpoints stay compatible, while manual
 * and import endpoints feed cards into the new deck architecture.
 */
@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;
    private final FlashcardDeckService flashcardDeckService;
    private final UserService userService;

    @GetMapping
    public List<Flashcard> getAll() {
        return flashcardService.getAll();
    }

    @PutMapping("/{id}")
    public FlashcardProgress review(
            @PathVariable Long id,
            @RequestParam String status,
            Principal principal
    ) {
        return flashcardService.review(currentUserId(principal), id, status);
    }

    @PostMapping("/manual")
    public Flashcard createManual(@Valid @RequestBody ManualFlashcardRequest request, Principal principal) {
        return flashcardDeckService.createManualCard(currentUserId(principal), request);
    }

    @PutMapping("/{id}/edit")
    public Flashcard updateCard(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFlashcardRequest request,
            Principal principal
    ) {
        return flashcardDeckService.updateCard(currentUserId(principal), id, request);
    }

    @PostMapping("/import-text")
    public ImportResult importText(@Valid @RequestBody ImportTextFlashcardRequest request, Principal principal) {
        return flashcardDeckService.importText(currentUserId(principal), request);
    }

    @PostMapping(value = "/import-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResult importFile(
            @RequestParam Long deckId,
            @RequestPart MultipartFile file,
            Principal principal
    ) {
        return flashcardDeckService.importFile(currentUserId(principal), deckId, file);
    }

    private Long currentUserId(Principal principal) {
        return userService.getUserIdByEmail(principal.getName());
    }
}
