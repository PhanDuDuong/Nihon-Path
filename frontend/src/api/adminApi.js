import { apiRequest } from "./http.js";

const jsonOptions = (method, payload) => ({
  method,
  body: JSON.stringify(payload),
});

const withQuery = (path, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const text = query.toString();
  return text ? `${path}?${text}` : path;
};

export const adminApi = {
  getReports: () => apiRequest("/admin/reports"),
  uploadFile: (file, folder = "exam") => {
    const data = new FormData();
    data.append("file", file);
    data.append("folder", folder);
    return apiRequest("/admin/uploads", { method: "POST", body: data });
  },

  getUsers: () => apiRequest("/admin/users"),
  getRoles: () => apiRequest("/admin/users/roles"),
  createUser: (payload) => apiRequest("/admin/users", jsonOptions("POST", payload)),
  updateUser: (id, payload) => apiRequest(`/admin/users/${id}`, jsonOptions("PUT", payload)),
  setUserStatus: (id, status) =>
    apiRequest(`/admin/users/${id}/status?${new URLSearchParams({ status })}`, { method: "PUT" }),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: "DELETE" }),

  getVipUsers: () => apiRequest("/admin/vip/users"),
  getVipOrders: () => apiRequest("/admin/vip/orders"),
  extendVip: (userId, days = 30) =>
    apiRequest(`/admin/vip/users/${userId}/extend?${new URLSearchParams({ days })}`, { method: "POST" }),
  cancelVip: (userId) => apiRequest(`/admin/vip/users/${userId}/cancel`, { method: "POST" }),

  getVocabularies: (params = {}) => apiRequest(withQuery("/admin/vocabularies", params)),
  createVocabulary: (payload) => apiRequest("/admin/vocabularies", jsonOptions("POST", payload)),
  updateVocabulary: (id, payload) => apiRequest(`/admin/vocabularies/${id}`, jsonOptions("PUT", payload)),
  deleteVocabulary: (id) => apiRequest(`/admin/vocabularies/${id}`, { method: "DELETE" }),

  getKanjis: (params = {}) => apiRequest(withQuery("/admin/kanjis", params)),
  createKanji: (payload) => apiRequest("/admin/kanjis", jsonOptions("POST", payload)),
  updateKanji: (id, payload) => apiRequest(`/admin/kanjis/${id}`, jsonOptions("PUT", payload)),
  deleteKanji: (id) => apiRequest(`/admin/kanjis/${id}`, { method: "DELETE" }),

  getGrammar: () => apiRequest("/admin/grammar"),
  createGrammar: (payload) => apiRequest("/admin/grammar", jsonOptions("POST", payload)),
  updateGrammar: (id, payload) => apiRequest(`/admin/grammar/${id}`, jsonOptions("PUT", payload)),
  deleteGrammar: (id) => apiRequest(`/admin/grammar/${id}`, { method: "DELETE" }),

  getExercises: () => apiRequest("/admin/exercises"),
  createExercise: (payload) => apiRequest("/admin/exercises", jsonOptions("POST", payload)),
  updateExercise: (id, payload) => apiRequest(`/admin/exercises/${id}`, jsonOptions("PUT", payload)),
  deleteExercise: (id) => apiRequest(`/admin/exercises/${id}`, { method: "DELETE" }),

  getExams: () => apiRequest("/admin/exams"),
  createExam: (payload) => apiRequest("/admin/exams", jsonOptions("POST", payload)),
  updateExam: (id, payload) => apiRequest(`/admin/exams/${id}`, jsonOptions("PUT", payload)),
  deleteExam: (id) => apiRequest(`/admin/exams/${id}`, { method: "DELETE" }),
};
