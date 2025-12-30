import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const updateUserAvatar = (avatar) => api.put('/auth/update-avatar', { avatar });

// Notification APIs
export const getNotifications = () => api.get('/notifications');
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const deleteAllNotifications = () => api.delete('/notifications/delete-all');

// Profile APIs
export const getMyProfile = () => api.get('/profiles/me');
export const getUserProfile = (userId) => api.get(`/profiles/user/${userId}`);
export const saveProfile = (profileData) => api.post('/profiles', profileData);

// Job APIs
export const getAllJobs = () => api.get('/jobs');
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const createJob = (jobData) => api.post('/jobs', jobData);
export const getMyJobs = () => api.get('/jobs/my/posts');
export const updateJob = (id, jobData) => api.put(`/jobs/${id}`, jobData);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

// Saved Jobs APIs
export const getSavedJobs = () => api.get('/saved-jobs');
export const checkIfJobSaved = (jobId) => api.get(`/saved-jobs/check/${jobId}`);
export const saveJob = (jobId) => api.post(`/saved-jobs/${jobId}`);
export const unsaveJob = (jobId) => api.delete(`/saved-jobs/${jobId}`);

// Application APIs
export const applyToJob = (applicationData) => api.post('/applications', applicationData);
export const getJobApplications = (jobId) => api.get(`/applications/job/${jobId}`);
export const getMyApplications = () => api.get('/applications/my-applications');
export const updateApplicationStatus = (id, statusData) => 
  api.put(`/applications/${id}/status`, statusData);

// Admin APIs
export const getAdminStats = () => api.get('/admin/stats');
export const getAllUsers = (params) => api.get('/admin/users', { params });
export const deleteUser = (userId, reason) => api.delete(`/admin/users/${userId}`, { data: { reason } });
export const updateUserType = (userId, userType) => api.put(`/admin/users/${userId}`, { user_type: userType });
export const getAdminJobs = (params) => api.get('/admin/jobs', { params });
export const deleteAdminJob = (jobId, reason) => api.delete(`/admin/jobs/${jobId}`, { data: { reason } });
export const updateJobStatus = (jobId, status) => api.put(`/admin/jobs/${jobId}/status`, { status });
export const getAdminApplications = (params) => api.get('/admin/applications', { params });
export const getAdminActivity = (limit) => api.get('/admin/activity', { params: { limit } });

export default api;