import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { exerciseCategories, jlptLevels } from "../data/exerciseLessonCatalog.js";
import { loadCompletedLessons } from "../utils/lessonProgress.js";

const jlptCards = [
  ["N5", "Dành cho người mới bắt đầu, tập trung từ vựng cơ bản, mẫu câu ngắn và chữ kanji nền tảng.", "42 bài học", "18 bộ bài tập", "12 đề luyện"],
  ["N4", "Mở rộng cấu trúc câu, phản xạ nghe đọc tốt hơn và tăng vốn từ sử dụng hằng ngày.", "55 bài học", "22 bộ bài tập", "15 đề luyện"],
  ["N3", "Tăng chiều sâu bài học, vốn từ học thuật cơ bản và kỹ năng đọc đoạn dài hơn.", "63 bài học", "28 bộ bài tập", "18 đề luyện"],
  ["N2", "Học sâu hơn về cách dùng sắc thái, phân biệt mẫu tương tự và đọc hiểu chuyên sâu.", "70 bài học", "34 bộ bài tập", "20 đề luyện"],
  ["N1", "Chinh phục nội dung nâng cao với bài đọc khó, bài học chuyên sâu và chiến lược làm đề.", "84 bài học", "40 bộ bài tập", "24 đề luyện"],
];

const suggestions = [
  ["Bắt đầu dễ nhất", "Học 20 từ vựng N5 đầu tiên", "Nhóm chủ đề chào hỏi, trường học, gia đình và sinh hoạt hằng ngày.", "/vocabularies", "Mở danh sách", true],
  ["Bài học", "Mẫu câu です / ます", "Nắm cấu trúc lịch sự căn bản trước khi chuyển sang hội thoại dài hơn.", "/grammar/n5", "Xem bài học", false],
  ["Luyện tập", "Mini quiz N5", "Bài tập ngắn giúp bạn kiểm tra nhanh mức ghi nhớ sau khi học lý thuyết.", "/exercises", "Làm bài ngay", false],
];

const guestStats = {
  totalVocab: 124,
  totalKanji: 38,
  totalExercise: 16,
  lessonProgress: "24%",
};

function progressText(completed, total) {
  if (!total) return "0%";
  return `${Math.round((completed / total) * 100)}%`;
}

