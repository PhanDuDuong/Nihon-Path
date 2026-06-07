package com.japanese.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class SubmitRequest {

    private Long exerciseSetId;

    // questionId -> choiceId
    private Map<Long, Long> answers;
}