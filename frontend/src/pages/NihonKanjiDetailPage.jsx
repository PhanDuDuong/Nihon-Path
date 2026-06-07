import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import PronunciationButton from "../components/PronunciationButton.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const fallback = {
  id: 1,
  kanjiChar: "学",
  meaningVi: "học",
  hanVietReading: "",
  meaningEn: "",
  onyomi: "ガク",
  kunyomi: "まな.ぶ",
  nanori: "",
  strokeCount: 8,
  radical: "子",
  levelId: 1,
  grade: "",
  jlptLegacy: "",
  strokeOrderSvgUrl: "",
  strokeOrderImageUrl: "",
  strokeOrderGifUrl: "",
  penStrokes: "",
  shape: "",
  unicodeCodepoint: "",
  source: "",
  sourceEntryId: "",
  vocabularies: [],
};

const levelLabel = (levelId) => ({ 1: "N5", 2: "N4", 3: "N3", 4: "N2", 5: "N1" }[levelId] ?? "N5");
const idsOperators = new Set(["⿰", "⿱", "⿲", "⿳", "⿴", "⿵", "⿶", "⿷", "⿸", "⿹", "⿺", "⿻"]);
const componentNames = { 門: "MÔN", 耳: "NHĨ", 手: "THỦ", "⺘": "THỦ", 扌: "THỦ", 甫: "PHỦ" };
const componentDisplay = { "⺘": "手", 扌: "手" };

function kanjiComponents(shape) {
  if (!shape) return [];
  return Array.from(shape)
    .filter((char) => !idsOperators.has(char))
    .map((char) => ({ char: componentDisplay[char] || char, name: componentNames[char] || "" }));
}

function backendGifUrl(kanjiChar) {
  if (!kanjiChar) return "";
  return `/api/dictionary/kanji/${encodeURIComponent(kanjiChar)}/stroke-order.gif`;
}

function cacheBust(url, reloadKey) {
  if (!url || !reloadKey) return url;
  return `${url}${url.includes("?") ? "&" : "?"}r=${reloadKey}`;
}

