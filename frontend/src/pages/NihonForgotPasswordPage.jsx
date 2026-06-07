import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/authApi.js";

export default function NihonForgotPasswordPage() {
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (form.newPassword !== form.confirmPassword) {
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.forgotPassword(form);
      setMessage(data || "Đặt lại mật khẩu thành công.");
      setForm({ email: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-frame auth-frame--forgot">
      <section className="auth-container">
        <Link className="auth-back" to="/login">
          ← Quay lại đăng nhập
        </Link>
        <div className="auth-logo">NihonPath</div>
        <div className="auth-panel">
          <h1>Quên mật khẩu</h1>
          <p className="auth-subtitle">Nhập email và mật khẩu mới để đặt lại tài khoản.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={update("email")} placeholder="ban@example.com" required />
            </label>
            <label className="auth-field">
              <span>Mật khẩu mới</span>
              <input type="password" value={form.newPassword} onChange={update("newPassword")} placeholder="Ít nhất 8 ký tự" minLength={8} required />
            </label>
            <label className="auth-field">
              <span>Xác nhận mật khẩu</span>
              <input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Nhập lại mật khẩu mới" minLength={8} required />
            </label>
            <button className="auth-submit" disabled={loading} type="submit">
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>
          {message ? <div className="auth-message">{message}</div> : null}
          <p className="auth-switch">
            Nhớ mật khẩu rồi? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
