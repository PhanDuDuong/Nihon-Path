package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamChoice {

    private Long id;

    @JsonIgnore
    private ExamQuestion question;

    private String choiceText;

    private String label;

    private String image;

    private Boolean isCorrect;

    private Integer choiceOrder;
}
