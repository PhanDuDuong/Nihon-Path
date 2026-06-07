import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import DictionarySearchPanel from "../components/DictionarySearchPanel.jsx";
import FlashcardDeckPicker from "../components/FlashcardDeckPicker.jsx";
import LoginRequiredModal from "../components/LoginRequiredModal.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const fallbackVocabularies = [
  {
    id: 1,
    kanji: "学校",
    word: "学校",
    reading: "がっこう",
    meaningVi: "Trường học",
    meaningEn: "",
    wordType: "Danh từ",
    levelId: 1,
    example: "例: わたしは毎日学校へ行きます。",
    isCommon: true,
  },
];

const levelLabel = (levelId) => ({ 1: "N5", 2: "N4", 3: "N3", 4: "N2", 5: "N1" }[levelId] ?? "N5");

function normalizeVocabulary(item, index) {
  return {
    id: item.id ?? index + 1,
    kanji: item.kanji || item.word,
    word: item.word,
    reading: item.reading,
    meaningVi: item.meaningVi || "Đang cập nhật nghĩa tiếng Việt",
    meaningEn: item.meaningEn || "",
    wordType: item.wordType || "Từ vựng",
    levelId: item.levelId ?? 1,
    example: item.example || item.examples?.[0]?.exampleJp || "Chưa có ví dụ minh họa.",
    isCommon: item.isCommon ?? false,
    source: item.source || "",
    sourceEntryId: item.sourceEntryId || "",
    priorityTags: item.priorityTags || "",
  };
}

function normalizeKanji(item) {
  return {
    id: item.id,
    kanjiChar: item.kanjiChar,
    meaningVi: item.meaningVi || "Đang cập nhật nghĩa tiếng Việt",
    meaningEn: item.meaningEn || "",
    onyomi: item.onyomi || "",
    kunyomi: item.kunyomi || "",
    strokeCount: item.strokeCount,
    radical: item.radical || "",
    levelId: item.levelId ?? 1,
    source: item.source || "",
    sourceEntryId: item.sourceEntryId || "",
  };
}

