package com.japanese.backend.repository;

import com.japanese.backend.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    List<Flashcard> findByVocabularyId(Long vocabId);

    Optional<Flashcard> findFirstByVocabularyId(Long vocabId);

    List<Flashcard> findByKanjiId(Long kanjiId);
}
