package com.japanese.backend.service;

import com.japanese.backend.entity.GrammarLesson;
import com.japanese.backend.entity.Kanji;
import com.japanese.backend.entity.Vocabulary;
import com.japanese.backend.repository.GrammarLessonRepository;
import com.japanese.backend.repository.KanjiRepository;
import com.japanese.backend.repository.VocabularyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AiRagService {

    private static final int MAX_TERMS = 5;
    private static final int MAX_SNIPPETS = 10;

    private final VocabularyRepository vocabularyRepository;
    private final KanjiRepository kanjiRepository;
    private final GrammarLessonRepository grammarLessonRepository;

    public AiRagContext retrieve(String question) {
        List<String> terms = extractTerms(question);
        Set<String> snippets = new LinkedHashSet<>();
        Set<String> sources = new LinkedHashSet<>();

        addProductKnowledge(snippets, sources);

        for (String term : terms) {
            if (snippets.size() >= MAX_SNIPPETS) {
                break;
            }
            addVocabularies(term, snippets, sources);
            addKanjis(term, snippets, sources);
            addGrammarLessons(term, snippets, sources);
        }

        String contextText = snippets.isEmpty()
                ? "Không tìm thấy ngữ cảnh nội bộ phù hợp trong vector DB."
                : String.join("\n", snippets);
        return new AiRagContext(contextText, List.copyOf(sources));
    }

    private void addProductKnowledge(Set<String> snippets, Set<String> sources) {
        snippets.add("""
                [NihonPath] Website gom cac khu vuc: dashboard theo dõi tiến độ, từ vựng, kanji, bài học ngữ pháp, bài tập, đề JLPT, flashcard, từ điển và gói VIP.
                Chatbot AI chỉ dành cho tài khoản VIP hoặc ADMIN và chỉ trả lời về học tiếng Nhật hoặc cách sử dụng NihonPath.
                """.trim());
        sources.add("NihonPath: hướng dẫn vận hành website");
    }

    private void addVocabularies(String term, Set<String> snippets, Set<String> sources) {
        vocabularyRepository.searchDictionary(term, PageRequest.of(0, 3)).forEach(vocabulary -> {
            if (snippets.size() >= MAX_SNIPPETS) {
                return;
            }
            snippets.add(formatVocabulary(vocabulary));
            sources.add("Từ vựng: " + firstText(vocabulary.getWord(), vocabulary.getKanji(), vocabulary.getReading()));
        });
    }

    private void addKanjis(String term, Set<String> snippets, Set<String> sources) {
        kanjiRepository.searchDictionary(term, PageRequest.of(0, 3)).forEach(kanji -> {
            if (snippets.size() >= MAX_SNIPPETS) {
                return;
            }
            snippets.add(formatKanji(kanji));
            sources.add("Kanji: " + firstText(kanji.getKanjiChar(), kanji.getHanVietReading()));
        });
    }

    private void addGrammarLessons(String term, Set<String> snippets, Set<String> sources) {
        grammarLessonRepository.searchForAi(term, PageRequest.of(0, 3)).forEach(lesson -> {
            if (snippets.size() >= MAX_SNIPPETS) {
                return;
            }
            snippets.add(formatGrammar(lesson));
            sources.add("Ngữ pháp: " + firstText(lesson.getGrammarPattern(), lesson.getTitle()));
        });
    }

    private String formatVocabulary(Vocabulary vocabulary) {
        return "[Từ vựng] " + compact(List.of(
                "word=" + value(vocabulary.getWord()),
                "kanji=" + value(vocabulary.getKanji()),
                "reading=" + value(vocabulary.getReading()),
                "meaning_vi=" + value(vocabulary.getMeaningVi()),
                "type=" + value(vocabulary.getWordType()),
                "level_id=" + value(vocabulary.getLevelId())
        ));
    }

    private String formatKanji(Kanji kanji) {
        return "[Kanji] " + compact(List.of(
                "character=" + value(kanji.getKanjiChar()),
                "han_viet=" + value(kanji.getHanVietReading()),
                "onyomi=" + value(kanji.getOnyomi()),
                "kunyomi=" + value(kanji.getKunyomi()),
                "meaning_vi=" + value(kanji.getMeaningVi()),
                "strokes=" + value(kanji.getStrokeCount())
        ));
    }

    private String formatGrammar(GrammarLesson lesson) {
        return "[Ngữ pháp] " + compact(List.of(
                "title=" + value(lesson.getTitle()),
                "pattern=" + value(lesson.getGrammarPattern()),
                "meaning_vi=" + value(lesson.getMeaningVi()),
                "usage=" + value(lesson.getUsageText()),
                "note=" + value(lesson.getNoteText())
        ));
    }

    private List<String> extractTerms(String question) {
        if (!StringUtils.hasText(question)) {
            return List.of();
        }

        String normalized = Normalizer.normalize(question, Normalizer.Form.NFKC)
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\p{IsHan}\\p{IsHiragana}\\p{IsKatakana}]+", " ")
                .trim();

        Set<String> terms = new LinkedHashSet<>();
        for (String term : normalized.split("\\s+")) {
            String clean = term.trim();
            if (clean.length() >= 2) {
                terms.add(clean);
                terms.add(clean.toLowerCase(Locale.ROOT));
            }
        }

        return terms.stream()
                .sorted(Comparator.comparingInt(String::length).reversed())
                .limit(MAX_TERMS)
                .toList();
    }

    private String compact(List<String> parts) {
        List<String> kept = new ArrayList<>();
        for (String part : parts) {
            if (!part.endsWith("=-")) {
                kept.add(part);
            }
        }
        return String.join("; ", kept);
    }

    private String value(Object value) {
        if (value == null) {
            return "-";
        }
        String text = String.valueOf(value).replaceAll("\\s+", " ").trim();
        if (text.length() > 260) {
            return text.substring(0, 257) + "...";
        }
        return StringUtils.hasText(text) ? text : "-";
    }

    private String firstText(String... values) {
        for (String item : values) {
            if (StringUtils.hasText(item)) {
                return item.trim();
            }
        }
        return "nội dung liên quan";
    }
}
