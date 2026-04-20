self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      const hasOpenClient = clients.some((client) => {
        try {
          return new URL(client.url).origin === self.location.origin
        } catch {
          return false
        }
      })

      if (hasOpenClient) {
        return
      }

      let payload = {}
      try {
        payload = event.data ? event.data.json() : {}
      } catch {
        payload = {}
      }

      const title = payload?.title || 'Новое сообщение'
      const body = payload?.body || 'Открой приложение, чтобы посмотреть чат.'
      const url = payload?.url || '/chat'

      await self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    (async () => {
      const targetUrl = event.notification?.data?.url || '/chat'
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of clients) {
        try {
          if (new URL(client.url).origin !== self.location.origin) {
            continue
          }
        } catch {
          continue
        }

        if ('focus' in client) {
          await client.focus()
        }
        if ('navigate' in client) {
          await client.navigate(targetUrl)
        }
        return
      }

      await self.clients.openWindow(targetUrl)
    })(),
  )
})
