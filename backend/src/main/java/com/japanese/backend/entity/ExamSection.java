package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExamSection {

    private Long id;

    @JsonIgnore
    private ExamSet examSet;

    private String title;

    private String type;

    private Integer durationMinutes;

    private Integer orderIndex;

    private Boolean allowBack;

    private Boolean allowEarlySubmit;

    private Boolean autoSubmit;

    private Boolean scored;

    private String instruction;

    private List<ExamPart> parts;
}
