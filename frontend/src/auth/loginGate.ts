import type { AuthResponse } from '@/types/auth'
import { api } from '@/utilities/api'
import { showAppModal } from '@/component/appModal'
import { GoogleAuth } from '@/auth/googleAuth'

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
  loginTab.textContent = 'Login'

  const registerTab = document.createElement('button')
  registerTab.type = 'button'
  registerTab.className = 'login-gate-tab'
  registerTab.textContent = 'Register'

  tabs.appendChild(loginTab)
  tabs.appendChild(registerTab)

  const form = document.createElement('form')
  form.className = 'login-gate-form'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.name = 'name'
  nameInput.placeholder = 'Name (optional)'
  nameInput.autocomplete = 'name'
  nameInput.required = false
  nameInput.className = 'login-gate-input'
  nameInput.hidden = true

  const emailInput = document.createElement('input')
  emailInput.type = 'email'
  emailInput.name = 'email'
  emailInput.placeholder = 'Email'
  emailInput.autocomplete = 'email'
  emailInput.required = true
  emailInput.className = 'login-gate-input'

  const passwordInput = document.createElement('input')
  passwordInput.type = 'password'
  passwordInput.name = 'password'
  passwordInput.placeholder = 'Password'
  passwordInput.autocomplete = 'current-password'
  passwordInput.required = true
  passwordInput.className = 'login-gate-input'

  const loginBtn = document.createElement('button')
  loginBtn.type = 'submit'
  loginBtn.className = 'login-gate-submit'
  loginBtn.textContent = 'Login'

  form.appendChild(messageEl)
  form.appendChild(errorEl)
  form.appendChild(nameInput)
  form.appendChild(emailInput)
  form.appendChild(passwordInput)
  form.appendChild(loginBtn)

  const divider = document.createElement('div')
  divider.className = 'login-gate-divider'
  divider.textContent = 'or'

  const googleWrap = document.createElement('div')
  googleWrap.className = 'login-gate-google'

  body.appendChild(tabs)
  body.appendChild(form)
  body.appendChild(divider)
  body.appendChild(googleWrap)

  const dialog = showAppModal({
    id: 'login-gate-modal',
    title: 'Sign in',
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

    loginBtn.textContent = isRegister ? 'Create account' : 'Login'
    passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password'

    if (modalTitleEl instanceof HTMLElement) {
      modalTitleEl.textContent = isRegister ? 'Create account' : 'Sign in'
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

        messageEl.textContent = 'Account created. Please login.'
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
