import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeService } from '../../core/services/tree.service';
import { NodeComponent } from './node/node.component';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [CommonModule, NodeComponent],
  template: `
    <div class="tree-container">
      <div class="tree-content">
        <app-node [node]="treeService.root()" [level]="0"></app-node>
      </div>
    </div>
  `,
  styles: [`
    .tree-container {
      flex: 1;
      overflow: auto;
      background-color: var(--bg-primary);
      text-align: center; /* Robust centering for inline-block content */
    }

    .tree-content {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 5rem 30vw 15rem 30vw; /* Massively wide horizontal padding to keep center stable */
      min-width: min-content;
      text-align: left; /* Reset text alignment for children */
    }
  `]
})
export class TreeViewComponent {
  treeService = inject(TreeService);
}
