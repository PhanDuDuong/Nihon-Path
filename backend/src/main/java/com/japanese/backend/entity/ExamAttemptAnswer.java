package com.japanese.backend.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamAttemptAnswer {

    private Long id;

    private Long examAttemptId;

    private Long questionId;

    private Long selectedChoiceId;

    private Long correctChoiceId;

    private Boolean isCorrect;
}
