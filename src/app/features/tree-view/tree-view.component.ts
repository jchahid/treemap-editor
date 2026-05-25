import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeService } from '../../core/services/tree.service';
import { NodeComponent } from './node/node.component';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [CommonModule, NodeComponent],
  template: `
    <div class="tree-container">
      <div class="tree-content" [style.zoom]="zoomLevel()">
        <app-node [node]="treeService.root()" [level]="0"></app-node>
      </div>

      <!-- Contrôles de zoom flottants -->
      <div class="zoom-controls">
        <button class="zoom-btn" (click)="zoomOut()" [disabled]="zoomLevel() <= 0.2" title="Zoomer arrière">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button class="zoom-value" (click)="resetZoom()" title="Réinitialiser le zoom (100%)">
          {{ zoomPercent() }}%
        </button>
        <button class="zoom-btn" (click)="zoomIn()" [disabled]="zoomLevel() >= 2.0" title="Zoomer avant">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100%;
    }

    .tree-container {
      flex: 1;
      overflow: auto;
      background-color: var(--bg-primary);
      text-align: center; /* Robust centering for inline-block content */
      position: relative;
    }

    .tree-content {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 5rem 30vw 15rem 30vw; /* Massively wide horizontal padding to keep center stable */
      min-width: min-content;
      text-align: left; /* Reset text alignment for children */
    }

    .zoom-controls {
      position: absolute;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 30px;
      padding: 6px 12px;
      box-shadow: 0 4px 20px var(--shadow);
      z-index: 10;
      backdrop-filter: blur(8px);
    }

    .zoom-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: all var(--transition);
      border: 1px solid var(--border);
      
      &:hover:not(:disabled) {
        background-color: var(--accent);
        color: white;
        border-color: var(--accent);
        transform: scale(1.05);
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .zoom-value {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-primary);
      cursor: pointer;
      padding: 0 8px;
      min-width: 52px;
      text-align: center;
      user-select: none;
      transition: color var(--transition);
      
      &:hover {
        color: var(--accent);
      }
    }
  `]
})
export class TreeViewComponent {
  treeService = inject(TreeService);
  zoomLevel = signal(1.0);
  zoomPercent = computed(() => Math.round(this.zoomLevel() * 100));

  zoomIn() {
    this.zoomLevel.update(z => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))));
  }

  zoomOut() {
    this.zoomLevel.update(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1))));
  }

  resetZoom() {
    this.zoomLevel.set(1.0);
  }
}
