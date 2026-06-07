package com.japanese.backend.repository;

import com.japanese.backend.entity.ExerciseSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseSetRepository extends JpaRepository<ExerciseSet, Long> {
    List<ExerciseSet> findByLevelId(Long levelId);

    boolean existsByTitle(String title);
}
