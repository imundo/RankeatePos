import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StockService, StockDto } from '@core/services/stock.service';
import { AuthService } from '@core/auth/auth.service';
import { BranchContextService } from '@core/services/branch-context.service';

@Component({
    selector: 'app-stock-alerts-widget',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <section class="dashboard-section alerts-section" *ngIf="lowStockItems().length > 0">
      <div class="section-header-mobile">
        <h3>⚠️ Alertas de Stock ({{ lowStockCount() }})</h3>
        <a routerLink="/inventory" [queryParams]="{ filter: 'low' }" class="view-all">Ver todo</a>
      </div>
      
      <div class="alerts-list-mobile">
        @for (item of lowStockItems().slice(0, 5); track item.id) {
          <div class="alert-item">
            <div class="alert-icon">📦</div>
            <div class="alert-content">
              <span class="alert-title">{{ item.productName }}</span>
              <span class="alert-meta">
                SKU: {{ item.variantSku }} • Mín: {{ item.stockMinimo }}
              </span>
            </div>
            <div class="alert-status">
              <span class="stock-badge critical">
                {{ item.cantidadDisponible }}
              </span>
            </div>
            <a class="btn-restock" routerLink="/inventory" [queryParams]="{ search: item.variantSku }">
              Reponer
            </a>
          </div>
        }
      </div>
    </section>
  `,
    styles: [`
    .alerts-section {
      margin-top: 1rem;
      background: var(--glass-bg, rgba(30, 41, 59, 0.7));
      backdrop-filter: blur(var(--glass-blur, 10px));
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
      border-radius: var(--border-radius, 16px);
      padding: 1rem;
    }

    .section-header-mobile {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      
      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary, #fff);
      }
      
      .view-all {
        font-size: 0.85rem;
        color: var(--primary-color, #6366f1);
        text-decoration: none;
        font-weight: 500;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .alerts-list-mobile {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.08); /* Red tint */
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      transition: transform 0.2s;
      
      &:hover {
        transform: translateX(4px);
        background: rgba(239, 68, 68, 0.12);
      }
    }

    .alert-icon {
      font-size: 1.25rem;
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 8px;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .alert-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary, #fff);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .alert-meta {
      font-size: 0.75rem;
      color: var(--text-secondary, rgba(255, 255, 255, 0.6));
    }

    .stock-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 0.85rem;
      font-weight: 700;
      
      &.critical {
        background: #EF4444;
        color: white;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
      }
    }

    .btn-restock {
      padding: 0.4rem 0.8rem;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: var(--text-primary, #fff);
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      margin-left: 0.5rem;
      text-decoration: none;
      white-space: nowrap;
      
      &:hover {
        background: rgba(255,255,255,0.15);
      }
    }
  `]
})
export class StockAlertsWidgetComponent implements OnInit {
    private stockService = inject(StockService);
    private authService = inject(AuthService);
    private branchContext = inject(BranchContextService);

    lowStockItems = signal<StockDto[]>([]);
    lowStockCount = signal(0);

    constructor() {
        effect(() => {
            // Reload when branch changes
            if (this.branchContext.activeBranchId()) {
                this.loadData();
            }
        });
    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        const branchId = this.branchContext.activeBranchId();
        if (!branchId) return;

        this.stockService.getStockByBranch(branchId).subscribe({
            next: (stock) => {
                const low = stock.filter(s => s.stockBajo);
                this.lowStockItems.set(low);
                this.lowStockCount.set(low.length);
            },
            error: (err) => console.error('Error loading stock alerts', err)
        });
    }
}
