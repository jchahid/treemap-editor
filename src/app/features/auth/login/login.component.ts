import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div class="login-page">
      <div class="login-card">

        <!-- Logo + titre -->
        <div class="logo-section">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="4" r="2"/>
              <line x1="12" y1="6" x2="12" y2="11"/>
              <circle cx="5" cy="18" r="2"/>
              <circle cx="19" cy="18" r="2"/>
              <line x1="12" y1="11" x2="5" y2="16"/>
              <line x1="12" y1="11" x2="19" y2="16"/>
            </svg>
          </div>
          <h1>TreeMap Editor</h1>
          <p class="subtitle">Choisissez comment vous connecter</p>
        </div>

        <!-- Bouton Google (Gmail) -->
        <button class="google-btn" (click)="loginWithGoogle()" [disabled]="auth.loading()">
          @if (googleLoading()) {
            <span class="spinner"></span>
            <span>Connexion en cours…</span>
          } @else {
            <svg viewBox="0 0 48 48" width="20" height="20">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Se connecter avec Gmail</span>
          }
        </button>

        <!-- Erreur Firebase / OAuth -->
        @if (errorMsg()) {
          <p class="error-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMsg() }}
          </p>
        }

        <!-- Séparateur -->
        <div class="divider"><span>ou</span></div>

        <!-- Bouton Invité -->
        <button class="guest-btn" (click)="loginAsGuest()" [disabled]="auth.loading()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Continuer en tant qu'invité</span>
        </button>

        <p class="guest-note">
          En mode invité, vos projets sont sauvegardés localement sur cet appareil.
        </p>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #EEF2FF 0%, #F8F7F4 55%, #E0E7FF 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem; overflow-y: auto;
    }

    .login-card {
      width: 100%; max-width: 400px;
      background: #fff; border-radius: 1.5rem; padding: 2.5rem;
      box-shadow: 0 20px 60px rgba(79,70,229,.12), 0 4px 16px rgba(0,0,0,.08);
      animation: slideUp .4s ease-out;
    }

    /* ── Logo ── */
    .logo-section { text-align: center; margin-bottom: 2.25rem; }
    .logo-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 68px; height: 68px;
      background: linear-gradient(135deg, #6366F1, #4F46E5);
      border-radius: 1.125rem; margin-bottom: 1.125rem;
      box-shadow: 0 8px 28px rgba(79,70,229,.32);
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: .25rem; }
    .subtitle { color: #6B7280; font-size: .875rem; }

    /* ── Bouton Google ── */
    .google-btn {
      display: flex; align-items: center; justify-content: center; gap: .875rem;
      width: 100%; padding: .875rem 1rem;
      border: 1.5px solid #E5E7EB; border-radius: .875rem;
      background: #fff; color: #111827;
      font-size: 1rem; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: all 150ms;
      &:hover:not(:disabled) {
        background: #F9FAFB; border-color: #C7D2FE;
        box-shadow: 0 2px 12px rgba(0,0,0,.08);
      }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }

    /* ── Erreur ── */
    .error-box {
      display: flex; align-items: flex-start; gap: .5rem;
      padding: .75rem; margin-top: .75rem;
      background: #FEF2F2; border: 1px solid #FECACA; border-radius: .75rem;
      color: #DC2626; font-size: .8125rem; line-height: 1.5;
      svg { flex-shrink: 0; margin-top: 1px; }
    }

    /* ── Séparateur ── */
    .divider {
      position: relative; text-align: center; margin: 1.25rem 0;
      &::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; border-top: 1px solid #E5E7EB; }
      span { position: relative; background: #fff; padding: 0 .875rem; color: #9CA3AF; font-size: .8125rem; }
    }

    /* ── Bouton Invité ── */
    .guest-btn {
      display: flex; align-items: center; justify-content: center; gap: .875rem;
      width: 100%; padding: .875rem 1rem;
      border: 1.5px dashed #D1D5DB; border-radius: .875rem;
      background: #FAFAFA; color: #6B7280;
      font-size: 1rem; font-weight: 500; font-family: inherit;
      cursor: pointer; transition: all 150ms;
      &:hover:not(:disabled) {
        background: #F3F4F6; border-color: #9CA3AF; color: #374151;
      }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }

    .guest-note {
      margin-top: 1.25rem; text-align: center;
      font-size: .75rem; color: #9CA3AF; line-height: 1.6;
    }

    /* ── Spinner ── */
    .spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2px solid #E5E7EB; border-top-color: #6366F1;
      border-radius: 50%; animation: spin .6s linear infinite;
    }

    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class LoginComponent {
  auth   = inject(AuthService);
  router = inject(Router);

  googleLoading = signal(false);
  errorMsg      = signal('');

  async loginWithGoogle() {
    this.errorMsg.set('');
    this.googleLoading.set(true);
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.errorMsg.set(e.message ?? 'Erreur inconnue.');
    } finally {
      this.googleLoading.set(false);
    }
  }

  loginAsGuest() {
    this.auth.loginAsGuest();
    this.router.navigate(['/dashboard']);
  }
}
