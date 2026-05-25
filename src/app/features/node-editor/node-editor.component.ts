import { Component, inject, effect, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeService } from '../../core/services/tree.service';
import { TreeNode, TaskItem } from '../../core/models/tree-node.model';

@Component({
  selector: 'app-node-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: {
    '[class.open]': '!!treeService.selectedNodeId()'
  },
  template: `
    <aside class="editor-sidebar">
      @if (treeService.selectedNode(); as node) {
        <div class="editor-header">
          <h2>Éditer le nœud</h2>
          <button class="close-btn" (click)="close()" aria-label="Fermer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="editor-body">
          <div class="form-top-row">
            <div class="form-group">
              <label for="node-title">Titre</label>
              <input id="node-title" type="text" [(ngModel)]="tempNode.title" placeholder="Titre du nœud">
            </div>
            <div class="form-group">
              <label for="node-ticket">N° Ticket</label>
              <input id="node-ticket" type="text" [(ngModel)]="tempNode.ticketNumber" placeholder="TK-123">
            </div>
            <div class="form-row">
              <div class="form-group flex-1">
                <label for="node-price">Prix (€)</label>
                <input id="node-price" type="number" [(ngModel)]="tempNode.price" placeholder="0.00">
              </div>
              <div class="form-group flex-1">
                <label for="node-days">Jours</label>
                <input id="node-days" type="number" [(ngModel)]="tempNode.days" placeholder="0">
              </div>
            </div>
          </div>

          <div class="form-visibility-row">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="tempNode.showPrice">
              Afficher Prix
            </label>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="tempNode.showDays">
              Afficher Jours
            </label>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="tempNode.showDescription">
              Afficher Description
            </label>
          </div>

          <div class="description-preview-section">
            <label>Contenu</label>
            <div class="preview-card" (click)="openModal()">
               <div class="preview-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Éditeur riche (Texte, Tasks, Code, Image)</span>
               </div>
               <div class="preview-content">
                  @switch (tempNode.contentType) {
                    @case ('text') { <div [innerHTML]="tempNode.content || 'Aucune description...'"></div> }
                    @case ('image') { @if (tempNode.content) { <img [src]="tempNode.content" style="max-height: 80px;"> } @else { <span>Image vide</span> } }
                    @case ('tasks') { <span>Liste de {{ tempNode.tasks?.length || 0 }} tâches</span> }
                    @case ('code') { <span>Bloc de code ({{ tempNode.codeLanguage || 'text' }})</span> }
                  }
               </div>
            </div>
          </div>
        </div>

        <div class="editor-footer">
          <button class="btn-cancel" (click)="revert()">Annuler</button>
          <button class="btn-save" (click)="save()">Sauvegarder</button>
        </div>
      } @else {
        <div class="empty-state">
          <p>Sélectionnez un nœud pour l'éditer</p>
        </div>
      }
    </aside>

    <!-- DESCRIPTION MODAL -->
    @if (isModalOpen()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Contenu du nœud : {{ tempNode.title }}</h3>
            <button class="close-btn" (click)="closeModal()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="type-selector-large">
              <button [class.active]="tempNode.contentType === 'text'" (click)="setContentType('text')">Texte Riche</button>
              <button [class.active]="tempNode.contentType === 'tasks'" (click)="setContentType('tasks')">Check-list</button>
              <button [class.active]="tempNode.contentType === 'code'" (click)="setContentType('code')">Code</button>
              <button [class.active]="tempNode.contentType === 'image'" (click)="setContentType('image')">Image</button>
            </div>

            <div class="modal-editor-container">
              @if (tempNode.contentType === 'text') {
                <div class="rich-editor-container">
                  <div class="rich-editor-toolbar">
                    <button (click)="execCommand('bold')"><b>B</b></button>
                    <button (click)="execCommand('italic')"><i>I</i></button>
                    <button (click)="execCommand('underline')"><u>U</u></button>
                    <div class="divider"></div>
                    <button (click)="execCommand('insertUnorderedList')">•</button>
                    <button (click)="execCommand('insertOrderedList')">1.</button>
                  </div>
                  <div #modalEditor contenteditable="true" class="modal-rich-editor" (input)="onEditorInput($event)"></div>
                </div>
              } @else if (tempNode.contentType === 'tasks') {
                <div class="tasks-editor">
                  <div class="tasks-list">
                    @for (task of tempNode.tasks; track task.id; let i = $index) {
                      <div class="task-edit-item">
                        <input type="checkbox" [(ngModel)]="task.completed">
                        <input type="text" [(ngModel)]="task.label" placeholder="Nom de la tâche..." class="task-input">
                        <button class="remove-task" (click)="removeTask(i)">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    }
                  </div>
                  <button class="add-task-btn" (click)="addTask()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter une tâche
                  </button>
                </div>
              } @else if (tempNode.contentType === 'code') {
                <div class="code-editor">
                  <div class="form-group">
                    <label>Langage (ex: typescript, css, html)</label>
                    <input type="text" [(ngModel)]="tempNode.codeLanguage" placeholder="text">
                  </div>
                  <textarea [(ngModel)]="tempNode.content" class="code-textarea" placeholder="Collez votre code ici..."></textarea>
                  <label class="checkbox-label mt-1">
                    <input type="checkbox" [(ngModel)]="tempNode.codeExpanded">
                    Déplié par défaut
                  </label>
                </div>
              } @else if (tempNode.contentType === 'image') {
                <div class="image-editor">
                  <input type="text" [(ngModel)]="tempNode.content" placeholder="URL de l'image..." class="full-width mb-1">
                  <div class="upload-dropzone" (click)="imgInput.click()">
                    <input #imgInput type="file" (change)="onImageUpload($event)" accept="image/*" hidden>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p>Charger une image locale</p>
                  </div>
                  @if (tempNode.content) { <div class="modal-image-preview"><img [src]="tempNode.content"></div> }
                </div>
              }
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-save-modal" (click)="closeModal()">Terminer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 0;
      height: 100%;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      border-left: 0 solid var(--border);
      background-color: var(--bg-secondary);
      z-index: 90;
      &.open {
        width: 400px;
        border-left: 1px solid var(--border);
        box-shadow: -4px 0 20px var(--shadow);
      }
    }
    .editor-sidebar {
      width: 400px;
      height: 100%;
      background-color: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .editor-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; h2 { font-size: 1rem; font-weight: 700; } }
    .editor-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .form-top-row { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); } }
    .form-row { display: flex; gap: 1rem; .flex-1 { flex: 1; } }
    .form-visibility-row { display: flex; flex-direction: column; gap: 0.6rem; padding: 1rem; background: var(--bg-primary); border-radius: 8px; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; input[type="checkbox"] { width: 16px; height: 16px; } }
    .description-preview-section { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); } }
    .preview-card { position: relative; border: 1px solid var(--border); border-radius: 8px; min-height: 100px; overflow: hidden; cursor: pointer; background: var(--bg-secondary); .preview-content { padding: 1rem; font-size: 0.85rem; color: var(--text-secondary); opacity: 0.7; } .preview-overlay { position: absolute; inset: 0; background: rgba(79, 70, 229, 0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; opacity: 0; transition: opacity 0.2s; z-index: 2; color: var(--accent); font-weight: 600; } &:hover .preview-overlay { opacity: 1; } }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .modal-content { background: var(--bg-secondary); width: 100%; max-width: 900px; height: 100%; max-height: 85vh; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); display: flex; flex-direction: column; overflow: hidden; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; h3 { margin: 0; font-size: 1.2rem; } }
    .modal-body { flex: 1; padding: 2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }
    
    .type-selector-large { display: flex; gap: 1rem; button { flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); font-weight: 600; &.active { background: var(--accent); color: white; border-color: var(--accent); } } }
    .modal-editor-container { flex: 1; display: flex; flex-direction: column; min-height: 400px; }

    /* Tasks Editor Styles */
    .tasks-editor { display: flex; flex-direction: column; gap: 1.5rem; }
    .tasks-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .task-edit-item { display: flex; align-items: center; gap: 1rem; background: var(--bg-primary); padding: 0.5rem 1rem; border-radius: 8px; .task-input { flex: 1; border: none; background: transparent; padding: 0.5rem; font-size: 1rem; &:focus { outline: none; } } .remove-task { color: #ef4444; opacity: 0.6; &:hover { opacity: 1; } } }
    .add-task-btn { align-self: flex-start; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--bg-primary); border: 1.5px dashed var(--border); border-radius: 8px; font-weight: 600; &:hover { border-color: var(--accent); color: var(--accent); } }

    /* Code Editor Styles */
    .code-editor { display: flex; flex-direction: column; gap: 1rem; flex: 1; }
    .code-textarea { flex: 1; min-height: 300px; font-family: monospace; padding: 1rem; background: #1e1e1e; color: #d4d4d4; border-radius: 8px; border: none; font-size: 1rem; line-height: 1.5; resize: none; }

    .rich-editor-container { flex: 1; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .rich-editor-toolbar { padding: 0.5rem; background: var(--bg-primary); border-bottom: 1px solid var(--border); display: flex; gap: 4px; button { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 6px; &:hover { background: var(--border); color: var(--accent); } } .divider { width: 1px; height: 24px; background: var(--border); margin: 0 4px; } }
    .modal-rich-editor { flex: 1; padding: 1.5rem; min-height: 300px; outline: none; font-family: var(--font-content); font-size: 1.1rem; line-height: 1.6; }
    .upload-dropzone { border: 2px dashed var(--border); border-radius: 12px; padding: 3rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary); &:hover { border-color: var(--accent); color: var(--accent); background: var(--bg-primary); } }
    .modal-image-preview { margin-top: 1rem; text-align: center; img { max-width: 100%; max-height: 300px; border-radius: 12px; } }
    .modal-footer { padding: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }
    .btn-save-modal { padding: 0.75rem 2rem; background: var(--accent); color: white; border-radius: 8px; font-weight: 700; }
    .editor-footer { padding: 1.5rem; border-top: 1px solid var(--border); display: flex; gap: 1rem; button { flex: 1; padding: 0.75rem; border-radius: 8px; font-weight: 600; } .btn-cancel { background: var(--bg-primary); color: var(--text-primary); } .btn-save { background: var(--accent); color: white; } }
    .empty-state { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-style: italic; }
    .mt-1 { margin-top: 1rem; } .mb-1 { margin-bottom: 1rem; } .full-width { width: 100%; }
  `]
})
export class NodeEditorComponent {
  treeService = inject(TreeService);
  @ViewChild('modalEditor') modalEditorElement?: ElementRef<HTMLDivElement>;
  
