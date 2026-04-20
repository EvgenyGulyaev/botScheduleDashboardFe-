<template>
  <div class="min-h-screen bg-gray-50">
    <AppNotifications />

    <!-- Навигация (только после логина) -->
    <nav v-if="$route.meta.requiresAuth" class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Логотип -->
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">🤖 Bot Admin</h1>
          </div>

          <!-- Десктоп меню -->
          <div class="hidden md:flex items-center space-x-4">
            <router-link
              to="/dashboard"
              class="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            >
              📊 Dashboard
            </router-link>
            <!-- Dropdown Приложения -->
            <div class="relative group">
              <button
                class="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                📦 Приложения
                <svg class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div
                class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              >
                <div class="py-1" role="menu" aria-orientation="vertical">
                  <router-link
                    to="/messages"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    💬 Бот Расписание
                  </router-link>
                  <router-link
                    to="/chat"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    💬 Чат
                  </router-link>
                  <router-link
                    to="/geo3d"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    🏔️ 3D Модели
                  </router-link>
                  <router-link
                    to="/short-links"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    🔗 Короткие ссылки
                  </router-link>
                </div>
              </div>
            </div>
            <button
              @click="logout"
              class="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
            >
              🚪 Выход
            </button>
          </div>

          <!-- Мобильная кнопка гамбургер -->
          <div class="md:hidden flex items-center">
            <button
              @click="toggleMobileMenu"
              class="p-1 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              :aria-label="isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'"
            >
              <!-- Анимированный гамбургер -->
              <svg
                class="h-6 w-6"
                :class="{ 'text-indigo-600': isMobileMenuOpen }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  v-if="!isMobileMenuOpen"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Мобильное меню (падает сверху) -->
        <div v-if="isMobileMenuOpen" class="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <router-link
              to="/dashboard"
              @click="closeMobileMenu"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              📊 Dashboard
            </router-link>
            <!-- Категория Приложения (Мобильное меню) -->
            <div class="border-t border-gray-100 pt-2 pb-1 mt-2">
              <div class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Приложения
              </div>
              <router-link
                to="/messages"
                @click="closeMobileMenu"
                class="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                💬 Бот Расписание
              </router-link>
              <router-link
                to="/chat"
                @click="closeMobileMenu"
                class="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                💬 Чат
              </router-link>
              <router-link
                to="/geo3d"
                @click="closeMobileMenu"
                class="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                🏔️ 3D Модели
              </router-link>
              <router-link
                to="/short-links"
                @click="closeMobileMenu"
                class="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                🔗 Короткие ссылки
              </router-link>
            </div>
            <button
              @click="logout"
              class="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-700 hover:text-red-900 hover:bg-gray-50"
            >
              🚪 Выход
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Контент -->
    <div :class="contentWrapperClass">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import AppNotifications from './components/AppNotifications.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)
let removeAfterEachHook = null

const contentWrapperClass = computed(() => {
  if (route.name === 'Chat') {
    return 'pt-0 pb-0'
  }

  return 'pt-4 pb-12'
})

// Toggle мобильного меню
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Закрыть мобильное меню
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Закрыть меню при клике вне его
const handleClickOutside = (event) => {
  const nav = document.querySelector('nav')
  if (nav && !nav.contains(event.target)) {
    closeMobileMenu()
  }
}

// Закрыть меню при изменении роута
const handleRouteChange = () => {
  closeMobileMenu()
}

const logout = async () => {
  authStore.logout()
  closeMobileMenu()
  await router.push('/login')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  removeAfterEachHook = router.afterEach(handleRouteChange)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  removeAfterEachHook?.()
})
</script>
