import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi.js";

const levels = [[1, "N5"], [2, "N4"], [3, "N3"], [4, "N2"], [5, "N1"]];
const statuses = ["DRAFT", "PUBLISHED", "HIDDEN"];
const statusLabels = { DRAFT: "Nháp", PUBLISHED: "Đã xuất bản", HIDDEN: "Ẩn" };
const sectionTypes = ["VOCABULARY", "GRAMMAR", "READING", "LISTENING", "MIXED"];
const questionTypes = ["MULTIPLE_CHOICE", "READING_GROUP", "IMAGE", "LISTENING", "ORDERING", "CLOZE"];

const jlptLevelConfig = {
  1: {
    label: "N5",
    total: 90,
    sections: [
      ["言語知識（文字・語彙）", "VOCABULARY", 20],
      ["言語知識（文法）・読解", "MIXED", 40],
      ["聴解", "LISTENING", 30],
    ],
  },
  2: {
    label: "N4",
    total: 115,
    sections: [
      ["言語知識（文字・語彙）", "VOCABULARY", 25],
      ["言語知識（文法）・読解", "MIXED", 55],
      ["聴解", "LISTENING", 35],
    ],
  },
  3: {
    label: "N3",
    total: 140,
    sections: [
      ["言語知識（文字・語彙）", "VOCABULARY", 30],
      ["言語知識（文法）・読解", "MIXED", 70],
      ["聴解", "LISTENING", 40],
    ],
  },
  4: {
    label: "N2",
    total: 155,
    sections: [
      ["言語知識（文字・語彙・文法）・読解", "MIXED", 105],
      ["聴解", "LISTENING", 50],
    ],
  },
  5: {
    label: "N1",
    total: 165,
    sections: [
      ["言語知識（文字・語彙・文法）・読解", "MIXED", 110],
      ["聴解", "LISTENING", 55],
    ],
  },
};

function levelName(levelId) {
  return levels.find(([id]) => Number(id) === Number(levelId))?.[1] ?? "N5";
}

function blankChoice(order = 1) {
  return { label: String(order), choiceText: "", image: "", isCorrect: order === 1, choiceOrder: order };
}

function blankQuestion(order = 1, optionCount = 4) {
  return {
    questionText: "",
    underlinedText: "",
    questionType: "MULTIPLE_CHOICE",
    questionOrder: order,
    score: 1,
    imageUrl: "",
    audioFile: "",
    correctAnswer: "",
    explanation: "",
    translation: "",
    choices: Array.from({ length: optionCount }, (_, index) => blankChoice(index + 1)),
  };
}

function blankGroup(order = 1, optionCount = 4) {
  return {
    title: `Mondai ${order}`,
    passageText: "",
    passageImage: "",
    audioFile: "",
    transcript: "",
    audioPlayLimit: 1,
    questionVisibility: "BEFORE_AUDIO",
    orderIndex: order,
    questions: [blankQuestion(1, optionCount)],
  };
}

function optionCountFor(type, sectionType) {
  const listening = String(type ?? "").includes("LISTENING") || String(sectionType ?? "").includes("LISTENING");
  return listening && ["INSTANT_RESPONSE", "SPEAKING_EXPRESSION"].includes(String(type ?? "")) ? 3 : 4;
}

function blankPart(order = 1, sectionType = "MIXED") {
  const questionType = sectionType === "LISTENING" ? "LISTENING" : "MULTIPLE_CHOICE";
  return {
    title: `Mondai ${order}`,
    instruction: "",
    questionType,
    optionCount: optionCountFor(questionType, sectionType),
    scorePerQuestion: 1,
    orderIndex: order,
    sharedPassage: false,
    sharedAudio: sectionType === "LISTENING",
    sharedImage: false,
    groups: [blankGroup(1, optionCountFor(questionType, sectionType))],
  };
}

function blankSection(order = 1, title = "言語知識", type = "MIXED", durationMinutes = 30) {
  return {
    title,
    type,
    durationMinutes,
    audioUrl: "",
    audioDuration: "",
    orderIndex: order,
    allowBack: true,
    allowEarlySubmit: true,
    autoSubmit: true,
    scored: true,
    instruction: "",
    parts: [blankPart(1, type)],
  };
}

function sectionsForLevel(levelId) {
  const config = jlptLevelConfig[Number(levelId)] ?? jlptLevelConfig[1];
  return config.sections.map(([title, type, durationMinutes], index) => blankSection(index + 1, title, type, durationMinutes));
}

