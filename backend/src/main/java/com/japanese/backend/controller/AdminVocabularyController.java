package com.japanese.backend.controller;

import com.japanese.backend.entity.Vocabulary;
import com.japanese.backend.service.VocabularyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/vocabularies")
@RequiredArgsConstructor
public class AdminVocabularyController {

    private final VocabularyService vocabularyService;

    @GetMapping
    public Page<Vocabulary> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long levelId,
            @RequestParam(required = false) String lesson,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return vocabularyService.searchAdmin(q, levelId, lesson, page, size);
    }

    @PostMapping
    public Vocabulary create(@RequestBody Vocabulary vocab) {
        return vocabularyService.create(vocab);
    }

    @PutMapping("/{id}")
    public Vocabulary update(@PathVariable Long id, @RequestBody Vocabulary vocab) {
        return vocabularyService.update(id, vocab);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        vocabularyService.delete(id);
        return "Đã xóa thành công";
    }
}
