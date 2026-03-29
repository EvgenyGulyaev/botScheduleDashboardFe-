import { defineStore } from 'pinia'

const DEFAULT_DURATION = 4000

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [],
    nextId: 1,
  }),

  actions: {
    notify(type, message, options = {}) {
      const notification = {
        id: this.nextId++,
        type,
        message,
        duration: options.duration ?? DEFAULT_DURATION,
      }

      this.items.push(notification)

      if (notification.duration > 0) {
        setTimeout(() => {
          this.dismiss(notification.id)
        }, notification.duration)
      }

      return notification.id
    },

    success(message, options) {
      return this.notify('success', message, options)
    },

    info(message, options) {
      return this.notify('info', message, options)
    },

    error(message, options) {
      return this.notify('error', message, options)
    },

    errorFrom(error, fallback = 'Произошла ошибка', options) {
      return this.error(getErrorMessage(error, fallback), options)
    },

    dismiss(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
