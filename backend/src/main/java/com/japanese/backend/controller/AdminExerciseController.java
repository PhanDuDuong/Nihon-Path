package com.japanese.backend.controller;

import com.japanese.backend.entity.ExerciseSet;
import com.japanese.backend.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/exercises")
@RequiredArgsConstructor
public class AdminExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping
    public List<ExerciseSet> getAll() {
        return exerciseService.getExercises(null);
    }

    @PostMapping
    public ExerciseSet create(@RequestBody ExerciseSet exerciseSet) {
        return exerciseService.create(exerciseSet);
    }

    @PutMapping("/{id}")
    public ExerciseSet update(@PathVariable Long id, @RequestBody ExerciseSet exerciseSet) {
        return exerciseService.update(id, exerciseSet);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        exerciseService.delete(id);
        return "Đã xóa bài tập";
    }
}
