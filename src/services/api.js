/**
 * DeptFlow 360 - REST API Service Layer
 * Connects React UI to Express Backend with resilient offline fallback
 */

const PRIMARY_API = '/api';
const DIRECT_BACKEND_API = 'http://localhost:5000/api';

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
 * Execute a single HTTP request with timeout and safe JSON handling
 */
async function executeRequest(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || `HTTP ${response.status}: Request failed` };
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: Request failed`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Helper to execute fetch requests with automatic fallback (Primary /api -> Direct http://localhost:5000/api)
 */
async function apiRequest(endpoint, options = {}) {
  try {
    return await executeRequest(PRIMARY_API, endpoint, options);
  } catch (primaryErr) {
    // If running in development or outside nginx proxy, try direct backend port 5000
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      try {
        return await executeRequest(DIRECT_BACKEND_API, endpoint, options);
      } catch {
        // Fall through to throw primaryErr
      }
    }
    throw primaryErr;
  }
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

  async transitionWorkflow(id, { action, actionKey, remarks, comment, actorRole, actorName }) {
    const act = actionKey || action;
    const comm = comment || remarks || '';
    return await apiRequest(`/workflows/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ 
        action: act, 
        actionKey: act, 
        remarks: comm, 
        comment: comm, 
        actorRole, 
        actorName,
        actorData: { name: actorName, role: actorRole, title: actorRole }
      })
    });
  },

  async evaluateMilestone(id, milestoneId, { rubricScores, feedback, evaluatorData }) {
    return await apiRequest(`/workflows/${id}/milestones/${milestoneId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ rubricScores, feedback, evaluatorData })
    });
  },

  async updateRubric(id, { rubricScores, qualitativeFeedback, evaluatedBy }) {
    return await this.evaluateMilestone(id, 'M1', {
      rubricScores,
      feedback: qualitativeFeedback,
      evaluatorData: { name: evaluatedBy }
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

  async createTeam(teamData) {
    return await apiRequest('/allocation/teams', {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
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
  },

  async createFaculty(facultyData) {
    return await apiRequest('/faculty', {
      method: 'POST',
      body: JSON.stringify(facultyData)
    });
  }
};
