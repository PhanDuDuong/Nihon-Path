package com.japanese.backend.controller;

import com.japanese.backend.entity.ExamSet;
import com.japanese.backend.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
public class AdminExamController {

    private final ExamService examService;

    @GetMapping
    public List<ExamSet> getAll() {
        return examService.getExams(null);
    }

    @PostMapping
    public ExamSet create(@RequestBody ExamSet examSet) {
        return examService.create(examSet);
    }

    @PutMapping("/{id}")
    public ExamSet update(@PathVariable Long id, @RequestBody ExamSet examSet) {
        return examService.update(id, examSet);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        examService.delete(id);
        return "Đã xóa đề thi";
    }
}
