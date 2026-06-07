package com.japanese.backend.dto;

import java.util.List;

public final class JlptLevelDtos {

    private JlptLevelDtos() {
    }

    public record JlptLevel(
            Long id,
            String code,
            String name,
            String description
    ) {
    }

    public static final List<JlptLevel> LEVELS = List.of(
            new JlptLevel(1L, "N5", "JLPT N5", "Co ban"),
            new JlptLevel(2L, "N4", "JLPT N4", "So cap"),
            new JlptLevel(3L, "N3", "JLPT N3", "Trung cap"),
            new JlptLevel(4L, "N2", "JLPT N2", "Trung cao cap"),
            new JlptLevel(5L, "N1", "JLPT N1", "Cao cap")
    );
}
