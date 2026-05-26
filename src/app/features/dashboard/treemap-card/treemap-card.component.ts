import { Component, input, output, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TreeMapDocument } from '../../../core/models/treemap.model';

@Component({
  selector: 'app-treemap-card',
  standalone: true,
  imports: [DatePipe],
  template: `
    <article class="card" [class.card--danger]="showConfirm()">

      <!-- En-tête : badge + actions rapides -->
      <div class="card-header">
        <span class="badge" [class]="badgeClass()">
          <span class="dot"></span>{{ statusLabel() }}
        </span>
        <div class="quick-actions">
          <button class="icon-btn" (click)="edit.emit(treemap().id)" title="Modifier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn icon-btn--del" (click)="showConfirm.set(true)" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Titre -->
      <h3 class="card-title">{{ treemap().title }}</h3>

      <!-- Date de création -->
      <p class="card-date">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Créé le {{ treemap().createdAt | date:'dd/MM/yyyy' }}
      </p>

      <!-- Zone confirmation suppression -->
      @if (showConfirm()) {
        <div class="confirm-box">
          <p>Confirmer la suppression ?</p>
          <div class="confirm-row">
            <button class="confirm-btn confirm-btn--cancel" (click)="showConfirm.set(false)">Annuler</button>
            <button class="confirm-btn confirm-btn--delete" (click)="doDelete()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      } @else {
        <!-- Pied de carte -->
        <div class="card-footer">
          <button class="edit-btn" (click)="edit.emit(treemap().id)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modifier
          </button>
        </div>
      }
    </article>
  `,
  styles: [`
    .card {
      background: #fff;
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1.5px solid #F3F4F6;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
      display: flex; flex-direction: column; gap: .625rem;
      transition: box-shadow 150ms, border-color 150ms, transform 150ms;
      &:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); border-color: #E0E7FF; transform: translateY(-2px); }
      &.card--danger { border-color: #FCA5A5; }
    }

    /* Badge statut */
    .card-header { display: flex; align-items: center; justify-content: space-between; }
    .badge {
      display: inline-flex; align-items: center; gap: .375rem;
      padding: .25rem .625rem; border-radius: 9999px;
      font-size: .75rem; font-weight: 500;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }

    :host .badge.badge--en-cours   { background: #DBEAFE; color: #1D4ED8; .dot { background: #3B82F6; } }
    :host .badge.badge--terminé    { background: #D1FAE5; color: #065F46; .dot { background: #10B981; } }
    :host .badge.badge--brouillon  { background: #F3F4F6; color: #6B7280; .dot { background: #9CA3AF; } }

    /* Boutons icônes (apparaissent au hover) */
    .quick-actions { display: flex; gap: .25rem; opacity: 0; transition: opacity 150ms; }
    .card:hover .quick-actions { opacity: 1; }

    .icon-btn {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: .5rem; background: #F9FAFB; color: #6B7280;
      cursor: pointer; transition: all 150ms;
      &:hover { background: #E0E7FF; color: #4F46E5; }
      &.icon-btn--del:hover { background: #FEE2E2; color: #DC2626; }
    }

    /* Contenu */
    .card-title {
      font-size: 1rem; font-weight: 600; color: #111827; line-height: 1.4;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .card-date {
      display: flex; align-items: center; gap: .375rem;
      font-size: .75rem; color: #9CA3AF;
    }

    /* Pied */
    .card-footer { margin-top: .25rem; padding-top: .625rem; border-top: 1px solid #F9FAFB; }
    .edit-btn {
      display: inline-flex; align-items: center; gap: .375rem;
      padding: .4375rem .875rem;
      background: #EEF2FF; color: #4F46E5;
      border: none; border-radius: .5rem;
      font-size: .8125rem; font-weight: 500; font-family: inherit; cursor: pointer;
      transition: background 150ms;
      &:hover { background: #E0E7FF; }
    }

    /* Confirmation */
    .confirm-box {
      margin-top: .25rem; padding: .75rem;
      background: #FEF2F2; border-radius: .625rem;
      p { font-size: .8125rem; color: #991B1B; font-weight: 500; margin-bottom: .5rem; }
    }
    .confirm-row { display: flex; gap: .5rem; }
    .confirm-btn {
      flex: 1; padding: .375rem;
      border-radius: .5rem; font-size: .8125rem; font-weight: 500;
      font-family: inherit; cursor: pointer; transition: all 150ms;
      &.confirm-btn--cancel {
        border: 1.5px solid #E5E7EB; background: #fff; color: #374151;
        &:hover { background: #F9FAFB; }
      }
      &.confirm-btn--delete {
        display: flex; align-items: center; justify-content: center; gap: .375rem;
        border: none; background: #DC2626; color: #fff;
        &:hover { background: #B91C1C; }
      }
    }
  `],
})
export class TreemapCardComponent {
  treemap = input.required<TreeMapDocument>();
  edit   = output<string>();
  delete = output<string>();

  showConfirm = signal(false);

  statusLabel = computed(() => ({
    'en-cours': 'En cours',
    'terminé':  'Terminé',
    'brouillon': 'Brouillon',
  }[this.treemap().status] ?? this.treemap().status));

  badgeClass = computed(() => `badge badge--${this.treemap().status}`);

  doDelete() {
    this.delete.emit(this.treemap().id);
    this.showConfirm.set(false);
  }
}
