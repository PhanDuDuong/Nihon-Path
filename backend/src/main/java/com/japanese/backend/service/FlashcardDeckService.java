package com.japanese.backend.service;

import com.japanese.backend.dto.CreateFlashcardDeckRequest;
import com.japanese.backend.dto.FlashcardDeckDtos.DeckDetail;
import com.japanese.backend.dto.FlashcardDeckDtos.DeckSummary;
import com.japanese.backend.dto.FlashcardDeckDtos.ImportResult;
import com.japanese.backend.dto.FlashcardDeckDtos.SelectableDeck;
import com.japanese.backend.dto.FlashcardDeckDtos.SelectableDeckResponse;
import com.japanese.backend.dto.ImportTextFlashcardRequest;
import com.japanese.backend.dto.ManualFlashcardRequest;
import com.japanese.backend.dto.ReorderFlashcardDeckRequest;
import com.japanese.backend.dto.UpdateFlashcardRequest;
import com.japanese.backend.entity.Flashcard;
import com.japanese.backend.entity.FlashcardDeck;
import com.japanese.backend.entity.FlashcardDeckCard;
import com.japanese.backend.entity.FlashcardProgress;
import com.japanese.backend.entity.UserLearningItem;
import com.japanese.backend.entity.Vocabulary;
import com.japanese.backend.repository.FlashcardDeckCardRepository;
import com.japanese.backend.repository.FlashcardDeckRepository;
import com.japanese.backend.repository.FlashcardProgressRepository;
import com.japanese.backend.repository.FlashcardRepository;
import com.japanese.backend.repository.UserLearningItemRepository;
import com.japanese.backend.repository.VocabularyRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Service layer for the deck architecture: deck list, selector popup, vocabulary
 * add/remove, manual card creation, and import entry points.
 */
@Service
@RequiredArgsConstructor
public class FlashcardDeckService {

    public static final String SAVED_VOCABULARY_DECK_TITLE = "Từ vựng tôi lưu";
    public static final String SAVED_VOCABULARY_SOURCE_TYPE = "SAVED_VOCABULARY";
    private static final Set<String> ALLOWED_REVIEW_STATUSES = Set.of("NOT_REMEMBERED", "LEARNING", "REMEMBERED");

    private final FlashcardDeckRepository deckRepository;
    private final FlashcardDeckCardRepository deckCardRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardProgressRepository progressRepository;
    private final UserLearningItemRepository learningItemRepository;
    private final VocabularyRepository vocabularyRepository;

    public SelectableDeckResponse getSelectableDecks(Long userId, Long vocabularyId) {
        Vocabulary vocabulary = getVocabulary(vocabularyId);
        Flashcard vocabularyCard = flashcardRepository.findFirstByVocabularyId(vocabularyId).orElse(null);
        List<SelectableDeck> decks = deckRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(deck -> !isProtectedSavedVocabularyDeck(deck))
                .map(deck -> new SelectableDeck(
                        deck.getId(),
                        deck.getTitle(),
                        deck.getDescription(),
                        Boolean.TRUE.equals(deck.getIsPublic()),
                        vocabularyCard != null && deckCardRepository.existsByDeck_IdAndFlashcard_Id(deck.getId(), vocabularyCard.getId()),
                        deckCardRepository.countByDeck_Id(deck.getId())
                ))
                .toList();
        return new SelectableDeckResponse(vocabularyId, vocabulary.getWord(), decks);
    }

    @Transactional
    public List<DeckSummary> getMyDecks(Long userId, String keyword) {
        syncSavedVocabularyDeck(userId);
        List<FlashcardDeck> decks = StringUtils.hasText(keyword)
                ? deckRepository.findByUserIdAndTitleContainingIgnoreCaseOrderByUpdatedAtDesc(userId, keyword)
                : deckRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return decks.stream().map(this::toSummary).toList();
    }

