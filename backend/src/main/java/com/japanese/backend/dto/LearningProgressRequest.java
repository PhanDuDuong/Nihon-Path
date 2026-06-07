package com.japanese.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LearningProgressRequest {
    private String learningStatus;
    private Boolean bookmarked;
}
