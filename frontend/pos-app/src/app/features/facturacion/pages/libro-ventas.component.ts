import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BillingService, Dte } from '../../../core/services/billing.service';

@Component({
  selector: 'app-libro-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule],
  template: `
    <div class="billing-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>📊 Libro de Ventas</h1>
          <p class="subtitle">Resumen de ventas por período</p>
        </div>
        <div class="header-actions">
          <button pButton label="Exportar Excel" icon="pi pi-file-excel" class="p-button-outlined p-button-success mx-2 font-bold" (click)="exportarExcel()"></button>
          <button pButton label="Generar PDF" icon="pi pi-file-pdf" class="premium-btn btn-primary" (click)="generarPdf()"></button>
        </div>
      </header>

      <!-- Filters -->
      <div class="glass-panel filters-bar mb-4">
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
          <div class="custom-period flex align-items-center gap-3 ml-4">
            <span class="text-secondary text-sm">Desde:</span>
            <input type="date" class="premium-input w-auto p-2" [(ngModel)]="fechaDesde" (change)="cargarDatos()">
            <span class="text-secondary text-sm">Hasta:</span>
            <input type="date" class="premium-input w-auto p-2" [(ngModel)]="fechaHasta" (change)="cargarDatos()">
          </div>
        }
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="glass-panel summary-card">
          <div class="card-icon-wrapper blue-glow">
            <i class="pi pi-file text-blue-400 text-3xl"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ totalDocumentos }}</span>
            <span class="card-label">Documentos Totales</span>
          </div>
        </div>
        <div class="glass-panel summary-card">
          <div class="card-icon-wrapper orange-glow">
            <i class="pi pi-dollar text-orange-400 text-3xl"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ formatCurrency(totalNeto) }}</span>
            <span class="card-label">Total Neto</span>
          </div>
        </div>
        <div class="glass-panel summary-card">
          <div class="card-icon-wrapper purple-glow">
            <i class="pi pi-percentage text-purple-400 text-3xl"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ formatCurrency(totalIva) }}</span>
            <span class="card-label">Total IVA</span>
          </div>
        </div>
        <div class="glass-panel summary-card highlight">
          <div class="card-icon-wrapper green-glow">
            <i class="pi pi-money-bill text-green-400 text-3xl"></i>
          </div>
          <div class="card-content">
            <span class="card-value text-green-400">{{ formatCurrency(totalVentas) }}</span>
            <span class="card-label text-green-200">Total Ventas</span>
          </div>
        </div>
      </div>

      <!-- By Document Type -->
      <section class="glass-panel p-4 mb-4">
        <h2 class="section-title"><i class="pi pi-chart-pie mr-2"></i>Por Tipo de Documento</h2>
        <div class="tipo-grid mt-4">
          @for (tipo of resumenPorTipo; track tipo.codigo) {
            <div class="tipo-card">
              <div class="tipo-header">
                <span class="tipo-icon mr-2">{{ tipo.icon }}</span>
                <span class="tipo-nombre">{{ tipo.nombre }}</span>
              </div>
              <div class="tipo-stats">
                <div class="stat text-center p-2 border-right-1 border-gray-700">
                  <span class="stat-value text-blue-400 text-xl font-bold">{{ tipo.cantidad }}</span>
                  <span class="stat-label block text-xs text-gray-400">docs</span>
                </div>
                <div class="stat text-center p-2">
                  <span class="stat-value amount-cell">{{ formatCurrency(tipo.total) }}</span>
                  <span class="stat-label block text-xs text-gray-400">total</span>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Detail Table -->
      <section class="glass-panel p-0 overflow-hidden">
        <div class="p-4 border-bottom-1 border-gray-700 bg-black-alpha-20">
            <h2 class="section-title m-0"><i class="pi pi-list mr-2"></i>Detalle de Documentos</h2>
        </div>
        
        @if (loading()) {
          <div class="loading-state p-5">
            <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-3"></i>
            <p class="text-gray-400">Cargando datos reales del SII...</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="premium-table w-full text-left">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>N° Folio</th>
                  <th>Fecha</th>
                  <th>RUT Receptor</th>
                  <th>Razón Social</th>
                  <th class="text-right">Neto</th>
                  <th class="text-right">IVA</th>
                  <th class="text-right">Total</th>
                  <th class="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documentos(); track doc.id) {
                  <tr>
                    <td>
                        <div class="flex align-items-center gap-2">
                            <i class="pi" [ngClass]="doc.tipoDte === 'BOLETA_ELECTRONICA' ? 'pi-receipt text-blue-400' : 'pi-file text-purple-400'"></i>
                            <span class="text-sm font-semibold">{{ doc.tipoDteDescripcion || doc.tipoDte }}</span>
                        </div>
                    </td>
                    <td class="font-bold text-gray-300">{{ doc.folio }}</td>
                    <td>
                        <span class="date-badge">
                            <i class="pi pi-calendar mr-1 text-xs"></i>
                            {{ formatDate(doc.fechaEmision) }}
                        </span>
                    </td>
                    <td class="text-gray-400">{{ doc.receptorRut || '—' }}</td>
                    <td class="text-gray-300 font-medium">{{ doc.receptorRazonSocial || '—' }}</td>
                    <td class="text-right text-gray-300">{{ formatCurrency(doc.montoNeto || 0) }}</td>
                    <td class="text-right text-gray-300">{{ formatCurrency(doc.montoIva || 0) }}</td>
                    <td class="text-right amount-cell">{{ formatCurrency(doc.montoTotal) }}</td>
                    <td class="text-center">
                        <span class="neon-tag" 
                              [ngClass]="{
                                'aceptado': doc.estado === 'ACEPTADO',
                                'pendiente': doc.estado === 'PENDIENTE',
                                'rechazado': doc.estado === 'RECHAZADO' || doc.estado === 'RECHAZADO_POR_SII'
                              }">
                            {{ doc.estadoDescripcion || doc.estado }}
                        </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="empty-cell py-6 text-center text-gray-500">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No hay documentos registrados en este período
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot class="bg-black-alpha-40">
                <tr>
                  <td colspan="5" class="text-right py-4 font-bold text-gray-300 text-lg uppercase tracking-wider">TOTALES PERÍODO</td>
                  <td class="text-right py-4 font-bold text-gray-200">{{ formatCurrency(totalNeto) }}</td>
                  <td class="text-right py-4 font-bold text-gray-200">{{ formatCurrency(totalIva) }}</td>
                  <td class="text-right py-4 font-bold amount-cell text-xl">{{ formatCurrency(totalVentas) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .billing-container {
      padding: 2rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      
      h1 {
        margin: 0;
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(to right, #4ade80, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -1px;
      }
      .subtitle { color: #94a3b8; font-size: 0.95rem; margin-top: 0.25rem; }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Premium Buttons */
    .premium-btn {
        border-radius: 12px !important;
        padding: 0.6rem 1.2rem !important;
        font-weight: 600 !important;
        border: none !important;
        transition: transform 0.2s, box-shadow 0.2s !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .premium-btn:active { transform: translateY(1px); }
    .premium-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    
    .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        color: white !important;
    }

    /* Glass Panels */
    .glass-panel {
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 32px rgba(255, 255, 255, 0.02);
    }
    
    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
        display: flex;
        align-items: center;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 1.25rem;
      align-items: center;
      padding: 1.25rem 2rem;
      flex-wrap: wrap;
    }
    
    .period-selector {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      background: rgba(0,0,0,0.2);
      padding: 0.25rem;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    
    .period-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .period-btn:hover {
      color: white;
      background: rgba(255, 255, 255, 0.05);
    }

    .period-btn.active {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .premium-input {
        background: rgba(15, 23, 42, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border-radius: 8px !important;
        transition: all 0.3s;
    }
    
    .premium-input:focus {
        border-color: #3b82f6 !important;
        outline: none;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .summary-card:hover {
      transform: translateY(-5px);
    }

    .summary-card.highlight {
      background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1));
      border-color: rgba(16, 185, 129, 0.3);
    }
    
    .card-icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.05);
    }
    
    .blue-glow { box-shadow: 0 0 20px rgba(96, 165, 250, 0.2); border: 1px solid rgba(96, 165, 250, 0.2); }
    .orange-glow { box-shadow: 0 0 20px rgba(251, 146, 60, 0.2); border: 1px solid rgba(251, 146, 60, 0.2); }
    .purple-glow { box-shadow: 0 0 20px rgba(192, 132, 252, 0.2); border: 1px solid rgba(192, 132, 252, 0.2); }
    .green-glow { box-shadow: 0 0 20px rgba(74, 222, 128, 0.2); border: 1px solid rgba(74, 222, 128, 0.2); }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
    }

    .card-label {
      font-size: 0.85rem;
      color: #94a3b8;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0.25rem;
    }

    /* Tipo Section */
    .tipo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .tipo-card {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s;
    }
    
    .tipo-card:hover {
        background: rgba(255,255,255,0.03);
        border-color: rgba(255,255,255,0.1);
    }

    .tipo-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .tipo-icon { font-size: 1.5rem; }
    .tipo-nombre { font-weight: 700; font-size: 0.95rem; color: #e2e8f0; }
    .tipo-stats { display: flex; }
    .stat { flex: 1; }

    /* Table Styles */
    .table-wrapper { overflow-x: auto; }
    
    .premium-table { border-collapse: collapse; }
    
    .premium-table thead th {
        background: transparent;
        color: #94a3b8;
        border: none;
        padding: 1.25rem 1rem;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    
    .premium-table tbody tr {
        background: transparent;
        color: #e2e8f0;
        border-bottom: 1px solid rgba(255,255,255,0.02);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .premium-table tbody tr:hover {
        background: rgba(59, 130, 246, 0.03);
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    }
    
    .premium-table td { padding: 1rem; font-size: 0.9rem; }
    
    .neon-tag {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        display: inline-block;
        text-transform: uppercase;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    .neon-tag.pendiente { background: rgba(245, 158, 11, 0.1); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); box-shadow: 0 0 10px rgba(245, 158, 11, 0.2); }
    .neon-tag.aceptado { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
    .neon-tag.rechazado { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
    
    .amount-cell {
        background: linear-gradient(to right, #4ade80, #10b981);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        font-size: 1.05rem;
    }
    
    .date-badge {
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        font-size: 0.85rem;
        color: #cbd5e1;
    }

    @media (max-width: 1024px) {
      .summary-cards { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .summary-cards { grid-template-columns: 1fr; }
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
