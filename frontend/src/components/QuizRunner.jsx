import { useState } from "react";
import DataState from "./DataState.jsx";

export default function QuizRunner({ title, description, fetchLabel, loadById, submit, payloadKey, defaultId = 1 }) {
  const [itemId, setItemId] = useState(defaultId);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadQuiz = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await loadById(itemId);
      setQuiz(data);
      setAnswers({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await submit({ [payloadKey]: Number(quiz.id), answers });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-section">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">{fetchLabel}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <form className="id-loader" onSubmit={loadQuiz}>
          <label>
            ID
            <input type="number" min="1" value={itemId} onChange={(event) => setItemId(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            Tải nội dung
          </button>
        </form>
      </div>

      <DataState loading={loading && !quiz} error={error} empty={!quiz}>
        {quiz ? (
          <form className="quiz-card" onSubmit={handleSubmit}>
            <div className="quiz-header">
              <h2>{quiz.title}</h2>
              <p>{quiz.description}</p>
              {quiz.durationMinutes ? <span>{quiz.durationMinutes} phút</span> : null}
            </div>

            {[...(quiz.questions ?? [])]
              .sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0))
              .map((question, index) => (
                <fieldset className="question-card" key={question.id}>
                  <legend>
                    Câu {index + 1}: {question.questionText}
                  </legend>
                  {(question.choices ?? []).map((choice) => (
                    <label className="choice-row" key={choice.id}>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={choice.id}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.id]: Number(choice.id) }))
                        }
                        required
                      />
                      <span>{choice.choiceText}</span>
                    </label>
                  ))}
                  {question.explanation ? <small>Gợi ý/giải thích: {question.explanation}</small> : null}
                </fieldset>
              ))}

            <button className="primary-button" type="submit" disabled={loading}>
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
        ) : null}
      </DataState>
    </section>
  );
}
