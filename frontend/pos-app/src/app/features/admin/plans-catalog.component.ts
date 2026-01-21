import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

interface PlanDisplay {
    code: string;
    name: string;
    price: number;
    currency: string;
    modules: string[];
    maxUsers: number;
    maxBranches: number;
    active: boolean;
}

@Component({
    selector: 'app-plans-catalog',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="catalog-page">
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/admin/dashboard" class="back-link">← Dashboard</a>
          <h1>💳 Catálogo de Planes</h1>
          <p class="subtitle">Membresías y suscripciones disponibles</p>
        </div>
      </header>

      <div class="plans-grid">
        @for (plan of plans(); track plan.code; let i = $index) {
          <div class="plan-card" [class.popular]="plan.code === 'PRO'" [style.--delay]="i * 100 + 'ms'">
            @if (plan.code === 'PRO') {
              <span class="badge popular">Más Popular</span>
            }
            <h3>{{ plan.name }}</h3>
            <div class="price">
              <span class="amount">{{ plan.price | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="period">/mes</span>
            </div>

            <div class="limits">
              <div class="limit-item">
                <span class="limit-icon">👥</span>
                <span>{{ plan.maxUsers }} usuarios</span>
              </div>
              <div class="limit-item">
                <span class="limit-icon">🏪</span>
                <span>{{ plan.maxBranches }} sucursales</span>
              </div>
            </div>

            <div class="modules-section">
              <h4>Módulos incluidos</h4>
              <div class="modules-list">
                @for (module of plan.modules; track module) {
                  <span class="module-chip">{{ getModuleIcon(module) }} {{ module }}</span>
                }
              </div>
            </div>

            <span class="status" [class.active]="plan.active">{{ plan.active ? 'Activo' : 'Inactivo' }}</span>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a1a 0%, #12122a 100%);
      color: white;
    }

    .catalog-page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .header-left { display: flex; flex-direction: column; gap: 0.5rem; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { color: white; }
    h1 { font-size: 1.5rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.5); margin: 0; }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .plan-card {
      position: relative;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 2rem;
      animation: fadeIn 0.5s ease forwards;
      animation-delay: var(--delay);
      opacity: 0;
    }

    @keyframes fadeIn { to { opacity: 1; } }

    .plan-card.popular {
      border-color: rgba(99,102,241,0.5);
      background: rgba(99,102,241,0.05);
    }

    .badge.popular {
      position: absolute;
      top: -12px;
      right: 20px;
      padding: 0.35rem 0.75rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    h3 { margin: 0 0 1rem; font-size: 1.5rem; }

    .price { margin-bottom: 1.5rem; }
    .amount { font-size: 2.5rem; font-weight: 700; }
    .period { color: rgba(255,255,255,0.5); }

    .limits {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .limit-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: rgba(255,255,255,0.8);
    }

    .modules-section h4 {
      margin: 0 0 0.75rem;
      font-size: 0.9rem;
      color: rgba(255,255,255,0.6);
    }

    .modules-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .module-chip {
      padding: 0.35rem 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      font-size: 0.8rem;
    }

    .status {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .status.active { background: rgba(16,185,129,0.2); color: #10b981; }
  `]
})
export class PlansCatalogComponent implements OnInit {
    private adminService = inject(AdminService);

    plans = signal<PlanDisplay[]>([]);

    moduleIcons: Record<string, string> = {
        'pos': '💰',
        'inventory': '📦',
        'invoicing': '📄',
        'facturacion': '📄',
        'crm': '👥',
        'loyalty': '⭐',
        'reservations': '📅',
        'kds': '🍳',
        'payroll': '💼',
        'accounting': '📊',
        'sales-report': '📈'
    };

    ngOnInit() {
        this.loadPlans();
    }

    loadPlans() {
        // Use hardcoded plans for now (can be fetched from API later)
        this.plans.set([
            {
                code: 'FREE',
                name: 'Starter',
                price: 0,
                currency: 'CLP',
                modules: ['pos'],
                maxUsers: 1,
                maxBranches: 1,
                active: true
            },
            {
                code: 'BASIC',
                name: 'Básico',
                price: 19990,
                currency: 'CLP',
                modules: ['pos', 'inventory'],
                maxUsers: 2,
                maxBranches: 1,
                active: true
            },
            {
                code: 'PRO',
                name: 'Profesional',
                price: 39990,
                currency: 'CLP',
                modules: ['pos', 'inventory', 'invoicing', 'crm'],
                maxUsers: 5,
                maxBranches: 2,
                active: true
            },
            {
                code: 'BUSINESS',
                name: 'Business',
                price: 79990,
                currency: 'CLP',
                modules: ['pos', 'inventory', 'invoicing', 'crm', 'loyalty', 'reservations'],
                maxUsers: 15,
                maxBranches: 5,
                active: true
            },
            {
                code: 'ENTERPRISE',
                name: 'Enterprise',
                price: 149990,
                currency: 'CLP',
                modules: ['pos', 'inventory', 'invoicing', 'crm', 'loyalty', 'reservations', 'kds', 'payroll', 'accounting'],
                maxUsers: 999,
                maxBranches: 999,
                active: true
            }
        ]);
    }

    getModuleIcon(module: string): string {
        return this.moduleIcons[module] || '📌';
    }
}
