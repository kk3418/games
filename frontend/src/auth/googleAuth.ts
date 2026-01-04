export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

import type { AuthResponse, User } from '@/types/auth';

export class GoogleAuth {
  private userSection: HTMLElement;
  private currentUser: User | null = null;

  constructor(elementId: string) {
    const el = document.getElementById(elementId);
    if (!el) {
      throw new Error(`Element with id ${elementId} not found`);
    }
    this.userSection = el;
    this.loadUserFromStorage();
  }

  public init() {
    this.render();
    if (!this.currentUser) {
      this.initGoogleBtn();
    }
  }

  private loadUserFromStorage() {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  private initGoogleBtn() {
    if (!GOOGLE_CLIENT_ID) {
      console.error('VITE_GOOGLE_CLIENT_ID is not set');
      this.userSection.innerHTML = '<p class="error">Google Client ID not configured</p>';
      return;
    }

    if (typeof google === 'undefined') {
      console.error('Google Identity Services script not loaded');
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: this.handleCredentialResponse.bind(this)
    });

    google.accounts.id.renderButton(
      this.userSection,
      { theme: "outline", size: "large", type: "standard" } as google.accounts.id.GsiButtonConfiguration
    );
  }

  private async handleCredentialResponse(response: google.accounts.id.CredentialResponse) {
    try {
      const res = await fetch(`${BACKEND_URL}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data: AuthResponse = await res.json();
      this.handleLoginSuccess(data);
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed. Please try again.');
    }
  }

  private handleLoginSuccess(data: AuthResponse) {
    this.currentUser = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.render();
  }

  private handleLogout() {
    this.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.render();
    // Re-initialize Google button after logout
    this.initGoogleBtn();
  }

  private render() {
    this.userSection.innerHTML = '';

    if (this.currentUser) {
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      userInfo.innerHTML = `
        <span>Welcome, ${this.currentUser.name || this.currentUser.email}</span>
      `;

      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Logout';
      logoutBtn.className = 'logout-btn';
      logoutBtn.onclick = () => this.handleLogout();

      userInfo.appendChild(logoutBtn);
      this.userSection.appendChild(userInfo);
    }
    // If not logged in, the initGoogleBtn will render the button into userSection
    // but we need to make sure we don't clear it if we are just calling render()
    // Actually, initGoogleBtn renders *into* the element.
  }
}
