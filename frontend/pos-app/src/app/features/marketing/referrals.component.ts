import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredId?: string;
  referredName?: string;
  referralCode: string;
  referredEmail?: string;
  status: 'PENDING' | 'REGISTERED' | 'CONVERTED' | 'REWARDED' | 'EXPIRED';
  referrerReward: number;
  referredReward: number;
  referrerRewarded: boolean;
  referredRewarded: boolean;
  firstPurchaseAmount?: number;
  convertedAt?: string;
  createdAt: string;
}

interface LeaderboardEntry {
  rank: number;
  customerId: string;
  name: string;
  referralCount: number;
  loyaltyTier: string;
}

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="referrals-container">
      <!-- Header -->
      <header class="referrals-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>🔗 Programa de Referidos</h1>
            <p class="subtitle">Haz crecer tu base de clientes con referidos</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="showSettings = true">
            ⚙️ Configuración
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">🔗</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalReferrals() }}</span>
            <span class="stat-label">Total Referidos</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <span class="stat-value">{{ conversions() }}</span>
            <span class="stat-label">Conversiones</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(totalRevenue()) }}</span>
            <span class="stat-label">Ingresos Generados</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <span class="stat-value">{{ conversionRate() }}%</span>
            <span class="stat-label">Tasa de Conversión</span>
          </div>
        </div>
      </div>

      <div class="main-content">
        <!-- Leaderboard -->
        <div class="leaderboard-section">
          <h3>🏆 Top Referidores</h3>
          <div class="leaderboard">
            @for (entry of leaderboard(); track entry.customerId; let i = $index) {
              <div class="leaderboard-item" [class]="'rank-' + entry.rank">
                <div class="rank">
                  @if (entry.rank === 1) { 🥇 }
                  @else if (entry.rank === 2) { 🥈 }
                  @else if (entry.rank === 3) { 🥉 }
                  @else { #{{ entry.rank }} }
                </div>
                <div class="leader-info">
                  <span class="leader-name">{{ entry.name }}</span>
                  <span class="leader-tier">{{ getTierIcon(entry.loyaltyTier) }} {{ entry.loyaltyTier }}</span>
                </div>
                <div class="leader-count">
                  {{ entry.referralCount }} referidos
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Referrals List -->
        <div class="referrals-section">
          <div class="section-header">
            <h3>📋 Referidos Recientes</h3>
            <div class="filter-tabs">
              <button [class.active]="statusFilter === 'ALL'" (click)="statusFilter = 'ALL'">Todos</button>
              <button [class.active]="statusFilter === 'PENDING'" (click)="statusFilter = 'PENDING'">Pendientes</button>
              <button [class.active]="statusFilter === 'CONVERTED'" (click)="statusFilter = 'CONVERTED'">Convertidos</button>
            </div>
          </div>

          <div class="referrals-list">
            @for (referral of filteredReferrals(); track referral.id) {
              <div class="referral-card" [class]="'status-' + referral.status.toLowerCase()">
                <div class="referral-header">
                  <div class="referrer">
                    <span class="label">Referidor</span>
                    <span class="name">{{ referral.referrerName }}</span>
                  </div>
                  <div class="arrow">→</div>
                  <div class="referred">
                    <span class="label">Referido</span>
                    <span class="name">{{ referral.referredName || referral.referredEmail || 'Pendiente' }}</span>
                  </div>
                </div>
                
                <div class="referral-details">
                  <div class="detail">
                    <span class="label">Código</span>
                    <span class="value code">{{ referral.referralCode }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">Estado</span>
                    <span class="status-badge" [class]="referral.status.toLowerCase()">
                      {{ getStatusIcon(referral.status) }} {{ getStatusLabel(referral.status) }}
                    </span>
                  </div>
                  @if (referral.firstPurchaseAmount) {
                    <div class="detail">
                      <span class="label">Primera Compra</span>
                      <span class="value">{{ formatPrice(referral.firstPurchaseAmount) }}</span>
                    </div>
                  }
                </div>
                
                <div class="referral-rewards">
                  <div class="reward" [class.earned]="referral.referrerRewarded">
                    <span class="reward-label">Recompensa Referidor</span>
                    <span class="reward-value">{{ formatPrice(referral.referrerReward) }}</span>
                    <span class="reward-status">{{ referral.referrerRewarded ? '✅ Entregada' : '⏳ Pendiente' }}</span>
                  </div>
                  <div class="reward" [class.earned]="referral.referredRewarded">
                    <span class="reward-label">Recompensa Referido</span>
                    <span class="reward-value">{{ formatPrice(referral.referredReward) }}</span>
                    <span class="reward-status">{{ referral.referredRewarded ? '✅ Entregada' : '⏳ Pendiente' }}</span>
                  </div>
                </div>
                
                <div class="referral-footer">
                  <span class="date">{{ formatDate(referral.createdAt) }}</span>
                  @if (referral.status === 'CONVERTED' && !referral.referrerRewarded) {
                    <button class="reward-btn" (click)="rewardReferrer(referral)">🎁 Entregar Recompensa</button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">🔗</span>
                <h3>No hay referidos {{ getFilterLabel() }}</h3>
                <p>Los referidos aparecerán aquí cuando tus clientes inviten amigos</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Reward Program Info -->
      <div class="program-info">
        <h3>ℹ️ Cómo Funciona</h3>
        <div class="steps-grid">
          <div class="step">
            <div class="step-icon">1️⃣</div>
            <div class="step-content">
              <h4>Cliente Comparte</h4>
              <p>El cliente comparte su código único con amigos</p>
            </div>
          </div>
          <div class="step">
            <div class="step-icon">2️⃣</div>
            <div class="step-content">
              <h4>Amigo se Registra</h4>
              <p>El amigo se registra usando el código de referido</p>
            </div>
          </div>
          <div class="step">
            <div class="step-icon">3️⃣</div>
            <div class="step-content">
              <h4>Primera Compra</h4>
              <p>El amigo realiza su primera compra</p>
            </div>
          </div>
          <div class="step">
            <div class="step-icon">4️⃣</div>
            <div class="step-content">
              <h4>¡Recompensas!</h4>
              <p>Ambos reciben sus recompensas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      @if (showSettings) {
        <div class="modal-overlay" (click)="showSettings = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>⚙️ Configuración de Referidos</h2>
            
            <div class="form-group">
              <label>Recompensa para Referidor</label>
              <div class="input-with-prefix">
                <span class="prefix">$</span>
                <input type="number" [(ngModel)]="settings.referrerReward" min="0">
              </div>
            </div>
            
            <div class="form-group">
              <label>Recompensa para Referido</label>
              <div class="input-with-prefix">
                <span class="prefix">$</span>
                <input type="number" [(ngModel)]="settings.referredReward" min="0">
              </div>
            </div>
            
            <div class="form-group">
              <label>Tipo de Recompensa</label>
              <select [(ngModel)]="settings.rewardType">
                <option value="DISCOUNT">Cupón de Descuento</option>
                <option value="POINTS">Puntos de Lealtad</option>
                <option value="CASH">Crédito en Cuenta</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Días para Expirar Invitación</label>
              <input type="number" [(ngModel)]="settings.expirationDays" min="1">
            </div>
            
            <div class="modal-actions">
              <button class="cancel-btn" (click)="showSettings = false">Cancelar</button>
              <button class="save-btn" (click)="saveSettings()">Guardar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .referrals-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    .referrals-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
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
    }
    .action-btn.secondary { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem; margin-bottom: 2rem;
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

    .main-content { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; margin-bottom: 2rem; }

    /* Leaderboard */
    .leaderboard-section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
    }
    .leaderboard-section h3 { margin: 0 0 1rem; font-size: 1rem; }

    .leaderboard { display: flex; flex-direction: column; gap: 0.75rem; }
    .leaderboard-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem; background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }
    .leaderboard-item.rank-1 { background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.3); }
    .leaderboard-item.rank-2 { background: rgba(156, 163, 175, 0.2); border: 1px solid rgba(156, 163, 175, 0.3); }
    .leaderboard-item.rank-3 { background: rgba(180, 83, 9, 0.2); border: 1px solid rgba(180, 83, 9, 0.3); }

    .rank { font-size: 1.25rem; min-width: 40px; text-align: center; }
    .leader-info { flex: 1; display: flex; flex-direction: column; }
    .leader-name { font-weight: 600; font-size: 0.9rem; }
    .leader-tier { font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); }
    .leader-count { font-size: 0.8rem; color: #10B981; font-weight: 600; }

    /* Referrals List */
    .referrals-section { }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; font-size: 1rem; }

    .filter-tabs { display: flex; gap: 0.5rem; }
    .filter-tabs button {
      padding: 0.5rem 1rem; border-radius: 8px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.6); cursor: pointer; font-size: 0.85rem;
    }
    .filter-tabs button.active { background: #6366F1; color: white; border-color: #6366F1; }

    .referrals-list { display: flex; flex-direction: column; gap: 1rem; }

    .referral-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .referral-card.status-pending { border-left: 4px solid #F59E0B; }
    .referral-card.status-registered { border-left: 4px solid #3B82F6; }
    .referral-card.status-converted { border-left: 4px solid #10B981; }
    .referral-card.status-rewarded { border-left: 4px solid #8B5CF6; }
    .referral-card.status-expired { border-left: 4px solid #6B7280; opacity: 0.6; }

    .referral-header {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;
    }
    .referrer, .referred { flex: 1; }
    .referrer .label, .referred .label {
      display: block; font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5); text-transform: uppercase;
    }
    .referrer .name, .referred .name { font-weight: 600; }
    .arrow { color: rgba(255, 255, 255, 0.3); font-size: 1.5rem; }

    .referral-details {
      display: flex; gap: 2rem; padding: 0.75rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin: 0.75rem 0;
    }
    .detail { display: flex; flex-direction: column; }
    .detail .label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .detail .value { font-weight: 500; }
    .detail .value.code { font-family: monospace; letter-spacing: 1px; color: #A5B4FC; }

    .status-badge {
      padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
    }
    .status-badge.pending { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
    .status-badge.registered { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .status-badge.converted { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .status-badge.rewarded { background: rgba(139, 92, 246, 0.2); color: #A78BFA; }
    .status-badge.expired { background: rgba(107, 114, 128, 0.2); color: #9CA3AF; }

    .referral-rewards {
      display: flex; gap: 1rem; margin-bottom: 0.75rem;
    }
    .reward {
      flex: 1; padding: 0.75rem; background: rgba(255, 255, 255, 0.03);
      border-radius: 10px; text-align: center;
    }
    .reward.earned { background: rgba(16, 185, 129, 0.1); }
    .reward-label { display: block; font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .reward-value { display: block; font-size: 1.1rem; font-weight: 700; color: #10B981; margin: 0.25rem 0; }
    .reward-status { font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); }

    .referral-footer {
      display: flex; justify-content: space-between; align-items: center;
    }
    .date { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
    .reward-btn {
      padding: 0.5rem 1rem; border-radius: 8px;
      background: linear-gradient(135deg, #10B981, #34D399);
      border: none; color: white; cursor: pointer; font-weight: 600;
    }

    .empty-state {
      text-align: center; padding: 3rem;
      background: rgba(255, 255, 255, 0.03); border-radius: 16px;
    }
    .empty-icon { font-size: 3rem; }
    .empty-state h3 { margin: 1rem 0 0.5rem; }
    .empty-state p { color: rgba(255, 255, 255, 0.5); }

    /* Program Info */
    .program-info {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.5rem;
    }
    .program-info h3 { margin: 0 0 1rem; font-size: 1rem; }

    .steps-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
    }
    .step {
      text-align: center; padding: 1rem;
      background: rgba(255, 255, 255, 0.03); border-radius: 12px;
    }
    .step-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .step-content h4 { margin: 0 0 0.25rem; font-size: 0.9rem; }
    .step-content p { margin: 0; font-size: 0.8rem; color: rgba(255, 255, 255, 0.6); }

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
      width: 100%; max-width: 450px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-content h2 { margin: 0 0 1.5rem; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .form-group input, .form-group select {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white;
    }

    .input-with-prefix { display: flex; align-items: center; }
    .input-with-prefix .prefix {
      padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2); border-right: none;
      border-radius: 10px 0 0 10px;
    }
    .input-with-prefix input { border-radius: 0 10px 10px 0; }

    .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .cancel-btn, .save-btn { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .cancel-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: white; }
    .save-btn { background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; color: white; }

    @media (max-width: 900px) {
      .main-content { grid-template-columns: 1fr; }
      .steps-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ReferralsComponent implements OnInit {
  statusFilter: 'ALL' | 'PENDING' | 'CONVERTED' = 'ALL';
  showSettings = false;

  referrals = signal<Referral[]>([]);
  leaderboard = signal<LeaderboardEntry[]>([]);

  settings = {
    referrerReward: 5000,
    referredReward: 3000,
    rewardType: 'DISCOUNT',
    expirationDays: 30
  };

  private mockReferrals: Referral[] = [
    { id: '1', referrerId: '1', referrerName: 'María González', referredId: '12', referredName: 'Joaquín Sepúlveda', referralCode: 'REFMARIA01', status: 'REWARDED', referrerReward: 5000, referredReward: 3000, referrerRewarded: true, referredRewarded: true, firstPurchaseAmount: 18500, convertedAt: '2024-12-20', createdAt: '2024-12-15' },
    { id: '2', referrerId: '1', referrerName: 'María González', referredId: '13', referredName: 'Isidora Valenzuela', referralCode: 'REFMARIA01', status: 'CONVERTED', referrerReward: 5000, referredReward: 3000, referrerRewarded: false, referredRewarded: true, firstPurchaseAmount: 15200, convertedAt: '2024-12-18', createdAt: '2024-12-10' },
    { id: '3', referrerId: '2', referrerName: 'Carlos Rodríguez', referredId: '14', referredName: 'Tomás Rojas', referralCode: 'REFCARLOS2', status: 'CONVERTED', referrerReward: 5000, referredReward: 3000, referrerRewarded: false, referredRewarded: true, firstPurchaseAmount: 12800, convertedAt: '2024-12-15', createdAt: '2024-12-01' },
    { id: '4', referrerId: '3', referrerName: 'Ana López', referredId: '15', referredName: 'Antonia Castro', referralCode: 'REFANA0003', status: 'REGISTERED', referrerReward: 5000, referredReward: 3000, referrerRewarded: false, referredRewarded: false, createdAt: '2024-12-20' },
    { id: '5', referrerId: '4', referrerName: 'Pedro Sánchez', referredEmail: 'amigo1@email.cl', referralCode: 'REFPEDRO4', status: 'PENDING', referrerReward: 5000, referredReward: 3000, referrerRewarded: false, referredRewarded: false, createdAt: '2024-12-22' },
    { id: '6', referrerId: '1', referrerName: 'María González', referredEmail: 'amigo2@email.cl', referralCode: 'REFMARIA01', status: 'PENDING', referrerReward: 5000, referredReward: 3000, referrerRewarded: false, referredRewarded: false, createdAt: '2024-12-23' },
    { id: '7', referrerId: '5', referrerName: 'Sofía Torres', referredEmail: 'amigo4@email.cl', referralCode: 'REFSOFIA5', status: 'EXPIRED', referrerReward: 5000, referredReward: 3000, referrerRewarded: false, referredRewarded: false, createdAt: '2024-06-01' }
  ];

  private mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, customerId: '1', name: 'María González', referralCount: 3, loyaltyTier: 'PLATINUM' },
    { rank: 2, customerId: '2', name: 'Carlos Rodríguez', referralCount: 2, loyaltyTier: 'PLATINUM' },
    { rank: 3, customerId: '3', name: 'Ana López', referralCount: 1, loyaltyTier: 'GOLD' },
    { rank: 4, customerId: '4', name: 'Pedro Sánchez', referralCount: 1, loyaltyTier: 'SILVER' },
    { rank: 5, customerId: '5', name: 'Sofía Torres', referralCount: 1, loyaltyTier: 'SILVER' }
  ];

  filteredReferrals = computed(() => {
    return this.referrals().filter(r => {
      if (this.statusFilter === 'ALL') return true;
      if (this.statusFilter === 'PENDING') return r.status === 'PENDING' || r.status === 'REGISTERED';
      if (this.statusFilter === 'CONVERTED') return r.status === 'CONVERTED' || r.status === 'REWARDED';
      return true;
    });
  });

  totalReferrals = computed(() => this.referrals().length);
  conversions = computed(() => this.referrals().filter(r => r.status === 'CONVERTED' || r.status === 'REWARDED').length);

  totalRevenue = computed(() =>
    this.referrals()
      .filter(r => r.firstPurchaseAmount)
      .reduce((sum, r) => sum + (r.firstPurchaseAmount || 0), 0)
  );

  conversionRate = computed(() => {
    const total = this.totalReferrals();
    return total > 0 ? Math.round(this.conversions() / total * 100) : 0;
  });

  ngOnInit() {
    this.referrals.set(this.mockReferrals);
    this.leaderboard.set(this.mockLeaderboard);
  }

  rewardReferrer(referral: Referral) {
    this.referrals.update(list => list.map(r =>
      r.id === referral.id ? { ...r, referrerRewarded: true, status: 'REWARDED' as const } : r
    ));
  }

  saveSettings() {
    this.showSettings = false;
    alert('Configuración guardada');
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = { 'PENDING': '⏳', 'REGISTERED': '📝', 'CONVERTED': '✅', 'REWARDED': '🎁', 'EXPIRED': '⌛' };
    return icons[status] || '📌';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { 'PENDING': 'Pendiente', 'REGISTERED': 'Registrado', 'CONVERTED': 'Convertido', 'REWARDED': 'Recompensado', 'EXPIRED': 'Expirado' };
    return labels[status] || status;
  }

  getTierIcon(tier: string): string {
    const icons: Record<string, string> = { 'PLATINUM': '💎', 'GOLD': '🥇', 'SILVER': '🥈', 'BRONZE': '🥉' };
    return icons[tier] || '🥉';
  }

  getFilterLabel(): string {
    const labels: Record<string, string> = { 'ALL': '', 'PENDING': 'pendientes', 'CONVERTED': 'convertidos' };
    return labels[this.statusFilter] || '';
  }

  formatPrice(amount: number): string {
    return '$' + Math.round(amount).toLocaleString('es-CL');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL');
  }
}
