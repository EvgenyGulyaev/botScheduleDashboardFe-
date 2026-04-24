// src/stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'
import {
  clearStoredAuth,
  normalizeAuthUser,
  normalizeAuthPayload,
  readStoredAuth,
  writeStoredAuth,
} from '../lib/auth-storage.js'
import { resolveDefaultAppRoute } from '../lib/default-app.js'
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
      this.user = user ? normalizeAuthUser(user) : null

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

        this.applySession(session)

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

    async loginWithGoogle(idToken = '') {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/auth/google', { id_token: idToken })
        const session = normalizeAuthPayload(res.data)
        this.applySession(session)
        if (!this.api) {
          this.init()
        }
        return this.user
      } catch (err) {
        this.error = err.response?.data?.message || 'Ошибка входа через Google'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchGoogleAuthConfig() {
      const response = await axios.get('/api/auth/google/config')
      return {
        enabled: Boolean(response?.data?.enabled),
        clientId: response?.data?.client_id || '',
      }
    },

    async forgotPassword(email = '') {
      return axios.post('/api/auth/forgot-password', { email })
    },

    async resetPassword({ token, password } = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/auth/reset-password', { token, password })
        const session = normalizeAuthPayload(response.data)
        this.applySession(session)
        if (!this.api) {
          this.init()
        }
        return this.user
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось обновить пароль'
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

    applySession({ token, user }) {
      this.token = token
      this.user = user ? normalizeAuthUser(user) : null
      writeStoredAuth(localStorage, {
        token: this.token,
        user: this.user,
      })
      return this.user
    },

    applyProfile(profile) {
      this.user = normalizeAuthUser(profile)
      writeStoredAuth(localStorage, {
        token: this.token,
        user: this.user,
      })
      return this.user
    },

    async fetchProfile() {
      const api = this.api
      const response = await api.get('/profile')
      return this.applyProfile(response.data)
    },

    async updateProfile(payload = {}) {
      const api = this.api
      const response = await api.patch('/profile', payload)
      return this.applyProfile(response.data)
    },

    async savePushSubscription(payload = {}) {
      const api = this.api
      return api.post('/profile/push-subscriptions', payload)
    },

    async fetchAliceAccounts() {
      const api = this.api
      const response = await api.get('/alice/accounts')
      return Array.isArray(response.data?.items) ? response.data.items : []
    },

    async fetchAliceAccountResources(accountId = '') {
      if (!accountId) {
        return {
          households: [],
          rooms: [],
          devices: [],
          scenarios: [],
        }
      }
      const api = this.api
      const response = await api.get(`/alice/accounts/${accountId}/resources`)
      return {
        households: Array.isArray(response.data?.households) ? response.data.households : [],
        rooms: Array.isArray(response.data?.rooms) ? response.data.rooms : [],
        devices: Array.isArray(response.data?.devices) ? response.data.devices : [],
        scenarios: Array.isArray(response.data?.scenarios) ? response.data.scenarios : [],
      }
    },

    async deletePushSubscription(endpoint = '') {
      const api = this.api
      return api.delete('/profile/push-subscriptions', {
        data: {
          endpoint,
        },
      })
    },

    logout() {
      this.user = null
      this.token = null
      this.error = null

      clearStoredAuth(localStorage)
    },

    getDefaultRoute() {
      return resolveDefaultAppRoute(this.user?.defaultApp)
    },
  },
})
