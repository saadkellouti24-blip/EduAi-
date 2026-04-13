import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Instance Axios configurée avec le token
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour injecter le token Sanctum à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
});

export const api = {
  // --- AUTHENTIFICATION ---
  login: async (email, password) => {
    const response = await apiClient.post('/login', { email, password });
    return response.data;
  },

  // --- CLASSES & UTILISATEURS ---
  getClasses: async () => {
    const response = await apiClient.get('/classes');
    return response.data;
  },
  createClass: async (name) => {
    const response = await apiClient.post('/classes', { name });
    return response.data;
  },
  addStudent: async (data) => {
    const response = await apiClient.post('/students', data);
    return response.data;
  },

  // --- COURS ---
  getCourses: async () => {
    const response = await apiClient.get('/courses');
    return response.data;
  },
  createCourse: async (courseData) => {
    const response = await apiClient.post('/courses', courseData);
    return response.data;
  },
  deleteCourse: async (id) => {
    await apiClient.delete(`/courses/${id}`);
  },
};