package com.japanese.backend.service;

import com.japanese.backend.dto.ExamSubmitRequest;
import com.japanese.backend.dto.ExamAttemptDtos.AttemptDetail;
import com.japanese.backend.dto.ExamAttemptDtos.AttemptSummary;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japanese.backend.entity.ExamAttempt;
import com.japanese.backend.entity.ExamAttemptAnswer;
import com.japanese.backend.entity.ExamChoice;
import com.japanese.backend.entity.ExamQuestion;
import com.japanese.backend.entity.ExamSet;
import com.japanese.backend.entity.User;
import com.japanese.backend.repository.ExamAttemptRepository;
import com.japanese.backend.repository.ExamSetRepository;
import com.japanese.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamSetRepository examSetRepository;
    private final ExamAttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public List<ExamSet> getExams(Long levelId) {
        return levelId == null ? examSetRepository.findAll() : examSetRepository.findByLevelId(levelId);
    }

    public List<ExamSet> getPublishedExams(Long levelId) {
        return getPublishedExams(levelId, null);
    }

    public List<ExamSet> getPublishedExams(Long levelId, String email) {
        List<ExamSet> exams = levelId == null
                ? examSetRepository.findByStatusIgnoreCase("PUBLISHED")
                : examSetRepository.findByLevelIdAndStatusIgnoreCase(levelId, "PUBLISHED");
        return decorateAccess(exams, isVipOrAdmin(email));
    }

    public ExamSet getExam(Long id) {
        return examSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề thi"));
    }

    public ExamSet getPublishedExam(Long id, String email) {
        ExamSet exam = getExam(id);
        if (!"PUBLISHED".equalsIgnoreCase(exam.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay de thi");
        }
        assertExamAccess(exam, email);
        exam.setDisplayOrder(getDisplayOrder(exam));
        exam.setVipOnly(isVipOnly(exam));
        exam.setLocked(Boolean.FALSE);
        return exam;
    }

    public ExamSet create(ExamSet examSet) {
        bindQuestions(examSet);
        validateExamSet(examSet);
        return examSetRepository.save(examSet);
    }

    public ExamSet update(Long id, ExamSet payload) {
        ExamSet existing = getExam(id);
        existing.setTitle(payload.getTitle());
        existing.setDescription(payload.getDescription());
        existing.setExamCode(payload.getExamCode());
        existing.setStatus(payload.getStatus());
        existing.setMonth(payload.getMonth());
        existing.setYear(payload.getYear());
        existing.setTags(payload.getTags());
        existing.setFolderSlug(payload.getFolderSlug());
        existing.setAudioUrl(payload.getAudioUrl());
        existing.setLevelId(payload.getLevelId());
        existing.setDurationMinutes(payload.getDurationMinutes());
        existing.setAvailableFrom(payload.getAvailableFrom());
        existing.setAllowAnswerReview(payload.getAllowAnswerReview());
        existing.setAllowRetake(payload.getAllowRetake());
        existing.setMaxAttempts(payload.getMaxAttempts());
        if (existing.getSections() == null) {
            existing.setSections(payload.getSections());
        } else {
            existing.getSections().clear();
            if (payload.getSections() != null) {
                existing.getSections().addAll(payload.getSections());
            }
        }
        if (existing.getQuestions() == null) {
            existing.setQuestions(payload.getQuestions());
        } else {
            existing.getQuestions().clear();
            if (payload.getQuestions() != null) {
                existing.getQuestions().addAll(payload.getQuestions());
            }
        }
        bindQuestions(existing);
        validateExamSet(existing);
        return examSetRepository.save(existing);
    }

    public void delete(Long id) {
        examSetRepository.deleteById(id);
    }

    public ExamAttempt submit(Long userId, ExamSubmitRequest request) {
        ExamSet exam = getExam(request.getExamSetId());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui long dang nhap"));
        assertExamAccess(exam, user.getEmail());
        Integer maxAttempts = exam.getMaxAttempts();
        if (maxAttempts != null && maxAttempts > 0
                && attemptRepository.findByUserIdAndExamSetIdOrderBySubmittedAtDesc(userId, exam.getId()).size() >= maxAttempts) {
            throw new RuntimeException("Bạn đã đạt số lần làm tối đa của đề này");
        }

        int correct = 0;
        int total = 0;
        List<ExamAttemptAnswer> answerRows = new ArrayList<>();
        Map<Long, Long> submittedAnswers = request.getAnswers() == null ? Map.of() : request.getAnswers();

        for (ExamQuestion question : collectQuestions(exam)) {
            total++;
            Long selectedChoiceId = submittedAnswers.get(question.getId());
            List<ExamChoice> choices = question.getChoices() == null ? List.of() : question.getChoices();
            Long correctChoiceId = choices.stream()
                    .filter(choice -> Boolean.TRUE.equals(choice.getIsCorrect()))
                    .map(ExamChoice::getId)
                    .findFirst()
                    .orElse(null);
            boolean isCorrect = false;

            for (ExamChoice choice : choices) {
                if (choice.getId() != null && choice.getId().equals(selectedChoiceId) && Boolean.TRUE.equals(choice.getIsCorrect())) {
                    correct++;
                    isCorrect = true;
                }
            }

            ExamAttemptAnswer answer = new ExamAttemptAnswer();
            answer.setQuestionId(question.getId());
            answer.setSelectedChoiceId(selectedChoiceId);
            answer.setCorrectChoiceId(correctChoiceId);
            answer.setIsCorrect(isCorrect);
            answerRows.add(answer);
        }

        double score = total == 0 ? 0 : (double) correct / total * 10;

        ExamAttempt attempt = new ExamAttempt();
        attempt.setUserId(userId);
        attempt.setExamSetId(exam.getId());
        attempt.setCorrectCount(correct);
        attempt.setWrongCount(total - correct);
        attempt.setScore(score);
        attempt.setSubmittedAt(LocalDateTime.now());

        attempt.setAnswersJson(writeAnswers(answerRows));
        return attemptRepository.save(attempt);
    }

    public List<AttemptSummary> getRecentAttempts(Long userId) {
        return attemptRepository.findByUserIdOrderBySubmittedAtDesc(userId).stream()
                .map(attempt -> {
                    ExamSet exam = examSetRepository.findById(attempt.getExamSetId()).orElse(null);
                    return new AttemptSummary(
                            attempt.getId(),
                            attempt.getExamSetId(),
                            exam == null ? "Đề JLPT" : exam.getTitle(),
                            exam == null ? null : exam.getLevelId(),
                            attempt.getScore(),
                            attempt.getCorrectCount(),
                            attempt.getWrongCount(),
                            attempt.getSubmittedAt() == null ? null : attempt.getSubmittedAt().toString()
                    );
                })
                .toList();
    }

    public AttemptDetail getAttemptDetail(Long userId, Long attemptId) {
        ExamAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ket qua"));
        ExamSet exam = getExam(attempt.getExamSetId());
        List<ExamAttemptAnswer> answers = readAnswers(attempt.getAnswersJson());
        return new AttemptDetail(attempt, exam, answers);
    }

    private void bindQuestions(ExamSet examSet) {
        if (examSet.getStatus() == null || examSet.getStatus().isBlank()) {
            examSet.setStatus("DRAFT");
        }
        if (examSet.getAllowAnswerReview() == null) {
            examSet.setAllowAnswerReview(Boolean.TRUE);
        }
        if (examSet.getAllowRetake() == null) {
            examSet.setAllowRetake(Boolean.TRUE);
        }
        long[] nextQuestionId = {nextQuestionId(examSet)};
        if (examSet.getSections() != null) {
            int sectionIndex = 1;
            for (var section : examSet.getSections()) {
                if (section.getId() == null) section.setId((long) sectionIndex);
                section.setExamSet(examSet);
                if (section.getOrderIndex() == null) section.setOrderIndex(sectionIndex);
                if (section.getAllowBack() == null) section.setAllowBack(Boolean.TRUE);
                if (section.getAllowEarlySubmit() == null) section.setAllowEarlySubmit(Boolean.TRUE);
                if (section.getAutoSubmit() == null) section.setAutoSubmit(Boolean.TRUE);
                if (section.getScored() == null) section.setScored(Boolean.TRUE);
                if (section.getParts() != null) {
                    int partIndex = 1;
                    for (var part : section.getParts()) {
                        if (part.getId() == null) part.setId((long) partIndex);
                        part.setSection(section);
                        if (part.getOrderIndex() == null) part.setOrderIndex(partIndex);
                        if (part.getGroups() != null) {
                            int groupIndex = 1;
                            for (var group : part.getGroups()) {
                                if (group.getId() == null) group.setId((long) groupIndex);
                                group.setPart(part);
                                if (group.getOrderIndex() == null) group.setOrderIndex(groupIndex);
                                if (group.getQuestions() != null) {
                                    int questionIndex = 1;
                                    for (ExamQuestion question : group.getQuestions()) {
                                        if (question.getId() == null) question.setId(nextQuestionId[0]++);
                                        question.setGroup(group);
                                        question.setPart(part);
                                        question.setExamSet(examSet);
                                        if (question.getQuestionOrder() == null) question.setQuestionOrder(questionIndex);
                                        bindChoices(question);
                                        questionIndex++;
                                    }
                                }
                                groupIndex++;
                            }
                        }
                        partIndex++;
                    }
                }
                sectionIndex++;
            }
        }
        if (examSet.getQuestions() == null) {
            return;
        }
        for (ExamQuestion question : examSet.getQuestions()) {
            if (question.getId() == null) question.setId(nextQuestionId[0]++);
            question.setExamSet(examSet);
            bindChoices(question);
        }
    }

    private long nextQuestionId(ExamSet examSet) {
        return collectQuestions(examSet).stream()
                .map(ExamQuestion::getId)
                .filter(id -> id != null)
                .mapToLong(Long::longValue)
                .max()
                .orElse(0L) + 1L;
    }

    private void bindChoices(ExamQuestion question) {
        if (question.getChoices() == null) {
            return;
        }
        int choiceIndex = 1;
        for (ExamChoice choice : question.getChoices()) {
            choice.setQuestion(question);
            if (choice.getId() == null) {
                choice.setId((long) choiceIndex);
            }
            if (choice.getChoiceOrder() == null) {
                choice.setChoiceOrder(choiceIndex);
            }
            choiceIndex++;
        }
    }

    private String writeAnswers(List<ExamAttemptAnswer> answers) {
        try {
            return objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Khong the luu chi tiet dap an de thi", ex);
        }
    }

    private List<ExamAttemptAnswer> readAnswers(String answersJson) {
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

    private void validateExamSet(ExamSet examSet) {
        if (examSet == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Du lieu de thi khong hop le");
        }
        if (isBlank(examSet.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten de thi la bat buoc");
        }
        if (examSet.getLevelId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cap do de thi la bat buoc");
        }
        if (examSet.getDurationMinutes() != null && examSet.getDurationMinutes() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thoi gian lam bai phai lon hon 0");
        }
        List<ExamQuestion> questions = collectQuestions(examSet);
        if (questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "De thi phai co it nhat 1 cau hoi");
        }
        for (int i = 0; i < questions.size(); i++) {
            ExamQuestion question = questions.get(i);
            if (question == null || isBlank(question.getQuestionText())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cau hoi #" + (i + 1) + " chua co noi dung");
            }
            List<ExamChoice> choices = question.getChoices() == null ? List.of() : question.getChoices().stream()
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

    private List<ExamQuestion> collectQuestions(ExamSet exam) {
        List<ExamQuestion> questions = new ArrayList<>();
        if (exam.getSections() != null) {
            exam.getSections().stream()
                    .sorted(Comparator.comparing(section -> section.getOrderIndex() == null ? 0 : section.getOrderIndex()))
                    .forEach(section -> {
                        if (section.getParts() == null) return;
                        section.getParts().stream()
                                .sorted(Comparator.comparing(part -> part.getOrderIndex() == null ? 0 : part.getOrderIndex()))
                                .forEach(part -> {
                                    if (part.getGroups() == null) return;
                                    part.getGroups().stream()
                                            .sorted(Comparator.comparing(group -> group.getOrderIndex() == null ? 0 : group.getOrderIndex()))
                                            .forEach(group -> {
                                                if (group.getQuestions() == null) return;
                                                group.getQuestions().stream()
                                                        .sorted(Comparator.comparing(question -> question.getQuestionOrder() == null ? 0 : question.getQuestionOrder()))
                                                        .forEach(questions::add);
                                            });
                                });
                    });
        }
        if (questions.isEmpty() && exam.getQuestions() != null) {
            questions.addAll(exam.getQuestions());
        }
        return questions;
    }

    private List<ExamSet> decorateAccess(List<ExamSet> exams, boolean vip) {
        exams.sort(Comparator
                .comparing((ExamSet exam) -> exam.getLevelId() == null ? 0L : exam.getLevelId())
                .thenComparing(this::titleNumber)
                .thenComparing(exam -> exam.getId() == null ? 0L : exam.getId()));
        Long currentLevel = null;
        int levelOrder = 0;
        for (ExamSet exam : exams) {
            Long level = exam.getLevelId();
            if (currentLevel == null || !currentLevel.equals(level)) {
                currentLevel = level;
                levelOrder = 1;
            } else {
                levelOrder++;
            }
            boolean vipOnly = levelOrder > 2;
            exam.setDisplayOrder(levelOrder);
            exam.setVipOnly(vipOnly);
            exam.setLocked(vipOnly && !vip);
        }
        return exams;
    }

    private void assertExamAccess(ExamSet exam, String email) {
        if (isVipOnly(exam) && !isVipOrAdmin(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "De nay danh cho tai khoan VIP");
        }
    }

    private boolean isVipOnly(ExamSet exam) {
        return getDisplayOrder(exam) > 2;
    }

    private int getDisplayOrder(ExamSet exam) {
        Long older = examSetRepository.countByLevelIdAndStatusIgnoreCaseAndIdLessThan(
                exam.getLevelId(),
                "PUBLISHED",
                exam.getId()
        );
        return older == null ? 1 : older.intValue() + 1;
    }

    private boolean isVipOrAdmin(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return userRepository.findByEmail(email)
                .map(user -> {
                    String role = user.getRole() == null || user.getRole().getName() == null
                            ? "USER"
                            : user.getRole().getName().toUpperCase(Locale.ROOT);
                    boolean activeVip = user.getVipExpiresAt() != null && user.getVipExpiresAt().isAfter(LocalDateTime.now());
                    return role.contains("ADMIN") || role.contains("VIP") || activeVip;
                })
                .orElse(false);
    }

    private int titleNumber(ExamSet exam) {
        try {
            return Integer.parseInt(String.valueOf(exam.getTitle()).trim());
        } catch (NumberFormatException ignored) {
            return Integer.MAX_VALUE;
        }
    }
}
