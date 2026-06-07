import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi.js";

const pageSizes = [10, 20, 50];
const dateText = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "Chưa có");

export default function AdminVipPage() {
  const [vipUsers, setVipUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const load = async () => {
    const [nextUsers, nextOrders] = await Promise.all([adminApi.getVipUsers(), adminApi.getVipOrders()]);
    setVipUsers(nextUsers);
    setOrders(nextOrders);
  };

  useEffect(() => {
    setLoading(true);
    load().catch((err) => setMessage(err.message)).finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return vipUsers.filter((user) => {
      const matchKeyword = !keyword || [user.fullName, user.email].filter(Boolean).some((value) => value.toLowerCase().includes(keyword));
      const matchStatus = !status || (status === "active" ? user.vipActive : !user.vipActive);
      return matchKeyword && matchStatus;
    });
  }, [query, status, vipUsers]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / size));
  const visibleUsers = filteredUsers.slice(page * size, page * size + size);

  const run = async (action, userId) => {
    const text = action === "extend" ? "Cấp/gia hạn VIP 30 ngày?" : "Hủy VIP của user này?";
    if (!window.confirm(text)) return;
    setLoading(true);
    setMessage("");
    try {
      if (action === "extend") await adminApi.extendVip(userId, 30);
      if (action === "cancel") await adminApi.cancelVip(userId);
      await load();
      setMessage("Đã cập nhật VIP.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-heading admin-heading-row">
        <div>
          <span className="admin-kicker">VIP / AI</span>
          <h1>Quản lý VIP</h1>
        </div>
      </section>

      {message ? <div className="admin-message">{message}</div> : null}

      <section className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-card-title"><h2>Danh sách VIP</h2></div>
          <div className="admin-toolbar">
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search user/email..." />
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang VIP</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
          <div className="admin-data-table">
            <table>
              <thead><tr><th>User</th><th>Gói</th><th>Ngày hết hạn</th><th>Trạng thái</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.fullName || "Chưa có tên"}</strong><br />{user.email}</td>
                    <td>VIP 30 ngày</td>
                    <td>{dateText(user.vipExpiresAt)}</td>
                    <td><span className={`admin-status ${user.vipActive ? "active" : "banned"}`}>{user.vipActive ? "active" : "expired"}</span></td>
                    <td><div className="admin-row-actions"><button onClick={() => run("extend", user.id)} type="button">Cấp VIP</button><button className="danger" onClick={() => run("cancel", user.id)} type="button">Hủy</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleUsers.length ? <p className="admin-empty">{loading ? "Đang tải..." : "Không có user phù hợp."}</p> : null}
          </div>
          <div className="admin-pagination">
            <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(0); }}>{pageSizes.map((value) => <option key={value} value={value}>{value} dòng</option>)}</select>
            <button disabled={page === 0} onClick={() => setPage((value) => value - 1)} type="button">Trước</button>
            <span>Trang {page + 1}/{totalPages}</span>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)} type="button">Sau</button>
          </div>
        </section>
      </section>

      <section className="admin-panel">
        <div className="admin-card-title"><h2>100 giao dịch gần nhất</h2><span>{orders.length} đơn</span></div>
        <div className="admin-order-list">
          {orders.map((order) => (
            <article key={order.id}>
              <strong>{order.orderCode}</strong>
              <span>{order.userEmail || `User #${order.userId}`} · {order.status}</span>
              <small>Tạo: {dateText(order.createdAt)} · Thanh toán: {dateText(order.paidAt)}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
