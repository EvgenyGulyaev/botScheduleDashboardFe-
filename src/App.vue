<template>
  <div :class="appShellClass">
    <AppNotifications />

    <!-- Навигация (только после логина) -->
    <nav
      v-if="$route.meta.requiresAuth && route.name !== 'Drawing'"
      class="bg-white shadow-sm border-b"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Логотип -->
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">🤖 Bot Admin</h1>
          </div>

          <!-- Десктоп меню -->
          <div class="hidden md:flex flex-1 items-center justify-between pl-8">
            <div class="flex items-center space-x-4">
              <div v-if="adminMenuItems.length" class="relative">
                <button
                  type="button"
                  class="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:outline-none"
                  aria-haspopup="menu"
                  :aria-expanded="openDesktopMenu === 'dashboard'"
                  @click="toggleDesktopMenu('dashboard')"
                >
                  📊 Dashboard
                  <svg class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  v-if="openDesktopMenu === 'dashboard'"
                  class="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div class="py-1" role="menu" aria-orientation="vertical">
                    <router-link
                      v-for="item in adminMenuItems"
                      :key="item.to"
                      :to="item.to"
                      @click="closeDesktopMenu"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      {{ item.icon }} {{ item.label }}
                    </router-link>
                  </div>
                </div>
              </div>
              <!-- Dropdown Приложения -->
              <div class="relative">
                <button
                  type="button"
                  class="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:outline-none"
                  aria-haspopup="menu"
                  :aria-expanded="openDesktopMenu === 'apps'"
                  @click="toggleDesktopMenu('apps')"
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
                  v-if="openDesktopMenu === 'apps'"
                  class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div class="py-1" role="menu" aria-orientation="vertical">
                    <router-link
                      v-for="item in appMenuItems"
                      :key="item.to"
                      :to="item.to"
                      @click="closeDesktopMenu"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      {{ item.icon }} {{ item.label }}
                    </router-link>
                  </div>
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
            <div v-if="adminMenuItems.length" class="border-b border-gray-100 pb-2">
              <div class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Dashboard
              </div>
              <router-link
                v-for="item in adminMenuItems"
                :key="item.to"
                :to="item.to"
                @click="closeMobileMenu"
                class="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {{ item.icon }} {{ item.label }}
              </router-link>
            </div>
            <!-- Категория Приложения (Мобильное меню) -->
            <div class="border-t border-gray-100 pt-2 pb-1 mt-2">
              <div class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Приложения
              </div>
              <router-link
                v-for="item in appMenuItems"
                :key="item.to"
                :to="item.to"
                @click="closeMobileMenu"
                class="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {{ item.icon }} {{ item.label }}
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

    <div v-if="showInstallPrompt" class="mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div class="text-sm font-bold text-slate-950">Установить Bot Admin как приложение</div>
            <div class="mt-1 text-sm text-slate-500">
              На Android нажми «Установить». На iOS браузер не даёт установить автоматически:
              {{ iosInstallSteps.join(' ') }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-if="deferredInstallPrompt"
              type="button"
              class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              @click="installPwa"
            >
              Установить
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              @click="dismissInstallPrompt"
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Контент -->
    <div :class="contentWrapperClass">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminMenuItems, getAppMenuItems } from './lib/app-navigation.js'
import {
  getIOSInstallSteps,
  isMobileOrTabletInstallContext,
  isStandaloneDisplayMode,
  readInstallPromptDismissed,
  shouldShowPwaInstallPrompt,
  writeInstallPromptDismissed,
} from './lib/pwa-install.js'
import { useAuthStore } from './stores/auth.js'
import AppNotifications from './components/AppNotifications.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)
const openDesktopMenu = ref(null)
const deferredInstallPrompt = ref(null)
const installPromptDismissed = ref(readInstallPromptDismissed())
let removeAfterEachHook = null
const appMenuItems = computed(() =>
  getAppMenuItems({
    isAdmin: Boolean(authStore.user?.isAdmin),
    isSuperAdmin: Boolean(authStore.user?.isSuperAdmin),
    appPermissions: authStore.user?.appPermissions || [],
  }),
)
const adminMenuItems = computed(() => getAdminMenuItems(Boolean(authStore.user?.isSuperAdmin)))
const iosInstallSteps = getIOSInstallSteps()
const showInstallPrompt = computed(
  () =>
    route.name !== 'Drawing' &&
    shouldShowPwaInstallPrompt({
      isAuthenticated: authStore.isAuthenticated,
      isStandalone: isStandaloneDisplayMode(window),
      dismissed: installPromptDismissed.value,
      isMobileOrTablet: isMobileOrTabletInstallContext(window),
    }),
)

const appShellClass = computed(() => {
  if (route.name === 'Drawing') {
    return 'h-[100dvh] overflow-hidden bg-gray-50'
  }

  return 'min-h-screen bg-gray-50'
})

const contentWrapperClass = computed(() => {
  if (route.name === 'Drawing') {
    return 'h-full overflow-hidden pt-0 pb-0'
  }

  if (route.name === 'Chat') {
    return 'pt-0 pb-0'
  }

  return 'pt-4 pb-12'
})

// Toggle мобильного меню
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  closeDesktopMenu()
}

// Закрыть мобильное меню
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleDesktopMenu = (menu) => {
  openDesktopMenu.value = openDesktopMenu.value === menu ? null : menu
  closeMobileMenu()
}

const closeDesktopMenu = () => {
  openDesktopMenu.value = null
}

// Закрыть меню при клике вне его
const handleClickOutside = (event) => {
  const nav = document.querySelector('nav')
  if (nav && !nav.contains(event.target)) {
    closeMobileMenu()
    closeDesktopMenu()
  }
}

// Закрыть меню при изменении роута
const handleRouteChange = () => {
  closeMobileMenu()
  closeDesktopMenu()
}

const logout = async () => {
  authStore.logout()
  closeMobileMenu()
  await router.push('/login')
}

const handleBeforeInstallPrompt = (event) => {
  event.preventDefault()
  deferredInstallPrompt.value = event
}

const installPwa = async () => {
  if (!deferredInstallPrompt.value) {
    return
  }

  deferredInstallPrompt.value.prompt()
  await deferredInstallPrompt.value.userChoice.catch(() => null)
  deferredInstallPrompt.value = null
  dismissInstallPrompt()
}

const dismissInstallPrompt = () => {
  writeInstallPromptDismissed()
  installPromptDismissed.value = true
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    void authStore.fetchProfile().catch(() => {})
  }
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  removeAfterEachHook = router.afterEach(handleRouteChange)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  removeAfterEachHook?.()
})
</script>
