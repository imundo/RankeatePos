import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BillingService, Dte } from '../../../core/services/billing.service';

@Component({
  selector: 'app-libro-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="libro-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>📊 Libro de Ventas</h1>
          <p class="subtitle">Resumen de ventas por período</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportarExcel()">
            📥 Exportar Excel
          </button>
          <button class="btn-primary" (click)="generarPdf()">
            📄 Generar PDF
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="period-selector">
          <button 
            class="period-btn" 
            [class.active]="periodoRapido === 'mes'"
            (click)="seleccionarPeriodo('mes')">
            Este Mes
          </button>
          <button 
            class="period-btn" 
            [class.active]="periodoRapido === 'trimestre'"
            (click)="seleccionarPeriodo('trimestre')">
            Este Trimestre
          </button>
          <button 
            class="period-btn" 
            [class.active]="periodoRapido === 'año'"
            (click)="seleccionarPeriodo('año')">
            Este Año
          </button>
          <button 
            class="period-btn" 
            [class.active]="periodoRapido === 'custom'"
            (click)="periodoRapido = 'custom'">
            Personalizado
          </button>
        </div>

        @if (periodoRapido === 'custom') {
          <div class="custom-period">
            <input type="date" [(ngModel)]="fechaDesde" (change)="cargarDatos()">
            <span>hasta</span>
            <input type="date" [(ngModel)]="fechaHasta" (change)="cargarDatos()">
          </div>
        }
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <span class="card-icon">🧾</span>
          <div class="card-content">
            <span class="card-value">{{ totalDocumentos }}</span>
            <span class="card-label">Documentos</span>
          </div>
        </div>
        <div class="summary-card">
          <span class="card-icon">💰</span>
          <div class="card-content">
            <span class="card-value">{{ formatCurrency(totalNeto) }}</span>
            <span class="card-label">Total Neto</span>
          </div>
        </div>
        <div class="summary-card">
          <span class="card-icon">🏦</span>
          <div class="card-content">
            <span class="card-value">{{ formatCurrency(totalIva) }}</span>
            <span class="card-label">Total IVA</span>
          </div>
        </div>
        <div class="summary-card highlight">
          <span class="card-icon">📈</span>
          <div class="card-content">
            <span class="card-value">{{ formatCurrency(totalVentas) }}</span>
            <span class="card-label">Total Ventas</span>
          </div>
        </div>
      </div>

      <!-- By Document Type -->
      <section class="tipo-section">
        <h2>Por Tipo de Documento</h2>
        <div class="tipo-grid">
          @for (tipo of resumenPorTipo; track tipo.codigo) {
            <div class="tipo-card">
              <div class="tipo-header">
                <span class="tipo-icon">{{ tipo.icon }}</span>
                <span class="tipo-nombre">{{ tipo.nombre }}</span>
              </div>
              <div class="tipo-stats">
                <div class="stat">
                  <span class="stat-value">{{ tipo.cantidad }}</span>
                  <span class="stat-label">docs</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ formatCurrency(tipo.total) }}</span>
                  <span class="stat-label">total</span>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Detail Table -->
      <section class="detail-section">
        <h2>Detalle de Documentos</h2>
        
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        } @else {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>N° Folio</th>
                  <th>Fecha</th>
                  <th>RUT Receptor</th>
                  <th>Razón Social</th>
                  <th class="right">Neto</th>
                  <th class="right">IVA</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documentos(); track doc.id) {
                  <tr>
                    <td>{{ doc.tipoDte }}</td>
                    <td>{{ doc.folio }}</td>
                    <td>{{ formatDate(doc.fechaEmision) }}</td>
                    <td>{{ doc.receptorRut || '—' }}</td>
                    <td>{{ doc.receptorRazonSocial || '—' }}</td>
                    <td class="right">{{ formatCurrency(doc.montoNeto || 0) }}</td>
                    <td class="right">{{ formatCurrency(doc.montoIva || 0) }}</td>
                    <td class="right">{{ formatCurrency(doc.montoTotal) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="empty-cell">No hay documentos en este período</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5"><strong>TOTALES</strong></td>
                  <td class="right"><strong>{{ formatCurrency(totalNeto) }}</strong></td>
                  <td class="right"><strong>{{ formatCurrency(totalIva) }}</strong></td>
                  <td class="right"><strong>{{ formatCurrency(totalVentas) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .libro-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
      margin: 0;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.5);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
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

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Filters */
    .filters-bar {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .period-selector {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .period-btn {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s;
    }

    .period-btn:hover {
      border-color: #6366F1;
      color: white;
    }

    .period-btn.active {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      border-color: transparent;
    }

    .custom-period {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .custom-period input {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    .custom-period span {
      color: rgba(255, 255, 255, 0.5);
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s;
    }

    .summary-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
    }

    .summary-card.highlight {
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
      border-color: rgba(99, 102, 241, 0.5);
    }

    .card-icon {
      font-size: 2rem;
    }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .summary-card.highlight .card-value {
      color: #10B981;
    }

    .card-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    /* Tipo Section */
    .tipo-section, .detail-section {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .tipo-section h2, .detail-section h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: white;
    }

    .tipo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .tipo-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .tipo-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .tipo-icon {
      font-size: 1.25rem;
    }

    .tipo-nombre {
      font-weight: 500;
      font-size: 0.9rem;
      color: white;
    }

    .tipo-stats {
      display: flex;
      gap: 1.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-weight: 600;
      color: #6366F1;
    }

    .stat-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: rgba(255, 255, 255, 0.05);
    }

    th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
    }

    th.right, td.right {
      text-align: right;
    }

    td {
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
    }

    tfoot {
      background: rgba(255, 255, 255, 0.05);
    }

    tfoot td {
      border-top: 2px solid rgba(255, 255, 255, 0.1);
      color: #10B981;
    }

    .empty-cell {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      padding: 2rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
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

    @media (max-width: 1024px) {
      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LibroVentasComponent implements OnInit {
  private billingService = inject(BillingService);

  documentos = signal<Dte[]>([]);
  loading = signal(false);

  periodoRapido: 'mes' | 'trimestre' | 'año' | 'custom' = 'mes';
  fechaDesde = '';
  fechaHasta = '';

  totalDocumentos = 0;
  totalNeto = 0;
  totalIva = 0;
  totalVentas = 0;

  resumenPorTipo: { codigo: string; nombre: string; icon: string; cantidad: number; total: number }[] = [];

  ngOnInit() {
    this.seleccionarPeriodo('mes');
  }

  seleccionarPeriodo(periodo: 'mes' | 'trimestre' | 'año' | 'custom') {
    this.periodoRapido = periodo;

    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();

    switch (periodo) {
      case 'mes':
        this.fechaDesde = this.formatDateInput(new Date(año, mes, 1));
        this.fechaHasta = this.formatDateInput(new Date(año, mes + 1, 0));
        break;
      case 'trimestre':
        const trimestre = Math.floor(mes / 3);
        this.fechaDesde = this.formatDateInput(new Date(año, trimestre * 3, 1));
        this.fechaHasta = this.formatDateInput(new Date(año, (trimestre + 1) * 3, 0));
        break;
      case 'año':
        this.fechaDesde = this.formatDateInput(new Date(año, 0, 1));
        this.fechaHasta = this.formatDateInput(new Date(año, 11, 31));
        break;
    }

    if (periodo !== 'custom') {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    if (!this.fechaDesde || !this.fechaHasta) return;

    this.loading.set(true);
    this.billingService.getLibroVentas(this.fechaDesde, this.fechaHasta).subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.calcularTotales(docs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando libro de ventas', err);
        this.loading.set(false);
        // Datos mock para demo
        this.generarDatosMock();
      }
    });
  }

  calcularTotales(docs: Dte[]) {
    this.totalDocumentos = docs.length;
    this.totalNeto = docs.reduce((sum, d) => sum + (d.montoNeto || 0), 0);
    this.totalIva = docs.reduce((sum, d) => sum + (d.montoIva || 0), 0);
    this.totalVentas = docs.reduce((sum, d) => sum + d.montoTotal, 0);

    // Agrupar por tipo
    const grouped = new Map<string, { cantidad: number; total: number }>();
    docs.forEach(d => {
      const current = grouped.get(d.tipoDte) || { cantidad: 0, total: 0 };
      grouped.set(d.tipoDte, {
        cantidad: current.cantidad + 1,
        total: current.total + d.montoTotal
      });
    });

    const iconMap: Record<string, string> = {
      'BOLETA_ELECTRONICA': '🧾',
      'FACTURA_ELECTRONICA': '📄',
      'NOTA_CREDITO': '🔻',
      'NOTA_DEBITO': '🔺'
    };

    this.resumenPorTipo = Array.from(grouped.entries()).map(([codigo, data]) => ({
      codigo,
      nombre: codigo.replace(/_/g, ' '),
      icon: iconMap[codigo] || '📄',
      cantidad: data.cantidad,
      total: data.total
    }));
  }

  generarDatosMock() {
    // Generar datos de ejemplo
    const mockDocs: Dte[] = [
      { id: '1', tipoDte: 'BOLETA_ELECTRONICA', tipoDteDescripcion: 'Boleta', folio: 1001, fechaEmision: '2024-01-15', emisorRut: '12.345.678-9', emisorRazonSocial: 'Mi Empresa', montoNeto: 84034, montoIva: 15966, montoTotal: 100000, tasaIva: 19, estado: 'ACEPTADO', estadoDescripcion: 'Aceptado' },
      { id: '2', tipoDte: 'FACTURA_ELECTRONICA', tipoDteDescripcion: 'Factura', folio: 501, fechaEmision: '2024-01-16', emisorRut: '12.345.678-9', emisorRazonSocial: 'Mi Empresa', receptorRut: '98.765.432-1', receptorRazonSocial: 'Cliente SA', montoNeto: 420168, montoIva: 79832, montoTotal: 500000, tasaIva: 19, estado: 'ACEPTADO', estadoDescripcion: 'Aceptado' },
      { id: '3', tipoDte: 'BOLETA_ELECTRONICA', tipoDteDescripcion: 'Boleta', folio: 1002, fechaEmision: '2024-01-17', emisorRut: '12.345.678-9', emisorRazonSocial: 'Mi Empresa', montoNeto: 25210, montoIva: 4790, montoTotal: 30000, tasaIva: 19, estado: 'ACEPTADO', estadoDescripcion: 'Aceptado' },
    ];
    this.documentos.set(mockDocs);
    this.calcularTotales(mockDocs);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CL');
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatCurrency(value: number): string {
    return this.billingService.formatCurrency(value);
  }

  exportarExcel() {
    if (!this.fechaDesde || !this.fechaHasta) {
      alert('Seleccione un período');
      return;
    }

    this.billingService.downloadLibroVentasExcel(this.fechaDesde, this.fechaHasta).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `libro_ventas_${this.fechaDesde}_${this.fechaHasta}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error exportando Excel', err)
    });
  }

  generarPdf() {
    if (!this.fechaDesde || !this.fechaHasta) {
      alert('Seleccione un período');
      return;
    }

    this.billingService.downloadLibroVentasPdf(this.fechaDesde, this.fechaHasta).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `libro_ventas_${this.fechaDesde}_${this.fechaHasta}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error generando PDF', err)
    });
  }
}
