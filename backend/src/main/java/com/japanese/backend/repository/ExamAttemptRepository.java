package com.japanese.backend.repository;

import com.japanese.backend.entity.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {
    List<ExamAttempt> findByUserIdAndExamSetIdOrderBySubmittedAtDesc(Long userId, Long examSetId);
    List<ExamAttempt> findByUserIdOrderBySubmittedAtDesc(Long userId);
    Optional<ExamAttempt> findByIdAndUserId(Long id, Long userId);
}