function blankExam(levelId = 1) {
  const config = jlptLevelConfig[Number(levelId)] ?? jlptLevelConfig[1];
  return {
    title: `JLPT ${config.label} Mock Test`,
    examCode: "",
    description: "",
    status: "DRAFT",
    month: "",
    year: new Date().getFullYear(),
    tags: `JLPT,${config.label}`,
    folderSlug: config.label.toLowerCase(),
    audioUrl: "",
    levelId: Number(levelId),
    durationMinutes: config.total,
    availableFrom: "",
    allowAnswerReview: true,
    allowRetake: true,
    maxAttempts: "",
    sections: sectionsForLevel(levelId),
    questions: [],
  };
}

function stripIds(value) {
  if (Array.isArray(value)) return value.map(stripIds);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "id").map(([key, item]) => [key, stripIds(item)]));
}

function normalizeChoices(choices, optionCount = 4) {
  const source = choices?.length ? choices : Array.from({ length: optionCount }, (_, index) => blankChoice(index + 1));
  return source.map((choice, index) => ({
    ...blankChoice(index + 1),
    ...choice,
    label: choice.label || String(index + 1),
    choiceOrder: choice.choiceOrder ?? index + 1,
    isCorrect: Boolean(choice.isCorrect),
  }));
}

function normalizeExam(item) {
  const defaults = blankExam(item?.levelId ?? 1);
  const source = { ...defaults, ...item };
  const sections = (source.sections?.length ? source.sections : defaults.sections).map((section, sectionIndex) => {
    const sectionAudioUrl = section.audioUrl ?? (section.parts ?? [])
      .flatMap((part) => part.groups ?? [])
      .find((group) => String(group.audioFile ?? "").trim())?.audioFile ?? "";
    return {
      ...blankSection(sectionIndex + 1),
      ...section,
      audioUrl: sectionAudioUrl,
      audioDuration: section.audioDuration ?? "",
      orderIndex: section.orderIndex ?? sectionIndex + 1,
      parts: (section.parts?.length ? section.parts : [blankPart(1, section.type)]).map((part, partIndex) => {
        const inferredOptionCount = Math.max(
          optionCountFor(part.questionType, section.type),
          ...(part.groups ?? []).flatMap((group) => (group.questions ?? []).map((question) => question.choices?.length ?? 0)),
        );
        const optionCount = Number(part.optionCount || inferredOptionCount || 4);
      return {
        ...blankPart(partIndex + 1, section.type),
        ...part,
        optionCount,
        orderIndex: part.orderIndex ?? partIndex + 1,
        groups: (part.groups?.length ? part.groups : [blankGroup(1, optionCount)]).map((group, groupIndex) => ({
          ...blankGroup(groupIndex + 1, optionCount),
          ...group,
          orderIndex: group.orderIndex ?? groupIndex + 1,
          questions: (group.questions?.length ? group.questions : [blankQuestion(1, optionCount)]).map((question, questionIndex) => ({
            ...blankQuestion(questionIndex + 1, optionCount),
            ...question,
            questionOrder: question.questionOrder ?? questionIndex + 1,
            choices: normalizeChoices(question.choices, optionCount),
          })),
        })),
      };
      }),
    };
  });
  return { ...source, sections };
}

function countQuestions(exam) {
  return (exam.sections ?? []).reduce((sum, section) => sum + (section.parts ?? []).reduce((partSum, part) => partSum + (part.groups ?? []).reduce((groupSum, group) => groupSum + (group.questions?.length ?? 0), 0), 0), 0);
}

function sectionTags(exam) {
  return normalizeExam(exam).sections.map((section) => section.title);
}

function statusClass(status) {
  if (status === "PUBLISHED") return "active";
  if (status === "HIDDEN") return "banned";
  return "";
}

function listeningSection(section) {
  return String(section?.type ?? section?.title ?? "").toUpperCase().includes("LISTEN");
}

function validationMessages(exam, publish = false) {
  const errors = [];
  if (!String(exam.title ?? "").trim()) errors.push("Tên đề không được rỗng.");
  if (!exam.levelId) errors.push("Level phải được chọn.");
  (exam.sections ?? []).forEach((section, sectionIndex) => {
    if (!Number(section.durationMinutes)) errors.push(`Section ${sectionIndex + 1} thiếu thời gian.`);
    if (publish && listeningSection(section) && !String(section.audioUrl ?? "").trim()) {
      errors.push(`Section nghe "${section.title}" chưa có audio chung.`);
    }
    (section.parts ?? []).forEach((part, partIndex) => {
      const groups = part.groups ?? [];
      const questionCount = groups.reduce((sum, group) => sum + (group.questions?.length ?? 0), 0);
      if (!questionCount) errors.push(`${section.title} / ${part.title} phải có ít nhất 1 câu hỏi.`);
      groups.forEach((group, groupIndex) => {
        (group.questions ?? []).forEach((question, questionIndex) => {
          const name = `${sectionIndex + 1}.${partIndex + 1}.${groupIndex + 1}.${questionIndex + 1}`;
          const hasPrompt = String(question.questionText ?? "").trim() || String(question.imageUrl ?? "").trim() || String(group.passageText ?? "").trim();
          if (!hasPrompt) errors.push(`Câu ${name} thiếu nội dung, ảnh hoặc đoạn văn.`);
          const choices = question.choices ?? [];
          const expected = Number(part.optionCount || choices.length || 4);
          if (choices.length < expected) errors.push(`Câu ${name} thiếu đáp án (${choices.length}/${expected}).`);
          const correctCount = choices.filter((choice) => choice.isCorrect).length;
          if (correctCount !== 1) errors.push(`Câu ${name} phải có đúng 1 đáp án đúng.`);
        });
      });
    });
  });
  return errors;
}

