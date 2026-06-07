package com.japanese.backend.dto;

import java.util.List;

public record AdminKanjiRequest(
        String kanjiChar,
        String meaningVi,
        String hanVietReading,
        String meaningEn,
        String onyomi,
        String kunyomi,
        Integer strokeCount,
        String radical,
        String penStrokes,
        String shape,
        String unicodeCodepoint,
        Long levelId,
        List<Long> relatedVocabularyIds
) {
}
