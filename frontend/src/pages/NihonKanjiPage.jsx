import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import DictionarySearchPanel from "../components/DictionarySearchPanel.jsx";
import StudyShell from "../components/StudyShell.jsx";

const fallbackKanjis = [
  { id: 1, kanjiChar: "学", meaningVi: "học", meaningEn: "", onyomi: "ガク", kunyomi: "まな.ぶ", strokeCount: 8, radical: "子", levelId: 1 },
];

const levelLabel = (levelId) => ({ 1: "N5", 2: "N4", 3: "N3", 4: "N2", 5: "N1" }[levelId] ?? "N5");

function normalizeKanji(item, index) {
  return {
    ...fallbackKanjis[index % fallbackKanjis.length],
    ...item,
    meaningVi: item.meaningVi || "Đang cập nhật nghĩa tiếng Việt",
    meaningEn: item.meaningEn || "",
    hanVietReading: item.hanVietReading || "",
  };
}

export default function NihonKanjiPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState(fallbackKanjis);
  const [keyword, setKeyword] = useState(searchParams.get("q") || "学");
  const [inputMode, setInputMode] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await learningApi.searchDictionary(text.trim(), 20);
      if (requestId !== searchRequestRef.current) {
        return;
      }
      const kanjis = data.kanjis ?? [];
      setItems(kanjis.map(normalizeKanji));
      if (kanjis.length === 0) {
        setMessage("Chưa tìm thấy kanji. Dữ liệu mẫu hiện có: 食, 飲, 学, 先, 生, 行.");
      }
    } catch (err) {
      if (requestId !== searchRequestRef.current) {
        return;
      }
      setMessage(err.message || "Không gọi được API tìm kiếm.");
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

  const saveKanji = async (item) => {
    setMessage("");
    setSavingIds((ids) => [...new Set([...ids, item.id])]);
    try {
      await learningApi.saveKanji(item.id);
      setSavedIds((ids) => [...new Set([...ids, item.id])]);
      setMessage(`Đã lưu ${item.kanjiChar} vào danh sách học.`);
    } catch (err) {
      setMessage(err.message || "Chưa lưu được kanji này.");
    } finally {
      setSavingIds((ids) => ids.filter((id) => id !== item.id));
    }
  };

  const suggestionsByMode = {
    all: ["学", "食", "gaku", "học", "ăn"],
    japanese: ["学", "食", "飲", "先", "生", "行"],
    romaji: ["gaku", "shoku", "in", "sen", "sei", "kou"],
    vietnamese: ["học", "ăn", "uống", "trước", "sống", "đi"],
    handwriting: ["学", "食", "飲", "先", "生", "行"],
  };

  return (
    <StudyShell active="Kanji" title="Tra cứu kanji">
      <main className="study-main kanji-main">
        <section className="study-heading">
          <h1>Kanji</h1>
          <p>Tìm theo một ký tự kanji để xem âm đọc, số nét, bộ thủ và từ liên quan.</p>
        </section>

        <DictionarySearchPanel
          keyword={keyword}
          onKeywordChange={setKeyword}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          loading={loading}
          onSubmit={handleSearch}
          placeholder="学, gaku, học"
          helperText="Tìm theo kanji, âm On/Kun, romaji hoặc nghĩa tiếng Việt."
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
                <p>Bảng bên trái dùng để ghi nháp nét. Để nhập thật trên Chrome hoặc Brave, bật Japanese IME của hệ điều hành rồi gõ romaji như gaku, shoku, hoặc dùng IME Pad để chọn kanji.</p>
                <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Gõ bằng Japanese IME: 学, 食, 飲" />
                <button type="button" onClick={clearHandwriting}>Xóa bảng</button>
              </div>
            </div>
          ) : null}
        </DictionarySearchPanel>

        <section className="kanji-result-grid">
          {items.map((item) => (
            <article className="kanji-result-card" key={item.id}>
              <div className="kanji-glyph">{item.kanjiChar}</div>
              <h3>{item.meaningVi}</h3>
              {item.hanVietReading ? <p><strong>Hán Việt:</strong> {item.hanVietReading}</p> : null}
              <p><strong>On:</strong> {item.onyomi || "Chưa có"}</p>
              <p><strong>Kun:</strong> {item.kunyomi || "Chưa có"}</p>
              <p><strong>Số nét:</strong> {item.strokeCount}</p>
              <div className="vocab-tags">
                <span className="blue">JLPT {levelLabel(item.levelId)}</span>
                <span>Bộ {item.radical || "?"}</span>
                {item.source ? <span>{item.source}</span> : null}
              </div>
              <div className="kanji-card-actions">
                <Link to={`/kanjis/${item.kanjiChar}`}>Chi tiết</Link>
                <button type="button" disabled={savingIds.includes(item.id) || savedIds.includes(item.id)} onClick={() => saveKanji(item)}>
                  {savedIds.includes(item.id) ? "✓ Đã lưu" : savingIds.includes(item.id) ? "Đang lưu" : "☆ Lưu"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </StudyShell>
  );
}
