package com.japanese.backend.dto;

import java.util.List;

public final class DictionaryDtos {

    private DictionaryDtos() {
    }

    public record SearchResponse(
            List<VocabularySummary> vocabularies,
            List<KanjiSummary> kanjis
    ) {
    }

    public record VocabularySummary(
            Long id,
            String word,
            String kanji,
            String reading,
            String meaningVi,
            String meaningEn,
            String wordType,
            Long levelId,
            Boolean isCommon,
            String source,
            String sourceEntryId,
            String priorityTags
    ) {
    }

    public record KanjiSummary(
            Long id,
            String kanjiChar,
            String meaningVi,
            String hanVietReading,
            String meaningEn,
            String onyomi,
            String kunyomi,
            Integer strokeCount,
            String radical,
            Long levelId,
            String strokeOrderSvgUrl,
            String strokeOrderImageUrl,
            String strokeOrderGifUrl,
            String penStrokes,
            String shape,
            String unicodeCodepoint,
            String source,
            String sourceEntryId
    ) {
    }

    public record VocabularyDetail(
            Long id,
            String word,
            String kanji,
            String reading,
            String meaningVi,
            String meaningEn,
            String wordType,
            Long levelId,
            String lessonNote,
            Boolean isCommon,
            String source,
            String sourceEntryId,
            String priorityTags,
            List<VocabularySenseDto> senses,
            List<VocabularyExampleDto> examples,
            List<KanjiSummary> kanjis
    ) {
    }

    public record VocabularySenseDto(
            Long id,
            Integer senseOrder,
            String meaningEn,
            String meaningVi,
            String partOfSpeech,
            String fieldTag,
            String miscTag
    ) {
    }

    public record VocabularyExampleDto(
            Long id,
            String exampleJp,
            String exampleReading,
            String exampleVi
    ) {
    }

    public record KanjiDetail(
            Long id,
            String kanjiChar,
            String meaningVi,
            String hanVietReading,
            String meaningEn,
            String onyomi,
            String kunyomi,
            String nanori,
            Integer strokeCount,
            String radical,
            Long levelId,
            Integer grade,
            String jlptLegacy,
            String strokeOrderSvgUrl,
            String strokeOrderImageUrl,
            String strokeOrderGifUrl,
            String penStrokes,
            String shape,
            String unicodeCodepoint,
            String source,
            String sourceEntryId,
            List<VocabularySummary> vocabularies
    ) {
    }
}
