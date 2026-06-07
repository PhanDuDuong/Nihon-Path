import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { exerciseCategories, getLessonsForCategory, jlptLevels } from "../data/exerciseLessonCatalog.js";
import { loadCompletedLessons } from "../utils/lessonProgress.js";

export default function NihonGrammarPage() {
  const { levelSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const requestedLevel = jlptLevels.find((level) => level.slug === levelSlug) ?? jlptLevels[0];
  const requestedCategory = exerciseCategories.find((category) => category.slug === searchParams.get("category")) ?? exerciseCategories[0];
  const [activeLevel, setActiveLevel] = useState(requestedLevel);
  const [activeCategory, setActiveCategory] = useState(requestedCategory);
  const [completedLessons, setCompletedLessons] = useState([]);
  const lessons = getLessonsForCategory(activeLevel.slug, activeCategory.slug);
  const completedSet = new Set(completedLessons);
  const completedCount = lessons.filter((lesson) => completedSet.has(lesson.id)).length;

  useEffect(() => {
    setActiveLevel(requestedLevel);
  }, [requestedLevel]);

  useEffect(() => {
    setActiveCategory(requestedCategory);
  }, [requestedCategory]);

  const selectCategory = (category) => {
    setActiveCategory(category);
    setSearchParams(category.slug === exerciseCategories[0].slug ? {} : { category: category.slug });
  };

  useEffect(() => {
    const syncCompletedLessons = () => {
      setCompletedLessons(isAuthenticated ? loadCompletedLessons(user) : []);
    };
    syncCompletedLessons();
    window.addEventListener("focus", syncCompletedLessons);
    window.addEventListener("nihonpath:lesson-progress", syncCompletedLessons);
    return () => {
      window.removeEventListener("focus", syncCompletedLessons);
      window.removeEventListener("nihonpath:lesson-progress", syncCompletedLessons);
    };
  }, [isAuthenticated, user]);

  return (
    <StudyShell active="Bài học" title="Bài học">
      <main className="study-main grammar-main practice-main">
        <section className="practice-hero">
          <h1>Bài học theo cấp độ JLPT</h1>
          <p>Chọn cấp độ, chọn kỹ năng, rồi mở từng bài học chi tiết theo lộ trình 25 bài.</p>
          <div className="practice-levels">
            {jlptLevels.map((level) => (
              <button className={activeLevel.slug === level.slug ? "active" : ""} key={level.slug} onClick={() => setActiveLevel(level)}>
                {level.label}
              </button>
            ))}
          </div>
        </section>

        <section className="lesson-board">
          <div className="lesson-board-header">
            <div>
              <span className="practice-tag">JLPT {activeLevel.label}</span>
              <h2>{activeLevel.label} - Lộ trình bài học</h2>
              <p>{activeLevel.description}</p>
            </div>
            <strong>{exerciseCategories.length} kỹ năng · 25 bài/kỹ năng</strong>
          </div>

          {isAuthenticated ? (
            <div className="lesson-progress-strip">
              <div>
                <strong>{completedCount}/{lessons.length}</strong>
                <span>bài đã hoàn thành trong mục này</span>
              </div>
              <progress value={completedCount} max={lessons.length || 1} />
            </div>
          ) : null}

          <div className="lesson-category-grid">
            {exerciseCategories.map((category) => (
              <button
                type="button"
                className={activeCategory.slug === category.slug ? "active" : ""}
                onClick={() => selectCategory(category)}
                key={category.slug}
              >
                <span>{category.icon}</span>
                <strong>{category.title}</strong>
                <small>{category.description}</small>
              </button>
            ))}
          </div>

          <section className="lesson-list-panel">
            <div className="lesson-list-heading">
              <div>
                <h3>{activeLevel.label} · {activeCategory.title}</h3>
                <p>Học lần lượt 25 bài, mỗi bài có mục tiêu, nội dung, ví dụ minh họa và phần tự ôn.</p>
              </div>
              <Link to={`/grammar/${activeLevel.slug}/${activeCategory.slug}/${lessons[0]?.lessonNo ?? 1}`}>Mở bài đầu tiên</Link>
            </div>

            <div className="lesson-card-grid">
              {lessons.map((lesson) => {
                const completed = completedSet.has(lesson.id);
                return (
                  <Link
                    className={`lesson-card ${completed ? "is-completed" : ""}`}
                    to={`/grammar/${activeLevel.slug}/${activeCategory.slug}/${lesson.lessonNo}`}
                    key={lesson.id}
                  >
                    <span>
                      Bài {String(lesson.lessonNo).padStart(2, "0")}
                      {completed ? <em>✓ Đã học</em> : null}
                    </span>
                    <strong>{lesson.title.split(": ")[1]}</strong>
                    <p>{lesson.summary}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </section>
      </main>
    </StudyShell>
  );
}
