import { Injectable, signal, computed } from '@angular/core';
import { TreeDocument } from '../models/tree-node.model';
import { TreeMapDocument, TreeMapMeta } from '../models/treemap.model';

@Injectable({ providedIn: 'root' })
export class TreeMapListService {
  private readonly STORAGE_KEY = 'treemap-list';

  private _treemaps = signal<TreeMapDocument[]>(this.load());

  readonly treemaps = this._treemaps.asReadonly();
  readonly total = computed(() => this._treemaps().length);
  readonly inProgress = computed(() => this._treemaps().filter(t => t.status === 'en-cours').length);
  readonly completed = computed(() => this._treemaps().filter(t => t.status === 'terminé').length);

  create(title: string): TreeMapDocument {
    const now = new Date().toISOString();
    const doc: TreeMapDocument = {
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
    this._treemaps.update(list => [doc, ...list]);
    this.persist();
    return doc;
  }

  update(id: string, updates: Partial<TreeMapMeta>): void {
    this._treemaps.update(list =>
      list.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    );
    this.persist();
  }

  updateData(id: string, data: TreeDocument): void {
    this._treemaps.update(list =>
      list.map(t => t.id === id ? { ...t, data, updatedAt: new Date().toISOString() } : t)
    );
    this.persist();
  }

  remove(id: string): void {
    this._treemaps.update(list => list.filter(t => t.id !== id));
    this.persist();
  }

  getById(id: string): TreeMapDocument | undefined {
    return this._treemaps().find(t => t.id === id);
  }

  private persist(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._treemaps()));
  }

  private load(): TreeMapDocument[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  }
}
