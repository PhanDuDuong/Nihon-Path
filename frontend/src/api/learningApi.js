import { apiRequest } from "./http.js";

const query = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();

export const learningApi = {
  getLevels: () => apiRequest("/levels"),

  searchDictionary: (q, limit = 20) => apiRequest(`/dictionary/search?${query({ q, limit })}`),
  getDictionaryWord: (id) => apiRequest(`/dictionary/word/${id}`),
  getDictionaryKanji: (char) => apiRequest(`/dictionary/kanji/${encodeURIComponent(char)}`),

  getVocabularies: () => apiRequest("/vocabularies"),
  searchVocabularies: (keyword) => apiRequest(`/vocabularies/search?${query({ keyword })}`),
  getVocabulary: (id) => apiRequest(`/vocabularies/${id}`),
  saveVocabulary: (vocabId) =>
    apiRequest(`/user/vocabularies?${query({ vocabId })}`, { method: "POST" }),
  getSavedVocabularies: () => apiRequest("/user/vocabularies"),
  updateVocabularyProgress: (vocabId, payload) =>
    apiRequest(`/user/vocabularies/${vocabId}/progress`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getKanjis: () => apiRequest("/kanjis"),
  searchKanjis: (keyword) => apiRequest(`/kanjis/search?${query({ keyword })}`),
  getKanji: (id) => apiRequest(`/kanjis/${id}`),
  saveKanji: (kanjiId) => apiRequest(`/user/kanjis?${query({ kanjiId })}`, { method: "POST" }),
  getSavedKanjis: () => apiRequest("/user/kanjis"),
  updateKanjiProgress: (kanjiId, payload) =>
    apiRequest(`/user/kanjis/${kanjiId}/progress`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getGrammarLessons: (params = {}) => apiRequest(`/grammar?${query(params)}`),
  getGrammarLesson: (id) => apiRequest(`/grammar/${id}`),
  saveGrammarLesson: (lessonId) =>
    apiRequest(`/user/grammar-lessons?${query({ lessonId })}`, { method: "POST" }),
  getSavedGrammarLessons: () => apiRequest("/user/grammar-lessons"),
  updateGrammarProgress: (lessonId, payload) =>
    apiRequest(`/user/grammar-lessons/${lessonId}/progress`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getExercises: (params = {}) => apiRequest(`/exercises?${query(params)}`),
  getExercise: (id) => apiRequest(`/exercises/${id}`),
  submitExercise: (payload) =>
    apiRequest("/exercises/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getExerciseAttempts: () => apiRequest("/exercises/attempts"),
  getExerciseAttempt: (attemptId) => apiRequest(`/exercises/attempts/${attemptId}`),

  getExams: (params = {}) => apiRequest(`/exams?${query(params)}`),
  getExam: (id) => apiRequest(`/exams/${id}`),
  submitExam: (payload) =>
    apiRequest("/exams/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getExamAttempts: () => apiRequest("/exams/attempts"),
  getExamAttempt: (attemptId) => apiRequest(`/exams/attempts/${attemptId}`),

  getFlashcards: () => apiRequest("/flashcards"),
  reviewFlashcard: (id, status) =>
    apiRequest(`/flashcards/${id}?${query({ status })}`, { method: "PUT" }),
  getSelectableFlashcardDecks: (vocabularyId) =>
    apiRequest(`/flashcard-decks/selectable?${query({ vocabularyId })}`),
  createFlashcardDeck: (payload) =>
    apiRequest("/flashcard-decks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteFlashcardDeck: (deckId) =>
    apiRequest(`/flashcard-decks/${deckId}`, { method: "DELETE" }),
  addVocabularyToDeck: (deckId, vocabularyId) =>
    apiRequest(`/flashcard-decks/${deckId}/vocabularies/${vocabularyId}`, { method: "POST" }),
  removeVocabularyFromDeck: (deckId, vocabularyId) =>
    apiRequest(`/flashcard-decks/${deckId}/vocabularies/${vocabularyId}`, { method: "DELETE" }),
  getMyFlashcardDecks: (params = {}) => apiRequest(`/flashcard-decks/my?${query(params)}`),
  getSystemFlashcardDecks: (params = {}) => apiRequest(`/flashcard-decks/system?${query(params)}`),
  getFlashcardDeck: (deckId) => apiRequest(`/flashcard-decks/${deckId}`),
  getPublicFlashcardDeck: (deckId) => apiRequest(`/flashcard-decks/public/${deckId}`),
  createManualFlashcard: (payload) =>
    apiRequest("/flashcards/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateFlashcard: (id, payload) =>
    apiRequest(`/flashcards/${id}/edit`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  removeFlashcardFromDeck: (deckId, cardId) =>
    apiRequest(`/flashcard-decks/${deckId}/cards/${cardId}`, { method: "DELETE" }),
  reorderFlashcardDeck: (deckId, cardIds) =>
    apiRequest(`/flashcard-decks/${deckId}/cards/reorder`, {
      method: "PUT",
      body: JSON.stringify({ cardIds }),
    }),
  reviewDeckFlashcard: (deckId, cardId, status) =>
    apiRequest(`/flashcard-decks/${deckId}/cards/${cardId}/review?${query({ status })}`, { method: "PUT" }),
  importFlashcardsText: (payload) =>
    apiRequest("/flashcards/import-text", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  importFlashcardsFile: (deckId, file) => {
    const data = new FormData();
    data.append("file", file);
    return apiRequest(`/flashcards/import-file?${query({ deckId })}`, {
      method: "POST",
      body: data,
    });
  },

  getDashboard: () => apiRequest("/dashboard"),
  getVipStatus: () => apiRequest("/payments/vip/status"),
  createVipPayment: (payload) =>
    apiRequest("/payments/vip/vnpay", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),

  sendVipAiMessage: (payload) => {
    if (payload.files?.length) {
      const data = new FormData();
      data.append("message", payload.message ?? "");
      data.append("history", JSON.stringify(payload.history ?? []));
      payload.files.forEach((file) => data.append("files", file));
      return apiRequest("/vip/ai/chat", {
        method: "POST",
        body: data,
      });
    }

    return apiRequest("/vip/ai/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
