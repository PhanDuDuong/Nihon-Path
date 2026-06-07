import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi.js";

const detailLinks = [
  ["Users", "/admin/users"],
  ["Vocabulary", "/admin/vocabularies"],
  ["Kanji", "/admin/kanjis"],
];

function valueOf(item) {
  return Number(item?.value ?? item?.VALUE ?? 0);
}

function MiniBars({ title, data = [] }) {
  const max = Math.max(...data.map(valueOf), 1);
  return (
    <section className="admin-panel">
      <div className="admin-card-title">
        <h2>{title}</h2>
      </div>
      <div className="admin-chart">
        {data.map((item, index) => {
          const value = valueOf(item);
          return (
            <div className="admin-chart-bar" key={`${item.label ?? index}`}>
              <span style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
              <small>{String(item.label ?? "").slice(5) || `D${index + 1}`}</small>
              <b>{value}</b>
            </div>
          );
        })}
        {!data.length ? <p className="admin-empty">Chưa có dữ liệu biểu đồ.</p> : null}
      </div>
    </section>
  );
}

function SmallList({ title, rows = [], render }) {
  return (
    <section className="admin-panel">
      <div className="admin-card-title">
        <h2>{title}</h2>
      </div>
      <div className="admin-mini-list">
        {rows.map((row, index) => (
          <article key={row.id ?? index}>{render(row)}</article>
        ))}
        {!rows.length ? <p className="admin-empty">Chưa có dữ liệu.</p> : null}
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getReports()
      .then(setStats)
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  const statCards = useMemo(
    () => [
      ["Tổng user", stats.totalUsers ?? "-"],
      ["Tổng vocab", stats.vocabularyCount ?? "-"],
      ["Tổng kanji", stats.kanjiCount ?? "-"],
      ["Tổng bài học", stats.grammarCount ?? "-"],
      ["Số lượt học hôm nay", stats.studyToday ?? "-"],
    ],
    [stats],
  );

  return (
    <main className="admin-page">
      <section className="admin-heading admin-hero">
        <div>
          <span className="admin-kicker">Dashboard</span>
          <h1>Tổng quan hệ thống</h1>
        </div>
        <div className="admin-hero-actions">
          {detailLinks.map(([label, to]) => (
            <Link className="admin-primary-link" to={to} key={to}>
              Xem chi tiết {label}
            </Link>
          ))}
        </div>
      </section>

      {message ? <div className="admin-message">{message}</div> : null}
      {loading ? <div className="admin-loading">Đang tải dữ liệu...</div> : null}

      <section className="admin-stat-grid">
        {statCards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <MiniBars title="User active theo ngày" data={stats.activeUsersByDay} />
        <MiniBars title="Số từ được học" data={stats.wordsStudiedByDay} />
        <SmallList
          title="User mới"
          rows={stats.newUsers}
          render={(user) => (
            <>
              <strong>{user.fullName || user.FULLNAME || "Chưa có tên"}</strong>
              <span>{user.email || user.EMAIL}</span>
            </>
          )}
        />
        <SmallList
          title="Bài học mới thêm"
          rows={stats.newLessons}
          render={(lesson) => (
            <>
              <strong>{lesson.title || lesson.TITLE}</strong>
              <span>Level ID {lesson.levelId ?? lesson.LEVELID ?? "-"}</span>
            </>
          )}
        />
      </section>
    </main>
  );
}
