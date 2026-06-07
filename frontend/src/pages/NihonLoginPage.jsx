import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";

function isAdminUser(user) {
  return String(user?.role ?? user?.roleName ?? "").toUpperCase().includes("ADMIN");
}

export default function NihonLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await authApi.login(form);
      const nextUser = data.user ?? null;
      login(data.token ?? data, nextUser);
      navigate(isAdminUser(nextUser) ? "/admin" : location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-frame auth-frame--login">
      <div className="auth-container auth-container--login">
        <Link className="auth-back" to="/">
          ← Về trang chủ
        </Link>
        <Link className="auth-logo" to="/">
          NihonPath
        </Link>

        <section className="auth-panel">
          <h1>Đăng nhập</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={update("email")} placeholder="ban@example.com" required />
            </label>
            <label className="auth-field">
              <span>Mật khẩu</span>
              <input type="password" value={form.password} onChange={update("password")} placeholder="••••••••" required />
            </label>

            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>Nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <button className="auth-submit" disabled={loading} type="submit">
              Đăng nhập
            </button>
          </form>

          <div className="auth-divider">
            <span />
            <em>hoặc</em>
            <span />
          </div>

          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
          {message ? <div className="auth-message">{message}</div> : null}
        </section>
      </div>
    </main>
  );
}
