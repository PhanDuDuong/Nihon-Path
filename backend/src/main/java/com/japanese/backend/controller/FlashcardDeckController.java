package com.japanese.backend.controller;

import com.japanese.backend.dto.CreateFlashcardDeckRequest;
import com.japanese.backend.dto.FlashcardDeckDtos.DeckDetail;
import com.japanese.backend.dto.FlashcardDeckDtos.DeckSummary;
import com.japanese.backend.dto.FlashcardDeckDtos.SelectableDeckResponse;
import com.japanese.backend.dto.ReorderFlashcardDeckRequest;
import com.japanese.backend.service.FlashcardDeckService;
import com.japanese.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Deck API used by the vocabulary "add to flashcard" popup and deck pages.
 */
@RestController
@RequestMapping("/api/flashcard-decks")
@RequiredArgsConstructor
public class FlashcardDeckController {

    private final FlashcardDeckService flashcardDeckService;
    private final UserService userService;

    @GetMapping("/selectable")
    public SelectableDeckResponse getSelectableDecks(@RequestParam Long vocabularyId, Principal principal) {
        return flashcardDeckService.getSelectableDecks(currentUserId(principal), vocabularyId);
    }

    @PostMapping
    public DeckSummary createDeck(@Valid @RequestBody CreateFlashcardDeckRequest request, Principal principal) {
        return flashcardDeckService.createDeck(currentUserId(principal), request);
    }

    @DeleteMapping("/{deckId}")
    public void deleteDeck(@PathVariable Long deckId, Principal principal) {
        flashcardDeckService.deleteDeck(currentUserId(principal), deckId);
    }

    @PostMapping("/{deckId}/vocabularies/{vocabularyId}")
    public DeckDetail addVocabulary(
            @PathVariable Long deckId,
            @PathVariable Long vocabularyId,
            Principal principal
    ) {
        return flashcardDeckService.addVocabularyToDeck(currentUserId(principal), deckId, vocabularyId);
    }

    @DeleteMapping("/{deckId}/vocabularies/{vocabularyId}")
    public DeckDetail removeVocabulary(
            @PathVariable Long deckId,
            @PathVariable Long vocabularyId,
            Principal principal
    ) {
        return flashcardDeckService.removeVocabularyFromDeck(currentUserId(principal), deckId, vocabularyId);
    }

    @DeleteMapping("/{deckId}/cards/{cardId}")
    public DeckDetail removeCard(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            Principal principal
    ) {
        return flashcardDeckService.removeCardFromDeck(currentUserId(principal), deckId, cardId);
    }

    @PutMapping("/{deckId}/cards/reorder")
    public DeckDetail reorderCards(
            @PathVariable Long deckId,
            @Valid @RequestBody ReorderFlashcardDeckRequest request,
            Principal principal
    ) {
        return flashcardDeckService.reorderCards(currentUserId(principal), deckId, request);
    }

    @PutMapping("/{deckId}/cards/{cardId}/review")
    public DeckDetail reviewCard(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            @RequestParam String status,
            Principal principal
    ) {
        return flashcardDeckService.reviewCardInDeck(currentUserId(principal), deckId, cardId, status);
    }

    @GetMapping("/my")
    public List<DeckSummary> getMyDecks(@RequestParam(required = false) String q, Principal principal) {
        return flashcardDeckService.getMyDecks(currentUserId(principal), q);
    }

    @GetMapping("/system")
    public List<DeckSummary> getSystemDecks(@RequestParam(required = false) String q) {
        return flashcardDeckService.getSystemDecks(q);
    }

    @GetMapping("/public/{deckId}")
    public DeckDetail getPublicDeck(@PathVariable Long deckId) {
        return flashcardDeckService.getDeckDetail(null, deckId);
    }

    @GetMapping("/{deckId}")
    public DeckDetail getDeck(@PathVariable Long deckId, Principal principal) {
        return flashcardDeckService.getDeckDetail(principal == null ? null : currentUserId(principal), deckId);
    }

    private Long currentUserId(Principal principal) {
        return userService.getUserIdByEmail(principal.getName());
    }
}
