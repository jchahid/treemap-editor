/**
 * auth-preload.js — s'exécute dans le monde JS de la page Google OAuth,
 * AVANT tout script Google, grâce à contextIsolation: false.
 *
 * Mettre PublicKeyCredential à undefined signale au navigateur que WebAuthn
 * n'est pas disponible. Google détecte ça et bascule automatiquement sur le
 * flux mot de passe classique au lieu de demander une clé d'accès (passkey).
 */
try {
  Object.defineProperty(window, 'PublicKeyCredential', {
    get: () => undefined,
    configurable: true,
  });
} catch (_) {
  // ignore si déjà défini non-configurable
}
