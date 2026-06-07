import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const fallback = {
  id: 1,
  grammarPattern: "~たいです",
  title: "Muon lam gi do",
  meaningVi: "Diễn tả mong muốn của người nói.",
  usageText: "Vます bo ます + たいです",
  noteText: "Với mong muốn của người khác, nên dùng ~たがっています.",
  comparisonText: "",
  levelId: 1,
};

const levelLabel = (levelId) => ({ 1: "N5", 2: "N4", 3: "N3", 4: "N2", 5: "N1" }[levelId] ?? "N5");

export default function NihonGrammarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lesson, setLesson] = useState(fallback);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [learningStatus, setLearningStatus] = useState("NEW");

  useEffect(() => {
    async function load() {
      try {
        const data = await learningApi.getGrammarLesson(id);
        setLesson({ ...fallback, ...data });
      } catch {
        setMessage("Không gọi được API ngữ pháp, đang hiển thị dữ liệu mẫu.");
      }
    }
    load();
  }, [id]);

  const requireLogin = () => {
    if (isAuthenticated) return false;
    navigate("/login", { state: { from: `/grammar/detail/${id}` } });
    return true;
  };

  const save = async () => {
    if (requireLogin()) return;
    try {
      await learningApi.saveGrammarLesson(lesson.id);
      setSaved(true);
      setMessage("Đã lưu bài ngữ pháp để học lại.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateProgress = async (nextStatus) => {
    if (requireLogin()) return;
    try {
      setLearningStatus(nextStatus);
      await learningApi.updateGrammarProgress(lesson.id, {
        learningStatus: nextStatus,
        bookmarked: true,
      });
      setSaved(true);
      setMessage("Đã cập nhật trạng thái học ngữ pháp.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <StudyShell active="Bài học" title="Chi tiết bài học">
      <main className="study-main detail-page">
        <Link className="detail-back" to="/grammar">Quay lại danh sách bài học</Link>

        <section className="detail-hero grammar-detail-hero">
          <div>
            <span className="vocab-detail-level">JLPT {levelLabel(lesson.levelId)}</span>
            <h1>{lesson.grammarPattern}</h1>
            <p>{lesson.title}</p>
          </div>
          <div className="detail-action-stack">
            <button type="button" onClick={save}>{saved ? "Đã lưu" : "Lưu bài học"}</button>
            <select value={learningStatus} onChange={(event) => updateProgress(event.target.value)}>
              <option value="NEW">Mới học</option>
              <option value="LEARNING">Đang học</option>
              <option value="MASTERED">Đã nắm</option>
            </select>
            <Link to="/exercises">Làm bài tập</Link>
          </div>
        </section>

        {message ? <small className="study-note">{message}</small> : null}

        <section className="vocab-detail-grid">
          <article className="vocab-detail-card large">
            <h2>Ý nghĩa</h2>
            <p>{lesson.meaningVi || "Chưa có ý nghĩa tiếng Việt."}</p>
          </article>
          <article className="vocab-detail-card">
            <h2>Cách dùng</h2>
            <p>{lesson.usageText || "Chưa có cách dùng."}</p>
          </article>
        </section>

        <section className="vocab-detail-card examples">
          <h2>Lưu ý và so sánh</h2>
          <div className="detail-example">
            <strong>Lưu ý</strong>
            <p>{lesson.noteText || "Chưa có lưu ý."}</p>
          </div>
          <div className="detail-example">
            <strong>So sánh</strong>
            <p>{lesson.comparisonText || "Chưa có nội dung so sánh."}</p>
          </div>
        </section>

        <section className="vocab-detail-card related">
          <h2>Học tiếp</h2>
          <div>
            <Link to="/flashcards">Tạo flashcard mẫu câu</Link>
            <Link to="/exams">Luyện đề JLPT</Link>
            <Link to="/dashboard">Xem tiến độ</Link>
          </div>
        </section>
      </main>
    </StudyShell>
  );
}
