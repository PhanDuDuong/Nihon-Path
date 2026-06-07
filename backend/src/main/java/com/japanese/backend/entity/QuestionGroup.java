package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QuestionGroup {

    private Long id;

    @JsonIgnore
    private ExamPart part;

    private String title;

    private String passageText;

    private String passageImage;

    private String audioFile;

    private String transcript;

    private Integer audioPlayLimit;

    private String questionVisibility;

    private Integer orderIndex;

    private List<ExamQuestion> questions;
}
