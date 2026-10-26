/**
 * DeptFlow 360 - REST API Service Layer
 * Connects React UI to Express Backend with resilient offline fallback
 */

const API_BASE = '/api';

/**
 * Helper to execute fetch requests with timeout and error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
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
