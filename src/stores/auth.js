// src/stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'
import {
  clearStoredAuth,
  normalizeAuthPayload,
  readStoredAuth,
  writeStoredAuth,
} from '../lib/auth-storage.js'
import { isUnauthorizedError, redirectToLogin } from '../lib/auth-session.js'

const REFRESHED_TOKEN_HEADER = 'x-auth-token'

const getRefreshedToken = (response) => {
  const headers = response?.headers
  if (!headers) {
    return ''
  }

  if (typeof headers.get === 'function') {
    return headers.get(REFRESHED_TOKEN_HEADER) || headers.get('X-Auth-Token') || ''
  }

  return headers[REFRESHED_TOKEN_HEADER] || headers['X-Auth-Token'] || ''
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    api: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    init() {
      const { token, user } = readStoredAuth(localStorage)
      this.token = token
      this.user = user

      if (this.api) {
        return
      }

      // Создаём axios инстанс
      this.api = axios.create({
        baseURL: '/api',
      })

      // Request interceptor → подставляем токен
      this.api.interceptors.request.use((config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      })

      // (опционально) Response interceptor на 401
      this.api.interceptors.response.use(
        (response) => {
          const refreshedToken = getRefreshedToken(response)
          if (refreshedToken) {
            this.updateSessionToken(refreshedToken)
          }

          return response
        },
        (error) => {
          if (isUnauthorizedError(error)) {
            this.logout()
            redirectToLogin()
          }
          return Promise.reject(error)
        },
      )
    },

    async login({ email, password } = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/login', { email, password })
        const session = normalizeAuthPayload(res.data)

        this.token = session.token
        this.user = session.user
        writeStoredAuth(localStorage, session)

        if (!this.api) {
          this.init()
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Ошибка авторизации'
        throw err
      } finally {
        this.loading = false
      }
    },

    updateSessionToken(token) {
      if (!token || token === this.token) {
        return
      }

      this.token = token
      writeStoredAuth(localStorage, {
        token,
        user: this.user,
      })
    },

    logout() {
      this.user = null
      this.token = null
      this.error = null

      clearStoredAuth(localStorage)
    },
  },
})
