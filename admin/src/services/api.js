const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('gameloot_admin_token');
export const setAuthToken = (token) => localStorage.setItem('gameloot_admin_token', token);
export const removeAuthToken = () => localStorage.removeItem('gameloot_admin_token');

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      window.dispatchEvent(new Event('auth_expired'));
    }
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// Auth endpoints
export const loginAdmin = (email, password) => apiRequest('/auth/admin/login', 'POST', { email, password });
export const getAdminMe = () => apiRequest('/auth/admin/me');

// Dashboard metrics
export const getDashboardStats = () => apiRequest('/admin/dashboard');

// Games CRUD & Featured & Bulk & Upload
export const getGames = (params = {}) => {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
  const query = new URLSearchParams(cleanParams).toString();
  return apiRequest(`/admin/games${query ? `?${query}` : ''}`);
};
export const createGame = (data) => apiRequest('/admin/games', 'POST', data);
export const updateGame = (id, data) => apiRequest(`/admin/games/${id}`, 'PUT', data);
export const deleteGame = (id) => apiRequest(`/admin/games/${id}`, 'DELETE');
export const bulkGamesAction = (ids, action) => apiRequest('/admin/games/bulk-action', 'POST', { ids, action });
export const uploadImage = (image, filename, folder = 'games') => apiRequest('/admin/upload-image', 'POST', { image, filename, folder });

// Categories CRUD
export const getCategories = () => apiRequest('/admin/categories');
export const createCategory = (data) => apiRequest('/admin/categories', 'POST', data);
export const updateCategory = (id, data) => apiRequest(`/admin/categories/${id}`, 'PUT', data);
export const deleteCategory = (id) => apiRequest(`/admin/categories/${id}`, 'DELETE');

// Users
export const getUsers = (params = {}) => {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
  const query = new URLSearchParams(cleanParams).toString();
  return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
};
export const getUserDetails = (id) => apiRequest(`/admin/users/${id}`);
export const updateUserStatus = (id, status) => apiRequest(`/admin/users/${id}/status`, 'PATCH', { status });
export const adjustUserPoints = (id, amount, reason) => apiRequest(`/admin/users/${id}/adjust-points`, 'POST', { amount, reason });
export const bulkUsersAction = (ids, action, amount = 100, reason = '') => apiRequest('/admin/users/bulk-action', 'POST', { ids, action, amount, reason });

// Redemptions
export const getRedemptions = (params = {}) => {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
  const query = new URLSearchParams(cleanParams).toString();
  return apiRequest(`/admin/redemptions${query ? `?${query}` : ''}`);
};
export const updateRedemptionStatus = (id, status, admin_notes) => apiRequest(`/admin/redemptions/${id}`, 'PATCH', { status, admin_notes });
export const bulkRedemptionsAction = (ids, action, admin_notes = '') => apiRequest('/admin/redemptions/bulk-action', 'POST', { ids, action, admin_notes });

// Security / Fraud
export const getFraudLogs = () => apiRequest('/admin/fraud');
export const updateFraudStatus = (id, status) => apiRequest(`/admin/fraud/${id}`, 'PATCH', { status });

// Settings
export const getSettings = () => apiRequest('/admin/settings');
export const updateSettings = (settings) => apiRequest('/admin/settings', 'PUT', { settings });

// Quizzes CRUD
export const getQuizzes = () => apiRequest('/admin/quizzes');
export const createQuiz = (data) => apiRequest('/admin/quizzes', 'POST', data);
export const updateQuiz = (id, data) => apiRequest(`/admin/quizzes/${id}`, 'PUT', data);
export const deleteQuiz = (id) => apiRequest(`/admin/quizzes/${id}`, 'DELETE');

// Web Surf Tasks CRUD
export const getSurfTasks = () => apiRequest('/admin/surf-tasks');
export const createSurfTask = (data) => apiRequest('/admin/surf-tasks', 'POST', data);
export const updateSurfTask = (id, data) => apiRequest(`/admin/surf-tasks/${id}`, 'PUT', data);
export const deleteSurfTask = (id) => apiRequest(`/admin/surf-tasks/${id}`, 'DELETE');

// Surveys CRUD
export const getSurveys = () => apiRequest('/admin/surveys');
export const createSurvey = (data) => apiRequest('/admin/surveys', 'POST', data);
export const updateSurvey = (id, data) => apiRequest(`/admin/surveys/${id}`, 'PUT', data);
export const deleteSurvey = (id) => apiRequest(`/admin/surveys/${id}`, 'DELETE');

// Ad Placements & Economics
export const getAdPlacements = () => apiRequest('/admin/ads');
export const updateAdPlacement = (id, data) => apiRequest(`/admin/ads/${id}`, 'PUT', data);

// Push & In-App Broadcast Notifications
export const getAdminNotifications = () => apiRequest('/admin/notifications');
export const createAdminNotification = (data) => apiRequest('/admin/notifications', 'POST', data);
export const deleteAdminNotification = (id) => apiRequest(`/admin/notifications/${id}`, 'DELETE');