function preparePayload(exam, status) {
  const normalized = normalizeExam({ ...exam, status });
  const sections = normalized.sections.map((section) => {
    const { audioUrl, audioDuration, ...sectionPayload } = section;
    return {
      ...sectionPayload,
      parts: section.parts.map((part) => {
        const { optionCount, ...partPayload } = part;
        return {
          ...partPayload,
      groups: part.groups.map((group) => ({
        ...group,
        audioFile: listeningSection(section) ? (section.audioUrl || group.audioFile || "") : group.audioFile,
        questions: group.questions.map((question) => ({
          ...question,
          choices: question.choices.map((choice, index) => ({
            ...choice,
            label: choice.label || String(index + 1),
            choiceOrder: index + 1,
          })),
        })),
      })),
        };
      }),
    };
  });
  return stripIds({
    ...normalized,
    status,
    sections,
    durationMinutes: sections.reduce((sum, item) => sum + Number(item.durationMinutes || 0), 0),
    maxAttempts: normalized.maxAttempts === "" ? null : normalized.maxAttempts,
    month: normalized.month === "" ? null : normalized.month,
  });
}

export default function AdminJlptExamPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("list");
  const [filter, setFilter] = useState({ q: "", levelId: "", section: "", status: "" });
  const [active, setActive] = useState({ section: 0, part: 0, group: 0, question: 0 });
  const [createLevel, setCreateLevel] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return items.filter((item) => {
      const exam = normalizeExam(item);
      const okQ = !q || `${item.title} ${item.examCode} ${item.description}`.toLowerCase().includes(q);
      const okLevel = !filter.levelId || Number(item.levelId) === Number(filter.levelId);
      const okStatus = !filter.status || item.status === filter.status;
      const okSection = !filter.section || exam.sections.some((section) => section.title === filter.section || section.type === filter.section);
      return okQ && okLevel && okStatus && okSection;
    });
  }, [filter, items]);

  const allSections = useMemo(() => [...new Set(items.flatMap((item) => sectionTags(item)))], [items]);

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      setItems(await adminApi.getExams());
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectExam = (item, nextMode = "edit") => {
    setSelected(normalizeExam(item));
    setMode(nextMode);
    setErrors([]);
    setActive({ section: 0, part: 0, group: 0, question: 0 });
  };

  const setExam = (updater) => setSelected((current) => normalizeExam(typeof updater === "function" ? updater(current) : updater));
  const readOnly = mode === "view";
  const section = selected?.sections?.[active.section];
  const part = section?.parts?.[active.part];
  const group = part?.groups?.[active.group];
  const question = group?.questions?.[active.question];

  const updateExam = (field, value) => !readOnly && setExam((exam) => ({ ...exam, [field]: value }));
  const updateSection = (field, value) => !readOnly && setExam((exam) => ({
    ...exam,
    sections: exam.sections.map((item, index) => index === active.section ? { ...item, [field]: value } : item),
  }));
  const updatePart = (field, value) => !readOnly && setExam((exam) => ({
    ...exam,
    sections: exam.sections.map((sectionItem, sectionIndex) => sectionIndex === active.section ? {
      ...sectionItem,
      parts: sectionItem.parts.map((item, index) => index === active.part ? { ...item, [field]: value } : item),
    } : sectionItem),
  }));
  const updateGroup = (field, value) => !readOnly && setExam((exam) => ({
    ...exam,
    sections: exam.sections.map((sectionItem, sectionIndex) => sectionIndex === active.section ? {
      ...sectionItem,
      parts: sectionItem.parts.map((partItem, partIndex) => partIndex === active.part ? {
        ...partItem,
        groups: partItem.groups.map((item, index) => index === active.group ? { ...item, [field]: value } : item),
      } : partItem),
    } : sectionItem),
  }));
  const updateQuestion = (field, value) => !readOnly && setExam((exam) => ({
    ...exam,
    sections: exam.sections.map((sectionItem, sectionIndex) => sectionIndex === active.section ? {
      ...sectionItem,
      parts: sectionItem.parts.map((partItem, partIndex) => partIndex === active.part ? {
        ...partItem,
        groups: partItem.groups.map((groupItem, groupIndex) => groupIndex === active.group ? {
          ...groupItem,
          questions: groupItem.questions.map((item, index) => index === active.question ? { ...item, [field]: value } : item),
        } : groupItem),
      } : partItem),
    } : sectionItem),
  }));

  const updateQuestionAt = (questionIndex, field, value) => {
    if (readOnly) return;
    setActive((current) => ({ ...current, question: questionIndex }));
    setExam((exam) => ({
      ...exam,
      sections: exam.sections.map((sectionItem, sectionIndex) => sectionIndex === active.section ? {
        ...sectionItem,
        parts: sectionItem.parts.map((partItem, partIndex) => partIndex === active.part ? {
          ...partItem,
          groups: partItem.groups.map((groupItem, groupIndex) => groupIndex === active.group ? {
            ...groupItem,
            questions: groupItem.questions.map((item, index) => index === questionIndex ? { ...item, [field]: value } : item),
          } : groupItem),
        } : partItem),
      } : sectionItem),
    }));
  };

  const updateChoiceAt = (questionIndex, choiceIndex, field, value) => {
    if (readOnly) return;
    const currentQuestion = group.questions[questionIndex];
    const choices = currentQuestion.choices.map((choiceItem, index) => {
      if (field === "isCorrect" && value) return { ...choiceItem, isCorrect: index === choiceIndex };
      return index === choiceIndex ? { ...choiceItem, [field]: value } : choiceItem;
    });
    updateQuestionAt(questionIndex, "choices", choices);
  };

  const startCreate = () => {
    const levelId = Number(createLevel || filter.levelId || 1);
    selectExam(blankExam(levelId), "edit");
    setCreateLevel("");
  };

  const addPart = () => {
    const next = section.parts.length + 1;
    updateSection("parts", [...section.parts, blankPart(next, section.type)]);
    setActive((current) => ({ ...current, part: next - 1, group: 0, question: 0 }));
  };
  const addGroup = () => {
    const next = part.groups.length + 1;
    updatePart("groups", [...part.groups, blankGroup(next, Number(part.optionCount || 4))]);
    setActive((current) => ({ ...current, group: next - 1, question: 0 }));
  };
  const addQuestion = () => {
    const next = group.questions.length + 1;
    updateGroup("questions", [...group.questions, blankQuestion(next, Number(part.optionCount || 4))]);
    setActive((current) => ({ ...current, question: next - 1 }));
  };
  const duplicateQuestion = (questionIndex = active.question) => {
    const clone = stripIds({ ...group.questions[questionIndex], questionOrder: group.questions.length + 1 });
    updateGroup("questions", [...group.questions, clone]);
    setActive((current) => ({ ...current, question: group.questions.length }));
  };
  const removeQuestion = (questionIndex = active.question) => {
    if (group.questions.length <= 1 || !window.confirm("Xóa câu hỏi này?")) return;
    updateGroup("questions", group.questions.filter((_, index) => index !== questionIndex).map((item, index) => ({ ...item, questionOrder: index + 1 })));
    setActive((current) => ({ ...current, question: Math.max(0, Math.min(questionIndex - 1, group.questions.length - 2)) }));
  };
  const moveQuestion = (questionIndex, direction) => {
    const nextIndex = questionIndex + direction;
    if (nextIndex < 0 || nextIndex >= group.questions.length) return;
    const questions = [...group.questions];
    [questions[questionIndex], questions[nextIndex]] = [questions[nextIndex], questions[questionIndex]];
    updateGroup("questions", questions.map((item, index) => ({ ...item, questionOrder: index + 1 })));
    setActive((current) => ({ ...current, question: nextIndex }));
  };
  const addChoiceAt = (questionIndex) => {
    const currentQuestion = group.questions[questionIndex];
    updateQuestionAt(questionIndex, "choices", [...currentQuestion.choices, blankChoice(currentQuestion.choices.length + 1)]);
  };
  const removeChoiceAt = (questionIndex, choiceIndex) => {
    const currentQuestion = group.questions[questionIndex];
    if (currentQuestion.choices.length <= 2) return;
    const remaining = currentQuestion.choices.filter((_, index) => index !== choiceIndex);
    const hasCorrect = remaining.some((choice) => choice.isCorrect);
    updateQuestionAt(questionIndex, "choices", remaining.map((choice, index) => ({
      ...choice,
      label: String(index + 1),
      choiceOrder: index + 1,
      isCorrect: hasCorrect ? Boolean(choice.isCorrect) : index === 0,
    })));
  };

  const upload = async (file, onUrl) => {
    if (!file) return;
    const data = await adminApi.uploadFile(file, `jlpt-${selected.folderSlug || "n5"}`);
    onUrl(data.url);
  };

  const save = async (status = selected.status) => {
    const nextErrors = validationMessages(selected, status === "PUBLISHED");
    setErrors(nextErrors);
    if (nextErrors.length) return;
    setLoading(true);
    setMessage("");
    try {
      const payload = preparePayload(selected, status);
      if (selected.id) await adminApi.updateExam(selected.id, payload);
      else await adminApi.createExam(payload);
      setSelected(null);
      setMode("list");
      await load();
      setMessage(status === "PUBLISHED" ? "Đã xuất bản đề JLPT." : "Đã lưu đề JLPT.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const duplicate = (item) => {
    const clone = normalizeExam(stripIds(item));
    clone.title = `${clone.title} (copy)`;
    clone.examCode = "";
    clone.status = "DRAFT";
    selectExam(clone, "edit");
  };

  const remove = async (item) => {
    if (!window.confirm(`Xóa đề ${item.title}?`)) return;
    setLoading(true);
    try {
      await adminApi.deleteExam(item.id);
      await load();
      setMessage("Đã xóa đề.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-page jlpt-admin">
      <section className="admin-heading admin-heading-row">
        <div>
          <span className="admin-kicker">JLPT Exam Builder</span>
          <h1>Quản lý đề thi JLPT</h1>
          <p>Tạo, xem, sửa, nhân bản và xuất bản đề theo cấu trúc chuẩn từng level.</p>
        </div>
        <div className="admin-heading-actions">
          <select value={createLevel} onChange={(event) => setCreateLevel(event.target.value)} aria-label="Chọn level tạo đề">
            <option value="">Chọn level</option>
            {levels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <button className="admin-primary-button" type="button" onClick={startCreate}>+ Tạo đề mới</button>
        </div>
      </section>

      {message ? <div className="admin-message">{message}</div> : null}

      {!selected ? (
        <>
          <section className="admin-panel jlpt-admin-stats">
            <article><span>Tổng số đề</span><strong>{items.length}</strong></article>
            <article><span>Đã xuất bản</span><strong>{items.filter((item) => item.status === "PUBLISHED").length}</strong></article>
            <article><span>Nháp</span><strong>{items.filter((item) => item.status === "DRAFT").length}</strong></article>
            <article><span>Ẩn</span><strong>{items.filter((item) => item.status === "HIDDEN").length}</strong></article>
          </section>
          <section className="admin-panel">
            <div className="admin-toolbar jlpt-admin-toolbar">
              <input value={filter.q} onChange={(event) => setFilter({ ...filter, q: event.target.value })} placeholder="Tìm theo tên đề, mã đề..." />
              <select value={filter.levelId} onChange={(event) => setFilter({ ...filter, levelId: event.target.value })}>
                <option value="">Tất cả level</option>
                {levels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
              <select value={filter.section} onChange={(event) => setFilter({ ...filter, section: event.target.value })}>
                <option value="">Tất cả section</option>
                {allSections.map((title) => <option value={title} key={title}>{title}</option>)}
              </select>
              <select value={filter.status} onChange={(event) => setFilter({ ...filter, status: event.target.value })}>
                <option value="">Tất cả trạng thái</option>
                {statuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
              </select>
            </div>
            <div className="admin-data-table">
              <table>
                <thead><tr><th>Tên đề</th><th>Level</th><th>Section</th><th>Câu hỏi</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {filtered.map((item) => {
                    const exam = normalizeExam(item);
                    return (
                      <tr key={item.id}>
                        <td><strong>{item.title}</strong><span>{item.examCode || item.description || "-"}</span></td>
                        <td>{levelName(item.levelId)}</td>
                        <td><div className="jlpt-section-tags">{sectionTags(item).map((title) => <span key={title}>{title}</span>)}</div></td>
                        <td>{countQuestions(exam)}</td>
                        <td>{exam.sections.reduce((sum, section) => sum + Number(section.durationMinutes || 0), 0)} phút</td>
                        <td><span className={`admin-status ${statusClass(item.status)}`}>{statusLabels[item.status] || "Nháp"}</span></td>
                        <td className="admin-row-actions">
                          <button type="button" onClick={() => selectExam(item, "view")}>Xem</button>
                          <button type="button" onClick={() => selectExam(item, "edit")}>Sửa</button>
                          <button type="button" onClick={() => duplicate(item)}>Sao chép</button>
                          <button className="danger" type="button" onClick={() => remove(item)}>Xóa</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filtered.length && !loading ? <div className="admin-empty-state">Chưa có đề JLPT nào.</div> : null}
            </div>
          </section>
        </>
      ) : (
        <section className="jlpt-editor-stack">
          <section className="admin-panel admin-form">
            <div className="admin-card-title">
              <div>
                <h2>{readOnly ? "Xem đề thi" : selected.id ? "Sửa đề thi" : "Tạo đề mới"}</h2>
                <p>{levelName(selected.levelId)} - {countQuestions(selected)} câu - {selected.sections.length} section</p>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => { setSelected(null); setMode("list"); }}>Về danh sách</button>
                {readOnly ? <button type="button" onClick={() => setMode("edit")}>Sửa đề này</button> : null}
                {!readOnly ? <button type="button" onClick={() => save("DRAFT")} disabled={loading}>Lưu nháp</button> : null}
                {!readOnly ? <button type="button" onClick={() => save("PUBLISHED")} disabled={loading}>Xuất bản</button> : null}
              </div>
            </div>
            {errors.length ? <div className="admin-validation-box">{errors.slice(0, 8).map((error) => <span key={error}>{error}</span>)}</div> : null}
            <div className="admin-form-grid">
              <label>Tên đề<input disabled={readOnly} value={selected.title} onChange={(event) => updateExam("title", event.target.value)} /></label>
              <label>Mã đề<input disabled={readOnly} value={selected.examCode ?? ""} onChange={(event) => updateExam("examCode", event.target.value)} /></label>
              <label>Level<select disabled={readOnly || Boolean(selected.id)} value={selected.levelId} onChange={(event) => {
                const nextLevelId = Number(event.target.value);
                const nextConfig = jlptLevelConfig[nextLevelId];
                setExam((exam) => ({
                  ...exam,
                  levelId: nextLevelId,
                  title: exam.title || `JLPT ${nextConfig.label} Mock Test`,
                  folderSlug: nextConfig.label.toLowerCase(),
                  tags: `JLPT,${nextConfig.label}`,
                  durationMinutes: nextConfig.total,
                  sections: sectionsForLevel(nextLevelId),
                }));
                setActive({ section: 0, part: 0, group: 0, question: 0 });
              }}>{levels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>Trạng thái<select disabled={readOnly} value={selected.status ?? "DRAFT"} onChange={(event) => updateExam("status", event.target.value)}>{statuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></label>
              <label>Tháng<input disabled={readOnly} type="number" value={selected.month ?? ""} onChange={(event) => updateExam("month", event.target.value)} /></label>
              <label>Năm<input disabled={readOnly} type="number" value={selected.year ?? ""} onChange={(event) => updateExam("year", event.target.value)} /></label>
              <label>Mở đề lúc<input disabled={readOnly} value={selected.availableFrom ?? ""} onChange={(event) => updateExam("availableFrom", event.target.value)} placeholder="2026-07-01 08:00" /></label>
              <label>Số lần tối đa<input disabled={readOnly} type="number" value={selected.maxAttempts ?? ""} onChange={(event) => updateExam("maxAttempts", event.target.value)} /></label>
            </div>
            <label>Mô tả<textarea disabled={readOnly} rows="3" value={selected.description ?? ""} onChange={(event) => updateExam("description", event.target.value)} /></label>
            <div className="admin-actions">
              <label className="admin-check"><input disabled={readOnly} type="checkbox" checked={Boolean(selected.allowAnswerReview)} onChange={(event) => updateExam("allowAnswerReview", event.target.checked)} /> Cho xem đáp án</label>
              <label className="admin-check"><input disabled={readOnly} type="checkbox" checked={Boolean(selected.allowRetake)} onChange={(event) => updateExam("allowRetake", event.target.checked)} /> Cho làm lại</label>
            </div>
          </section>

          <section className="admin-panel admin-form">
            <div className="jlpt-section-tabs">
              {selected.sections.map((item, index) => (
                <button className={active.section === index ? "active" : ""} key={index} type="button" onClick={() => setActive({ section: index, part: 0, group: 0, question: 0 })}>
                  {item.title}<span>{item.durationMinutes} phút</span>
                </button>
              ))}
            </div>
            <div className="admin-form-grid">
              <label>Tên section<input disabled={readOnly} value={section.title} onChange={(event) => updateSection("title", event.target.value)} /></label>
              <label>Loại<select disabled={readOnly} value={section.type} onChange={(event) => updateSection("type", event.target.value)}>{sectionTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
              <label>Thời gian phút<input disabled={readOnly} type="number" value={section.durationMinutes ?? ""} onChange={(event) => updateSection("durationMinutes", event.target.value)} /></label>
              <label>Thứ tự<input disabled={readOnly} type="number" value={section.orderIndex ?? ""} onChange={(event) => updateSection("orderIndex", event.target.value)} /></label>
            </div>
            <label>Hướng dẫn section<textarea disabled={readOnly} rows="2" value={section.instruction ?? ""} onChange={(event) => updateSection("instruction", event.target.value)} /></label>
            {listeningSection(section) ? (
              <div className="jlpt-section-audio">
                <strong>Audio chung cho toàn bộ section nghe</strong>
                <div className="admin-upload-row">
                  <input disabled={readOnly} value={section.audioUrl ?? ""} onChange={(event) => updateSection("audioUrl", event.target.value)} placeholder="URL audio mp3/wav/m4a" />
                  <input disabled={readOnly} type="file" accept=".mp3,.wav,.m4a,audio/*" onChange={(event) => upload(event.target.files?.[0], (url) => updateSection("audioUrl", url))} />
                  {!readOnly && section.audioUrl ? <button type="button" onClick={() => updateSection("audioUrl", "")}>Xóa audio</button> : null}
                </div>
                {section.audioUrl ? <audio controls src={section.audioUrl} /> : <span>Chưa có audio. Khi xuất bản section nghe bắt buộc có 1 file audio chung.</span>}
                <label>Thời lượng audio (giây)<input disabled={readOnly} type="number" value={section.audioDuration ?? ""} onChange={(event) => updateSection("audioDuration", event.target.value)} /></label>
              </div>
            ) : null}
          </section>

          <section className="admin-panel admin-form">
            <div className="admin-card-title">
              <h2>Mondai</h2>
              {!readOnly ? <button type="button" onClick={addPart}>+ Thêm Mondai</button> : null}
            </div>
            <div className="jlpt-mondai-accordion">
              {section.parts.map((partItem, partIndex) => (
                <details key={partIndex} open={active.part === partIndex}>
                  <summary onClick={(event) => { event.preventDefault(); setActive({ section: active.section, part: partIndex, group: 0, question: 0 }); }}>
                    <strong>{partItem.title}</strong>
                    <span>{partItem.groups.reduce((sum, item) => sum + (item.questions?.length ?? 0), 0)} câu</span>
                  </summary>
                  {active.part === partIndex ? (
                    <div className="jlpt-mondai-editor">
                      <div className="admin-form-grid">
                        <label>Tên Mondai<input disabled={readOnly} value={part.title} onChange={(event) => updatePart("title", event.target.value)} /></label>
                        <label>Loại câu<select disabled={readOnly} value={part.questionType} onChange={(event) => {
                          const optionCount = optionCountFor(event.target.value, section.type);
                          updatePart("questionType", event.target.value);
                          updatePart("optionCount", optionCount);
                        }}>{questionTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
                        <label>Số đáp án gợi ý<input disabled={readOnly} type="number" min="2" max="5" value={part.optionCount ?? 4} onChange={(event) => updatePart("optionCount", event.target.value)} /></label>
                        <label>Điểm mỗi câu<input disabled={readOnly} type="number" value={part.scorePerQuestion ?? ""} onChange={(event) => updatePart("scorePerQuestion", event.target.value)} /></label>
                      </div>
                      <label>Hướng dẫn Mondai<textarea disabled={readOnly} rows="2" value={part.instruction ?? ""} onChange={(event) => updatePart("instruction", event.target.value)} /></label>
                      <div className="admin-card-title">
                        <select value={active.group} onChange={(event) => setActive({ ...active, group: Number(event.target.value), question: 0 })}>
                          {part.groups.map((item, index) => <option value={index} key={index}>{item.title}</option>)}
                        </select>
                        {!readOnly ? <button type="button" onClick={addGroup}>+ Group</button> : null}
                      </div>
                      <div className="admin-form-grid">
                        <label>Tên group<input disabled={readOnly} value={group.title ?? ""} onChange={(event) => updateGroup("title", event.target.value)} /></label>
                        <label>Hiển thị câu hỏi<select disabled={readOnly} value={group.questionVisibility ?? "BEFORE_AUDIO"} onChange={(event) => updateGroup("questionVisibility", event.target.value)}><option value="BEFORE_AUDIO">Trước khi nghe</option><option value="AFTER_AUDIO">Sau khi nghe</option></select></label>
                        <label>Số lần nghe<input disabled={readOnly} type="number" value={group.audioPlayLimit ?? ""} onChange={(event) => updateGroup("audioPlayLimit", event.target.value)} /></label>
                      </div>
                      <label>Đoạn văn<textarea disabled={readOnly} rows="4" value={group.passageText ?? ""} onChange={(event) => updateGroup("passageText", event.target.value)} /></label>
                      <label>Transcript<textarea disabled={readOnly} rows="2" value={group.transcript ?? ""} onChange={(event) => updateGroup("transcript", event.target.value)} /></label>

                      <div className="admin-card-title">
                        <h3>Câu hỏi ({group.questions.length})</h3>
                        {!readOnly ? <button type="button" onClick={addQuestion}>+ Câu</button> : null}
                      </div>
                      <div className="jlpt-question-list">
                        {group.questions.map((questionItem, questionIndex) => (
                          <article className="jlpt-question-card" key={questionItem.id ?? questionIndex}>
                            <div className="admin-card-title">
                              <h3>Câu {questionIndex + 1}</h3>
                              <div className="admin-actions">
                                {!readOnly ? <button type="button" onClick={() => duplicateQuestion(questionIndex)}>Nhân bản</button> : null}
                                {!readOnly ? <button type="button" onClick={() => moveQuestion(questionIndex, -1)}>Lên</button> : null}
                                {!readOnly ? <button type="button" onClick={() => moveQuestion(questionIndex, 1)}>Xuống</button> : null}
                                {!readOnly ? <button className="danger" type="button" onClick={() => removeQuestion(questionIndex)}>Xóa câu</button> : null}
                              </div>
                            </div>
                            <div className="admin-form-grid">
                              <label>Loại<select disabled={readOnly} value={questionItem.questionType} onChange={(event) => updateQuestionAt(questionIndex, "questionType", event.target.value)}>{questionTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
                              <label>Thứ tự<input disabled={readOnly} type="number" value={questionItem.questionOrder ?? ""} onChange={(event) => updateQuestionAt(questionIndex, "questionOrder", event.target.value)} /></label>
                              <label>Điểm<input disabled={readOnly} type="number" value={questionItem.score ?? ""} onChange={(event) => updateQuestionAt(questionIndex, "score", event.target.value)} /></label>
                            </div>
                            <label>Nội dung câu hỏi<textarea disabled={readOnly} rows="4" value={questionItem.questionText ?? ""} onChange={(event) => updateQuestionAt(questionIndex, "questionText", event.target.value)} /></label>
                            <div className="admin-form-grid">
                              <label>Ảnh câu hỏi<div className="admin-upload-row"><input disabled={readOnly} value={questionItem.imageUrl ?? ""} onChange={(event) => updateQuestionAt(questionIndex, "imageUrl", event.target.value)} /><input disabled={readOnly} type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0], (url) => updateQuestionAt(questionIndex, "imageUrl", url))} /></div></label>
                              <label>Ảnh đoạn văn<div className="admin-upload-row"><input disabled={readOnly} value={group.passageImage ?? ""} onChange={(event) => updateGroup("passageImage", event.target.value)} /><input disabled={readOnly} type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0], (url) => updateGroup("passageImage", url))} /></div></label>
                            </div>
                            <div className="admin-choice-grid">
                              {questionItem.choices.map((choice, choiceIndex) => (
                                <div className="admin-choice-row" key={choiceIndex}>
                                  <label className="admin-choice-correct"><input disabled={readOnly} type="radio" checked={Boolean(choice.isCorrect)} onChange={() => updateChoiceAt(questionIndex, choiceIndex, "isCorrect", true)} /> Đúng</label>
                                  <input disabled={readOnly} value={choice.label ?? ""} onChange={(event) => updateChoiceAt(questionIndex, choiceIndex, "label", event.target.value)} placeholder="1" />
                                  <input disabled={readOnly} value={choice.choiceText ?? ""} onChange={(event) => updateChoiceAt(questionIndex, choiceIndex, "choiceText", event.target.value)} placeholder={`Đáp án ${choiceIndex + 1}`} />
                                  <input disabled={readOnly} value={choice.image ?? ""} onChange={(event) => updateChoiceAt(questionIndex, choiceIndex, "image", event.target.value)} placeholder="Ảnh đáp án" />
                                  {!readOnly ? <button type="button" onClick={() => removeChoiceAt(questionIndex, choiceIndex)}>Xóa</button> : null}
                                </div>
                              ))}
                            </div>
                            {!readOnly ? <button type="button" onClick={() => addChoiceAt(questionIndex)}>+ Thêm đáp án</button> : null}
                            <label>Giải thích<textarea disabled={readOnly} rows="3" value={questionItem.explanation ?? ""} onChange={(event) => updateQuestionAt(questionIndex, "explanation", event.target.value)} /></label>
                            <label>Dịch nghĩa<textarea disabled={readOnly} rows="2" value={questionItem.translation ?? ""} onChange={(event) => updateQuestionAt(questionIndex, "translation", event.target.value)} /></label>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </details>
              ))}
            </div>
          </section>

        </section>
      )}
    </main>
  );
}
