package com.japanese.backend.service;

import com.japanese.backend.dto.SubmitRequest;
import com.japanese.backend.dto.ExerciseAttemptDtos.ExerciseAttemptAnswerDto;
import com.japanese.backend.dto.ExerciseAttemptDtos.ExerciseAttemptDetail;
import com.japanese.backend.dto.ExerciseAttemptDtos.ExerciseAttemptSummary;
import com.japanese.backend.entity.ExerciseAttempt;
import com.japanese.backend.entity.ExerciseChoice;
import com.japanese.backend.entity.ExerciseQuestion;
import com.japanese.backend.entity.ExerciseSet;
import com.japanese.backend.repository.ExerciseAttemptRepository;
import com.japanese.backend.repository.ExerciseSetRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseSetRepository exerciseSetRepository;
    private final ExerciseAttemptRepository attemptRepository;
    private final ObjectMapper objectMapper;

    public List<ExerciseSet> getExercises(Long levelId) {
        return levelId == null ? exerciseSetRepository.findAll() : exerciseSetRepository.findByLevelId(levelId);
    }

    public ExerciseSet getExercise(Long id) {
        return exerciseSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài tập"));
    }

    public ExerciseSet create(ExerciseSet exerciseSet) {
        if (exerciseSet.getCreatedBy() == null) {
            exerciseSet.setCreatedBy(3L);
        }
        validateExerciseSet(exerciseSet);
        bindQuestions(exerciseSet);
        return exerciseSetRepository.save(exerciseSet);
    }

    public ExerciseSet update(Long id, ExerciseSet payload) {
        ExerciseSet existing = getExercise(id);
        existing.setTitle(payload.getTitle());
        existing.setDescription(payload.getDescription());
        existing.setTags(payload.getTags());
        existing.setGrammarLessonId(payload.getGrammarLessonId());
        existing.setLevelId(payload.getLevelId());
        existing.setExerciseType(payload.getExerciseType());
        existing.setSourceUrl(payload.getSourceUrl());
        if (payload.getCreatedBy() != null) {
            existing.setCreatedBy(payload.getCreatedBy());
        }
        if (existing.getQuestions() == null) {
            existing.setQuestions(payload.getQuestions());
        } else {
            existing.getQuestions().clear();
            if (payload.getQuestions() != null) {
                existing.getQuestions().addAll(payload.getQuestions());
            }
        }
        validateExerciseSet(existing);
        bindQuestions(existing);
        return exerciseSetRepository.save(existing);
    }

    public void delete(Long id) {
        exerciseSetRepository.deleteById(id);
    }

    public ExerciseAttempt submit(Long userId, SubmitRequest request) {
        ExerciseSet set = getExercise(request.getExerciseSetId());

        int correct = 0;
        int total = 0;
        Map<Long, Long> submittedAnswers = request.getAnswers() == null ? Map.of() : request.getAnswers();
        List<ExerciseAttemptAnswerDto> answerRows = new ArrayList<>();

        List<ExerciseQuestion> questions = set.getQuestions() == null ? List.of() : set.getQuestions();
        for (ExerciseQuestion question : questions) {
            total++;
            Long selectedChoiceId = submittedAnswers.get(question.getId());
            Long correctChoiceId = null;
            boolean questionCorrect = false;

            List<ExerciseChoice> choices = question.getChoices() == null ? List.of() : question.getChoices();
            for (ExerciseChoice choice : choices) {
                if (Boolean.TRUE.equals(choice.getIsCorrect())) {
                    correctChoiceId = choice.getId();
                }
                if (choice.getId().equals(selectedChoiceId) && Boolean.TRUE.equals(choice.getIsCorrect())) {
                    questionCorrect = true;
                }
            }
            if (questionCorrect) {
                correct++;
            }
            answerRows.add(new ExerciseAttemptAnswerDto(
                    question.getId(),
                    selectedChoiceId,
                    correctChoiceId,
                    questionCorrect
            ));
        }

        double score = total == 0 ? 0 : (double) correct / total * 10;

        ExerciseAttempt attempt = new ExerciseAttempt();
        attempt.setUserId(userId);
        attempt.setExerciseSetId(set.getId());
        attempt.setCorrectCount(correct);
        attempt.setWrongCount(total - correct);
        attempt.setScore(score);
        attempt.setAnswersJson(writeAnswers(answerRows));
        attempt.setSubmittedAt(LocalDateTime.now());

        return attemptRepository.save(attempt);
    }

    public List<ExerciseAttemptSummary> getAttempts(Long userId) {
        return attemptRepository.findByUserIdOrderBySubmittedAtDesc(userId).stream()
                .map(attempt -> {
                    ExerciseSet exercise = exerciseSetRepository.findById(attempt.getExerciseSetId()).orElse(null);
                    return new ExerciseAttemptSummary(
                            attempt.getId(),
                            attempt.getExerciseSetId(),
                            exercise == null ? "Bai tap" : exercise.getTitle(),
                            exercise == null ? null : exercise.getLevelId(),
                            attempt.getScore(),
                            attempt.getCorrectCount(),
                            attempt.getWrongCount(),
                            attempt.getSubmittedAt() == null ? null : attempt.getSubmittedAt().toString()
                    );
                })
                .toList();
    }

    public ExerciseAttemptDetail getAttemptDetail(Long userId, Long attemptId) {
        ExerciseAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ket qua bai tap"));
        ExerciseSet exercise = getExercise(attempt.getExerciseSetId());
        return new ExerciseAttemptDetail(attempt, exercise, readAnswers(attempt.getAnswersJson()));
    }

    private String writeAnswers(List<ExerciseAttemptAnswerDto> answers) {
        try {
            return objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Khong the luu chi tiet dap an bai tap", ex);
        }
    }

    private List<ExerciseAttemptAnswerDto> readAnswers(String answersJson) {
        if (answersJson == null || answersJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(answersJson, new TypeReference<>() {
            });
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private void validateExerciseSet(ExerciseSet exerciseSet) {
        if (exerciseSet == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Du lieu bai tap khong hop le");
        }
        if (isBlank(exerciseSet.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten bai tap la bat buoc");
        }
        if (exerciseSet.getLevelId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cap do bai tap la bat buoc");
        }
        List<ExerciseQuestion> questions = exerciseSet.getQuestions() == null ? List.of() : exerciseSet.getQuestions();
        if (questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bai tap phai co it nhat 1 cau hoi");
        }
        for (int i = 0; i < questions.size(); i++) {
            ExerciseQuestion question = questions.get(i);
            if (question == null || isBlank(question.getQuestionText())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cau hoi #" + (i + 1) + " chua co noi dung");
            }
            List<ExerciseChoice> choices = question.getChoices() == null ? List.of() : question.getChoices().stream()
                    .filter(choice -> choice != null && !isBlank(choice.getChoiceText()))
                    .toList();
            if (choices.size() < 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cau hoi #" + (i + 1) + " phai co it nhat 2 dap an");
            }
            long correctCount = choices.stream().filter(choice -> Boolean.TRUE.equals(choice.getIsCorrect())).count();
            if (correctCount != 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cau hoi #" + (i + 1) + " phai co dung 1 dap an dung");
            }
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void bindQuestions(ExerciseSet exerciseSet) {
        if (exerciseSet.getQuestions() == null) {
            return;
        }
        long nextQuestionId = exerciseSet.getQuestions().stream()
                .map(ExerciseQuestion::getId)
                .filter(id -> id != null)
                .mapToLong(Long::longValue)
                .max()
                .orElse(0L) + 1L;
        int questionIndex = 1;
        for (ExerciseQuestion question : exerciseSet.getQuestions()) {
            question.setExerciseSet(exerciseSet);
            if (question.getId() == null) {
                question.setId(nextQuestionId++);
            }
            if (question.getQuestionOrder() == null) {
                question.setQuestionOrder(questionIndex);
            }
            if (question.getChoices() == null) {
                questionIndex++;
                continue;
            }
            int choiceIndex = 1;
            for (ExerciseChoice choice : question.getChoices()) {
                choice.setQuestion(question);
                if (choice.getId() == null) {
                    choice.setId((long) choiceIndex);
                }
                if (choice.getChoiceOrder() == null) {
                    choice.setChoiceOrder(choiceIndex);
                }
                choiceIndex++;
            }
            questionIndex++;
        }
    }
}
