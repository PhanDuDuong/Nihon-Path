package com.japanese.backend.repository;

import com.japanese.backend.entity.ExamSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamSetRepository extends JpaRepository<ExamSet, Long> {
    List<ExamSet> findByLevelId(Long levelId);
    List<ExamSet> findByStatusIgnoreCase(String status);
    List<ExamSet> findByLevelIdAndStatusIgnoreCase(Long levelId, String status);
    Long countByLevelIdAndStatusIgnoreCaseAndIdLessThan(Long levelId, String status, Long id);
}
