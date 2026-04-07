import type { AuthResponse } from '@/types/auth'
import { api } from '@/utilities/api'
import { showAppModal } from '@/components/appModal'
import { GoogleAuth } from '@/auth/googleAuth'
import { t } from '@/i18n'

type LoginGateOptions = {
  auth: GoogleAuth
  onAuthenticated: () => void
}

export function showLoginGate(options: LoginGateOptions): void {
  const body = document.createElement('div')
  body.className = 'login-gate'

  let mode: 'login' | 'register' = 'login'

  const errorEl = document.createElement('div')
  errorEl.className = 'login-gate-error'
  errorEl.hidden = true

  const messageEl = document.createElement('div')
  messageEl.className = 'login-gate-message'
  messageEl.hidden = true

  const tabs = document.createElement('div')
  tabs.className = 'login-gate-tabs'

  const loginTab = document.createElement('button')
  loginTab.type = 'button'
  loginTab.className = 'login-gate-tab login-gate-tab-active'
  loginTab.textContent = t('auth.login')

  const registerTab = document.createElement('button')
  registerTab.type = 'button'
  registerTab.className = 'login-gate-tab'
  registerTab.textContent = t('auth.register')

  tabs.appendChild(loginTab)
  tabs.appendChild(registerTab)

  const form = document.createElement('form')
  form.className = 'login-gate-form'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.name = 'name'
  nameInput.placeholder = t('auth.namePlaceholder')
  nameInput.autocomplete = 'name'
  nameInput.required = false
  nameInput.className = 'login-gate-input'
  nameInput.hidden = true

  const emailInput = document.createElement('input')
  emailInput.type = 'email'
  emailInput.name = 'email'
  emailInput.placeholder = t('auth.emailPlaceholder')
  emailInput.autocomplete = 'email'
  emailInput.required = true
  emailInput.className = 'login-gate-input'

  const passwordInput = document.createElement('input')
  passwordInput.type = 'password'
  passwordInput.name = 'password'
  passwordInput.placeholder = t('auth.passwordPlaceholder')
  passwordInput.autocomplete = 'current-password'
  passwordInput.required = true
  passwordInput.className = 'login-gate-input'

  const loginBtn = document.createElement('button')
  loginBtn.type = 'submit'
  loginBtn.className = 'login-gate-submit'
  loginBtn.textContent = t('auth.login')

  form.appendChild(messageEl)
  form.appendChild(errorEl)
  form.appendChild(nameInput)
  form.appendChild(emailInput)
  form.appendChild(passwordInput)
  form.appendChild(loginBtn)

  const divider = document.createElement('div')
  divider.className = 'login-gate-divider'
  divider.textContent = t('auth.or')

  const googleWrap = document.createElement('div')
  googleWrap.className = 'login-gate-google'

  body.appendChild(tabs)
  body.appendChild(form)
  body.appendChild(divider)
  body.appendChild(googleWrap)

  const dialog = showAppModal({
    id: 'login-gate-modal',
    title: t('auth.signIn'),
    body,
    closeable: false,
  })

  const modalTitleEl = dialog.querySelector('[data-role="title"]')

  const setMode = (nextMode: 'login' | 'register') => {
    mode = nextMode
    errorEl.hidden = true
    errorEl.textContent = ''
    messageEl.hidden = true
    messageEl.textContent = ''

    const isRegister = mode === 'register'
    nameInput.hidden = !isRegister

    loginTab.classList.toggle('login-gate-tab-active', !isRegister)
    registerTab.classList.toggle('login-gate-tab-active', isRegister)

    loginBtn.textContent = isRegister ? t('auth.createAccount') : t('auth.login')
    passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password'

    if (modalTitleEl instanceof HTMLElement) {
      modalTitleEl.textContent = isRegister ? t('auth.createAccount') : t('auth.signIn')
    }
  }

  loginTab.onclick = () => setMode('login')
  registerTab.onclick = () => setMode('register')

  let unsubscribeLogin: null | (() => void) = null
  unsubscribeLogin = options.auth.onLogin(() => {
    unsubscribeLogin?.()
    unsubscribeLogin = null
    dialog.dataset.closeable = 'true'
    if (dialog.open) dialog.close()
    options.onAuthenticated()
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorEl.hidden = true
    errorEl.textContent = ''
    messageEl.hidden = true
    messageEl.textContent = ''

    loginBtn.disabled = true
    loginTab.disabled = true
    registerTab.disabled = true

    try {
      if (mode === 'login') {
        const data = await api.post<AuthResponse>('/login', {
          email: emailInput.value,
          password: passwordInput.value,
        })

        options.auth.handleLoginSuccess(data)
      } else {
        await api.post('/register', {
          name: nameInput.value,
          email: emailInput.value,
          password: passwordInput.value,
        })

        messageEl.textContent = t('auth.accountCreated')
        messageEl.hidden = false
        passwordInput.value = ''
        nameInput.value = ''
        setMode('login')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errorEl.textContent = message
      errorEl.hidden = false
    } finally {
      loginBtn.disabled = false
      loginTab.disabled = false
      registerTab.disabled = false
    }
  })

  options.auth.renderGoogleButton(googleWrap)
}
