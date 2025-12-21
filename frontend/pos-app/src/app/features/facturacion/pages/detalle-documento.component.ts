import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FacturacionService, Dte } from '../services/facturacion.service';

@Component({
  selector: 'app-detalle-documento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detalle-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando documento...</p>
        </div>
      } @else if (documento()) {
        <!-- Header -->
        <header class="page-header">
          <a routerLink="../../documentos" class="back-btn">← Volver</a>
          <div class="header-content">
            <div class="header-left">
              <span class="tipo-icon">{{ getTipoIcon() }}</span>
              <div class="header-info">
                <h1>{{ documento()!.tipoDteDescripcion }} N° {{ documento()!.folio }}</h1>
                <span class="badge" [class]="documento()!.estado.toLowerCase()">
                  {{ documento()!.estadoDescripcion }}
                </span>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn-secondary" (click)="descargarXml()">
                📋 Descargar XML
              </button>
              <button class="btn-primary" (click)="descargarPdf()">
                📥 Descargar PDF
              </button>
            </div>
          </div>
        </header>

        <!-- Contenido principal -->
        <div class="content-grid">
          <!-- Columna izquierda: Datos del documento -->
          <div class="main-column">
            <!-- Información general -->
            <section class="card info-card">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Fecha Emisión</span>
                  <span class="value">{{ formatDate(documento()!.fechaEmision) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Folio</span>
                  <span class="value">{{ documento()!.folio }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Track ID</span>
                  <span class="value">{{ documento()!.trackId || 'Pendiente' }}</span>
                </div>
              </div>
            </section>

            <!-- Receptor -->
            <section class="card">
              <h3>👤 Receptor</h3>
              <div class="receptor-info">
                @if (documento()!.receptorRut) {
                  <div class="receptor-main">
                    <span class="receptor-nombre">{{ documento()!.receptorRazonSocial }}</span>
                    <span class="receptor-rut">RUT: {{ documento()!.receptorRut }}</span>
                  </div>
                  @if (documento()!.receptorEmail) {
                    <p>📧 {{ documento()!.receptorEmail }}</p>
                  }
                } @else {
                  <p class="no-receptor">Sin datos de receptor (Boleta)</p>
                }
              </div>
            </section>

            <!-- Detalle de items -->
            <section class="card">
              <h3>📦 Detalle de Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th class="right">Cant.</th>
                    <th class="right">P. Unit.</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of documento()!.detalles; track item.numeroLinea) {
                    <tr>
                      <td>{{ item.numeroLinea }}</td>
                      <td>
                        <span class="item-nombre">{{ item.nombreItem }}</span>
                        @if (item.descripcionItem) {
                          <span class="item-desc">{{ item.descripcionItem }}</span>
                        }
                      </td>
                      <td class="right">{{ item.cantidad }}</td>
                      <td class="right">{{ formatCurrency(item.precioUnitario) }}</td>
                      <td class="right">{{ formatCurrency(item.montoItem) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </section>
          </div>

          <!-- Columna derecha: Totales y estado -->
          <div class="side-column">
            <!-- Totales -->
            <section class="card totales-card">
              <h3>💰 Totales</h3>
              <div class="totales-list">
                @if (documento()!.montoNeto) {
                  <div class="total-row">
                    <span>Neto</span>
                    <span>{{ formatCurrency(documento()!.montoNeto!) }}</span>
                  </div>
                }
                @if (documento()!.montoExento) {
                  <div class="total-row">
                    <span>Exento</span>
                    <span>{{ formatCurrency(documento()!.montoExento!) }}</span>
                  </div>
                }
                @if (documento()!.montoIva) {
                  <div class="total-row">
                    <span>IVA (19%)</span>
                    <span>{{ formatCurrency(documento()!.montoIva!) }}</span>
                  </div>
                }
                <div class="total-row total">
                  <span>TOTAL</span>
                  <span>{{ formatCurrency(documento()!.montoTotal) }}</span>
                </div>
              </div>
            </section>

            <!-- Estado SII -->
            <section class="card estado-card">
              <h3>🏛️ Estado SII</h3>
              <div class="estado-timeline">
                <div class="timeline-item" [class.completed]="true">
                  <span class="timeline-icon">✓</span>
                  <div class="timeline-content">
                    <span class="timeline-title">Documento Generado</span>
                    <span class="timeline-date">{{ formatDateTime(documento()!.createdAt) }}</span>
                  </div>
                </div>
                @if (documento()!.fechaEnvio) {
                  <div class="timeline-item" [class.completed]="true">
                    <span class="timeline-icon">✓</span>
                    <div class="timeline-content">
                      <span class="timeline-title">Enviado al SII</span>
                      <span class="timeline-date">{{ formatDateTime(documento()!.fechaEnvio!) }}</span>
                    </div>
                  </div>
                }
                @if (documento()!.fechaRespuesta) {
                  <div class="timeline-item" [class.completed]="documento()!.estado === 'ACEPTADO'" [class.error]="documento()!.estado === 'RECHAZADO'">
                    <span class="timeline-icon">{{ documento()!.estado === 'ACEPTADO' ? '✓' : '✗' }}</span>
                    <div class="timeline-content">
                      <span class="timeline-title">{{ documento()!.estadoDescripcion }}</span>
                      @if (documento()!.glosaEstado) {
                        <span class="timeline-glosa">{{ documento()!.glosaEstado }}</span>
                      }
                      <span class="timeline-date">{{ formatDateTime(documento()!.fechaRespuesta!) }}</span>
                    </div>
                  </div>
                }
              </div>
              
              @if (documento()!.estado === 'PENDIENTE') {
                <button class="btn-secondary full-width" (click)="consultarEstado()">
                  🔄 Consultar Estado
                </button>
              }
            </section>

            <!-- Acciones adicionales -->
            <section class="card acciones-card">
              <h3>⚡ Acciones</h3>
              <div class="acciones-list">
                @if (documento()!.receptorEmail) {
                  <button class="action-btn" (click)="enviarPorEmail()">
                    📧 Enviar por Email
                  </button>
                }
                <button class="action-btn" (click)="imprimir()">
                  🖨️ Imprimir
                </button>
                @if (documento()!.estado === 'ACEPTADO') {
                  <button class="action-btn warning" routerLink="../../emitir" [queryParams]="{referencia: documento()!.id}">
                    🔻 Emitir Nota de Crédito
                  </button>
                }
              </div>
            </section>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detalle-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .loading-state {
      text-align: center;
      padding: 4rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #6366F1;
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .back-btn {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      transition: color 0.2s;
    }

    .back-btn:hover { color: white; }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .tipo-icon {
      font-size: 2.5rem;
    }

    .header-info h1 {
      margin: 0;
      font-size: 1.5rem;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-secondary, .btn-primary {
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 1.5rem;
    }

    .card {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1rem;
    }

    .card h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item .label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }

    .info-item .value {
      font-weight: 600;
      color: white;
    }

    .receptor-main {
      display: flex;
      flex-direction: column;
    }

    .receptor-nombre {
      font-weight: 600;
      font-size: 1.1rem;
      color: white;
    }

    .receptor-rut {
      color: rgba(255, 255, 255, 0.5);
    }

    .no-receptor {
      color: rgba(255, 255, 255, 0.5);
      font-style: italic;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table th {
      text-align: left;
      padding: 0.75rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }

    .items-table td {
      padding: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .items-table .right {
      text-align: right;
    }

    .item-nombre {
      display: block;
      font-weight: 500;
      color: white;
    }

    .item-desc {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .totales-list {
      display: flex;
      flex-direction: column;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      color: rgba(255, 255, 255, 0.7);
    }

    .total-row.total {
      border-top: 2px solid rgba(255, 255, 255, 0.1);
      margin-top: 0.5rem;
      padding-top: 1rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #10B981;
    }

    .estado-timeline {
      margin-bottom: 1rem;
    }

    .timeline-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-left: 2px solid rgba(255, 255, 255, 0.1);
      margin-left: 0.75rem;
      padding-left: 1rem;
      position: relative;
    }

    .timeline-icon {
      position: absolute;
      left: -12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .timeline-item.completed .timeline-icon {
      background: #10B981;
      color: white;
    }

    .timeline-item.error .timeline-icon {
      background: #ef4444;
      color: white;
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      padding-left: 0.5rem;
    }

    .timeline-title {
      font-weight: 500;
      color: white;
    }

    .timeline-date {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .timeline-glosa {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .full-width {
      width: 100%;
    }

    .acciones-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-btn {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      color: white;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      text-decoration: none;
    }

    .action-btn:hover {
      border-color: #6366F1;
      background: rgba(99, 102, 241, 0.1);
    }

    .action-btn.warning:hover {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: 0.5rem;
      text-transform: uppercase;
    }

    .badge.aceptado { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
    .badge.pendiente { background: rgba(249, 115, 22, 0.2); color: #F97316; }
    .badge.rechazado { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    .badge.borrador { background: rgba(99, 102, 241, 0.2); color: #6366F1; }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class DetalleDocumentoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private facturacionService = inject(FacturacionService);

  documento = signal<Dte | null>(null);
  loading = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDocumento(id);
    }
  }

  cargarDocumento(id: string) {
    this.loading.set(true);
    this.facturacionService.getDte(id).subscribe({
      next: (doc) => {
        this.documento.set(doc);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando documento', err);
        this.loading.set(false);
      }
    });
  }

  getTipoIcon(): string {
    const tipo = this.documento()?.tipoDte;
    const icons: Record<string, string> = {
      'BOLETA_ELECTRONICA': '🧾',
      'FACTURA_ELECTRONICA': '📄',
      'NOTA_CREDITO': '🔻',
      'NOTA_DEBITO': '🔺'
    };
    return icons[tipo || ''] || '📄';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CL');
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('es-CL');
  }

  formatCurrency(value: number): string {
    return this.facturacionService.formatCurrency(value);
  }

  descargarXml() {
    const doc = this.documento();
    if (!doc) return;

    this.facturacionService.getXml(doc.id).subscribe({
      next: (xml) => {
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.tipoDte}_${doc.folio}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error descargando XML', err)
    });
  }

  descargarPdf() {
    const doc = this.documento();
    if (!doc) return;

    this.facturacionService.getPdf(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.tipoDte}_${doc.folio}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error descargando PDF', err)
    });
  }

  consultarEstado() {
    // TODO: Implementar consulta de estado al SII
    alert('Consultando estado al SII...');
  }

  enviarPorEmail() {
    // TODO: Implementar envío por email
    alert('Enviando documento por email...');
  }

  imprimir() {
    window.print();
  }
}
