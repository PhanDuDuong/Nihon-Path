package com.japanese.backend.repository;

import com.japanese.backend.entity.GrammarLesson;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GrammarLessonRepository extends JpaRepository<GrammarLesson, Long> {
    List<GrammarLesson> findByLevelId(Long levelId);

    @Query("""
            select g from GrammarLesson g
            where lower(coalesce(g.title, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(g.grammarPattern, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(g.meaningVi, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(g.usageText, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(g.noteText, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(g.comparisonText, '')) like lower(concat('%', :q, '%'))
            order by g.levelId asc, g.id asc
            """)
    List<GrammarLesson> searchForAi(@Param("q") String q, Pageable pageable);
}
