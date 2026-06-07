package com.japanese.backend.controller;

import com.japanese.backend.entity.GrammarLesson;
import com.japanese.backend.repository.GrammarLessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/grammar")
@RequiredArgsConstructor
public class AdminGrammarController {

    private final GrammarLessonRepository grammarLessonRepository;

    @GetMapping
    public List<GrammarLesson> getAll() {
        return grammarLessonRepository.findAll();
    }

    @PostMapping
    public GrammarLesson create(@RequestBody GrammarLesson lesson) {
        return grammarLessonRepository.save(lesson);
    }

    @PutMapping("/{id}")
    public GrammarLesson update(@PathVariable Long id, @RequestBody GrammarLesson payload) {
        GrammarLesson lesson = grammarLessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài ngữ pháp"));
        lesson.setTitle(payload.getTitle());
        lesson.setGrammarPattern(payload.getGrammarPattern());
        lesson.setMeaningVi(payload.getMeaningVi());
        lesson.setUsageText(payload.getUsageText());
        lesson.setNoteText(payload.getNoteText());
        lesson.setComparisonText(payload.getComparisonText());
        lesson.setLevelId(payload.getLevelId());
        return grammarLessonRepository.save(lesson);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        grammarLessonRepository.deleteById(id);
        return "Đã xóa bài ngữ pháp";
    }
}
