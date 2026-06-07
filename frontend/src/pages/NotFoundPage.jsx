import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="auth-page">
      <div className="form-card">
        <p className="eyebrow">404</p>
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn này chưa tồn tại trong frontend.</p>
        <Link className="primary-button" to="/">Về trang chủ</Link>
      </div>
    </section>
  );
}
