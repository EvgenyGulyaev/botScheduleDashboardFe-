let googleScriptPromise = null

export const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity Services недоступен вне браузера'))
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google)
  }

  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google))
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Google Identity Services')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Не удалось загрузить Google Identity Services'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

export const renderGoogleLoginButton = ({ element, clientId, onCredential }) => {
  if (!element || !clientId || !window.google?.accounts?.id) {
    return
  }

  element.innerHTML = ''
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: ({ credential }) => {
      if (credential) {
        onCredential(credential)
      }
    },
  })
  window.google.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    width: 320,
  })
}
