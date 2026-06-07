import { useEffect, useMemo, useState } from "react";
import { learningApi } from "../api/learningApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { exerciseCategories, jlptLevels } from "../data/exerciseLessonCatalog.js";
import { loadCompletedLessons } from "../utils/lessonProgress.js";

export default function NihonDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [savedVocabularies, setSavedVocabularies] = useState([]);
  const [savedKanjis, setSavedKanjis] = useState([]);
  const [savedGrammar, setSavedGrammar] = useState([]);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [message, setMessage] = useState("");
  const totalCatalogLessons = jlptLevels.length * exerciseCategories.length * 25;
  const completedLessons = completedLessonIds.length;
  const lessonPercent = Math.round((completedLessons / totalCatalogLessons) * 100);

  useEffect(() => {
    async function load() {
      try {
        const [dashboardData, vocabData, kanjiData, grammarData] = await Promise.all([
          learningApi.getDashboard(),
          learningApi.getSavedVocabularies().catch(() => []),
          learningApi.getSavedKanjis().catch(() => []),
          learningApi.getSavedGrammarLessons().catch(() => []),
        ]);
        setDashboard(dashboardData);
        setSavedVocabularies(vocabData);
        setSavedKanjis(kanjiData);
        setSavedGrammar(grammarData);
      } catch (err) {
        setMessage(err.message);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const syncCompletedLessons = () => setCompletedLessonIds(loadCompletedLessons(user));
    syncCompletedLessons();
    window.addEventListener("focus", syncCompletedLessons);
    window.addEventListener("nihonpath:lesson-progress", syncCompletedLessons);
    return () => {
      window.removeEventListener("focus", syncCompletedLessons);
      window.removeEventListener("nihonpath:lesson-progress", syncCompletedLessons);
    };
  }, [user]);

  const stats = useMemo(
    () => [
      [dashboard?.totalVocab ?? savedVocabularies.length, "Từ đã lưu"],
      [dashboard?.totalKanji ?? savedKanjis.length, "Kanji đã lưu"],
      [completedLessons, "Bài học hoàn thành"],
      [dashboard?.totalExercise ?? 0, "Bài tập đã làm"],
      [dashboard?.totalExam ?? 0, "Đề JLPT đã làm"],
      [dashboard?.flashcardReviewed ?? 0, "Flashcard đã ôn"],
    ],
    [dashboard, savedVocabularies.length, savedKanjis.length, completedLessons]
  );

  return (
    <div className="dashboard-content">
      <div className="dashboard-content-inner">
        <header className="dashboard-topbar">
          <strong>Dashboard học tập</strong>
          <span>{user?.fullName || user?.email || "Người học"}</span>
        </header>

        <main className="dashboard-main">
          <section className="dashboard-hello dashboard-hero-card">
            <span className="vocab-detail-level">Tổng quan hôm nay</span>
            <h1>Xin chào, {user?.fullName || "bạn"}</h1>
          </section>

          <section className="today-goal dashboard-progress-card">
            <h3>Tiến độ bài học</h3>
            <strong>{lessonPercent}%</strong>
            <p>{completedLessons}/{totalCatalogLessons} bài đã được tích hoàn thành.</p>
            <div className="today-progress"><span style={{ width: `${lessonPercent}%` }} /></div>
          </section>

          {message ? <small className="study-note">{message}</small> : null}

          <div className="dashboard-stat-grid">
            {stats.map(([value, label]) => (
              <section className="dashboard-stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
