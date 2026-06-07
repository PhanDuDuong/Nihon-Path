package com.japanese.backend.controller;

import com.japanese.backend.entity.Kanji;
import com.japanese.backend.service.KanjiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kanjis")
@RequiredArgsConstructor
public class KanjiController {

    private final KanjiService kanjiService;

    @GetMapping
    public List<Kanji> getAll() {
        return kanjiService.getAll();
    }

    @GetMapping("/{id}")
    public Kanji getById(@PathVariable Long id) {
        return kanjiService.getById(id);
    }

    @GetMapping("/search")
    public List<Kanji> search(@RequestParam String keyword) {
        return kanjiService.search(keyword);
    }
}