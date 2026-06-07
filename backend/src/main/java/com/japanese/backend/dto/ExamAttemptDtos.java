package com.japanese.backend.dto;

import com.japanese.backend.entity.ExamAttempt;
import com.japanese.backend.entity.ExamAttemptAnswer;
import com.japanese.backend.entity.ExamSet;

import java.util.List;

public class ExamAttemptDtos {
    public record AttemptSummary(
            Long id,
            Long examSetId,
            String examTitle,
            Long levelId,
            Double score,
            Integer correctCount,
            Integer wrongCount,
            String submittedAt
    ) {
    }

    public record AttemptDetail(
            ExamAttempt attempt,
            ExamSet exam,
            List<ExamAttemptAnswer> answers
    ) {
    }
}
