package com.japanese.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> data = new HashMap<>();

        Integer totalVocab = count("SELECT COUNT(*) FROM tien_do_hoc WHERE nguoi_dung_id = ? AND loai_noi_dung = 'VOCABULARY'", userId);
        Integer totalKanji = count("SELECT COUNT(*) FROM tien_do_hoc WHERE nguoi_dung_id = ? AND loai_noi_dung = 'KANJI'", userId);
        Integer totalExam = count("SELECT COUNT(*) FROM luot_lam_de_thi WHERE nguoi_dung_id = ?", userId);
        Integer totalExercise = count("SELECT COUNT(DISTINCT bo_bai_tap_id) FROM luot_lam_bai_tap WHERE nguoi_dung_id = ?", userId);
        Integer flashcardReviewed = count("SELECT COUNT(*) FROM tien_do_the_ghi_nho WHERE nguoi_dung_id = ?", userId);
        Double avgScore = jdbcTemplate.queryForObject(
                """
                SELECT AVG(score) FROM (
                    SELECT diem FROM luot_lam_de_thi WHERE nguoi_dung_id = ?
                    UNION ALL
                    SELECT diem FROM luot_lam_bai_tap WHERE nguoi_dung_id = ?
                ) scores
                """,
                Double.class,
                userId,
                userId
        );

        data.put("totalVocab", totalVocab);
        data.put("totalKanji", totalKanji);
        data.put("totalExam", totalExam);
        data.put("totalExercise", totalExercise);
        data.put("flashcardReviewed", flashcardReviewed);
        data.put("avgScore", avgScore == null ? 0 : avgScore);

        return data;
    }

    private Integer count(String sql, Long userId) {
        return jdbcTemplate.queryForObject(sql, Integer.class, userId);
    }
}
