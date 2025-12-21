import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FacturacionService, Caf } from '../services/facturacion.service';

@Component({
    selector: 'app-facturacion-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>🧾 Facturación Electrónica</h1>
        <p class="subtitle">Gestión de documentos tributarios electrónicos</p>
      </header>

      <!-- Acciones rápidas -->
      <section class="quick-actions">
        <a routerLink="../emitir" class="action-card primary">
          <span class="icon">📝</span>
          <span class="label">Emitir Documento</span>
          <span class="description">Boleta, Factura, Notas</span>
        </a>
        <a routerLink="../documentos" class="action-card">
          <span class="icon">📄</span>
          <span class="label">Documentos</span>
          <span class="description">Historial de DTEs</span>
        </a>
        <a routerLink="../caf" class="action-card">
          <span class="icon">🔢</span>
          <span class="label">Folios (CAF)</span>
          <span class="description">Gestión de folios</span>
        </a>
        <a routerLink="../libro-ventas" class="action-card">
          <span class="icon">📊</span>
          <span class="label">Libro Ventas</span>
          <span class="description">Reporte mensual</span>
        </a>
      </section>

      <!-- Estado de folios -->
      <section class="folios-status">
        <h2>📊 Estado de Folios</h2>
        <div class="folios-grid">
          @for (caf of cafs(); track caf.id) {
            <div class="folio-card" [class.warning]="caf.porcentajeUso > 80" [class.danger]="caf.vencido || caf.agotado">
              <div class="folio-type">{{ caf.tipoDteDescripcion }}</div>
              <div class="folio-stats">
                <span class="disponibles">{{ caf.foliosDisponibles }}</span>
                <span class="label">disponibles</span>
              </div>
              <div class="folio-bar">
                <div class="bar-fill" [style.width.%]="caf.porcentajeUso"></div>
              </div>
              <div class="folio-range">{{ caf.folioActual }} / {{ caf.folioHasta }}</div>
              @if (caf.vencido) {
                <div class="folio-alert">⚠️ Vencido</div>
              }
              @if (caf.agotado) {
                <div class="folio-alert">⚠️ Agotado</div>
              }
            </div>
          } @empty {
            <div class="empty-state">
              <p>No hay folios configurados</p>
              <a routerLink="../caf" class="btn">Subir CAF</a>
            </div>
          }
        </div>
      </section>

      <!-- Documentos recientes -->
      <section class="recent-docs">
        <div class="section-header">
          <h2>📄 Documentos Recientes</h2>
          <a routerLink="../documentos" class="view-all">Ver todos →</a>
        </div>
        <div class="docs-list">
          @for (doc of documentos(); track doc.id) {
            <div class="doc-item" [class]="doc.estado.toLowerCase()">
              <div class="doc-type">
                <span class="tipo">{{ doc.tipoDteDescripcion }}</span>
                <span class="folio">N° {{ doc.folio }}</span>
              </div>
              <div class="doc-receptor">
                {{ doc.receptorRazonSocial || 'Sin receptor' }}
              </div>
              <div class="doc-monto">
                {{ facturacionService.formatCurrency(doc.montoTotal) }}
              </div>
              <div class="doc-estado">
                <span class="badge" [class]="doc.estado.toLowerCase()">{{ doc.estadoDescripcion }}</span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p>No hay documentos emitidos</p>
              <a routerLink="../emitir" class="btn">Emitir primer documento</a>
            </div>
          }
        </div>
      </section>
    </div>
  `,
    styles: [`
    .dashboard {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary, #1a1a2e);
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary, #666);
      margin: 0.25rem 0 0 0;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      background: var(--card-bg, #ffffff);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      border: 1px solid var(--border-color, #e0e0e0);
      transition: all 0.2s;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      border-color: var(--primary-color, #6366F1);
    }

    .action-card.primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      border: none;
    }

    .action-card .icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .action-card .label {
      font-weight: 600;
      font-size: 1rem;
    }

    .action-card .description {
      font-size: 0.75rem;
      opacity: 0.7;
      margin-top: 0.25rem;
    }

    .folios-status, .recent-docs {
      background: var(--card-bg, #ffffff);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .folios-status h2, .recent-docs h2 {
      font-size: 1.1rem;
      margin: 0 0 1rem 0;
      color: var(--text-primary, #1a1a2e);
    }

    .folios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .folio-card {
      background: var(--bg-secondary, #f5f5f5);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .folio-card.warning {
      border: 1px solid #f59e0b;
    }

    .folio-card.danger {
      border: 1px solid #ef4444;
      background: #fef2f2;
    }

    .folio-type {
      font-size: 0.8rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .folio-stats {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .folio-stats .disponibles {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary-color, #6366F1);
    }

    .folio-stats .label {
      font-size: 0.7rem;
      color: var(--text-secondary, #666);
    }

    .folio-bar {
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      margin: 0.75rem 0 0.5rem;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--primary-color, #6366F1);
      border-radius: 2px;
      transition: width 0.3s;
    }

    .folio-range {
      font-size: 0.7rem;
      color: var(--text-secondary, #666);
    }

    .folio-alert {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #ef4444;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .view-all {
      color: var(--primary-color, #6366F1);
      text-decoration: none;
      font-size: 0.875rem;
    }

    .docs-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .doc-item {
      display: grid;
      grid-template-columns: 150px 1fr 120px 100px;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary, #f5f5f5);
      border-radius: 8px;
      gap: 1rem;
    }

    .doc-type .tipo {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }

    .doc-type .folio {
      font-weight: 600;
    }

    .doc-receptor {
      color: var(--text-primary, #333);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doc-monto {
      font-weight: 600;
      text-align: right;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .badge.aceptado { background: #dcfce7; color: #16a34a; }
    .badge.pendiente { background: #fef3c7; color: #d97706; }
    .badge.rechazado { background: #fee2e2; color: #dc2626; }
    .badge.borrador { background: #e0e7ff; color: #4f46e5; }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }

    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: var(--primary-color, #6366F1);
      color: white;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .doc-item {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
    }
  `]
})
export class FacturacionDashboardComponent implements OnInit {
    readonly facturacionService = inject(FacturacionService);

    readonly cafs = signal<Caf[]>([]);
    readonly documentos = signal<any[]>([]);

    ngOnInit() {
        this.loadData();
    }

    private loadData() {
        this.facturacionService.listarCafs().subscribe({
            next: cafs => this.cafs.set(cafs),
            error: err => console.error('Error cargando CAFs', err)
        });

        this.facturacionService.listarDtes(0, 5).subscribe({
            next: response => this.documentos.set(response.content),
            error: err => console.error('Error cargando documentos', err)
        });
    }
}
