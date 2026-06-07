package com.japanese.backend.controller;

import com.japanese.backend.entity.GrammarLesson;
import com.japanese.backend.repository.GrammarLessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grammar")
@RequiredArgsConstructor
public class GrammarController {

    private final GrammarLessonRepository repo;

    @GetMapping
    public List<GrammarLesson> getAll(
            @RequestParam(required = false) Long levelId,
            @RequestParam(required = false) String keyword
    ) {
        List<GrammarLesson> lessons = levelId == null ? repo.findAll() : repo.findByLevelId(levelId);
        if (keyword == null || keyword.isBlank()) {
            return lessons;
        }

        String normalized = keyword.trim().toLowerCase();
        return lessons.stream()
                .filter(lesson -> matches(lesson, normalized))
                .toList();
    }

    @GetMapping("/{id}")
    public GrammarLesson getById(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy bài học ngữ pháp"));
    }

    private boolean matches(GrammarLesson lesson, String keyword) {
        return contains(lesson.getTitle(), keyword)
                || contains(lesson.getGrammarPattern(), keyword)
                || contains(lesson.getMeaningVi(), keyword)
                || contains(lesson.getUsageText(), keyword);
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }
}
