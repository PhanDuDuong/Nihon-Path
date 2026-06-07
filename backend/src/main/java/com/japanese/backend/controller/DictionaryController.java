package com.japanese.backend.controller;

import com.japanese.backend.dto.DictionaryDtos.KanjiDetail;
import com.japanese.backend.dto.DictionaryDtos.SearchResponse;
import com.japanese.backend.dto.DictionaryDtos.VocabularyDetail;
import com.japanese.backend.service.DictionaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/dictionary")
@RequiredArgsConstructor
public class DictionaryController {

    private final DictionaryService dictionaryService;

    @GetMapping("/search")
    public SearchResponse search(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return dictionaryService.search(q, limit);
    }

    @GetMapping("/word/{id}")
    public VocabularyDetail getWord(@PathVariable Long id) {
        return dictionaryService.getWord(id);
    }

    @GetMapping("/kanji/{character}")
    public KanjiDetail getKanji(@PathVariable String character) {
        return dictionaryService.getKanji(character);
    }

    @GetMapping(value = "/kanji/{character}/stroke-order.svg", produces = "image/svg+xml")
    public ResponseEntity<String> getKanjiStrokeOrder(@PathVariable String character) {
        return ResponseEntity
                .ok()
                .contentType(MediaType.parseMediaType("image/svg+xml"))
                .body(dictionaryService.getKanjiStrokeOrderSvg(character));
    }

    @GetMapping("/kanji/{character}/stroke-order.gif")
    public ResponseEntity<Void> getKanjiStrokeOrderGif(@PathVariable String character) {
        return ResponseEntity
                .status(302)
                .location(URI.create(dictionaryService.getKanjiStrokeOrderGifUrl(character)))
                .build();
    }
}
