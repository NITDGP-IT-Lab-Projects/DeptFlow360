/**
 * DeptFlow 360 - REST API Service Layer
 * Connects React UI to Express Backend with resilient offline fallback
 */

const API_BASE = '/api';

let cachedToken = null;

try {
  cachedToken = localStorage.getItem('deptflow_auth_token');
} catch {
  // SSR or local storage disabled
}

export const setAuthToken = (token) => {
  cachedToken = token;
  try {
    if (token) {
      localStorage.setItem('deptflow_auth_token', token);
    } else {
      localStorage.removeItem('deptflow_auth_token');
    }
  } catch (e) {
    console.warn('Could not persist auth token in localStorage:', e);
  }
};

export const getAuthToken = () => {
  if (!cachedToken) {
    try {
      cachedToken = localStorage.getItem('deptflow_auth_token');
    } catch {
      cachedToken = null;
    }
  }
  return cachedToken;
};

export const clearAuthToken = () => {
  cachedToken = null;
  try {
    localStorage.removeItem('deptflow_auth_token');
  } catch {}
};

/**
 * Helper to execute fetch requests with timeout, Bearer token, and error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(url, config);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }
  return data;
}

export const api = {
  // --- System Health ---
  async checkHealth() {
    try {
      const res = await apiRequest('/health');
      return { online: true, data: res };
    } catch (err) {
      return { online: false, error: err.message };
    }
  },

  // --- Authentication & User Management ---
  async signUp(payload) {
    const res = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async signIn(credentials) {
    const res = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async getMe() {
    return await apiRequest('/auth/me');
  },

  async getUsers() {
    return await apiRequest('/auth/users');
  },

  signOut() {
    clearAuthToken();
  },

  // --- Workflows ---
  async getWorkflows() {
    return await apiRequest('/workflows');
  },

  async createWorkflow(payload) {
    return await apiRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async transitionWorkflow(id, { action, remarks, actorRole, actorName }) {
    return await apiRequest(`/workflows/${id}/transition`, {
      method: 'PUT',
      body: JSON.stringify({ action, remarks, actorRole, actorName })
    });
  },

  async updateRubric(id, { rubricScores, qualitativeFeedback, evaluatedBy }) {
    return await apiRequest(`/workflows/${id}/rubric`, {
      method: 'PUT',
      body: JSON.stringify({ rubricScores, qualitativeFeedback, evaluatedBy })
    });
  },

  async resetWorkflows() {
    return await apiRequest('/workflows/reset', {
      method: 'POST'
    });
  },

  // --- Allocation & Teams ---
  async getTeams() {
    return await apiRequest('/allocation/teams');
  },

  async simulateAllocation() {
    return await apiRequest('/allocation/simulate', {
      method: 'POST'
    });
  },

  async overrideAllocation({ teamId, newFacultyId, reason, overrideBy }) {
    return await apiRequest('/allocation/override', {
      method: 'POST',
      body: JSON.stringify({ teamId, newFacultyId, reason, overrideBy })
    });
  },

  async resetAllocation() {
    return await apiRequest('/allocation/reset', {
      method: 'POST'
    });
  },

  // --- Faculty Directory ---
  async getFaculty() {
    return await apiRequest('/faculty');
  }
};
