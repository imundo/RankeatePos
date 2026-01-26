import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { StepsModule } from 'primeng/steps';

@Component({
    selector: 'app-reception',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, TagModule, StepsModule],
    template: `
    <div class="reception-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📦 Recepción de Mercadería</h1>
          <p class="subtitle">Control de ingreso y validación de órdenes</p>
        </div>
      </div>

      <div class="pending-orders-grid">
         @for (po of pendingPOs(); track po.number) {
           <div class="po-card glass-card">
              <div class="po-header">
                <span class="po-number">OC #{{ po.number }}</span>
                <p-tag [value]="po.status" severity="info"></p-tag>
              </div>
              <div class="po-provider">
                <i class="pi pi-building"></i> {{ po.provider }}
              </div>
              <div class="po-details">
                <span>📅 {{ po.date }}</span>
                <span>📦 {{ po.items }} items</span>
              </div>
              <div class="po-actions">
                <button pButton label="Recibir" icon="pi pi-box" class="p-button-outlined w-full"></button>
              </div>
           </div>
         }
      </div>
    </div>
  `,
    styles: [`
    .reception-container {
      padding: 2rem;
      min-height: 100vh;
      background: var(--surface-card);
    }

    .page-header {
      margin-bottom: 2rem;
      h1 {
        margin: 0;
        font-size: 1.8rem;
        background: linear-gradient(90deg, #F59E0B, #D97706);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .pending-orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-5px);
        border-color: rgba(245, 158, 11, 0.4);
      }
    }

    .po-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .po-number {
      font-weight: 700;
      font-size: 1.1rem;
      color: #fff;
    }

    .po-provider {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #94A3B8;
      margin-bottom: 1rem;
    }

    .po-details {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: var(--text-secondary-color);
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  `]
})
export class ReceptionComponent {
    pendingPOs = signal([
        { number: '1050', provider: 'Distribuidora Central', status: 'ENVIADO', date: '25/01/2026', items: 12 },
        { number: '1051', provider: 'Insignia Supplies', status: 'PARCIAL', date: '24/01/2026', items: 5 },
    ]);
}
