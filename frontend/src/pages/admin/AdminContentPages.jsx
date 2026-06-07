import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi.js";

const pageSizes = [10, 20, 50];
const jlptLevels = [[1, "N5"], [2, "N4"], [3, "N3"], [4, "N2"], [5, "N1"]];

const emptyForms = {
  vocabularies: {
    id: "", word: "", kanji: "", reading: "", meaningVi: "", meaningEn: "", wordType: "",
    levelId: 1, lessonNote: "", examplesJson: pretty([{ exampleJp: "", exampleReading: "", exampleVi: "" }]),
  },
  kanjis: {
    id: "", kanjiChar: "", meaningVi: "", hanVietReading: "", meaningEn: "", onyomi: "",
    kunyomi: "", strokeCount: "", radical: "", levelId: 1, penStrokes: "", relatedVocabularyIds: "",
  },
  grammar: {
    id: "", title: "", grammarPattern: "", meaningVi: "", usageText: "",
    noteText: "", comparisonText: "", levelId: 1,
  },
  exercises: {
    id: "", title: "", description: "", tags: "", levelId: 1, grammarLessonId: "",
    exerciseType: "MULTIPLE_CHOICE", sourceUrl: "", createdBy: "",
    questions: [emptyExerciseQuestion(1)],
  },
  exams: {
    id: "", title: "", description: "", tags: "", folderSlug: "n5", audioUrl: "",
    levelId: 1, durationMinutes: 45, questions: [emptyExamQuestion(1)],
  },
};

const titles = {
  vocabularies: ["Vocabulary", "Quản lý từ vựng"],
  kanjis: ["Kanji", "Quản lý Kanji"],
  exercises: ["Exercise", "Quản lý bài tập"],
  exams: ["Exam JLPT", "Quản lý đề JLPT"],
};

function emptyExerciseQuestion(order = 1) {
  return {
    questionText: "",
    questionOrder: order,
    explanation: "",
    choices: [
      { choiceText: "", isCorrect: true, choiceOrder: 1 },
      { choiceText: "", isCorrect: false, choiceOrder: 2 },
      { choiceText: "", isCorrect: false, choiceOrder: 3 },
      { choiceText: "", isCorrect: false, choiceOrder: 4 },
    ],
  };
}

function emptyExamQuestion(order = 1) {
  return {
    sectionType: "LANGUAGE_KNOWLEDGE",
    mondai: "Mondai 1",
    questionType: "MULTIPLE_CHOICE",
    questionText: "",
    questionOrder: order,
    imageUrl: "",
    passageImageUrl: "",
    audioStartSec: "",
    audioEndSec: "",
    explanation: "",
    choices: [
      { choiceText: "", isCorrect: true, choiceOrder: 1 },
      { choiceText: "", isCorrect: false, choiceOrder: 2 },
      { choiceText: "", isCorrect: false, choiceOrder: 3 },
      { choiceText: "", isCorrect: false, choiceOrder: 4 },
    ],
  };
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function parseJson(value, label) {
  try {
    return JSON.parse(value || "[]");
  } catch {
    throw new Error(`${label} không đúng định dạng.`);
  }
}

function sampleQuestions(sectionType) {
  return [{
    ...(sectionType ? { sectionType } : {}),
    questionText: "Nhập câu hỏi",
    questionOrder: 1,
    explanation: "Giải thích ngắn",
    choices: [
      { choiceText: "Đáp án A", isCorrect: true, choiceOrder: 1 },
      { choiceText: "Đáp án B", isCorrect: false, choiceOrder: 2 },
      { choiceText: "Đáp án C", isCorrect: false, choiceOrder: 3 },
      { choiceText: "Đáp án D", isCorrect: false, choiceOrder: 4 },
    ],
  }];
}

function levelLabel(levelId) {
  return jlptLevels.find(([id]) => Number(id) === Number(levelId))?.[1] ?? "-";
}

function idsFromText(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean).map(Number);
}

function stripIds(value) {
  if (Array.isArray(value)) return value.map(stripIds);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "id").map(([key, item]) => [key, stripIds(item)]));
}

function normalizeExerciseQuestions(questions = []) {
  const source = questions.length ? questions : [emptyExerciseQuestion(1)];
  return source.map((question, questionIndex) => ({
    questionText: question.questionText ?? "",
    questionOrder: question.questionOrder ?? questionIndex + 1,
    explanation: question.explanation ?? "",
    choices: normalizeExerciseChoices(question.choices),
  }));
}

function normalizeExerciseChoices(choices = []) {
  const source = choices.length ? choices : emptyExerciseQuestion(1).choices;
  const hasCorrect = source.some((choice) => choice.isCorrect);
  return source.map((choice, choiceIndex) => ({
    choiceText: choice.choiceText ?? "",
    isCorrect: hasCorrect ? Boolean(choice.isCorrect) : choiceIndex === 0,
    choiceOrder: choice.choiceOrder ?? choiceIndex + 1,
  }));
}