    public List<DeckSummary> getSystemDecks(String keyword) {
        List<FlashcardDeck> decks = StringUtils.hasText(keyword)
                ? deckRepository.findByIsSystemTrueAndTitleContainingIgnoreCaseOrderByUpdatedAtDesc(keyword)
                : deckRepository.findByIsSystemTrueOrderByUpdatedAtDesc();
        return decks.stream().map(this::toSummary).toList();
    }

    public DeckDetail getDeckDetail(Long userId, Long deckId) {
        FlashcardDeck deck = getReadableDeck(userId, deckId);
        List<Flashcard> cards = deckCardRepository.findByDeck_IdOrderByCardOrderAscIdAsc(deckId).stream()
                .map(FlashcardDeckCard::getFlashcard)
                .toList();
        return new DeckDetail(toSummary(deck), cards, userId == null ? emptyProgress(cards) : buildProgress(userId, cards));
    }

    @Transactional
    public DeckDetail addVocabularyToSavedDeck(Long userId, Long vocabularyId) {
        FlashcardDeck deck = getOrCreateSavedVocabularyDeck(userId);
        Flashcard card = findOrCreateVocabularyCard(vocabularyId, userId);
        attachCard(deck, card, userId);
        return getDeckDetail(userId, deck.getId());
    }

    @Transactional
    public void removeVocabularyFromSavedDeck(Long userId, Long vocabularyId) {
        deckRepository.findFirstByUserIdAndSourceTypeOrderByUpdatedAtDesc(userId, SAVED_VOCABULARY_SOURCE_TYPE)
                .ifPresent(deck -> flashcardRepository.findFirstByVocabularyId(vocabularyId)
                        .ifPresent(card -> {
                            deckCardRepository.deleteByDeck_IdAndFlashcard_Id(deck.getId(), card.getId());
                            deck.setUpdatedAt(LocalDateTime.now());
                            deckRepository.save(deck);
                        }));
    }

    @Transactional
    public DeckSummary createDeck(Long userId, CreateFlashcardDeckRequest request) {
        FlashcardDeck deck = new FlashcardDeck();
        deck.setUserId(userId);
        deck.setTitle(request.title().trim());
        deck.setDescription(request.description());
        deck.setCoverColor(StringUtils.hasText(request.coverColor()) ? request.coverColor() : "#3971b8");
        deck.setSourceType("USER_CREATED");
        deck.setIsSystem(false);
        deck.setIsPublic(Boolean.TRUE.equals(request.isPublic()));
        deck.setLevelId(request.levelId());
        deck.setCreatedAt(LocalDateTime.now());
        deck.setUpdatedAt(LocalDateTime.now());
        return toSummary(deckRepository.save(deck));
    }

    @Transactional
    public DeckDetail addVocabularyToDeck(Long userId, Long deckId, Long vocabularyId) {
        FlashcardDeck deck = getWritableUserDeck(userId, deckId);
        Flashcard card = findOrCreateVocabularyCard(vocabularyId, userId);
        attachCard(deck, card, userId);
        return getDeckDetail(userId, deckId);
    }

    @Transactional
    public DeckDetail removeVocabularyFromDeck(Long userId, Long deckId, Long vocabularyId) {
        FlashcardDeck deck = getWritableUserDeck(userId, deckId);
        Flashcard card = flashcardRepository.findFirstByVocabularyId(vocabularyId)
                .orElseThrow(() -> new RuntimeException("Flashcard của từ vựng này chưa tồn tại"));
        deckCardRepository.findByDeck_IdAndFlashcard_Id(deck.getId(), card.getId())
                .ifPresent(deckCardRepository::delete);
        deck.setUpdatedAt(LocalDateTime.now());
        deckRepository.save(deck);
        return getDeckDetail(userId, deckId);
    }

