import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  ["Tổng quan", "/admin"],
  ["Users", "/admin/users"],
  ["Vocabulary", "/admin/vocabularies"],
  ["Kanji", "/admin/kanjis"],
  ["Grammar", "/admin/grammar"],
  ["Exercise", "/admin/exercises"],
  ["Exam JLPT", "/admin/exams"],
  ["VIP / AI", "/admin/vip"],
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          <span>NP</span>
          NihonPath Admin
        </Link>
        <nav>
          {links.map(([label, path]) => (
            <NavLink end={path === "/admin"} to={path} key={path}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <strong>Bảng điều khiển quản trị</strong>
          </div>
          <div className="admin-top-actions">
            <span className="admin-user-chip">{user?.fullName || user?.email || "Admin"}</span>
            <Link to="/">Trang học</Link>
            <button onClick={handleLogout} type="button">
              Đăng xuất
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
