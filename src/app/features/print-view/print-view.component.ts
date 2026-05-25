import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeNode } from '../../core/models/tree-node.model';

@Component({
  selector: 'app-print-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="print-document">
      <h1>{{ docName }}</h1>
      <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: rootNode, level: 1 }"></ng-container>

      <ng-template #nodeTemplate let-node let-level="level">
        <div class="print-node" [style.margin-left.px]="(level - 1) * 20">
          <!-- Heading Level logic: Titre n (n=level) -->
          @if (level === 1) { <h2>{{ node.title }}</h2> }
          @else if (level === 2) { <h3>{{ node.title }}</h3> }
          @else if (level === 3) { <h4>{{ node.title }}</h4> }
          @else { <h5>{{ node.title }}</h5> }

          <div class="print-meta">
            @if (node.ticketNumber) { <span><b>Ticket:</b> {{ node.ticketNumber }}</span> }
            @if (node.price) { <span><b>Prix:</b> {{ node.price }}€</span> }
            @if (node.days) { <span><b>Jours:</b> {{ node.days }}j</span> }
          </div>

          <div class="print-content">
            @switch (node.contentType) {
              @case ('text') {
                <div [innerHTML]="node.content"></div>
              }
              @case ('image') {
                @if (node.content) {
                  <img [src]="node.content" alt="Image">
                }
              }
              @case ('tasks') {
                @if (node.tasks?.length) {
                  <ul class="print-tasks">
                    @for (task of node.tasks; track task.id) {
                      <li class="print-task-item" [class.completed]="task.completed">
                        <span class="print-checkbox" [class.checked]="task.completed"></span>
                        <span>{{ task.label }}</span>
                      </li>
                    }
                  </ul>
                }
              }
              @case ('code') {
                @if (node.content) {
                  <div class="print-code">
                    <div class="print-code-lang">{{ node.codeLanguage || 'text' }}</div>
                    <pre><code>{{ node.content }}</code></pre>
                  </div>
                }
              }
            }
          </div>

          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child, level: level + 1 }"></ng-container>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .print-document {
      display: none; /* Hidden by default */
      padding: 2rem;
      background: white;
      color: black;
    }

    @media print {
      .print-document {
        display: block; /* Visible only when printing */
      }

      h1 { font-size: 24pt; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 0.5rem; text-align: center; }
      h2 { font-size: 18pt; margin-top: 1.5rem; color: #333; }
      h3 { font-size: 16pt; margin-top: 1rem; color: #444; }
      h4 { font-size: 14pt; margin-top: 0.75rem; color: #555; }
      h5 { font-size: 12pt; margin-top: 0.5rem; color: #666; font-style: italic; }

      .print-node {
        margin-bottom: 1.5rem;
        page-break-inside: avoid;
      }

      .print-meta {
        font-size: 10pt;
        color: #444;
        margin-bottom: 4pt;
        display: flex;
        gap: 15pt;
      }

      .print-content {
        margin-top: 0.5rem;
        font-size: 11pt;
        line-height: 1.4;
        
        img {
          max-width: 100%;
          max-height: 300px;
          display: block;
          margin: 1rem 0;
        }
      }
      .print-tasks {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .print-task-item {
      display: flex;
      align-items: center;
      margin-bottom: 4pt;
    }
    .print-checkbox {
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      margin-right: 6pt;
      display: inline-block;
    }
    .print-checkbox.checked {
      background: #000;
    }
    .print-code {
      background: #f5f5f5;
      padding: 8pt;
      border-radius: 4pt;
      font-family: monospace;
    }
    .print-code-lang {
      font-weight: bold;
      margin-bottom: 4pt;
    }
  }
  `]
})
export class PrintViewComponent {
  @Input({ required: true }) rootNode!: TreeNode;
  @Input({ required: true }) docName!: string;
}