    @Transactional
    public Flashcard createManualCard(Long userId, ManualFlashcardRequest request) {
        FlashcardDeck deck = getWritableUserDeck(userId, request.deckId());
        Flashcard card = new Flashcard();
        card.setCardType(StringUtils.hasText(request.cardType()) ? request.cardType() : "MANUAL");
        card.setFrontText(request.frontText().trim());
        card.setBackText(request.backText().trim());
        card.setExampleText(request.exampleText());
        card.setExampleTranslation(request.exampleTranslation());
        card.setNoteText(request.noteText());
        card.setImageUrl(request.imageUrl());
        card.setAudioUrl(request.audioUrl());
        card.setCreatedBy(userId);
        card.setCreatedAt(LocalDateTime.now());
        card.setUpdatedAt(LocalDateTime.now());
        Flashcard saved = flashcardRepository.save(card);
        attachCard(deck, saved, userId);
        return saved;
    }

    @Transactional
    public Flashcard updateCard(Long userId, Long cardId, UpdateFlashcardRequest request) {
        FlashcardDeck deck = getWritableUserDeck(userId, request.deckId());
        if (!deckCardRepository.existsByDeck_IdAndFlashcard_Id(deck.getId(), cardId)) {
            throw new RuntimeException("Thẻ này không nằm trong bộ flashcard đã chọn");
        }
        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy flashcard"));
        card.setFrontText(request.frontText().trim());
        card.setBackText(request.backText().trim());
        card.setExampleText(request.exampleText());
        card.setExampleTranslation(request.exampleTranslation());
        card.setNoteText(request.noteText());
        card.setImageUrl(request.imageUrl());
        card.setAudioUrl(request.audioUrl());
        card.setUpdatedAt(LocalDateTime.now());
        deck.setUpdatedAt(LocalDateTime.now());
        deckRepository.save(deck);
        return flashcardRepository.save(card);
    }

    @Transactional
    public DeckDetail removeCardFromDeck(Long userId, Long deckId, Long cardId) {
        FlashcardDeck deck = getWritableUserDeck(userId, deckId);
        deckCardRepository.deleteByDeck_IdAndFlashcard_Id(deck.getId(), cardId);
        deck.setUpdatedAt(LocalDateTime.now());
        deckRepository.save(deck);
        return getDeckDetail(userId, deckId);
    }

    @Transactional
    public void deleteDeck(Long userId, Long deckId) {
        FlashcardDeck deck = getDeck(deckId);
        if (!userId.equals(deck.getUserId()) || Boolean.TRUE.equals(deck.getIsSystem())) {
            throw new RuntimeException("Chỉ có thể xóa bộ flashcard của chính bạn");
        }
        if (isProtectedSavedVocabularyDeck(deck)) {
            throw new RuntimeException("Không thể xóa bộ Từ vựng tôi lưu");
        }
        deckRepository.delete(deck);
    }

    @Transactional
    public DeckDetail reorderCards(Long userId, Long deckId, ReorderFlashcardDeckRequest request) {
        FlashcardDeck deck = getWritableUserDeck(userId, deckId);
        List<FlashcardDeckCard> items = deckCardRepository.findByDeck_IdAndFlashcard_IdIn(deckId, request.cardIds());
        if (items.size() != request.cardIds().size()) {
            throw new RuntimeException("Danh sách sắp xếp có thẻ không thuộc bộ flashcard này");
        }
        for (FlashcardDeckCard item : items) {
            item.setCardOrder(request.cardIds().indexOf(item.getFlashcard().getId()) + 1);
        }
        deckCardRepository.saveAll(items);
        deck.setUpdatedAt(LocalDateTime.now());
        deckRepository.save(deck);
        return getDeckDetail(userId, deckId);
    }

