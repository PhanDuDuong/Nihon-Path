import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import DataState from "../components/DataState.jsx";
import LoginRequiredModal from "../components/LoginRequiredModal.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const levels = [
  { label: "N5", value: 1, desc: "Từ vựng 20, Ngữ pháp + Đọc hiểu 40, Nghe hiểu 30.", time: "90 phút" },
  { label: "N4", value: 2, desc: "Từ vựng 25, Ngữ pháp + Đọc hiểu 55, Nghe hiểu 35.", time: "115 phút" },
  { label: "N3", value: 3, desc: "Từ vựng 30, Ngữ pháp + Đọc hiểu 70, Nghe hiểu 40.", time: "140 phút" },
  { label: "N2", value: 4, desc: "Kiến thức ngôn ngữ + Đọc hiểu 105, Nghe hiểu 50.", time: "155 phút" },
  { label: "N1", value: 5, desc: "Kiến thức ngôn ngữ + Đọc hiểu 110, Nghe hiểu 55.", time: "165 phút" },
];

const loginStartMessage = "Bạn cần đăng nhập hoặc đăng ký tài khoản để bắt đầu làm đề JLPT.";
const loginSubmitMessage = "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập rồi nộp lại bài.";

function levelLabel(levelId) {
  return levels.find((item) => Number(item.value) === Number(levelId))?.label ?? "N5";
}

function publicExamDescription(exam) {
  const description = String(exam?.description ?? "").trim();
  if (
    !description
    || description.includes("test flow")
    || description.includes("nhân bản từ đề N3")
    || description.includes("??")
    || description.includes("thi th?")
    || description.includes("s?")
  ) {
    return "Đề thi thử theo cấu trúc JLPT.";
  }
  return description;
}

const jlptLevelConfig = {
  1: { total: 90, sections: [["Vocabulary", "VOCABULARY", 20], ["Grammar + Reading", "MIXED", 40], ["Listening", "LISTENING", 30]] },
  2: { total: 115, sections: [["Vocabulary", "VOCABULARY", 25], ["Grammar + Reading", "MIXED", 55], ["Listening", "LISTENING", 35]] },
  3: { total: 140, sections: [["Vocabulary", "VOCABULARY", 30], ["Grammar + Reading", "MIXED", 70], ["Listening", "LISTENING", 40]] },
  4: { total: 155, sections: [["Language Knowledge + Reading", "MIXED", 105], ["Listening", "LISTENING", 50]] },
  5: { total: 165, sections: [["Language Knowledge + Reading", "MIXED", 110], ["Listening", "LISTENING", 55]] },
};

function createSection(title, type, durationMinutes, questions = [], orderIndex = 1) {
  return {
    title,
    type,
    durationMinutes,
    orderIndex,
    allowBack: true,
    allowEarlySubmit: true,
    autoSubmit: true,
    parts: [{
      title,
      instruction: "",
      groups: [{ title, questions }],
    }],
  };
}

function isListeningQuestion(question) {
  return String(question.sectionType ?? question.questionType ?? "").toUpperCase().includes("LISTENING");
}

function isVocabularyQuestion(question) {
  return String(question.sectionType ?? question.questionType ?? "").toUpperCase().includes("VOCAB");
}

function normalizeExam(exam) {
  if (exam.sections?.length) {
    const total = exam.sections.reduce((sum, section) => sum + Number(section.durationMinutes || 0), 0);
    return { ...exam, durationMinutes: total || exam.durationMinutes };
  }

  const config = jlptLevelConfig[Number(exam.levelId)] ?? jlptLevelConfig[1];
  const questions = exam.questions ?? [];
  const listening = questions.filter(isListeningQuestion);
  const language = questions.filter((question) => !isListeningQuestion(question));

  if (Number(exam.levelId) >= 4) {
    return {
      ...exam,
      durationMinutes: config.total,
      sections: [
        createSection(config.sections[0][0], config.sections[0][1], config.sections[0][2], language, 1),
        createSection(config.sections[1][0], config.sections[1][1], config.sections[1][2], listening, 2),
      ],
    };
  }

  const vocabulary = language.filter(isVocabularyQuestion);
  const grammarReading = language.filter((question) => !isVocabularyQuestion(question));
  return {
    ...exam,
    durationMinutes: config.total,
    sections: [
      createSection(config.sections[0][0], config.sections[0][1], config.sections[0][2], vocabulary, 1),
      createSection(config.sections[1][0], config.sections[1][1], config.sections[1][2], grammarReading, 2),
      createSection(config.sections[2][0], config.sections[2][1], config.sections[2][2], listening, 3),
    ],
  };
}

