package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExerciseChoice {

    private Long id;

    @JsonIgnore
    private ExerciseQuestion question;

    private String choiceText;

    private Boolean isCorrect;

    private Integer choiceOrder;
}
