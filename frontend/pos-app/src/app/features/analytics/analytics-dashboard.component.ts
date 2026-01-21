import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService, DailyStats } from '../../core/services/sales.service';

interface HourlySales {
  hora: number;
  ventas: number;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <!-- Header -->
      <header class="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25">
                📊
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white">Analytics</h1>
                <p class="text-slate-400 text-sm">Métricas de rendimiento en tiempo real</p>
              </div>
            </div>
            
            <!-- Date Range Selector -->
            <div class="flex items-center gap-3">
              <div class="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <button *ngFor="let range of dateRanges"
                        (click)="selectRange(range.id)"
                        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        [class]="selectedRange === range.id ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'">
                  {{ range.label }}
                </button>
              </div>
              <!-- Boton Personalizado provisionalmente hace reload del hoy -->
              <button (click)="loadMetrics()" class="px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
                📅 Actualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div *ngFor="let kpi of kpis" 
               class="relative overflow-hidden bg-gradient-to-br rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300"
               [style.background]="kpi.gradient">
            <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div class="relative">
              <p class="text-white/70 text-sm mb-1">{{ kpi.label }}</p>
              <p class="text-3xl font-bold text-white mb-2">{{ kpi.value }}</p>
              <div class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 rounded-full"
                      [class]="kpi.change >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'">
                  {{ kpi.change >= 0 ? '↑' : '↓' }} {{ kpi.change | number:'1.1-1' }}%
                </span>
                <span class="text-xs text-white/50">vs periodo anterior</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Sales by Hour -->
          <div class="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
              <h3 class="font-semibold text-white">Ventas por Hora</h3>
              <span class="text-sm text-slate-400">{{ selectedRange === 'today' ? 'Hoy' : 'Promedio/Acumulado' }}</span>
            </div>
            <div class="p-6">
              <div class="flex items-end justify-between h-48 gap-2">
                <ng-container *ngIf="hourlySales.length > 0; else noData">
                    <div *ngFor="let h of hourlySales" 
                        class="flex-1 flex flex-col items-center group relative">
                    <div class="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg transition-all duration-500 hover:from-violet-400 relative"
                        [style.height.%]="getBarHeight(h.ventas)">
                         <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700 pointer-events-none">
                            \${{ h.ventas | number }}
                         </div>
                    </div>
                    <span class="text-[10px] text-slate-500 mt-2">{{ h.hora }}h</span>
                    </div>
                </ng-container>
                <ng-template #noData>
                    <div class="w-full h-full flex items-center justify-center text-slate-500">
                        No hay datos disponibles
                    </div>
                </ng-template>
              </div>
            </div>
          </div>

