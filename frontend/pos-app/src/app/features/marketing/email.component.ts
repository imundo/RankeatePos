import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'TRANSACTIONAL' | 'MARKETING' | 'AUTOMATED';
  trigger?: string;
  active: boolean;
  createdAt: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  templateId?: string;
  templateName?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
  targetSegment?: string;
  scheduledAt?: string;
  sentAt?: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: string;
}

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="email-container">
      <!-- Header -->
      <header class="email-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>📧 Email Marketing</h1>
            <p class="subtitle">Campañas automatizadas y personalizadas</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="showNewTemplate = true">
            📝 Nueva Plantilla
          </button>
          <button class="action-btn primary" (click)="showNewCampaign = true">
            🚀 Nueva Campaña
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">📨</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalSent() | number }}</span>
            <span class="stat-label">Emails Enviados</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">👁️</div>
          <div class="stat-content">
            <span class="stat-value">{{ averageOpenRate() }}%</span>
            <span class="stat-label">Tasa de Apertura</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">🖱️</div>
          <div class="stat-content">
            <span class="stat-value">{{ averageClickRate() }}%</span>
            <span class="stat-label">Tasa de Click</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <span class="stat-value">{{ templates().length }}</span>
            <span class="stat-label">Plantillas</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'campaigns'" (click)="activeTab = 'campaigns'">
          🚀 Campañas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'templates'" (click)="activeTab = 'templates'">
          📝 Plantillas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'automations'" (click)="activeTab = 'automations'">
          ⚡ Automatizaciones
        </button>
      </div>

      <!-- Campaigns Tab -->
      @if (activeTab === 'campaigns') {
        <div class="campaigns-grid">
          @for (campaign of campaigns(); track campaign.id) {
            <div class="campaign-card" [class]="'status-' + campaign.status.toLowerCase()">
              <div class="campaign-header">
                <div class="campaign-icon" [class]="campaign.status.toLowerCase()">
                  {{ getStatusIcon(campaign.status) }}
                </div>
                <div class="campaign-info">
                  <h3>{{ campaign.name }}</h3>
                  <span class="template-name">📝 {{ campaign.templateName || 'Sin plantilla' }}</span>
                </div>
                <span class="status-badge" [class]="campaign.status.toLowerCase()">
                  {{ getStatusLabel(campaign.status) }}
                </span>
              </div>
              
              @if (campaign.status === 'SENT') {
                <div class="campaign-stats">
                  <div class="stat">
                    <span class="value">{{ campaign.totalSent | number }}</span>
                    <span class="label">Enviados</span>
                  </div>
                  <div class="stat">
                    <span class="value">{{ campaign.totalOpened | number }}</span>
                    <span class="label">Abiertos</span>
                    <span class="rate">{{ getOpenRate(campaign) }}%</span>
                  </div>
                  <div class="stat">
                    <span class="value">{{ campaign.totalClicked | number }}</span>
                    <span class="label">Clicks</span>
                    <span class="rate">{{ getClickRate(campaign) }}%</span>
                  </div>
                </div>
              }
              
              <div class="campaign-footer">
                <div class="campaign-meta">
                  @if (campaign.targetSegment) {
                    <span class="segment">🎯 {{ campaign.targetSegment }}</span>
                  }
                  @if (campaign.scheduledAt) {
                    <span class="scheduled">📅 {{ formatDateTime(campaign.scheduledAt) }}</span>
                  }
                  @if (campaign.sentAt) {
                    <span class="sent">✅ {{ formatDateTime(campaign.sentAt) }}</span>
                  }
                </div>
                <div class="campaign-actions">
                  @if (campaign.status === 'DRAFT') {
                    <button class="action-small" (click)="scheduleCampaign(campaign)">📅 Programar</button>
                    <button class="action-small send" (click)="sendCampaign(campaign)">🚀 Enviar</button>
                  }
                  @if (campaign.status === 'SCHEDULED') {
                    <button class="action-small cancel" (click)="cancelCampaign(campaign)">❌ Cancelar</button>
                  }
                  @if (campaign.status === 'SENT') {
                    <button class="action-small" (click)="viewReport(campaign)">📊 Ver Reporte</button>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <span class="empty-icon">📧</span>
              <h3>No hay campañas</h3>
              <p>Crea tu primera campaña de email marketing</p>
              <button class="action-btn primary" (click)="showNewCampaign = true">🚀 Nueva Campaña</button>
            </div>
          }
        </div>
      }

      <!-- Templates Tab -->
      @if (activeTab === 'templates') {
        <div class="templates-grid">
          @for (template of templates(); track template.id) {
            <div class="template-card" [class.inactive]="!template.active">
              <div class="template-icon" [class]="template.type.toLowerCase()">
                {{ getTypeIcon(template.type) }}
              </div>
              <div class="template-info">
                <h3>{{ template.name }}</h3>
                <span class="subject">{{ template.subject }}</span>
                <div class="template-meta">
                  <span class="type-badge" [class]="template.type.toLowerCase()">{{ getTypeLabel(template.type) }}</span>
                  @if (template.trigger) {
                    <span class="trigger-badge">⚡ {{ getTriggerLabel(template.trigger) }}</span>
                  }
                </div>
              </div>
              <div class="template-actions">
                <button class="action-icon" (click)="previewTemplate(template)">👁️</button>
                <button class="action-icon" (click)="editTemplate(template)">✏️</button>
                <button class="action-icon" (click)="duplicateTemplate(template)">📋</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Automations Tab -->
      @if (activeTab === 'automations') {
        <div class="automations-section">
          <div class="automation-cards">
            <div class="automation-card" [class.active]="automations.welcome">
              <div class="automation-header">
                <span class="automation-icon">👋</span>
                <div class="automation-info">
                  <h3>Bienvenida</h3>
                  <p>Email automático al registrar nuevo cliente</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="automations.welcome">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            
            <div class="automation-card" [class.active]="automations.birthday">
              <div class="automation-header">
                <span class="automation-icon">🎂</span>
                <div class="automation-info">
                  <h3>Cumpleaños</h3>
                  <p>Felicitación con descuento especial</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="automations.birthday">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            
            <div class="automation-card" [class.active]="automations.reengagement">
              <div class="automation-header">
                <span class="automation-icon">💔</span>
                <div class="automation-info">
                  <h3>Re-enganche</h3>
                  <p>Email para clientes inactivos (60 días)</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="automations.reengagement">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            
            <div class="automation-card" [class.active]="automations.postPurchase">
              <div class="automation-header">
                <span class="automation-icon">🛒</span>
                <div class="automation-info">
                  <h3>Post-Compra</h3>
                  <p>Agradecimiento y puntos ganados</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="automations.postPurchase">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            
            <div class="automation-card" [class.active]="automations.reviewRequest">
              <div class="automation-header">
                <span class="automation-icon">⭐</span>
                <div class="automation-info">
                  <h3>Solicitar Review</h3>
                  <p>Invitar a dejar reseña (3 días post-compra)</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="automations.reviewRequest">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            
            <div class="automation-card" [class.active]="automations.loyaltyReminder">
              <div class="automation-header">
                <span class="automation-icon">🎁</span>
                <div class="automation-info">
                  <h3>Recordatorio Puntos</h3>
                  <p>Notificar sobre puntos acumulados</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="automations.loyaltyReminder">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- New Campaign Modal -->
      @if (showNewCampaign) {
        <div class="modal-overlay" (click)="showNewCampaign = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>🚀 Nueva Campaña</h2>
            <form (ngSubmit)="saveCampaign()">
              <div class="form-group">
                <label>Nombre de la Campaña *</label>
                <input type="text" [(ngModel)]="newCampaign.name" name="name" required placeholder="Ej: Promoción Navidad">
              </div>
              
              <div class="form-group">
                <label>Plantilla *</label>
                <select [(ngModel)]="newCampaign.templateId" name="templateId" required>
                  <option value="">Seleccionar plantilla...</option>
                  @for (template of templates(); track template.id) {
                    <option [value]="template.id">{{ template.name }}</option>
                  }
                </select>
              </div>
              
              <div class="form-group">
                <label>Segmento Objetivo</label>
                <select [(ngModel)]="newCampaign.targetSegment" name="targetSegment">
                  <option value="">Todos los clientes</option>
                  <option value="VIP">Solo VIP</option>
                  <option value="REGULAR">Clientes Regulares</option>
                  <option value="NEW">Clientes Nuevos</option>
                  <option value="AT_RISK">Clientes en Riesgo</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Programar Envío</label>
                <input type="datetime-local" [(ngModel)]="newCampaign.scheduledAt" name="scheduledAt">
              </div>
              
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showNewCampaign = false">Cancelar</button>
                <button type="submit" class="save-btn">Crear Campaña</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- New Template Modal -->
      @if (showNewTemplate) {
        <div class="modal-overlay" (click)="showNewTemplate = false">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <h2>📝 Nueva Plantilla</h2>
            <form (ngSubmit)="saveTemplate()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre *</label>
                  <input type="text" [(ngModel)]="newTemplate.name" name="name" required placeholder="Nombre de la plantilla">
                </div>
                <div class="form-group">
                  <label>Tipo *</label>
                  <select [(ngModel)]="newTemplate.type" name="type" required>
                    <option value="MARKETING">Marketing</option>
                    <option value="TRANSACTIONAL">Transaccional</option>
                    <option value="AUTOMATED">Automatizado</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label>Asunto *</label>
                <input type="text" [(ngModel)]="newTemplate.subject" name="subject" required placeholder="Asunto del email">
              </div>
              
              @if (newTemplate.type === 'AUTOMATED') {
                <div class="form-group">
                  <label>Trigger</label>
                  <select [(ngModel)]="newTemplate.trigger" name="trigger">
                    <option value="WELCOME">Bienvenida</option>
                    <option value="BIRTHDAY">Cumpleaños</option>
                    <option value="RE_ENGAGEMENT">Re-enganche</option>
                    <option value="POST_PURCHASE">Post-Compra</option>
                    <option value="REVIEW_REQUEST">Solicitar Review</option>
                  </select>
                </div>
              }
              
              <div class="form-group">
                <label>Contenido HTML</label>
                <textarea [(ngModel)]="newTemplate.bodyHtml" name="bodyHtml" rows="8" placeholder="<html>...</html>"></textarea>
                <span class="hint">Usa &#123;&#123;name&#125;&#125;, &#123;&#123;email&#125;&#125;, &#123;&#123;points&#125;&#125; para personalizar</span>
              </div>
              
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showNewTemplate = false">Cancelar</button>
                <button type="submit" class="save-btn">Guardar Plantilla</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .email-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    .email-header {
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

    .header-actions { display: flex; gap: 0.75rem; }
    .action-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      font-weight: 600; cursor: pointer; border: none;
    }
    .action-btn.primary { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; }
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

    /* Campaigns */
    .campaigns-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.25rem;
    }
    .campaign-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .campaign-card.status-draft { border-left: 4px solid #6B7280; }
    .campaign-card.status-scheduled { border-left: 4px solid #F59E0B; }
    .campaign-card.status-sending { border-left: 4px solid #3B82F6; }
    .campaign-card.status-sent { border-left: 4px solid #10B981; }
    .campaign-card.status-cancelled { border-left: 4px solid #EF4444; opacity: 0.6; }

    .campaign-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .campaign-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem;
    }
    .campaign-icon.draft { background: rgba(107, 114, 128, 0.2); }
    .campaign-icon.scheduled { background: rgba(245, 158, 11, 0.2); }
    .campaign-icon.sending { background: rgba(59, 130, 246, 0.2); }
    .campaign-icon.sent { background: rgba(16, 185, 129, 0.2); }

    .campaign-info { flex: 1; }
    .campaign-info h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }
    .template-name { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); }

    .status-badge {
      padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
    }
    .status-badge.draft { background: rgba(107, 114, 128, 0.2); color: #9CA3AF; }
    .status-badge.scheduled { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
    .status-badge.sending { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .status-badge.sent { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .status-badge.cancelled { background: rgba(239, 68, 68, 0.2); color: #F87171; }

    .campaign-stats {
      display: flex; gap: 1.5rem; padding: 1rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin: 0.75rem 0;
    }
    .campaign-stats .stat { display: flex; flex-direction: column; }
    .campaign-stats .value { font-size: 1.25rem; font-weight: 700; }
    .campaign-stats .label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .campaign-stats .rate { font-size: 0.8rem; color: #10B981; }

    .campaign-footer { display: flex; justify-content: space-between; align-items: center; }
    .campaign-meta { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
    .campaign-actions { display: flex; gap: 0.5rem; }
    .action-small {
      padding: 0.5rem 0.75rem; border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent; color: white; cursor: pointer; font-size: 0.8rem;
    }
    .action-small.send { background: rgba(16, 185, 129, 0.2); border-color: #10B981; }
    .action-small.cancel { background: rgba(239, 68, 68, 0.2); border-color: #EF4444; }

    /* Templates */
    .templates-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1rem;
    }
    .template-card {
      display: flex; align-items: center; gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px; padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .template-card.inactive { opacity: 0.5; }

    .template-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
    }
    .template-icon.marketing { background: rgba(236, 72, 153, 0.2); }
    .template-icon.transactional { background: rgba(59, 130, 246, 0.2); }
    .template-icon.automated { background: rgba(16, 185, 129, 0.2); }

    .template-info { flex: 1; }
    .template-info h3 { margin: 0 0 0.25rem; font-size: 1rem; }
    .subject { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); display: block; margin-bottom: 0.5rem; }
    .template-meta { display: flex; gap: 0.5rem; }
    .type-badge, .trigger-badge {
      padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 500;
    }
    .type-badge.marketing { background: rgba(236, 72, 153, 0.2); color: #F472B6; }
    .type-badge.transactional { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .type-badge.automated { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .trigger-badge { background: rgba(139, 92, 246, 0.2); color: #A78BFA; }

    .template-actions { display: flex; gap: 0.25rem; }
    .action-icon {
      width: 32px; height: 32px; border-radius: 8px;
      border: none; background: rgba(255, 255, 255, 0.05);
      cursor: pointer; font-size: 1rem;
    }
    .action-icon:hover { background: rgba(255, 255, 255, 0.1); }

    /* Automations */
    .automation-cards {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .automation-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      opacity: 0.6;
    }
    .automation-card.active { opacity: 1; border-color: rgba(16, 185, 129, 0.3); }

    .automation-header { display: flex; align-items: center; gap: 1rem; }
    .automation-icon { font-size: 2rem; }
    .automation-info { flex: 1; }
    .automation-info h3 { margin: 0 0 0.25rem; font-size: 1rem; }
    .automation-info p { margin: 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); }

    .toggle { position: relative; display: inline-block; width: 50px; height: 26px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; inset: 0;
      background: rgba(255, 255, 255, 0.1); border-radius: 26px;
      transition: 0.4s;
    }
    .slider::before {
      position: absolute; content: "";
      height: 20px; width: 20px; left: 3px; bottom: 3px;
      background: white; border-radius: 50%; transition: 0.4s;
    }
    input:checked + .slider { background: #10B981; }
    input:checked + .slider::before { transform: translateX(24px); }

    .empty-state {
      grid-column: 1 / -1; text-align: center; padding: 4rem;
      background: rgba(255, 255, 255, 0.03); border-radius: 16px;
    }
    .empty-icon { font-size: 4rem; }
    .empty-state h3 { margin: 1rem 0 0.5rem; }
    .empty-state p { color: rgba(255, 255, 255, 0.5); margin-bottom: 1.5rem; }

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
      width: 100%; max-width: 500px; max-height: 90vh;
      overflow-y: auto; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-content.large { max-width: 650px; }
    .modal-content h2 { margin: 0 0 1.5rem; }

    .form-row { display: flex; gap: 1rem; }
    .form-group { flex: 1; margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white;
    }
    .form-group textarea { resize: vertical; font-family: monospace; }
    .hint { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.25rem; display: block; }

    .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .cancel-btn, .save-btn { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .cancel-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: white; }
    .save-btn { background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; color: white; }
  `]
})
export class EmailComponent implements OnInit {
  activeTab: 'campaigns' | 'templates' | 'automations' = 'campaigns';
  showNewCampaign = false;
  showNewTemplate = false;

  templates = signal<EmailTemplate[]>([]);
  campaigns = signal<EmailCampaign[]>([]);

  automations = {
    welcome: true,
    birthday: true,
    reengagement: true,
    postPurchase: true,
    reviewRequest: false,
    loyaltyReminder: false
  };

  newCampaign = { name: '', templateId: '', targetSegment: '', scheduledAt: '' };
  newTemplate: { name: string; subject: string; type: 'TRANSACTIONAL' | 'MARKETING' | 'AUTOMATED'; trigger: string; bodyHtml: string } = { name: '', subject: '', type: 'MARKETING', trigger: '', bodyHtml: '' };

  private mockTemplates: EmailTemplate[] = [
    { id: '1', name: 'Bienvenida', subject: '¡Bienvenido/a a nuestra familia, {{name}}!', type: 'AUTOMATED', trigger: 'WELCOME', active: true, createdAt: '2024-12-01' },
    { id: '2', name: 'Cumpleaños', subject: '🎂 ¡Feliz Cumpleaños {{name}}! Tu regalo te espera', type: 'AUTOMATED', trigger: 'BIRTHDAY', active: true, createdAt: '2024-12-01' },
    { id: '3', name: 'Te extrañamos', subject: '{{name}}, te extrañamos 😢 Vuelve con 15% OFF', type: 'AUTOMATED', trigger: 'RE_ENGAGEMENT', active: true, createdAt: '2024-12-01' },
    { id: '4', name: 'Promoción Fin de Semana', subject: '🔥 Solo este fin de semana: hasta 30% OFF', type: 'MARKETING', active: true, createdAt: '2024-12-10' },
    { id: '5', name: 'Gracias por tu compra', subject: '¡Gracias por tu compra, {{name}}!', type: 'TRANSACTIONAL', trigger: 'POST_PURCHASE', active: true, createdAt: '2024-12-01' }
  ];

  private mockCampaigns: EmailCampaign[] = [
    { id: '1', name: 'Promoción Navidad', templateId: '4', templateName: 'Promoción Fin de Semana', status: 'SENT', targetSegment: 'REGULAR', sentAt: '2024-12-20T10:00:00', totalSent: 450, totalOpened: 180, totalClicked: 45, createdAt: '2024-12-18' },
    { id: '2', name: 'VIP Exclusivo', templateId: '4', templateName: 'Promoción Fin de Semana', status: 'SENT', targetSegment: 'VIP', sentAt: '2024-12-15T14:00:00', totalSent: 85, totalOpened: 68, totalClicked: 32, createdAt: '2024-12-14' },
    { id: '3', name: 'Año Nuevo', templateId: '4', templateName: 'Promoción Fin de Semana', status: 'SCHEDULED', scheduledAt: '2025-01-01T00:00:00', totalSent: 0, totalOpened: 0, totalClicked: 0, createdAt: '2024-12-25' },
    { id: '4', name: 'Newsletter Enero', templateId: '', templateName: '', status: 'DRAFT', totalSent: 0, totalOpened: 0, totalClicked: 0, createdAt: '2024-12-27' }
  ];

  totalSent = computed(() => this.campaigns().reduce((sum, c) => sum + c.totalSent, 0));
  averageOpenRate = computed(() => {
    const sent = this.campaigns().filter(c => c.totalSent > 0);
    if (!sent.length) return 0;
    const totalOpened = sent.reduce((sum, c) => sum + c.totalOpened, 0);
    const totalSent = sent.reduce((sum, c) => sum + c.totalSent, 0);
    return totalSent > 0 ? Math.round(totalOpened / totalSent * 100) : 0;
  });
  averageClickRate = computed(() => {
    const opened = this.campaigns().filter(c => c.totalOpened > 0);
    if (!opened.length) return 0;
    const totalClicked = opened.reduce((sum, c) => sum + c.totalClicked, 0);
    const totalOpened = opened.reduce((sum, c) => sum + c.totalOpened, 0);
    return totalOpened > 0 ? Math.round(totalClicked / totalOpened * 100) : 0;
  });

  ngOnInit() {
    this.templates.set(this.mockTemplates);
    this.campaigns.set(this.mockCampaigns);
  }

  getOpenRate(campaign: EmailCampaign): number {
    return campaign.totalSent > 0 ? Math.round(campaign.totalOpened / campaign.totalSent * 100) : 0;
  }

  getClickRate(campaign: EmailCampaign): number {
    return campaign.totalOpened > 0 ? Math.round(campaign.totalClicked / campaign.totalOpened * 100) : 0;
  }

  saveCampaign() {
    if (!this.newCampaign.name) return;
    const template = this.templates().find(t => t.id === this.newCampaign.templateId);
    const campaign: EmailCampaign = {
      id: Date.now().toString(),
      name: this.newCampaign.name,
      templateId: this.newCampaign.templateId,
      templateName: template?.name,
      status: this.newCampaign.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      targetSegment: this.newCampaign.targetSegment || undefined,
      scheduledAt: this.newCampaign.scheduledAt || undefined,
      totalSent: 0, totalOpened: 0, totalClicked: 0,
      createdAt: new Date().toISOString()
    };
    this.campaigns.update(list => [campaign, ...list]);
    this.showNewCampaign = false;
    this.newCampaign = { name: '', templateId: '', targetSegment: '', scheduledAt: '' };
  }

  saveTemplate() {
    if (!this.newTemplate.name || !this.newTemplate.subject) return;
    const template: EmailTemplate = {
      id: Date.now().toString(),
      name: this.newTemplate.name,
      subject: this.newTemplate.subject,
      type: this.newTemplate.type,
      trigger: this.newTemplate.type === 'AUTOMATED' ? this.newTemplate.trigger : undefined,
      active: true,
      createdAt: new Date().toISOString()
    };
    this.templates.update(list => [template, ...list]);
    this.showNewTemplate = false;
    this.newTemplate = { name: '', subject: '', type: 'MARKETING', trigger: '', bodyHtml: '' };
  }

  scheduleCampaign(campaign: EmailCampaign) { alert('Programar: ' + campaign.name); }
  sendCampaign(campaign: EmailCampaign) { alert('Enviar ahora: ' + campaign.name); }
  cancelCampaign(campaign: EmailCampaign) { this.campaigns.update(list => list.map(c => c.id === campaign.id ? { ...c, status: 'CANCELLED' as const } : c)); }
  viewReport(campaign: EmailCampaign) { alert('Ver reporte: ' + campaign.name); }
  previewTemplate(template: EmailTemplate) { alert('Preview: ' + template.name); }
  editTemplate(template: EmailTemplate) { alert('Editar: ' + template.name); }
  duplicateTemplate(template: EmailTemplate) { alert('Duplicar: ' + template.name); }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = { 'DRAFT': '📝', 'SCHEDULED': '📅', 'SENDING': '🚀', 'SENT': '✅', 'CANCELLED': '❌' };
    return icons[status] || '📧';
  }
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { 'DRAFT': 'Borrador', 'SCHEDULED': 'Programado', 'SENDING': 'Enviando', 'SENT': 'Enviado', 'CANCELLED': 'Cancelado' };
    return labels[status] || status;
  }
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = { 'MARKETING': '📣', 'TRANSACTIONAL': '📋', 'AUTOMATED': '⚡' };
    return icons[type] || '📧';
  }
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = { 'MARKETING': 'Marketing', 'TRANSACTIONAL': 'Transaccional', 'AUTOMATED': 'Automatizado' };
    return labels[type] || type;
  }
  getTriggerLabel(trigger: string): string {
    const labels: Record<string, string> = { 'WELCOME': 'Bienvenida', 'BIRTHDAY': 'Cumpleaños', 'RE_ENGAGEMENT': 'Re-enganche', 'POST_PURCHASE': 'Post-Compra', 'REVIEW_REQUEST': 'Review' };
    return labels[trigger] || trigger;
  }
  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  }
}
