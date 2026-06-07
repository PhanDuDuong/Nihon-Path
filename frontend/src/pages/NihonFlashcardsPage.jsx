import { useEffect, useMemo, useState } from "react";
import { learningApi } from "../api/learningApi.js";
import LoginRequiredModal from "../components/LoginRequiredModal.jsx";
import PronunciationButton, { speakJapaneseText } from "../components/PronunciationButton.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyCard = () => ({
  id: crypto.randomUUID(),
  term: "",
  definition: "",
  imageUrl: "",
  audioUrl: "",
});

const defaultCards = () => [emptyCard(), emptyCard()];

const sampleCards = [
  { id: "sample-1", frontText: "abc", backText: "d" },
  { id: "sample-2", frontText: "abcd", backText: "e" },
  { id: "sample-3", frontText: "kjdnk", backText: "èni" },
];

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const cardTerm = (card) => card?.frontText ?? card?.term ?? "";
const cardDefinition = (card) => card?.backText ?? card?.definition ?? "";
const isSameAnswer = (a, b) => normalize(a) === normalize(b);
const SAVED_VOCABULARY_DECK_TITLE = "Từ vựng tôi lưu";
const SAVED_VOCABULARY_SOURCE_TYPE = "SAVED_VOCABULARY";
const isProtectedDeck = (deck) =>
  Boolean(deck?.isSystem)
  || deck?.sourceType === SAVED_VOCABULARY_SOURCE_TYPE
  || normalize(deck?.title) === normalize(SAVED_VOCABULARY_DECK_TITLE);

function parseImportRows(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.includes("\t") ? line.split("\t") : line.split(/\s{1,}/);
      return {
        id: crypto.randomUUID(),
        term: parts[0] ?? "",
        definition: parts.slice(1).join(" ") || "",
        imageUrl: "",
        audioUrl: "",
      };
    })
    .filter((card) => card.term || card.definition);
}

function makeChoiceOptions(cards, answerCard) {
  const answer = cardTerm(answerCard);
  const wrongOptions = shuffle(cards.filter((card) => card.id !== answerCard.id))
    .map(cardTerm)
    .filter(Boolean)
    .slice(0, 3);
  return shuffle([...new Set([answer, ...wrongOptions])]).slice(0, 4);
}

function buildReviewItems(cards, settings) {
  const source = cards.slice(0, Math.max(1, settings.questionCount));
  const items = [];

  source.forEach((card, index) => {
    if (settings.multipleChoice) {
      items.push({
        id: `mc-${card.id}`,
        type: "multiple",
        card,
        prompt: cardDefinition(card),
        answer: cardTerm(card),
        options: makeChoiceOptions(cards, card),
        index: items.length + 1,
      });
    }

    if (settings.trueFalse) {
      const shouldBeTrue = index % 2 === 0;
      const shownCard = shouldBeTrue ? card : source[(index + 1) % source.length] ?? card;
      items.push({
        id: `tf-${card.id}`,
        type: "truefalse",
        card,
        prompt: cardDefinition(card),
        shownTerm: cardTerm(shownCard),
        answer: shouldBeTrue ? "Đúng" : "Sai",
        index: items.length + 1,
      });
    }

    if (settings.written) {
      items.push({
        id: `wr-${card.id}`,
        type: "written",
        card,
        prompt: cardDefinition(card),
        answer: cardTerm(card),
        index: items.length + 1,
      });
    }
  });

  if (settings.matching) {
    items.push({
      id: "match-all",
      type: "matching",
      cards: source,
      terms: shuffle(source.map((card) => ({ id: card.id, term: cardTerm(card) }))),
      definitions: source.map((card) => ({ id: card.id, definition: cardDefinition(card) })),
      index: items.length + 1,
    });
  }

  return items.length ? items : source.map((card, index) => ({
    id: `mc-default-${card.id}`,
    type: "multiple",
    card,
    prompt: cardDefinition(card),
    answer: cardTerm(card),
    options: makeChoiceOptions(cards, card),
    index: index + 1,
  }));
}

