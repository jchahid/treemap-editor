import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  UserCredential,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'guest';
}

const firebaseApp  = getApps().length ? getApp() : initializeApp(environment.firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
setPersistence(firebaseAuth, browserLocalPersistence);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'treemap-auth-user';
  private readonly zone = inject(NgZone);

  private _user    = signal<AuthUser | null>(this.loadUser());
  private _loading = signal(false);

  readonly user       = this._user.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor() {
    onAuthStateChanged(firebaseAuth, fbUser => {
      this.zone.run(() => {
        if (fbUser && this._user()?.provider !== 'guest') {
          this._persist(this.mapFirebaseUser(fbUser));
        }
      });
    });
  }

  // ─── Point d'entrée unique ────────────────────────────────────────────────
  async loginWithGoogle(): Promise<void> {
    this._loading.set(true);
    try {
      const result = this.isElectron()
        ? await this.loginElectron()
        : await this.loginWeb();

      // Persiste AVANT de retourner → authGuard voit isLoggedIn() === true
      // dès que le composant appelle router.navigate('/dashboard').
      this._persist(this.mapFirebaseUser(result.user));

    } finally {
      this._loading.set(false);
    }
  }

  // ─── Invité ───────────────────────────────────────────────────────────────
  loginAsGuest(): void {
    this._persist({
      id: 'guest-' + crypto.randomUUID(),
      email: '',
      displayName: 'Invité',
      provider: 'guest',
    });
  }

  // ─── Déconnexion ─────────────────────────────────────────────────────────
  logout(): void {
    const provider = this._user()?.provider;
    this._user.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    if (provider === 'google') signOut(firebaseAuth);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Flux NAVIGATEUR (Netlify / ng serve)
  //  Firebase signInWithPopup — fonctionne dans tout navigateur moderne.
  // ══════════════════════════════════════════════════════════════════════════
  private async loginWeb(): Promise<UserCredential> {
    try {
      return await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    } catch (err: any) {
      throw new Error(this.translateFirebaseError(err));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Flux ELECTRON (app desktop)
  //  IPC → fenêtre OAuth dédiée → échange PKCE → signInWithCredential
  // ══════════════════════════════════════════════════════════════════════════
  private async loginElectron(): Promise<UserCredential> {
    const api = (window as any).electronAPI;
    const result = await api.googleOauth(environment.googleClientId);

    if (result.error) throw new Error(result.error);

    const credential = GoogleAuthProvider.credential(result.idToken, result.accessToken);
    try {
      return await signInWithCredential(firebaseAuth, credential);
    } catch (err: any) {
      throw new Error(this.translateFirebaseError(err));
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** true si window.electronAPI existe (posé par preload.js uniquement dans Electron) */
  private isElectron(): boolean {
    return !!(window as any).electronAPI;
  }

  private mapFirebaseUser(user: any): AuthUser {
    return {
      id:          user.uid,
      email:       user.email ?? '',
      displayName: user.displayName ?? 'Utilisateur Google',
      photoURL:    user.photoURL ?? undefined,
      provider:    'google',
    };
  }

  private translateFirebaseError(err: any): string {
    const code: string = err?.code ?? '';
    const map: Record<string, string> = {
      'auth/popup-closed-by-user':
        'Fenêtre de connexion fermée. Réessayez.',
      'auth/popup-blocked':
        'Popup bloquée par le navigateur. Autorisez les popups pour ce site.',
      'auth/invalid-credential':
        'Token Google invalide. Dans Firebase Console → Auth → Google → ajoutez le Client ID Desktop dans "ID clients OAuth supplémentaires".',
      'auth/invalid-oauth-client-id':
        'Client ID OAuth non reconnu par Firebase.',
      'auth/unauthorized-domain':
        'Domaine non autorisé. Dans Firebase Console → Auth → Paramètres → Domaines autorisés, ajoutez votre domaine Netlify.',
      'auth/network-request-failed':
        'Erreur réseau. Vérifiez votre connexion.',
      'auth/user-disabled':
        'Ce compte a été désactivé.',
      'auth/cancelled-popup-request':
        'Une connexion est déjà en cours.',
    };
    return map[code] ?? `Erreur Firebase [${code || 'inconnue'}] : ${err?.message ?? ''}`;
  }

  private _persist(user: AuthUser): void {
    this._user.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
