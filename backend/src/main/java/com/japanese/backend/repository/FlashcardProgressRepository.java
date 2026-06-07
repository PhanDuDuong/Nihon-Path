package com.japanese.backend.repository;

import com.japanese.backend.entity.FlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, Long> {
    Optional<FlashcardProgress> findByUserIdAndFlashcardId(Long userId, Long flashcardId);

    @Query("select count(p) from FlashcardProgress p where p.userId = :userId and p.flashcardId in :cardIds and p.reviewCount > 0")
    long countStudiedCards(@Param("userId") Long userId, @Param("cardIds") Collection<Long> cardIds);

    @Query("select count(p) from FlashcardProgress p where p.userId = :userId and p.flashcardId in :cardIds and p.memoryStatus = 'REMEMBERED'")
    long countRememberedCards(@Param("userId") Long userId, @Param("cardIds") Collection<Long> cardIds);
}