export default function NihonVocabularyPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState(fallbackVocabularies);
  const [kanjiItems, setKanjiItems] = useState([]);
  const [keyword, setKeyword] = useState(searchParams.get("q") || "学");
  const [inputMode, setInputMode] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [deckPickerVocabulary, setDeckPickerVocabulary] = useState(null);
  const [loginModalMessage, setLoginModalMessage] = useState("");
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const searchRequestRef = useRef(0);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef([]);

  const runSearch = async (text) => {
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setMessage("");
    if (!text.trim()) {
      setItems([]);
      setKanjiItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await learningApi.searchDictionary(text.trim(), 20);
      if (requestId !== searchRequestRef.current) {
        return;
      }
      const vocabularies = (data.vocabularies ?? []).map(normalizeVocabulary);
      const kanjis = (data.kanjis ?? []).map(normalizeKanji);
      setItems(vocabularies);
      setKanjiItems(kanjis);
      if (vocabularies.length === 0 && kanjis.length === 0) {
        setMessage("Chưa tìm thấy kết quả. Dữ liệu mẫu hiện có: たべます, のみます, 学生, 先生, 行きます.");
      }
    } catch (err) {
      if (requestId !== searchRequestRef.current) {
        return;
      }
      setMessage(err.message || "Không gọi được API từ điển.");
    } finally {
      if (requestId === searchRequestRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      runSearch(keyword);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [keyword]);

  useEffect(() => {
    prepareCanvas();
  }, [inputMode]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== keyword) {
      setKeyword(q);
    }
  }, [searchParams]);

  const handleSearch = async (event) => {
    event.preventDefault();
    await runSearch(keyword);
  };

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(48, 55, 22, 0.14)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(canvas.width / 2, 0);
    context.lineTo(canvas.width / 2, canvas.height);
    context.moveTo(0, canvas.height / 2);
    context.lineTo(canvas.width, canvas.height / 2);
    context.stroke();
  };

  const getCanvasPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (event.clientY - rect.top) * (canvasRef.current.height / rect.height),
      t: Date.now(),
    };
  };

  const startDrawing = (event) => {
    if (!canvasRef.current) return;
    event.preventDefault();
    drawingRef.current = true;
    currentStrokeRef.current = [getCanvasPoint(event)];
    canvasRef.current.setPointerCapture?.(event.pointerId);
  };

  const draw = (event) => {
    if (!drawingRef.current || !canvasRef.current) return;
    event.preventDefault();
    const point = getCanvasPoint(event);
    const previous = currentStrokeRef.current[currentStrokeRef.current.length - 1];
    currentStrokeRef.current.push(point);
    const context = canvasRef.current.getContext("2d");
    context.strokeStyle = "#303716";
    context.lineWidth = 8;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = [];
    }
  };

  const clearHandwriting = () => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    prepareCanvas();
  };

  const saveVocabulary = async (item) => {
    setMessage("");
    if (!isAuthenticated) {
      setLoginModalMessage("Bạn cần đăng nhập để lưu từ vựng và đưa từ đó vào bộ flashcard Từ vựng tôi lưu.");
      return;
    }
    setSavingIds((ids) => [...new Set([...ids, item.id])]);
    try {
      await learningApi.saveVocabulary(item.id);
      setSavedIds((ids) => [...new Set([...ids, item.id])]);
      setMessage(`Đã lưu ${item.kanji || item.word} vào danh sách học.`);
    } catch (err) {
      setMessage(err.message || "Chưa lưu được từ này.");
    } finally {
      setSavingIds((ids) => ids.filter((id) => id !== item.id));
    }
  };

  const suggestionsByMode = {
    all: ["学", "食べる", "gakusei", "taberu", "học"],
    japanese: ["食べる", "学生", "ガクセイ", "がくせい", "飲む"],
    romaji: ["gakusei", "taberu", "nomu", "sensei", "ikimasu"],
    vietnamese: ["học", "ăn", "uống", "giáo viên", "đi"],
    handwriting: ["学", "食", "飲", "先", "生"],
  };

  return (
    <StudyShell active="Từ vựng" topSearch title="Tra cứu từ vựng">
      <main className="study-main vocab-main">
        <section className="study-heading">
          <h1>Tra cứu từ vựng</h1>
          <p>Tìm theo hiragana, katakana, kanji, romaji hoặc nghĩa tiếng Việt.</p>
        </section>

        <DictionarySearchPanel
          keyword={keyword}
          onKeywordChange={setKeyword}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          loading={loading}
          onSubmit={handleSearch}
          placeholder="食べる, taberu, học"
          helperText="Nhập kanji, katakana, hiragana, romaji hoặc tiếng Việt."
          suggestions={suggestionsByMode[inputMode] ?? suggestionsByMode.all}
          hideSearchExtras
          message={message}
        >
          {inputMode === "handwriting" ? (
            <div className="handwriting-panel">
              <canvas
                ref={canvasRef}
                width="320"
                height="240"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
              />
              <div className="handwriting-controls">
                <strong>Japanese IME</strong>
                <p>Bảng bên trái dùng để ghi nháp nét. Để nhập thật trên Chrome hoặc Brave, bật Japanese IME của hệ điều hành rồi gõ romaji như gakusei, taberu, hoặc dùng IME Pad để chọn kanji.</p>
                <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Gõ bằng Japanese IME: がくせい, 学生, 食べる" />
                <button type="button" onClick={clearHandwriting}>Xóa bảng</button>
              </div>
            </div>
          ) : null}
        </DictionarySearchPanel>

        <section className="vocab-content-grid">
          <div className="vocab-results">
            {items.map((item) => (
              <article className="vocab-result-card" key={item.id}>
                <div className="vocab-result-copy">
                  <div className="vocab-title-row">
                    <strong>{item.kanji}</strong>
                    <span>{item.reading}</span>
                  </div>
                  <p>{item.meaningVi}</p>
                  <div className="vocab-tags">
                    <span>{item.wordType}</span>
                    <span className="blue">JLPT {levelLabel(item.levelId)}</span>
                    <span>{item.isCommon ? "Phổ biến" : "Từ điển"}</span>
                    {item.source ? <span>{item.source}</span> : null}
                  </div>
                  <small>{item.example}</small>
                </div>
                <div className="vocab-actions">
                  <Link to={`/vocabularies/${item.id}`} state={{ from: `${location.pathname}${location.search}` }}>Chi tiết</Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setLoginModalMessage("Bạn cần đăng nhập để thêm từ vào flashcard.");
                        return;
                      }
                      setDeckPickerVocabulary(item);
                    }}
                  >
                    + Flashcard
                  </button>
                  <button type="button" disabled={savingIds.includes(item.id) || savedIds.includes(item.id)} onClick={() => saveVocabulary(item)}>
                    {savedIds.includes(item.id) ? "✓ Đã lưu" : savingIds.includes(item.id) ? "Đang lưu" : "☆ Lưu"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="vocab-side-panel">
            <section>
              <h3>Kanji khớp</h3>
              {kanjiItems.length === 0 ? <span>Nhập đúng 1 kanji để xem nhanh.</span> : null}
              {kanjiItems.map((kanji) => (
                <Link to={`/kanjis/${kanji.kanjiChar}`} state={{ from: `${location.pathname}${location.search}` }} key={kanji.id}>
                  {kanji.kanjiChar} - {kanji.meaningVi}
                </Link>
              ))}
            </section>
            <section>
              <h3>Gợi ý tra cứu</h3>
              {["学", "学生", "gakusei", "食べる", "học"].map((item) => (
                <button type="button" onClick={() => setKeyword(item)} key={item}>{item}</button>
              ))}
            </section>
            <section className="flashcard-promo">
              <h3>Ôn bằng flashcard</h3>
              <p>Lưu từ sau khi xem chi tiết để đưa vào luồng ôn tập cá nhân.</p>
              <Link to="/flashcards">Mở flashcard</Link>
            </section>
          </aside>
        </section>
        <FlashcardDeckPicker
          vocabulary={deckPickerVocabulary}
          open={Boolean(deckPickerVocabulary)}
          onClose={() => setDeckPickerVocabulary(null)}
        />
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
