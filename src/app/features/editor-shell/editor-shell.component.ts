import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { TreeViewComponent } from '../tree-view/tree-view.component';
import { NodeEditorComponent } from '../node-editor/node-editor.component';
import { PrintViewComponent } from '../print-view/print-view.component';
import { TreeService } from '../../core/services/tree.service';
import { TreeMapListService } from '../../core/services/treemap-list.service';
import { TreeMapStatus } from '../../core/models/treemap.model';

@Component({
  selector: 'app-editor-shell',
  standalone: true,
  imports: [ToolbarComponent, TreeViewComponent, NodeEditorComponent, PrintViewComponent],
  template: `
    <div class="editor-shell">

      <!-- Barre de navigation retour -->
      <div class="back-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Dashboard
        </button>

        <span class="treemap-title" [title]="treemapTitle()">{{ treemapTitle() }}</span>

        <select class="status-select" [value]="currentStatus()" (change)="onStatusChange($event)">
          <option value="brouillon">Brouillon</option>
          <option value="en-cours">En cours</option>
          <option value="terminé">Terminé</option>
        </select>
      </div>

      <app-toolbar></app-toolbar>

      <main class="editor-main">
        <app-tree-view></app-tree-view>
        <app-node-editor></app-node-editor>
      </main>

      <app-print-view
        [rootNode]="treeService.root()"
        [docName]="treeService.doc().name">
      </app-print-view>
    </div>
  `,
  styles: [`
    .editor-shell {
      display: flex; flex-direction: column;
      height: 100vh; overflow: hidden;
    }

    @media print {
      .editor-shell {
        height: auto;
        overflow: visible;
        display: block;
      }

      .back-bar, app-toolbar, .editor-main {
        display: none !important;
      }
    }

    .back-bar {
      display: flex; align-items: center; gap: 1rem;
      height: 40px; padding: 0 1rem; flex-shrink: 0;
      background: #F9FAFB; border-bottom: 1px solid #E5E7EB;
    }

    .back-btn {
      display: flex; align-items: center; gap: .375rem;
      padding: .25rem .625rem;
      border: 1px solid #E5E7EB; border-radius: .375rem;
      background: #fff; color: #6B7280;
      font-size: .8125rem; font-weight: 500; font-family: inherit; cursor: pointer;
      transition: all 150ms; white-space: nowrap;
      &:hover { color: #4F46E5; border-color: #A5B4FC; background: #EEF2FF; }
    }

    .treemap-title {
      flex: 1; font-size: .875rem; font-weight: 600; color: #374151;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .status-select {
      padding: .1875rem .625rem;
      border: 1px solid #E5E7EB; border-radius: .375rem;
      background: #fff; color: #374151;
      font-size: .75rem; font-family: inherit; cursor: pointer;
      &:focus { outline: 2px solid #6366F1; outline-offset: 1px; }
    }

    .editor-main {
      flex: 1; display: flex; overflow: hidden; position: relative;
    }
  `],
})
export class EditorShellComponent implements OnInit, OnDestroy {
  treeService      = inject(TreeService);
  treemapListSvc   = inject(TreeMapListService);
  route            = inject(ActivatedRoute);
  router           = inject(Router);

  treemapTitle  = signal('');
  currentStatus = signal<TreeMapStatus>('en-cours');
  private treemapId = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/dashboard']); return; }

    const doc = this.treemapListSvc.getById(id);
    if (!doc) { this.router.navigate(['/dashboard']); return; }

    this.treemapId = id;
    this.treemapTitle.set(doc.title);
    this.currentStatus.set(doc.status);
    this.treeService.loadDocument(doc.data);
  }

  ngOnDestroy() {
    this.save();
  }

  goBack() {
    this.save();
    this.router.navigate(['/dashboard']);
  }

  onStatusChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as TreeMapStatus;
    this.currentStatus.set(val);
    this.treemapListSvc.update(this.treemapId, { status: val });
  }

  private save() {
    if (this.treemapId) {
      this.treemapListSvc.updateData(this.treemapId, this.treeService.doc());
    }
  }
}
