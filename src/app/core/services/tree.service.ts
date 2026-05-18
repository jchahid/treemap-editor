import { Injectable, signal, computed, effect } from '@angular/core';
import { TreeDocument, TreeNode } from '../models/tree-node.model';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private readonly STORAGE_KEY = 'treemap-editor-data';
  
  private document = signal<TreeDocument>(this.loadFromStorage());
  
  // Expose signals
  readonly doc = computed(() => this.document());
  readonly root = computed(() => this.document().root);
  
  // Selected node for editing
  selectedNodeId = signal<string | null>(null);
  selectedNode = computed(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    return this.findNodeById(this.document().root, id);
  });

  private autoSaveSubject = new Subject<TreeDocument>();

  constructor() {
    this.autoSaveSubject.pipe(debounceTime(500)).subscribe(doc => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(doc));
    });
    
    // Sync with signal
    effect(() => {
      this.autoSaveSubject.next(this.document());
    });
  }

  // CRUD Operations
  addNode(parentId: string) {
    const newNode: TreeNode = {
      id: crypto.randomUUID(),
      title: 'Nouveau nœud',
      contentType: 'text',
      content: '',
      children: [],
      expanded: true,
      createdAt: new Date().toISOString(),
      showPrice: true,
      showDays: true,
      showDescription: true
    };

    const newDoc = { ...this.document() };
    const parent = this.findNodeById(newDoc.root, parentId);
    if (parent) {
      parent.children.push(newNode);
      parent.expanded = true;
      this.document.set(newDoc);
      this.selectedNodeId.set(newNode.id);
    }
  }

  moveNode(nodeId: string, targetParentId: string) {
    if (nodeId === targetParentId) return;
    if (nodeId === this.document().root.id) return; // Can't move root

    const newDoc = { ...this.document() };
    
    // Check if target is a descendant of node (cycle prevention)
    const node = this.findNodeById(newDoc.root, nodeId);
    if (node && this.isDescendant(node, targetParentId)) {
      return;
    }

    // 1. Extract node
    let extractedNode: TreeNode | null = null;
    const parentOfNode = this.findParentOfNode(newDoc.root, nodeId);
    if (parentOfNode) {
      const index = parentOfNode.children.findIndex(c => c.id === nodeId);
      if (index !== -1) {
        extractedNode = parentOfNode.children.splice(index, 1)[0];
      }
    }

    // 2. Add to new parent
    if (extractedNode) {
      const targetParent = this.findNodeById(newDoc.root, targetParentId);
      if (targetParent) {
        targetParent.children.push(extractedNode);
        targetParent.expanded = true;
        this.document.set(newDoc);
      }
    }
  }

  private isDescendant(parent: TreeNode, idToFind: string): boolean {
    for (const child of parent.children) {
      if (child.id === idToFind) return true;
      if (this.isDescendant(child, idToFind)) return true;
    }
    return false;
  }

  private findParentOfNode(root: TreeNode, childId: string): TreeNode | null {
    for (const child of root.children) {
      if (child.id === childId) return root;
      const found = this.findParentOfNode(child, childId);
      if (found) return found;
    }
    return null;
  }

  removeNode(id: string) {
    if (id === this.document().root.id) return; // Cannot delete root

    const newDoc = { ...this.document() };
    this.deleteNodeRecursive(newDoc.root, id);
    this.document.set(newDoc);
    
    if (this.selectedNodeId() === id) {
      this.selectedNodeId.set(null);
    }
  }

  updateNode(id: string, updates: Partial<TreeNode>) {
    const newDoc = { ...this.document() };
    const node = this.findNodeById(newDoc.root, id);
    if (node) {
      Object.assign(node, updates);
      this.document.set(newDoc);
    }
  }

  updateDocumentName(name: string) {
    this.document.update(doc => ({ ...doc, name, updatedAt: new Date().toISOString() }));
  }

  // Aggregate Calculations
  getNodeTotals(node: TreeNode): { totalPrice: number, totalDays: number } {
    let totalPrice = node.price || 0;
    let totalDays = node.days || 0;

    for (const child of node.children) {
      const childTotals = this.getNodeTotals(child);
      totalPrice += childTotals.totalPrice;
      totalDays += childTotals.totalDays;
    }

    return { totalPrice, totalDays };
  }

  toggleExpand(id: string) {
    const newDoc = { ...this.document() };
    const node = this.findNodeById(newDoc.root, id);
    if (node) {
      node.expanded = !node.expanded;
      this.document.set(newDoc);
    }
  }

  toggleTask(nodeId: string, taskId: string) {
    const newDoc = { ...this.document() };
    const node = this.findNodeById(newDoc.root, nodeId);
    if (node && node.tasks) {
      const task = node.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        this.document.set(newDoc);
      }
    }
  }

  toggleCodeExpand(nodeId: string) {
    const newDoc = { ...this.document() };
    const node = this.findNodeById(newDoc.root, nodeId);
    if (node) {
      node.codeExpanded = !node.codeExpanded;
      this.document.set(newDoc);
    }
  }

  // Persistence
  exportJson() {
    const blob = new Blob([JSON.stringify(this.document(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.document().name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importJson(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString);
      // Basic validation
      if (parsed.root && parsed.root.id) {
        this.document.set(parsed);
      } else {
        throw new Error('Format JSON invalide');
      }
    } catch (e) {
      alert('Erreur lors de l\'importation : ' + (e as Error).message);
    }
  }

  // Helpers
  private findNodeById(root: TreeNode, id: string): TreeNode | null {
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = this.findNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  private deleteNodeRecursive(parent: TreeNode, idToDelete: string): boolean {
    const index = parent.children.findIndex(child => child.id === idToDelete);
    if (index !== -1) {
      parent.children.splice(index, 1);
      return true;
    }
    for (const child of parent.children) {
      if (this.deleteNodeRecursive(child, idToDelete)) return true;
    }
    return false;
  }

  private loadFromStorage(): TreeDocument {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    
    // Default document
    return {
      id: crypto.randomUUID(),
      name: 'Mon TreeMap',
      updatedAt: new Date().toISOString(),
      root: {
        id: crypto.randomUUID(),
        title: 'Racine',
        contentType: 'text',
        content: 'Bienvenue dans votre éditeur de TreeMap.',
        children: [],
        expanded: true,
        createdAt: new Date().toISOString(),
        showPrice: true,
        showDays: true,
        showDescription: true
      }
    };
  }
}