export default function NihonKanjiDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(fallback);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [strokeMedia, setStrokeMedia] = useState("gif");
  const [reloadKey, setReloadKey] = useState(0);
  const backTo = location.state?.from || "/kanjis";

  const gifUrl = useMemo(() => {
    const dbGif = item.strokeOrderGifUrl;
    const url = dbGif || backendGifUrl(item.kanjiChar);
    return cacheBust(url, reloadKey);
  }, [item.kanjiChar, item.strokeOrderGifUrl, reloadKey]);
  const components = useMemo(() => kanjiComponents(item.shape), [item.shape]);

  useEffect(() => {
    async function load() {
      try {
        const data = await learningApi.getDictionaryKanji(id);
        setItem({ ...fallback, ...data });
        setStrokeMedia("gif");
        setReloadKey(0);
      } catch {
        setMessage("Không gọi được API chi tiết kanji, đang hiển thị dữ liệu mẫu.");
      }
    }
    load();
  }, [id]);

  const save = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/kanjis/${id}` } });
      return;
    }
    try {
      setSaving(true);
      await learningApi.saveKanji(item.id);
      setSaved(true);
      setMessage("Đã lưu kanji vào danh sách học cá nhân.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const replayGif = () => {
    setStrokeMedia("gif");
    setReloadKey((current) => current + 1);
  };

  return (
    <StudyShell active="Kanji" title="Chi tiết kanji" topLink={{ label: "Trang chủ", to: "/" }}>
      <main className="study-main detail-page">
        <Link className="detail-back" to={backTo}>Quay lại tra cứu kanji</Link>

        <section className="detail-hero kanji-detail-hero">
          <div className="kanji-detail-glyph">{item.kanjiChar}</div>
          <div>
            <span className="vocab-detail-level">JLPT {levelLabel(item.levelId)}</span>
            <h1>{item.meaningVi || "Đang cập nhật nghĩa tiếng Việt"}</h1>
            <p>Hán Việt: {item.hanVietReading || "Chưa có"} · On: {item.onyomi || "Chưa có"} · Kun: {item.kunyomi || "Chưa có"}</p>
            <div className="pronunciation-row">
              <PronunciationButton
                text={item.onyomi || item.kunyomi || item.kanjiChar}
                label="Nghe âm đọc"
                onError={setMessage}
              />
              {item.kunyomi ? (
                <PronunciationButton
                  text={item.kunyomi}
                  label="Nghe Kun"
                  onError={setMessage}
                />
              ) : null}
            </div>
          </div>
          <button disabled={saving || saved} onClick={save}>
            {saved ? "Đã lưu" : saving ? "Đang lưu" : "Lưu kanji"}
          </button>
        </section>

        {message ? <small className="study-note">{message}</small> : null}

        <section className="detail-stat-grid">
          <article>
            <strong>Số nét</strong>
            <span>{item.strokeCount || "Chưa có"}</span>
          </article>
          <article>
            <strong>Bộ thủ</strong>
            <span>{item.radical || "Chưa có"}</span>
          </article>
          <article>
            <strong>Hán Việt</strong>
            <span>{item.hanVietReading || "Chưa có"}</span>
          </article>
          <article>
            <strong>Nguồn dữ liệu</strong>
            <span>{item.sourceEntryId ? `${item.source} #${item.sourceEntryId}` : item.source || "KanjiVG / KanjiDictVN"}</span>
          </article>
        </section>

        <section className="kanji-writing-grid">
          <article className="vocab-detail-card kanji-stroke-card">
            <div className="kanji-stroke-heading">
              <div>
                <h2>Cách viết bằng GIF</h2>
                <p>Ảnh động từ database mô phỏng thứ tự từng nét để bạn nhìn và viết theo.</p>
              </div>
              <div className="kanji-stroke-actions">
                <button type="button" onClick={replayGif}>Phát lại</button>
                {item.strokeOrderGifUrl ? (
                  <a href={item.strokeOrderGifUrl} target="_blank" rel="noreferrer">Mở GIF</a>
                ) : null}
              </div>
            </div>

            <div className="kanji-stroke-media kanji-stroke-media--large">
              {strokeMedia === "gif" && gifUrl ? (
                <img
                  key={`${item.kanjiChar}-${reloadKey}`}
                  src={gifUrl}
                  alt={`GIF hướng dẫn thứ tự nét viết chữ ${item.kanjiChar}`}
                  onError={() => setStrokeMedia("svg")}
                />
              ) : null}
              {strokeMedia === "svg" && item.strokeOrderSvgUrl ? (
                <img
                  src={item.strokeOrderSvgUrl}
                  alt={`Sơ đồ nét chữ ${item.kanjiChar}`}
                  onError={() => setStrokeMedia("none")}
                />
              ) : null}
              {strokeMedia === "none" || (!gifUrl && !item.strokeOrderSvgUrl) ? (
                <div className="kanji-stroke-fallback">{item.kanjiChar}</div>
              ) : null}
            </div>

            <div className="kanji-stroke-note">
              <strong>Ghi chú cách viết</strong>
              <p>Nên xem GIF một lượt, sau đó bấm "Phát lại" và viết theo từng nét. Ưu tiên viết từ trên xuống dưới, trái sang phải; nét ngang thường đi trước nét dọc khi phù hợp.</p>
              <small>
                Web đang ưu tiên trường <code>stroke_gif_url</code> trong database. Nếu kanji chưa có GIF, hệ thống mới chuyển sang sơ đồ SVG/PenStrokes.
              </small>
            </div>
            <KanjiWritingPractice kanji={item.kanjiChar} />
          </article>

          <article className="vocab-detail-card kanji-info-card">
            <h2>Thông tin mở rộng</h2>
            <dl>
              <div>
                <dt>Nghĩa tiếng Anh</dt>
                <dd>{item.meaningEn || "Chưa có"}</dd>
              </div>
              <div>
                <dt>Âm On</dt>
                <dd>{item.onyomi || "Chưa có"}</dd>
              </div>
              <div>
                <dt>Âm Kun</dt>
                <dd>{item.kunyomi || "Chưa có"}</dd>
              </div>
              <div>
                <dt>PenStrokes</dt>
                <dd>{item.penStrokes || "Chưa có"}</dd>
              </div>
              <div>
                <dt>Cấu trúc chữ</dt>
                <dd>
                  {components.length ? (
                    <div className="kanji-breakdown-list">
                      {components.map((component, index) => (
                        <span key={`${component.char}-${index}`}>
                          <b>{component.char}</b>
                          {component.name ? <small>{component.name}</small> : null}
                        </span>
                      ))}
                    </div>
                  ) : item.shape || "Chưa có"}
                </dd>
              </div>
              <div>
                <dt>JLPT cũ</dt>
                <dd>{item.jlptLegacy || "Chưa có"}</dd>
              </div>
              <div>
                <dt>Lớp học tại Nhật</dt>
                <dd>{item.grade || "Chưa có"}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="vocab-detail-card examples">
          <h2>Từ vựng liên quan</h2>
          {(item.vocabularies ?? []).length === 0 ? <p>Chưa có từ liên quan.</p> : null}
          {(item.vocabularies ?? []).map((word) => (
            <div className="detail-example" key={word.id}>
              <div className="detail-example-head">
                <strong>{word.kanji || word.word}</strong>
                <PronunciationButton
                  text={word.reading || word.kanji || word.word}
                  label="Nghe"
                  onError={setMessage}
                />
              </div>
              <span>{word.reading}</span>
              <p>{word.meaningVi || "Đang cập nhật nghĩa tiếng Việt"}</p>
              <Link to={`/vocabularies/${word.id}`} state={{ from: `/kanjis/${id}` }}>Chi tiết từ</Link>
            </div>
          ))}
        </section>

      </main>
    </StudyShell>
  );
}

