import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TreeMapListService } from '../../core/services/treemap-list.service';
import { TreemapCardComponent } from './treemap-card/treemap-card.component';

function sanitizeHtml(html: string): string {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const allowedTags = ['B', 'I', 'U', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'P', 'BR', 'DIV', 'SPAN'];
    const allElements = doc.body.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (!allowedTags.includes(el.tagName)) {
        el.remove();
        continue;
      }
      const attrs = el.attributes;
      for (let j = attrs.length - 1; j >= 0; j--) {
        const attrName = attrs[j].name.toLowerCase();
        if (attrName.startsWith('on') || attrName === 'href' && attrs[j].value.trim().toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attrs[j].name);
        }
      }
    }
    return doc.body.innerHTML;
  } catch (e) {
    console.error('HTML Sanitization error:', e);
    return '';
  }
}

function sanitizeTreeNode(node: any): void {
  if (!node) return;
  if (typeof node.content === 'string') {
    node.content = sanitizeHtml(node.content);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      sanitizeTreeNode(child);
    }
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, TreemapCardComponent],
  template: `
    <!-- ─── Barre de navigation ─────────────────────────────────── -->
    <nav class="navbar">
      <div class="nav-inner">
        <div class="nav-brand">
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="11"/>
              <circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/>
              <line x1="12" y1="11" x2="5" y2="16"/><line x1="12" y1="11" x2="19" y2="16"/>
            </svg>
          </div>
          <span class="brand-name">TreeMap Editor</span>
        </div>

        <div class="nav-user">
          <div class="user-info">
            <div class="user-avatar">{{ userInitial() }}</div>
            <span class="user-name">{{ auth.user()?.displayName }}</span>
          </div>
          <button class="todo-nav-btn" (click)="goToTodo()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Todo List
          </button>
          <button class="logout-btn" (click)="logout()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>

    <!-- ─── Contenu principal ─────────────────────────────────────── -->
    <main class="page-main">
      <div class="page-content">

        <!-- En-tête de page -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Mes TreeMaps</h1>
            <p class="page-sub">Gérez et visualisez vos projets de cartographie</p>
          </div>
          <div class="header-actions">
            <button class="action-btn action-btn--secondary" (click)="triggerImport()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Importer JSON
            </button>
            @if (list.total() > 0) {
              <button class="action-btn action-btn--secondary" (click)="exportAll()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exporter Tout
              </button>
            }
            <button class="create-btn" (click)="showModal.set(true)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nouveau TreeMap
            </button>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon stat-icon--total">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div><p class="stat-val">{{ list.total() }}</p><p class="stat-lbl">Total</p></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--progress">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-.08-8.01"/>
              </svg>
            </div>
            <div><p class="stat-val">{{ list.inProgress() }}</p><p class="stat-lbl">En cours</p></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--done">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div><p class="stat-val">{{ list.completed() }}</p><p class="stat-lbl">Terminés</p></div>
          </div>
        </div>

        <!-- Barre de recherche -->
        <div class="search-bar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text"
                 [ngModel]="searchQuery()"
                 (ngModelChange)="searchQuery.set($event)"
                 placeholder="Rechercher un TreeMap…" />
        </div>

        <!-- Erreur Firestore -->
        @if (list.syncError()) {
          <div class="sync-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>
              Synchronisation Firestore impossible : <strong>{{ list.syncError() }}</strong>.
              Tes maps ne sont sauvegardées que localement.
              Active Firestore dans ta
              <a href="https://console.firebase.google.com" target="_blank" rel="noopener">Firebase Console</a>
              et vérifie les Security Rules.
            </span>
          </div>
        }

        <!-- Grille ou état vide -->
        @if (list.loading()) {
          <div class="loading-state">
            <span class="spinner"></span>
            <p>Chargement de vos TreeMaps…</p>
          </div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="11"/>
                <circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/>
                <line x1="12" y1="11" x2="5" y2="16"/><line x1="12" y1="11" x2="19" y2="16"/>
              </svg>
            </div>
            @if (searchQuery()) {
              <p class="empty-title">Aucun résultat pour "{{ searchQuery() }}"</p>
              <p class="empty-sub">Essayez avec un autre terme de recherche</p>
            } @else {
              <p class="empty-title">Aucun TreeMap pour l'instant</p>
              <p class="empty-sub">Créez votre premier projet pour commencer</p>
              <button class="create-btn" (click)="showModal.set(true)">Créer mon premier TreeMap</button>
            }
          </div>
        } @else {
          <div class="treemap-grid">
            @for (tm of filtered(); track tm.id) {
              <app-treemap-card [treemap]="tm"
                                (edit)="onEdit($event)"
                                (delete)="onDelete($event)"
                                (rename)="onRename($event)" />
            }
          </div>
        }

      </div>
    </main>

    <!-- ─── Modal de création ──────────────────────────────────────── -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>Nouveau TreeMap</h2>
            <button class="modal-close" (click)="closeModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <form class="modal-body" (ngSubmit)="onCreate()">
            <div class="modal-field">
              <label for="newTitle">Titre du TreeMap</label>
              <input id="newTitle" type="text" name="newTitle" [(ngModel)]="newTitle"
                     placeholder="Ex : Architecture système" required autofocus />
            </div>
            <div class="modal-footer">
              <button type="button" class="modal-btn modal-btn--cancel" (click)="closeModal()">Annuler</button>
              <button type="submit"  class="modal-btn modal-btn--create" [disabled]="!newTitle.trim()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow-y: auto; background: #F8F7F4; }

    /* ── Todo List Modal ── */
    .todo-nav-btn {
      display: flex; align-items: center; gap: .375rem;
      padding: .4375rem .875rem;
      border: 1.5px solid #E5E7EB; border-radius: .625rem;
      background: #fff; color: #4F46E5;
      font-size: .8125rem; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 150ms;
      &:hover { border-color: #6366F1; background: #EEF2FF; }
    }

    /* ── Navbar ── */
    .navbar {
      position: sticky; top: 0; background: #fff;
      border-bottom: 1px solid #E5E7EB; z-index: 100;
      box-shadow: 0 1px 0 #E5E7EB;
    }
    .nav-inner {
      max-width: 1280px; margin: 0 auto; padding: 0 1.5rem;
      height: 64px; display: flex; align-items: center; justify-content: space-between;
    }
    .nav-brand { display: flex; align-items: center; gap: .75rem; }
    .brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366F1, #4F46E5);
      border-radius: .625rem;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name { font-weight: 700; font-size: 1.0625rem; color: #111827; }

    .nav-user { display: flex; align-items: center; gap: 1rem; }
    .user-info { display: flex; align-items: center; gap: .625rem; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #4F46E5); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: .875rem; font-weight: 600;
    }
    .user-name { font-size: .875rem; font-weight: 500; color: #374151; }
    .logout-btn {
      display: flex; align-items: center; gap: .375rem;
      padding: .4375rem .875rem;
      border: 1.5px solid #E5E7EB; border-radius: .625rem;
      background: #fff; color: #6B7280;
      font-size: .8125rem; font-weight: 500; font-family: inherit; cursor: pointer;
      transition: all 150ms;
      &:hover { border-color: #FCA5A5; color: #DC2626; background: #FEF2F2; }
    }

    /* ── Page ── */
    .page-main { padding-bottom: 3rem; }
    .page-content { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;
    }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; }
    .page-sub   { font-size: .875rem; color: #9CA3AF; margin-top: .25rem; }

    .header-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
    .action-btn {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .625rem 1.25rem;
      border-radius: .75rem;
      font-size: .9375rem; font-weight: 600; font-family: inherit; cursor: pointer;
      white-space: nowrap; transition: all 150ms;
      &.action-btn--secondary {
        background: #fff; color: #4B5563; border: 1.5px solid #E5E7EB;
        &:hover { background: #F9FAFB; border-color: #D1D5DB; color: #111827; }
      }
    }

    .create-btn {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .625rem 1.25rem;
      background: linear-gradient(135deg, #6366F1, #4F46E5); color: #fff;
      border: none; border-radius: .75rem;
      font-size: .9375rem; font-weight: 600; font-family: inherit; cursor: pointer;
      white-space: nowrap; transition: all 150ms;
      &:hover {
        background: linear-gradient(135deg, #4F46E5, #4338CA);
        box-shadow: 0 4px 16px rgba(79,70,229,.35);
        transform: translateY(-1px);
      }
    }

    /* ── Statistiques ── */
    .stats-row {
      display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.5rem;
    }
    .stat-card {
      background: #fff; border-radius: 1rem; padding: 1.25rem;
      border: 1.5px solid #F3F4F6;
      display: flex; align-items: center; gap: 1rem;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .stat-icon {
      width: 44px; height: 44px; border-radius: .75rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      &.stat-icon--total    { background: #EEF2FF; color: #4F46E5; }
      &.stat-icon--progress { background: #DBEAFE; color: #2563EB; }
      &.stat-icon--done     { background: #D1FAE5; color: #059669; }
    }
    .stat-val { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .stat-lbl { font-size: .8125rem; color: #9CA3AF; }

    /* ── Recherche ── */
    .search-bar {
      display: flex; align-items: center; gap: .75rem;
      background: #fff; border: 1.5px solid #E5E7EB; border-radius: .75rem;
      padding: 0 1rem; margin-bottom: 1.5rem; color: #9CA3AF;
      input {
        flex: 1; border: none; outline: none;
        padding: .75rem 0; background: transparent;
        font-size: .9375rem; color: #111827; font-family: inherit;
        &::placeholder { color: #D1D5DB; }
      }
    }

    /* ── Grille ── */
    .treemap-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;
      animation: fadeIn .3s ease-out;
    }

    /* ── Erreur sync ── */
    .sync-error {
      display: flex; align-items: flex-start; gap: .625rem;
      padding: .875rem 1rem; margin-bottom: 1.25rem;
      background: #FFF7ED; border: 1.5px solid #FED7AA; border-radius: .75rem;
      color: #C2410C; font-size: .875rem; line-height: 1.5;
      svg { flex-shrink: 0; margin-top: 2px; }
      a { color: #C2410C; font-weight: 600; }
    }

    /* ── Chargement ── */
    .loading-state {
      text-align: center; padding: 4rem 2rem;
      display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #9CA3AF;
      p { font-size: .9375rem; }
    }
    .spinner {
      display: inline-block; width: 32px; height: 32px;
      border: 3px solid #E5E7EB; border-top-color: #6366F1;
      border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── État vide ── */
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 80px; height: 80px; background: #EEF2FF; border-radius: 50%;
      color: #6366F1; margin-bottom: 1.25rem;
    }
    .empty-title { font-size: 1.0625rem; font-weight: 600; color: #374151; margin-bottom: .375rem; }
    .empty-sub   { font-size: .875rem; color: #9CA3AF; margin-bottom: 1.5rem; }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; padding: 1rem; animation: fadeIn .15s ease-out;
    }
    .modal {
      background: #fff; border-radius: 1.25rem; width: 100%; max-width: 440px;
      box-shadow: 0 24px 64px rgba(0,0,0,.2); animation: slideUp .25s ease-out;
    }
    .modal-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.5rem 1.5rem 0;
      h2 { font-size: 1.125rem; font-weight: 700; color: #111827; }
    }
    .modal-close {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: .5rem; background: #F9FAFB; color: #6B7280;
      cursor: pointer; transition: all 150ms;
      &:hover { background: #F3F4F6; color: #111827; }
    }
    .modal-body { padding: 1.25rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .modal-field {
      display: flex; flex-direction: column; gap: .375rem;
      label { font-size: .875rem; font-weight: 500; color: #374151; }
      input {
        width: 100%; padding: .625rem .875rem;
        border: 1.5px solid #E5E7EB; border-radius: .625rem;
        font-size: .9375rem; background: #fff; color: #111827; font-family: inherit;
        &:focus { outline: none; border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
      }
    }
    .modal-footer { display: flex; gap: .75rem; justify-content: flex-end; }
    .modal-btn {
      padding: .5625rem 1.25rem; border-radius: .625rem;
      font-size: .875rem; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: all 150ms;
      &.modal-btn--cancel {
        background: #F9FAFB; color: #6B7280; border: 1.5px solid #E5E7EB;
        &:hover { background: #F3F4F6; }
      }
      &.modal-btn--create {
        display: flex; align-items: center; gap: .375rem; border: none;
        background: linear-gradient(135deg, #6366F1, #4F46E5); color: #fff;
        &:hover:not(:disabled) { background: linear-gradient(135deg, #4F46E5, #4338CA); box-shadow: 0 4px 12px rgba(79,70,229,.3); }
        &:disabled { opacity: .5; cursor: not-allowed; }
      }
    }

    @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 640px) {
      .stats-row { grid-template-columns: 1fr; }
      .user-name  { display: none; }
    }
  `],
})
export class DashboardComponent {
  auth = inject(AuthService);
  list = inject(TreeMapListService);
  router = inject(Router);

