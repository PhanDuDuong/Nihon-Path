import { useEffect, useState } from "react";
import { learningApi } from "../api/learningApi.js";
import DataState from "../components/DataState.jsx";
import LoginRequiredModal from "../components/LoginRequiredModal.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const levels = [
  ["N5", 1],
  ["N4", 2],
  ["N3", 3],
  ["N2", 4],
  ["N1", 5],
];

export default function NihonExercisePage() {
  const { isAuthenticated } = useAuth();
  const [levelId, setLevelId] = useState(1);
  const [items, setItems] = useState([]);
  const [completedExerciseIds, setCompletedExerciseIds] = useState(() => new Set());
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      setQuiz(null);
      setResult(null);
      try {
        setItems(await learningApi.getExercises({ levelId }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [levelId]);

  useEffect(() => {
    async function loadCompletedExercises() {
      if (!isAuthenticated) {
        setCompletedExerciseIds(new Set());
        return;
      }

      try {
        const attempts = await learningApi.getExerciseAttempts();
        setCompletedExerciseIds(new Set(attempts.map((attempt) => attempt.exerciseSetId).filter(Boolean)));
      } catch {
        setCompletedExerciseIds(new Set());
      }
    }

    loadCompletedExercises();
  }, [isAuthenticated]);

  const startQuiz = async (id) => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setQuiz(await learningApi.getExercise(id));
      setAnswers({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const submittedResult = await learningApi.submitExercise({ exerciseSetId: quiz.id, answers });
      setResult(submittedResult);
      setCompletedExerciseIds((current) => new Set([...current, quiz.id]));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSelectedChoice = (question, choice) => answers[question.id] === choice.id;
  const isCorrectChoice = (choice) => result && Boolean(choice.isCorrect);
  const isWrongChoice = (question, choice) => result && isSelectedChoice(question, choice) && !choice.isCorrect;
  const playableItems = items.filter((item) => (item.questions ?? []).length > 0);

  return (
    <StudyShell active="Bài tập" title="Bài tập">
      <main className="study-main practice-main">
        <section className="practice-hero">
          <h1>Luyện bài tập theo chủ đề</h1>
          <p>Chọn cấp độ, mở một bộ câu hỏi, làm bài và nộp để hệ thống chấm điểm.</p>
          <div className="practice-levels">
            {levels.map(([label, value]) => (
              <button className={levelId === value ? "active" : ""} key={label} onClick={() => setLevelId(value)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <DataState loading={loading && !quiz} error={error} empty={!loading && playableItems.length === 0 && !quiz}>
          {!quiz ? (
            <section className="practice-grid">
              {playableItems.map((item) => (
                <article className={`practice-card${completedExerciseIds.has(item.id) ? " is-completed" : ""}`} key={item.id}>
                  <span className="practice-tag">
                    {completedExerciseIds.has(item.id) ? "Đã hoàn thành" : `JLPT N${6 - Number(item.levelId ?? 1)}`}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <ul>
                    <li>• {(item.questions ?? []).length} câu hỏi</li>
                    <li>• {item.exerciseType ?? "Luyện tập"}</li>
                  </ul>
                  <div className="practice-actions">
                    <button onClick={() => startQuiz(item.id)}>
                      {completedExerciseIds.has(item.id) ? "Làm lại" : "Bắt đầu"}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <form className="quiz-card" onSubmit={submitQuiz}>
              <div className="quiz-header">
                <button className="ghost-button" type="button" onClick={() => setQuiz(null)}>
                  Chọn bài khác
                </button>
                <h2>{quiz.title}</h2>
                <p>{quiz.description}</p>
              </div>

              {[...(quiz.questions ?? [])]
                .sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0))
                .map((question, index) => (
                  <fieldset className="question-card" key={question.id}>
                    <legend>
                      Câu {index + 1}: {question.questionText}
                    </legend>
                    {[...(question.choices ?? [])]
                      .sort((a, b) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0))
                      .map((choice) => (
                        <label
                          className={`choice-row${isCorrectChoice(choice) ? " is-correct" : ""}${
                            isWrongChoice(question, choice) ? " is-wrong" : ""
                          }`}
                          key={choice.id}
                        >
                          <input
                            required
                            checked={isSelectedChoice(question, choice)}
                            disabled={Boolean(result)}
                            type="radio"
                            name={`question-${question.id}`}
                            onChange={() => setAnswers((current) => ({ ...current, [question.id]: choice.id }))}
                          />
                          <span>{choice.choiceText}</span>
                        </label>
                      ))}
                    {result && question.explanation ? <small>Giải thích: {question.explanation}</small> : null}
                  </fieldset>
                ))}

              <button className="primary-button" disabled={submitting} type="submit">
                Nộp bài
              </button>
              {result ? (
                <div className="result-box">
                  <strong>Điểm: {Number(result.score ?? 0).toFixed(2)}</strong>
                  <span>Đúng: {result.correctCount ?? 0}</span>
                  <span>Sai: {result.wrongCount ?? 0}</span>
                </div>
              ) : null}
            </form>
          )}
        </DataState>
      </main>
      {loginPromptOpen ? (
        <LoginRequiredModal
          onClose={() => setLoginPromptOpen(false)}
          message="Bạn cần đăng nhập hoặc đăng ký tài khoản để bắt đầu làm bài tập."
        />
      ) : null}
    </StudyShell>
  );
}
