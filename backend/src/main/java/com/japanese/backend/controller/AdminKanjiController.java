package com.japanese.backend.controller;

import com.japanese.backend.dto.AdminKanjiRequest;
import com.japanese.backend.entity.Kanji;
import com.japanese.backend.service.KanjiService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/kanjis")
@RequiredArgsConstructor
public class AdminKanjiController {

    private final KanjiService kanjiService;

    @GetMapping
    public Page<Kanji> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long levelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return kanjiService.searchAdmin(q, levelId, page, size);
    }

    @PostMapping
    public Kanji create(@RequestBody AdminKanjiRequest request) {
        return kanjiService.create(request);
    }

    @PutMapping("/{id}")
    public Kanji update(@PathVariable Long id, @RequestBody AdminKanjiRequest request) {
        return kanjiService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        kanjiService.delete(id);
        return "Đã xóa kanji";
    }
}