export default function NihonFlashcardsPage() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState("home");
  const [keyword, setKeyword] = useState("");
  const [systemDecks, setSystemDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedCards, setSelectedCards] = useState(sampleCards);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loginModalMessage, setLoginModalMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editorCards, setEditorCards] = useState(defaultCards);
  const [importText, setImportText] = useState("abc d\nabcd e\nkjdnk èni");
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [frontMode, setFrontMode] = useState("term");
  const [shuffleCards, setShuffleCards] = useState(false);
  const [autoAudio, setAutoAudio] = useState(true);
  const [showAllSystem, setShowAllSystem] = useState(false);
  const [showAllMine, setShowAllMine] = useState(false);
  const [starredCardIds, setStarredCardIds] = useState([]);
  const [reviewSettingsOpen, setReviewSettingsOpen] = useState(false);
  const [reviewSettings, setReviewSettings] = useState({
    questionCount: 3,
    starredOnly: false,
    trueFalse: false,
    multipleChoice: true,
    matching: false,
    written: false,
    answerLanguage: "Cả hai",
    oneAnswerOnly: false,
  });
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewAnswers, setReviewAnswers] = useState({});
  const [reviewFeedback, setReviewFeedback] = useState({});
  const [matchAnswers, setMatchAnswers] = useState({});
  const [activeMatchDefinition, setActiveMatchDefinition] = useState(null);

  const importPreview = useMemo(() => parseImportRows(importText), [importText]);
  const currentCard = selectedCards[studyIndex] ?? selectedCards[0];
  const filteredSystemDecks = useMemo(() => filterDecks(systemDecks, keyword), [keyword, systemDecks]);
  const filteredMyDecks = useMemo(() => filterDecks(myDecks, keyword), [keyword, myDecks]);
  const visibleSystemDecks = showAllSystem ? filteredSystemDecks : filteredSystemDecks.slice(0, 4);
  const visibleMyDecks = showAllMine ? filteredMyDecks : filteredMyDecks.slice(0, 4);

  const frontText = frontMode === "term" ? cardTerm(currentCard) : cardDefinition(currentCard);
  const backText = frontMode === "term" ? cardDefinition(currentCard) : cardTerm(currentCard);
  const reviewAnsweredCount = Object.keys(reviewFeedback).length;

  const requireLogin = (text) => {
    setMessage("");
    setLoginModalMessage(text);
  };

  useEffect(() => {
    loadDecks();
  }, [isAuthenticated]);

  useEffect(() => {
    if (screen === "study" && autoAudio && currentCard && !flipped) {
      speak(currentCard);
    }
  }, [screen, autoAudio, currentCard, flipped]);

  const loadDecks = async () => {
    setLoading(true);
    setMessage("");
    const [systemResult, myResult] = await Promise.allSettled([
      learningApi.getSystemFlashcardDecks(),
      isAuthenticated ? learningApi.getMyFlashcardDecks() : Promise.resolve([]),
    ]);

    if (systemResult.status === "fulfilled") {
      setSystemDecks(systemResult.value ?? []);
    } else {
      setSystemDecks([]);
    }

    if (myResult.status === "fulfilled") {
      setMyDecks(myResult.value ?? []);
    } else {
      setMyDecks([]);
    }

    if (systemResult.status === "rejected" && myResult.status === "rejected") {
      setMessage("Không tải được flashcard từ backend. Kiểm tra backend hoặc đăng nhập lại.");
    } else if (myResult.status === "rejected") {
      setMessage("Đã tải bộ hệ thống. Đăng nhập để xem và quản lý Flashcard của tôi.");
    }

    setLoading(false);
  };

  const openDeck = async (deck) => {
    setMessage("");
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để học và ôn tập một bộ flashcard.");
      return;
    }
    setSelectedDeck(deck);
    try {
      const detail = deck.isSystem
        ? await learningApi.getPublicFlashcardDeck(deck.id)
        : await learningApi.getFlashcardDeck(deck.id);
      setSelectedDeck(detail.deck ?? deck);
      setSelectedCards(detail.cards?.length ? detail.cards : sampleCards);
    } catch (err) {
      setSelectedCards(sampleCards);
      setMessage(deck.isSystem
        ? "Không tải được chi tiết bộ hệ thống. Kiểm tra backend đang chạy ở cổng 8080."
        : "Bạn cần đăng nhập để xem bộ flashcard cá nhân này.");
    }
    setStudyIndex(0);
    setFlipped(false);
    setScreen("detail");
  };

  const updateEditorCard = (id, field, value) => {
    setEditorCards((current) => current.map((card) => (card.id === id ? { ...card, [field]: value } : card)));
  };

  const removeEditorCard = (id) => {
    setEditorCards((current) => current.filter((card) => card.id !== id));
  };

  const createDeck = async (cards = editorCards) => {
    if (selectedDeck?.id && !selectedDeck?.isSystem) {
      await saveCurrentDeck(cards);
      return;
    }
    const cleanCards = cards.filter((card) => card.term.trim() && card.definition.trim());
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để tạo và lưu bộ flashcard cá nhân.");
      setScreen("home");
      return;
    }
    if (!title.trim()) {
      setMessage("Vui lòng nhập tiêu đề bộ flashcard.");
      setScreen("create");
      return;
    }

    setMessage("");
    try {
      const deck = await learningApi.createFlashcardDeck({
        title: title.trim(),
        description: description.trim(),
        coverColor: "#3971b8",
        levelId: 1,
        isPublic: false,
      });
      await Promise.all(
        cleanCards.map((card) =>
          learningApi.createManualFlashcard({
            deckId: Number(deck.id),
            cardType: "MANUAL",
            frontText: card.term,
            backText: card.definition,
            imageUrl: card.imageUrl,
            audioUrl: card.audioUrl,
          })
        )
      );
      const detail = await learningApi.getFlashcardDeck(deck.id);
      setSelectedDeck(detail.deck ?? deck);
      setSelectedCards(detail.cards?.length ? detail.cards : cleanCards);
      setTitle("");
      setDescription("");
      setEditorCards(defaultCards());
      setImportText("abc d\nabcd e\nkjdnk èni");
      await loadDecks();
      setScreen("detail");
    } catch (err) {
      setMessage(err.message || "Không tạo được bộ flashcard. Vui lòng đăng nhập lại rồi thử tiếp.");
    }
  };

  const saveCurrentDeck = async (cards = editorCards) => {
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để chỉnh sửa bộ flashcard.");
      setScreen("home");
      return;
    }
    if (!selectedDeck?.id || isProtectedDeck(selectedDeck)) {
      setMessage("Chỉ có thể chỉnh sửa bộ flashcard cá nhân.");
      return;
    }

    const cleanCards = cards.filter((card) => String(card.term ?? "").trim() && String(card.definition ?? "").trim());
    const keptExistingIds = new Set(cleanCards.filter((card) => Number.isFinite(Number(card.id))).map((card) => Number(card.id)));
    const removedCards = selectedCards.filter((card) => Number.isFinite(Number(card.id)) && !keptExistingIds.has(Number(card.id)));

    setMessage("");
    try {
      await Promise.all(removedCards.map((card) => learningApi.removeFlashcardFromDeck(selectedDeck.id, card.id)));
      await Promise.all(
        cleanCards.map((card) => {
          const payload = {
            deckId: Number(selectedDeck.id),
            frontText: card.term,
            backText: card.definition,
            imageUrl: card.imageUrl,
            audioUrl: card.audioUrl,
          };
          return Number.isFinite(Number(card.id))
            ? learningApi.updateFlashcard(card.id, payload)
            : learningApi.createManualFlashcard({ ...payload, cardType: "MANUAL" });
        })
      );
      const detail = await learningApi.getFlashcardDeck(selectedDeck.id);
      setSelectedDeck(detail.deck ?? selectedDeck);
      setSelectedCards(detail.cards?.length ? detail.cards : []);
      await loadDecks();
      setScreen("detail");
    } catch (err) {
      setMessage(err.message || "Không cập nhật được thẻ. Vui lòng thử lại.");
    }
  };

  const applyImport = () => {
    if (!importPreview.length) {
      setMessage("Chưa có dữ liệu hợp lệ để nhập.");
      return;
    }
    setEditorCards(importPreview);
    createDeck(importPreview);
  };

  const speak = (card = currentCard) => {
    if (!card) return;
    speakJapaneseText({
      text: cardTerm(card),
      audioUrl: card.audioUrl,
      onError: setMessage,
    });
  };

  const moveCard = (direction) => {
    setStudyIndex((current) => Math.max(0, Math.min(selectedCards.length - 1, current + direction)));
    setFlipped(false);
  };

  const startStudy = () => {
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để học một bộ flashcard.");
      return;
    }
    setSelectedCards((current) => (shuffleCards ? shuffle(current) : current));
    setStudyIndex(0);
    setFlipped(false);
    setScreen("study");
  };

  const toggleShuffleCards = (checked) => {
    setShuffleCards(checked);
    if (!checked) {
      return;
    }
    setSelectedCards((current) => shuffle(current));
    setStudyIndex(0);
    setFlipped(false);
  };

  const updateReviewSetting = (field, value) => {
    setReviewSettings((current) => ({ ...current, [field]: value }));
  };

  const startReview = (openSettings = true) => {
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để ôn tập flashcard.");
      return;
    }
    const sourceCards = reviewSettings.starredOnly
      ? selectedCards.filter((card) => starredCardIds.includes(card.id))
      : selectedCards;
    if (!sourceCards.length) {
      setMessage("Chưa có thẻ phù hợp để tạo bài ôn tập.");
      return;
    }
    const nextSettings = {
      ...reviewSettings,
      questionCount: Math.min(Math.max(1, Number(reviewSettings.questionCount) || 1), sourceCards.length || 1),
    };
    const items = buildReviewItems(sourceCards, nextSettings);
    setReviewSettings(nextSettings);
    setReviewItems(items);
    setReviewAnswers({});
    setReviewFeedback({});
    setMatchAnswers({});
    setActiveMatchDefinition(null);
    setReviewSettingsOpen(openSettings);
    setScreen("review");
  };

  const regenerateReview = () => {
    const sourceCards = reviewSettings.starredOnly
      ? selectedCards.filter((card) => starredCardIds.includes(card.id))
      : selectedCards;
    if (!sourceCards.length) {
      setMessage("Chưa có thẻ gắn sao để tạo bài kiểm tra.");
      return;
    }
    const items = buildReviewItems(sourceCards, reviewSettings);
    setReviewItems(items);
    setReviewAnswers({});
    setReviewFeedback({});
    setMatchAnswers({});
    setActiveMatchDefinition(null);
    setReviewSettingsOpen(false);
  };

  const answerReview = (item, answer) => {
    setReviewAnswers((current) => ({ ...current, [item.id]: answer }));
    if (item.type === "multiple" || item.type === "truefalse") {
      setReviewFeedback((current) => ({ ...current, [item.id]: isSameAnswer(answer, item.answer) }));
    }
  };

  const checkWrittenAnswer = (item) => {
    const answer = reviewAnswers[item.id] ?? "";
    setReviewFeedback((current) => ({ ...current, [item.id]: isSameAnswer(answer, item.answer) }));
  };

  const placeMatchAnswer = (item, termId) => {
    if (!activeMatchDefinition) return;
    const nextAnswers = { ...matchAnswers, [activeMatchDefinition]: termId };
    setMatchAnswers(nextAnswers);
    setActiveMatchDefinition(null);
    const complete = item.definitions.every((definition) => nextAnswers[definition.id]);
    if (complete) {
      const correct = item.definitions.every((definition) => nextAnswers[definition.id] === definition.id);
      setReviewFeedback((current) => ({ ...current, [item.id]: correct }));
    }
  };

  const toggleStar = (cardId) => {
    setStarredCardIds((current) =>
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId]
    );
  };

  const openCreateScreen = () => {
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để tạo bộ flashcard cá nhân.");
      return;
    }
    setTitle("");
    setDescription("");
    setEditorCards(defaultCards());
    setSelectedDeck(null);
    setSelectedCards([]);
    setScreen("create");
  };

  const editCurrentDeck = () => {
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để chỉnh sửa bộ flashcard.");
      return;
    }
    if (isProtectedDeck(selectedDeck)) {
      setMessage(selectedDeck?.title === SAVED_VOCABULARY_DECK_TITLE
        ? "Bộ Từ vựng tôi lưu được tạo tự động từ danh sách từ đã lưu."
        : "Bộ hệ thống chỉ hỗ trợ xem và ôn tập. Hãy tạo bộ cá nhân nếu muốn chỉnh sửa.");
      return;
    }
    setTitle(selectedDeck?.title ?? "");
    setDescription(selectedDeck?.description ?? "");
    setEditorCards(
      selectedCards.map((card) => ({
        id: card.id ?? crypto.randomUUID(),
        term: cardTerm(card),
        definition: cardDefinition(card),
        imageUrl: card.imageUrl ?? "",
        audioUrl: card.audioUrl ?? "",
      }))
    );
    setScreen("create");
  };

  const deleteDeck = async (deck) => {
    if (!isAuthenticated) {
      requireLogin("Bạn cần đăng nhập để xóa bộ flashcard.");
      return;
    }
    if (isProtectedDeck(deck)) {
      setMessage(deck?.title === SAVED_VOCABULARY_DECK_TITLE
        ? "Không thể xóa bộ Từ vựng tôi lưu."
        : "Không thể xóa bộ flashcard hệ thống.");
      return;
    }
    if (!window.confirm(`Xóa bộ flashcard "${deck.title}"?`)) {
      return;
    }
    setMessage("");
    try {
      await learningApi.deleteFlashcardDeck(deck.id);
      if (selectedDeck?.id === deck.id) {
        setSelectedDeck(null);
        setSelectedCards([]);
        setScreen("home");
      }
      await loadDecks();
      setMessage("Đã xóa bộ flashcard.");
    } catch (err) {
      setMessage(err.message || "Không xóa được bộ flashcard.");
    }
  };

  return (
    <StudyShell active="Flashcard" title="Flashcard">
      <main className="study-main matcha-flash-main">
        {message ? <div className="matcha-message">{message}</div> : null}
        {loading ? <div className="matcha-message">Đang tải flashcard...</div> : null}

        {screen === "home" ? (
          <section className="matcha-screen is-home">
            <header className="matcha-home-header">
              <div>
                <p>Flashcard</p>
                <h1>Học phần của bạn</h1>
              </div>
              <button className="matcha-primary" type="button" onClick={openCreateScreen}>
                + Thêm bộ mới
              </button>
            </header>

            <label className="matcha-search">
              <span>⌕</span>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm kiếm bộ flashcard" />
            </label>

            <DeckSection
              title="Bộ flashcard có sẵn của hệ thống"
              decks={visibleSystemDecks}
              emptyText="Chưa có bộ hệ thống."
              expanded={showAllSystem}
              hasMore={filteredSystemDecks.length > 4}
              onToggle={() => setShowAllSystem((value) => !value)}
              onOpen={openDeck}
              onDelete={deleteDeck}
            />
            <DeckSection
              title="Flashcard của tôi"
              decks={visibleMyDecks}
              emptyText={isAuthenticated ? "Bạn chưa có bộ flashcard nào." : "Đăng nhập để xem Flashcard của tôi."}
              expanded={showAllMine}
              hasMore={filteredMyDecks.length > 4}
              onToggle={() => setShowAllMine((value) => !value)}
              onOpen={openDeck}
              onDelete={deleteDeck}
            />
          </section>
        ) : null}

        {screen === "create" ? (
          <section className="matcha-screen">
            <header className="matcha-create-header">
              <h1>{selectedDeck?.id && !selectedDeck?.isSystem ? "Chỉnh sửa học phần" : "Tạo một học phần mới"}</h1>
              <button className="matcha-primary" type="button" onClick={() => createDeck()}>
                {selectedDeck?.id && !selectedDeck?.isSystem ? "Lưu" : "Tạo"}
              </button>
            </header>

            <div className="matcha-title-panel">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề" />
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Thêm mô tả..." />
              <button className="matcha-pill" type="button" onClick={() => setScreen("import")}>
                + Nhập
              </button>
            </div>

            <div className="matcha-editor-list">
              {editorCards.map((card, index) => (
                <article className="matcha-editor-card" key={card.id}>
                  <strong>{index + 1}</strong>
                  <label>
                    <input value={card.term} onChange={(event) => updateEditorCard(card.id, "term", event.target.value)} />
                    <span>THUẬT NGỮ</span>
                  </label>
                  <label>
                    <input value={card.definition} onChange={(event) => updateEditorCard(card.id, "definition", event.target.value)} />
                    <span>ĐỊNH NGHĨA</span>
                  </label>
                  <button className="matcha-image-button" type="button">
                    ▧<small>Hình ảnh</small>
                  </button>
                  <button className="matcha-delete-card" type="button" onClick={() => removeEditorCard(card.id)}>
                    Xóa thẻ
                  </button>
                </article>
              ))}
            </div>

            <button className="matcha-add-card" type="button" onClick={() => setEditorCards((current) => [...current, emptyCard()])}>
              Thêm thẻ
            </button>
          </section>
        ) : null}

        {screen === "import" ? (
          <section className="matcha-import-screen">
            <button className="matcha-close" type="button" onClick={() => setScreen("create")}>
              ×
            </button>
            <h1>
              Nhập dữ liệu <span>Chép và dán dữ liệu ở đây từ Word, Excel, Google Docs, v.v.</span>
            </h1>
            <textarea className="matcha-import-area" value={importText} onChange={(event) => setImportText(event.target.value)} />

            <div className="matcha-import-options">
              <fieldset>
                <legend>Giữa thuật ngữ và định nghĩa</legend>
                <label><input type="radio" name="termDivider" /> Tab</label>
                <label><input type="radio" name="termDivider" /> Phẩy</label>
                <label><input type="radio" name="termDivider" defaultChecked /> Tùy chỉnh</label>
              </fieldset>
              <fieldset>
                <legend>Giữa các thẻ</legend>
                <label><input type="radio" name="cardDivider" defaultChecked /> Dòng mới</label>
                <label><input type="radio" name="cardDivider" /> Chấm phẩy</label>
                <label><input type="radio" name="cardDivider" /> Tùy chỉnh</label>
              </fieldset>
            </div>

            <h2>Xem trước <span>{importPreview.length} thẻ</span></h2>
            <div className="matcha-preview-list">
              {importPreview.map((card, index) => (
                <article key={card.id}>
                  <span>{index + 1}</span>
                  <strong>{card.term}</strong>
                  <strong>{card.definition}</strong>
                </article>
              ))}
            </div>

            <footer className="matcha-import-footer">
              <button className="matcha-pill" type="button" onClick={() => setScreen("create")}>Hủy nhập</button>
              <button className="matcha-primary" type="button" onClick={applyImport}>Nhập</button>
            </footer>
          </section>
        ) : null}

        {screen === "detail" ? (
          <section className="matcha-screen">
            <header className="matcha-detail-header">
              <button type="button" onClick={() => setScreen("home")}>← Trang chính</button>
              <h1>{selectedDeck?.title || "UNIT 1"}</h1>
              {!isProtectedDeck(selectedDeck) ? (
                <button className="matcha-danger-action" type="button" onClick={() => deleteDeck(selectedDeck)}>
                  Xóa bộ
                </button>
              ) : null}
            </header>

            <nav className="matcha-mode-grid">
              <button type="button" onClick={startStudy}><span>▰</span>Bắt đầu học</button>
              <button type="button" onClick={() => startReview(true)}><span>◌</span>Ôn tập</button>
            </nav>

            <section className="matcha-term-list">
              {selectedCards.map((card) => (
                <article key={card.id}>
                  <span>{cardTerm(card)}</span>
                  <span>{cardDefinition(card)}</span>
                  <div>
                    <button className={starredCardIds.includes(card.id) ? "is-active" : ""} type="button" onClick={() => toggleStar(card.id)}>★</button>
                    <PronunciationButton
                      text={cardTerm(card)}
                      audioUrl={card.audioUrl}
                      label=""
                      onError={setMessage}
                    />
                    <button type="button" onClick={editCurrentDeck}>✎</button>
                  </div>
                </article>
              ))}
            </section>

            <button className="matcha-add-card" type="button" onClick={editCurrentDeck}>Thêm hoặc xóa thuật ngữ ✎</button>
          </section>
        ) : null}

        {screen === "review" ? (
          <section className="matcha-review-screen">
            <header className="matcha-review-header">
              <button className="matcha-mode-pill" type="button" onClick={() => setScreen("detail")}>←</button>
              <div className="matcha-study-progress">
                <strong>{reviewAnsweredCount} / {reviewItems.length}</strong>
              </div>
              <div className="matcha-study-actions">
                <button type="button" onClick={() => setReviewSettingsOpen(true)}>⚙</button>
                <button type="button" onClick={() => setScreen("detail")}>×</button>
              </div>
            </header>

            <div className="matcha-review-list">
              {reviewItems.map((item, index) => (
                <ReviewQuestion
                  key={item.id}
                  item={item}
                  index={index}
                  total={reviewItems.length}
                  answer={reviewAnswers[item.id]}
                  feedback={reviewFeedback[item.id]}
                  matchAnswers={matchAnswers}
                  activeMatchDefinition={activeMatchDefinition}
                  onAnswer={answerReview}
                  onSpeak={speak}
                  onCheckWritten={checkWrittenAnswer}
                  onSelectMatchDefinition={setActiveMatchDefinition}
                  onPlaceMatch={placeMatchAnswer}
                />
              ))}
            </div>

            {reviewSettingsOpen ? (
              <div className="matcha-review-overlay">
                <section className="matcha-review-modal">
                  <button className="matcha-modal-close" type="button" onClick={() => setReviewSettingsOpen(false)}>×</button>
                  <div className="matcha-review-modal-title">
                    <div>
                      <h1>Thiết lập bài kiểm tra</h1>
                    </div>
                    <strong>▣</strong>
                  </div>

                  <label className="matcha-setting-row">
                    <span>Câu hỏi <small>(tối đa {selectedCards.length})</small></span>
                    <input
                      type="number"
                      min="1"
                      max={selectedCards.length}
                      value={reviewSettings.questionCount}
                      onChange={(event) => updateReviewSetting("questionCount", event.target.value)}
                    />
                  </label>

                  <label className="matcha-setting-row">
                    <span>Trả lời bằng</span>
                    <select value={reviewSettings.answerLanguage} onChange={(event) => updateReviewSetting("answerLanguage", event.target.value)}>
                      <option>Cả hai</option>
                      <option>Tiếng Nhật</option>
                      <option>Tiếng Anh</option>
                    </select>
                  </label>

                  <div className="matcha-setting-divider" />
                  <SwitchRow label="Đúng/Sai" checked={reviewSettings.trueFalse} onChange={(checked) => updateReviewSetting("trueFalse", checked)} />
                  <SwitchRow label="Trắc nghiệm" checked={reviewSettings.multipleChoice} onChange={(checked) => updateReviewSetting("multipleChoice", checked)} />
                  <SwitchRow label="Tự luận" checked={reviewSettings.written} onChange={(checked) => updateReviewSetting("written", checked)} />

                  <footer className="matcha-review-modal-footer">
                    <button className="matcha-primary" type="button" onClick={regenerateReview}>Bắt đầu làm kiểm tra</button>
                    <button className="matcha-pill" type="button" onClick={() => setReviewSettingsOpen(false)}>Hủy</button>
                  </footer>
                </section>
              </div>
            ) : null}
          </section>
        ) : null}

        {screen === "study" ? (
          <section className="matcha-study-screen">
            <header className="matcha-study-header">
              <button className="matcha-mode-pill" type="button" onClick={() => setScreen("detail")}>←</button>
              <div className="matcha-study-progress">
                <strong>{studyIndex + 1} / {selectedCards.length}</strong>
              </div>
              <div className="matcha-study-actions">
                <button type="button" onClick={() => setSettingsOpen(true)}>⚙</button>
                <button type="button" onClick={() => setScreen("detail")}>×</button>
              </div>
            </header>

            <button className={`matcha-study-card ${flipped ? "is-flipped" : ""}`} type="button" onClick={() => setFlipped((value) => !value)}>
              <strong>{flipped ? backText : frontText}</strong>
            </button>

            <footer className="matcha-study-footer">
              <label className="matcha-shuffle-toggle">
                <input
                  type="checkbox"
                  checked={shuffleCards}
                  onChange={(event) => toggleShuffleCards(event.target.checked)}
                />
                <span>Xáo trộn thẻ</span>
              </label>
              <div>
                <button type="button" onClick={() => moveCard(1)}>→</button>
              </div>
              <div>
                <PronunciationButton
                  text={cardTerm(currentCard)}
                  label=""
                  className="matcha-footer-audio"
                  onError={setMessage}
                />
              </div>
            </footer>

            <aside className={`matcha-settings ${settingsOpen ? "is-open" : ""}`}>
              <header>
                <h2>Cài đặt</h2>
                <button type="button" onClick={() => setSettingsOpen(false)}>×</button>
              </header>
              <label>
                <span>Hiển thị trước</span>
                <select value={frontMode} onChange={(event) => setFrontMode(event.target.value)}>
                  <option value="term">Thuật ngữ</option>
                  <option value="definition">Định nghĩa</option>
                </select>
              </label>
              <label><span>Phát âm thanh</span><input type="checkbox" checked={autoAudio} onChange={(event) => setAutoAudio(event.target.checked)} /></label>
              <label><span>Trộn thẻ</span><input type="checkbox" checked={shuffleCards} onChange={(event) => toggleShuffleCards(event.target.checked)} /></label>
            </aside>
          </section>
        ) : null}
        {loginModalMessage ? (
          <LoginRequiredModal
            message={loginModalMessage}
            onClose={() => setLoginModalMessage("")}
          />
        ) : null}
      </main>
    </StudyShell>
  );
}

