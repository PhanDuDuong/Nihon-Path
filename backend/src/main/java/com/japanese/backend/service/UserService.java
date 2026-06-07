package com.japanese.backend.service;

import com.japanese.backend.dto.UpdateProfileRequest;
import com.japanese.backend.dto.UserProfileResponse;
import com.japanese.backend.entity.User;
import com.japanese.backend.entity.UserLearningItem;
import com.japanese.backend.repository.UserLearningItemRepository;
import com.japanese.backend.repository.UserRepository;
import com.japanese.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final UserLearningItemRepository learningItemRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FlashcardDeckService flashcardDeckService;

    public Long getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"))
                .getId();
    }

    public UserLearningItem saveVocabulary(Long userId, Long vocabId) {
        UserLearningItem saved = saveLearningItem(userId, UserLearningItem.TYPE_VOCABULARY, vocabId);
        flashcardDeckService.addVocabularyToSavedDeck(userId, vocabId);
        return saved;
    }

    public List<UserLearningItem> getSavedVocabularies(Long userId) {
        return learningItemRepo.findByUserIdAndItemType(userId, UserLearningItem.TYPE_VOCABULARY);
    }

    public UserLearningItem updateVocabularyProgress(
            Long userId,
            Long vocabId,
            String learningStatus,
            Boolean bookmarked
    ) {
        UserLearningItem item = saveVocabulary(userId, vocabId);
        applyProgress(item, learningStatus, bookmarked);
        UserLearningItem saved = learningItemRepo.save(item);
        if (Boolean.FALSE.equals(saved.getIsBookmarked())) {
            flashcardDeckService.removeVocabularyFromSavedDeck(userId, vocabId);
        }
        return saved;
    }

    public UserLearningItem saveKanji(Long userId, Long kanjiId) {
        return saveLearningItem(userId, UserLearningItem.TYPE_KANJI, kanjiId);
    }

    public List<UserLearningItem> getSavedKanjis(Long userId) {
        return learningItemRepo.findByUserIdAndItemType(userId, UserLearningItem.TYPE_KANJI);
    }

    public UserLearningItem updateKanjiProgress(
            Long userId,
            Long kanjiId,
            String learningStatus,
            Boolean bookmarked
    ) {
        UserLearningItem item = saveKanji(userId, kanjiId);
        applyProgress(item, learningStatus, bookmarked);
        return learningItemRepo.save(item);
    }

    public UserLearningItem saveGrammarLesson(Long userId, Long lessonId) {
        return saveLearningItem(userId, UserLearningItem.TYPE_GRAMMAR_LESSON, lessonId);
    }

    public List<UserLearningItem> getSavedGrammarLessons(Long userId) {
        return learningItemRepo.findByUserIdAndItemType(userId, UserLearningItem.TYPE_GRAMMAR_LESSON);
    }

    public UserLearningItem updateGrammarProgress(
            Long userId,
            Long lessonId,
            String learningStatus,
            Boolean bookmarked
    ) {
        UserLearningItem item = saveGrammarLesson(userId, lessonId);
        applyProgress(item, learningStatus, bookmarked);
        return learningItemRepo.save(item);
    }

    public UserProfileResponse getProfile(String email) {
        User user = findUserByEmail(email);
        return toProfileResponse(user, null);
    }

    public UserProfileResponse updateProfile(String currentEmail, UpdateProfileRequest request) {
        if (request == null) {
            throw new RuntimeException("Vui lòng nhập thông tin cần cập nhật");
        }

        User user = findUserByEmail(currentEmail);

        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName().trim());
        }

        if (StringUtils.hasText(request.getEmail())) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!EMAIL_PATTERN.matcher(newEmail).matches()) {
                throw new RuntimeException("Email không đúng định dạng");
            }
            if (!newEmail.equalsIgnoreCase(user.getEmail())
                    && userRepository.findByEmail(newEmail).isPresent()) {
                throw new RuntimeException("Email đã tồn tại");
            }
            user.setEmail(newEmail);
        }

        if (StringUtils.hasText(request.getNewPassword())) {
            if (!StringUtils.hasText(request.getCurrentPassword())) {
                throw new RuntimeException("Vui lòng nhập mật khẩu hiện tại");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Mật khẩu hiện tại không đúng");
            }
            if (request.getNewPassword().length() < 8) {
                throw new RuntimeException("Mật khẩu mới phải có ít nhất 8 ký tự");
            }
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new RuntimeException("Mật khẩu xác nhận chưa khớp");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepository.save(user);
        return toProfileResponse(saved, jwtService.generateToken(saved.getEmail()));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
    }

    private UserProfileResponse toProfileResponse(User user, String token) {
        String role = user.getRole() != null ? user.getRole().getName() : "USER";
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                role,
                user.getStatus(),
                user.getIsVerified(),
                user.getVipExpiresAt(),
                token
        );
    }

    private void applyProgress(UserLearningItem item, String learningStatus, Boolean bookmarked) {
        if (StringUtils.hasText(learningStatus)) {
            item.setLearningStatus(normalizeLearningStatus(learningStatus));
        }
        if (bookmarked != null) {
            item.setIsBookmarked(bookmarked);
        }
    }

    private UserLearningItem saveLearningItem(Long userId, String itemType, Long itemId) {
        return learningItemRepo.findByUserIdAndItemTypeAndItemId(userId, itemType, itemId)
                .map(existing -> {
                    existing.setIsBookmarked(true);
                    return learningItemRepo.save(existing);
                })
                .orElseGet(() -> {
                    UserLearningItem item = new UserLearningItem();
                    item.setUserId(userId);
                    item.setItemType(itemType);
                    item.setItemId(itemId);
                    item.setLearningStatus("NEW");
                    item.setIsBookmarked(true);
                    item.setSavedAt(LocalDateTime.now());
                    return learningItemRepo.save(item);
                });
    }

    private String normalizeLearningStatus(String learningStatus) {
        String normalized = learningStatus.trim().toUpperCase();
        if (!normalized.equals("NEW") && !normalized.equals("LEARNING") && !normalized.equals("MASTERED")) {
            throw new RuntimeException("Trạng thái học không hợp lệ");
        }
        return normalized;
    }
}
