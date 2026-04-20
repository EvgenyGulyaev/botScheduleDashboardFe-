const SW_URL = '/sw.js'

export const isWebPushSupported = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export const urlBase64ToUint8Array = (base64String = '') => {
  const normalized = String(base64String || '').trim()
  if (!normalized) {
    return new Uint8Array()
  }

  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const base64 = (normalized + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export const ensurePushServiceWorkerRegistration = async () => {
  if (!isWebPushSupported()) {
    throw new Error('Этот браузер не поддерживает push-уведомления')
  }

  const registration = await navigator.serviceWorker.register(SW_URL)
  return navigator.serviceWorker.ready.then(() => registration)
}

export const getBrowserPushPermission = () => {
  if (typeof Notification === 'undefined') {
    return 'denied'
  }

  return Notification.permission
}

export const requestBrowserPushPermission = async () => {
  if (typeof Notification === 'undefined') {
    return 'denied'
  }

  return Notification.requestPermission()
}

export const getExistingPushSubscription = async () => {
  const registration = await ensurePushServiceWorkerRegistration()
  return registration.pushManager.getSubscription()
}

export const subscribeToPushNotifications = async (publicKey = '') => {
  if (!publicKey) {
    throw new Error('Публичный ключ push ещё не настроен на сервере')
  }

  const registration = await ensurePushServiceWorkerRegistration()
  const permission = getBrowserPushPermission()
  const nextPermission =
    permission === 'default' ? await requestBrowserPushPermission() : permission

  if (nextPermission !== 'granted') {
    throw new Error('Браузер не дал доступ к push-уведомлениям')
  }

  const currentSubscription = await registration.pushManager.getSubscription()
  if (currentSubscription) {
    return currentSubscription
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
}

export const unsubscribeFromPushNotifications = async () => {
  const registration = await ensurePushServiceWorkerRegistration()
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    return null
  }

  await subscription.unsubscribe()
  return subscription
}

export const serializePushSubscription = (subscription) => {
  if (!subscription) {
    return null
  }

  const payload =
    typeof subscription.toJSON === 'function'
      ? subscription.toJSON()
      : {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey?.('p256dh') || '',
            auth: subscription.getKey?.('auth') || '',
          },
        }

  return {
    endpoint: payload?.endpoint || '',
    user_agent:
      typeof navigator !== 'undefined' ? navigator.userAgent || '' : '',
    keys: {
      p256dh: payload?.keys?.p256dh || '',
      auth: payload?.keys?.auth || '',
    },
  }
}
