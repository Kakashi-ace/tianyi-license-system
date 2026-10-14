const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('tianyi_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchVersions() {
  const res = await fetch(`${API_BASE}/api/admin/versions`, {
    headers: { ...getAuthHeader() }
  });
  return res.json();
}

export async function publishVersion(payload) {
  const res = await fetch(`${API_BASE}/api/admin/versions/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function toggleVersionActive(id, isActive) {
  const res = await fetch(`${API_BASE}/api/admin/versions/${id}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ is_active: isActive })
  });
  return res.json();
}

export async function deleteVersion(id) {
  const res = await fetch(`${API_BASE}/api/admin/versions/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return res.json();
}
