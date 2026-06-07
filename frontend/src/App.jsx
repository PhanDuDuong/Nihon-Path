import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import NihonLayout from "./layouts/NihonLayout.jsx";
import LoginRequiredModal from "./components/LoginRequiredModal.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AdminContentPage from "./pages/admin/AdminContentPages.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminJlptExamPage from "./pages/admin/AdminJlptExamPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AdminVipPage from "./pages/admin/AdminVipPage.jsx";
import NihonDashboardPage from "./pages/NihonDashboardPage.jsx";
import NihonExamPage from "./pages/NihonExamPage.jsx";
import NihonExercisePage from "./pages/NihonExercisePage.jsx";
import NihonExerciseLessonDetailPage from "./pages/NihonExerciseLessonDetailPage.jsx";
import NihonFlashcardsPage from "./pages/NihonFlashcardsPage.jsx";
import NihonForgotPasswordPage from "./pages/NihonForgotPasswordPage.jsx";
import NihonGrammarDetailPage from "./pages/NihonGrammarDetailPage.jsx";
import NihonGrammarPage from "./pages/NihonGrammarPage.jsx";
import NihonHomePage from "./pages/NihonHomePage.jsx";
import NihonKanjiDetailPage from "./pages/NihonKanjiDetailPage.jsx";
import NihonKanjiPage from "./pages/NihonKanjiPage.jsx";
import NihonLoginPage from "./pages/NihonLoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import NihonProfilePage from "./pages/NihonProfilePage.jsx";
import NihonRegisterPage from "./pages/NihonRegisterPage.jsx";
import NihonResultPage from "./pages/NihonResultPage.jsx";
import NihonVipPage from "./pages/NihonVipPage.jsx";
import NihonVocabularyDetailPage from "./pages/NihonVocabularyDetailPage.jsx";
import NihonVocabularyPage from "./pages/NihonVocabularyPage.jsx";

function normalizeRole(user) {
  return String(user?.role ?? user?.roleName ?? "").toUpperCase();
}

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  if (!isAuthenticated) {
    return (
      <LoginRequiredModal
        onClose={() => navigate("/", { replace: true })}
        message="Bạn cần đăng nhập hoặc đăng ký tài khoản để truy cập dashboard và các chức năng học cá nhân."
      />
    );
  }
  return <Outlet />;
}

function RequireAdmin() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  if (!isAuthenticated) {
    return (
      <LoginRequiredModal
        onClose={() => navigate("/", { replace: true })}
        message="Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi truy cập khu vực này."
      />
    );
  }
  if (!normalizeRole(user).includes("ADMIN")) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function RequireVip() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const role = normalizeRole(user);
  const vipActive = user?.vipExpiresAt && new Date(user.vipExpiresAt).getTime() > Date.now();
  if (!isAuthenticated) {
    return (
      <LoginRequiredModal
        onClose={() => navigate("/", { replace: true })}
        message="Bạn cần đăng nhập hoặc đăng ký tài khoản để truy cập tính năng VIP."
      />
    );
  }
  if (!role.includes("ADMIN") && !role.includes("VIP") && !vipActive) {
    return <Navigate to="/vip" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<NihonLayout />}>
        <Route index element={<NihonHomePage />} />
        <Route path="/login" element={<NihonLoginPage />} />
        <Route path="/register" element={<NihonRegisterPage />} />
        <Route path="/forgot-password" element={<NihonForgotPasswordPage />} />
        <Route path="/vocabularies" element={<NihonVocabularyPage />} />
        <Route path="/vocabularies/:id" element={<NihonVocabularyDetailPage />} />
        <Route path="/kanjis" element={<NihonKanjiPage />} />
        <Route path="/kanjis/:id" element={<NihonKanjiDetailPage />} />
        <Route path="/grammar" element={<NihonGrammarPage />} />
        <Route path="/grammar/:levelSlug" element={<NihonGrammarPage />} />
        <Route path="/grammar/:level/:category/:lessonNo" element={<NihonExerciseLessonDetailPage />} />
        <Route path="/grammar/detail/:id" element={<NihonGrammarDetailPage />} />
        <Route path="/exercises" element={<NihonExercisePage />} />
        <Route path="/flashcards" element={<NihonFlashcardsPage />} />
        <Route path="/exams" element={<NihonExamPage />} />
        <Route path="/vip" element={<NihonVipPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<NihonProfilePage />} />
          <Route path="/results" element={<NihonResultPage />} />
          <Route path="/results/:attemptId" element={<NihonResultPage />} />
          <Route path="/dashboard" element={<NihonDashboardPage />} />
        </Route>
        <Route element={<RequireVip />}>
          <Route path="/vip/ai" element={<NihonVipPage mode="ai" />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="vocabularies" element={<AdminContentPage type="vocabularies" />} />
          <Route path="kanjis" element={<AdminContentPage type="kanjis" />} />
          <Route path="grammar" element={<AdminContentPage type="grammar" />} />
          <Route path="exercises" element={<AdminContentPage type="exercises" />} />
          <Route path="exams" element={<AdminJlptExamPage />} />
          <Route path="vip" element={<AdminVipPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
