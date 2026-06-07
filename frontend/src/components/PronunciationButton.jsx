const JAPANESE_TEXT_PATTERN = /[\u3040-\u30ff\u3400-\u9faf]/;

export function speakJapaneseText({ text, audioUrl, lang = "ja-JP", onError } = {}) {
  const value = String(text ?? "").trim();

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => onError?.("Không phát được audio."));
    return;
  }

  if (!value) {
    onError?.("Chưa có nội dung tiếng Nhật để phát âm.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    onError?.("Trình duyệt chưa hỗ trợ phát âm tự động.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = JAPANESE_TEXT_PATTERN.test(value) ? lang : "ja-JP";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function PronunciationButton({
  text,
  audioUrl,
  label = "Nghe",
  title = "Nghe cách đọc tiếng Nhật",
  className = "",
  onError,
}) {
  const playable = Boolean(audioUrl || String(text ?? "").trim());

  return (
    <button
      type="button"
      className={`pronunciation-button ${className}`.trim()}
      title={title}
      aria-label={title}
      disabled={!playable}
      onClick={(event) => {
        event.stopPropagation();
        speakJapaneseText({ text, audioUrl, onError });
      }}
    >
      <span aria-hidden="true">♪</span>
      {label}
    </button>
  );
}
