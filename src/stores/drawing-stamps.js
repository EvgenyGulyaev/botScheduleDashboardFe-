import { defineStore, getActivePinia } from 'pinia'
import {
  normalizeDrawingStamp,
  normalizeDrawingStamps,
  resolveStampPriority,
  resolveStampText,
} from '../lib/drawing-stamps.js'
import { useAuthStore } from './auth.js'

const stampNameKey = (value = '') => String(value ?? '').trim().toLocaleLowerCase()

const replaceStampRemovingDuplicateNames = (items = [], stamp) => {
  const key = stampNameKey(stamp?.name)
  let replaced = false
  const next = items.reduce((acc, item) => {
    if (item.id === stamp.id) {
      replaced = true
      acc.push(stamp)
      return acc
    }
    if (stampNameKey(item.name) === key) {
      return acc
    }
    acc.push(item)
    return acc
  }, [])
  return replaced ? next : [stamp, ...next]
}

export const useDrawingStampsStore = defineStore('drawing-stamps', {
  state: () => ({
    items: [],
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
      return useAuthStore(pinia).api
    },
    clearError() {
      this.error = null
    },
    setError(message) {
      this.error = message
    },
    async fetchStamps() {
      const api = this.api()
      this.loading = true
      this.clearError()
      try {
        const response = await api.get('/drawing/stamps')
        this.items = normalizeDrawingStamps(response?.data?.items)
        return this.items
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось загрузить кисти'
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchStampContent(id = '') {
      if (!id) {
        throw new Error('id is required')
      }
      const response = await this.api().get(`/drawing/stamps/${encodeURIComponent(id)}/content`, {
        responseType: 'blob',
      })
      return response.data
    },
    buildFormData({
      name,
      textValue,
      priority,
      removeImage = false,
      hasImage = false,
      file = null,
      filename = 'stamp.png',
    }) {
      const nextHasImage = Boolean(file || (hasImage && !removeImage))
      const formData = new FormData()
      formData.append(
        'metadata',
        JSON.stringify({
          name: String(name ?? '').trim(),
          textValue: resolveStampText({ name, textValue }),
          priority: resolveStampPriority({ name, textValue, priority, hasImage: nextHasImage }),
          removeImage: Boolean(removeImage),
        }),
      )
      if (file) {
        formData.append('file', file, filename)
      }
      return formData
    },
    async createStamp(payload) {
      this.saving = true
      this.clearError()
      try {
        const formData = this.buildFormData(payload)
        const response = await this.api().post('/drawing/stamps', formData)
        const created = normalizeDrawingStamp(response.data)
        this.items = replaceStampRemovingDuplicateNames(this.items, created)
        return created
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось сохранить кисть'
        throw err
      } finally {
        this.saving = false
      }
    },
    async updateStamp(id = '', payload) {
      if (!id) {
        throw new Error('id is required')
      }
      this.saving = true
      this.clearError()
      try {
        const formData = this.buildFormData(payload)
        const response = await this.api().put(`/drawing/stamps/${encodeURIComponent(id)}`, formData)
        const updated = normalizeDrawingStamp(response.data)
        this.items = replaceStampRemovingDuplicateNames(this.items, updated)
        return updated
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось обновить кисть'
        throw err
      } finally {
        this.saving = false
      }
    },
    async deleteStamp(id = '') {
      if (!id) {
        throw new Error('id is required')
      }
      this.saving = true
      this.clearError()
      try {
        await this.api().delete(`/drawing/stamps/${encodeURIComponent(id)}`)
        this.items = this.items.filter((item) => item.id !== id)
      } catch (err) {
        this.error = err.response?.data?.message || 'Не удалось удалить кисть'
        throw err
      } finally {
        this.saving = false
      }
    },
  },
})
