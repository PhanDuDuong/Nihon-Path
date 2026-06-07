import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const publicNavLinks = [
  ["Từ vựng", "/vocabularies"],
  ["Kanji", "/kanjis"],
  ["Bài học", "/grammar"],
  ["Bài tập", "/exercises"],
  ["Flashcard", "/flashcards"],
  ["JLPT", "/exams"],
  ["VIP", "/vip"],
];

const userNavLinks = [
  ["Dashboard", "/dashboard"],
  ["Hồ sơ", "/profile"],
];

const authOnlyPaths = new Set(["/login", "/register", "/forgot-password"]);

export default function NihonLayout() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  if (authOnlyPaths.has(pathname)) {
    return <Outlet />;
  }

  return (
    <div className="study-frame">
      <aside className="study-sidebar">
        <NavLink className="study-logo" to="/">
          NihonPath
        </NavLink>
        <nav>
          {publicNavLinks.map(([label, path]) => (
            <NavLink key={path} to={path}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated
            ? userNavLinks.map(([label, path]) => (
                <NavLink key={path} to={path}>
                  {label}
                </NavLink>
              ))
            : null}
        </nav>

        {!isAuthenticated ? (
          <div className="study-sidebar-auth" aria-label="Tài khoản">
            <NavLink className="study-auth-button study-auth-button--ghost" to="/login">
              Đăng nhập
            </NavLink>
            <NavLink className="study-auth-button study-auth-button--primary" to="/register">
              Đăng ký
            </NavLink>
          </div>
        ) : null}
      </aside>

      <div className="study-content">
        <Outlet />
      </div>
    </div>
  );
}
