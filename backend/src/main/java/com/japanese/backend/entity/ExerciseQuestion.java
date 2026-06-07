package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExerciseQuestion {

    private Long id;

    @JsonIgnore
    private ExerciseSet exerciseSet;

    private String questionText;

    private Integer questionOrder;

    private String explanation;

    private List<ExerciseChoice> choices;
}
