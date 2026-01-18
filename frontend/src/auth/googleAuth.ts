export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

import type { AuthResponse, User } from '@/types/auth'
import { api } from '@/utilities/api'

export class GoogleAuth {
  private userSection: HTMLElement
  private currentUser: User | null = null
  private loginListeners: Array<() => void> = []
  private logoutListeners: Array<() => void> = []

  constructor(elementId: string) {
    const el = document.getElementById(elementId)
    if (!el) {
      throw new Error(`Element with id ${elementId} not found`)
    }
    this.userSection = el
    this.loadUserFromStorage()
  }

  public init() {
    this.render()
  }

  public isAuthenticated(): boolean {
    return Boolean(this.currentUser)
  }

  public onLogin(listener: () => void) {
    this.loginListeners.push(listener)
    return () => {
      const idx = this.loginListeners.indexOf(listener)
      if (idx >= 0) this.loginListeners.splice(idx, 1)
    }
  }

  public onLogout(listener: () => void): () => void
  public onLogout(listener: () => void) {
    this.logoutListeners.push(listener)
    return () => {
      const idx = this.logoutListeners.indexOf(listener)
      if (idx >= 0) this.logoutListeners.splice(idx, 1)
    }
  }

  public renderGoogleButton(container: HTMLElement): void {
    if (!GOOGLE_CLIENT_ID) {
      console.error('VITE_GOOGLE_CLIENT_ID is not set')
      container.innerHTML = '<p class="error">Google Client ID not configured</p>'
      return
    }

    if (typeof google === 'undefined') {
      console.error('Google Identity Services script not loaded')
      return
    }

    container.innerHTML = ''

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: this.handleCredentialResponse.bind(this),
    })

    google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
    } as google.accounts.id.GsiButtonConfiguration)
  }

  private loadUserFromStorage() {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (storedUser && token) {
      this.currentUser = JSON.parse(storedUser)
    }
  }

  private async handleCredentialResponse(response: google.accounts.id.CredentialResponse) {
    try {
      const data = await api.post<AuthResponse>('/oauth', { credential: response.credential })
      this.handleLoginSuccess(data)
    } catch (error) {
      console.error('Error logging in:', error)
      alert('Login failed. Please try again.')
    }
  }

  public handleLoginSuccess(data: AuthResponse) {
    this.currentUser = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    this.render()
    for (const listener of this.loginListeners) {
      listener()
    }
  }

  private clearAppStorage(): void {
    const keysToRemove = new Set<string>([
      'token',
      'user',
      'puzzle',
      'board',
      'level',
      'snake-difficulty',
      'snake-highscore',
    ])

    for (const k of keysToRemove) {
      localStorage.removeItem(k)
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith('input-') || k.startsWith('snake-')) {
        localStorage.removeItem(k)
      }
    }
  }

  public handleLogout() {
    this.currentUser = null
    this.clearAppStorage()
    this.render()

    for (const listener of this.logoutListeners) {
      listener()
    }
  }

  private render() {
    this.userSection.innerHTML = ''

    if (this.currentUser) {
      const userInfo = document.createElement('div')
      userInfo.className = 'user-info'
      userInfo.innerHTML = `
        <span>Welcome, ${this.currentUser.name || this.currentUser.email}</span>
      `

      const logoutBtn = document.createElement('button')
      logoutBtn.textContent = 'Logout'
      logoutBtn.className = 'logout-btn'
      logoutBtn.onclick = () => this.handleLogout()

      userInfo.appendChild(logoutBtn)
      this.userSection.appendChild(userInfo)
    }
    // If not logged in, the initGoogleBtn will render the button into userSection
    // but we need to make sure we don't clear it if we are just calling render()
    // Actually, initGoogleBtn renders *into* the element.
  }
}