export default function NihonHomePage() {
  const { isAuthenticated, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const totalCatalogLessons = jlptLevels.length * exerciseCategories.length * 25;

  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated) {
      setDashboard(null);
      setDashboardLoading(false);
      return undefined;
    }

    setDashboard(null);
    setDashboardLoading(true);
    learningApi.getDashboard()
      .then((data) => {
        if (!ignore) setDashboard(data);
      })
      .catch(() => {
        if (!ignore) setDashboard(null);
      })
      .finally(() => {
        if (!ignore) setDashboardLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const syncCompletedLessons = () => setCompletedLessons(isAuthenticated ? loadCompletedLessons(user) : []);
    syncCompletedLessons();
    window.addEventListener("focus", syncCompletedLessons);
    window.addEventListener("nihonpath:lesson-progress", syncCompletedLessons);
    return () => {
      window.removeEventListener("focus", syncCompletedLessons);
      window.removeEventListener("nihonpath:lesson-progress", syncCompletedLessons);
    };
  }, [isAuthenticated, user]);

  const stats = useMemo(() => {
    const source = isAuthenticated ? dashboard : guestStats;
    const pending = isAuthenticated && dashboardLoading && !dashboard;
    const lessonProgress = isAuthenticated
      ? progressText(completedLessons.length, totalCatalogLessons)
      : guestStats.lessonProgress;
    return [
      [pending ? "..." : (source?.totalVocab ?? 0), "T\u1eeb \u0111\u00e3 l\u01b0u"],
      [pending ? "..." : (source?.totalKanji ?? 0), "Kanji"],
      [pending ? "..." : (source?.totalExercise ?? 0), "B\u00e0i t\u1eadp"],
      [lessonProgress, "Ti\u1ebfn \u0111\u1ed9 b\u00e0i h\u1ecdc"],
    ];
  }, [completedLessons.length, dashboard, dashboardLoading, isAuthenticated, totalCatalogLessons]);

  return (
    <div className="home-frame">
      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <span className="nihon-pill">Nền tảng học tiếng Nhật hiện đại</span>
            <h1>Học tiếng Nhật rõ lộ trình, dễ tra cứu, dễ duy trì tiến độ</h1>
            <p>Tra từ vựng, học kanji, đọc bài học, luyện bài tập và theo dõi tiến độ trong một giao diện sáng sủa, nhẹ mắt và tập trung vào việc học lâu dài.</p>
            <div className="home-actions">
              <Link className="nihon-button nihon-button--primary" to="/grammar">Bắt đầu học</Link>
              <Link className="nihon-button nihon-button--green" to="/vocabularies">Tra cứu ngay</Link>
            </div>
          </div>

          <div className="dashboard-mock">
            <div className="dashboard-panel">
              <div className="dashboard-panel__top">
                <strong>Dashboard học tập</strong>
                <span />
              </div>
              <div className="mock-stats">
                {stats.map(([value, label]) => (
                  <article key={label}>
                    <b>{value}</b>
                    <small>{label}</small>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-copy">
          <h2>Học theo cấp độ JLPT</h2>
          <p>Bắt đầu từ N5 và tiến dần tới N1 bằng lộ trình nội dung rõ ràng.</p>
        </div>
        <div className="jlpt-grid">
          {jlptCards.map(([level, text, grammar, practice, exams]) => (
            <article className="jlpt-card" key={level}>
              <span className="nihon-pill">JLPT {level}</span>
              <h3>{level}</h3>
              <p>{text}</p>
              <ul>
                <li>• {grammar}</li>
                <li>• {practice}</li>
                <li>• {exams}</li>
              </ul>
              <Link to={`/grammar/${level.toLowerCase()}`}>Xem nội dung</Link>
              <i />
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-copy">
          <h2>Gợi ý nội dung cho người mới bắt đầu</h2>
          <p>Một vài khu vực học được truy cập nhiều nhất để bạn bắt đầu ngay.</p>
        </div>
        <div className="suggestion-grid">
          {suggestions.map(([tag, title, text, path, action, primary]) => (
            <article className={primary ? "suggestion-card suggestion-card--highlight" : "suggestion-card"} key={title}>
              <span className="nihon-pill">{tag}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link className={primary ? "nihon-button nihon-button--primary" : "nihon-button nihon-button--ghost"} to={path}>{action}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="vip-banner">
        <div className="vip-copy">
          <span className="nihon-pill">Gói VIP</span>
          <h2>Nâng cấp để học sâu hơn và theo dõi chi tiết hơn</h2>
          <p>Dành cho người học muốn dùng AI hỗ trợ tiếng Nhật, luyện đề JLPT VIP và mở khóa nội dung học tập nâng cao.</p>
          <div className="vip-list">
            <span>Chatbot AI VIP hỗ trợ hỏi đáp tiếng Nhật, JLPT, dịch câu, sửa ngữ pháp và cách dùng NihonPath</span>
            <span>Mở khóa toàn bộ đề thi JLPT VIP để luyện thi không giới hạn trong thời gian gói còn hiệu lực</span>
          </div>
        </div>
        <aside className="vip-price">
          <span className="nihon-pill">Ưu đãi học tập</span>
          <p><strong>199K</strong> / tháng</p>
          <small>Mở khóa Chatbot AI VIP, đề thi JLPT VIP và nội dung luyện thi nâng cao.</small>
          <Link className="nihon-button nihon-button--primary" to="/vip">Nâng cấp VIP</Link>
        </aside>
      </section>
    </div>
  );
}
