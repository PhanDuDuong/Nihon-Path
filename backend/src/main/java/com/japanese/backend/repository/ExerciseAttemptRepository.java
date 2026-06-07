package com.japanese.backend.repository;

import com.japanese.backend.entity.ExerciseAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttempt, Long> {

    List<ExerciseAttempt> findByUserIdOrderBySubmittedAtDesc(Long userId);

    Optional<ExerciseAttempt> findByIdAndUserId(Long id, Long userId);

    Optional<ExerciseAttempt> findTopByUserIdAndExerciseSetIdOrderBySubmittedAtDesc(Long userId, Long exerciseSetId);
}
