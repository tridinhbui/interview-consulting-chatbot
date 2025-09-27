import axios from 'axios'
import { AuthUser, ICaseTemplate, ISession, IMessage } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },
  
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data)
    return response.data
  },
  
  getProfile: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  }
}

// Cases API
export const casesAPI = {
  getCases: async (params?: { industry?: string; difficulty?: string; page?: number; limit?: number }) => {
    const response = await api.get('/api/cases', { params })
    return response.data
  },
  
  getCase: async (id: string) => {
    const response = await api.get(`/api/cases/${id}`)
    return response.data
  },
  
  createCase: async (data: Partial<ICaseTemplate>) => {
    const response = await api.post('/api/cases', data)
    return response.data
  },
  
  updateCase: async (id: string, data: Partial<ICaseTemplate>) => {
    const response = await api.put(`/api/cases/${id}`, data)
    return response.data
  },
  
  deleteCase: async (id: string) => {
    const response = await api.delete(`/api/cases/${id}`)
    return response.data
  }
}

// Sessions API
export const sessionsAPI = {
  getSessions: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/api/sessions', { params })
    return response.data
  },
  
  getSession: async (id: string) => {
    const response = await api.get(`/api/sessions/${id}`)
    return response.data
  },
  
  createSession: async (data: { caseTemplateId: string }) => {
    const response = await api.post('/api/sessions', data)
    return response.data
  },
  
  updateSession: async (id: string, data: Partial<ISession>) => {
    const response = await api.put(`/api/sessions/${id}`, data)
    return response.data
  },
  
  deleteSession: async (id: string) => {
    const response = await api.delete(`/api/sessions/${id}`)
    return response.data
  }
}

// Messages API
export const messagesAPI = {
  sendMessage: async (data: { sessionId: string; content: string }) => {
    const response = await api.post('/api/messages', data)
    return response.data
  }
}

export default api
