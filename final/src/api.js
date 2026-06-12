// src/api.js — central axios instance
// In production: calls https://kryphos-phishing-detection.onrender.com
// In dev: calls localhost:8000 via Vite proxy
import axios from "axios"

const baseURL = import.meta.env.VITE_API_URL || ""

const api = axios.create({ baseURL })

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

export default api
