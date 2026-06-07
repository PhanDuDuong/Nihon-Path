package com.japanese.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public Map<String, Object> getReports() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", count("SELECT COUNT(*) FROM nguoi_dung"));
        data.put("vipUsers", count("SELECT COUNT(*) FROM nguoi_dung u JOIN vai_tro r ON u.vai_tro_id = r.id WHERE UPPER(r.ten) LIKE '%VIP%'"));
        data.put("vocabularyCount", count("SELECT COUNT(*) FROM tu_vung"));
        data.put("kanjiCount", count("SELECT COUNT(*) FROM chu_han"));
        data.put("grammarCount", count("SELECT COUNT(*) FROM ngu_phap"));
        data.put("exerciseAttempts", count("SELECT COUNT(*) FROM luot_lam_bai_tap"));
        data.put("examAttempts", count("SELECT COUNT(*) FROM luot_lam_de_thi"));
        data.put("flashcardReviews", count("SELECT COUNT(*) FROM tien_do_the_ghi_nho"));
        data.put("studyToday", count("""
                SELECT COUNT(*) FROM (
                    SELECT nop_luc FROM luot_lam_bai_tap WHERE DATE(nop_luc) = CURRENT_DATE
                    UNION ALL
                    SELECT nop_luc FROM luot_lam_de_thi WHERE DATE(nop_luc) = CURRENT_DATE
                    UNION ALL
                    SELECT on_lan_cuoi_luc FROM tien_do_the_ghi_nho WHERE DATE(on_lan_cuoi_luc) = CURRENT_DATE
                ) t
                """));
        data.put("activeUsersByDay", rows("""
                SELECT DATE(day_value) AS label, COUNT(DISTINCT nguoi_dung_id) AS value
                FROM (
                    SELECT nop_luc AS day_value, nguoi_dung_id FROM luot_lam_bai_tap WHERE nop_luc >= CURRENT_DATE - INTERVAL 6 DAY
                    UNION ALL
                    SELECT nop_luc AS day_value, nguoi_dung_id FROM luot_lam_de_thi WHERE nop_luc >= CURRENT_DATE - INTERVAL 6 DAY
                    UNION ALL
                    SELECT on_lan_cuoi_luc AS day_value, nguoi_dung_id FROM tien_do_the_ghi_nho WHERE on_lan_cuoi_luc >= CURRENT_DATE - INTERVAL 6 DAY
                ) t
                GROUP BY DATE(day_value)
                ORDER BY DATE(day_value)
                """));
        data.put("wordsStudiedByDay", rows("""
                SELECT DATE(luu_luc) AS label, COUNT(*) AS value
                FROM tien_do_hoc
                WHERE loai_noi_dung = 'VOCABULARY'
                  AND luu_luc >= CURRENT_DATE - INTERVAL 6 DAY
                GROUP BY DATE(luu_luc)
                ORDER BY DATE(luu_luc)
                """));
        data.put("newUsers", rows("""
                SELECT id, email, ho_ten AS fullName, tao_luc AS createdAt
                FROM nguoi_dung
                ORDER BY tao_luc DESC, id DESC
                LIMIT 5
                """));
        data.put("newLessons", rows("""
                SELECT id, tieu_de AS title, cap_do_id AS levelId
                FROM ngu_phap
                ORDER BY id DESC
                LIMIT 5
                """));
        data.put("topLearners", rows("""
                SELECT u.id, u.email, u.ho_ten AS fullName, COUNT(*) AS total
                FROM nguoi_dung u
                JOIN (
                    SELECT nguoi_dung_id FROM luot_lam_bai_tap
                    UNION ALL
                    SELECT nguoi_dung_id FROM luot_lam_de_thi
                    UNION ALL
                    SELECT nguoi_dung_id FROM tien_do_the_ghi_nho
                ) activity ON activity.nguoi_dung_id = u.id
                GROUP BY u.id, u.email, u.ho_ten
                ORDER BY total DESC
                LIMIT 5
                """));
        data.put("popularLessons", rows("""
                SELECT g.id, g.tieu_de AS title, g.cap_do_id AS levelId, COUNT(ugl.id) AS total
                FROM ngu_phap g
                LEFT JOIN tien_do_hoc ugl
                    ON ugl.loai_noi_dung = 'GRAMMAR_LESSON'
                   AND ugl.noi_dung_id = g.id
                GROUP BY g.id, g.tieu_de, g.cap_do_id
                ORDER BY total DESC, g.id DESC
                LIMIT 5
                """));
        data.put("answerRatio", rows("""
                SELECT 'Dung' AS label, COALESCE(SUM(so_cau_dung), 0) AS value FROM luot_lam_bai_tap
                UNION ALL
                SELECT 'Sai' AS label, COALESCE(SUM(so_cau_sai), 0) AS value FROM luot_lam_bai_tap
                """));
        return data;
    }

    private Integer count(String sql) {
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }

    private List<Map<String, Object>> rows(String sql) {
        return jdbcTemplate.queryForList(sql);
    }
}
