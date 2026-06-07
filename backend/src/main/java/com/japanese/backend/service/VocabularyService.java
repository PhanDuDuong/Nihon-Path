package com.japanese.backend.service;

import com.japanese.backend.entity.Vocabulary;
import com.japanese.backend.repository.VocabularyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VocabularyService {

    private final VocabularyRepository vocabularyRepository;

    public List<Vocabulary> getAll() {
        return vocabularyRepository.findAll();
    }

    public Vocabulary getById(Long id) {
        return vocabularyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng"));
    }

    public List<Vocabulary> search(String keyword) {
        List<Vocabulary> byWord = vocabularyRepository.findByWordContainingIgnoreCase(keyword);
        List<Vocabulary> byMeaning = vocabularyRepository.findByMeaningViContainingIgnoreCase(keyword);

        byWord.addAll(byMeaning);
        return byWord;
    }

    public Page<Vocabulary> searchAdmin(String keyword, Long levelId, String lesson, int page, int size) {
        String q = StringUtils.hasText(keyword) ? keyword.trim() : null;
        String lessonFilter = StringUtils.hasText(lesson) ? lesson.trim() : null;
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 50));
        return vocabularyRepository.searchAdmin(q, levelId, lessonFilter, PageRequest.of(safePage, safeSize));
    }

    public Vocabulary create(Vocabulary vocab) {
        vocab.setCreatedAt(LocalDateTime.now());
        return vocabularyRepository.save(vocab);
    }

    public Vocabulary update(Long id, Vocabulary vocab) {
        Vocabulary existing = getById(id);

        existing.setWord(vocab.getWord());
        existing.setKanji(vocab.getKanji());
        existing.setReading(vocab.getReading());
        existing.setMeaningVi(vocab.getMeaningVi());
        existing.setMeaningEn(vocab.getMeaningEn());
        existing.setWordType(vocab.getWordType());
        existing.setLevelId(vocab.getLevelId());
        existing.setLessonNote(vocab.getLessonNote());
        existing.setUpdatedAt(LocalDateTime.now());

        return vocabularyRepository.save(existing);
    }

    public void delete(Long id) {
        vocabularyRepository.deleteById(id);
    }

}