  tempNode: Partial<TreeNode> = {};
  isModalOpen = signal(false);
  private lastId: string | null = null;

  constructor() {
    effect(() => {
      const node = this.treeService.selectedNode();
      if (node) {
        if (this.lastId !== node.id) {
          this.tempNode = { ...node };
          // Ensure tasks array exists
          if (!this.tempNode.tasks) this.tempNode.tasks = [];
          this.lastId = node.id;
        }
      } else {
        this.lastId = null;
      }
    });
  }

  openModal() {
    this.isModalOpen.set(true);
    setTimeout(() => this.updateEditorContent());
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  private updateEditorContent() {
    if (this.modalEditorElement && this.tempNode.contentType === 'text') {
      this.modalEditorElement.nativeElement.innerHTML = this.tempNode.content || '';
    }
  }

  setContentType(type: 'text' | 'image' | 'tasks' | 'code') {
    this.tempNode.contentType = type;
    if (type === 'tasks' && !this.tempNode.tasks) {
      this.tempNode.tasks = [];
    }
    if (type === 'text') {
      setTimeout(() => this.updateEditorContent());
    }
  }

  onEditorInput(event: any) {
    this.tempNode.content = event.target.innerHTML;
  }

  // Task Methods
  addTask() {
    if (!this.tempNode.tasks) this.tempNode.tasks = [];
    this.tempNode.tasks.push({
      id: crypto.randomUUID(),
      label: '',
      completed: false
    });
  }

  removeTask(index: number) {
    this.tempNode.tasks?.splice(index, 1);
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.tempNode.content = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  execCommand(command: string) {
    document.execCommand(command, false);
  }

  save() {
    if (this.tempNode.id) {
      this.treeService.updateNode(this.tempNode.id, this.tempNode);
    }
  }

  revert() {
    const node = this.treeService.selectedNode();
    if (node) {
      this.tempNode = { ...node };
      this.updateEditorContent();
    }
  }

  close() {
    this.treeService.selectedNodeId.set(null);
  }
}