function KanjiWritingPractice({ kanji }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const strokesRef = useRef([]);
  const [strokes, setStrokes] = useState([]);
  const [result, setResult] = useState("idle");
  const [score, setScore] = useState(null);

  const drawAll = (nextStrokes = strokesRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(57, 113, 184, 0.06)";
    context.font = "220px serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(kanji || "", canvas.width / 2, canvas.height / 2 + 10);
    context.strokeStyle = result === "correct" ? "#2f8f5b" : result === "wrong" ? "#c43f3f" : "#17211f";
    context.lineWidth = 10;
    context.lineCap = "round";
    context.lineJoin = "round";
    nextStrokes.forEach((stroke) => {
      context.beginPath();
      stroke.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.stroke();
    });
  };

  useEffect(() => {
    drawAll();
  }, [kanji, result]);

  const canvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const collectBounds = (points) => {
    if (!points.length) return null;
    return points.reduce(
      (box, point) => ({
        minX: Math.min(box.minX, point.x),
        minY: Math.min(box.minY, point.y),
        maxX: Math.max(box.maxX, point.x),
        maxY: Math.max(box.maxY, point.y),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
  };

  const sampleTemplate = (canvas) => {
    const sample = document.createElement("canvas");
    sample.width = canvas.width;
    sample.height = canvas.height;
    const context = sample.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, sample.width, sample.height);
    context.fillStyle = "#000";
    context.font = "220px serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(kanji || "", sample.width / 2, sample.height / 2 + 10);
    const data = context.getImageData(0, 0, sample.width, sample.height).data;
    const points = [];
    for (let y = 0; y < sample.height; y += 8) {
      for (let x = 0; x < sample.width; x += 8) {
        const alphaIndex = (y * sample.width + x) * 4 + 3;
        const redIndex = (y * sample.width + x) * 4;
        if (data[alphaIndex] > 0 && data[redIndex] < 180) {
          points.push({ x, y });
        }
      }
    }
    return points;
  };

  const distanceToStroke = (point, drawnPoints) =>
    drawnPoints.reduce((best, drawn) => {
      const distance = Math.hypot(point.x - drawn.x, point.y - drawn.y);
      return Math.min(best, distance);
    }, Infinity);

  const rasterizeStrokes = (nextStrokes, canvas) => {
    const sample = document.createElement("canvas");
    sample.width = canvas.width;
    sample.height = canvas.height;
    const context = sample.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, sample.width, sample.height);
    context.strokeStyle = "#000";
    context.lineWidth = 10;
    context.lineCap = "round";
    context.lineJoin = "round";
    nextStrokes.forEach((stroke) => {
      context.beginPath();
      stroke.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.stroke();
    });
    const data = context.getImageData(0, 0, sample.width, sample.height).data;
    const points = [];
    for (let y = 0; y < sample.height; y += 6) {
      for (let x = 0; x < sample.width; x += 6) {
        const redIndex = (y * sample.width + x) * 4;
        if (data[redIndex] < 180) {
          points.push({ x, y });
        }
      }
    }
    return points;
  };

  const boxSimilarity = (drawnBox, templateBox) => {
    if (!drawnBox || !templateBox) return 0;
    const drawnWidth = Math.max(1, drawnBox.maxX - drawnBox.minX);
    const drawnHeight = Math.max(1, drawnBox.maxY - drawnBox.minY);
    const templateWidth = Math.max(1, templateBox.maxX - templateBox.minX);
    const templateHeight = Math.max(1, templateBox.maxY - templateBox.minY);
    const widthScore = 1 - Math.min(1, Math.abs(drawnWidth - templateWidth) / templateWidth);
    const heightScore = 1 - Math.min(1, Math.abs(drawnHeight - templateHeight) / templateHeight);
    const drawnCenter = { x: (drawnBox.minX + drawnBox.maxX) / 2, y: (drawnBox.minY + drawnBox.maxY) / 2 };
    const templateCenter = { x: (templateBox.minX + templateBox.maxX) / 2, y: (templateBox.minY + templateBox.maxY) / 2 };
    const centerScore = 1 - Math.min(1, Math.hypot(drawnCenter.x - templateCenter.x, drawnCenter.y - templateCenter.y) / 120);
    return (widthScore + heightScore + centerScore) / 3;
  };

  const scoreWriting = (nextStrokes) => {
    const canvas = canvasRef.current;
    const drawnPoints = nextStrokes.flat();
    if (!canvas || drawnPoints.length < 12) {
      setScore(null);
      return "idle";
    }
    const templatePoints = sampleTemplate(canvas);
    const drawnRasterPoints = rasterizeStrokes(nextStrokes, canvas);
    const drawnBox = collectBounds(drawnPoints);
    const templateBox = collectBounds(templatePoints);
    const coverageHits = templatePoints.filter((point) => distanceToStroke(point, drawnRasterPoints) <= 18).length;
    const coverageScore = templatePoints.length ? coverageHits / templatePoints.length : 0;
    const precisionHits = drawnRasterPoints.filter((point) => distanceToStroke(point, templatePoints) <= 12).length;
    const precisionScore = drawnRasterPoints.length ? precisionHits / drawnRasterPoints.length : 0;
    const shapeScore = boxSimilarity(drawnBox, templateBox);
    const inkRatio = templatePoints.length ? drawnRasterPoints.length / templatePoints.length : 0;
    const finalScore = Math.round((coverageScore * 0.45 + precisionScore * 0.35 + shapeScore * 0.2) * 100);
    setScore(finalScore);
    if (
      finalScore >= 55 &&
      coverageScore >= 0.34 &&
      precisionScore >= 0.44 &&
      shapeScore >= 0.44 &&
      inkRatio >= 0.28 &&
      inkRatio <= 1.8
    ) {
      return "correct";
    }
    if (drawnPoints.length < 36) return "idle";
    return "wrong";
  };

  const startStroke = (event) => {
    event.preventDefault();
    drawingRef.current = true;
    const nextStrokes = [...strokesRef.current, [canvasPoint(event)]];
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
    setResult("idle");
    setScore(null);
    drawAll(nextStrokes);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const nextStrokes = strokesRef.current.map((stroke, index) =>
      index === strokesRef.current.length - 1 ? [...stroke, canvasPoint(event)] : stroke
    );
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
    drawAll(nextStrokes);
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setResult(scoreWriting(strokesRef.current));
  };

  const reset = () => {
    strokesRef.current = [];
    setStrokes([]);
    setResult("idle");
    setScore(null);
  };

  const undo = () => {
    const nextStrokes = strokesRef.current.slice(0, -1);
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
    setResult(scoreWriting(nextStrokes));
  };

  return (
    <section className={`kanji-practice-card ${result === "correct" ? "is-correct" : result === "wrong" ? "is-wrong" : ""}`}>
      <div className="kanji-practice-heading">
        <div>
          <h2>Luyện viết kanji</h2>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width="320"
        height="320"
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      />
      <div className="kanji-practice-actions">
        <button type="button" onClick={undo} disabled={!strokes.length}>Quay lại 1 nét</button>
        <button type="button" onClick={reset} disabled={!strokes.length}>Reset</button>
        <span>{result === "correct" ? "Đạt" : result === "wrong" ? "Chưa đạt, hãy thử lại" : "Sẵn sàng luyện viết"}</span>
      </div>
    </section>
  );
}
