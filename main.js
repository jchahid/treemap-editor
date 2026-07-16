const { app, BrowserWindow, ipcMain } = require('electron');
const path  = require('path');
const url   = require('url');
const http  = require('http');
const crypto = require('crypto');

// Supprime les logs internes Chromium (quota DB, FIDO Bluetooth) dans le terminal
app.commandLine.appendSwitch('disable-logging');

let win;

// ─── Fenêtre principale ────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'dist/treemap-editor/favicon.ico'),
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'dist/treemap-editor/browser/index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  // win.webContents.openDevTools();

  win.on('closed', () => { win = null; });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (win === null) createWindow(); });

// ══════════════════════════════════════════════════════════════════════════════
//  Google OAuth 2.0 — flux PKCE pour application de bureau
//  Aucun client_secret requis (conforme aux recommandations Google pour desktop)
// ══════════════════════════════════════════════════════════════════════════════

/** Génère un code_verifier aléatoire (RFC 7636) */
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/** Calcule le code_challenge SHA-256 correspondant */
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Démarre un serveur HTTP local sur un port libre.
 * Retourne { port, waitForCode } où waitForCode est une Promise<string>
 * résolue dès réception du ?code= dans la requête de callback.
 */
function startCallbackServer(expectedState) {
  return new Promise((resolve) => {
    const server = http.createServer();

    const waitForCode = new Promise((resolveCode, rejectCode) => {
      server.on('request', (req, res) => {
        try {
          const parsedUrl = new URL(req.url, `http://127.0.0.1`);
          const code  = parsedUrl.searchParams.get('code');
          const error = parsedUrl.searchParams.get('error');
          const state = parsedUrl.searchParams.get('state');

          if (state !== expectedState) {
            throw new Error('invalid_state');
          }

          const html = code
            ? `<!DOCTYPE html><html lang="fr"><body style="font-family:sans-serif;text-align:center;padding:3rem;background:#f0fdf4">
                <div style="max-width:400px;margin:auto;background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.1)">
                  <div style="font-size:3rem">✅</div>
                  <h2 style="color:#065f46;margin:.5rem 0">Connexion réussie !</h2>
                  <p style="color:#6b7280">Vous pouvez fermer cette fenêtre.</p>
                </div>
                <script>setTimeout(()=>window.close(),2000)</script>
              </body></html>`
            : `<!DOCTYPE html><html lang="fr"><body style="font-family:sans-serif;text-align:center;padding:3rem;background:#fef2f2">
                <div style="max-width:400px;margin:auto;background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.1)">
                  <div style="font-size:3rem">❌</div>
                  <h2 style="color:#991b1b;margin:.5rem 0">Connexion annulée</h2>
                  <p style="color:#6b7280">${error || 'Opération annulée'}</p>
                </div>
              </body></html>`;

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
          server.close();

          if (code) resolveCode(code);
          else rejectCode(new Error(error || 'cancelled'));
        } catch (e) {
          rejectCode(e);
        }
      });
    });

    server.listen(0, '127.0.0.1', () => {
      resolve({ port: server.address().port, waitForCode, server });
    });
  });
}

/**
 * IPC handler appelé depuis le renderer Angular.
 * Ouvre une fenêtre Google OAuth, réalise l'échange PKCE,
 * retourne { idToken, accessToken } pour Firebase signInWithCredential.
 */
ipcMain.handle('google-oauth', async (event, { clientId }) => {
  const codeVerifier  = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state         = crypto.randomBytes(16).toString('hex');

  const { port, waitForCode, server } = await startCallbackServer(state);
  const redirectUri = `http://127.0.0.1:${port}`;

  // Construction de l'URL d'autorisation Google
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id',             clientId);
  authUrl.searchParams.set('redirect_uri',          redirectUri);
  authUrl.searchParams.set('response_type',         'code');
  authUrl.searchParams.set('scope',                 'openid email profile');
  authUrl.searchParams.set('code_challenge',        codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state',                 state);
  authUrl.searchParams.set('prompt',                'select_account');
  authUrl.searchParams.set('access_type',           'online');

  // Fenêtre dédiée à l'authentification.
  // contextIsolation: false → le preload partage le même monde JS que la page Google,
  // ce qui permet d'écraser PublicKeyCredential avant que Google ne le lise.
  const authWin = new BrowserWindow({
    width: 520,
    height: 680,
    title: 'Connexion Google',
    parent: win,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: path.join(__dirname, 'auth-preload.js'),
    },
  });

  authWin.setMenuBarVisibility(false);
  authWin.loadURL(authUrl.toString());

  // Nettoyage si l'utilisateur ferme la fenêtre manuellement
  authWin.on('closed', () => {
    server.close();
  });

  let code;
  try {
    code = await waitForCode;
  } catch (err) {
    if (!authWin.isDestroyed()) authWin.close();
    return { error: err.message };
  }

  // Ferme la fenêtre après un court délai (laisse le temps d'afficher le succès)
  setTimeout(() => { if (!authWin.isDestroyed()) authWin.close(); }, 1800);

  // ── Échange du code contre les tokens (PKCE, sans client_secret) ──────────
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:      clientId,
        redirect_uri:   redirectUri,
        grant_type:     'authorization_code',
        code_verifier:  codeVerifier,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      return { error: `Échange de token échoué : ${detail}` };
    }

    const tokens = await tokenRes.json();

    if (!tokens.id_token) {
      return { error: 'id_token absent de la réponse Google.' };
    }

    return {
      idToken:     tokens.id_token,
      accessToken: tokens.access_token,
    };

  } catch (err) {
    return { error: `Erreur réseau : ${err.message}` };
  }
});
