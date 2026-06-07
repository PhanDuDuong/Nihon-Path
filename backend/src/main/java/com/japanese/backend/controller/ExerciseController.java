package com.japanese.backend.controller;

import com.japanese.backend.dto.SubmitRequest;
import com.japanese.backend.dto.ExerciseAttemptDtos.ExerciseAttemptDetail;
import com.japanese.backend.dto.ExerciseAttemptDtos.ExerciseAttemptSummary;
import com.japanese.backend.entity.ExerciseAttempt;
import com.japanese.backend.entity.ExerciseSet;
import com.japanese.backend.service.ExerciseService;
import com.japanese.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;
    private final UserService userService;

    @GetMapping
    public List<ExerciseSet> getExercises(@RequestParam(required = false) Long levelId) {
        return exerciseService.getExercises(levelId);
    }

    @GetMapping("/attempts")
    public List<ExerciseAttemptSummary> getAttempts(Principal principal) {
        Long userId = userService.getUserIdByEmail(principal.getName());
        return exerciseService.getAttempts(userId);
    }

    @GetMapping("/attempts/{attemptId}")
    public ExerciseAttemptDetail getAttempt(@PathVariable Long attemptId, Principal principal) {
        Long userId = userService.getUserIdByEmail(principal.getName());
        return exerciseService.getAttemptDetail(userId, attemptId);
    }

    @GetMapping("/{id}")
    public ExerciseSet getExercise(@PathVariable Long id) {
        return exerciseService.getExercise(id);
    }

    @PostMapping("/submit")
    public ExerciseAttempt submit(@RequestBody SubmitRequest request, Principal principal) {
        Long userId = userService.getUserIdByEmail(principal.getName());
        return exerciseService.submit(userId, request);
    }
}
