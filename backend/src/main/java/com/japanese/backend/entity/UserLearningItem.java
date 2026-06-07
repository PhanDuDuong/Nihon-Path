package com.japanese.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tien_do_hoc")
@Getter
@Setter
public class UserLearningItem {

    public static final String TYPE_VOCABULARY = "VOCABULARY";
    public static final String TYPE_KANJI = "KANJI";
    public static final String TYPE_GRAMMAR_LESSON = "GRAMMAR_LESSON";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nguoi_dung_id")
    private Long userId;

    @Column(name = "loai_noi_dung")
    private String itemType;

    @Column(name = "noi_dung_id")
    private Long itemId;

    @Column(name = "trang_thai_hoc")
    private String learningStatus;

    @Column(name = "da_luu")
    private Boolean isBookmarked;

    @Column(name = "luu_luc")
    private LocalDateTime savedAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Long getVocabularyId() {
        return TYPE_VOCABULARY.equals(itemType) ? itemId : null;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Long getKanjiId() {
        return TYPE_KANJI.equals(itemType) ? itemId : null;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Long getGrammarLessonId() {
        return TYPE_GRAMMAR_LESSON.equals(itemType) ? itemId : null;
    }
}
