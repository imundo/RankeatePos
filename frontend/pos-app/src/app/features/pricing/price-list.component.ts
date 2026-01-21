import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PriceListService } from '../../core/services/price-list.service';

interface PriceList {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: 'general' | 'sucursal' | 'cliente' | 'temporal';
  sucursalId?: string;
  sucursalNombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activa: boolean;
  productCount: number;
  createdAt: string;
}

interface PriceListProduct {
  id: string;
  productoId: string;
  nombre: string;
  sku: string;
  precioBase: number;
  precioLista: number;
  descuento?: number;
}

@Component({
  selector: 'app-price-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <!-- Header -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25">
                💰
              </div>
              <div>
                <h1 class="text-2xl font-bold text-slate-800">Listas de Precios</h1>
                <p class="text-slate-500 text-sm">Gestiona precios diferenciados por sucursal, cliente o temporada</p>
              </div>
            </div>
            <button (click)="openCreateModal()" 
                    class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nueva Lista
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div *ngFor="let stat of stats" 
               class="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                   [style.background]="stat.bg">
                {{ stat.icon }}
              </div>
              <div>
                <p class="text-2xl font-bold text-slate-800">{{ stat.value }}</p>
                <p class="text-sm text-slate-500">{{ stat.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2 mb-6 p-1 bg-white rounded-xl border border-slate-200">
          <button *ngFor="let filter of filters"
                  (click)="activeFilter = filter.id"
                  class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  [class]="activeFilter === filter.id ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'">
            {{ filter.icon }} {{ filter.label }}
          </button>
        </div>

        <!-- Price Lists Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let list of filteredLists" 
               class="group bg-white rounded-2xl border border-slate-200/50 overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
            <!-- Card Header -->
            <div class="p-5 pb-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                       [class]="getTypeClass(list.tipo)">
                    {{ getTypeIcon(list.tipo) }}
                  </div>
                  <div>
                    <h3 class="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">{{ list.nombre }}</h3>
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full" [class]="getTypeBadgeClass(list.tipo)">
                      {{ getTypeLabel(list.tipo) }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full" [class]="list.activa ? 'bg-green-500' : 'bg-slate-300'"></span>
                  <span class="text-xs text-slate-500">{{ list.activa ? 'Activa' : 'Inactiva' }}</span>
                </div>
              </div>
              
              <p *ngIf="list.descripcion" class="text-sm text-slate-500 mb-4 line-clamp-2">{{ list.descripcion }}</p>
              
              <!-- Sucursal Badge -->
              <div *ngIf="list.sucursalNombre" class="flex items-center gap-2 mb-3">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <span class="text-sm text-slate-600">{{ list.sucursalNombre }}</span>
              </div>
              
              <!-- Date Range for Temporal -->
              <div *ngIf="list.tipo === 'temporal'" class="flex items-center gap-2 mb-3 text-sm text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>{{ list.fechaInicio }} - {{ list.fechaFin }}</span>
              </div>
              
              <!-- Product Count -->
              <div class="flex items-center gap-2 text-sm text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span>{{ list.productCount }} productos</span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <button class="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                Editar Precios →
              </button>
              <div class="flex gap-1">
                <button class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredLists.length === 0" class="col-span-full py-16 text-center">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              💰
            </div>
            <h3 class="text-lg font-medium text-slate-900">No hay listas de precios</h3>
            <p class="text-slate-500 mt-2">Crea tu primera lista para gestionar precios diferenciados</p>
          </div>
        </div>
      </main>

      <!-- Create Modal -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
          <div class="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h3 class="text-xl font-bold text-slate-800">Nueva Lista de Precios</h3>
            <p class="text-sm text-slate-500 mt-1">Define precios especiales para un grupo</p>
          </div>
          
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
              <input type="text" [(ngModel)]="newList.nombre" 
                     class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                     placeholder="Ej: Precios Sucursal Centro">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Lista</label>
              <div class="grid grid-cols-2 gap-3">
                <button *ngFor="let type of listTypes" 
                        (click)="setListType(type.id)"
                        class="p-4 rounded-xl border-2 text-left transition-all"
                        [class]="newList.tipo === type.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'">
                  <span class="text-xl">{{ type.icon }}</span>
                  <p class="font-medium text-slate-800 mt-1">{{ type.label }}</p>
                  <p class="text-xs text-slate-500">{{ type.desc }}</p>
                </button>
              </div>
            </div>
            
            <div *ngIf="newList.tipo === 'temporal'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Fecha Inicio</label>
                <input type="date" [(ngModel)]="newList.fechaInicio" 
                       class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Fecha Fin</label>
                <input type="date" [(ngModel)]="newList.fechaFin" 
                       class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Descripción (opcional)</label>
              <textarea [(ngModel)]="newList.descripcion" rows="2"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
                        placeholder="Descripción breve de esta lista"></textarea>
            </div>
          </div>
          
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button (click)="showModal = false" 
                    class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
              Cancelar
            </button>
            <button (click)="createList()" 
                    class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25">
              Crear Lista
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PriceListComponent implements OnInit {
  private priceListService = inject(PriceListService);

  showModal = false;
  activeFilter = 'all';

  stats = [
    { icon: '📋', label: 'Listas Activas', value: 0, bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
    { icon: '🏢', label: 'Por Sucursal', value: 0, bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
    { icon: '👥', label: 'Por Cliente', value: 0, bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' },
    { icon: '📅', label: 'Temporales', value: 0, bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' }
  ];

  filters = [
    { id: 'all', label: 'Todas', icon: '📋' },
    { id: 'sucursal', label: 'Por Sucursal', icon: '🏢' },
    { id: 'cliente', label: 'Por Cliente', icon: '👥' },
    { id: 'temporal', label: 'Temporales', icon: '📅' }
  ];

  listTypes = [
    { id: 'sucursal', icon: '🏢', label: 'Por Sucursal', desc: 'Precios específicos por local' },
    { id: 'cliente', icon: '👥', label: 'Por Cliente', desc: 'Precios para clientes VIP' },
    { id: 'temporal', icon: '📅', label: 'Temporal', desc: 'Ofertas por tiempo limitado' },
    { id: 'general', icon: '📋', label: 'General', desc: 'Lista de precios base' }
  ];

  priceLists: PriceList[] = [];

  newList: Partial<PriceList> & { tipo: string } = {
    nombre: '',
    tipo: 'sucursal',
    descripcion: ''
  };

  get filteredLists(): PriceList[] {
    if (this.activeFilter === 'all') return this.priceLists;
    return this.priceLists.filter(l => l.tipo === this.activeFilter);
  }

  ngOnInit() {
    this.loadLists();
  }

  loadLists() {
    this.priceListService.getAll().subscribe({
      next: (lists) => {
        // Map types if necessary or assume backend returns compatible strings
        this.priceLists = lists.map(l => ({
          ...l,
          // Ensure tipo is handled correctly for UI (lowercase for styling)
          tipo: (l.tipo?.toLowerCase() || 'general') as any
        }));
        this.updateStats();
      },
      error: (err) => console.error('Error loading price lists', err)
    });
  }

  updateStats() {
    const active = this.priceLists.filter(l => l.activa).length;
    const sucursal = this.priceLists.filter(l => l.tipo === 'sucursal').length;
    const cliente = this.priceLists.filter(l => l.tipo === 'cliente').length;
    const temporal = this.priceLists.filter(l => l.tipo === 'temporal').length;

    this.stats[0].value = active;
    this.stats[1].value = sucursal;
    this.stats[2].value = cliente;
    this.stats[3].value = temporal;
  }

  openCreateModal() {
    this.newList = { nombre: '', tipo: 'sucursal', descripcion: '' };
    this.showModal = true;
  }

  createList() {
    // Basic validation
    if (!this.newList.nombre) return;

    // Map to API request - simplified for now, assuming service handles DTO mapping or component matches
    const request = {
      ...this.newList,
      // Convert to uppercase for backend Enum
      tipo: (this.newList.tipo?.toUpperCase() || 'SUCURSAL') as any
    };

    this.priceListService.create(request as any).subscribe({
      next: (created) => {
        const mapped = {
          ...created,
          tipo: (created.tipo?.toLowerCase() || 'general') as any
        };
        this.priceLists.unshift(mapped);
        this.updateStats();
        this.showModal = false;
      },
      error: (err) => console.error('Error creating list', err)
    });
  }

  setListType(typeId: string) {
    this.newList.tipo = typeId as any;
  }

  getTypeClass(tipo: string): string {
    const classes: Record<string, string> = {
      'general': 'bg-slate-100 text-slate-600',
      'sucursal': 'bg-blue-100 text-blue-600',
      'cliente': 'bg-amber-100 text-amber-600',
      'temporal': 'bg-pink-100 text-pink-600'
    };
    return classes[tipo] || 'bg-slate-100';
  }

  getTypeBadgeClass(tipo: string): string {
    const classes: Record<string, string> = {
      'general': 'bg-slate-100 text-slate-700',
      'sucursal': 'bg-blue-100 text-blue-700',
      'cliente': 'bg-amber-100 text-amber-700',
      'temporal': 'bg-pink-100 text-pink-700'
    };
    return classes[tipo] || 'bg-slate-100 text-slate-700';
  }

  getTypeIcon(tipo: string): string {
    const icons: Record<string, string> = {
      'general': '📋',
      'sucursal': '🏢',
      'cliente': '👥',
      'temporal': '📅'
    };
    return icons[tipo] || '📋';
  }

  getTypeLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'general': 'General',
      'sucursal': 'Sucursal',
      'cliente': 'Cliente',
      'temporal': 'Temporal'
    };
    return labels[tipo] || tipo;
  }
}