          <!-- Top Products -->
          <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-700/50">
              <h3 class="font-semibold text-white">Top Productos</h3>
            </div>
            <div class="p-4 space-y-3">
              <ng-container *ngIf="topProducts.length > 0; else noProducts">
                  <div *ngFor="let product of topProducts; let i = index" 
                    class="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        [class]="i === 0 ? 'bg-amber-500 text-amber-900' : i === 1 ? 'bg-slate-400 text-slate-800' : i === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-600 text-slate-300'">
                    {{ i + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                    <p class="text-white text-sm font-medium truncate">{{ product.nombre }}</p>
                    <p class="text-slate-400 text-xs">{{ product.cantidad }} vendidos</p>
                    </div>
                    <p class="text-violet-400 font-semibold">\${{ product.total | number }}</p>
                </div>
              </ng-container>
               <ng-template #noProducts>
                    <div class="p-8 text-center text-slate-500">
                        No hay productos vendidos
                    </div>
                </ng-template>
            </div>
          </div>
        </div>

        <!-- Branch Performance -->
        <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden mb-8">
          <div class="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
            <h3 class="font-semibold text-white">Rendimiento por Sucursal</h3>
            <button class="text-sm text-violet-400 hover:text-violet-300">Ver detalle →</button>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <ng-container *ngIf="salesByBranch.length > 0; else noBranches">
                  <div *ngFor="let branch of salesByBranch" class="space-y-2">
                    <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg">🏢</div>
                        <div>
                        <p class="text-white font-medium">{{ branch.sucursalNombre }}</p>
                        <p class="text-slate-400 text-sm">{{ branch.transacciones }} transacciones</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-white font-semibold">\${{ branch.ventas | number }}</p>
                        <p class="text-violet-400 text-sm">{{ branch.porcentaje | number:'1.1-1' }}%</p>
                    </div>
                    </div>
                    <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                        [style.width.%]="branch.porcentaje">
                    </div>
                    </div>
                </div>
              </ng-container>
              <ng-template #noBranches>
                   <div class="p-8 text-center text-slate-500">
                        No hay datos de sucursales
                    </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button (click)="exportReport()" class="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 transition-colors group cursor-pointer">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📥</div>
            <div class="text-left">
              <p class="text-white font-medium">Exportar Reporte</p>
              <p class="text-slate-400 text-sm">Descargar CSV</p>
            </div>
          </button>
          <button class="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 transition-colors group cursor-not-allowed opacity-60">
            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📧</div>
            <div class="text-left">
              <p class="text-white font-medium">Programar Envío</p>
              <p class="text-slate-400 text-sm">Próximamente</p>
            </div>
          </button>
          <button class="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 transition-colors group cursor-not-allowed opacity-60">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⚙️</div>
            <div class="text-left">
              <p class="text-white font-medium">Configurar Dashboard</p>
              <p class="text-slate-400 text-sm">Próximamente</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  `
})
export class AnalyticsDashboardComponent implements OnInit {
  private salesService = inject(SalesService);

  selectedRange = 'today';
  dateRanges = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' }
  ];

  kpis: any[] = [];
  topProducts: any[] = [];
  salesByBranch: any[] = [];
  hourlySales: HourlySales[] = [];
  maxSales = 0;

  ngOnInit() {
    this.loadMetrics();
  }

  selectRange(rangeId: string) {
    this.selectedRange = rangeId;
    this.loadMetrics();
  }

  loadMetrics() {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate = endDate;

    if (this.selectedRange === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (this.selectedRange === 'month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split('T')[0];
    } else if (this.selectedRange === 'year') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split('T')[0];
    }

    if (startDate === endDate) {
      this.salesService.getDailyStats(endDate).subscribe({
        next: (stats) => {
          this.updateKPIs(stats);
          this.updateCharts(stats);
        },
        error: (err) => {
          console.error('Error loading analytics:', err);
          this.resetData();
        }
      });
    } else {
      this.salesService.getStatsRange(startDate, endDate).subscribe({
        next: (statsList) => {
          const aggregated = this.aggregateStats(statsList);
          this.updateKPIs(aggregated);
          this.updateCharts(aggregated);
        },
        error: (err) => {
          console.error('Error loading analytics range:', err);
          this.resetData();
        }
      });
    }
  }

  private aggregateStats(statsList: DailyStats[]): DailyStats {
    const agg: DailyStats = {
      fecha: '',
      totalVentas: 0,
      totalTransacciones: 0,
      ticketPromedio: 0,
      ventasAprobadas: 0,
      ventasPendientes: 0,
      ventasRechazadas: 0,
      ventasAnuladas: 0,
      montoAprobado: 0,
      montoPendiente: 0,
      topProductos: [],
      ventasPorHora: [],
      ventasPorMetodoPago: [],
      ventasPorSucursal: []
    };

    const productMap = new Map<string, any>();
    const hourMap = new Map<number, number>(); // hour -> total
    const branchMap = new Map<string, any>();
    const paymentMap = new Map<string, any>();

    statsList.forEach(stat => {
      agg.totalVentas += stat.totalVentas;
      agg.totalTransacciones += stat.totalTransacciones;
      agg.ventasAprobadas += stat.ventasAprobadas;
      agg.ventasPendientes += stat.ventasPendientes;
      agg.ventasRechazadas += stat.ventasRechazadas;
      agg.ventasAnuladas += stat.ventasAnuladas;
      agg.montoAprobado += stat.montoAprobado;
      agg.montoPendiente += stat.montoPendiente;

      // Aggregate products
      stat.topProductos?.forEach(p => {
        const key = p.sku;
        if (!productMap.has(key)) {
          productMap.set(key, { ...p });
        } else {
          const existing = productMap.get(key);
          existing.cantidad += p.cantidad;
          existing.total += p.total;
        }
      });

      // Aggregate hours
      stat.ventasPorHora?.forEach(h => {
        const current = hourMap.get(h.hora) || 0;
        hourMap.set(h.hora, current + h.total);
      });

      // Aggregate branches
      stat.ventasPorSucursal?.forEach(b => {
        if (!branchMap.has(b.sucursalId)) {
          branchMap.set(b.sucursalId, { ...b, ventas: 0, transacciones: 0 });
        }
        const existing = branchMap.get(b.sucursalId);
        existing.ventas += b.ventas;
        existing.transacciones += b.transacciones;
      });

      // Aggregate payments
      stat.ventasPorMetodoPago?.forEach(p => {
        if (!paymentMap.has(p.metodoPago)) {
          paymentMap.set(p.metodoPago, { ...p, total: 0, transacciones: 0 });
        }
        const existing = paymentMap.get(p.metodoPago);
        existing.total += p.total;
        existing.transacciones += p.transacciones;
      });
    });

    // Finalize aggregation
    agg.ticketPromedio = agg.totalTransacciones > 0 ? agg.totalVentas / agg.totalTransacciones : 0;
    agg.topProductos = Array.from(productMap.values()).sort((a, b) => b.total - a.total).slice(0, 10);

    agg.ventasPorHora = Array.from(hourMap.entries()).map(([hora, total]) => ({
      hora,
      horaLabel: `${hora}:00`,
      transacciones: 0, // Not tracking aggregated hourly transactions for now
      total
    })).sort((a, b) => a.hora - b.hora);

    agg.ventasPorSucursal = Array.from(branchMap.values()).map(b => {
      b.porcentaje = agg.totalVentas > 0 ? (b.ventas / agg.totalVentas) * 100 : 0;
      return b;
    });

    agg.ventasPorMetodoPago = Array.from(paymentMap.values()).map(p => {
      p.porcentaje = agg.totalVentas > 0 ? (p.total / agg.totalVentas) * 100 : 0;
      return p;
    });

    return agg;
  }

  private resetData() {
    this.kpis = [
      { label: 'Ventas Totales', value: '$0', change: 0, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
      { label: 'Transacciones', value: '0', change: 0, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
      { label: 'Ticket Promedio', value: '$0', change: 0, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
      { label: 'Ventas Aprobadas', value: '0', change: 0, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
    ];
    this.topProducts = [];
    this.hourlySales = [];
    this.salesByBranch = [];
    this.maxSales = 0;
  }

  private updateKPIs(stats: DailyStats) {
    const formatCurrency = (val: number) => '$' + (val || 0).toLocaleString('es-CL');
    const formatNumber = (val: number) => (val || 0).toLocaleString('es-CL');

    this.kpis = [
      {
        label: 'Ventas Totales',
        value: formatCurrency(stats.totalVentas),
        change: 0,
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
      },
      {
        label: 'Transacciones',
        value: formatNumber(stats.totalTransacciones),
        change: 0,
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
      },
      {
        label: 'Ticket Promedio',
        value: formatCurrency(stats.ticketPromedio),
        change: 0,
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      },
      {
        label: 'Ventas Aprobadas',
        value: formatNumber(stats.ventasAprobadas),
        change: 0,
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      }
    ];
  }

  private updateCharts(stats: DailyStats) {
    this.topProducts = stats.topProductos || [];

    this.hourlySales = (stats.ventasPorHora || []).map(h => ({
      hora: h.hora,
      ventas: h.total
    }));

    let max = 0;
    if (this.hourlySales.length > 0) {
      max = Math.max(...this.hourlySales.map(h => h.ventas));
    }
    this.maxSales = max > 1000 ? max : 1000;

    this.salesByBranch = stats.ventasPorSucursal || [];
  }

  getBarHeight(ventas: number): number {
    if (this.maxSales === 0) return 0;
    return (ventas / this.maxSales) * 100;
  }

  exportReport() {
    // Headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== REPORTE DE VENTAS ===\n\n";

    // Summary
    csvContent += "Métrica,Valor\n";
    this.kpis.forEach(k => {
      csvContent += `${k.label},"${k.value}"\n`; // quote value to handle currency commas
    });
    csvContent += "\n";

    // Top Products
    csvContent += "=== TOP PRODUCTOS ===\n";
    csvContent += "Nombre,Cantidad,Total\n";
    this.topProducts.forEach(p => {
      csvContent += `${p.nombre},${p.cantidad},${p.total}\n`;
    });
    csvContent += "\n";

    // Hourly
    csvContent += "=== VENTAS POR HORA ===\n";
    csvContent += "Hora,Ventas\n";
    this.hourlySales.forEach(h => {
      csvContent += `${h.hora}:00,${h.ventas}\n`;
    });
    csvContent += "\n";

    // Branches
    csvContent += "=== POR SUCURSAL ===\n";
    csvContent += "Sucursal,Transacciones,Ventas,%\n";
    this.salesByBranch.forEach(b => {
      csvContent += `${b.sucursalNombre},${b.transacciones},${b.ventas},${b.porcentaje}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${this.selectedRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
