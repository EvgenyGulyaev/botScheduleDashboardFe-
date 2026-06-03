<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Рисовалка</h2>
          <p class="mt-1 text-sm text-slate-500">
            Создавай и редактируй изображения. Все рисунки сохраняются в Google Drive.
          </p>
        </div>
      </header>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Загрузка модуля рисовалки...
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Полноценный canvas-редактор появится в Task 13.
})
</script>
