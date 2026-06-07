package com.japanese.backend.service;

import com.japanese.backend.entity.Flashcard;
import com.japanese.backend.entity.FlashcardProgress;
import com.japanese.backend.repository.FlashcardProgressRepository;
import com.japanese.backend.repository.FlashcardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private static final Set<String> ALLOWED_REVIEW_STATUSES = Set.of("NOT_REMEMBERED", "LEARNING", "REMEMBERED");

    private final FlashcardRepository flashcardRepo;
    private final FlashcardProgressRepository progressRepo;

    public List<Flashcard> getAll() {
        return flashcardRepo.findAll();
    }

    public FlashcardProgress review(Long userId, Long flashcardId, String status) {
        String normalizedStatus = normalizeReviewStatus(status);
        FlashcardProgress progress = progressRepo.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> {
                    FlashcardProgress item = new FlashcardProgress();
                    item.setUserId(userId);
                    item.setFlashcardId(flashcardId);
                    item.setReviewCount(0);
                    return item;
                });

        progress.setMemoryStatus(normalizedStatus);
        progress.setReviewCount((progress.getReviewCount() == null ? 0 : progress.getReviewCount()) + 1);
        progress.setLastReviewedAt(LocalDateTime.now());

        return progressRepo.save(progress);
    }

    private String normalizeReviewStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_REVIEW_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trang thai on tap flashcard khong hop le");
        }
        return normalized;
    }
}
