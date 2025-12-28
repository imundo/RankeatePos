import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'FREE_PRODUCT';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  currentUses: number;
  targetSegment?: string;
  targetTier?: string;
  active: boolean;
  coupons: Coupon[];
}

interface Coupon {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  active: boolean;
  expiresAt?: string;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="promos-container">
      <!-- Header -->
      <header class="promos-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>🎫 Motor de Promociones</h1>
            <p class="subtitle">Cupones, descuentos y ofertas especiales</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn primary" (click)="showNewPromo = true">
            ➕ Nueva Promoción
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">🎫</div>
          <div class="stat-content">
            <span class="stat-value">{{ activePromotions() }}</span>
            <span class="stat-label">Promos Activas</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalRedemptions() }}</span>
            <span class="stat-label">Canjes Totales</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(totalSavings()) }}</span>
            <span class="stat-label">Ahorro Generado</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <span class="stat-value">{{ conversionRate() }}%</span>
            <span class="stat-label">Tasa de Uso</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'">
          ✅ Activas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'scheduled'" (click)="activeTab = 'scheduled'">
          📅 Programadas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'expired'" (click)="activeTab = 'expired'">
          ⏰ Expiradas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'coupons'" (click)="activeTab = 'coupons'">
          🎟️ Cupones
        </button>
      </div>

      <!-- Promotions Grid -->
      @if (activeTab !== 'coupons') {
        <div class="promos-grid">
          @for (promo of filteredPromotions(); track promo.id) {
            <div class="promo-card" [class.inactive]="!promo.active">
              <div class="promo-header">
                <div class="promo-type" [class]="promo.type.toLowerCase()">
                  {{ getTypeIcon(promo.type) }}
                </div>
                <div class="promo-info">
                  <h3>{{ promo.name }}</h3>
                  <span class="promo-desc">{{ promo.description }}</span>
                </div>
                <div class="promo-toggle">
                  <button class="toggle-btn" [class.active]="promo.active" (click)="togglePromo(promo)">
                    {{ promo.active ? '✅' : '❌' }}
                  </button>
                </div>
              </div>
              
              <div class="promo-details">
                <div class="detail-item">
                  <span class="label">Descuento</span>
                  <span class="value discount">{{ formatDiscount(promo) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Mínimo</span>
                  <span class="value">{{ formatPrice(promo.minPurchase) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Canjes</span>
                  <span class="value">{{ promo.currentUses }}{{ promo.maxUses ? '/' + promo.maxUses : '' }}</span>
                </div>
              </div>
              
              <div class="promo-dates">
                <span class="date-range">
                  📅 {{ formatDate(promo.startDate) }} - {{ formatDate(promo.endDate) }}
                </span>
                @if (promo.targetSegment) {
                  <span class="target-badge">{{ promo.targetSegment }}</span>
                }
                @if (promo.targetTier) {
                  <span class="tier-badge">{{ promo.targetTier }}</span>
                }
              </div>
              
              <div class="promo-actions">
                <button class="action-small" (click)="viewCoupons(promo)">🎟️ Cupones</button>
                <button class="action-small" (click)="generateCoupons(promo)">➕ Generar</button>
                <button class="action-small" (click)="editPromo(promo)">✏️ Editar</button>
              </div>
              
              <!-- Usage Progress -->
              @if (promo.maxUses) {
                <div class="usage-bar">
                  <div class="usage-progress" [style.width.%]="(promo.currentUses / promo.maxUses) * 100"></div>
                </div>
              }
            </div>
          } @empty {
            <div class="empty-state">
              <span class="empty-icon">🎫</span>
              <h3>No hay promociones {{ getTabLabel() }}</h3>
              <p>Crea una nueva promoción para empezar</p>
            </div>
          }
        </div>
      }

      <!-- Coupons Tab -->
      @if (activeTab === 'coupons') {
        <div class="coupons-section">
          <div class="coupon-search">
            <input type="text" placeholder="🔍 Buscar por código..." [(ngModel)]="couponSearch">
            <button class="validate-btn" (click)="validateCoupon()">Validar Cupón</button>
          </div>
          
          <div class="coupons-grid">
            @for (promo of promotions(); track promo.id) {
              @for (coupon of promo.coupons; track coupon.id) {
                <div class="coupon-card" [class.used]="coupon.currentUses >= coupon.maxUses" [class.inactive]="!coupon.active">
                  <div class="coupon-code">{{ coupon.code }}</div>
                  <div class="coupon-promo">{{ promo.name }}</div>
                  <div class="coupon-stats">
                    <span>Usos: {{ coupon.currentUses }}/{{ coupon.maxUses }}</span>
                    @if (coupon.expiresAt) {
                      <span>Expira: {{ formatDate(coupon.expiresAt) }}</span>
                    }
                  </div>
                  <div class="coupon-actions">
                    <button class="copy-btn" (click)="copyCoupon(coupon.code)">📋 Copiar</button>
                    <button class="qr-btn" (click)="showQR(coupon)">📱 QR</button>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- New Promotion Modal -->
      @if (showNewPromo) {
        <div class="modal-overlay" (click)="showNewPromo = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>➕ Nueva Promoción</h2>
            <form (ngSubmit)="savePromo()">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" [(ngModel)]="newPromo.name" name="name" required placeholder="Ej: 10% Descuento Navidad">
              </div>
              
              <div class="form-group">
                <label>Descripción</label>
                <input type="text" [(ngModel)]="newPromo.description" name="description" placeholder="Descuento especial...">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Tipo *</label>
                  <select [(ngModel)]="newPromo.type" name="type">
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED_AMOUNT">Monto Fijo ($)</option>
                    <option value="BOGO">2x1</option>
                    <option value="FREE_PRODUCT">Producto Gratis</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Valor Descuento *</label>
                  <input type="number" [(ngModel)]="newPromo.discountValue" name="discountValue" min="0">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Compra Mínima</label>
                  <input type="number" [(ngModel)]="newPromo.minPurchase" name="minPurchase" min="0">
                </div>
                <div class="form-group">
                  <label>Descuento Máximo</label>
                  <input type="number" [(ngModel)]="newPromo.maxDiscount" name="maxDiscount" min="0">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Fecha Inicio *</label>
                  <input type="date" [(ngModel)]="newPromo.startDate" name="startDate" required>
                </div>
                <div class="form-group">
                  <label>Fecha Fin *</label>
                  <input type="date" [(ngModel)]="newPromo.endDate" name="endDate" required>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Usos Máximos</label>
                  <input type="number" [(ngModel)]="newPromo.maxUses" name="maxUses" min="1" placeholder="Sin límite">
                </div>
                <div class="form-group">
                  <label>Segmento</label>
                  <select [(ngModel)]="newPromo.targetSegment" name="targetSegment">
                    <option value="">Todos</option>
                    <option value="VIP">VIP</option>
                    <option value="REGULAR">Regular</option>
                    <option value="NEW">Nuevo</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label>Código de Cupón</label>
                <div class="code-input">
                  <input type="text" [(ngModel)]="newPromo.couponCode" name="couponCode" placeholder="NAVIDAD10" style="text-transform: uppercase">
                  <button type="button" class="generate-code-btn" (click)="generateCode()">🎲 Generar</button>
                </div>
              </div>
              
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showNewPromo = false">Cancelar</button>
                <button type="submit" class="save-btn">Crear Promoción</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .promos-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    .promos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.5rem;
    }
    .title-section h1 { font-size: 1.75rem; margin: 0; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; }

    .action-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      font-weight: 600; cursor: pointer; border: none;
      background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem; border-radius: 16px;
      display: flex; align-items: center; gap: 1rem;
    }
    .gradient-purple { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
    .gradient-green { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }

    .stat-icon { font-size: 2.5rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.75rem; font-weight: 800; }
    .stat-label { font-size: 0.875rem; opacity: 0.9; }

    .tabs-container {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.05); padding: 0.5rem; border-radius: 12px;
    }
    .tab-btn {
      padding: 0.75rem 1.5rem; border: none;
      background: transparent; color: rgba(255, 255, 255, 0.6);
      font-weight: 600; cursor: pointer; border-radius: 8px;
    }
    .tab-btn.active { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; }

    .promos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.25rem;
    }

    .promo-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s;
    }
    .promo-card:hover { transform: translateY(-2px); border-color: rgba(99, 102, 241, 0.5); }
    .promo-card.inactive { opacity: 0.6; }

    .promo-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .promo-type {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
    }
    .promo-type.percentage { background: rgba(16, 185, 129, 0.2); }
    .promo-type.fixed_amount { background: rgba(59, 130, 246, 0.2); }
    .promo-type.bogo { background: rgba(245, 158, 11, 0.2); }
    .promo-type.free_product { background: rgba(236, 72, 153, 0.2); }

    .promo-info { flex: 1; }
    .promo-info h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }
    .promo-desc { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); }

    .toggle-btn {
      width: 36px; height: 36px; border-radius: 8px;
      border: none; cursor: pointer; font-size: 1rem;
      background: rgba(255, 255, 255, 0.1);
    }

    .promo-details {
      display: flex; gap: 1.5rem;
      padding: 0.75rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin: 0.75rem 0;
    }
    .detail-item { display: flex; flex-direction: column; }
    .detail-item .label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .detail-item .value { font-size: 1rem; font-weight: 600; }
    .detail-item .value.discount { color: #10B981; font-size: 1.25rem; }

    .promo-dates {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.8rem; color: rgba(255, 255, 255, 0.6);
      margin-bottom: 0.75rem;
    }
    .target-badge, .tier-badge {
      padding: 0.15rem 0.5rem; border-radius: 4px;
      font-size: 0.7rem; font-weight: 600;
      background: rgba(99, 102, 241, 0.2); color: #A5B4FC;
    }

    .promo-actions { display: flex; gap: 0.5rem; }
    .action-small {
      flex: 1; padding: 0.5rem; border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: white; font-size: 0.8rem; cursor: pointer;
    }
    .action-small:hover { background: rgba(99, 102, 241, 0.2); }

    .usage-bar {
      height: 4px; background: rgba(255, 255, 255, 0.1);
      border-radius: 2px; margin-top: 1rem; overflow: hidden;
    }
    .usage-progress {
      height: 100%; background: linear-gradient(90deg, #10B981, #34D399);
      border-radius: 2px;
    }

    .empty-state {
      grid-column: 1 / -1; text-align: center; padding: 4rem;
      background: rgba(255, 255, 255, 0.03); border-radius: 16px;
    }
    .empty-icon { font-size: 4rem; }
    .empty-state h3 { margin: 1rem 0 0.5rem; }
    .empty-state p { color: rgba(255, 255, 255, 0.5); }

    /* Coupons */
    .coupon-search {
      display: flex; gap: 1rem; margin-bottom: 1.5rem;
    }
    .coupon-search input {
      flex: 1; padding: 0.875rem 1.25rem; border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05); color: white;
    }
    .validate-btn {
      padding: 0.875rem 1.5rem; border-radius: 12px;
      background: linear-gradient(135deg, #10B981, #34D399);
      border: none; color: white; font-weight: 600; cursor: pointer;
    }

    .coupons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .coupon-card {
      background: rgba(255, 255, 255, 0.05);
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px; padding: 1.25rem; text-align: center;
    }
    .coupon-card.used { opacity: 0.5; }
    .coupon-code {
      font-size: 1.5rem; font-weight: 800; font-family: monospace;
      letter-spacing: 2px; margin-bottom: 0.5rem;
      color: #A5B4FC;
    }
    .coupon-promo { font-size: 0.85rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem; }
    .coupon-stats { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); margin-bottom: 1rem; }
    .coupon-actions { display: flex; gap: 0.5rem; justify-content: center; }
    .copy-btn, .qr-btn {
      padding: 0.5rem 1rem; border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent; color: white; cursor: pointer;
    }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px; padding: 2rem;
      width: 100%; max-width: 550px; max-height: 90vh;
      overflow-y: auto; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-content h2 { margin: 0 0 1.5rem; }

    .form-row { display: flex; gap: 1rem; }
    .form-group { flex: 1; margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .form-group input, .form-group select {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white;
    }

    .code-input { display: flex; gap: 0.5rem; }
    .code-input input { flex: 1; }
    .generate-code-btn {
      padding: 0.75rem 1rem; border-radius: 10px;
      background: rgba(99, 102, 241, 0.2); border: none;
      color: white; cursor: pointer;
    }

    .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .cancel-btn, .save-btn {
      flex: 1; padding: 0.875rem; border-radius: 12px;
      font-weight: 600; cursor: pointer;
    }
    .cancel-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: white; }
    .save-btn { background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; color: white; }
  `]
})
export class PromotionsComponent implements OnInit {
  activeTab: 'active' | 'scheduled' | 'expired' | 'coupons' = 'active';
  showNewPromo = false;
  couponSearch = '';

  promotions = signal<Promotion[]>([]);

  newPromo = {
    name: '', description: '', type: 'PERCENTAGE' as const,
    discountValue: 10, minPurchase: 0, maxDiscount: null as number | null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: null as number | null, targetSegment: '', couponCode: ''
  };

  private mockPromotions: Promotion[] = [
    { id: '1', name: '10% Descuento Navidad', description: 'Descuento especial de Navidad', type: 'PERCENTAGE', discountValue: 10, minPurchase: 10000, startDate: '2024-12-01', endDate: '2024-12-31', maxUses: 1000, currentUses: 156, active: true, coupons: [{ id: 'c1', code: 'NAVIDAD10', maxUses: 1000, currentUses: 156, active: true }] },
    { id: '2', name: '15% VIP Exclusivo', description: 'Descuento para clientes VIP', type: 'PERCENTAGE', discountValue: 15, minPurchase: 20000, maxDiscount: 100000, startDate: '2024-12-01', endDate: '2025-01-31', maxUses: 500, currentUses: 42, active: true, targetSegment: 'VIP', coupons: [{ id: 'c2', code: 'VIP15', maxUses: 500, currentUses: 42, active: true }] },
    { id: '3', name: '$5.000 de Descuento', description: 'Descuento fijo en compras sobre $25k', type: 'FIXED_AMOUNT', discountValue: 5000, minPurchase: 25000, startDate: '2024-12-15', endDate: '2025-01-15', maxUses: 500, currentUses: 89, active: true, coupons: [{ id: 'c3', code: 'AHORRA5K', maxUses: 500, currentUses: 89, active: true }] },
    { id: '4', name: '2x1 en Postres', description: 'Lleva dos y paga uno', type: 'BOGO', discountValue: 50, minPurchase: 0, startDate: '2024-12-20', endDate: '2024-12-27', maxUses: 200, currentUses: 34, active: true, coupons: [{ id: 'c4', code: 'POSTRE2X1', maxUses: 200, currentUses: 34, active: true }] },
    { id: '5', name: '20% Platino', description: 'Exclusivo miembros Platino', type: 'PERCENTAGE', discountValue: 20, minPurchase: 15000, maxDiscount: 80000, startDate: '2024-12-01', endDate: '2025-03-31', currentUses: 28, active: true, targetTier: 'PLATINUM', coupons: [{ id: 'c5', code: 'PLATINO20', maxUses: 1000, currentUses: 28, active: true }] }
  ];

  filteredPromotions = computed(() => {
    const now = new Date();
    return this.promotions().filter(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);

      switch (this.activeTab) {
        case 'active': return p.active && start <= now && end >= now;
        case 'scheduled': return start > now;
        case 'expired': return end < now;
        default: return true;
      }
    });
  });

  activePromotions = computed(() => {
    const now = new Date();
    return this.promotions().filter(p => p.active && new Date(p.startDate) <= now && new Date(p.endDate) >= now).length;
  });

  totalRedemptions = computed(() => this.promotions().reduce((sum, p) => sum + p.currentUses, 0));
  totalSavings = computed(() => this.totalRedemptions() * 5000); // Estimated
  conversionRate = computed(() => {
    const total = this.promotions().reduce((sum, p) => sum + (p.maxUses || 1000), 0);
    return total > 0 ? Math.round(this.totalRedemptions() / total * 100) : 0;
  });

  ngOnInit() {
    this.promotions.set(this.mockPromotions);
  }

  togglePromo(promo: Promotion) {
    this.promotions.update(list => list.map(p => p.id === promo.id ? { ...p, active: !p.active } : p));
  }

  savePromo() {
    if (!this.newPromo.name) return;

    const promo: Promotion = {
      id: Date.now().toString(),
      name: this.newPromo.name,
      description: this.newPromo.description,
      type: this.newPromo.type,
      discountValue: this.newPromo.discountValue,
      minPurchase: this.newPromo.minPurchase,
      maxDiscount: this.newPromo.maxDiscount || undefined,
      startDate: this.newPromo.startDate,
      endDate: this.newPromo.endDate,
      maxUses: this.newPromo.maxUses || undefined,
      currentUses: 0,
      targetSegment: this.newPromo.targetSegment || undefined,
      active: true,
      coupons: this.newPromo.couponCode ? [{ id: Date.now().toString(), code: this.newPromo.couponCode.toUpperCase(), maxUses: this.newPromo.maxUses || 1000, currentUses: 0, active: true }] : []
    };

    this.promotions.update(list => [...list, promo]);
    this.showNewPromo = false;
    this.resetNewPromo();
  }

  resetNewPromo() {
    this.newPromo = {
      name: '', description: '', type: 'PERCENTAGE',
      discountValue: 10, minPurchase: 0, maxDiscount: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxUses: null, targetSegment: '', couponCode: ''
    };
  }

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newPromo.couponCode = code;
  }

  viewCoupons(promo: Promotion) { this.activeTab = 'coupons'; }
  generateCoupons(promo: Promotion) { alert('Generar cupones: ' + promo.name); }
  editPromo(promo: Promotion) { alert('Editar: ' + promo.name); }
  validateCoupon() { alert('Validar: ' + this.couponSearch); }
  copyCoupon(code: string) { navigator.clipboard.writeText(code); alert('Copiado: ' + code); }
  showQR(coupon: Coupon) { alert('QR para: ' + coupon.code); }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = { 'PERCENTAGE': '%', 'FIXED_AMOUNT': '$', 'BOGO': '2x1', 'FREE_PRODUCT': '🎁' };
    return icons[type] || '🎫';
  }

  getTabLabel(): string {
    const labels: Record<string, string> = { 'active': 'activas', 'scheduled': 'programadas', 'expired': 'expiradas' };
    return labels[this.activeTab] || '';
  }

  formatDiscount(promo: Promotion): string {
    if (promo.type === 'PERCENTAGE') return promo.discountValue + '%';
    if (promo.type === 'FIXED_AMOUNT') return '$' + promo.discountValue.toLocaleString('es-CL');
    if (promo.type === 'BOGO') return '2x1';
    return 'Gratis';
  }

  formatPrice(amount: number): string {
    return '$' + Math.round(amount).toLocaleString('es-CL');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL');
  }
}
