import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService, CafInfo, Dte, DteStats } from '../../../core/services/billing.service';

@Component({
  selector: 'app-facturacion-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-wrapper">
      <div class="ambient-glow"></div>
      
      <div class="dashboard-container">
        <!-- Header -->
        <header class="premium-header">
          <div class="header-content">
            <div class="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h1>Facturación Electrónica</h1>
              <p class="subtitle">Centro de Mando Tributario</p>
            </div>
          </div>
          <a routerLink="/pos" class="btn-glass-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver al POS
          </a>
        </header>

        <!-- Stats Rápidos (Bento Top) -->
        <div class="bento-stats">
          <div class="stat-card">
            <div class="stat-indicator pulse-blue"></div>
            <div class="stat-value">{{ stats()?.totalMes || 0 }}</div>
            <div class="stat-label">Documentos Mes</div>
          </div>
          <div class="stat-card">
            <div class="stat-indicator pulse-green"></div>
            <div class="stat-value">{{ stats()?.aceptados || 0 }}</div>
            <div class="stat-label">Aceptados SII</div>
          </div>
          <div class="stat-card">
            <div class="stat-indicator pulse-orange"></div>
            <div class="stat-value">{{ stats()?.pendientes || 0 }}</div>
            <div class="stat-label">Pendientes</div>
          </div>
          <div class="stat-card glow-card">
            <div class="stat-value highlight">{{ billingService.formatCurrency(stats()?.totalVentas || 0) }}</div>
            <div class="stat-label">Total Ventas (Mes)</div>
          </div>
        </div>

        <!-- Flujo Principal (Bento Grid) -->
        <section class="workflow-grid">
          
          <!-- Acción Primaria: Emitir -->
          <a routerLink="../emitir" class="action-card-hero">
            <div class="hero-bg-anim"></div>
            <div class="hero-content">
              <div class="hero-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h2>Emitir Documento</h2>
              <p>Crear nueva Boleta, Factura o Notas de Crédito/Débito al instante.</p>
            </div>
            <div class="hero-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </a>

          <!-- Botones Secundarios -->
          <div class="secondary-actions">
            <a routerLink="../documentos" class="action-btn-glass">
              <div class="action-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div class="action-text">
                <h3>Documentos Emitidos</h3>
                <p>Historial y visualización PDF</p>
              </div>
            </a>

            <a routerLink="../caf" class="action-btn-glass">
              <div class="action-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
              <div class="action-text">
                <h3>Gestión de Folios (CAF)</h3>
                <p>Cargar y revisar rangos</p>
              </div>
            </a>

            <a routerLink="../libro-ventas" class="action-btn-glass">
              <div class="action-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></div>
              <div class="action-text">
                <h3>Libro de Ventas</h3>
                <p>Reportes contables mensuales</p>
              </div>
            </a>

            <div class="action-group-row">
              <a routerLink="../configuracion" class="action-btn-glass small">
                <div class="action-icon pink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
                <h3>Configuración</h3>
              </a>
              <a routerLink="../certificacion" class="action-btn-glass small">
                <div class="action-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <h3>Certificación SII</h3>
              </a>
            </div>
          </div>
        </section>

        <!-- Monitoreo (Grilla Inferior) -->
        <div class="monitor-grid">
          <!-- Estado de Folios -->
          <section class="premium-panel folios-panel">
            <div class="panel-header">
              <h2>Estado de Folios</h2>
              <a routerLink="../caf" class="link-hover">Gestionar</a>
            </div>
            
            <div class="folios-list">
              @for (caf of cafs(); track caf.id) {
                <div class="folio-track" 
                     [class.warning]="caf.porcentajeUso > 80 && !caf.vencido && !caf.agotado" 
                     [class.danger]="caf.vencido || caf.agotado">
                  <div class="ft-info">
                    <span class="ft-type">{{ caf.tipoDteDescripcion }}</span>
                    <span class="ft-count"><strong>{{ caf.foliosDisponibles }}</strong> disponibles</span>
                  </div>
                  <div class="ft-progress-wrapper">
                    <div class="ft-bar"><div class="ft-fill" [style.width.%]="caf.porcentajeUso"></div></div>
                    <span class="ft-meta">{{ caf.folioActual }} / {{ caf.folioHasta }}</span>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <div class="empty-ring"></div>
                  <p>Sin folios configurados</p>
                  <a routerLink="../caf" class="btn-outline-glow">Cargar CAF</a>
                </div>
              }
            </div>
          </section>

          <!-- Documentos Recientes -->
          <section class="premium-panel docs-panel">
            <div class="panel-header">
              <h2>Emisiones Recientes</h2>
              <a routerLink="../documentos" class="link-hover">Ver todos</a>
            </div>

            <div class="docs-modern-list">
              @for (doc of documentos(); track doc.id; let i = $index) {
                <div class="doc-item" [style.animation-delay]="i * 0.05 + 's'">
                  <div class="doc-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div class="doc-main">
                    <div class="doc-title">{{ doc.receptorRazonSocial || 'Consumidor Final' }}</div>
                    <div class="doc-sub">{{ doc.tipoDteDescripcion || doc.tipoDte }} N° {{ doc.folio }}</div>
                  </div>
                  <div class="doc-status-col">
                    <span class="modern-badge" [class]="doc.estado.toLowerCase()">
                      <span class="dot"></span>
                      {{ doc.estadoDescripcion || doc.estado }}
                    </span>
                  </div>
                  <div class="doc-amount-col">
                    {{ billingService.formatCurrency(doc.montoTotal) }}
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <div class="empty-ring"></div>
                  <p>No hay documentos emitidos</p>
                </div>
              }
            </div>
          </section>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #09090b; /* zinc-950 */
      color: #fafafa;
      font-family: 'Inter', system-ui, sans-serif;
      position: relative;
      overflow-x: hidden;
    }

    /* Ambient Background Glow */
    .ambient-glow {
      position: absolute;
      top: -20%; left: 50%; transform: translateX(-50%);
      width: 80vw; height: 60vh;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(9, 9, 11, 0) 70%);
      pointer-events: none;
      z-index: 0;
    }

    .dashboard-container {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Header */
    .premium-header {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .header-content {
      display: flex; align-items: center; gap: 1.25rem;
    }
    .brand-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      color: #818cf8;
      box-shadow: 0 0 20px rgba(99,102,241,0.2);
    }
    .brand-icon svg { width: 28px; height: 28px; }
    .premium-header h1 {
      margin: 0; font-size: 1.75rem; font-weight: 700; letter-spacing: -0.5px;
      background: linear-gradient(to right, #fff, #a1a1aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .subtitle { margin: 0.25rem 0 0; color: #a1a1aa; font-size: 0.95rem; font-weight: 500; }

    .btn-glass-back {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      color: #d4d4d8; text-decoration: none; font-size: 0.875rem; font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-glass-back:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
      transform: translateX(-4px);
    }
    .btn-glass-back svg { width: 18px; height: 18px; }

    /* Bento Stats */
    .bento-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem;
    }
    .stat-card {
      background: rgba(24, 24, 27, 0.6); /* zinc-900 */
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      display: flex; flex-direction: column; justify-content: center;
      transition: transform 0.3s, border-color 0.3s;
    }
    .stat-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.1); }
    .stat-indicator {
      width: 8px; height: 8px; border-radius: 50%;
      position: absolute; top: 1.5rem; right: 1.5rem;
    }
    .pulse-blue { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; }
    .pulse-green { background: #22c55e; box-shadow: 0 0 10px #22c55e; }
    .pulse-orange { background: #f97316; box-shadow: 0 0 10px #f97316; }
    
    .stat-value { font-size: 2.25rem; font-weight: 800; line-height: 1.2; letter-spacing: -1px; }
    .stat-value.highlight {
      background: linear-gradient(135deg, #a78bfa, #818cf8);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .stat-label { color: #a1a1aa; font-size: 0.85rem; font-weight: 500; margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .glow-card {
      background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05));
      border: 1px solid rgba(99,102,241,0.2);
    }

    /* Workflow Grid */
    .workflow-grid {
      display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem;
    }

    .action-card-hero {
      position: relative;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 24px;
      padding: 2.5rem;
      text-decoration: none; color: white;
      overflow: hidden;
      display: flex; flex-direction: column; justify-content: flex-end;
      min-height: 300px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .action-card-hero:hover {
      transform: scale(1.02);
      box-shadow: 0 20px 40px rgba(79, 70, 229, 0.3);
    }
    .hero-bg-anim {
      position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
      animation: rotate 15s linear infinite;
    }
    @keyframes rotate { 100% { transform: rotate(360deg); } }
    
    .hero-content { position: relative; z-index: 1; }
    .hero-icon {
      width: 64px; height: 64px; background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px); border-radius: 18px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;
    }
    .hero-icon svg { width: 32px; height: 32px; stroke: #fff; }
    .hero-content h2 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; letter-spacing: -0.5px; }
    .hero-content p { color: rgba(255,255,255,0.8); font-size: 1.05rem; margin: 0; max-width: 80%; line-height: 1.4; }
    
    .hero-arrow {
      position: absolute; bottom: 2.5rem; right: 2.5rem;
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.3s;
    }
    .action-card-hero:hover .hero-arrow { transform: translateX(8px); background: rgba(255,255,255,0.3); }

    .secondary-actions {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
    }

    .action-btn-glass {
      background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px; padding: 1.5rem;
      display: flex; flex-direction: column; justify-content: space-between;
      text-decoration: none; color: white;
      transition: all 0.3s;
      min-height: 140px;
    }
    .action-btn-glass:hover {
      background: rgba(255,255,255,0.03);
      border-color: rgba(255,255,255,0.1);
      transform: translateY(-4px);
    }
    .action-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem;
    }
    .action-icon svg { width: 20px; height: 20px; }
    .action-icon.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .action-icon.teal { background: rgba(20, 184, 166, 0.15); color: #2dd4bf; }
    .action-icon.orange { background: rgba(249, 115, 22, 0.15); color: #fb923c; }
    .action-icon.pink { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
    .action-icon.green { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

    .action-text h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600; }
    .action-text p { margin: 0; font-size: 0.85rem; color: #a1a1aa; }

    .action-group-row {
      grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
    }
    .action-btn-glass.small {
      flex-direction: row; align-items: center; justify-content: flex-start; gap: 1rem;
      min-height: auto; padding: 1.25rem;
    }
    .action-btn-glass.small .action-icon { margin-bottom: 0; }
    .action-btn-glass.small h3 { font-size: 1rem; margin: 0; }

    /* Monitor Grid */
    .monitor-grid {
      display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-top: 1rem;
    }
    
    .premium-panel {
      background: rgba(24, 24, 27, 0.4); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 24px; padding: 1.75rem;
    }
    
    .panel-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
    }
    .panel-header h2 { margin: 0; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.3px; }
    .link-hover { color: #818cf8; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
    .link-hover:hover { color: #a78bfa; }

    /* Folios List */
    .folios-list { display: flex; flex-direction: column; gap: 1rem; }
    .folio-track {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px; padding: 1.25rem;
      transition: background 0.2s;
    }
    .folio-track:hover { background: rgba(255,255,255,0.04); }
    .folio-track.warning { border-color: rgba(249,115,22,0.3); }
    .folio-track.danger { border-color: rgba(239,68,68,0.3); }
    
    .ft-info { display: flex; justify-content: space-between; margin-bottom: 0.75rem; align-items: flex-end; }
    .ft-type { font-size: 0.85rem; color: #d4d4d8; font-weight: 500; }
    .ft-count { font-size: 0.85rem; color: #a1a1aa; }
    .ft-count strong { color: #fff; font-size: 1.1rem; }
    
    .ft-progress-wrapper { position: relative; }
    .ft-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .ft-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 3px; }
    .folio-track.warning .ft-fill { background: linear-gradient(90deg, #f97316, #fb923c); }
    .folio-track.danger .ft-fill { background: linear-gradient(90deg, #ef4444, #f87171); }
    .ft-meta { font-size: 0.75rem; color: #a1a1aa; margin-top: 0.5rem; display: block; text-align: right; }

    /* Docs List */
    .docs-modern-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .doc-item {
      display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 1.25rem;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03);
      border-radius: 16px; padding: 1rem 1.25rem;
      transition: all 0.3s; animation: fadeInUp 0.5s ease backwards;
    }
    .doc-item:hover {
      background: rgba(255,255,255,0.04); border-color: rgba(99,102,241,0.2);
      transform: translateX(4px); box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .doc-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.05);
      display: flex; align-items: center; justify-content: center; color: #a1a1aa;
    }
    .doc-icon-wrap svg { width: 20px; height: 20px; }
    
    .doc-main { display: flex; flex-direction: column; gap: 0.2rem; }
    .doc-title { font-weight: 600; font-size: 0.95rem; color: #f4f4f5; }
    .doc-sub { font-size: 0.8rem; color: #a1a1aa; }
    
    .modern-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      background: rgba(255,255,255,0.05);
    }
    .modern-badge .dot { width: 6px; height: 6px; border-radius: 50%; }
    .modern-badge.aceptado { color: #4ade80; background: rgba(74, 222, 128, 0.1); }
    .modern-badge.aceptado .dot { background: #4ade80; box-shadow: 0 0 8px #4ade80; }
    .modern-badge.pendiente { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
    .modern-badge.pendiente .dot { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; }
    .modern-badge.rechazado { color: #f87171; background: rgba(248, 113, 113, 0.1); }
    .modern-badge.rechazado .dot { background: #f87171; box-shadow: 0 0 8px #f87171; }
    
    .doc-amount-col { font-weight: 700; font-size: 1.05rem; color: #e4e4e7; text-align: right; min-width: 100px; }

    /* Empty States */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 3rem 1rem; text-align: center;
    }
    .empty-ring {
      width: 64px; height: 64px; border-radius: 50%;
      border: 2px dashed rgba(255,255,255,0.1); margin-bottom: 1rem;
    }
    .empty-state p { color: #a1a1aa; margin-bottom: 1.25rem; font-size: 0.95rem; }
    .btn-outline-glow {
      padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      color: #818cf8; border: 1px solid rgba(99,102,241,0.3); text-decoration: none;
      transition: all 0.2s;
    }
    .btn-outline-glow:hover { background: rgba(99,102,241,0.1); box-shadow: 0 0 15px rgba(99,102,241,0.2); }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Responsive */
    @media (max-width: 1024px) {
      .bento-stats { grid-template-columns: repeat(2, 1fr); }
      .workflow-grid { grid-template-columns: 1fr; }
      .monitor-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .premium-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .bento-stats { grid-template-columns: 1fr; }
      .secondary-actions { grid-template-columns: 1fr; }
      .action-group-row { grid-template-columns: 1fr; }
      .doc-item { grid-template-columns: 1fr; text-align: center; justify-items: center; }
      .doc-amount-col { text-align: center; }
    }
  `]
})
export class FacturacionDashboardComponent implements OnInit {
  readonly billingService = inject(BillingService);
  readonly cafs = signal<CafInfo[]>([]);
  readonly documentos = signal<Dte[]>([]);
  readonly stats = signal<DteStats | null>(null);

  ngOnInit() { this.loadData(); }

  private loadData() {
    this.billingService.getCafs().subscribe({
      next: (cafs: CafInfo[]) => this.cafs.set(cafs || []),
      error: (err: any) => {
        console.error('Error cargando CAFs', err);
        this.cafs.set([]);
      }
    });

    this.billingService.getDteStats().subscribe({
      next: (s: DteStats) => this.stats.set(s),
      error: (err: any) => console.error('Error cargando stats', err)
    });

    this.billingService.getDtes(undefined, undefined, 0, 5).subscribe({
      next: (response: any) => {
        if (!response) {
          this.documentos.set([]);
          return;
        }
        const docs = response.content || (Array.isArray(response) ? response : []);
        this.documentos.set(docs);
      },
      error: (err: any) => {
        console.error('Error cargando documentos', err);
        this.documentos.set([]);
      }
    });
  }
}
