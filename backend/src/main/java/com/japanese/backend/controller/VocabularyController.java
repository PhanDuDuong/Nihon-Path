package com.japanese.backend.controller;

import com.japanese.backend.entity.Vocabulary;
import com.japanese.backend.service.VocabularyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocabularies")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyService vocabularyService;

    @GetMapping
    public List<Vocabulary> getAll() {
        return vocabularyService.getAll();
    }

    @GetMapping("/{id}")
    public Vocabulary getById(@PathVariable Long id) {
        return vocabularyService.getById(id);
    }

    @GetMapping("/search")
    public List<Vocabulary> search(@RequestParam String keyword) {
        return vocabularyService.search(keyword);
    }
}