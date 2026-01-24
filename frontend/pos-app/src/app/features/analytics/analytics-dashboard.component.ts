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
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        
        <!-- Hero Metrics Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          <!-- Total Sales Card with Sparkline -->
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
              <!-- Simulated Sparkline -->
              <div class="h-10 w-full flex items-end gap-1 opacity-50">
                <div *ngFor="let h of hourlySales.slice(-10)" 
                     class="flex-1 bg-violet-500 rounded-t-sm transition-all duration-500"
                     [style.height.%]="getBarHeight(h.ventas)"></div>
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
              <h3 class="text-3xl font-bold text-white">{{ salesVelocity | number:'1.0-0' }}</h3>
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
          
          <!-- Sales Trend Area Chart -->
          <div class="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/5 relative">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <span class="w-1 h-6 bg-violet-500 rounded-full"></span>
                Tendencia de Ventas
              </h3>
              <div class="flex gap-2">
                <span class="w-3 h-3 rounded-full bg-violet-500"></span>
                <span class="text-xs text-slate-400">Ventas ($)</span>
              </div>
            </div>
            
            <!-- SVG Chart Container -->
            <div class="relative h-64 w-full group">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" class="w-full h-full overflow-visible">
                <!-- Grid Lines -->
                <line x1="0" y1="10" x2="100" y2="10" stroke="#334155" stroke-width="0.1" stroke-dasharray="2"/>
                <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" stroke-width="0.1" stroke-dasharray="2"/>
                <line x1="0" y1="40" x2="100" y2="40" stroke="#334155" stroke-width="0.1" stroke-dasharray="2"/>
                
                <!-- Area Path with Gradient -->
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path [attr.d]="salesChartPath" fill="url(#chartGradient)" stroke="none" class="transition-all duration-700 ease-out"/>
                <path [attr.d]="salesLinePath" fill="none" stroke="#8b5cf6" stroke-width="0.8" vector-effect="non-scaling-stroke" 
                      class="drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-700 ease-out"/>
                
                <!-- Hover Points (Generated dynamically) -->
                <circle *ngFor="let p of chartPoints" [attr.cx]="p.x" [attr.cy]="p.y" r="1.5" 
                        class="fill-violet-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:r-3 cursor-pointer" />
              </svg>
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
                  <p class="text-sm font-medium truncate text-slate-200 group-hover:text-white transition-colors">{{ p.nombre }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="(p.total / maxProductSales) * 100"></div>
                    </div>
                    <span class="text-[10px] text-slate-400">{{ p.cantidad }} un.</span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-emerald-400">\${{ p.total | number:'1.0-0' }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Payment Methods & Branches -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Payment Methods Donut -->
          <div class="glass-card rounded-3xl p-6">
            <h3 class="font-bold text-lg mb-6">Medios de Pago</h3>
            <div class="flex flex-col md:flex-row items-center gap-8">
              <!-- Custom CSS Donut -->
              <div class="relative w-48 h-48 rounded-full"
                   [style.background]="paymentMethodsGradient">
                <div class="absolute inset-4 bg-[#131b31] rounded-full flex flex-col items-center justify-center">
                  <span class="text-xs text-slate-400">Total</span>
                  <span class="text-xl font-bold text-white">{{ kpis[0]?.value }}</span>
                </div>
              </div>
              
              <!-- Legend -->
              <div class="flex-1 space-y-3 w-full">
                <div *ngFor="let pm of paymentMethods" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" [style.color]="pm.color" [style.background-color]="pm.color"></span>
                    <span class="text-sm text-slate-300">{{ pm.metodoPago }}</span>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold">\${{ pm.total | number:'1.0-0' }}</p>
                    <p class="text-[10px] text-slate-500">{{ pm.porcentaje | number:'1.0-0' }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Branch Performance -->
          <div class="glass-card rounded-3xl p-6">
             <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-lg">Sucursales</h3>
              <button class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                ↗
              </button>
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

  kpis: any[] = [];
  topProducts: any[] = [];
  salesByBranch: any[] = [];
  hourlySales: HourlySales[] = [];
  paymentMethods: any[] = [];

  // Premium Chart Data
  salesChartPath = '';
  salesLinePath = '';
  chartPoints: any[] = [];
  maxProductSales = 1;
  paymentMethodsGradient = '';

  // New Metrics
  goalPercentage = 0;
  salesVelocity = 0;
  monthlyGoal = 5000000; // Example static goal

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
        next: (stats) => this.processData(stats),
        error: (err) => console.error(err)
      });
    } else {
      this.salesService.getStatsRange(startDate, endDate).subscribe({
        next: (statsList) => this.processData(this.aggregateStats(statsList)),
        error: (err) => console.error(err)
      });
    }
  }

  private processData(stats: DailyStats) {
    this.updateKPIs(stats);
    this.updateCharts(stats);
    this.generateSalesChart(stats);
    this.calculateNewMetrics(stats);
    this.generatePaymentChart(stats);
  }

  private aggregateStats(statsList: DailyStats[]): DailyStats {
    // Basic aggregation
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

    const productMap = new Map();
    const hourMap = new Map();
    const branchMap = new Map();
    const paymentMap = new Map();

    statsList.forEach(stat => {
      agg.totalVentas += stat.totalVentas;
      agg.totalTransacciones += stat.totalTransacciones;
      agg.ventasAprobadas += stat.ventasAprobadas;

      // Aggregate lists logic simplified for brevity
      stat.topProductos?.forEach(p => {
        const key = p.sku || p.nombre;
        const curr = productMap.get(key) || { ...p, cantidad: 0, total: 0 };
        curr.cantidad += p.cantidad;
        curr.total += p.total;
        productMap.set(key, curr);
      });

      stat.ventasPorHora?.forEach(h => {
        const current = hourMap.get(h.hora) || 0;
        hourMap.set(h.hora, current + h.total);
      });

      stat.ventasPorSucursal?.forEach(b => {
        const key = b.sucursalId;
        const curr = branchMap.get(key) || { ...b, ventas: 0, transacciones: 0 };
        curr.ventas += b.ventas;
        curr.transacciones += b.transacciones;
        branchMap.set(key, curr);
      });

      stat.ventasPorMetodoPago?.forEach(p => {
        const key = p.metodoPago;
        const curr = paymentMap.get(key) || { ...p, total: 0 };
        curr.total += p.total;
        paymentMap.set(key, curr);
      });
    });

    agg.ticketPromedio = agg.totalTransacciones ? agg.totalVentas / agg.totalTransacciones : 0;
    agg.topProductos = Array.from(productMap.values()).sort((a: any, b: any) => b.total - a.total).slice(0, 10);
    agg.ventasPorHora = Array.from(hourMap.entries()).map(([hora, total]) => ({ hora, total } as any)).sort((a: any, b: any) => a.hora - b.hora);
    agg.ventasPorSucursal = Array.from(branchMap.values()).map((b: any) => ({ ...b, porcentaje: (b.ventas / agg.totalVentas) * 100 }));
    agg.ventasPorMetodoPago = Array.from(paymentMap.values()).map((p: any) => ({ ...p, porcentaje: (p.total / agg.totalVentas) * 100 }));

    return agg;
  }

  private updateKPIs(stats: DailyStats) {
    this.kpis = [
      { label: 'Ventas Totales', value: this.formatCurrency(stats.totalVentas) },
      { label: 'Transacciones', value: stats.totalTransacciones },
      { label: 'Ticket Promedio', value: this.formatCurrency(stats.ticketPromedio) },
    ];
  }

  private updateCharts(stats: DailyStats) {
    this.topProducts = stats.topProductos || [];
    this.maxProductSales = Math.max(...this.topProducts.map(p => p.total), 1);

    this.hourlySales = (stats.ventasPorHora || []).map(h => ({
      hora: h.hora,
      ventas: h.total
    }));

    this.salesByBranch = stats.ventasPorSucursal || [];
    this.paymentMethods = (stats.ventasPorMetodoPago || []).map((pm, i) => ({
      ...pm,
      color: this.getPmColor(i)
    }));
  }

  // --- Premium Visual Logic ---

  private generateSalesChart(stats: DailyStats) {
    const data = stats.ventasPorHora?.sort((a, b) => a.hora - b.hora) || [];
    if (data.length < 2) {
      this.salesChartPath = '';
      this.salesLinePath = '';
      return;
    }

    const maxVal = Math.max(...data.map(d => d.total)) * 1.1; // 10% buffering
    const width = 100;
    const height = 50;
    const points: { x: number, y: number, val: number }[] = [];

    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d.total / maxVal) * height;
      points.push({ x, y, val: d.total });
    });

    this.chartPoints = points;

    // Catmull-Rom like smooth curve (simplified)
    let pathCommands = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      // simple line for stability, can use bezier for smoother look
      pathCommands += ` L ${p1.x},${p1.y}`;
    }

    this.salesLinePath = pathCommands;
    this.salesChartPath = `${pathCommands} L ${width},${height} L 0,${height} Z`;
  }

  private generatePaymentChart(stats: DailyStats) {
    if (!this.paymentMethods.length) return;

    // CSS Conic Gradient string generator
    let gradientStr = 'conic-gradient(';
    let currentDeg = 0;

    this.paymentMethods.forEach((pm, i) => {
      const deg = (pm.porcentaje / 100) * 360;
      gradientStr += `${pm.color} ${currentDeg}deg ${currentDeg + deg}deg,`;
      currentDeg += deg;
    });

    gradientStr = gradientStr.slice(0, -1) + ')';
    this.paymentMethodsGradient = gradientStr;
  }

  private calculateNewMetrics(stats: DailyStats) {
    // Goal progress
    this.goalPercentage = Math.min((stats.totalVentas / this.monthlyGoal) * 100, 100);

    // Sales Velocity (Sales / Hours open)
    // Assuming 12h day for estimation
    const hours = new Date().getHours() - 8; // shops usually open at 8-9
    const activeHours = Math.max(hours, 1);
    this.salesVelocity = stats.totalTransacciones / activeHours;
  }

  // Helpers
  getBarHeight(val: number) {
    const max = Math.max(...this.hourlySales.map(h => h.ventas));
    return (val / max) * 100;
  }

  formatCurrency(val: number) {
    return '$' + (val || 0).toLocaleString('es-CL');
  }

  getPmColor(index: number) {
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    return colors[index % colors.length];
  }
}
