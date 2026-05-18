import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeNode, TaskItem } from '../../../core/models/tree-node.model';
import { TreeService } from '../../../core/services/tree.service';

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="node-wrapper" 
         [class.is-root]="level === 0"
         [class.selected]="treeService.selectedNodeId() === node.id"
         [class.drag-over]="isDragOver()"
         draggable="true"
         (dragstart)="onDragStart($event)"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave()"
         (drop)="onDrop($event)"
         (click)="onSelect($event)">
      
      <div class="node-shape" [class.circle]="level === 0" [class.rectangle]="level > 0">
        <div class="node-header">
          <div class="type-icon">
            @switch (node.contentType) {
              @case ('text') { <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg> }
              @case ('image') { <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
              @case ('tasks') { <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> }
              @case ('code') { <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> }
            }
          </div>
          <div class="title-group">
            <span class="title">{{ node.title }}</span>
            @if (node.ticketNumber) { <small class="ticket-sub">{{ node.ticketNumber }}</small> }
          </div>
        </div>

        @if (node.showPrice || node.showDays) {
          <div class="node-stats">
            @if (treeService.getNodeTotals(node); as totals) {
              @if (node.showPrice) {
                <div class="stat-item" [title]="'Total Prix: ' + totals.totalPrice + '€'">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span>{{ totals.totalPrice }}€</span>
                </div>
              }
              @if (node.showDays) {
                <div class="stat-item" [title]="'Total Jours: ' + totals.totalDays">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{{ totals.totalDays }} j</span>
                </div>
              }
            }
          </div>
        }

        @if (node.showDescription) {
          <div class="node-body">
            @switch (node.contentType) {
              @case ('text') {
                <div class="node-text" [innerHTML]="node.content"></div>
              }
              @case ('image') {
                @if (node.content) {
                  <div class="node-image"><img [src]="node.content" alt="Image"></div>
                }
              }
              @case ('tasks') {
                <div class="node-tasks">
                  @for (task of node.tasks; track task.id) {
                    <div class="node-task-item" (click)="toggleTask($event, task.id)">
                      <div class="task-checkbox" [class.checked]="task.completed"></div>
                      <span [class.completed]="task.completed">{{ task.label }}</span>
                    </div>
                  } @empty {
                    <div class="node-placeholder">Aucune tâche</div>
                  }
                </div>
              }
              @case ('code') {
                <div class="node-code-container" (click)="$event.stopPropagation()">
                   <div class="code-header" (click)="toggleCode($event)">
                      <span>Code ({{ node.codeLanguage || 'text' }})</span>
                      <svg [class.rotated]="node.codeExpanded" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                   </div>
                   @if (node.codeExpanded) {
                     <pre class="code-block"><code>{{ node.content }}</code></pre>
                   }
                </div>
              }
            }
          </div>
        }

        <div class="node-actions">
          <button class="action-btn add" (click)="addNode($event)" title="Ajouter un enfant">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          @if (level > 0) {
            <button class="action-btn remove" (click)="removeNode($event)" title="Supprimer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          }
        </div>
      </div>

      <div class="node-children-wrapper" *ngIf="node.children.length > 0">
        <div class="connection-line-container">
            <svg class="connection-svg">
                <line x1="50%" y1="0" x2="50%" y2="100%" />
            </svg>
        </div>
        <div class="children-list">
          @for (child of node.children; track child.id) {
            <div class="child-item">
                <div class="horizontal-line"></div>
                <app-node [node]="child" [level]="level + 1"></app-node>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .node-wrapper { display: flex; flex-direction: column; align-items: center; position: relative; padding: 10px; transition: all var(--transition); cursor: grab; }
    .node-wrapper:active { cursor: grabbing; }
    .node-wrapper.drag-over .node-shape { outline: 2px dashed var(--accent); outline-offset: 4px; }
    .node-wrapper.selected > .node-shape { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }

    .node-shape {
      background-color: var(--node-bg);
      border: 2px solid var(--border);
      padding: 1rem;
      position: relative;
      z-index: 2;
      transition: all var(--transition);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 180px;
      max-width: 280px;
      box-shadow: 0 4px 6px var(--shadow);
      &:hover { border-color: var(--accent); .node-actions { opacity: 1; } }
      &.circle { width: 160px; height: 160px; border-radius: 50%; justify-content: center; text-align: center; }
      &.rectangle { border-radius: 12px; }
    }

    .node-header {
      display: flex; gap: 0.5rem; font-weight: 700; color: var(--text-primary);
      .type-icon { color: var(--accent); flex-shrink: 0; }
      .title-group { display: flex; flex-direction: column; align-items: flex-start; overflow: hidden; }
      .title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-content); font-weight: 700; }
      .ticket-sub { font-family: var(--font-ui); font-size: 0.7rem; color: var(--accent); background: rgba(79, 70, 229, 0.08); padding: 1px 4px; border-radius: 4px; margin-top: 1px; }
    }

    .node-stats {
      display: flex; gap: 12px; font-size: 0.75rem; font-weight: 600; color: var(--text-primary); background: var(--bg-primary); padding: 4px 8px; border-radius: 6px;
      .stat-item { display: flex; align-items: center; gap: 4px; svg { color: var(--accent); } }
    }

    .node-body {
      font-size: 0.85rem; color: var(--text-secondary); max-height: 120px; overflow-y: auto; width: 100%;
      .node-text { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .node-image img { width: 100%; height: 60px; object-fit: cover; border-radius: 4px; }
      .node-placeholder { font-style: italic; opacity: 0.5; }
    }

    /* Tasks Styles */
    .node-tasks { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    .node-task-item {
      display: flex; align-items: center; gap: 6px; cursor: pointer;
      .task-checkbox { width: 12px; height: 12px; border: 1.5px solid var(--border); border-radius: 3px; flex-shrink: 0; }
      .task-checkbox.checked { background: var(--accent); border-color: var(--accent); position: relative; }
      .task-checkbox.checked::after { content: ''; position: absolute; left: 3px; top: 1px; width: 3px; height: 6px; border: solid white; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }
      span.completed { text-decoration: line-through; opacity: 0.5; }
    }

    /* Code Styles */
    .node-code-container { margin-top: 4px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
    .code-header { 
      background: var(--bg-primary); padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; font-weight: 600; cursor: pointer;
      svg { transition: transform 0.2s; &.rotated { transform: rotate(180deg); } }
    }
    .code-block { margin: 0; padding: 8px; background: #1e1e1e; color: #d4d4d4; font-family: monospace; font-size: 0.75rem; overflow-x: auto; text-align: left; }

    .node-actions { position: absolute; top: -12px; right: -12px; display: flex; gap: 4px; opacity: 0; transition: opacity var(--transition); }
    .action-btn { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; &.add { background: var(--accent); } &.remove { background: #ef4444; } &:hover { filter: brightness(1.1); transform: scale(1.1); } }

    .node-children-wrapper { display: flex; flex-direction: column; align-items: center; width: 100%; }
    .connection-line-container { height: 30px; width: 1px; background-color: var(--border); }
    .children-list { display: flex; justify-content: center; gap: 20px; border-top: 1px solid var(--border); }
    .child-item { display: flex; flex-direction: column; align-items: center; position: relative; }
    .horizontal-line { position: absolute; top: 0; left: 0; right: 0; height: 1px; background-color: var(--border); }
  `]
})
export class NodeComponent {
  @Input({ required: true }) node!: TreeNode;
  @Input() level: number = 0;

  treeService = inject(TreeService);
  isDragOver = signal(false);

  onSelect(event: MouseEvent) { event.stopPropagation(); this.treeService.selectedNodeId.set(this.node.id); }
  addNode(event: MouseEvent) { event.stopPropagation(); this.treeService.addNode(this.node.id); }
  removeNode(event: MouseEvent) { event.stopPropagation(); if (confirm('Supprimer ce nœud et ses descendants ?')) { this.treeService.removeNode(this.node.id); } }

  toggleTask(event: MouseEvent, taskId: string) {
    event.stopPropagation();
    this.treeService.toggleTask(this.node.id, taskId);
  }

  toggleCode(event: MouseEvent) {
    event.stopPropagation();
    this.treeService.toggleCodeExpand(this.node.id);
  }

  // Drag and Drop
  onDragStart(event: DragEvent) { if (this.level === 0) { event.preventDefault(); return; } event.dataTransfer?.setData('nodeId', this.node.id); event.stopPropagation(); }
  onDragOver(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(true); }
  onDragLeave() { this.isDragOver.set(false); }
  onDrop(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false); const draggedNodeId = event.dataTransfer?.getData('nodeId'); if (draggedNodeId && draggedNodeId !== this.node.id) { this.treeService.moveNode(draggedNodeId, this.node.id); } }
}
