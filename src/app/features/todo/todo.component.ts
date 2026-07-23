import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DailyTodoService, TodoTask } from '../../core/services/daily-todo.service';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- ─── Barre de navigation ─────────────────────────────────── -->
    <nav class="navbar">
      <div class="nav-inner">
        <div class="nav-brand" (click)="goBack()" style="cursor: pointer;">
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
            <h1 class="page-title">Ma Todo List</h1>
            <p class="page-sub">Gérez et suivez vos objectifs quotidiens</p>
          </div>
          <button class="back-btn" (click)="goBack()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Retour aux TreeMaps
          </button>
        </div>

        <!-- Layout en 2 colonnes -->
        <div class="todo-layout">
          
          <!-- Colonne gauche : Suivi Journalier -->
          <section class="todo-section daily-section">
            <div class="section-card">
              <div class="section-header">
                <h2>Suivi Journalier</h2>
                
                <!-- Date navigator -->
                <div class="date-navigator">
                  <button class="nav-arrow-btn" (click)="navigateDate(-1)" title="Jour précédent">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <div class="date-label">
                    <span class="date-friendly">{{ friendlyDate() }}</span>
                    @if (!isToday()) {
                      <button class="today-btn" (click)="goToToday()">Aujourd'hui</button>
                    }
                  </div>
                  <button class="nav-arrow-btn" (click)="navigateDate(1)" title="Jour suivant">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Liste des tâches journalières -->
              <div class="todo-list-items">
                @for (task of dailyTasks(); track task.id; let i = $index) {
                  <div class="todo-item-row" [class.completed]="task.completed">
                    <label class="todo-checkbox-wrapper">
                      <input type="checkbox" [checked]="task.completed" (change)="toggleDailyTask(i)" />
                      <span class="todo-text">{{ task.label }}</span>
                    </label>
                    <button class="delete-task-btn" (click)="deleteDailyTask(i)" title="Supprimer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                } @empty {
                  <div class="todo-empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>Aucune tâche enregistrée pour ce jour.</p>
                  </div>
                }
              </div>

              <!-- Formulaire d'ajout pour le jour même -->
              <form class="todo-add-form" (ngSubmit)="addDailyTask()">
                <input type="text" [(ngModel)]="newTodoText" name="newTodoText" placeholder="Ajouter une tâche spécifique pour ce jour…" required />
                <button type="submit" [disabled]="!newTodoText.trim()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ajouter
                </button>
              </form>
            </div>
          </section>

          <!-- Colonne droite : Modèle par défaut -->
          <section class="todo-section template-section">
            <div class="section-card">
              <div class="section-header">
                <h2>Modèle par Défaut</h2>
              </div>
              
              <div class="defaults-explanation">
                <p>Configurez ici la liste de tâches de départ. Chaque nouvelle journée ouverte initialisera sa liste de tâches à partir de ce modèle.</p>
              </div>

              <!-- Liste des tâches par défaut -->
              <div class="todo-list-items">
                @for (task of defaultTasks(); track task.id; let i = $index) {
                  <div class="todo-item-row">
                    <span class="todo-text">{{ task.label }}</span>
                    <button class="delete-task-btn" (click)="deleteDefaultTask(task.id)" title="Supprimer du modèle">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                } @empty {
                  <div class="todo-empty">
                    <p>Aucune tâche par défaut définie.</p>
                  </div>
                }
              </div>

              <!-- Formulaire d'ajout au modèle par défaut -->
              <form class="todo-add-form" (ngSubmit)="addDefaultTask()">
                <input type="text" [(ngModel)]="newDefaultText" name="newDefaultText" placeholder="Nouvelle tâche récurrente…" required />
                <button type="submit" [disabled]="!newDefaultText.trim()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ajouter
                </button>
              </form>
            </div>
          </section>

        </div>

      </div>
    </main>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow-y: auto; background: #F8F7F4; }

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

    /* ── Page Header ── */
    .page-main { padding-bottom: 3rem; }
    .page-content { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;
    }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; }
    .page-sub   { font-size: .875rem; color: #9CA3AF; margin-top: .25rem; }

    .back-btn {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .625rem 1.25rem;
      background: #fff; color: #4B5563; border: 1.5px solid #E5E7EB;
      border-radius: .75rem;
      font-size: .9375rem; font-weight: 600; font-family: inherit; cursor: pointer;
      white-space: nowrap; transition: all 150ms;
      &:hover { background: #F9FAFB; border-color: #D1D5DB; color: #111827; }
    }

    /* ── Layout & Sections ── */
    .todo-layout {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    .section-card {
      background: #fff;
      border-radius: 1.25rem;
      padding: 1.5rem;
      border: 1.5px solid #F3F4F6;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      h2 { font-size: 1.125rem; font-weight: 700; color: #111827; }
    }

    /* Date Navigator */
    .date-navigator {
      display: flex; align-items: center; gap: .75rem;
      background: #F3F4F6; padding: .375rem .625rem; border-radius: .625rem;
    }
    .nav-arrow-btn {
      width: 28px; height: 28px; border-radius: .5rem; border: none;
      background: #fff; color: #4B5563; display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,.05);
      transition: all 150ms;
      &:hover { background: #EEF2FF; color: #4F46E5; }
    }
    .date-label { display: flex; align-items: center; gap: .5rem; }
    .date-friendly { font-size: .875rem; font-weight: 700; color: #111827; }
    .today-btn {
      padding: .25rem .5rem; font-size: .75rem; font-weight: 600;
      background: #4F46E5; color: #fff; border: none; border-radius: .375rem;
      cursor: pointer; transition: all 150ms;
      &:hover { background: #4338CA; }
    }

    /* Items */
    .todo-list-items {
      display: flex; flex-direction: column; gap: .75rem;
      max-height: 450px; overflow-y: auto; padding-right: .25rem;
    }
    .todo-item-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1.125rem; background: #F9FAFB; border: 1.5px solid #F3F4F6;
      border-radius: .75rem; transition: all 150ms;
      &:hover { border-color: #E5E7EB; background: #fff; }
      &.completed {
        background: #F9FAFB; opacity: .7;
        .todo-text { text-decoration: line-through; color: #9CA3AF; }
      }
    }
    .todo-checkbox-wrapper {
      display: flex; align-items: center; gap: .75rem; cursor: pointer; flex: 1;
      input[type="checkbox"] {
        width: 18px; height: 18px; border-radius: .375rem; border: 1.5px solid #D1D5DB;
        accent-color: #4F46E5; cursor: pointer;
      }
    }
    .todo-text { font-size: .875rem; font-weight: 500; color: #374151; user-select: none; }
    .delete-task-btn {
      width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; color: #9CA3AF; border-radius: .375rem;
      cursor: pointer; transition: all 150ms;
      &:hover { background: #FEF2F2; color: #DC2626; }
    }
    .todo-empty {
      text-align: center; padding: 3rem 1.5rem; color: #9CA3AF; font-size: .875rem;
      display: flex; flex-direction: column; align-items: center; gap: .5rem;
      svg { color: #D1D5DB; }
    }

    /* Forms */
    .todo-add-form {
      display: flex; gap: .5rem; margin-top: .5rem;
      input {
        flex: 1; padding: .625rem .875rem;
        border: 1.5px solid #E5E7EB; border-radius: .625rem;
        font-size: .875rem; background: #fff; color: #111827; font-family: inherit;
        &:focus { outline: none; border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
      }
      button {
        display: inline-flex; align-items: center; gap: .375rem;
        padding: .625rem 1.125rem; border: none; border-radius: .625rem;
        background: #4F46E5; color: #fff; font-size: .875rem; font-weight: 600;
        cursor: pointer; transition: all 150ms;
        &:hover:not(:disabled) { background: #4338CA; }
        &:disabled { opacity: .5; cursor: not-allowed; }
      }
    }

    .defaults-explanation {
      font-size: .8125rem; color: #6B7280; line-height: 1.4;
      background: #EFF6FF; border: 1px solid #BFDBFE; padding: .75rem; border-radius: .625rem;
    }

    @media (max-width: 900px) {
      .todo-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .user-name { display: none; }
      .date-navigator { width: 100%; justify-content: space-between; }
    }
  `]
})
export class TodoComponent {
  auth = inject(AuthService);
  todoService = inject(DailyTodoService);
  router = inject(Router);

  currentDate = signal<Date>(new Date());
  newTodoText = '';
  newDefaultText = '';

  userInitial = computed(() => (this.auth.user()?.displayName ?? '?').charAt(0).toUpperCase());

  dailyTasks = computed(() => {
    const dateStr = this.formatDateKey(this.currentDate());
    return this.todoService.getTasksForDate(dateStr);
  });

  defaultTasks = computed(() => this.todoService.data().defaultTasks);

  friendlyDate = computed(() => {
    return this.formatFriendlyDate(this.currentDate());
  });

  isToday = computed(() => {
    const today = new Date();
    const current = this.currentDate();
    return today.toDateString() === current.toDateString();
  });

  formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatFriendlyDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }

  navigateDate(offset: number) {
    const current = this.currentDate();
    const next = new Date(current);
    next.setDate(current.getDate() + offset);
    this.currentDate.set(next);
  }

  goToToday() {
    this.currentDate.set(new Date());
  }

  toggleDailyTask(index: number) {
    const tasks = [...this.dailyTasks()];
    tasks[index] = { ...tasks[index], completed: !tasks[index].completed };
    const dateStr = this.formatDateKey(this.currentDate());
    this.todoService.saveTasksForDate(dateStr, tasks);
  }

  addDailyTask() {
    const text = this.newTodoText.trim();
    if (!text) return;
    const tasks = [...this.dailyTasks(), { id: crypto.randomUUID(), label: text, completed: false }];
    const dateStr = this.formatDateKey(this.currentDate());
    this.todoService.saveTasksForDate(dateStr, tasks);
    this.newTodoText = '';
  }

  deleteDailyTask(index: number) {
    const tasks = this.dailyTasks().filter((_, i) => i !== index);
    const dateStr = this.formatDateKey(this.currentDate());
    this.todoService.saveTasksForDate(dateStr, tasks);
  }

  addDefaultTask() {
    const text = this.newDefaultText.trim();
    if (!text) return;
    this.todoService.addDefaultTask(text);
    this.newDefaultText = '';
  }

  deleteDefaultTask(id: string) {
    this.todoService.removeDefaultTask(id);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