function normalizeExamQuestions(questions = []) {
  const source = questions.length ? questions : [emptyExamQuestion(1)];
  return source.map((question, questionIndex) => ({
    sectionType: question.sectionType ?? "LANGUAGE_KNOWLEDGE",
    mondai: question.mondai ?? "",
    questionType: question.questionType ?? "MULTIPLE_CHOICE",
    questionText: question.questionText ?? "",
    questionOrder: question.questionOrder ?? questionIndex + 1,
    imageUrl: question.imageUrl ?? "",
    passageImageUrl: question.passageImageUrl ?? "",
    audioStartSec: question.audioStartSec ?? "",
    audioEndSec: question.audioEndSec ?? "",
    explanation: question.explanation ?? "",
    choices: normalizeExerciseChoices(question.choices),
  }));
}

function normalizePage(data) {
  if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 };
  return { content: data?.content ?? [], totalElements: data?.totalElements ?? 0, totalPages: data?.totalPages ?? 1 };
}

function pageSlice(items, page, size) {
  return items.slice(page * size, page * size + size);
}

export default function AdminContentPage({ type }) {
  const [form, setForm] = useState(emptyForms[type]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [query, setQuery] = useState("");
  const [levelId, setLevelId] = useState("");
  const [lesson, setLesson] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [questionBank, setQuestionBank] = useState([]);

  const isSearchOnly = type === "vocabularies" || type === "kanjis";
  const [kicker, title] = titles[type] ?? ["Grammar", "Quản lý ngữ pháp"];

  const canLoad = !isSearchOnly || query.trim() || levelId || lesson.trim();

  const load = async (nextPage = page, nextSize = size) => {
    if (!canLoad) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      if (type === "vocabularies") {
        const data = normalizePage(await adminApi.getVocabularies({ q: query.trim(), levelId, lesson: lesson.trim(), page: nextPage, size: nextSize }));
        setItems(data.content);
        setTotal(data.totalElements);
      } else if (type === "kanjis") {
        const data = normalizePage(await adminApi.getKanjis({ q: query.trim(), levelId, page: nextPage, size: nextSize }));
        setItems(data.content);
        setTotal(data.totalElements);
      } else {
        const loader = { grammar: adminApi.getGrammar, exercises: adminApi.getExercises, exams: adminApi.getExams }[type];
        const data = await loader();
        setItems(data);
        setTotal(data.length);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(emptyForms[type]);
    setItems([]);
    setTotal(0);
    setPage(0);
    setQuery("");
    setLevelId("");
    setLesson("");
    setMessage("");
    setImportRows([]);
    setQuestionBank([]);
  }, [type]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      load(0, size);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, levelId, lesson, type, size]);

  useEffect(() => {
    if (!isSearchOnly) load(page, size);
  }, [type]);

  const clientFiltered = useMemo(() => {
    if (isSearchOnly) return items;
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchKeyword = !keyword || JSON.stringify(item).toLowerCase().includes(keyword);
      const matchLevel = !levelId || Number(item.levelId) === Number(levelId);
      const matchLesson = !lesson.trim() || String(item.lessonNote ?? item.grammarLessonId ?? "").toLowerCase().includes(lesson.trim().toLowerCase());
      return matchKeyword && matchLevel && matchLesson;
    });
  }, [isSearchOnly, items, query, levelId, lesson]);

  const visibleItems = isSearchOnly ? items : pageSlice(clientFiltered, page, size);
  const totalElements = isSearchOnly ? total : clientFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const openCreate = () => {
    setForm(emptyForms[type]);
    setModalOpen(true);
    if (type === "exams") loadQuestionBank();
  };

  const openEdit = (item) => {
    if (type === "vocabularies") {
      setForm({
        ...emptyForms.vocabularies,
        id: item.id ?? "",
        word: item.word ?? "",
        kanji: item.kanji ?? "",
        reading: item.reading ?? "",
        meaningVi: item.meaningVi ?? "",
        meaningEn: item.meaningEn ?? "",
        wordType: item.wordType ?? "",
        levelId: item.levelId ?? 1,
        lessonNote: item.lessonNote ?? "",
        examplesJson: pretty(stripIds(item.examples ?? [])),
      });
    } else if (type === "kanjis") {
      setForm({
        ...emptyForms.kanjis,
        id: item.id ?? "",
        kanjiChar: item.kanjiChar ?? "",
        meaningVi: item.meaningVi ?? "",
        hanVietReading: item.hanVietReading ?? "",
        meaningEn: item.meaningEn ?? "",
        onyomi: item.onyomi ?? "",
        kunyomi: item.kunyomi ?? "",
        strokeCount: item.strokeCount ?? "",
        radical: item.radical ?? "",
        levelId: item.levelId ?? 1,
        penStrokes: item.penStrokes ?? "",
      });
    } else if (type === "grammar") {
      setForm({
        ...emptyForms.grammar,
        id: item.id ?? "",
        title: item.title ?? "",
        grammarPattern: item.grammarPattern ?? "",
        meaningVi: item.meaningVi ?? "",
        usageText: item.usageText ?? "",
        noteText: item.noteText ?? "",
        comparisonText: item.comparisonText ?? "",
        levelId: item.levelId ?? 1,
      });
    } else if (type === "exercises") {
      setForm({
        ...emptyForms.exercises,
        id: item.id ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
        tags: item.tags ?? "",
        grammarLessonId: item.grammarLessonId ?? "",
        levelId: item.levelId ?? 1,
        exerciseType: item.exerciseType ?? "MULTIPLE_CHOICE",
        sourceUrl: item.sourceUrl ?? "",
        createdBy: item.createdBy ?? "",
        questions: normalizeExerciseQuestions(item.questions),
      });
    } else if (type === "exams") {
      setForm({
        ...emptyForms.exams,
        id: item.id ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
        tags: item.tags ?? "",
        folderSlug: item.folderSlug ?? `n${6 - Number(item.levelId ?? 1)}`,
        audioUrl: item.audioUrl ?? "",
        levelId: item.levelId ?? 1,
        durationMinutes: item.durationMinutes ?? 45,
        questions: normalizeExamQuestions(item.questions),
      });
    }
    setModalOpen(true);
    if (type === "exams") loadQuestionBank();
  };

  const loadQuestionBank = async () => {
    try {
      const exercises = await adminApi.getExercises();
      setQuestionBank(
        exercises.flatMap((exercise) =>
          (exercise.questions ?? []).map((question) => ({
            ...question,
            sourceTitle: exercise.title,
            sourceLevelId: exercise.levelId,
          })),
        ),
      );
    } catch {
      setQuestionBank([]);
    }
  };

  const toPayload = () => {
    if (type === "vocabularies") {
      return {
        word: form.word,
        kanji: form.kanji,
        reading: form.reading,
        meaningVi: form.meaningVi,
        meaningEn: form.meaningEn,
        wordType: form.wordType,
        levelId: Number(form.levelId),
        lessonNote: form.lessonNote,
        examples: parseJson(form.examplesJson, "Ví dụ"),
      };
    }
    if (type === "kanjis") {
      return {
        kanjiChar: form.kanjiChar,
        meaningVi: form.meaningVi,
        hanVietReading: form.hanVietReading,
        meaningEn: form.meaningEn,
        onyomi: form.onyomi,
        kunyomi: form.kunyomi,
        strokeCount: form.strokeCount ? Number(form.strokeCount) : null,
        radical: form.radical,
        levelId: Number(form.levelId),
        penStrokes: form.penStrokes,
        relatedVocabularyIds: idsFromText(form.relatedVocabularyIds),
      };
    }
    if (type === "grammar") {
      return {
        title: form.title,
        grammarPattern: form.grammarPattern,
        meaningVi: form.meaningVi,
        usageText: form.usageText,
        noteText: form.noteText,
        comparisonText: form.comparisonText,
        levelId: Number(form.levelId),
      };
    }
    if (type === "exercises") {
      return {
        title: form.title,
        description: form.description,
        tags: form.tags,
        grammarLessonId: form.grammarLessonId ? Number(form.grammarLessonId) : null,
        levelId: Number(form.levelId),
        exerciseType: form.exerciseType,
        sourceUrl: form.sourceUrl,
        createdBy: form.createdBy ? Number(form.createdBy) : null,
        questions: normalizeExerciseQuestions(form.questions).map((question, questionIndex) => ({
          questionText: question.questionText,
          questionOrder: Number(question.questionOrder || questionIndex + 1),
          explanation: question.explanation,
          choices: normalizeExerciseChoices(question.choices)
            .filter((choice) => choice.choiceText.trim())
            .map((choice, choiceIndex) => ({
              choiceText: choice.choiceText,
              isCorrect: Boolean(choice.isCorrect),
              choiceOrder: Number(choice.choiceOrder || choiceIndex + 1),
            })),
        })),
      };
    }
    return {
      title: form.title,
      description: form.description,
      tags: form.tags,
      folderSlug: form.folderSlug,
      audioUrl: form.audioUrl,
      levelId: Number(form.levelId),
      durationMinutes: Number(form.durationMinutes),
      questions: normalizeExamQuestions(form.questions).map((question, questionIndex) => ({
        sectionType: question.sectionType,
        mondai: question.mondai,
        questionType: question.questionType,
        questionText: question.questionText,
        questionOrder: Number(question.questionOrder || questionIndex + 1),
        imageUrl: question.imageUrl,
        passageImageUrl: question.passageImageUrl,
        audioStartSec: question.audioStartSec === "" ? null : Number(question.audioStartSec),
        audioEndSec: question.audioEndSec === "" ? null : Number(question.audioEndSec),
        explanation: question.explanation,
        choices: normalizeExerciseChoices(question.choices)
          .filter((choice) => choice.choiceText.trim())
          .map((choice, choiceIndex) => ({
            choiceText: choice.choiceText,
            isCorrect: Boolean(choice.isCorrect),
            choiceOrder: Number(choice.choiceOrder || choiceIndex + 1),
          })),
      })),
    };
  };

  const save = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = toPayload();
      const api = {
        vocabularies: [adminApi.createVocabulary, adminApi.updateVocabulary],
        kanjis: [adminApi.createKanji, adminApi.updateKanji],
        grammar: [adminApi.createGrammar, adminApi.updateGrammar],
        exercises: [adminApi.createExercise, adminApi.updateExercise],
        exams: [adminApi.createExam, adminApi.updateExam],
      }[type];
      if (form.id) await api[1](form.id, payload);
      else await api[0](payload);
      setModalOpen(false);
      await load(page, size);
      setMessage("Đã lưu dữ liệu.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Xóa bản ghi #${item.id}?`)) return;
    setLoading(true);
    try {
      const api = {
        vocabularies: adminApi.deleteVocabulary,
        kanjis: adminApi.deleteKanji,
        grammar: adminApi.deleteGrammar,
        exercises: adminApi.deleteExercise,
        exams: adminApi.deleteExam,
      }[type];
      await api(item.id);
      await load(page, size);
      setMessage("Đã xóa dữ liệu.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 50).map((line) => {
      const [word, readingValue, meaningVi, levelValue, lessonValue] = line.split(/,|\|/).map((value) => value?.trim() ?? "");
      return { word, reading: readingValue, meaningVi, levelId: Number(levelValue || 1), lessonNote: lessonValue };
    });
    setImportRows(rows);
  };

  const confirmImport = async () => {
    if (!importRows.length || !window.confirm(`Import ${importRows.length} từ vựng?`)) return;
    setLoading(true);
    try {
      for (const row of importRows) {
        await adminApi.createVocabulary({ ...row, examples: [] });
      }
      setImportRows([]);
      await load(0, size);
      setMessage("Đã import từ vựng.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportRows = () => {
    const csv = visibleItems.map((item) => [item.id, item.word || item.kanjiChar, item.reading || item.onyomi, item.meaningVi, levelLabel(item.levelId), item.lessonNote].join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="admin-page">
      <section className="admin-heading admin-heading-row">
        <div>
          <span className="admin-kicker">{kicker}</span>
          <h1>{title}</h1>
        </div>
        <div className="admin-heading-actions">
          <button className="admin-primary-button" type="button" onClick={openCreate}>+ {type === "exams" ? "Tạo đề" : type === "exercises" ? "Thêm bài" : type === "kanjis" ? "Thêm Kanji" : "Thêm từ"}</button>
          {type === "vocabularies" ? <label className="admin-file-button">Import file<input type="file" accept=".csv,.txt" onChange={handleImport} /></label> : null}
          {isSearchOnly ? <button type="button" onClick={exportRows}>Export</button> : null}
        </div>
      </section>

      {message ? <div className="admin-message">{message}</div> : null}

      <section className="admin-panel">
        <div className="admin-toolbar">
          <input className={isSearchOnly ? "admin-search-large" : ""} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={type === "kanjis" ? "Tìm kanji, onyomi, kunyomi, nghĩa..." : "Search..."} onKeyDown={(event) => { if (event.key === "Enter") load(0, size); }} />
          <select value={levelId} onChange={(event) => setLevelId(event.target.value)}>
            <option value="">Tất cả level</option>
            {jlptLevels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          {type !== "kanjis" ? <input value={lesson} onChange={(event) => setLesson(event.target.value)} placeholder="Lesson..." /> : null}
        </div>

        {importRows.length ? (
          <div className="admin-import-preview">
            <strong>Preview import: {importRows.length} dòng</strong>
            <button type="button" onClick={confirmImport}>Confirm import</button>
          </div>
        ) : null}

        <div className="admin-data-table">
          <table>
            <thead>{renderHead(type)}</thead>
            <tbody>{visibleItems.map((item) => renderRow(type, item, openEdit, remove))}</tbody>
          </table>
          {!visibleItems.length && canLoad ? <p className="admin-empty">{loading ? "Đang tải..." : "Không có dữ liệu phù hợp."}</p> : null}
        </div>

        <div className="admin-pagination">
          <select value={size} onChange={(event) => { const nextSize = Number(event.target.value); setSize(nextSize); setPage(0); load(0, nextSize); }}>
            {pageSizes.map((value) => <option key={value} value={value}>{value} dòng</option>)}
          </select>
          <button disabled={page === 0} type="button" onClick={() => { const next = page - 1; setPage(next); load(next, size); }}>Trước</button>
          <span>Trang {page + 1}/{totalPages} · {totalElements} bản ghi</span>
          <button disabled={page + 1 >= totalPages} type="button" onClick={() => { const next = page + 1; setPage(next); load(next, size); }}>Sau</button>
        </div>
      </section>

      {modalOpen ? (
        <div className="admin-modal-backdrop">
          <form className="admin-modal admin-modal-wide" onSubmit={(event) => { event.preventDefault(); save(); }}>
            <div className="admin-card-title">
              <h2>{form.id ? `Edit #${form.id}` : "Thêm mới"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}>Đóng</button>
            </div>
            {renderForm(type, form, update, questionBank, setForm)}
            <div className="admin-actions">
              <button disabled={loading} type="submit">Save</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function renderHead(type) {
  const heads = {
    vocabularies: ["ID", "Word", "Reading", "Meaning", "Level", "Lesson", "Actions"],
    kanjis: ["Kanji", "Onyomi", "Kunyomi", "Meaning", "Level", "Stroke", "Actions"],
    grammar: ["ID", "Tiêu đề", "Mẫu", "Nghĩa", "Level", "Cách dùng", "Actions"],
    exercises: ["ID", "Tên", "Type", "Level", "Số câu", "Tags", "Actions"],
    exams: ["ID", "Tên đề", "Thư mục", "Level", "Số câu", "Audio", "Actions"],
  }[type];
  return <tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr>;
}

function renderRow(type, item, edit, remove) {
  const actions = (
    <td><div className="admin-row-actions"><button type="button" onClick={() => edit(item)}>Edit</button><button className="danger" type="button" onClick={() => remove(item)}>Delete</button></div></td>
  );
  if (type === "vocabularies") {
    return <tr key={item.id}><td>{item.id}</td><td>{item.kanji || item.word}</td><td>{item.reading}</td><td>{item.meaningVi}</td><td>{levelLabel(item.levelId)}</td><td>{item.lessonNote || "-"}</td>{actions}</tr>;
  }
  if (type === "kanjis") {
    return <tr key={item.id}><td>{item.kanjiChar}</td><td>{item.onyomi || "-"}</td><td>{item.kunyomi || "-"}</td><td>{item.meaningVi}</td><td>{levelLabel(item.levelId)}</td><td>{item.strokeCount || "-"}</td>{actions}</tr>;
  }
  if (type === "grammar") {
    return <tr key={item.id}><td>{item.id}</td><td>{item.title}</td><td>{item.grammarPattern}</td><td>{item.meaningVi}</td><td>{levelLabel(item.levelId)}</td><td>{item.usageText || "-"}</td>{actions}</tr>;
  }
  if (type === "exercises") {
    return <tr key={item.id}><td>{item.id}</td><td>{item.title}</td><td>{item.exerciseType}</td><td>{levelLabel(item.levelId)}</td><td>{item.questions?.length ?? 0}</td><td>{item.tags || "-"}</td>{actions}</tr>;
  }
  return <tr key={item.id}><td>{item.id}</td><td>{item.title}</td><td>{item.folderSlug || `n${6 - Number(item.levelId ?? 1)}`}</td><td>{levelLabel(item.levelId)}</td><td>{item.questions?.length ?? 0}</td><td>{item.audioUrl ? "Có" : "-"}</td>{actions}</tr>;
}

function renderForm(type, form, update, questionBank = [], setForm = () => {}) {
  if (type === "vocabularies") {
    return <><label>Word<input value={form.word} onChange={update("word")} /></label><label>Kanji/Kana<input value={form.kanji} onChange={update("kanji")} /></label><label>Reading<input value={form.reading} onChange={update("reading")} /></label><label>Meaning<textarea value={form.meaningVi} onChange={update("meaningVi")} /></label><label>Example JSON<textarea rows="5" value={form.examplesJson} onChange={update("examplesJson")} /></label><LevelSelect value={form.levelId} onChange={update("levelId")} /><label>Lesson<input value={form.lessonNote} onChange={update("lessonNote")} /></label></>;
  }
  if (type === "kanjis") {
    return <><label>Kanji<input value={form.kanjiChar} onChange={update("kanjiChar")} /></label><label>Âm on<input value={form.onyomi} onChange={update("onyomi")} /></label><label>Âm kun<input value={form.kunyomi} onChange={update("kunyomi")} /></label><label>Nghĩa<textarea value={form.meaningVi} onChange={update("meaningVi")} /></label><label>Ví dụ / nét bút<textarea value={form.penStrokes} onChange={update("penStrokes")} /></label><LevelSelect value={form.levelId} onChange={update("levelId")} /><label>Stroke<input type="number" value={form.strokeCount} onChange={update("strokeCount")} /></label></>;
  }
  if (type === "grammar") {
    return (
      <>
        <label>Tiêu đề<input value={form.title} onChange={update("title")} /></label>
        <label>Mẫu ngữ pháp<input value={form.grammarPattern} onChange={update("grammarPattern")} /></label>
        <label>Nghĩa<textarea value={form.meaningVi} onChange={update("meaningVi")} /></label>
        <label>Cách dùng<textarea rows="3" value={form.usageText} onChange={update("usageText")} /></label>
        <label>Ghi chú<textarea rows="3" value={form.noteText} onChange={update("noteText")} /></label>
        <label>So sánh<textarea rows="3" value={form.comparisonText} onChange={update("comparisonText")} /></label>
        <LevelSelect value={form.levelId} onChange={update("levelId")} />
      </>
    );
  }
  if (type === "exercises") {
    return <ExerciseEditor form={form} update={update} setForm={setForm} />;
  }
  return <ExamEditor form={form} update={update} setForm={setForm} questionBank={questionBank} />;
}

function ExerciseEditor({ form, update, setForm }) {
  const questions = normalizeExerciseQuestions(form.questions);

  const setQuestions = (nextQuestions) => {
    setForm((current) => ({ ...current, questions: nextQuestions }));
  };

  const updateQuestion = (questionIndex, field, value) => {
    setQuestions(questions.map((question, index) => index === questionIndex ? { ...question, [field]: value } : question));
  };

  const addQuestion = () => {
    setQuestions([...questions, emptyExerciseQuestion(questions.length + 1)]);
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, index) => index !== questionIndex).map((question, index) => ({ ...question, questionOrder: index + 1 })));
  };

  const duplicateQuestion = (questionIndex) => {
    const clone = {
      ...questions[questionIndex],
      questionText: `${questions[questionIndex].questionText} (copy)`,
      questionOrder: questions.length + 1,
      choices: questions[questionIndex].choices.map((choice) => ({ ...choice })),
    };
    setQuestions([...questions, clone]);
  };

  const updateChoice = (questionIndex, choiceIndex, field, value) => {
    setQuestions(questions.map((question, index) => {
      if (index !== questionIndex) return question;
      const choices = normalizeExerciseChoices(question.choices).map((choice, innerIndex) => {
        if (innerIndex !== choiceIndex) return field === "isCorrect" && value ? { ...choice, isCorrect: false } : choice;
        return { ...choice, [field]: value };
      });
      return { ...question, choices };
    }));
  };

  const addChoice = (questionIndex) => {
    setQuestions(questions.map((question, index) => {
      if (index !== questionIndex) return question;
      const choices = normalizeExerciseChoices(question.choices);
      return { ...question, choices: [...choices, { choiceText: "", isCorrect: false, choiceOrder: choices.length + 1 }] };
    }));
  };

  const removeChoice = (questionIndex, choiceIndex) => {
    setQuestions(questions.map((question, index) => {
      if (index !== questionIndex) return question;
      const choices = normalizeExerciseChoices(question.choices).filter((_, innerIndex) => innerIndex !== choiceIndex);
      return { ...question, choices: normalizeExerciseChoices(choices).map((choice, innerIndex) => ({ ...choice, choiceOrder: innerIndex + 1 })) };
    }));
  };

  return (
    <div className="admin-exercise-editor">
      <section className="admin-form-grid">
        <label>Tên bài tập<input value={form.title} onChange={update("title")} placeholder="Ví dụ: N5 trợ từ cơ bản" /></label>
        <LevelSelect value={form.levelId} onChange={update("levelId")} />
        <label>Loại bài
          <select value={form.exerciseType} onChange={update("exerciseType")}>
            <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
            <option value="FILL_BLANK">FILL_BLANK</option>
            <option value="READING">READING</option>
            <option value="LISTENING">LISTENING</option>
            <option value="KANJI">KANJI</option>
            <option value="VOCABULARY">VOCABULARY</option>
            <option value="GRAMMAR">GRAMMAR</option>
          </select>
        </label>
        <label>Tags<input value={form.tags} onChange={update("tags")} placeholder="N5, trợ từ, bài 1" /></label>
        <label>Lesson / grammar ID<input value={form.grammarLessonId} onChange={update("grammarLessonId")} placeholder="ID bài học liên quan nếu có" /></label>
        <label>Source URL<input value={form.sourceUrl} onChange={update("sourceUrl")} placeholder="Link tài liệu/audio nếu có" /></label>
        <label>Created by<input value={form.createdBy} onChange={update("createdBy")} placeholder="User ID admin nếu cần" /></label>
      </section>
      <label>Mô tả<textarea rows="3" value={form.description} onChange={update("description")} placeholder="Mô tả mục tiêu, phạm vi hoặc hướng dẫn làm bài" /></label>

      <section className="admin-question-editor">
        <div className="admin-card-title">
          <h2>Câu hỏi</h2>
          <button type="button" onClick={addQuestion}>+ Add question</button>
        </div>
        {questions.map((question, questionIndex) => (
          <article className="admin-question-card" key={questionIndex}>
            <div className="admin-question-card-head">
              <strong>{String(questionIndex + 1).padStart(2, "0")}</strong>
              <span>{form.exerciseType} · {normalizeExerciseChoices(question.choices).length} đáp án</span>
              <div className="admin-row-actions">
                <button type="button" onClick={() => duplicateQuestion(questionIndex)}>Copy</button>
                <button className="danger" type="button" onClick={() => removeQuestion(questionIndex)} disabled={questions.length === 1}>Delete</button>
              </div>
            </div>
            <label>Câu hỏi<textarea rows="3" value={question.questionText} onChange={(event) => updateQuestion(questionIndex, "questionText", event.target.value)} /></label>
            <label>Giải thích<textarea rows="2" value={question.explanation} onChange={(event) => updateQuestion(questionIndex, "explanation", event.target.value)} /></label>
            <label>Thứ tự<input type="number" value={question.questionOrder} onChange={(event) => updateQuestion(questionIndex, "questionOrder", event.target.value)} /></label>
            <div className="admin-choice-grid">
              {normalizeExerciseChoices(question.choices).map((choice, choiceIndex) => (
                <div className="admin-choice-row" key={choiceIndex}>
                  <label className="admin-choice-correct">
                    <input type="radio" checked={Boolean(choice.isCorrect)} onChange={() => updateChoice(questionIndex, choiceIndex, "isCorrect", true)} />
                    Đúng
                  </label>
                  <input value={choice.choiceText} onChange={(event) => updateChoice(questionIndex, choiceIndex, "choiceText", event.target.value)} placeholder={`Đáp án ${choiceIndex + 1}`} />
                  <input type="number" value={choice.choiceOrder} onChange={(event) => updateChoice(questionIndex, choiceIndex, "choiceOrder", event.target.value)} />
                  <button type="button" onClick={() => removeChoice(questionIndex, choiceIndex)} disabled={normalizeExerciseChoices(question.choices).length <= 2}>Xóa</button>
                </div>
              ))}
            </div>
            <button className="admin-secondary-button" type="button" onClick={() => addChoice(questionIndex)}>+ Thêm đáp án</button>
          </article>
        ))}
      </section>
    </div>
  );
}

function ExamEditor({ form, update, setForm, questionBank = [] }) {
  const questions = normalizeExamQuestions(form.questions);

  const setQuestions = (nextQuestions) => setForm((current) => ({ ...current, questions: nextQuestions }));
  const updateQuestion = (questionIndex, field, value) => {
    setQuestions(questions.map((question, index) => index === questionIndex ? { ...question, [field]: value } : question));
  };
  const addQuestion = () => setQuestions([...questions, emptyExamQuestion(questions.length + 1)]);
  const removeQuestion = (questionIndex) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, index) => index !== questionIndex).map((question, index) => ({ ...question, questionOrder: index + 1 })));
  };
  const duplicateQuestion = (questionIndex) => {
    const clone = {
      ...questions[questionIndex],
      questionText: `${questions[questionIndex].questionText} (copy)`,
      questionOrder: questions.length + 1,
      choices: questions[questionIndex].choices.map((choice) => ({ ...choice })),
    };
    setQuestions([...questions, clone]);
  };
  const updateChoice = (questionIndex, choiceIndex, field, value) => {
    setQuestions(questions.map((question, index) => {
      if (index !== questionIndex) return question;
      const choices = normalizeExerciseChoices(question.choices).map((choice, innerIndex) => {
        if (innerIndex !== choiceIndex) return field === "isCorrect" && value ? { ...choice, isCorrect: false } : choice;
        return { ...choice, [field]: value };
      });
      return { ...question, choices };
    }));
  };
  const addChoice = (questionIndex) => {
    setQuestions(questions.map((question, index) => {
      if (index !== questionIndex) return question;
      const choices = normalizeExerciseChoices(question.choices);
      return { ...question, choices: [...choices, { choiceText: "", isCorrect: false, choiceOrder: choices.length + 1 }] };
    }));
  };
  const removeChoice = (questionIndex, choiceIndex) => {
    setQuestions(questions.map((question, index) => {
      if (index !== questionIndex) return question;
      const choices = normalizeExerciseChoices(question.choices).filter((_, innerIndex) => innerIndex !== choiceIndex);
      return { ...question, choices: normalizeExerciseChoices(choices).map((choice, innerIndex) => ({ ...choice, choiceOrder: innerIndex + 1 })) };
    }));
  };
  const uploadExamFile = async (file, onUrl) => {
    if (!file) return;
    const data = await adminApi.uploadFile(file, `jlpt-${form.folderSlug || "n5"}`);
    onUrl(data.url);
  };
  const addFromQuestionBank = (question) => {
    setQuestions([
      ...questions,
      {
        ...emptyExamQuestion(questions.length + 1),
        sectionType: "LANGUAGE_KNOWLEDGE",
        mondai: "Mondai 1",
        questionText: question.questionText ?? "",
        explanation: question.explanation ?? "",
        choices: stripIds(question.choices ?? []),
      },
    ]);
  };

  return (
    <div className="admin-exercise-editor">
      <section className="admin-form-grid">
        <label>Tên đề<input value={form.title} onChange={update("title")} placeholder="Đề thi JLPT N5 tháng 7 năm 2024" /></label>
        <LevelSelect value={form.levelId} onChange={(event) => {
          update("levelId")(event);
          setForm((current) => ({ ...current, folderSlug: `n${6 - Number(event.target.value)}` }));
        }} />
        <label>Thư mục
          <select value={form.folderSlug} onChange={update("folderSlug")}>
            {["n5", "n4", "n3", "n2", "n1"].map((level) => <option key={level} value={level}>{level.toUpperCase()}</option>)}
          </select>
        </label>
        <label>Thời gian<input type="number" value={form.durationMinutes} onChange={update("durationMinutes")} /></label>
        <label>Tags<input value={form.tags} onChange={update("tags")} placeholder="JLPT, N5, 2024-07" /></label>
        <label>File nghe toàn đề
          <div className="admin-upload-row">
            <input value={form.audioUrl} onChange={update("audioUrl")} placeholder="/uploads/jlpt-n5/..." />
            <input type="file" accept="audio/*" onChange={(event) => uploadExamFile(event.target.files?.[0], (url) => setForm((current) => ({ ...current, audioUrl: url })))} />
          </div>
        </label>
      </section>
      <label>Mô tả<textarea rows="3" value={form.description} onChange={update("description")} /></label>

      {form.audioUrl ? <audio className="admin-audio-preview" src={form.audioUrl} controls /> : null}

      <section className="admin-question-bank">
        <strong>Chọn nhanh câu hỏi từ bài tập hiện có</strong>
        {questionBank.slice(0, 20).map((question, index) => (
          <button type="button" key={`${question.id ?? index}-${question.questionText}`} onClick={() => addFromQuestionBank(question)}>
            + {question.questionText}
          </button>
        ))}
        {!questionBank.length ? <small>Chưa có câu hỏi bài tập để chọn nhanh.</small> : null}
      </section>

      <section className="admin-question-editor">
        <div className="admin-card-title">
          <h2>Mondai / Câu hỏi</h2>
          <button type="button" onClick={addQuestion}>+ Add question</button>
        </div>
        {questions.map((question, questionIndex) => (
          <article className="admin-question-card" key={questionIndex}>
            <div className="admin-question-card-head">
              <strong>{String(questionIndex + 1).padStart(2, "0")}</strong>
              <span>{question.sectionType} · {question.mondai || "Chưa có mondai"}</span>
              <div className="admin-row-actions">
                <button type="button" onClick={() => duplicateQuestion(questionIndex)}>Copy</button>
                <button className="danger" type="button" onClick={() => removeQuestion(questionIndex)} disabled={questions.length === 1}>Delete</button>
              </div>
            </div>

            <section className="admin-form-grid">
              <label>Phần thi
                <select value={question.sectionType} onChange={(event) => updateQuestion(questionIndex, "sectionType", event.target.value)}>
                  <option value="LANGUAGE_KNOWLEDGE">Từ vựng / Ngữ pháp</option>
                  <option value="READING">Đọc hiểu</option>
                  <option value="LISTENING">Nghe hiểu</option>
                </select>
              </label>
              <label>Mondai<input value={question.mondai} onChange={(event) => updateQuestion(questionIndex, "mondai", event.target.value)} placeholder="Mondai 1" /></label>
              <label>Loại câu hỏi<input value={question.questionType} onChange={(event) => updateQuestion(questionIndex, "questionType", event.target.value)} /></label>
              <label>Thứ tự<input type="number" value={question.questionOrder} onChange={(event) => updateQuestion(questionIndex, "questionOrder", event.target.value)} /></label>
              <label>Audio start/sec<input type="number" value={question.audioStartSec} onChange={(event) => updateQuestion(questionIndex, "audioStartSec", event.target.value)} /></label>
              <label>Audio end/sec<input type="number" value={question.audioEndSec} onChange={(event) => updateQuestion(questionIndex, "audioEndSec", event.target.value)} /></label>
            </section>

            <label>Câu hỏi<textarea rows="3" value={question.questionText} onChange={(event) => updateQuestion(questionIndex, "questionText", event.target.value)} /></label>
            <section className="admin-form-grid">
              <label>Ảnh câu hỏi
                <div className="admin-upload-row">
                  <input value={question.imageUrl} onChange={(event) => updateQuestion(questionIndex, "imageUrl", event.target.value)} />
                  <input type="file" accept="image/*" onChange={(event) => uploadExamFile(event.target.files?.[0], (url) => updateQuestion(questionIndex, "imageUrl", url))} />
                </div>
              </label>
              <label>Ảnh bài đọc / đoạn đọc
                <div className="admin-upload-row">
                  <input value={question.passageImageUrl} onChange={(event) => updateQuestion(questionIndex, "passageImageUrl", event.target.value)} />
                  <input type="file" accept="image/*" onChange={(event) => uploadExamFile(event.target.files?.[0], (url) => updateQuestion(questionIndex, "passageImageUrl", url))} />
                </div>
              </label>
            </section>
            <div className="admin-media-preview-row">
              {question.imageUrl ? <img src={question.imageUrl} alt="Ảnh câu hỏi" /> : null}
              {question.passageImageUrl ? <img src={question.passageImageUrl} alt="Ảnh bài đọc" /> : null}
            </div>
            <label>Giải thích<textarea rows="2" value={question.explanation} onChange={(event) => updateQuestion(questionIndex, "explanation", event.target.value)} /></label>

            <div className="admin-choice-grid">
              {normalizeExerciseChoices(question.choices).map((choice, choiceIndex) => (
                <div className="admin-choice-row" key={choiceIndex}>
                  <label className="admin-choice-correct">
                    <input type="radio" checked={Boolean(choice.isCorrect)} onChange={() => updateChoice(questionIndex, choiceIndex, "isCorrect", true)} />
                    Đúng
                  </label>
                  <input value={choice.choiceText} onChange={(event) => updateChoice(questionIndex, choiceIndex, "choiceText", event.target.value)} placeholder={`Đáp án ${choiceIndex + 1}`} />
                  <input type="number" value={choice.choiceOrder} onChange={(event) => updateChoice(questionIndex, choiceIndex, "choiceOrder", event.target.value)} />
                  <button type="button" onClick={() => removeChoice(questionIndex, choiceIndex)} disabled={normalizeExerciseChoices(question.choices).length <= 2}>Xóa</button>
                </div>
              ))}
            </div>
            <button className="admin-secondary-button" type="button" onClick={() => addChoice(questionIndex)}>+ Thêm đáp án</button>
          </article>
        ))}
      </section>
    </div>
  );
}

function LevelSelect({ value, onChange }) {
  return <label>Level<select value={value} onChange={onChange}>{jlptLevels.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>;
}
