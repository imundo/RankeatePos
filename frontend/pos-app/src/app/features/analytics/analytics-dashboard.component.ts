import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { SalesService, DailyStats } from '../../core/services/sales.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HourlySales {
  hora: number;
  ventas: number;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule],
  template: `
    <div class="analytics-premium min-h-screen bg-[#0f172a] text-white pb-20">
      
      <!-- Premium Header -->
      <header class="glass-header sticky top-0 z-20 px-6 py-4 flex justify-between items-center backdrop-blur-xl border-b border-white/5">
        <div class="flex items-center gap-4">
          <div class="icon-box relative group">
            <div class="absolute inset-0 bg-violet-500/30 blur-xl rounded-full group-hover:bg-violet-400/40 transition-all duration-500"></div>
            <div class="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg border border-white/10">
              ⚡
            </div>
          </div>
          <div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Analytics Pro</h1>
            <p class="text-slate-400 text-sm font-medium">Tiempo real</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="glass-card p-1 rounded-xl flex gap-1">
            <button *ngFor="let range of dateRanges"
                    (click)="selectRange(range.id)"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden"
                    [class]="selectedRange === range.id ? 'bg-violet-600/90 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'">
              {{ range.label }}
            </button>
          </div>
          
          <!-- Export Actions -->
          <div class="flex gap-2 ml-4">
            <button (click)="exportToPdf()" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-red-400 transition-colors border border-white/5" title="Export PDF">
              📄
            </button>
            <button (click)="exportToCsv()" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-emerald-400 transition-colors border border-white/5" title="Export CSV">
              📊
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        
        <!-- Hero Metrics Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          <!-- Total Sales Card -->
          <div class="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl group-hover:bg-violet-500/30 transition-all"></div>
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Ventas Totales</p>
                  <h3 class="text-3xl font-bold tracking-tight">{{ kpis[0]?.value }}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300">
                  💰
                </div>
              </div>
              <div class="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
                <span class="bg-emerald-500/10 px-2 py-0.5 rounded-full">↑ 12.5%</span>
                <span class="text-slate-500">vs periodo anterior</span>
              </div>
            </div>
          </div>

          <!-- Goal Progress Circle -->
          <div class="glass-card p-6 rounded-3xl relative flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm font-medium mb-1">Meta del Mes</p>
              <h3 class="text-2xl font-bold mb-1">{{ goalPercentage | number:'1.0-0' }}%</h3>
              <p class="text-xs text-slate-500">Logrado: {{ kpis[0]?.value }}</p>
            </div>
            <div class="relative w-24 h-24 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" stroke-width="8" fill="none"></circle>
                <circle cx="48" cy="48" r="40" stroke="#8b5cf6" stroke-width="8" fill="none"
                        stroke-linecap="round"
                        [style.stroke-dasharray]="251"
                        [style.stroke-dashoffset]="251 - (251 * goalPercentage) / 100"
                        class="transition-all duration-1000 ease-out"></circle>
              </svg>
              <span class="absolute text-xl font-bold">🎯</span>
            </div>
          </div>

          <!-- Sales Velocity -->
          <div class="glass-card p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
            <div class="flex justify-between items-start mb-2">
              <p class="text-indigo-200 text-sm font-medium">Velocidad Ventas</p>
              <span class="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg">~ / hora</span>
            </div>
            <div class="flex items-baseline gap-1 mt-2">
              <h3 class="text-3xl font-bold text-white">{{ salesVelocity | number:'1.0-1' }}</h3>
              <span class="text-sm text-slate-400">transacc.</span>
            </div>
            <div class="mt-4 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full animate-pulse" style="width: 75%"></div>
            </div>
          </div>

          <!-- Ticket Average -->
          <div class="glass-card p-6 rounded-3xl relative overflow-hidden">
             <div class="relative z-10">
              <p class="text-slate-400 text-sm font-medium mb-1">Ticket Promedio</p>
              <h3 class="text-3xl font-bold text-white mb-2">{{ kpis[2]?.value }}</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  🔥 {{ kpis[1]?.value }} Txs
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Chart Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Sales Trend Chart (PrimeNG) -->
          <div class="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/5 relative">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <span class="w-1 h-6 bg-violet-500 rounded-full"></span>
                Tendencia de Ventas
              </h3>
            </div>
            
            <div class="h-80 w-full" *ngIf="chartData">
                <p-chart type="line" [data]="chartData" [options]="chartOptions" height="100%"></p-chart>
            </div>
          </div>

          <!-- Top Products List -->
          <div class="glass-card rounded-3xl p-6 border border-white/5 flex flex-col h-full">
            <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
              <span class="w-1 h-6 bg-emerald-500 rounded-full"></span>
              Top Productos
            </h3>
            <div class="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              <div *ngFor="let p of topProducts; let i = index" 
                   class="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group cursor-default">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner"
                     [ngClass]="i === 0 ? 'bg-amber-400 text-amber-900' : 'bg-slate-700 text-slate-400'">
                  {{ i + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate text-slate-200 group-hover:text-white transition-colors">{{ p.productName || p.nombre }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="(p.totalRevenue || p.total / maxProductSales) * 100"></div>
                    </div>
                    <span class="text-[10px] text-slate-400">{{ p.totalQuantity || p.cantidad }} un.</span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-emerald-400">\${{ (p.totalRevenue || p.total) | number:'1.0-0' }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Payment Methods & Customers -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Payment Methods -->
          <div class="glass-card rounded-3xl p-6">
            <h3 class="font-bold text-lg mb-6">Medios de Pago</h3>
            <div class="flex items-center justify-center h-64">
                <p-chart type="doughnut" [data]="paymentChartData" [options]="paymentChartOptions" height="100%"></p-chart>
            </div>
          </div>
          
           <!-- Best Customers -->
           <div class="glass-card rounded-3xl p-6 flex flex-col h-full">
            <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
              <span class="w-1 h-6 bg-amber-500 rounded-full"></span>
              Clientes VIP
            </h3>
            <div class="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              <div *ngFor="let c of customerMetrics; let i = index" 
                   class="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-xs font-bold shadow-lg">
                    {{ (c.customerName || 'A')[0] }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white truncate max-w-[120px]">{{ c.customerName || 'Anónimo' }}</p>
                    <p class="text-[10px] text-slate-400">{{ c.transactionCount }} órdenes</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-amber-400">\${{ c.totalSpent | number:'1.0-0' }}</p>
                  <p class="text-[10px] text-slate-500">Ticket: \${{ c.averageTicket | number:'1.0-0' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Branch Performance -->
          <div class="glass-card rounded-3xl p-6">
             <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-lg">Sucursales</h3>
            </div>
            
            <div class="space-y-4">
              <div *ngFor="let branch of salesByBranch" class="relative group">
                <div class="flex justify-between items-end mb-2 relative z-10">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg border border-white/5 group-hover:border-violet-500/50 transition-colors">
                      🏢
                    </div>
                    <div>
                      <p class="font-medium text-white">{{ branch.sucursalNombre }}</p>
                      <p class="text-xs text-slate-400">{{ branch.transacciones }} Txs</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-violet-300">\${{ branch.ventas | number }}</p>
                    <p class="text-[10px] text-slate-500">{{ branch.porcentaje | number:'1.0-0' }}% Contribución</p>
                  </div>
                </div>
                <!-- Progress Bar -->
                <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                         [style.width.%]="branch.porcentaje"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      <!-- Styles for Glassmorphism & Custom Scrollbar -->
      <style>
        .glass-header {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
        }
        .glass-card {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        :host ::ng-deep .p-chart canvas {
            max-width: 100%;
        }
      </style>
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

  // Data Models
  kpis: any[] = [];
  topProducts: any[] = [];
  salesByBranch: any[] = [];
  customerMetrics: any[] = [];

  // Charts
  chartData: any;
  chartOptions: any;
  paymentChartData: any;
  paymentChartOptions: any;

  // Scales
  maxProductSales = 1;

  // Premium Metrics
  goalPercentage = 0;
  salesVelocity = 0;
  monthlyGoal = 5000000;

  ngOnInit() {
    this.initChartOptions();
    this.loadMetrics();
  }

  selectRange(rangeId: string) {
    this.selectedRange = rangeId;
    this.loadMetrics();
  }

  loadMetrics() {
    const now = new Date();
    // End date is EOD
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0); // Default to today start

    if (this.selectedRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (this.selectedRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (this.selectedRange === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // 1. Fetch Sales Trend (New Endpoint)
    this.salesService.getSalesTrend(startStr, endStr).subscribe({
      next: (data) => {
        this.updateSalesChart(data);
      },
      error: (e) => console.error('Error fetching trends', e)
    });

    // 2. Fetch Top Products (New Endpoint)
    this.salesService.getTopProducts(startStr, endStr, 5).subscribe({
      next: (data) => {
        this.topProducts = data;
        this.maxProductSales = Math.max(...data.map((p: any) => p.totalRevenue), 1);
      },
      error: (e) => console.error('Error fetching top products', e)
    });

    // 3. Fetch Customer Metrics (New Endpoint)
    this.salesService.getCustomerMetrics(startStr, endStr, 5).subscribe({
      next: (data) => {
        this.customerMetrics = data;
      },
      error: (e) => console.error('Error fetching customers', e)
    });

    // 4. Fetch KPI Summary (Existing endpoints for aggregate)
    const dStart = startDate.toISOString().split('T')[0];
    const dEnd = endDate.toISOString().split('T')[0];

    // If 'today', use getDailyStats for accuracy including headers
    if (this.selectedRange === 'today') {
      this.salesService.getDailyStats(dStart).subscribe({
        next: (stats) => this.processDailyStats([stats]),
        error: (e) => console.error(e)
      });
    } else {
      this.salesService.getStatsRange(dStart, dEnd).subscribe({
        next: (stats) => this.processDailyStats(stats),
        error: (e) => console.error(e)
      });
    }
  }

  exportToPdf() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Ventas', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString()} - Rango: ${this.selectedRange}`, 14, 30);

    // KPIs Table
    const kpiData = this.kpis.map(k => [k.label, k.value]);
    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: kpiData,
      startY: 40,
      theme: 'grid'
    });

    // Top Products Table
    const productData = this.topProducts.map(p => [
      p.productName || p.nombre,
      p.totalQuantity || p.cantidad,
      '$' + (p.totalRevenue || p.total)
    ]);

    autoTable(doc, {
      head: [['Producto', 'Cantidad', 'Ventas']],
      body: productData,
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'striped'
    });

    doc.save('reporte_ventas.pdf');
  }

  exportToCsv() {
    let csv = 'Reporte de Ventas Detallado\n';
    csv += `Rango,${this.selectedRange}\n\n`;

    csv += 'KPIs\n';
    this.kpis.forEach(k => csv += `${k.label},"${k.value}"\n`);

    csv += '\nTop Productos\nProducto,Cantidad,Ventas\n';
    this.topProducts.forEach(p => {
      csv += `"${p.productName || p.nombre}",${p.totalQuantity || p.cantidad},${p.totalRevenue || p.total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'reporte_ventas.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private processDailyStats(statsList: DailyStats[]) {
    // Defines existing aggregation logic
    let totalSales = 0;
    let totalTransactions = 0;

    // Payment methods aggregation
    const pmMap = new Map<string, number>();

    // Branch aggregation
    const branchMap = new Map<string, { name: string, sales: number, count: number }>();

    statsList.forEach(s => {
      totalSales += s.totalVentas;
      totalTransactions += s.totalTransacciones;

      s.ventasPorMetodoPago?.forEach(pm => {
        pmMap.set(pm.metodoPago, (pmMap.get(pm.metodoPago) || 0) + pm.total);
      });

      s.ventasPorSucursal?.forEach(b => {
        const key = b.sucursalId;
        const existing = branchMap.get(key) || { name: b.sucursalNombre || 'Sucursal', sales: 0, count: 0 };
        existing.sales += b.ventas;
        existing.count += b.transacciones;
        branchMap.set(key, existing);
      });
    });

    // Update KPIs
    const ticketPromedio = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    this.kpis = [
      { label: 'Ventas Totales', value: this.formatCurrency(totalSales) },
      { label: 'Transacciones', value: totalTransactions.toString() },
      { label: 'Ticket Promedio', value: this.formatCurrency(ticketPromedio) }
    ];

    // Update Sales Velocity
    // Estimate hours based on range
    let hours = 24;
    if (this.selectedRange === 'today') hours = Math.max(new Date().getHours() - 8, 1);
    else if (this.selectedRange === 'week') hours = 7 * 12; // approx 12h open per day
    else if (this.selectedRange === 'month') hours = 30 * 12;

    this.salesVelocity = totalTransactions / hours;
    this.goalPercentage = Math.min((totalSales / this.monthlyGoal) * 100, 100);

    // Update Payment Chart
    this.updatePaymentChart(pmMap, totalSales);

    // Update Branch List
    this.salesByBranch = Array.from(branchMap.values()).map(b => ({
      sucursalNombre: b.name,
      ventas: b.sales,
      transacciones: b.count,
      porcentaje: totalSales > 0 ? (b.sales / totalSales) * 100 : 0
    })).sort((a, b) => b.ventas - a.ventas);
  }

  private updateSalesChart(trends: any[]) {
    const labels = trends.map(t => {
      // Format date dd/MM
      const d = new Date(t.period);
      return d.getDate() + '/' + (d.getMonth() + 1);
    });
    const data = trends.map(t => t.totalSales);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Ventas',
          data: data,
          fill: true,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4
        }
      ]
    };
  }

  private updatePaymentChart(pmMap: Map<string, number>, total: number) {
    const labels = Array.from(pmMap.keys());
    const data = Array.from(pmMap.values());
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

    this.paymentChartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 0
        }
      ]
    };
  }

  private initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = '#94a3b8';
    const textColorSecondary = '#64748b';
    const surfaceBorder = 'rgba(255,255,255,0.05)';

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            callback: (value: any) => '$' + value
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };

    this.paymentChartOptions = {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            color: textColor
          },
          position: 'right'
        }
      },
      cutout: '60%'
    };
  }

  formatCurrency(val: number) {
    return '$' + (val || 0).toLocaleString('es-CL');
  }
}
