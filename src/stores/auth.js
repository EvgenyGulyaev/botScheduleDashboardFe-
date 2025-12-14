// src/stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'

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
      // Восстановление из localStorage
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken) {
        this.token = savedToken
      }
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser)
        } catch {
          this.user = null
        }
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
        (response) => response,
        (error) => {
          if (error.response && error.response.status === 401) {
            this.logout()
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

        // Ожидаем от бэка:
        // { token: '...', user: { ... } }
        this.token = res.data.Token
        this.user = res.data || null

        localStorage.setItem('token', this.token)
        if (this.user) {
          localStorage.setItem('user', JSON.stringify(this.user))
        }

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

    logout() {
      this.user = null
      this.token = null
      this.error = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})
