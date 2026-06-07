package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExamPart {

    private Long id;

    @JsonIgnore
    private ExamSection section;

    private String title;

    private String instruction;

    private String questionType;

    private Double scorePerQuestion;

    private Integer orderIndex;

    private Boolean sharedPassage;

    private Boolean sharedAudio;

    private Boolean sharedImage;

    private List<QuestionGroup> groups;
}
