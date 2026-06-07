import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi.js";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const emptyErrors = {
  fullName: "",
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  form: "",
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapProfileError(message) {
  const text = String(message || "Không thể cập nhật hồ sơ.");
  const lower = text.toLowerCase();
  if (lower.includes("email")) return { ...emptyErrors, email: text };
  if (lower.includes("hiện tại")) return { ...emptyErrors, currentPassword: text };
  if (lower.includes("ít nhất") || lower.includes("8")) return { ...emptyErrors, newPassword: text };
  if (lower.includes("xác nhận") || lower.includes("khớp")) return { ...emptyErrors, confirmPassword: text };
  return { ...emptyErrors, form: text };
}

export default function NihonProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({ fullName: user?.fullName ?? "", email: user?.email ?? "" });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    const source = profile?.fullName || profile?.email || "User";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    let mounted = true;
    setLoading(true);
    authApi
      .me()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm({ fullName: data.fullName ?? "", email: data.email ?? "" });
        updateUser(data);
      })
      .catch((err) => {
        if (mounted) setErrors(mapProfileError(err.message));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, navigate, updateUser]);

  const clearFieldError = (field) => {
    setErrors((current) => ({ ...current, [field]: "", form: "" }));
    setMessage("");
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    clearFieldError(field);
  };

  const updatePassword = (field) => (event) => {
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    clearFieldError(field);
  };

  const validateForm = () => {
    const nextErrors = { ...emptyErrors };
    const wantsPasswordChange = Boolean(passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword);

    if (!form.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ và tên.";
    if (!form.email.trim()) nextErrors.email = "Vui lòng nhập email.";
    else if (!validateEmail(form.email.trim())) nextErrors.email = "Email không đúng định dạng.";

    if (wantsPasswordChange) {
      if (!passwordForm.currentPassword) nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
      if (!passwordForm.newPassword) nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
      else if (passwordForm.newPassword.length < 8) nextErrors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự.";
      if (!passwordForm.confirmPassword) nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
      else if (passwordForm.newPassword !== passwordForm.confirmPassword) nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        ...(passwordForm.newPassword ? passwordForm : {}),
      };
      const data = await authApi.updateProfile(payload);
      setProfile(data);
      updateUser(data, data.token);
      setPasswordForm(emptyPasswordForm);
      setMessage("Cập nhật hồ sơ thành công.");
      setErrors(emptyErrors);
    } catch (err) {
      setErrors(mapProfileError(err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // JWT logout is client-side; the API call is best-effort for a consistent flow.
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <StudyShell active="Hồ sơ" title="Hồ sơ cá nhân" topLink={{ label: "← Dashboard", to: "/dashboard" }}>
      <main className="study-main profile-main">
        <aside className="profile-card">
          <div className="profile-avatar">{initials || "U"}</div>
          <h1>{profile?.fullName || "Tài khoản USER"}</h1>
          <p>{profile?.email || "Chưa có email"}</p>
          <div className="profile-badges">
            <span>{profile?.role || "USER"}</span>
            <span>{profile?.status || "ACTIVE"}</span>
          </div>
          <button type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </aside>

        <section className="profile-detail-panel">
          <div className="profile-tabs">
            <button className="active" type="button">Thông tin cá nhân</button>
          </div>

          {loading ? <div className="auth-message">Đang tải hồ sơ...</div> : null}

          <form className="auth-form profile-edit-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>Họ và tên</span>
              <input value={form.fullName} onChange={update("fullName")} placeholder="Nguyễn Văn A" aria-invalid={Boolean(errors.fullName)} />
              {errors.fullName ? <em className="field-error">{errors.fullName}</em> : null}
            </label>

            <label className="auth-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={update("email")} placeholder="ban@example.com" aria-invalid={Boolean(errors.email)} />
              {errors.email ? <em className="field-error">{errors.email}</em> : null}
            </label>

            <div className="profile-section">
              <h3>Đổi mật khẩu</h3>
              <p className="demo-note">Bỏ trống các ô mật khẩu nếu chỉ muốn cập nhật thông tin cá nhân.</p>
            </div>

            <label className="auth-field">
              <span>Mật khẩu hiện tại</span>
              <input type="password" value={passwordForm.currentPassword} onChange={updatePassword("currentPassword")} placeholder="Nhập mật khẩu hiện tại" aria-invalid={Boolean(errors.currentPassword)} />
              {errors.currentPassword ? <em className="field-error">{errors.currentPassword}</em> : null}
            </label>

            <label className="auth-field">
              <span>Mật khẩu mới</span>
              <input type="password" value={passwordForm.newPassword} onChange={updatePassword("newPassword")} placeholder="Ít nhất 8 ký tự" aria-invalid={Boolean(errors.newPassword)} />
              {errors.newPassword ? <em className="field-error">{errors.newPassword}</em> : null}
            </label>

            <label className="auth-field">
              <span>Xác nhận mật khẩu mới</span>
              <input type="password" value={passwordForm.confirmPassword} onChange={updatePassword("confirmPassword")} placeholder="Nhập lại mật khẩu mới" aria-invalid={Boolean(errors.confirmPassword)} />
              {errors.confirmPassword ? <em className="field-error">{errors.confirmPassword}</em> : null}
            </label>

            <button className="auth-submit" disabled={saving} type="submit">
              {saving ? "Đang lưu..." : "Cập nhật hồ sơ"}
            </button>
            {errors.form ? <em className="field-error field-error--form">{errors.form}</em> : null}
            {message ? <div className="profile-success-message">{message}</div> : null}
          </form>
        </section>
      </main>
    </StudyShell>
  );
}
