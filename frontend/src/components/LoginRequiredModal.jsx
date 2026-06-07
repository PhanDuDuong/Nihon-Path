import { Link, useLocation } from "react-router-dom";

export default function LoginRequiredModal({
  onClose,
  message = "Bạn cần đăng nhập hoặc đăng ký tài khoản để tiếp tục.",
}) {
  const location = useLocation();

  return (
    <div className="login-required-backdrop" role="presentation" onClick={onClose}>
      <section className="login-required-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="login-required-close" type="button" onClick={onClose} aria-label="Đóng">×</button>
        <span>Yêu cầu tài khoản</span>
        <h2>Bạn chưa đăng nhập</h2>
        <p>{message}</p>
        <div className="login-required-actions">
          <Link className="login-required-ghost" to="/login" state={{ from: location.pathname }}>
            Đăng nhập
          </Link>
          <Link className="login-required-primary" to="/register" state={{ from: location.pathname }}>
            Đăng ký
          </Link>
        </div>
      </section>
    </div>
  );
}
