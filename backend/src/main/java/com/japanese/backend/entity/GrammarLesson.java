package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ngu_phap")
@Getter
@Setter
public class GrammarLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tieu_de")
    private String title;

    @Column(name = "mau_ngu_phap")
    private String grammarPattern;

    @Column(name = "nghia_vi")
    private String meaningVi;

    @Column(name = "cach_dung")
    private String usageText;

    @Column(name = "ghi_chu")
    private String noteText;

    @Column(name = "so_sanh")
    private String comparisonText;

    @Column(name = "cap_do_id")
    private Long levelId;
}
