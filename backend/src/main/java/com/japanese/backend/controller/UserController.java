package com.japanese.backend.controller;

import com.japanese.backend.dto.LearningProgressRequest;
import com.japanese.backend.dto.UpdateProfileRequest;
import com.japanese.backend.dto.UserProfileResponse;
import com.japanese.backend.entity.UserLearningItem;
import com.japanese.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileResponse me(Principal principal) {
        return userService.getProfile(principal.getName());
    }

    @PutMapping("/profile")
    public UserProfileResponse updateProfile(@RequestBody UpdateProfileRequest request, Principal principal) {
        return userService.updateProfile(principal.getName(), request);
    }

    @PostMapping("/vocabularies")
    public UserLearningItem saveVocab(@RequestParam Long vocabId, Principal principal) {
        return userService.saveVocabulary(currentUserId(principal), vocabId);
    }

    @GetMapping("/vocabularies")
    public List<UserLearningItem> getSavedVocabularies(Principal principal) {
        return userService.getSavedVocabularies(currentUserId(principal));
    }

    @PutMapping("/vocabularies/{vocabId}/progress")
    public UserLearningItem updateVocabularyProgress(
            @PathVariable Long vocabId,
            @RequestBody LearningProgressRequest request,
            Principal principal
    ) {
        return userService.updateVocabularyProgress(
                currentUserId(principal),
                vocabId,
                request.getLearningStatus(),
                request.getBookmarked()
        );
    }

    @PostMapping("/kanjis")
    public UserLearningItem saveKanji(@RequestParam Long kanjiId, Principal principal) {
        return userService.saveKanji(currentUserId(principal), kanjiId);
    }

    @GetMapping("/kanjis")
    public List<UserLearningItem> getSavedKanjis(Principal principal) {
        return userService.getSavedKanjis(currentUserId(principal));
    }

    @PutMapping("/kanjis/{kanjiId}/progress")
    public UserLearningItem updateKanjiProgress(
            @PathVariable Long kanjiId,
            @RequestBody LearningProgressRequest request,
            Principal principal
    ) {
        return userService.updateKanjiProgress(
                currentUserId(principal),
                kanjiId,
                request.getLearningStatus(),
                request.getBookmarked()
        );
    }

    @PostMapping("/grammar-lessons")
    public UserLearningItem saveGrammarLesson(@RequestParam Long lessonId, Principal principal) {
        return userService.saveGrammarLesson(currentUserId(principal), lessonId);
    }

    @GetMapping("/grammar-lessons")
    public List<UserLearningItem> getSavedGrammarLessons(Principal principal) {
        return userService.getSavedGrammarLessons(currentUserId(principal));
    }

    @PutMapping("/grammar-lessons/{lessonId}/progress")
    public UserLearningItem updateGrammarProgress(
            @PathVariable Long lessonId,
            @RequestBody LearningProgressRequest request,
            Principal principal
    ) {
        return userService.updateGrammarProgress(
                currentUserId(principal),
                lessonId,
                request.getLearningStatus(),
                request.getBookmarked()
        );
    }

    private Long currentUserId(Principal principal) {
        return userService.getUserIdByEmail(principal.getName());
    }
}