  showModal  = signal(false);
  searchQuery = signal('');
  newTitle = '';

  userInitial = computed(() => (this.auth.user()?.displayName ?? '?').charAt(0).toUpperCase());

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.list.treemaps();
    return this.list.treemaps().filter(t => t.title.toLowerCase().includes(q));
  });

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  onEdit(id: string)   { this.router.navigate(['/editor', id]); }
  onDelete(id: string) { this.list.remove(id); }
  onRename(event: { id: string, title: string }) { this.list.update(event.id, { title: event.title }); }

  onCreate() {
    const title = this.newTitle.trim();
    if (!title) return;
    const doc = this.list.create(title);
    this.closeModal();
    this.router.navigate(['/editor', doc.id]);
  }

  triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.json';
    input.onchange = (e: any) => {
      const files: FileList = e.target.files;
      if (!files || files.length === 0) return;
      this.importFiles(files);
    };
    input.click();
  }

  importFiles(files: FileList) {
    let importedCount = 0;
    let errorCount = 0;

    const promises = Array.from(files).map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const content = event.target.result;
            const parsed = JSON.parse(content);
            
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (this.isValidTreeMapDoc(item)) {
                  sanitizeTreeNode(item.data.root);
                  this.list.importTreeMap(item);
                  importedCount++;
                } else {
                  errorCount++;
                }
              }
            } else if (this.isValidTreeMapDoc(parsed)) {
              sanitizeTreeNode(parsed.data.root);
              this.list.importTreeMap(parsed);
              importedCount++;
            } else if (parsed.root && parsed.name) {
              const now = new Date().toISOString();
              sanitizeTreeNode(parsed.root);
              const treemap = {
                id: crypto.randomUUID(),
                title: parsed.name,
                status: 'en-cours' as const,
                createdAt: now,
                updatedAt: now,
                data: parsed
              };
              this.list.importTreeMap(treemap);
              importedCount++;
            } else {
              errorCount++;
            }
          } catch (e) {
            errorCount++;
          }
          resolve();
        };
        reader.onerror = () => {
          errorCount++;
          resolve();
        };
        reader.readAsText(file);
      });
    });

    Promise.all(promises).then(() => {
      if (importedCount > 0) {
        alert(`Succès : ${importedCount} TreeMap(s) importé(s) avec succès !`);
      }
      if (errorCount > 0) {
        alert(`Erreur : ${errorCount} fichier(s) ou élément(s) n'ont pas pu être importés (format invalide).`);
      }
    });
  }

  exportAll() {
    const list = this.list.treemaps();
    if (list.length === 0) return;
    
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `treemaps_export_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private isValidTreeMapDoc(obj: any): boolean {
    return obj && typeof obj === 'object' && typeof obj.title === 'string' && obj.data && typeof obj.data.root === 'object';
  }

  goToTodo() {
    this.router.navigate(['/todo']);
  }

  closeModal() { this.showModal.set(false); this.newTitle = ''; }
}
