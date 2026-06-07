import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import FlashcardDeckPicker from "../components/FlashcardDeckPicker.jsx";
import PronunciationButton from "../components/PronunciationButton.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const fallback = {
  id: 1,
  kanji: "学校",
  word: "学校",
  reading: "がっこう",
  meaningVi: "Truong học",
  meaningEn: "",
  wordType: "Danh từ",
  levelId: 1,
  lessonNote: "",
  source: "",
  sourceEntryId: "",
  priorityTags: "",
  senses: [],
  examples: [],
  kanjis: [],
};

const levelLabel = (levelId) => ({ 1: "N5", 2: "N4", 3: "N3", 4: "N2", 5: "N1" }[levelId] ?? "N5");

export default function NihonVocabularyDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(fallback);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deckPickerOpen, setDeckPickerOpen] = useState(false);
  const backTo = location.state?.from || "/vocabularies";

  useEffect(() => {
    async function load() {
      try {
        const data = await learningApi.getDictionaryWord(id);
        setItem({ ...fallback, ...data });
      } catch {
        setMessage("Không gọi được API chi tiết từ, đang hiển thị dữ liệu mẫu.");
      }
    }
    load();
  }, [id]);

  const requireLogin = () => {
    if (isAuthenticated) return false;
    navigate("/login", { state: { from: `/vocabularies/${id}` } });
    return true;
  };

  const save = async () => {
    if (requireLogin()) return;
    try {
      setSaving(true);
      await learningApi.saveVocabulary(id);
      setSaved(true);
      setMessage("Đã lưu từ vựng vào danh sách học cá nhân.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudyShell active="Từ vựng" title="Chi tiết từ vựng">
      <main className="study-main vocab-detail-main">
        <Link className="detail-back" to={backTo}>Quay lại tra cứu</Link>
        <section className="vocab-detail-hero">
          <div>
            <span className="vocab-detail-level">JLPT {levelLabel(item.levelId)}</span>
            <h1>{item.kanji || item.word}</h1>
            <div className="pronunciation-row">
              <p>{item.reading}</p>
              <PronunciationButton
                text={item.reading || item.kanji || item.word}
                onError={setMessage}
              />
            </div>
          </div>
          <div className="detail-action-stack">
            <button type="button" onClick={() => (isAuthenticated ? setDeckPickerOpen(true) : requireLogin())}>
              + Flashcard
            </button>
            <button disabled={saving || saved} onClick={save}>
              {saved ? "Đã lưu" : saving ? "Đang lưu" : "Lưu từ này"}
            </button>
          </div>
        </section>

        {message ? <small className="study-note">{message}</small> : null}

        <section className="vocab-detail-grid">
          <article className="vocab-detail-card large">
            <h2>Nghĩa</h2>
            <p>{item.meaningVi || "Chưa có nghĩa tiếng Việt."}</p>
            {item.meaningEn ? <small>EN: {item.meaningEn}</small> : null}
          </article>
          <article className="vocab-detail-card">
            <h2>Loại từ</h2>
            <p>{item.wordType || "Chưa có"}</p>
          </article>
          <article className="vocab-detail-card">
            <h2>Nguồn dữ liệu</h2>
            <p>{item.source || "Chưa có nguồn"}</p>
            {item.sourceEntryId ? <small>Entry: {item.sourceEntryId}</small> : null}
            {item.priorityTags ? <small>Priority: {item.priorityTags}</small> : null}
          </article>
        </section>

        <section className="vocab-detail-card examples">
          <h2>Nghĩa chi tiet</h2>
          {(item.senses ?? []).length === 0 ? <p>Chưa có nghĩa riêng.</p> : null}
          {(item.senses ?? []).map((sense) => (
            <div className="detail-example" key={sense.id}>
              <strong>{sense.meaningVi || "Đang cập nhật nghĩa tiếng Việt"}</strong>
              {sense.meaningEn ? <p>EN: {sense.meaningEn}</p> : null}
              <span>{sense.partOfSpeech || item.wordType}</span>
            </div>
          ))}
        </section>

        {item.lessonNote ? (
          <section className="vocab-detail-card">
            <h2>Ghi chú</h2>
            <p>{item.lessonNote}</p>
          </section>
        ) : null}

        <section className="vocab-detail-card examples">
          <h2>Ví dụ minh họa</h2>
          {(item.examples ?? []).length === 0 ? <p>Chưa có ví dụ.</p> : null}
          {(item.examples ?? []).map((example) => (
            <div className="detail-example" key={example.id}>
              <div className="detail-example-head">
                <strong>{example.exampleJp}</strong>
                <PronunciationButton
                  text={example.exampleReading || example.exampleJp}
                  label="Nghe ví dụ"
                  onError={setMessage}
                />
              </div>
              <span>{example.exampleReading}</span>
              <p>{example.exampleVi}</p>
            </div>
          ))}
        </section>

        <section className="vocab-detail-card related">
          <h2>Kanji thành phần</h2>
          <div>
            {(item.kanjis ?? []).map((kanji) => (
              <Link to={`/kanjis/${kanji.kanjiChar}`} key={kanji.id}>
                {kanji.kanjiChar} - {kanji.meaningVi || "Đang cập nhật nghĩa tiếng Việt"}
              </Link>
            ))}
            <Link to="/flashcards">On bạng flashcard</Link>
            <Link to="/exercises">Làm bài tập nhanh</Link>
          </div>
        </section>
        <FlashcardDeckPicker
          vocabulary={item}
          open={deckPickerOpen}
          onClose={() => setDeckPickerOpen(false)}
        />
      </main>
    </StudyShell>
  );
}