function SwitchRow({ label, checked, onChange }) {
  return (
    <label className="matcha-switch-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function ReviewQuestion({
  item,
  index,
  total,
  answer,
  feedback,
  matchAnswers,
  activeMatchDefinition,
  onAnswer,
  onSpeak,
  onCheckWritten,
  onSelectMatchDefinition,
  onPlaceMatch,
}) {
  if (item.type === "matching") {
    const usedTermIds = new Set(Object.values(matchAnswers));
    return (
      <article className={`matcha-review-card matcha-review-card-match ${feedback === true ? "is-correct" : feedback === false ? "is-wrong" : ""}`}>
        <header>
          <span>Câu hỏi chọn đáp án</span>
          <small>{index + 1}-{item.definitions.length}/{total}</small>
        </header>
        <strong>Nhấp vào định nghĩa để ghép với thuật ngữ</strong>
        <div className="matcha-match-workspace">
          <div className="matcha-match-slots">
            {item.definitions.map((definition) => {
              const matchedTerm = item.terms.find((term) => term.id === matchAnswers[definition.id]);
              return (
                <button
                  className={activeMatchDefinition === definition.id ? "active" : ""}
                  type="button"
                  key={definition.id}
                  onClick={() => onSelectMatchDefinition(definition.id)}
                >
                  {matchedTerm?.term || "Chọn từ danh sách bên dưới"}
                </button>
              );
            })}
          </div>
          <div className="matcha-match-terms">
            {item.terms.map((term) => (
              <button
                type="button"
                key={term.id}
                disabled={usedTermIds.has(term.id)}
                onClick={() => onPlaceMatch(item, term.id)}
              >
                {term.term}
              </button>
            ))}
          </div>
        </div>
        <div className="matcha-match-definitions">
          {item.definitions.map((definition) => <span key={definition.id}>{definition.definition}</span>)}
        </div>
      </article>
    );
  }

  if (item.type === "truefalse") {
    return (
      <article className={`matcha-review-card ${feedback === true ? "is-correct" : feedback === false ? "is-wrong" : ""}`}>
        <header>
          <span>Định nghĩa <button type="button" onClick={() => onSpeak(item.card)}>🔊</button></span>
          <small>{index + 1}/{total}</small>
        </header>
        <div className="matcha-truefalse-pair">
          <div><small>Định nghĩa</small><strong>{item.prompt}</strong></div>
          <div><small>Thuật ngữ</small><strong>{item.shownTerm}</strong></div>
        </div>
        <p>Chọn câu trả lời</p>
        <div className="matcha-answer-grid two">
          {["Đúng", "Sai"].map((option) => (
            <button className={answer === option ? "selected" : ""} type="button" key={option} onClick={() => onAnswer(item, option)}>
              {option}
            </button>
          ))}
        </div>
        <Feedback value={feedback} />
      </article>
    );
  }

  if (item.type === "written") {
    return (
      <article className={`matcha-review-card ${feedback === true ? "is-correct" : feedback === false ? "is-wrong" : ""}`}>
        <header>
          <span>Định nghĩa <button type="button" onClick={() => onSpeak(item.card)}>🔊</button></span>
          <small>{index + 1}/{total}</small>
        </header>
        <strong className="matcha-review-prompt">{item.prompt}</strong>
        <label className="matcha-written-answer">
          <span>Đáp án của bạn</span>
          <input value={answer ?? ""} onChange={(event) => onAnswer(item, event.target.value)} placeholder="Nhập Tiếng Nhật" />
        </label>
        <button className="matcha-check-button" type="button" onClick={() => onCheckWritten(item)}>Kiểm tra</button>
        <Feedback value={feedback} answer={item.answer} />
      </article>
    );
  }

  return (
    <article className={`matcha-review-card ${feedback === true ? "is-correct" : feedback === false ? "is-wrong" : ""}`}>
      <header>
        <span>Định nghĩa <button type="button" onClick={() => onSpeak(item.card)}>🔊</button></span>
        <small>{index + 1}/{total}</small>
      </header>
      <strong className="matcha-review-prompt">{item.prompt}</strong>
      <p>Chọn đáp án đúng</p>
      <div className="matcha-answer-grid">
        {item.options.map((option) => (
          <button className={answer === option ? "selected" : ""} type="button" key={option} onClick={() => onAnswer(item, option)}>
            {option}
          </button>
        ))}
      </div>
      <button className="matcha-unknown-button" type="button" onClick={() => onAnswer(item, "")}>Bạn không biết?</button>
      <Feedback value={feedback} answer={item.answer} />
    </article>
  );
}