    @Transactional
    public DeckDetail reviewCardInDeck(Long userId, Long deckId, Long cardId, String status) {
        String normalizedStatus = normalizeReviewStatus(status);
        FlashcardDeck deck = getReadableDeck(userId, deckId);
        if (!deckCardRepository.existsByDeck_IdAndFlashcard_Id(deck.getId(), cardId)) {
            throw new RuntimeException("Thẻ này không nằm trong bộ flashcard đã chọn");
        }
        FlashcardProgress progress = progressRepository.findByUserIdAndFlashcardId(userId, cardId)
                .orElseGet(() -> {
                    FlashcardProgress item = new FlashcardProgress();
                    item.setUserId(userId);
                    item.setFlashcardId(cardId);
                    item.setReviewCount(0);
                    return item;
                });
        progress.setMemoryStatus(normalizedStatus);
        progress.setReviewCount((progress.getReviewCount() == null ? 0 : progress.getReviewCount()) + 1);
        progress.setLastReviewedAt(LocalDateTime.now());
        progressRepository.save(progress);
        return getDeckDetail(userId, deckId);
    }

    @Transactional
    public ImportResult importText(Long userId, ImportTextFlashcardRequest request) {
        FlashcardDeck deck = getWritableUserDeck(userId, request.deckId());
        int imported = 0;
        int skipped = 0;

        for (String line : request.rawText().split("\\R")) {
            if (!StringUtils.hasText(line)) {
                continue;
            }
            String[] parts = line.contains("|") ? line.split("\\|", -1) : line.split(",", -1);
            if (parts.length < 2 || !StringUtils.hasText(parts[0]) || !StringUtils.hasText(parts[1])) {
                skipped++;
                continue;
            }
            ManualFlashcardRequest cardRequest = new ManualFlashcardRequest(
                    deck.getId(),
                    parts[0].trim(),
                    parts[1].trim(),
                    "IMPORTED_TEXT",
                    parts.length > 2 ? parts[2].trim() : null,
                    parts.length > 3 ? parts[3].trim() : null,
                    parts.length > 4 ? parts[4].trim() : null,
                    parts.length > 5 ? parts[5].trim() : null,
                    parts.length > 6 ? parts[6].trim() : null
            );
            createManualCard(userId, cardRequest);
            imported++;
        }

        return new ImportResult(deck.getId(), imported, skipped, "Đã import từ raw text. Định dạng: front|back|example|translation|note");
    }

