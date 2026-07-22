import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getApps, getApp, initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const firebaseApp = getApps().length ? getApp() : initializeApp(environment.firebaseConfig);
const db = getFirestore(firebaseApp);

export interface TodoTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface DailyTodoData {
  defaultTasks: { id: string; label: string }[];
  history: { [date: string]: TodoTask[] };
}

@Injectable({ providedIn: 'root' })
export class DailyTodoService {
  private readonly STORAGE_KEY = 'treemap-daily-todos';
  private readonly auth = inject(AuthService);
  private unsub: (() => void) | null = null;

  private _data = signal<DailyTodoData>({
    defaultTasks: [
      { id: '1', label: 'Vérifier les e-mails et messages' },
      { id: '2', label: 'Planifier les tâches de la journée' },
      { id: '3', label: 'Faire une pause de 10 min toutes les 2h' },
      { id: '4', label: 'Mettre à jour le statut des tickets' }
    ],
    history: {}
  });

  readonly data = this._data.asReadonly();

  constructor() {
    toObservable(this.auth.user).subscribe(user => {
      this.unsub?.();
      this.unsub = null;

      if (!user) {
        this._data.set(this.loadLocal());
        return;
      }

      if (user.provider === 'google') {
        this.subscribeFirestore(user.id);
      } else {
        this._data.set(this.loadLocal());
      }
    });
  }

  getTasksForDate(dateStr: string): TodoTask[] {
    const hist = this._data().history;
    if (hist[dateStr]) {
      return hist[dateStr];
    }
    // Initialize from default tasks
    return this._data().defaultTasks.map(t => ({
      id: t.id,
      label: t.label,
      completed: false
    }));
  }

  saveTasksForDate(dateStr: string, tasks: TodoTask[]): void {
    this._data.update(d => {
      const nextHistory = { ...d.history, [dateStr]: tasks };
      const nextData = { ...d, history: nextHistory };
      this.persist(nextData);
      return nextData;
    });
  }

  addDefaultTask(label: string): void {
    const id = crypto.randomUUID();
    this._data.update(d => {
      const nextDefaults = [...d.defaultTasks, { id, label }];
      const nextData = { ...d, defaultTasks: nextDefaults };
      this.persist(nextData);
      return nextData;
    });
  }

  removeDefaultTask(id: string): void {
    this._data.update(d => {
      const nextDefaults = d.defaultTasks.filter(t => t.id !== id);
      const nextData = { ...d, defaultTasks: nextDefaults };
      this.persist(nextData);
      return nextData;
    });
  }

  private loadLocal(): DailyTodoData {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      defaultTasks: [
        { id: '1', label: 'Vérifier les e-mails et messages' },
        { id: '2', label: 'Planifier les tâches de la journée' },
        { id: '3', label: 'Faire une pause de 10 min toutes les 2h' },
        { id: '4', label: 'Mettre à jour le statut des tickets' }
      ],
      history: {}
    };
  }

  private persist(data: DailyTodoData): void {
    const user = this.auth.user();
    if (user && user.provider === 'google') {
      setDoc(doc(db, 'users', user.id, 'daily-todos', 'config'), data).catch(console.error);
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  private subscribeFirestore(uid: string): void {
    this.unsub = onSnapshot(
      doc(db, 'users', uid, 'daily-todos', 'config'),
      snapshot => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as DailyTodoData;
          if (!remoteData.defaultTasks) remoteData.defaultTasks = [];
          if (!remoteData.history) remoteData.history = {};
          this._data.set(remoteData);
        } else {
          const local = this.loadLocal();
          this._data.set(local);
          setDoc(doc(db, 'users', uid, 'daily-todos', 'config'), local).catch(console.error);
        }
      },
      err => {
        console.error('Firestore daily-todos subscription error:', err);
      }
    );
  }
}
