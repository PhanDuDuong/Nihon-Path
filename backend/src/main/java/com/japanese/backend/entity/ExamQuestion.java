package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExamQuestion {

    private Long id;

    @JsonIgnore
    private ExamSet examSet;

    @JsonIgnore
    private ExamPart part;

    @JsonIgnore
    private QuestionGroup group;

    private String sectionType;

    private String mondai;

    private String questionType;

    private String questionText;

    private String underlinedText;

    private String imageUrl;

    private String passageImageUrl;

    private String audioFile;

    private Integer audioStartSec;

    private Integer audioEndSec;

    private Integer questionOrder;

    private Double score;

    private String correctAnswer;

    private String explanation;

    private String translation;

    private List<ExamChoice> choices;
}