    @Transactional
    public ImportResult importFile(Long userId, Long deckId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File import la bat buoc");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (filename.endsWith(".xlsx")) {
            return importXlsx(userId, deckId, file);
        }
        try {
            String rawText = new String(file.getBytes(), StandardCharsets.UTF_8);
            return importText(userId, new ImportTextFlashcardRequest(deckId, rawText));
        } catch (IOException e) {
            throw new RuntimeException("Không đọc được file import");
        }
    }

    @Transactional
    public ImportResult importXlsx(Long userId, Long deckId, MultipartFile file) {
        FlashcardDeck deck = getWritableUserDeck(userId, deckId);
        int imported = 0;
        int skipped = 0;
        DataFormatter formatter = new DataFormatter();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            for (Row row : workbook.getSheetAt(0)) {
                String front = formatter.formatCellValue(row.getCell(0)).trim();
                String back = formatter.formatCellValue(row.getCell(1)).trim();
                if ("front".equalsIgnoreCase(front) && "back".equalsIgnoreCase(back)) {
                    continue;
                }
                if (!StringUtils.hasText(front) || !StringUtils.hasText(back)) {
                    skipped++;
                    continue;
                }
                ManualFlashcardRequest cardRequest = new ManualFlashcardRequest(
                        deck.getId(),
                        front,
                        back,
                        "IMPORTED_FILE",
                        formatter.formatCellValue(row.getCell(2)).trim(),
                        formatter.formatCellValue(row.getCell(3)).trim(),
                        formatter.formatCellValue(row.getCell(4)).trim(),
                        formatter.formatCellValue(row.getCell(5)).trim(),
                        formatter.formatCellValue(row.getCell(6)).trim()
                );
                createManualCard(userId, cardRequest);
                imported++;
            }
            return new ImportResult(deckId, imported, skipped, "Đã import từ file Excel. Cột: front, back, example, translation, note, imageUrl, audioUrl");
        } catch (IOException e) {
            throw new RuntimeException("Không đọc được file Excel");
        }
    }

    private Flashcard findOrCreateVocabularyCard(Long vocabularyId, Long userId) {
        return flashcardRepository.findFirstByVocabularyId(vocabularyId)
                .orElseGet(() -> {
                    Vocabulary vocabulary = getVocabulary(vocabularyId);
                    Flashcard card = new Flashcard();
                    card.setCardType("VOCABULARY");
                    card.setVocabularyId(vocabulary.getId());
                    card.setFrontText(buildVocabularyFront(vocabulary));
                    card.setBackText(vocabulary.getMeaningVi());
                    card.setExampleText(firstExample(vocabulary));
                    card.setCreatedBy(userId);
                    card.setCreatedAt(LocalDateTime.now());
                    card.setUpdatedAt(LocalDateTime.now());
                    return flashcardRepository.save(card);
                });
    }

    private String normalizeReviewStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_REVIEW_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trang thai on tap flashcard khong hop le");
        }
        return normalized;
    }

    private void attachCard(FlashcardDeck deck, Flashcard card, Long userId) {
        if (deckCardRepository.existsByDeck_IdAndFlashcard_Id(deck.getId(), card.getId())) {
            return;
        }
        FlashcardDeckCard item = new FlashcardDeckCard();
        item.setDeck(deck);
        item.setFlashcard(card);
        item.setCardOrder(deckCardRepository.countByDeck_Id(deck.getId()).intValue() + 1);
        item.setAddedBy(userId);
        item.setAddedAt(LocalDateTime.now());
        deckCardRepository.save(item);
        deck.setUpdatedAt(LocalDateTime.now());
        deckRepository.save(deck);
    }

    private FlashcardDeck getOrCreateSavedVocabularyDeck(Long userId) {
        return deckRepository.findFirstByUserIdAndSourceTypeOrderByUpdatedAtDesc(userId, SAVED_VOCABULARY_SOURCE_TYPE)
                .or(() -> deckRepository.findFirstByUserIdAndTitleIgnoreCaseOrderByUpdatedAtDesc(userId, SAVED_VOCABULARY_DECK_TITLE))
                .map(deck -> {
                    if (!SAVED_VOCABULARY_SOURCE_TYPE.equals(deck.getSourceType())) {
                        deck.setSourceType(SAVED_VOCABULARY_SOURCE_TYPE);
                        deck.setUpdatedAt(LocalDateTime.now());
                        return deckRepository.save(deck);
                    }
                    return deck;
                })
                .orElseGet(() -> {
                    FlashcardDeck deck = new FlashcardDeck();
                    deck.setUserId(userId);
                    deck.setTitle(SAVED_VOCABULARY_DECK_TITLE);
                    deck.setDescription("Các từ vựng bạn đã bấm lưu để ôn lại bằng flashcard.");
                    deck.setCoverColor("#7fa8d8");
                    deck.setSourceType(SAVED_VOCABULARY_SOURCE_TYPE);
                    deck.setIsSystem(false);
                    deck.setIsPublic(false);
                    deck.setLevelId(1L);
                    deck.setCreatedAt(LocalDateTime.now());
                    deck.setUpdatedAt(LocalDateTime.now());
                    return deckRepository.save(deck);
                });
    }

    private void syncSavedVocabularyDeck(Long userId) {
        List<UserLearningItem> savedItems = learningItemRepository.findByUserIdAndItemType(userId, UserLearningItem.TYPE_VOCABULARY).stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsBookmarked()))
                .toList();
        if (savedItems.isEmpty()) {
            return;
        }
        FlashcardDeck deck = getOrCreateSavedVocabularyDeck(userId);
        for (UserLearningItem item : savedItems) {
            try {
                Flashcard card = findOrCreateVocabularyCard(item.getItemId(), userId);
                attachCard(deck, card, userId);
            } catch (RuntimeException ignored) {
                // Old saved-vocabulary rows can point to content removed by later imports.
            }
        }
    }

    private FlashcardDeck getReadableDeck(Long userId, Long deckId) {
        FlashcardDeck deck = getDeck(deckId);
        boolean readable = Boolean.TRUE.equals(deck.getIsSystem())
                || Boolean.TRUE.equals(deck.getIsPublic())
                || (userId != null && userId.equals(deck.getUserId()));
        if (!readable) {
            throw new RuntimeException("Bạn không có quyền xem bộ flashcard này");
        }
        return deck;
    }

    private FlashcardDeck getWritableUserDeck(Long userId, Long deckId) {
        FlashcardDeck deck = getDeck(deckId);
        if (!userId.equals(deck.getUserId()) || Boolean.TRUE.equals(deck.getIsSystem())) {
            throw new RuntimeException("Chỉ có thể cập nhật bộ flashcard của chính bạn");
        }
        if (isProtectedSavedVocabularyDeck(deck)) {
            throw new RuntimeException("Bộ Từ vựng tôi lưu được tạo tự động từ danh sách từ đã lưu");
        }
        return deck;
    }

    private boolean isProtectedSavedVocabularyDeck(FlashcardDeck deck) {
        return SAVED_VOCABULARY_SOURCE_TYPE.equals(deck.getSourceType())
                || SAVED_VOCABULARY_DECK_TITLE.equalsIgnoreCase(deck.getTitle());
    }

    private FlashcardDeck getDeck(Long deckId) {
        return deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ flashcard"));
    }

    private Vocabulary getVocabulary(Long vocabularyId) {
        return vocabularyRepository.findById(vocabularyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng"));
    }

    private DeckSummary toSummary(FlashcardDeck deck) {
        return new DeckSummary(
                deck.getId(),
                deck.getTitle(),
                deck.getDescription(),
                deck.getCoverColor(),
                deck.getSourceType(),
                Boolean.TRUE.equals(deck.getIsSystem()),
                Boolean.TRUE.equals(deck.getIsPublic()),
                deck.getLevelId(),
                deckCardRepository.countByDeck_Id(deck.getId()),
                deck.getUpdatedAt()
        );
    }

    private String buildVocabularyFront(Vocabulary vocabulary) {
        if (StringUtils.hasText(vocabulary.getKanji())) {
            return vocabulary.getReading() + " / " + vocabulary.getKanji();
        }
        return vocabulary.getWord();
    }

    private String firstExample(Vocabulary vocabulary) {
        if (StringUtils.hasText(vocabulary.getLessonNote())) {
            return vocabulary.getLessonNote();
        }
        return vocabulary.getMeaningVi();
    }

    private com.japanese.backend.dto.FlashcardDeckDtos.DeckProgress buildProgress(Long userId, List<Flashcard> cards) {
        if (cards.isEmpty()) {
            return new com.japanese.backend.dto.FlashcardDeckDtos.DeckProgress(0, 0, 0, 0);
        }
        List<Long> cardIds = cards.stream().map(Flashcard::getId).toList();
        int total = cards.size();
        int studied = Math.toIntExact(progressRepository.countStudiedCards(userId, cardIds));
        int learned = Math.toIntExact(progressRepository.countRememberedCards(userId, cardIds));
        int percent = total == 0 ? 0 : Math.round((learned * 100f) / total);
        return new com.japanese.backend.dto.FlashcardDeckDtos.DeckProgress(total, learned, studied, percent);
    }

    private com.japanese.backend.dto.FlashcardDeckDtos.DeckProgress emptyProgress(List<Flashcard> cards) {
        return new com.japanese.backend.dto.FlashcardDeckDtos.DeckProgress(cards.size(), 0, 0, 0);
    }
}
