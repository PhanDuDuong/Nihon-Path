const modeIcons = {
  all: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5h10.5a3.5 3.5 0 0 1 0 7H9.7l-3.6 4.2a1.1 1.1 0 0 1-1.9-.72V5.5Z" />
      <path d="M13.5 13h.8l3.6 4.2a1.1 1.1 0 0 0 1.9-.72V6.7" />
    </svg>
  ),
  japanese: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h12" />
      <path d="M12 5v14" />
      <path d="M8 9c1.1 2.8 2.4 4.9 4 6.4 1.6-1.5 2.9-3.6 4-6.4" />
    </svg>
  ),
  romaji: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18V6h4.2a3.2 3.2 0 0 1 0 6.4H5" />
      <path d="m10 12.4 4 5.6" />
      <path d="M17 18V6" />
    </svg>
  ),
  vietnamese: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4.5 6 5.2 12L15 6" />
      <path d="M17 8h3" />
      <path d="M18.5 6.5v3" />
    </svg>
  ),
  handwriting: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h4.5L19 9.5a2.8 2.8 0 0 0-4-4L4.5 16 4 20Z" />
      <path d="m13.5 7 3.5 3.5" />
    </svg>
  ),
};

const searchIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Z" />
    <path d="m16 16 4.2 4.2" />
  </svg>
);

const clearIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6 18 18" />
    <path d="M18 6 6 18" />
  </svg>
);

const modes = [
  ["all", "Tất cả"],
  ["japanese", "日本語"],
  ["romaji", "Romaji"],
  ["vietnamese", "Tiếng Việt"],
  ["handwriting", "Viết tay"],
];

export default function DictionarySearchPanel({
  keyword,
  onKeywordChange,
  inputMode,
  onInputModeChange,
  loading,
  onSubmit,
  placeholder,
  helperText,
  suggestions,
  hideSearchExtras = false,
  message,
  children,
}) {
  const trimmedKeyword = keyword.trim();

  return (
    <section className="vocab-search-panel dictionary-search-panel">
      <form className="vocab-search-row dictionary-search-row" onSubmit={onSubmit}>
        <label className="dictionary-search-field">
          <span className="dictionary-search-leading">{searchIcon}</span>
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
          {trimmedKeyword ? (
            <button
              className="dictionary-icon-action dictionary-icon-action--ghost"
              type="button"
              onClick={() => onKeywordChange("")}
              aria-label="Xóa nội dung tìm kiếm"
              title="Xóa"
            >
              {clearIcon}
            </button>
          ) : null}
        </label>
        <button
          className="dictionary-icon-action dictionary-icon-action--primary"
          type="submit"
          disabled={loading || !trimmedKeyword}
          aria-label={loading ? "Đang tìm kiếm" : "Tìm kiếm"}
          title={loading ? "Đang tìm kiếm" : "Tìm kiếm"}
        >
          {loading ? <span className="dictionary-spinner" aria-hidden="true" /> : searchIcon}
        </button>
      </form>

      {!hideSearchExtras ? (
        <>
          <div className="filter-pills search-mode-pills dictionary-mode-pills">
            {modes.map(([mode, label]) => (
              <button
                type="button"
                className={inputMode === mode ? "active" : ""}
                onClick={() => onInputModeChange(mode)}
                key={mode}
              >
                {modeIcons[mode]}
                {label}
              </button>
            ))}
            <span>{helperText}</span>
          </div>

          <div className="dictionary-quick-row">
            {suggestions.map((item) => (
              <button type="button" onClick={() => onKeywordChange(item)} key={item}>
                {item}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {children}
      {message ? <small className="study-note dictionary-message">{message}</small> : null}
    </section>
  );
}
