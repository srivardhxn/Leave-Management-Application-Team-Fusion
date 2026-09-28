const BASE_URL = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || parsed.error || errorText;
    } catch (e) {
      // Keep plain text
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth & Users
  getUsers: () => fetch(`${BASE_URL}/auth/users`).then(handleResponse),
  login: (userId) =>
    fetch(`${BASE_URL}/auth/login?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse),

  // Leave Requests
  getMyRequests: (userId) =>
    fetch(`${BASE_URL}/leaves/my-requests?userId=${userId}`).then(handleResponse),

  getManagerPending: (managerId) =>
    fetch(`${BASE_URL}/leaves/manager/pending?managerId=${managerId || ''}`).then(handleResponse),

  getHRPending: () => fetch(`${BASE_URL}/leaves/hr/pending`).then(handleResponse),

  getEscalatedRequests: () => fetch(`${BASE_URL}/leaves/hr/escalated`).then(handleResponse),

  getAllRequests: () => fetch(`${BASE_URL}/leaves/all`).then(handleResponse),

  applyLeave: (payload) =>
    fetch(`${BASE_URL}/leaves/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  approveRequest: (id, note = '') =>
    fetch(`${BASE_URL}/leaves/approve/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    }).then(handleResponse),

  rejectRequest: (id, note = '') =>
    fetch(`${BASE_URL}/leaves/reject/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    }).then(handleResponse),

  escalateRequest: (id, note = 'Auto-escalated due to manager timeout.') =>
    fetch(`${BASE_URL}/leaves/escalate/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    }).then(handleResponse),

  triggerEscalationJob: () =>
    fetch(`${BASE_URL}/leaves/trigger-escalation`, {
      method: 'POST',
    }).then(handleResponse),

  checkConflict: (userId, startDate, endDate) =>
    fetch(
      `${BASE_URL}/leaves/conflict-check?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
    ).then(handleResponse),

  getStats: () => fetch(`${BASE_URL}/leaves/stats`).then(handleResponse),

  calculateProRata: (joinDate, year, allowance = 24.0) => {
    let url = `${BASE_URL}/leaves/pro-rata-calculator?joinDate=${joinDate}&allowance=${allowance}`;
    if (year) url += `&year=${year}`;
    return fetch(url).then(handleResponse);
  },
};
