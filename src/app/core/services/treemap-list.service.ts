import { Injectable, signal, computed, inject, effect } from '@angular/core';
import {
  getFirestore,
  collection,
  doc as firestoreDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { getApps, getApp, initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TreeDocument } from '../models/tree-node.model';
import { TreeMapDocument, TreeMapMeta } from '../models/treemap.model';

const firebaseApp = getApps().length ? getApp() : initializeApp(environment.firebaseConfig);
const db = getFirestore(firebaseApp);

@Injectable({ providedIn: 'root' })
export class TreeMapListService {
  private readonly STORAGE_KEY = 'treemap-list-guest';
  private readonly auth = inject(AuthService);

  private _treemaps = signal<TreeMapDocument[]>([]);
  private _loading  = signal(true);
  private unsub: (() => void) | null = null;

  readonly treemaps   = this._treemaps.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly total      = computed(() => this._treemaps().length);
  readonly inProgress = computed(() => this._treemaps().filter(t => t.status === 'en-cours').length);
  readonly completed  = computed(() => this._treemaps().filter(t => t.status === 'terminé').length);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.unsub?.();
      this.unsub = null;

      if (!user) {
        this._treemaps.set([]);
        this._loading.set(false);
        return;
      }

      if (user.provider === 'google') {
        this._loading.set(true);
        this.subscribeFirestore(user.id);
      } else {
        this._treemaps.set(this.loadLocal());
        this._loading.set(false);
      }
    }, { allowSignalWrites: true });
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  create(title: string): TreeMapDocument {
    const now = new Date().toISOString();
    const treemap: TreeMapDocument = {
      id: crypto.randomUUID(),
      title,
      status: 'en-cours',
      createdAt: now,
      updatedAt: now,
      data: {
        id: crypto.randomUUID(),
        name: title,
        updatedAt: now,
        root: {
          id: crypto.randomUUID(),
          title,
          contentType: 'text',
          content: '',
          children: [],
          expanded: true,
          createdAt: now,
          showPrice: false,
          showDays: false,
          showDescription: false,
        },
      },
    };
    // Optimistic update — visible immédiatement, persisté en arrière-plan
    this._treemaps.update(list => [treemap, ...list]);
    this.saveDoc(treemap);
    return treemap;
  }

  update(id: string, updates: Partial<TreeMapMeta>): void {
    let updated: TreeMapDocument | undefined;
    this._treemaps.update(list => {
      const next = list.map(t => {
        if (t.id !== id) return t;
        updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      });
      return next;
    });
    if (updated) this.saveDoc(updated);
  }

  updateData(id: string, data: TreeDocument): void {
    let updated: TreeMapDocument | undefined;
    this._treemaps.update(list => {
      const next = list.map(t => {
        if (t.id !== id) return t;
        updated = { ...t, data, updatedAt: new Date().toISOString() };
        return updated;
      });
      return next;
    });
    if (updated) this.saveDoc(updated);
  }

  remove(id: string): void {
    this._treemaps.update(list => list.filter(t => t.id !== id));
    const uid = this.googleUid();
    if (uid) {
      deleteDoc(firestoreDoc(db, 'users', uid, 'treemaps', id)).catch(console.error);
    } else {
      this.persistLocal(this._treemaps());
    }
  }

  getById(id: string): TreeMapDocument | undefined {
    return this._treemaps().find(t => t.id === id);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private subscribeFirestore(uid: string): void {
    const q = query(
      collection(db, 'users', uid, 'treemaps'),
      orderBy('updatedAt', 'desc'),
    );
    this.unsub = onSnapshot(
      q,
      snapshot => {
        this._treemaps.set(snapshot.docs.map(d => d.data() as TreeMapDocument));
        this._loading.set(false);
      },
      err => {
        console.error('Firestore snapshot error:', err);
        this._loading.set(false);
      },
    );
  }

  private async saveDoc(treemap: TreeMapDocument): Promise<void> {
    const uid = this.googleUid();
    if (uid) {
      try {
        await setDoc(firestoreDoc(db, 'users', uid, 'treemaps', treemap.id), treemap);
      } catch (err) {
        console.error('Firestore write error:', err);
      }
    } else {
      this.persistLocal(this._treemaps());
    }
  }

  private googleUid(): string | null {
    const user = this.auth.user();
    return user?.provider === 'google' ? user.id : null;
  }

  private persistLocal(list: TreeMapDocument[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }

  private loadLocal(): TreeMapDocument[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}
