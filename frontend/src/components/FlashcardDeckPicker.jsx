import { useEffect, useState } from "react";
import { learningApi } from "../api/learningApi.js";

const emptyDeck = {
  title: "",
  description: "",
  coverColor: "#3971b8",
  levelId: 1,
  isPublic: false,
};

export default function FlashcardDeckPicker({ vocabulary, open, onClose }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyDeck);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const vocabularyId = vocabulary?.id;

  const load = async () => {
    if (!vocabularyId) return;
    setLoading(true);
    setMessage("");
    try {
      setData(await learningApi.getSelectableFlashcardDecks(vocabularyId));
    } catch (err) {
      setMessage(err.message || "Bạn cần đăng nhập để thêm flashcard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open, vocabularyId]);

  if (!open) return null;

  const toggleDeck = async (deck) => {
    setMessage("");
    try {
      if (deck.selected) {
        await learningApi.removeVocabularyFromDeck(deck.id, vocabularyId);
      } else {
        await learningApi.addVocabularyToDeck(deck.id, vocabularyId);
      }
      await load();
    } catch (err) {
      setMessage(err.message || "Chưa cập nhật được deck.");
    }
  };

  const createDeck = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await learningApi.createFlashcardDeck({ ...form, levelId: Number(form.levelId) });
      setForm(emptyDeck);
      setCreating(false);
      await load();
    } catch (err) {
      setMessage(err.message || "Chưa tạo được deck.");
    }
  };

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: field === "isPublic" ? event.target.checked : event.target.value }));

  return (
    <div className="deck-picker-backdrop" role="presentation" onClick={onClose}>
      <section className="deck-picker" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>Thêm vào flashcard</span>
            <h2>{vocabulary?.kanji || vocabulary?.word || data?.vocabularyText}</h2>
          </div>
          <button type="button" onClick={onClose}>Đóng</button>
        </header>

        {message ? <p className="deck-picker-message">{message}</p> : null}

        <div className="deck-picker-list">
          {loading ? <span>Đang tải deck...</span> : null}
          {(data?.decks ?? []).map((deck) => (
            <button className={deck.selected ? "selected" : ""} type="button" onClick={() => toggleDeck(deck)} key={deck.id}>
              <span>
                <strong>{deck.title}</strong>
                <small>{deck.cardCount ?? 0} thẻ · {deck.isPublic ? "Công khai" : "Riêng tư"}</small>
              </span>
              <b>{deck.selected ? "✓" : "+"}</b>
            </button>
          ))}
          {!loading && (data?.decks ?? []).length === 0 ? (
            <small>Bạn chưa có bộ flashcard cá nhân. Nhấn dấu cộng để tạo mới.</small>
          ) : null}
        </div>

        {creating ? (
          <form className="deck-picker-form" onSubmit={createDeck}>
            <label>
              Tên bộ
              <input value={form.title} onChange={update("title")} placeholder="Ví dụ: Từ N5 cần ôn" required />
            </label>
            <label>
              Mô tả
              <input value={form.description} onChange={update("description")} placeholder="Ghi chú ngắn" />
            </label>
            <label>
              Cấp độ
              <select value={form.levelId} onChange={update("levelId")}>
                {[1, 2, 3, 4, 5].map((level) => <option value={level} key={level}>N{6 - level}</option>)}
              </select>
            </label>
            <label className="deck-picker-check">
              <input type="checkbox" checked={form.isPublic} onChange={update("isPublic")} />
              Công khai bộ này
            </label>
            <button type="submit">Tạo bộ flashcard</button>
          </form>
        ) : (
          <button className="deck-picker-create" type="button" onClick={() => setCreating(true)}>
            + Tạo bộ mới
          </button>
        )}
      </section>
    </div>
  );
}
