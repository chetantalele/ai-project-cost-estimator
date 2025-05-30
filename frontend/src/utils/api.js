import axios from "axios"

const API_BASE_URL = "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
}

export const projectAPI = {
  getAll: () => api.get("/projects"),
  create: (project) => api.post("/projects", project),
  getById: (id) => api.get(`/projects/${id}`),
}

export const aiAPI = {
  getSuggestions: (projectId) => api.post(`/ai/suggestions/${projectId}`),
}

export default api
