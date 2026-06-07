import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi.js";

const emptyUser = { id: "", fullName: "", email: "", password: "", roleId: "", status: "ACTIVE", isVerified: true };
const pageSizes = [10, 20, 50];

function roleName(user) {
  return user.role?.name ?? "USER";
}

function statusLabel(status) {
  return String(status).toUpperCase() === "LOCKED" ? "banned" : "active";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const load = async () => {
    const [nextUsers, nextRoles] = await Promise.all([adminApi.getUsers(), adminApi.getRoles()]);
    setUsers(nextUsers);
    setRoles(nextRoles);
  };

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(timer);
  }, [query, roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users.filter((item) => {
      const matchKeyword =
        !keyword ||
        [item.fullName, item.email].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
      const matchRole = !roleFilter || roleName(item).toUpperCase() === roleFilter;
      const matchStatus = !statusFilter || statusLabel(item.status) === statusFilter;
      return matchKeyword && matchRole && matchStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / size));
  const visibleUsers = filteredUsers.slice(page * size, page * size + size);

  const update = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setForm(emptyUser);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setForm({
      id: user.id,
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      password: "",
      roleId: user.role?.id ?? "",
      status: user.status ?? "ACTIVE",
      isVerified: user.isVerified ?? true,
    });
    setModalOpen(true);
  };

  const payload = () => ({
    fullName: form.fullName,
    email: form.email,
    password: form.password,
    roleId: form.roleId ? Number(form.roleId) : null,
    status: form.status,
    isVerified: Boolean(form.isVerified),
  });

  const save = async () => {
    setMessage("");
    setLoading(true);
    try {
      if (form.id) await adminApi.updateUser(form.id, payload());
      else await adminApi.createUser(payload());
      await load();
      setModalOpen(false);
      setMessage("Đã lưu thông tin user.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Xóa user ${user.email}?`)) return;
    setLoading(true);
    try {
      await adminApi.deleteUser(user.id);
      await load();
      setMessage("Đã xóa user.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (user) => {
    const nextStatus = statusLabel(user.status) === "banned" ? "ACTIVE" : "LOCKED";
    setLoading(true);
    try {
      await adminApi.setUserStatus(user.id, nextStatus);
      await load();
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
          <span className="admin-kicker">Users</span>
          <h1>Quản lý người dùng</h1>
        </div>
        <button className="admin-primary-button" type="button" onClick={openCreate}>
          + Thêm user
        </button>
      </section>

      {message ? <div className="admin-message">{message}</div> : null}

      <section className="admin-panel">
        <div className="admin-toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email hoặc tên..." />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">Tất cả role</option>
            {roles.map((role) => (
              <option value={role.name.toUpperCase()} key={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">active</option>
            <option value="banned">banned</option>
          </select>
        </div>

        <div className="admin-data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Tên</th>
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.fullName || "-"}</td>
                  <td>{roleName(user).toLowerCase()}</td>
                  <td><span className={`admin-status ${statusLabel(user.status)}`}>{statusLabel(user.status)}</span></td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => openEdit(user)}>Edit</button>
                      <button type="button" onClick={() => toggleBan(user)}>{statusLabel(user.status) === "banned" ? "Unban" : "Ban"}</button>
                      <button className="danger" type="button" onClick={() => remove(user)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleUsers.length ? <p className="admin-empty">{loading ? "Đang tải..." : "Không có user phù hợp."}</p> : null}
        </div>

        <div className="admin-pagination">
          <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(0); }}>
            {pageSizes.map((value) => <option key={value} value={value}>{value} dòng</option>)}
          </select>
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Trước</button>
          <span>Trang {page + 1}/{totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button>
        </div>
      </section>

      {modalOpen ? (
        <div className="admin-modal-backdrop">
          <form className="admin-modal" onSubmit={(event) => { event.preventDefault(); save(); }}>
            <div className="admin-card-title">
              <h2>{form.id ? `Sửa user #${form.id}` : "Thêm user"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}>Đóng</button>
            </div>
            <label>Email<input type="email" value={form.email} onChange={update("email")} required /></label>
            <label>Tên<input value={form.fullName} onChange={update("fullName")} /></label>
            <label>Password<input type="password" value={form.password} onChange={update("password")} placeholder={form.id ? "Bỏ trống nếu không đổi" : "Bắt buộc khi tạo"} /></label>
            <label>Role
              <select value={form.roleId} onChange={update("roleId")} required>
                <option value="">Chọn role</option>
                {roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
              </select>
            </label>
            <label>Trạng thái
              <select value={form.status} onChange={update("status")}>
                <option value="ACTIVE">active</option>
                <option value="LOCKED">banned</option>
              </select>
            </label>
            <div className="admin-actions">
              <button disabled={loading} type="submit">Save</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
