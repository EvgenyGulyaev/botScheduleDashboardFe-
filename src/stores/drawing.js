// src/stores/drawing.js
import { defineStore, getActivePinia } from 'pinia'
import { normalizeDrawingImage, normalizeDrawingImages } from '../lib/drawing.js'
import { useAuthStore } from './auth.js'

export const useDrawingStore = defineStore('drawing', {
  state: () => ({
    items: [],
    selected: null,
    loading: false,
    saving: false,
    error: null,
  }),

  actions: {
    api() {
      const pinia = getActivePinia()
      if (!pinia) {
        throw new Error('pinia is not active')
      }
      const auth = useAuthStore(pinia)
      return auth.api
    },
    setError(message) {
      this.error = message
    },
    clearError() {
      this.error = null
    },
    async fetchImages() {
      const api = this.api()
      if (!api) {
        throw new Error('api is not initialized')
      }
      this.loading = true
      this.clearError()
      try {
        const response = await api.get('/drawing/images')
        this.items = normalizeDrawingImages(response?.data?.items)
        return this.items
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось загрузить список рисунков'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchImage(id = '') {
      if (!id) {
        throw new Error('id is required')
      }
      const api = this.api()
      if (!api) {
        throw new Error('api is not initialized')
      }
      this.loading = true
      this.clearError()
      try {
        const response = await api.get(`/drawing/images/${encodeURIComponent(id)}`)
        this.selected = normalizeDrawingImage(response.data)
        return this.selected
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось загрузить рисунок'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchImageContent(id = '') {
      if (!id) {
        throw new Error('id is required')
      }
      const api = this.api()
      if (!api) {
        throw new Error('api is not initialized')
      }
      const response = await api.get(`/drawing/images/${encodeURIComponent(id)}/content`, {
        responseType: 'blob',
      })
      return response.data
    },

    buildFormData({ title, width, height, blob, filename = 'drawing.png' }) {
      const formData = new FormData()
      const metadata = {
        title: String(title ?? '').trim(),
        width: Number(width) || 0,
        height: Number(height) || 0,
      }
      formData.append('metadata', JSON.stringify(metadata))
      if (blob) {
        formData.append('file', blob, filename)
      }
      return formData
    },

    async createImage({ title, width, height, blob, filename = 'drawing.png' }) {
      const api = this.api()
      if (!api) {
        throw new Error('api is not initialized')
      }
      this.saving = true
      this.clearError()
      try {
        const formData = this.buildFormData({ title, width, height, blob, filename })
        const response = await api.post('/drawing/images', formData)
        const created = normalizeDrawingImage(response.data)
        this.items = [created, ...this.items]
        this.selected = created
        return created
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось сохранить рисунок'
        throw err
      } finally {
        this.saving = false
      }
    },

    async updateImage(id = '', { title, width, height, blob, filename = 'drawing.png' }) {
      if (!id) {
        throw new Error('id is required')
      }
      const api = this.api()
      if (!api) {
        throw new Error('api is not initialized')
      }
      this.saving = true
      this.clearError()
      try {
        const formData = this.buildFormData({ title, width, height, blob, filename })
        const response = await api.put(
          `/drawing/images/${encodeURIComponent(id)}`,
          formData,
        )
        const updated = normalizeDrawingImage(response.data)
        this.items = this.items.map((item) => (item.id === updated.id ? updated : item))
        this.selected = updated
        return updated
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось обновить рисунок'
        throw err
      } finally {
        this.saving = false
      }
    },

    async deleteImage(id = '') {
      if (!id) {
        throw new Error('id is required')
      }
      const api = this.api()
      if (!api) {
        throw new Error('api is not initialized')
      }
      this.saving = true
      this.clearError()
      try {
        await api.delete(`/drawing/images/${encodeURIComponent(id)}`)
        this.items = this.items.filter((item) => item.id !== id)
        if (this.selected?.id === id) {
          this.selected = null
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось удалить рисунок'
        throw err
      } finally {
        this.saving = false
      }
    },
  },
})
