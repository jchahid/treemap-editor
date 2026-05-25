import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeService } from '../../core/services/tree.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <nav class="toolbar">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/>
        </svg>
        <span>TreeMap Editor</span>
      </div>

      <div class="doc-name">
        <input 
          type="text" 
          [ngModel]="treeService.doc().name" 
          (ngModelChange)="treeService.updateDocumentName($event)"
          aria-label="Nom du document"
        />
      </div>

      <div class="actions">
        <button (click)="fileInput.click()" title="Importer JSON" aria-label="Importer JSON">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </button>
        <input #fileInput type="file" style="display: none" (change)="onFileImport($event)" accept=".json">
        
        <button (click)="treeService.exportJson()" title="Exporter JSON" aria-label="Exporter JSON">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>

        <button (click)="print()" title="Imprimer PDF" aria-label="Imprimer PDF">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        </button>

        <button (click)="treeService.resetDocument()" title="Réinitialiser la Map" aria-label="Réinitialiser la Map">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>

        <div class="divider"></div>

        <button (click)="themeService.toggleTheme()" [title]="'Thème actuel: ' + themeService.theme()" aria-label="Changer de thème">
          @if (themeService.theme() === 'light') {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          } @else if (themeService.theme() === 'dark') {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          } @else {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20z"/></svg>
          }
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .toolbar {
      height: 64px;
      padding: 0 1.5rem;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 4px var(--shadow);
      z-index: 100;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      color: var(--accent);
      
      span {
        color: var(--text-primary);
        font-size: 1.1rem;
      }
    }

    .doc-name {
      input {
        background: transparent;
        border: 1px solid transparent;
        font-size: 1rem;
        font-weight: 600;
        text-align: center;
        width: 300px;
        
        &:hover {
          border-color: var(--border);
        }
        
        &:focus {
          border-color: var(--accent);
          background: var(--bg-primary);
        }
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      button {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        color: var(--text-secondary);
        transition: all var(--transition);
        
        &:hover {
          background-color: var(--node-hover);
          color: var(--accent);
        }
      }
      
      .divider {
        width: 1px;
        height: 24px;
        background-color: var(--border);
        margin: 0 0.5rem;
      }
    }
  `]
})
export class ToolbarComponent {
  treeService = inject(TreeService);
  themeService = inject(ThemeService);

  print() {
    window.print();
  }

  onFileImport(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.treeService.importJson(e.target?.result as string);
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = '';
  }
}
