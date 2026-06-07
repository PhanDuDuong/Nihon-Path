package com.japanese.backend.service;

import com.japanese.backend.dto.AdminKanjiRequest;
import com.japanese.backend.entity.Kanji;
import com.japanese.backend.repository.KanjiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KanjiService {

    private final KanjiRepository kanjiRepository;

    public List<Kanji> getAll() {
        return kanjiRepository.findAll();
    }

    public Kanji getById(Long id) {
        return kanjiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay kanji"));
    }

    public List<Kanji> search(String keyword) {
        List<Kanji> byChar = kanjiRepository.findByKanjiCharContaining(keyword);
        List<Kanji> byMeaning = kanjiRepository.findByMeaningViContainingIgnoreCase(keyword);

        byChar.addAll(byMeaning);
        return byChar;
    }

    public Page<Kanji> searchAdmin(String keyword, Long levelId, int page, int size) {
        String q = StringUtils.hasText(keyword) ? keyword.trim() : null;
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 50));
        return kanjiRepository.searchAdmin(q, levelId, PageRequest.of(safePage, safeSize));
    }

    @Transactional
    public Kanji create(AdminKanjiRequest request) {
        Kanji kanji = new Kanji();
        apply(kanji, request);
        kanji.setCreatedAt(LocalDateTime.now());
        return kanjiRepository.save(kanji);
    }

    @Transactional
    public Kanji update(Long id, AdminKanjiRequest request) {
        Kanji kanji = getById(id);
        apply(kanji, request);
        kanji.setUpdatedAt(LocalDateTime.now());
        return kanjiRepository.save(kanji);
    }

    public void delete(Long id) {
        kanjiRepository.deleteById(id);
    }

    private void apply(Kanji kanji, AdminKanjiRequest request) {
        kanji.setKanjiChar(request.kanjiChar());
        kanji.setMeaningVi(request.meaningVi());
        kanji.setHanVietReading(request.hanVietReading());
        kanji.setMeaningEn(request.meaningEn());
        kanji.setOnyomi(request.onyomi());
        kanji.setKunyomi(request.kunyomi());
        kanji.setStrokeCount(request.strokeCount());
        kanji.setRadical(request.radical());
        kanji.setPenStrokes(request.penStrokes());
        kanji.setShape(request.shape());
        kanji.setUnicodeCodepoint(request.unicodeCodepoint());
        kanji.setLevelId(request.levelId());
    }
}
