<template>
  <div
    aria-live="polite"
    class="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:justify-end"
  >
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex w-full max-w-md flex-col gap-3"
    >
      <div
        v-for="item in notifications.items"
        :key="item.id"
        class="pointer-events-auto overflow-hidden rounded-2xl border shadow-xl backdrop-blur"
        :class="toastClass(item.type)"
      >
        <div class="flex items-start gap-3 px-4 py-3">
          <div class="pt-0.5 text-lg leading-none">{{ toastIcon(item.type) }}</div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">{{ toastTitle(item.type) }}</p>
            <p class="mt-1 text-sm opacity-90 break-words">
              {{ item.message }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-full px-2 py-1 text-xs font-semibold opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/60"
            @click="notifications.dismiss(item.id)"
          >
            Закрыть
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications.js'

const notifications = useNotificationsStore()

const toastClass = (type) => {
  if (type === 'success') {
    return 'border-emerald-200 bg-emerald-50/95 text-emerald-950'
  }

  if (type === 'error') {
    return 'border-rose-200 bg-rose-50/95 text-rose-950'
  }

  if (type === 'chat') {
    return 'border-slate-900 bg-slate-950/95 text-white'
  }

  return 'border-sky-200 bg-sky-50/95 text-sky-950'
}

const toastIcon = (type) => {
  if (type === 'success') {
    return '✓'
  }

  if (type === 'error') {
    return '!'
  }

  if (type === 'chat') {
    return '💬'
  }

  return 'i'
}

const toastTitle = (type) => {
  if (type === 'success') {
    return 'Успешно'
  }

  if (type === 'error') {
    return 'Ошибка'
  }

  if (type === 'chat') {
    return 'Новое сообщение'
  }

  return 'Информация'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.toast-move {
  transition: transform 0.2s ease;
}
</style>
