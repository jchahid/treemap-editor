import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './features/toolbar/toolbar.component';
import { TreeViewComponent } from './features/tree-view/tree-view.component';
import { NodeEditorComponent } from './features/node-editor/node-editor.component';
import { PrintViewComponent } from './features/print-view/print-view.component';
import { TreeService } from './core/services/tree.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ToolbarComponent, TreeViewComponent, NodeEditorComponent, PrintViewComponent],
  template: `
    <div class="app-layout">
      <app-toolbar></app-toolbar>
      <main class="main-content">
        <app-tree-view></app-tree-view>
        <app-node-editor></app-node-editor>
      </main>
      
      <!-- Hidden view for printing -->
      <app-print-view 
        [rootNode]="treeService.root()" 
        [docName]="treeService.doc().name">
      </app-print-view>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }

    .main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
    }
  `]
})
export class AppComponent {
  treeService = inject(TreeService);
}
