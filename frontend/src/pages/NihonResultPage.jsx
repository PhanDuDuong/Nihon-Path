import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import StudyShell from "../components/StudyShell.jsx";

const levels = { 1: "N5", 2: "N4", 3: "N3", 4: "N2", 5: "N1" };

function levelLabel(levelId) {
  return levels[Number(levelId)] ?? "JLPT";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

function flattenExamQuestions(exam) {
  if (exam?.sections?.length) {
    return exam.sections.flatMap((section) =>
      (section.parts ?? []).flatMap((part, partIndex) =>
        (part.groups ?? []).flatMap((group) =>
          (group.questions ?? []).map((question) => ({ ...question, section, part, partIndex, group })),
        ),
      ),
    );
  }
  return (exam?.questions ?? []).map((question) => ({ ...question }));
}

function buildReview(detail) {
  const questions = flattenExamQuestions(detail?.exam);
  const answerMap = new Map((detail?.answers ?? []).map((answer) => [Number(answer.questionId), answer]));
  return questions.map((question, index) => {
    const answer = answerMap.get(Number(question.id));
    const choices = question.choices ?? [];
    const selected = choices.find((choice) => Number(choice.id) === Number(answer?.selectedChoiceId));
    const correct = choices.find((choice) => Number(choice.id) === Number(answer?.correctChoiceId)) || choices.find((choice) => choice.isCorrect);
    return {
      index: index + 1,
      question,
      selected,
      correct,
      isCorrect: Boolean(answer?.isCorrect),
      hasSavedAnswer: Boolean(answer),
    };
  });
}

export default function NihonResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const review = useMemo(() => buildReview(detail), [detail]);
  const attempt = detail?.attempt;
  const exam = detail?.exam;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");
      try {
        if (attemptId) {
          setDetail(await learningApi.getExamAttempt(attemptId));
        } else {
          setAttempts(await learningApi.getExamAttempts());
          setDetail(null);
        }
      } catch (err) {
        setMessage(err.message || "Không tải được kết quả gần đây.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [attemptId]);

  return (
    <StudyShell active="JLPT" title="Kết quả gần đây" topLink={{ label: "← JLPT", to: "/exams" }}>
      <main className="study-main result-main">
        {message ? <div className="matcha-message">{message}</div> : null}
        {loading ? <div className="matcha-message">Đang tải kết quả...</div> : null}

        {!attemptId && !loading ? (
          <section className="jlpt-result">
            <h1>Kết quả gần đây</h1>
            <div className="jlpt-exam-list">
              {attempts.map((item) => {
                const total = Number(item.correctCount ?? 0) + Number(item.wrongCount ?? 0);
                const accuracy = total ? Math.round((Number(item.correctCount ?? 0) / total) * 100) : 0;
                return (
                  <button className="jlpt-attempt-row" type="button" key={item.id} onClick={() => navigate(`/results/${item.id}`)}>
                    <strong>{item.examTitle || "Đề JLPT"} <em>{levelLabel(item.levelId)}</em></strong>
                    <span>{formatDate(item.submittedAt)}</span>
                    <span>{Number(item.score ?? 0).toFixed(2)} điểm</span>
                    <span>{item.correctCount ?? 0}/{total} đúng · {accuracy}%</span>
                  </button>
                );
              })}
              {!attempts.length ? (
                <div className="admin-empty-state">
                  Chưa có kết quả làm đề nào. <Link to="/exams">Làm đề JLPT</Link>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {attemptId && detail && !loading ? (
          <section className="jlpt-result">
            <div className="result-detail-title">
              <div>
                <span className="vocab-detail-level">{levelLabel(exam?.levelId)} · {formatDate(attempt?.submittedAt)}</span>
                <h1>{exam?.title || "Kết quả thi thử"}</h1>
              </div>
              <button type="button" onClick={() => navigate("/results")}>Danh sách kết quả</button>
            </div>

            <div className="jlpt-result-summary">
              <article><span>Tổng điểm</span><strong>{Number(attempt?.score ?? 0).toFixed(2)}</strong></article>
              <article><span>Số câu đúng</span><strong>{attempt?.correctCount ?? 0}</strong></article>
              <article><span>Số câu sai</span><strong>{attempt?.wrongCount ?? 0}</strong></article>
              <article><span>Tỷ lệ đúng</span><strong>{review.length ? Math.round((Number(attempt?.correctCount ?? 0) / review.length) * 100) : 0}%</strong></article>
            </div>

            {!detail.answers?.length ? (
              <div className="matcha-message">Kết quả cũ chỉ có điểm tổng, chưa có dữ liệu từng câu. Các lần làm mới sẽ hiện đầy đủ đúng/sai.</div>
            ) : null}

            {detail.answers?.length ? (
              <div className="jlpt-review-list">
                {review.map((item) => (
                  <article className={item.isCorrect ? "correct" : "wrong"} key={item.question.id ?? item.index}>
                    <strong>Câu {item.index}: {item.question.questionText}</strong>
                    {item.question.group?.passageText ? <div className="jlpt-passage">{item.question.group.passageText}</div> : null}
                    <span>Bạn chọn: {item.selected?.choiceText || "Chưa chọn"}</span>
                    <span>Đáp án đúng: {item.correct?.choiceText || item.question.correctAnswer || "-"}</span>
                    {item.question.explanation ? <p>Giải thích: {item.question.explanation}</p> : null}
                    {item.question.group?.transcript ? <p>Transcript: {item.question.group.transcript}</p> : null}
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </StudyShell>
  );
}
