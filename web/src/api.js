const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('tianyi_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchPublicInfo() {
  const res = await fetch(`${API_BASE}/api/public/info`);
  return res.json();
}

export async function loginAdmin(username, password) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function fetchCards(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/admin/cards?${qs}`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function generateCards(payload) {
  const res = await fetch(`${API_BASE}/api/admin/cards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function unbindCard(id) {
  const res = await fetch(`${API_BASE}/api/admin/cards/${id}/unbind`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function extendCard(id, days) {
  const res = await fetch(`${API_BASE}/api/admin/cards/${id}/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ days })
  });
  return res.json();
}

export async function deleteCard(id) {
  const res = await fetch(`${API_BASE}/api/admin/cards/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function fetchPackagesAdmin() {
  const res = await fetch(`${API_BASE}/api/admin/packages`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function createPackage(data) {
  const res = await fetch(`${API_BASE}/api/admin/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updatePackage(id, data) {
  const res = await fetch(`${API_BASE}/api/admin/packages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deletePackage(id) {
  const res = await fetch(`${API_BASE}/api/admin/packages/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function fetchSystemConfig() {
  const res = await fetch(`${API_BASE}/api/admin/config`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function saveSystemConfig(configs) {
  const res = await fetch(`${API_BASE}/api/admin/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(configs)
  });
  return res.json();
}

export async function fetchLogs(page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/api/admin/logs?page=${page}&limit=${limit}`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function fetchFeedbacks(page = 1, limit = 20, status = 'ALL') {
  const res = await fetch(`${API_BASE}/api/admin/feedbacks?page=${page}&limit=${limit}&status=${status}`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function updateFeedbackStatus(id, status) {
  const res = await fetch(`${API_BASE}/api/admin/feedbacks/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function deleteFeedback(id) {
  const res = await fetch(`${API_BASE}/api/admin/feedbacks/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function fetchUsers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/admin/users?${qs}`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function updateUserRemark(id, remark) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}/remark`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ remark })
  });
  return res.json();
}

export async function kickUser(id) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}/kick`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function blacklistDevice(hwid, reason) {
  const res = await fetch(`${API_BASE}/api/admin/blacklist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ hwid, reason })
  });
  return res.json();
}

export async function unblockDevice(hwid) {
  const res = await fetch(`${API_BASE}/api/admin/blacklist/${encodeURIComponent(hwid)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

