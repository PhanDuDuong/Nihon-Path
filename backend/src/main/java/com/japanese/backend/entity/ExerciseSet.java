package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import com.japanese.backend.entity.converter.ExerciseQuestionListConverter;

@Entity
@Table(name = "bo_bai_tap")
@Getter
@Setter
public class ExerciseSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tieu_de")
    private String title;

    @Column(name = "mo_ta")
    private String description;

    @Column(name = "the")
    private String tags;

    @Column(name = "ngu_phap_id")
    private Long grammarLessonId;

    @Column(name = "cap_do_id")
    private Long levelId;

    @Column(name = "loai_bai_tap")
    private String exerciseType;

    @Column(name = "duong_dan_nguon")
    private String sourceUrl;

    @Column(name = "nguoi_tao_id")
    private Long createdBy;

    @Convert(converter = ExerciseQuestionListConverter.class)
    @Column(name = "cau_hoi_json", columnDefinition = "json")
    private List<ExerciseQuestion> questions;
}
