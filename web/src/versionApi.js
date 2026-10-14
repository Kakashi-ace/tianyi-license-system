const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('tianyi_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('tianyi_admin_token');
    localStorage.removeItem('tianyi_admin_user');
    window.dispatchEvent(new CustomEvent('tianyi_auth_expired'));
  }
  return res.json();
}

export async function fetchVersions() {
  const res = await fetch(`${API_BASE}/api/admin/versions`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export async function publishVersion(payload) {
  const res = await fetch(`${API_BASE}/api/admin/versions/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function toggleVersionActive(id, isActive) {
  const res = await fetch(`${API_BASE}/api/admin/versions/${id}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ is_active: isActive })
  });
  return handleResponse(res);
}

export async function deleteVersion(id) {
  const res = await fetch(`${API_BASE}/api/admin/versions/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}
