import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://your-app.onrender.com'

const api = axios.create({ baseURL: `${BASE_URL}/api/v1` })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

export const tournamentsApi = {
  getAll: () => api.get('/tournaments/'),
  getOne: (id) => api.get(`/tournaments/${id}`),
}

export const matchesApi = {
  getAll: (params) => api.get('/matches/', { params }),
  getOne: (id) => api.get(`/matches/${id}`),
  getMyPredictions: (matchId) => api.get(`/predictions/match/${matchId}/my`),
  getVotes: (matchId) => api.get(`/predictions/match/${matchId}/votes`),
}

export const predictionsApi = {
  create: (data) => api.post('/predictions/', data),
  getMy: () => api.get('/predictions/my'),
  getMyStats: () => api.get('/predictions/my/stats'),
}

export const usersApi = {
  getMe: () => api.get('/users/me'),
  getLeaderboard: () => api.get('/users/leaderboard'),
  getMyRank: () => api.get('/users/me/rank'),
  getTournamentLeaderboard: (tournamentId) => api.get(`/users/leaderboard/tournament/${tournamentId}`),
  getMyTournamentRank: (tournamentId) => api.get(`/users/me/rank/tournament/${tournamentId}`),
}