function displayExamDuration(exam) {
  if (exam.sections?.length) return exam.durationMinutes ?? exam.sections.reduce((sum, section) => sum + Number(section.durationMinutes || 0), 0);
  return jlptLevelConfig[Number(exam.levelId)]?.total ?? exam.durationMinutes ?? 0;
}

function displayExamSections(exam) {
  return exam.sections?.length ?? jlptLevelConfig[Number(exam.levelId)]?.sections.length ?? 0;
}

function flattenSection(section) {
  return (section.parts ?? []).flatMap((part, partIndex) =>
    (part.groups ?? []).flatMap((group) =>
      (group.questions ?? []).map((question) => ({ ...question, section, part, partIndex, group })),
    ),
  ).sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0));
}

function sectionQuestionGroups(section) {
  const questions = flattenSection(section);
  const groups = [];
  for (const question of questions) {
    const key = `${question.partIndex}-${question.part?.title ?? "Mondai"}`;
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = {
        key,
        title: question.part?.title ?? "Mondai",
        instruction: question.part?.instruction ?? "",
        questions: [],
      };
      groups.push(group);
    }
    group.questions.push(question);
  }
  return groups;
}

function mondaiAudioFile(group) {
  return group?.questions?.find((question) => question.section?.audioUrl)?.section?.audioUrl
    || group?.questions?.find((question) => question.group?.audioFile)?.group?.audioFile
    || group?.questions?.find((question) => question.audioFile)?.audioFile
    || "";
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function formatAttemptDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

function shouldShowPassageText(value) {
  const text = String(value ?? "").trim();
  return Boolean(text) && !text.includes("Bài đọc/hình minh họa cho phần này cần được bổ sung nếu có");
}

function scrollTakingTop() {
  requestAnimationFrame(() => {
    document.querySelector(".jlpt-taking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export default function NihonExamPage() {
  const navigate = useNavigate();
  const mondaiAudioRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const [levelId, setLevelId] = useState(1);
  const [items, setItems] = useState([]);
  const [levelCounts, setLevelCounts] = useState({});
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [exam, setExam] = useState(null);
  const [stage, setStage] = useState("list");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [result, setResult] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const [loginPromptMessage, setLoginPromptMessage] = useState(loginStartMessage);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      setSubmitNotice("");
      setExam(null);
      setStage("list");
      try {
        setItems(await learningApi.getExams({ levelId }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [levelId]);

  useEffect(() => {
    let mounted = true;
    async function loadCounts() {
      try {
        const entries = await Promise.all(levels.map(async (level) => {
          const exams = await learningApi.getExams({ levelId: level.value });
          return [level.value, exams.length];
        }));
        if (mounted) {
          setLevelCounts(Object.fromEntries(entries));
        }
      } catch {
        // Count badges are secondary; the selected level list still shows the actual data.
      }
    }
    loadCounts();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadRecentAttempts() {
      if (!isAuthenticated) {
        setRecentAttempts([]);
        return;
      }
      try {
        const data = await learningApi.getExamAttempts();
        if (mounted) setRecentAttempts(data);
      } catch {
        if (mounted) setRecentAttempts([]);
      }
    }
    loadRecentAttempts();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const selectedLevel = levels.find((item) => item.value === levelId);
  const userRole = String(user?.role ?? user?.roleName ?? "").toUpperCase();
  const userVipActive = user?.vipExpiresAt && new Date(user.vipExpiresAt).getTime() > Date.now();
  const canOpenVipExam = userRole.includes("ADMIN") || userRole.includes("VIP") || userVipActive;
  const currentSection = exam?.sections?.[sectionIndex];
  const sectionQuestions = useMemo(() => currentSection ? flattenSection(currentSection) : [], [currentSection]);
  const groupedSectionQuestions = useMemo(() => currentSection ? sectionQuestionGroups(currentSection) : [], [currentSection]);
  const currentQuestion = sectionQuestions[questionIndex];
  const currentMondai = groupedSectionQuestions.find((group) => group.questions.some((question) => question.id === currentQuestion?.id));
  const currentMondaiIndex = groupedSectionQuestions.findIndex((group) => group.key === currentMondai?.key);
  const isListeningSection = String(currentSection?.type ?? currentSection?.title ?? "").toUpperCase().includes("LISTEN");
  const currentMondaiAudio = useMemo(() => mondaiAudioFile(currentMondai), [currentMondai]);
  const allQuestions = useMemo(() => exam ? exam.sections.flatMap(flattenSection) : [], [exam]);
  const latestAttemptByExam = useMemo(() => {
    const map = new Map();
    for (const attempt of recentAttempts) {
      const examSetId = Number(attempt.examSetId);
      if (!map.has(examSetId)) map.set(examSetId, attempt);
    }
    return map;
  }, [recentAttempts]);
  const latestExamAttempt = exam ? latestAttemptByExam.get(Number(exam.id)) : null;

  useEffect(() => {
    if (stage !== "taking" || !currentSection?.durationMinutes) return;
    setSecondsLeft(Number(currentSection.durationMinutes) * 60);
  }, [stage, sectionIndex, currentSection?.durationMinutes]);

  useEffect(() => {
    if (stage !== "taking" || !secondsLeft) return;
    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          nextSectionOrSubmit();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, secondsLeft]);

  useEffect(() => {
    if (stage !== "taking" || !isListeningSection || !currentMondaiAudio || !mondaiAudioRef.current) return;
    const audio = mondaiAudioRef.current;
    audio.play().catch(() => {
      // Browser autoplay policies can require one manual click; controls remain visible.
    });
  }, [stage, sectionIndex, isListeningSection, currentMondaiAudio]);

  const startExam = async (id) => {
    if (!isAuthenticated) {
      setLoginPromptMessage(loginStartMessage);
      setLoginPromptOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    setSubmitNotice("");
    setResult(null);
    try {
      const data = normalizeExam(await learningApi.getExam(id));
      setExam(data);
      setAnswers({});
      setMarked({});
      setSectionIndex(0);
      setQuestionIndex(0);
      setStage("intro");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const beginTaking = () => {
    const firstPlayableSection = exam.sections.findIndex((section) => flattenSection(section).length > 0);
    setSectionIndex(firstPlayableSection >= 0 ? firstPlayableSection : 0);
    setQuestionIndex(0);
    setSubmitNotice("");
    setStage("taking");
  };

  const choose = (questionId, choiceId) => {
    setSubmitNotice("");
    setAnswers((current) => ({ ...current, [questionId]: choiceId }));
  };
  const toggleMark = (questionId) => setMarked((current) => ({ ...current, [questionId]: !current[questionId] }));
  const goToMondai = (nextIndex) => {
    const nextGroup = groupedSectionQuestions[nextIndex];
    if (!nextGroup?.questions?.length) return;
    const absoluteIndex = sectionQuestions.findIndex((question) => question.id === nextGroup.questions[0].id);
    if (absoluteIndex >= 0) {
      setQuestionIndex(absoluteIndex);
      scrollTakingTop();
    }
  };

  const nextSectionOrSubmit = async () => {
    const nextPlayableSection = exam.sections.findIndex((section, index) => index > sectionIndex && flattenSection(section).length > 0);
    if (nextPlayableSection >= 0) {
      setSectionIndex(nextPlayableSection);
      setQuestionIndex(0);
      scrollTakingTop();
      return;
    }
    await submitExam();
  };

  const openSubmitConfirm = (type) => {
    if (submitting) return;
    const isFinalSubmit = type === "exam";
    const questionScope = isFinalSubmit ? allQuestions : sectionQuestions;
    const unansweredCount = questionScope.filter((question) => !answers[question.id]).length;
    setConfirmAction({
      type,
      title: isFinalSubmit ? "Xác nhận nộp bài" : "Xác nhận nộp phần này",
      message: isFinalSubmit
        ? "Sau khi nộp bài, hệ thống sẽ chấm điểm và lưu kết quả làm đề của bạn."
        : "Sau khi nộp phần này, bạn sẽ chuyển sang phần tiếp theo và không quay lại phần đã nộp trong chế độ thi thật.",
      unansweredCount,
      totalCount: questionScope.length,
    });
  };

  const confirmSubmit = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    if (action.type === "exam") {
      await submitExam();
      return;
    }
    await nextSectionOrSubmit();
  };

  const submitExam = async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    setSubmitNotice("");
    try {
      const data = await learningApi.submitExam({ examSetId: exam.id, answers });
      setSubmitNotice("");
      setResult(data);
      setRecentAttempts((current) => [
        {
          id: data.id,
          examSetId: data.examSetId,
          examTitle: exam.title,
          levelId: exam.levelId,
          score: data.score,
          correctCount: data.correctCount,
          wrongCount: data.wrongCount,
          submittedAt: data.submittedAt,
        },
        ...current.filter((item) => Number(item.id) !== Number(data.id)),
      ]);
      setStage("result");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setSubmitNotice(loginSubmitMessage);
        setLoginPromptMessage(loginSubmitMessage);
        setLoginPromptOpen(true);
      } else {
        setSubmitNotice(err.message || "Không nộp được bài. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const localReview = allQuestions.map((question, index) => {
    const selectedId = answers[question.id];
    const correct = question.choices?.find((choice) => choice.isCorrect);
    return {
      index: index + 1,
      question,
      selected: question.choices?.find((choice) => Number(choice.id) === Number(selectedId)),
      correct,
      isCorrect: correct && Number(correct.id) === Number(selectedId),
    };
  });

  return (
    <StudyShell active="JLPT" title="Thi thử JLPT" topLink={{ label: "Kết quả gần đây", to: "/results" }}>
      <main className="study-main jlpt-user">
        <DataState loading={loading && !exam} error={error} empty={false}>
          {stage === "list" ? (
            <>
              <section className="jlpt-level-header">
                <div>
                  <span>JLPT Mock Test</span>
                  <h1>Chọn cấp độ thi thử</h1>
                </div>
                <div className="jlpt-level-grid">
                  {levels.map((level) => (
                    <button className={levelId === level.value ? "active" : ""} key={level.label} type="button" onClick={() => setLevelId(level.value)}>
                      <strong>{level.label}</strong>
                      <small>{level.desc}</small>
                      <em>{levelCounts[level.value] ?? (levelId === level.value ? items.length : 0)} đề hiện có</em>
                    </button>
                  ))}
                </div>
              </section>

              <section className="jlpt-exam-list">
                <div className="jlpt-section-title">
                  <h2>Đề {selectedLevel?.label}</h2>
                  <span>Thời gian dự kiến: {selectedLevel?.time}</span>
                </div>
                {items.map((item, index) => {
                  const vipLocked = Boolean(item.locked ?? (index >= 2 && !canOpenVipExam));
                  const locked = isAuthenticated && vipLocked;
                  const latestAttempt = latestAttemptByExam.get(Number(item.id));
                  const total = Number(latestAttempt?.correctCount ?? 0) + Number(latestAttempt?.wrongCount ?? 0);
                  return (
                  <article className={`jlpt-exam-row ${locked ? "locked" : ""}`} key={item.id}>
                    <div>
                      <strong>{item.title} {locked ? <em>VIP</em> : null}</strong>
                      <p>{publicExamDescription(item)}</p>
                      {latestAttempt ? (
                        <small className="jlpt-last-attempt">
                          Lần trước: {Number(latestAttempt.score ?? 0).toFixed(2)} điểm
                          {total ? ` - ${latestAttempt.correctCount ?? 0}/${total} đúng` : ""}
                          {latestAttempt.submittedAt ? ` - ${formatAttemptDate(latestAttempt.submittedAt)}` : ""}
                        </small>
                      ) : null}
                    </div>
                    <span>{levelLabel(item.levelId)}</span>
                    <span>{displayExamSections(item)} phần</span>
                    <span>{displayExamDuration(item)} phút</span>
                    <div className="jlpt-exam-actions">
                      <button type="button" onClick={() => startExam(item.id)} disabled={locked}>
                        {locked ? "Cần VIP" : latestAttempt ? "Làm lại" : "Bắt đầu thi"}
                      </button>
                      {latestAttempt ? (
                        <button className="ghost-button" type="button" onClick={() => navigate(`/results/${latestAttempt.id}`)}>
                          Xem lại
                        </button>
                      ) : null}
                    </div>
                  </article>
                  );
                })}
                {!items.length ? <div className="state-box">Chưa có đề {selectedLevel?.label} được public.</div> : null}
              </section>
            </>
          ) : null}

          {stage === "intro" && exam ? (
            <section className="jlpt-intro">
              <button className="ghost-button" type="button" onClick={() => { setExam(null); setStage("list"); }}>Quay lại</button>
              <h1>{exam.title}</h1>
              <p>{publicExamDescription(exam)}</p>
              {latestExamAttempt ? (
                <div className="matcha-message jlpt-saved-attempt">
                  Lần làm trước đã được lưu: {Number(latestExamAttempt.score ?? 0).toFixed(2)} điểm
                  {latestExamAttempt.submittedAt ? ` - ${formatAttemptDate(latestExamAttempt.submittedAt)}` : ""}.
                  <button type="button" onClick={() => navigate(`/results/${latestExamAttempt.id}`)}>Xem lại bài đã lưu</button>
                </div>
              ) : null}
              <div className="jlpt-intro-grid">
                {exam.sections.map((section, index) => (
                  <article key={index}>
                    <span>Section {index + 1}</span>
                    <strong>{section.title}</strong>
                    <small>{section.durationMinutes ?? 0} phút - {flattenSection(section).length} câu</small>
                  </article>
                ))}
              </div>
              <div className="jlpt-rules">
                <strong>Quy dinh</strong>
                <span>Hết giờ sẽ tự động chuyển section hoặc nộp bài.</span>
                <span>Phần nghe cần bật âm thanh trước khi bắt đầu.</span>
                <span>Section đã hết giờ không quay lại trong chế độ thi thật.</span>
              </div>
              <button className="primary-button" type="button" onClick={beginTaking}>Bắt đầu</button>
            </section>
          ) : null}

          {stage === "taking" && exam && currentMondai ? (
            <section className="jlpt-taking">
              <header className="jlpt-test-header">
                <div>
                  <strong>{exam.title}</strong>
                  <span>{levelLabel(exam.levelId)} - {currentSection.title}</span>
                </div>
                <time>{formatTime(secondsLeft)}</time>
                <button type="button" onClick={() => openSubmitConfirm("exam")} disabled={submitting}>Nộp bài</button>
              </header>

              {submitNotice ? <div className="matcha-message jlpt-submit-notice">{submitNotice}</div> : null}

              <aside className="jlpt-question-nav">
                {groupedSectionQuestions.map((group) => (
                  <div className="jlpt-nav-mondai" key={group.key}>
                    <strong>{group.title}</strong>
                    <div>
                      {group.questions.map((question, index) => {
                        const absoluteIndex = sectionQuestions.findIndex((item) => item.id === question.id);
                        return (
                          <button
                            className={`${absoluteIndex === questionIndex ? "current" : ""} ${answers[question.id] ? "answered" : ""} ${marked[question.id] ? "marked" : ""}`}
                            key={question.id ?? `${group.key}-${index}`}
                            type="button"
                            onClick={() => setQuestionIndex(absoluteIndex)}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </aside>

              <article className="jlpt-question-panel">
                <div className="jlpt-part-meta">
                  <span>{currentMondai?.title}</span>
                  <strong>{currentMondai?.questions.length ?? 0} câu</strong>
                </div>
                {isListeningSection && currentMondaiAudio ? (
                  <div className="jlpt-mondai-audio">
                    <strong>Audio Mondai nghe</strong>
                    <audio ref={mondaiAudioRef} src={currentMondaiAudio} controls preload="auto" autoPlay />
                  </div>
                ) : null}
                {currentMondai.instruction ? <p className="jlpt-instruction">{currentMondai.instruction}</p> : null}

                <div className="jlpt-mondai-question-list">
                  {currentMondai.questions.map((question, localIndex) => (
                    <section className={`jlpt-mondai-question ${marked[question.id] ? "marked" : ""}`} key={question.id ?? localIndex}>
                      <div className="jlpt-question-title">
                        <h2>Câu {localIndex + 1}. {question.questionText}</h2>
                        <button className={marked[question.id] ? "marked" : ""} type="button" onClick={() => toggleMark(question.id)}>
                          {marked[question.id] ? "Bỏ đánh dấu" : "Đánh dấu"}
                        </button>
                      </div>
                      {shouldShowPassageText(question.group?.passageText) ? <div className="jlpt-passage">{question.group.passageText}</div> : null}
                      <div className="jlpt-choice-list">
                        {(question.choices ?? []).map((choice, index) => (
                          <button className={Number(answers[question.id]) === Number(choice.id) ? "selected" : ""} key={choice.id ?? index} type="button" onClick={() => choose(question.id, choice.id)}>
                            <span>{choice.label || String.fromCharCode(65 + index)}</span>
                            <strong>{choice.choiceText}</strong>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </article>

              <footer className="jlpt-test-footer">
                <button type="button" onClick={() => goToMondai(currentMondaiIndex - 1)} disabled={currentMondaiIndex <= 0}>Mondai trước</button>
                <button type="button" onClick={() => goToMondai(currentMondaiIndex + 1)} disabled={currentMondaiIndex >= groupedSectionQuestions.length - 1}>Mondai sau</button>
                <button type="button" onClick={() => openSubmitConfirm(sectionIndex < exam.sections.length - 1 ? "section" : "exam")}>
                  {sectionIndex < exam.sections.length - 1 ? "Nộp phần này" : "Nộp bài"}
                </button>
              </footer>
            </section>
          ) : null}

          {stage === "result" && result ? (
            <section className="jlpt-result">
              <h1>Kết quả thi thử</h1>
              <div className="jlpt-result-summary">
                <article><span>Tong diem</span><strong>{Number(result.score ?? 0).toFixed(2)}</strong></article>
                <article><span>Số câu đúng</span><strong>{result.correctCount ?? 0}</strong></article>
                <article><span>Số câu sai</span><strong>{result.wrongCount ?? 0}</strong></article>
                <article><span>Tỷ lệ đúng</span><strong>{localReview.length ? Math.round((Number(result.correctCount ?? 0) / localReview.length) * 100) : 0}%</strong></article>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => { setStage("intro"); setResult(null); }}>Làm lại đề</button>
                <button type="button" onClick={() => navigate(`/results/${result.id}`)}>Xem bản đã lưu</button>
                <button type="button" onClick={() => setStage("list")}>Quay về danh sách</button>
              </div>
              <div className="jlpt-review-list">
                {localReview.map((item) => (
                  <article className={item.isCorrect ? "correct" : "wrong"} key={item.question.id ?? item.index}>
                    <strong>Câu {item.index}: {item.question.questionText}</strong>
                    <span>Bạn chọn: {item.selected?.choiceText || "Chưa chọn"}</span>
                    <span>Đáp án đúng: {item.correct?.choiceText || item.question.correctAnswer || "-"}</span>
                    {item.question.explanation ? <p>Giải thích: {item.question.explanation}</p> : null}
                    {item.question.group?.transcript ? <p>Transcript: {item.question.group.transcript}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </DataState>
      </main>
      {confirmAction ? (
        <div className="jlpt-confirm-backdrop" role="presentation" onClick={() => setConfirmAction(null)}>
          <section className="jlpt-confirm-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>{confirmAction.title}</h2>
            <p>{confirmAction.message}</p>
            {confirmAction.unansweredCount ? (
              <strong>Còn {confirmAction.unansweredCount}/{confirmAction.totalCount} câu chưa chọn đáp án.</strong>
            ) : (
              <strong>Bạn đã chọn đáp án cho toàn bộ câu trong phạm vi nộp.</strong>
            )}
            <div className="jlpt-confirm-actions">
              <button className="ghost-button" type="button" onClick={() => setConfirmAction(null)}>Kiểm tra lại</button>
              <button type="button" onClick={confirmSubmit} disabled={submitting}>
                {submitting ? "Đang nộp..." : "Xác nhận nộp"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {loginPromptOpen ? (
        <LoginRequiredModal
          onClose={() => setLoginPromptOpen(false)}
          message={loginPromptMessage}
        />
      ) : null}
    </StudyShell>
  );
}
