export default function SearchBar({ value, onChange, onSubmit, placeholder }) {
  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      <button className="primary-button" type="submit">
        Tìm kiếm
      </button>
    </form>
  );
}