function Feedback({ value, answer }) {
  if (value === undefined) return null;
  return (
    <div className={`matcha-feedback ${value ? "correct" : "wrong"}`}>
      {value ? "Đúng" : `Sai${answer ? ` · Đáp án: ${answer}` : ""}`}
    </div>
  );
}

function DeckSection({ title, decks, emptyText, expanded, hasMore, onToggle, onOpen }) {
  return (
    <section className="matcha-deck-section">
      <div className="matcha-section-title">
        <h2>{title}</h2>
        {hasMore ? <button type="button" onClick={onToggle}>{expanded ? "Thu gọn" : "Xem thêm"}</button> : null}
      </div>
      <div className="matcha-deck-grid">
        {decks.map((deck) => (
          <button className="matcha-deck-item" type="button" key={deck.id} onClick={() => onOpen(deck)}>
            <span>▱</span>
            <small>
              <strong>{deck.title}</strong>
              {deck.cardCount ?? 0} thẻ · bởi {deck.isSystem ? "hệ thống" : "bạn"}
            </small>
          </button>
        ))}
        {!decks.length ? <p>{emptyText}</p> : null}
      </div>
    </section>
  );
}

function filterDecks(decks, keyword) {
  const q = normalize(keyword);
  if (!q) return decks;
  return decks.filter((deck) => normalize(`${deck.title} ${deck.description}`).includes(q));
}

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
