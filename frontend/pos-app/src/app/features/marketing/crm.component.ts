import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  documentNumber?: string;
  address?: string;
  segment: 'VIP' | 'REGULAR' | 'NEW' | 'AT_RISK' | 'LOST';
  clv: number;
  totalPurchases: number;
  totalSpent: number;
  averageTicket: number;
  lastPurchaseDate: string;
  firstPurchaseDate: string;
  birthDate?: string;
  loyaltyPoints: number;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  score: number;
  emailOptIn: boolean;
  smsOptIn: boolean;
  whatsappOptIn: boolean;
  notes?: string;
  referralCode: string;
  tags: { id: string; name: string; color: string }[];
}

interface CustomerInteraction {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="crm-container">
      <!-- Header -->
      <header class="crm-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>👥 CRM Clientes</h1>
            <p class="subtitle">Gestión 360° de relaciones con clientes</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="refreshData()">
            🔄 Actualizar
          </button>
          <button class="action-btn primary" (click)="showNewCustomer = true">
            ➕ Nuevo Cliente
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalCustomers() }}</span>
            <span class="stat-label">Total Clientes</span>
          </div>
        </div>
        <div class="stat-card gradient-gold">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <span class="stat-value">{{ vipCount() }}</span>
            <span class="stat-label">Clientes VIP</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(averageCLV()) }}</span>
            <span class="stat-label">CLV Promedio</span>
          </div>
        </div>
        <div class="stat-card gradient-red">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <span class="stat-value">{{ atRiskCount() }}</span>
            <span class="stat-label">En Riesgo</span>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filters-bar">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre, email o teléfono..."
            [(ngModel)]="searchQuery"
            (input)="filterCustomers()">
        </div>
        <div class="segment-filters">
          <button 
            class="filter-btn" 
            [class.active]="selectedSegment === 'ALL'"
            (click)="selectSegment('ALL')">
            Todos
          </button>
          <button 
            class="filter-btn vip" 
            [class.active]="selectedSegment === 'VIP'"
            (click)="selectSegment('VIP')">
            ⭐ VIP
          </button>
          <button 
            class="filter-btn regular" 
            [class.active]="selectedSegment === 'REGULAR'"
            (click)="selectSegment('REGULAR')">
            👤 Regular
          </button>
          <button 
            class="filter-btn new" 
            [class.active]="selectedSegment === 'NEW'"
            (click)="selectSegment('NEW')">
            🆕 Nuevo
          </button>
          <button 
            class="filter-btn at-risk" 
            [class.active]="selectedSegment === 'AT_RISK'"
            (click)="selectSegment('AT_RISK')">
            ⚠️ En Riesgo
          </button>
        </div>
      </div>

      <!-- Customers Grid -->
      <div class="customers-grid">
        @for (customer of filteredCustomers(); track customer.id) {
          <div class="customer-card" [class]="'segment-' + customer.segment.toLowerCase()" (click)="selectCustomer(customer)">
            <div class="card-header">
              <div class="avatar" [style.background]="getAvatarColor(customer.loyaltyTier)">
                {{ customer.name.charAt(0).toUpperCase() }}
              </div>
              <div class="customer-info">
                <h3>{{ customer.name }}</h3>
                <div class="badges">
                  <span class="segment-badge" [class]="customer.segment.toLowerCase()">
                    {{ getSegmentIcon(customer.segment) }} {{ getSegmentLabel(customer.segment) }}
                  </span>
                  <span class="tier-badge" [class]="customer.loyaltyTier.toLowerCase()">
                    {{ getTierIcon(customer.loyaltyTier) }} {{ customer.loyaltyTier }}
                  </span>
                </div>
              </div>
              <div class="score-ring" [style.--score]="customer.score">
                <span>{{ customer.score }}</span>
              </div>
            </div>
            
            <div class="card-stats">
              <div class="stat">
                <span class="label">CLV</span>
                <span class="value">{{ formatPrice(customer.clv) }}</span>
              </div>
              <div class="stat">
                <span class="label">Compras</span>
                <span class="value">{{ customer.totalPurchases }}</span>
              </div>
              <div class="stat">
                <span class="label">Puntos</span>
                <span class="value">{{ customer.loyaltyPoints | number }}</span>
              </div>
            </div>
            
            <div class="card-footer">
              <span class="last-purchase">
                @if (customer.lastPurchaseDate) {
                  Última compra: {{ formatDate(customer.lastPurchaseDate) }}
                } @else {
                  Sin compras aún
                }
              </span>
              <div class="tags">
                @for (tag of customer.tags?.slice(0, 2); track tag.id) {
                  <span class="tag" [style.background]="tag.color">{{ tag.name }}</span>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Customer Detail Modal -->
      @if (selectedCustomerData) {
        <div class="modal-overlay" (click)="selectedCustomerData = null">
          <div class="modal-content customer-detail" (click)="$event.stopPropagation()">
            <button class="close-btn" (click)="selectedCustomerData = null">✕</button>
            
            <div class="detail-header">
              <div class="avatar-large" [style.background]="getAvatarColor(selectedCustomerData.loyaltyTier)">
                {{ selectedCustomerData.name.charAt(0).toUpperCase() }}
              </div>
              <div class="header-info">
                <h2>{{ selectedCustomerData.name }}</h2>
                <div class="contact-info">
                  <span>📧 {{ selectedCustomerData.email || 'Sin email' }}</span>
                  <span>📱 {{ selectedCustomerData.phone || 'Sin teléfono' }}</span>
                </div>
                <div class="badges">
                  <span class="segment-badge large" [class]="selectedCustomerData.segment.toLowerCase()">
                    {{ getSegmentIcon(selectedCustomerData.segment) }} {{ getSegmentLabel(selectedCustomerData.segment) }}
                  </span>
                  <span class="tier-badge large" [class]="selectedCustomerData.loyaltyTier.toLowerCase()">
                    {{ getTierIcon(selectedCustomerData.loyaltyTier) }} {{ selectedCustomerData.loyaltyTier }}
                  </span>
                </div>
              </div>
              <div class="score-display">
                <div class="score-circle" [class]="getScoreClass(selectedCustomerData.score)">
                  <span class="score-value">{{ selectedCustomerData.score }}</span>
                  <span class="score-label">Score</span>
                </div>
              </div>
            </div>

            <div class="detail-tabs">
              <button [class.active]="detailTab === 'overview'" (click)="detailTab = 'overview'">📊 Resumen</button>
              <button [class.active]="detailTab === 'timeline'" (click)="detailTab = 'timeline'">📅 Timeline</button>
              <button [class.active]="detailTab === 'actions'" (click)="detailTab = 'actions'">⚡ Acciones</button>
            </div>

            @if (detailTab === 'overview') {
              <div class="detail-content">
                <div class="metrics-grid">
                  <div class="metric-card">
                    <span class="metric-icon">💰</span>
                    <div class="metric-info">
                      <span class="metric-value">{{ formatPrice(selectedCustomerData.clv) }}</span>
                      <span class="metric-label">Valor de Vida (CLV)</span>
                    </div>
                  </div>
                  <div class="metric-card">
                    <span class="metric-icon">🛒</span>
                    <div class="metric-info">
                      <span class="metric-value">{{ selectedCustomerData.totalPurchases }}</span>
                      <span class="metric-label">Total Compras</span>
                    </div>
                  </div>
                  <div class="metric-card">
                    <span class="metric-icon">💵</span>
                    <div class="metric-info">
                      <span class="metric-value">{{ formatPrice(selectedCustomerData.totalSpent) }}</span>
                      <span class="metric-label">Total Gastado</span>
                    </div>
                  </div>
                  <div class="metric-card">
                    <span class="metric-icon">🎫</span>
                    <div class="metric-info">
                      <span class="metric-value">{{ formatPrice(selectedCustomerData.averageTicket) }}</span>
                      <span class="metric-label">Ticket Promedio</span>
                    </div>
                  </div>
                  <div class="metric-card">
                    <span class="metric-icon">⭐</span>
                    <div class="metric-info">
                      <span class="metric-value">{{ selectedCustomerData.loyaltyPoints | number }}</span>
                      <span class="metric-label">Puntos Lealtad</span>
                    </div>
                  </div>
                  <div class="metric-card">
                    <span class="metric-icon">🔗</span>
                    <div class="metric-info">
                      <span class="metric-value">{{ selectedCustomerData.referralCode }}</span>
                      <span class="metric-label">Código Referido</span>
                    </div>
                  </div>
                </div>

                <div class="info-section">
                  <h4>📋 Información Adicional</h4>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">Primera Compra</span>
                      <span class="value">{{ selectedCustomerData.firstPurchaseDate ? formatDate(selectedCustomerData.firstPurchaseDate) : 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Última Compra</span>
                      <span class="value">{{ selectedCustomerData.lastPurchaseDate ? formatDate(selectedCustomerData.lastPurchaseDate) : 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Cumpleaños</span>
                      <span class="value">{{ selectedCustomerData.birthDate ? formatDate(selectedCustomerData.birthDate) : 'No registrado' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Dirección</span>
                      <span class="value">{{ selectedCustomerData.address || 'No registrada' }}</span>
                    </div>
                  </div>
                </div>

                <div class="preferences-section">
                  <h4>📬 Preferencias de Comunicación</h4>
                  <div class="preferences-grid">
                    <div class="pref-item" [class.active]="selectedCustomerData.emailOptIn">
                      <span class="icon">📧</span>
                      <span>Email</span>
                      <span class="status">{{ selectedCustomerData.emailOptIn ? '✅' : '❌' }}</span>
                    </div>
                    <div class="pref-item" [class.active]="selectedCustomerData.smsOptIn">
                      <span class="icon">💬</span>
                      <span>SMS</span>
                      <span class="status">{{ selectedCustomerData.smsOptIn ? '✅' : '❌' }}</span>
                    </div>
                    <div class="pref-item" [class.active]="selectedCustomerData.whatsappOptIn">
                      <span class="icon">📲</span>
                      <span>WhatsApp</span>
                      <span class="status">{{ selectedCustomerData.whatsappOptIn ? '✅' : '❌' }}</span>
                    </div>
                  </div>
                </div>

                @if (selectedCustomerData.tags?.length) {
                  <div class="tags-section">
                    <h4>🏷️ Tags</h4>
                    <div class="tags-list">
                      @for (tag of selectedCustomerData.tags; track tag.id) {
                        <span class="tag" [style.background]="tag.color">{{ tag.name }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @if (detailTab === 'timeline') {
              <div class="timeline-content">
                @for (interaction of customerTimeline(); track interaction.id) {
                  <div class="timeline-item">
                    <div class="timeline-icon" [class]="getInteractionClass(interaction.type)">
                      {{ getInteractionIcon(interaction.type) }}
                    </div>
                    <div class="timeline-content">
                      <span class="timeline-title">{{ interaction.title }}</span>
                      <span class="timeline-desc">{{ interaction.description }}</span>
                      <span class="timeline-date">{{ formatDateTime(interaction.createdAt) }}</span>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-timeline">
                    <span>📭</span>
                    <p>No hay interacciones registradas</p>
                  </div>
                }
              </div>
            }

            @if (detailTab === 'actions') {
              <div class="actions-content">
                <div class="action-grid">
                  <button class="action-card" (click)="addPointsToCustomer()">
                    <span class="action-icon">➕</span>
                    <span class="action-label">Agregar Puntos</span>
                  </button>
                  <button class="action-card" (click)="sendEmail()">
                    <span class="action-icon">📧</span>
                    <span class="action-label">Enviar Email</span>
                  </button>
                  <button class="action-card" (click)="sendWhatsApp()">
                    <span class="action-icon">📲</span>
                    <span class="action-label">WhatsApp</span>
                  </button>
                  <button class="action-card" (click)="createCoupon()">
                    <span class="action-icon">🎫</span>
                    <span class="action-label">Crear Cupón</span>
                  </button>
                  <button class="action-card" (click)="addNote()">
                    <span class="action-icon">📝</span>
                    <span class="action-label">Agregar Nota</span>
                  </button>
                  <button class="action-card" (click)="addTag()">
                    <span class="action-icon">🏷️</span>
                    <span class="action-label">Agregar Tag</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- New Customer Modal -->
      @if (showNewCustomer) {
        <div class="modal-overlay" (click)="showNewCustomer = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>➕ Nuevo Cliente</h2>
            <form (ngSubmit)="saveNewCustomer()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre Completo *</label>
                  <input type="text" [(ngModel)]="newCustomer.name" name="name" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="newCustomer.email" name="email">
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" [(ngModel)]="newCustomer.phone" name="phone">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>RUT</label>
                  <input type="text" [(ngModel)]="newCustomer.documentNumber" name="documentNumber" placeholder="12.345.678-9">
                </div>
                <div class="form-group">
                  <label>Fecha de Nacimiento</label>
                  <input type="date" [(ngModel)]="newCustomer.birthDate" name="birthDate">
                </div>
              </div>
              <div class="form-group">
                <label>Dirección</label>
                <input type="text" [(ngModel)]="newCustomer.address" name="address">
              </div>
              <div class="form-group">
                <label>Notas</label>
                <textarea [(ngModel)]="newCustomer.notes" name="notes" rows="3"></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showNewCustomer = false">Cancelar</button>
                <button type="submit" class="save-btn">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .crm-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    /* Header */
    .crm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.5rem;
      transition: all 0.2s;
    }

    .back-btn:hover { background: rgba(255, 255, 255, 0.2); transform: translateX(-2px); }

    .title-section h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; }

    .header-actions { display: flex; gap: 0.75rem; }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .action-btn.primary { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; }
    .action-btn.secondary { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); }
    .action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3); }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .gradient-purple { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
    .gradient-gold { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }
    .gradient-green { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); }
    .gradient-red { background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); }

    .stat-icon { font-size: 2.5rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.75rem; font-weight: 800; }
    .stat-label { font-size: 0.875rem; opacity: 0.9; }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
    }

    .search-box input {
      width: 100%;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1rem;
    }

    .search-box input::placeholder { color: rgba(255, 255, 255, 0.4); }

    .segment-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .filter-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }
    .filter-btn.active { background: #6366F1; color: white; border-color: #6366F1; }
    .filter-btn.vip.active { background: #F59E0B; border-color: #F59E0B; }
    .filter-btn.at-risk.active { background: #EF4444; border-color: #EF4444; }
    .filter-btn.new.active { background: #10B981; border-color: #10B981; }

    /* Customers Grid */
    .customers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    .customer-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.2s;
    }

    .customer-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .customer-card.segment-vip { border-left: 4px solid #F59E0B; }
    .customer-card.segment-regular { border-left: 4px solid #3B82F6; }
    .customer-card.segment-new { border-left: 4px solid #10B981; }
    .customer-card.segment-at_risk { border-left: 4px solid #EF4444; }
    .customer-card.segment-lost { border-left: 4px solid #6B7280; }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .avatar {
      width: 50px; height: 50px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700;
      color: white;
    }

    .customer-info { flex: 1; }
    .customer-info h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }

    .badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .segment-badge, .tier-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .segment-badge.vip { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
    .segment-badge.regular { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .segment-badge.new { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .segment-badge.at_risk { background: rgba(239, 68, 68, 0.2); color: #F87171; }
    .segment-badge.lost { background: rgba(107, 114, 128, 0.2); color: #9CA3AF; }

    .tier-badge.bronze { background: rgba(180, 83, 9, 0.2); color: #D97706; }
    .tier-badge.silver { background: rgba(156, 163, 175, 0.2); color: #D1D5DB; }
    .tier-badge.gold { background: rgba(251, 191, 36, 0.2); color: #FCD34D; }
    .tier-badge.platinum { background: rgba(139, 92, 246, 0.2); color: #A78BFA; }

    .score-ring {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: conic-gradient(
        #6366F1 calc(var(--score) * 3.6deg),
        rgba(255, 255, 255, 0.1) 0deg
      );
      display: flex; align-items: center; justify-content: center;
    }

    .score-ring span {
      background: #1a1a2e;
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
    }

    .card-stats {
      display: flex;
      gap: 1.5rem;
      padding: 0.75rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin: 0.75rem 0;
    }

    .card-stats .stat { display: flex; flex-direction: column; }
    .card-stats .label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .card-stats .value { font-size: 1rem; font-weight: 600; }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .last-purchase { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

    .tags { display: flex; gap: 0.25rem; }
    .tag {
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 500;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px;
      padding: 2rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    }

    .modal-content.customer-detail {
      max-width: 700px;
    }

    .close-btn {
      position: absolute;
      top: 1rem; right: 1rem;
      width: 36px; height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      font-size: 1rem;
    }

    .modal-content h2 { margin: 0 0 1.5rem; }

    /* Customer Detail Modal */
    .detail-header {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .avatar-large {
      width: 80px; height: 80px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; font-weight: 700;
      flex-shrink: 0;
    }

    .header-info { flex: 1; }
    .header-info h2 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    .contact-info { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.75rem; }
    .header-info .badges { gap: 0.5rem; }
    .header-info .badges .segment-badge.large, 
    .header-info .badges .tier-badge.large { padding: 0.35rem 0.75rem; font-size: 0.8rem; }

    .score-display {
      text-align: center;
    }

    .score-circle {
      width: 70px; height: 70px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.2);
      border: 3px solid #6366F1;
    }

    .score-circle.high { border-color: #10B981; background: rgba(16, 185, 129, 0.2); }
    .score-circle.medium { border-color: #F59E0B; background: rgba(245, 158, 11, 0.2); }
    .score-circle.low { border-color: #EF4444; background: rgba(239, 68, 68, 0.2); }

    .score-value { font-size: 1.5rem; font-weight: 800; }
    .score-label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); }

    .detail-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .detail-tabs button {
      flex: 1;
      padding: 0.75rem;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .detail-tabs button.active {
      background: #6366F1;
      color: white;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .metric-icon { font-size: 1.5rem; }
    .metric-info { display: flex; flex-direction: column; }
    .metric-value { font-size: 1.1rem; font-weight: 700; }
    .metric-label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }

    .info-section, .preferences-section, .tags-section {
      margin-bottom: 1.5rem;
    }

    .info-section h4, .preferences-section h4, .tags-section h4 {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item .label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }
    .info-item .value { font-size: 0.9rem; }

    .preferences-grid {
      display: flex;
      gap: 1rem;
    }

    .pref-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      opacity: 0.5;
    }

    .pref-item.active { opacity: 1; background: rgba(16, 185, 129, 0.1); }

    .tags-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tags-list .tag { padding: 0.25rem 0.75rem; font-size: 0.8rem; }

    /* Timeline */
    .timeline-content {
      max-height: 350px;
      overflow-y: auto;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .timeline-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem;
      background: rgba(99, 102, 241, 0.2);
      flex-shrink: 0;
    }

    .timeline-icon.purchase { background: rgba(16, 185, 129, 0.2); }
    .timeline-icon.email { background: rgba(59, 130, 246, 0.2); }
    .timeline-icon.points { background: rgba(245, 158, 11, 0.2); }

    .timeline-content { display: flex; flex-direction: column; }
    .timeline-title { font-weight: 600; }
    .timeline-desc { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); }
    .timeline-date { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.25rem; }

    .empty-timeline {
      text-align: center;
      padding: 3rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .empty-timeline span { font-size: 3rem; }

    /* Actions */
    .action-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-card:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: #6366F1;
      transform: translateY(-2px);
    }

    .action-icon { font-size: 2rem; }
    .action-label { font-size: 0.85rem; font-weight: 500; }

    /* Form */
    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-group {
      flex: 1;
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .form-group input, .form-group textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1rem;
    }

    .form-group textarea { resize: vertical; }

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .cancel-btn, .save-btn {
      flex: 1;
      padding: 0.875rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .cancel-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
    }

    .save-btn {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      color: white;
    }

    @media (max-width: 768px) {
      .crm-header { flex-direction: column; align-items: stretch; }
      .header-actions { justify-content: stretch; }
      .action-btn { flex: 1; }
      .filters-bar { flex-direction: column; }
      .segment-filters { justify-content: center; }
      .customers-grid { grid-template-columns: 1fr; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .action-grid { grid-template-columns: repeat(2, 1fr); }
      .detail-header { flex-direction: column; align-items: center; text-align: center; }
    }
  `]
})
export class CrmComponent implements OnInit {
  private http = inject(HttpClient);

  searchQuery = '';
  selectedSegment: 'ALL' | 'VIP' | 'REGULAR' | 'NEW' | 'AT_RISK' = 'ALL';
  showNewCustomer = false;
  selectedCustomerData: Customer | null = null;
  detailTab: 'overview' | 'timeline' | 'actions' = 'overview';

  customers = signal<Customer[]>([]);
  customerTimeline = signal<CustomerInteraction[]>([]);

  newCustomer = {
    name: '',
    email: '',
    phone: '',
    documentNumber: '',
    birthDate: '',
    address: '',
    notes: ''
  };

  // Mock data for demo
  private mockCustomers: Customer[] = [
    { id: '1', name: 'María González Pérez', email: 'maria.gonzalez@email.cl', phone: '+56912345671', segment: 'VIP', clv: 1500000, totalPurchases: 45, totalSpent: 950000, averageTicket: 21111, lastPurchaseDate: '2024-12-20', firstPurchaseDate: '2023-01-15', birthDate: '1985-03-15', loyaltyPoints: 12500, loyaltyTier: 'PLATINUM', score: 95, emailOptIn: true, smsOptIn: true, whatsappOptIn: true, referralCode: 'REFMARIA01', tags: [{ id: '1', name: 'VIP', color: '#FFD700' }, { id: '2', name: 'Cumpleaños Marzo', color: '#EC4899' }] },
    { id: '2', name: 'Carlos Rodríguez Silva', email: 'carlos.rodriguez@empresa.cl', phone: '+56912345672', segment: 'VIP', clv: 1200000, totalPurchases: 38, totalSpent: 780000, averageTicket: 20526, lastPurchaseDate: '2024-12-18', firstPurchaseDate: '2023-02-20', birthDate: '1978-07-22', loyaltyPoints: 10200, loyaltyTier: 'PLATINUM', score: 90, emailOptIn: true, smsOptIn: false, whatsappOptIn: true, referralCode: 'REFCARLOS2', tags: [{ id: '3', name: 'Empresarial', color: '#3B82F6' }] },
    { id: '3', name: 'Ana María López', email: 'ana.lopez@gmail.com', phone: '+56912345673', segment: 'VIP', clv: 980000, totalPurchases: 32, totalSpent: 620000, averageTicket: 19375, lastPurchaseDate: '2024-12-22', firstPurchaseDate: '2023-03-10', birthDate: '1990-11-08', loyaltyPoints: 8500, loyaltyTier: 'GOLD', score: 88, emailOptIn: true, smsOptIn: true, whatsappOptIn: true, referralCode: 'REFANA0003', tags: [] },
    { id: '4', name: 'Pedro Sánchez Mora', email: 'pedro.sanchez@hotmail.com', phone: '+56912345674', segment: 'REGULAR', clv: 350000, totalPurchases: 15, totalSpent: 220000, averageTicket: 14667, lastPurchaseDate: '2024-12-15', firstPurchaseDate: '2023-06-01', birthDate: '1982-04-30', loyaltyPoints: 3200, loyaltyTier: 'SILVER', score: 72, emailOptIn: true, smsOptIn: true, whatsappOptIn: false, referralCode: 'REFPEDRO4', tags: [] },
    { id: '5', name: 'Sofía Torres Vega', email: 'sofia.torres@outlook.com', phone: '+56912345675', segment: 'REGULAR', clv: 280000, totalPurchases: 12, totalSpent: 180000, averageTicket: 15000, lastPurchaseDate: '2024-12-10', firstPurchaseDate: '2023-07-15', birthDate: '1995-09-12', loyaltyPoints: 2800, loyaltyTier: 'SILVER', score: 68, emailOptIn: true, smsOptIn: false, whatsappOptIn: true, referralCode: 'REFSOFIA5', tags: [] },
    { id: '6', name: 'Joaquín Sepúlveda', email: 'joaquin.sepulveda@email.cl', phone: '+56912345682', segment: 'NEW', clv: 30000, totalPurchases: 1, totalSpent: 18500, averageTicket: 18500, lastPurchaseDate: '2024-12-20', firstPurchaseDate: '2024-12-20', birthDate: '2000-05-10', loyaltyPoints: 185, loyaltyTier: 'BRONZE', score: 25, emailOptIn: true, smsOptIn: true, whatsappOptIn: true, referralCode: 'REFJOAQU2', tags: [] },
    { id: '7', name: 'Felipe Morales', email: 'felipe.morales@hotmail.com', phone: '+56912345686', segment: 'AT_RISK', clv: 180000, totalPurchases: 8, totalSpent: 125000, averageTicket: 15625, lastPurchaseDate: '2024-10-01', firstPurchaseDate: '2023-05-15', birthDate: '1987-07-14', loyaltyPoints: 1800, loyaltyTier: 'SILVER', score: 35, emailOptIn: true, smsOptIn: false, whatsappOptIn: true, referralCode: 'REFFELIP6', tags: [{ id: '4', name: 'Requiere seguimiento', color: '#EF4444' }] },
    { id: '8', name: 'Ignacio Pizarro', email: 'ignacio.pizarro@outlook.com', phone: '+56912345689', segment: 'LOST', clv: 80000, totalPurchases: 3, totalSpent: 45000, averageTicket: 15000, lastPurchaseDate: '2024-05-01', firstPurchaseDate: '2023-08-15', birthDate: '1979-12-01', loyaltyPoints: 600, loyaltyTier: 'BRONZE', score: 15, emailOptIn: false, smsOptIn: false, whatsappOptIn: false, referralCode: 'REFIGNAC9', tags: [] }
  ];

  filteredCustomers = computed(() => {
    let result = this.customers();

    if (this.selectedSegment !== 'ALL') {
      result = result.filter(c => c.segment === this.selectedSegment);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      );
    }

    return result;
  });

  totalCustomers = computed(() => this.customers().length);
  vipCount = computed(() => this.customers().filter(c => c.segment === 'VIP').length);
  atRiskCount = computed(() => this.customers().filter(c => c.segment === 'AT_RISK').length);
  averageCLV = computed(() => {
    const customers = this.customers();
    if (!customers.length) return 0;
    return customers.reduce((sum, c) => sum + c.clv, 0) / customers.length;
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    // For demo, use mock data
    this.customers.set(this.mockCustomers);

    // In production, call API:
    // this.http.get<any>(`${environment.apiUrl}/api/customers`, {
    //     headers: { 'X-Tenant-Id': 'tenant-id' }
    // }).subscribe(response => {
    //     this.customers.set(response.content);
    // });
  }

  refreshData() {
    this.loadCustomers();
  }

  filterCustomers() {
    // Triggers computed signal update
  }

  selectSegment(segment: 'ALL' | 'VIP' | 'REGULAR' | 'NEW' | 'AT_RISK') {
    this.selectedSegment = segment;
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomerData = customer;
    this.detailTab = 'overview';
    this.loadCustomerTimeline(customer.id);
  }

  loadCustomerTimeline(customerId: string) {
    // Mock timeline data
    this.customerTimeline.set([
      { id: '1', type: 'PURCHASE', title: 'Compra $25,500', description: 'Venta #12345', createdAt: '2024-12-20T14:30:00' },
      { id: '2', type: 'LOYALTY_POINTS', title: '+255 puntos', description: 'Por compra #12345', createdAt: '2024-12-20T14:30:00' },
      { id: '3', type: 'EMAIL_OPENED', title: 'Email abierto', description: 'Promoción Navidad', createdAt: '2024-12-18T10:15:00' },
      { id: '4', type: 'PURCHASE', title: 'Compra $18,900', description: 'Venta #12320', createdAt: '2024-12-15T16:45:00' }
    ]);
  }

  saveNewCustomer() {
    if (!this.newCustomer.name) return;

    const customer: Partial<Customer> = {
      name: this.newCustomer.name,
      email: this.newCustomer.email,
      phone: this.newCustomer.phone,
      documentNumber: this.newCustomer.documentNumber,
      birthDate: this.newCustomer.birthDate,
      address: this.newCustomer.address,
      notes: this.newCustomer.notes,
      segment: 'NEW',
      loyaltyTier: 'BRONZE',
      loyaltyPoints: 0,
      totalPurchases: 0,
      totalSpent: 0,
      clv: 0,
      score: 10
    };

    // Add to local list for demo
    const newId = Date.now().toString();
    this.customers.update(list => [...list, { ...customer, id: newId, tags: [], averageTicket: 0, referralCode: 'REF' + newId.slice(-6), emailOptIn: true, smsOptIn: true, whatsappOptIn: true } as Customer]);

    this.showNewCustomer = false;
    this.newCustomer = { name: '', email: '', phone: '', documentNumber: '', birthDate: '', address: '', notes: '' };
  }

  // Actions
  addPointsToCustomer() { alert('Agregar puntos: funcionalidad pendiente'); }
  sendEmail() { alert('Enviar email: funcionalidad pendiente'); }
  sendWhatsApp() { alert('WhatsApp: funcionalidad pendiente'); }
  createCoupon() { alert('Crear cupón: funcionalidad pendiente'); }
  addNote() { alert('Agregar nota: funcionalidad pendiente'); }
  addTag() { alert('Agregar tag: funcionalidad pendiente'); }

  // Helpers
  formatPrice(amount: number): string {
    return '$' + Math.round(amount).toLocaleString('es-CL');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CL');
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('es-CL');
  }

  getAvatarColor(tier: string): string {
    const colors: Record<string, string> = {
      'PLATINUM': 'linear-gradient(135deg, #8B5CF6, #6366F1)',
      'GOLD': 'linear-gradient(135deg, #F59E0B, #FBBF24)',
      'SILVER': 'linear-gradient(135deg, #6B7280, #9CA3AF)',
      'BRONZE': 'linear-gradient(135deg, #B45309, #D97706)'
    };
    return colors[tier] || colors['BRONZE'];
  }

  getSegmentIcon(segment: string): string {
    const icons: Record<string, string> = { 'VIP': '⭐', 'REGULAR': '👤', 'NEW': '🆕', 'AT_RISK': '⚠️', 'LOST': '💤' };
    return icons[segment] || '👤';
  }

  getSegmentLabel(segment: string): string {
    const labels: Record<string, string> = { 'VIP': 'VIP', 'REGULAR': 'Regular', 'NEW': 'Nuevo', 'AT_RISK': 'En Riesgo', 'LOST': 'Perdido' };
    return labels[segment] || segment;
  }

  getTierIcon(tier: string): string {
    const icons: Record<string, string> = { 'PLATINUM': '💎', 'GOLD': '🥇', 'SILVER': '🥈', 'BRONZE': '🥉' };
    return icons[tier] || '🥉';
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  getInteractionIcon(type: string): string {
    const icons: Record<string, string> = {
      'PURCHASE': '🛒', 'EMAIL_SENT': '📧', 'EMAIL_OPENED': '📬', 'EMAIL_CLICKED': '🔗',
      'WHATSAPP_SENT': '📲', 'LOYALTY_POINTS': '⭐', 'REWARD_REDEEMED': '🎁',
      'COUPON_USED': '🎫', 'REVIEW_LEFT': '⭐', 'REFERRAL_MADE': '🔗', 'NOTE': '📝'
    };
    return icons[type] || '📌';
  }

  getInteractionClass(type: string): string {
    if (type.includes('PURCHASE')) return 'purchase';
    if (type.includes('EMAIL')) return 'email';
    if (type.includes('POINTS') || type.includes('REWARD')) return 'points';
    return '';
  }
}
