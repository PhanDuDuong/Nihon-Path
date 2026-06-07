export default function DataState({ loading, error, empty, children }) {
  if (loading) {
    return <div className="state-box">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="state-box error">{error}</div>;
  }

  if (empty) {
    return <div className="state-box">Chưa có dữ liệu phù hợp.</div>;
  }

  return children;
}
