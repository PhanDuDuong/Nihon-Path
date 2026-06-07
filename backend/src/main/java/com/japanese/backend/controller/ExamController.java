package com.japanese.backend.controller;

import com.japanese.backend.dto.ExamSubmitRequest;
import com.japanese.backend.dto.ExamAttemptDtos.AttemptDetail;
import com.japanese.backend.dto.ExamAttemptDtos.AttemptSummary;
import com.japanese.backend.entity.ExamAttempt;
import com.japanese.backend.entity.ExamSet;
import com.japanese.backend.service.ExamService;
import com.japanese.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final UserService userService;

    @GetMapping
    public List<ExamSet> getExams(@RequestParam(required = false) Long levelId, Principal principal) {
        return examService.getPublishedExams(levelId, principal == null ? null : principal.getName());
    }

    @GetMapping("/{id}")
    public ExamSet getExam(@PathVariable Long id, Principal principal) {
        return examService.getPublishedExam(id, principal == null ? null : principal.getName());
    }

    @PostMapping("/submit")
    public ExamAttempt submit(@RequestBody ExamSubmitRequest request, Principal principal) {
        Long userId = userService.getUserIdByEmail(principal.getName());
        return examService.submit(userId, request);
    }

    @GetMapping("/attempts")
    public List<AttemptSummary> getAttempts(Principal principal) {
        Long userId = userService.getUserIdByEmail(principal.getName());
        return examService.getRecentAttempts(userId);
    }

    @GetMapping("/attempts/{attemptId}")
    public AttemptDetail getAttempt(@PathVariable Long attemptId, Principal principal) {
        Long userId = userService.getUserIdByEmail(principal.getName());
        return examService.getAttemptDetail(userId, attemptId);
    }
}
