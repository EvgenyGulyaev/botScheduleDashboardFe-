<template>
  <div
    class="rounded-2xl border px-4 py-3"
    :class="noticeClass"
  >
    <div class="flex items-start gap-3">
      <div class="pt-0.5 text-base leading-none">{{ icon }}</div>
      <div class="min-w-0">
        <p v-if="title" class="text-sm font-semibold">{{ title }}</p>
        <p class="text-sm opacity-90">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tone: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    required: true,
  },
})

const noticeClass = computed(() => {
  if (props.tone === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-950'
  }

  if (props.tone === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-950'
  }

  return 'border-slate-200 bg-slate-50 text-slate-900'
})

const icon = computed(() => {
  if (props.tone === 'error') {
    return '!'
  }

  if (props.tone === 'success') {
    return '✓'
  }

  return 'i'
})
</script>
