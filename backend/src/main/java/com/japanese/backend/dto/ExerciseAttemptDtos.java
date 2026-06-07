package com.japanese.backend.dto;

import com.japanese.backend.entity.ExerciseAttempt;
import com.japanese.backend.entity.ExerciseSet;

import java.util.List;

public final class ExerciseAttemptDtos {

    private ExerciseAttemptDtos() {
    }

    public record ExerciseAttemptAnswerDto(
            Long questionId,
            Long selectedChoiceId,
            Long correctChoiceId,
            Boolean isCorrect
    ) {
    }

    public record ExerciseAttemptSummary(
            Long id,
            Long exerciseSetId,
            String exerciseTitle,
            Long levelId,
            Double score,
            Integer correctCount,
            Integer wrongCount,
            String submittedAt
    ) {
    }

    public record ExerciseAttemptDetail(
            ExerciseAttempt attempt,
            ExerciseSet exercise,
            List<ExerciseAttemptAnswerDto> answers
    ) {
    }
}
