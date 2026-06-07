package com.japanese.backend.controller;

import com.japanese.backend.dto.JlptLevelDtos;
import com.japanese.backend.dto.JlptLevelDtos.JlptLevel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/levels")
public class JlptLevelController {

    @GetMapping
    public List<JlptLevel> getLevels() {
        return JlptLevelDtos.LEVELS;
    }
}
