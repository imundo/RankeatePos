import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService, CafInfo, Dte } from '../../../core/services/billing.service';

@Component({
  selector: 'app-facturacion-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- Header con gradiente -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="header-text">
            <h1>Facturación Electrónica</h1>
            <p class="subtitle">Gestión de documentos tributarios SII Chile</p>
          </div>
        </div>
        <a routerLink="/pos" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver al POS
        </a>
      </header>

      <!-- Acciones Rápidas -->
      <section class="quick-actions">
        <a routerLink="../emitir" class="action-card primary">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-label">Emitir Documento</span>
            <span class="action-desc">Boleta, Factura, Notas de Crédito/Débito</span>
          </div>
          <div class="action-arrow">→</div>
        </a>

        <a routerLink="../documentos" class="action-card">
          <div class="action-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-label">Documentos</span>
            <span class="action-desc">Historial de DTEs emitidos</span>
          </div>
          <div class="action-arrow">→</div>
        </a>

        <a routerLink="../caf" class="action-card">
          <div class="action-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-label">Folios (CAF)</span>
            <span class="action-desc">Gestión de rangos autorizados</span>
          </div>
          <div class="action-arrow">→</div>
        </a>

        <a routerLink="../libro-ventas" class="action-card">
          <div class="action-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-label">Libro de Ventas</span>
            <span class="action-desc">Reporte mensual IVA</span>
          </div>
          <div class="action-arrow">→</div>
        </a>

        <a routerLink="../configuracion" class="action-card">
          <div class="action-icon pink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-label">Configuración</span>
            <span class="action-desc">Certificados y empresa</span>
          </div>
          <div class="action-arrow">→</div>
        </a>

        <a routerLink="../certificacion" class="action-card">
          <div class="action-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="action-content">
            <span class="action-label">Certificación SII</span>
            <span class="action-desc">Estado de homologación</span>
          </div>
          <div class="action-arrow">→</div>
        </a>
      </section>

      <!-- Grid de contenido -->
      <div class="content-grid">
        <!-- Estado de Folios -->
        <section class="glass-card folios-section">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Estado de Folios
            </h2>
            <a routerLink="../caf" class="view-all-btn">Gestionar →</a>
          </div>
          
          <div class="folios-grid">
            @for (caf of cafs(); track caf.id) {
              <div class="folio-card" 
                   [class.warning]="caf.porcentajeUso > 80 && !caf.vencido && !caf.agotado" 
                   [class.danger]="caf.vencido || caf.agotado">
                <div class="folio-header">
                  <span class="folio-type">{{ caf.tipoDteDescripcion }}</span>
                  @if (caf.vencido) {
                    <span class="folio-badge danger">Vencido</span>
                  } @else if (caf.agotado) {
                    <span class="folio-badge danger">Agotado</span>
                  } @else if (caf.porcentajeUso > 80) {
                    <span class="folio-badge warning">Bajo stock</span>
                  }
                </div>
                <div class="folio-number">{{ caf.foliosDisponibles }}</div>
                <div class="folio-label">folios disponibles</div>
                <div class="folio-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="caf.porcentajeUso"></div>
                  </div>
                  <span class="progress-text">{{ caf.folioActual }} / {{ caf.folioHasta }}</span>
                </div>
              </div>
            } @empty {
              <div class="empty-folios">
                <div class="empty-icon">📦</div>
                <p>No hay folios configurados</p>
                <a routerLink="../caf" class="btn-primary">Subir archivo CAF</a>
              </div>
            }
          </div>
        </section>

        <!-- Documentos Recientes -->
        <section class="glass-card docs-section">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Documentos Recientes
            </h2>
            <a routerLink="../documentos" class="view-all-btn">Ver todos →</a>
          </div>

          <div class="docs-table">
            @for (doc of documentos(); track doc.id; let i = $index) {
              <div class="doc-row" [style.animation-delay]="i * 0.05 + 's'">
                <div class="doc-info">
                  <span class="doc-type">{{ doc.tipoDteDescripcion || doc.tipoDte }}</span>
                  <span class="doc-folio">N° {{ doc.folio }}</span>
                </div>
                <div class="doc-receptor">
                  {{ doc.receptorRazonSocial || 'Consumidor Final' }}
                </div>
                <div class="doc-amount">
                  {{ billingService.formatCurrency(doc.montoTotal) }}
                </div>
                <div class="doc-status">
                  <span class="status-badge" [class]="doc.estado.toLowerCase()">
                    @if (doc.estado === 'ACEPTADO') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    } @else if (doc.estado === 'PENDIENTE') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    } @else if (doc.estado === 'RECHAZADO') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    }
                    {{ doc.estadoDescripcion || doc.estado }}
                  </span>
                </div>
              </div>
            } @empty {
              <div class="empty-docs">
                <div class="empty-icon">📄</div>
                <p>No hay documentos emitidos aún</p>
                <a routerLink="../emitir" class="btn-primary">Emitir primer documento</a>
              </div>
            }
          </div>
        </section>
      </div>

      <!-- Stats rápidos -->
      <section class="stats-section">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ documentos().length }}</span>
            <span class="stat-label">DTEs este mes</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ getAceptados() }}</span>
            <span class="stat-label">Aceptados SII</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ getPendientes() }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ getTotalVentas() }}</span>
            <span class="stat-label">Total ventas</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 1.5rem;
      color: white;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content { display: flex; align-items: center; gap: 1rem; }

    .header-icon {
      width: 56px; height: 56px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 14px;
      svg { width: 28px; height: 28px; stroke: white; }
    }

    .header-text h1 {
      margin: 0; font-size: 1.5rem; font-weight: 700;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .subtitle { margin: 0.25rem 0 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; }

    .back-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.25rem; background: rgba(255, 255, 255, 0.1);
      border-radius: 10px; color: white; text-decoration: none; font-size: 0.875rem;
      transition: all 0.2s;
      svg { width: 18px; height: 18px; }
      &:hover { background: rgba(255, 255, 255, 0.15); transform: translateX(-3px); }
    }

    .quick-actions {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem; margin-bottom: 2rem;
    }

    .action-card {
      display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
      background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(12px);
      border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1);
      text-decoration: none; color: white; transition: all 0.3s ease;
      &:hover {
        transform: translateY(-4px); border-color: rgba(99, 102, 241, 0.5);
        box-shadow: 0 12px 40px rgba(99, 102, 241, 0.2);
      }
      &.primary {
        background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
        border-color: transparent;
        &:hover { box-shadow: 0 12px 40px rgba(99, 102, 241, 0.4); transform: translateY(-4px) scale(1.02); }
      }
    }

    .action-icon {
      width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
      background: rgba(99, 102, 241, 0.2); border-radius: 12px; flex-shrink: 0;
      svg { width: 24px; height: 24px; stroke: #6366F1; }
      &.blue { background: rgba(59, 130, 246, 0.2); svg { stroke: #3B82F6; } }
      &.teal { background: rgba(20, 184, 166, 0.2); svg { stroke: #14B8A6; } }
      &.orange { background: rgba(249, 115, 22, 0.2); svg { stroke: #F97316; } }
      &.pink { background: rgba(236, 72, 153, 0.2); svg { stroke: #EC4899; } }
      &.green { background: rgba(34, 197, 94, 0.2); svg { stroke: #22C55E; } }
    }

    .action-card.primary .action-icon { background: rgba(255, 255, 255, 0.2); svg { stroke: white; } }

    .action-content { flex: 1; }
    .action-label { display: block; font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; }
    .action-desc { display: block; font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); }
    .action-card.primary .action-desc { color: rgba(255, 255, 255, 0.8); }
    .action-arrow { font-size: 1.25rem; color: rgba(255, 255, 255, 0.4); transition: transform 0.2s; }
    .action-card:hover .action-arrow { transform: translateX(4px); color: rgba(255, 255, 255, 0.8); }

    .content-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }

    .glass-card {
      background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(12px);
      border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.5rem;
    }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .card-header h2 {
      display: flex; align-items: center; gap: 0.75rem; margin: 0; font-size: 1.1rem; font-weight: 600;
      svg { width: 20px; height: 20px; stroke: #6366F1; }
    }
    .view-all-btn { color: #6366F1; text-decoration: none; font-size: 0.875rem; font-weight: 500; &:hover { color: #8B5CF6; } }

    .folios-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }

    .folio-card {
      background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1rem; text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s;
      &:hover { background: rgba(255, 255, 255, 0.08); transform: translateY(-2px); }
      &.warning { border-color: rgba(249, 115, 22, 0.5); background: rgba(249, 115, 22, 0.1); }
      &.danger { border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.1); }
    }

    .folio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .folio-type { font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px; }
    .folio-badge { font-size: 0.6rem; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 600;
      &.warning { background: rgba(249, 115, 22, 0.3); color: #F97316; }
      &.danger { background: rgba(239, 68, 68, 0.3); color: #EF4444; }
    }
    .folio-number { font-size: 2rem; font-weight: 700; color: #6366F1; line-height: 1; }
    .folio-card.warning .folio-number { color: #F97316; }
    .folio-card.danger .folio-number { color: #EF4444; }
    .folio-label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.25rem; }
    .folio-progress { margin-top: 0.75rem; }
    .progress-bar { height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #6366F1, #8B5CF6); border-radius: 2px; transition: width 0.5s ease; }
    .folio-card.warning .progress-fill { background: linear-gradient(90deg, #F97316, #FB923C); }
    .folio-card.danger .progress-fill { background: linear-gradient(90deg, #EF4444, #F87171); }
    .progress-text { display: block; font-size: 0.65rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.35rem; }

    .docs-table { display: flex; flex-direction: column; gap: 0.5rem; }
    .doc-row {
      display: grid; grid-template-columns: 140px 1fr 120px 110px; align-items: center;
      gap: 1rem; padding: 0.875rem 1rem; background: rgba(255, 255, 255, 0.03);
      border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s; animation: fadeInUp 0.3s ease forwards; opacity: 0;
      &:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(99, 102, 241, 0.3); }
    }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .doc-info { display: flex; flex-direction: column; }
    .doc-type { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
    .doc-folio { font-weight: 600; font-size: 0.95rem; }
    .doc-receptor { color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-amount { font-weight: 600; color: #10B981; text-align: right; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.65rem;
      border-radius: 6px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
      svg { width: 12px; height: 12px; }
      &.aceptado { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
      &.pendiente { background: rgba(249, 115, 22, 0.2); color: #F97316; }
      &.rechazado { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
      &.borrador { background: rgba(99, 102, 241, 0.2); color: #6366F1; }
    }

    .stats-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat-card {
      display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
      background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(12px);
      border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .stat-icon {
      width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px;
      svg { width: 24px; height: 24px; }
      &.blue { background: rgba(59, 130, 246, 0.2); svg { stroke: #3B82F6; } }
      &.green { background: rgba(34, 197, 94, 0.2); svg { stroke: #22C55E; } }
      &.orange { background: rgba(249, 115, 22, 0.2); svg { stroke: #F97316; } }
      &.purple { background: rgba(139, 92, 246, 0.2); svg { stroke: #8B5CF6; } }
    }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

    .empty-folios, .empty-docs { text-align: center; padding: 2rem; grid-column: 1 / -1; }
    .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.5; }
    .empty-folios p, .empty-docs p { color: rgba(255, 255, 255, 0.5); margin-bottom: 1rem; }
    .btn-primary {
      display: inline-block; padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white; border-radius: 10px; text-decoration: none; font-weight: 500;
      transition: all 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4); }
    }

    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; gap: 1rem; text-align: center; }
      .header-content { flex-direction: column; }
      .quick-actions { grid-template-columns: 1fr; }
      .doc-row { grid-template-columns: 1fr; gap: 0.5rem; }
      .doc-amount { text-align: left; }
    }
  `]
})
export class FacturacionDashboardComponent implements OnInit {
  readonly billingService = inject(BillingService);
  readonly cafs = signal<CafInfo[]>([]);
  readonly documentos = signal<Dte[]>([]);

  ngOnInit() { this.loadData(); }

  private loadData() {
    this.billingService.getCafs().subscribe({
      next: (cafs: CafInfo[]) => this.cafs.set(cafs),
      error: (err: any) => console.error('Error cargando CAFs', err)
    });
    this.billingService.getDtes(undefined, undefined, 0, 5).subscribe({
      next: (response: any) => {
        // Handle both simple list and page response
        const docs = response.content || response;
        if (Array.isArray(docs)) {
          this.documentos.set(docs);
        }
      },
      error: (err: any) => console.error('Error cargando documentos', err)
    });
  }

  getAceptados(): number { return this.documentos().filter(d => d.estado === 'ACEPTADO').length; }
  getPendientes(): number { return this.documentos().filter(d => d.estado === 'PENDIENTE').length; }
  getTotalVentas(): string {
    const total = this.documentos().reduce((sum, d) => sum + (d.montoTotal || 0), 0);
    return this.billingService.formatCurrency(total);
  }
}
