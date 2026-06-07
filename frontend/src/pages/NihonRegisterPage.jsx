import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/authApi.js";

export default function NihonRegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      setMessage(data || "Đăng ký thành công");
      setForm({ fullName: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-frame auth-frame--register">
      <div className="auth-container auth-container--register">
        <Link className="auth-back" to="/">
          ← Về trang chủ
        </Link>
        <Link className="auth-logo" to="/">
          NihonPath
        </Link>

        <section className="auth-panel register-panel">
          <h1>Tạo tài khoản</h1>
          <p className="auth-subtitle">Bắt đầu hành trình học tiếng Nhật của bạn</p>

          <form className="auth-form register-form" onSubmit={handleSubmit}>
            <label className="auth-field full">
              <span>Họ và tên</span>
              <input value={form.fullName} onChange={update("fullName")} placeholder="Nguyễn Văn A" required />
            </label>
            <label className="auth-field full">
              <span>Email</span>
              <input type="email" value={form.email} onChange={update("email")} placeholder="ban@example.com" required />
            </label>
            <label className="auth-field">
              <span>Mật khẩu</span>
              <input type="password" value={form.password} onChange={update("password")} placeholder="Ít nhất 8 ký tự" minLength={8} required />
            </label>
            <label className="auth-field">
              <span>Xác nhận mật khẩu</span>
              <input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Nhập lại mật khẩu" minLength={8} required />
            </label>
            <button className="auth-submit full" disabled={loading} type="submit">
              Đăng ký tài khoản
            </button>
          </form>

          <p className="auth-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
          {message ? <div className="auth-message">{message}</div> : null}
        </section>
      </div>
    </main>
  );
}
