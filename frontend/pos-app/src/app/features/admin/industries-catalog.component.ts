import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Industry {
  id?: string;
  code: string;
  name: string;
  icon: string;
  description?: string;
  active: boolean;
  color: string;
}

const ICON_CATEGORIES = [
  { name: 'Comercio', icons: ['🛒', '🛍️', '💳', '🏪', '🏬', '🛋️', '👕', '👟', '💎', '🎁'] },
  { name: 'Alimentación', icons: ['🥖', '🍕', '🍰', '☕', '🧀', '🍺', '🍷', '🥩', '🥗', '🍣'] },
  { name: 'Servicios', icons: ['🔧', '💇', '🚗', '🧹', '✂️', '🔑', '📸', '🎨', '🖨️', '👔'] },
  { name: 'Salud', icons: ['💊', '🏥', '🩺', '💉', '🧬', '🦷', '👁️', '🏋️', '💆', '🧘'] },
  { name: 'Educación', icons: ['🎓', '📚', '✏️', '🎹', '🎨', '💻', '🔬', '🌍', '🧮', '📐'] },
  { name: 'Tecnología', icons: ['💻', '📱', '🖥️', '🎮', '🔌', '📡', '🔋', '💾', '🖱️', '⌨️'] },
  { name: 'Naturaleza', icons: ['🌸', '🌿', '🐕', '🐈', '🐠', '🌺', '🌴', '🍀', '🌻', '🌳'] },
  { name: 'Otros', icons: ['🏨', '✈️', '🚀', '🎪', '🎭', '🎬', '📰', '⚖️', '🏛️', '🏗️'] }
];

const DEFAULT_INDUSTRIES: Industry[] = [
  { code: 'RETAIL', name: 'Retail', icon: '🛒', description: 'Tiendas y comercio minorista', active: true, color: '#6366f1' },
  { code: 'PANADERIA', name: 'Panadería', icon: '🥖', description: 'Panaderías y pastelerías', active: true, color: '#f59e0b' },
  { code: 'RESTAURANTE', name: 'Restaurante', icon: '🍕', description: 'Restaurantes y cafeterías', active: true, color: '#ef4444' },
  { code: 'EDUCACION', name: 'Educación', icon: '🎓', description: 'Cursos y academias', active: true, color: '#3b82f6' },
  { code: 'EDITORIAL', name: 'Editorial', icon: '📚', description: 'Librerías y editoriales', active: true, color: '#8b5cf6' },
  { code: 'FARMACIA', name: 'Farmacia', icon: '💊', description: 'Farmacias y droguerías', active: true, color: '#10b981' },
  { code: 'SERVICIOS', name: 'Servicios', icon: '🔧', description: 'Servicios profesionales', active: true, color: '#6b7280' },
  { code: 'CAFETERIA', name: 'Cafetería', icon: '☕', description: 'Cafeterías y coffee shops', active: true, color: '#78350f' },
  { code: 'PELUQUERIA', name: 'Peluquería', icon: '💇', description: 'Salones de belleza', active: true, color: '#ec4899' },
  { code: 'VETERINARIA', name: 'Veterinaria', icon: '🐕', description: 'Clínicas veterinarias', active: true, color: '#22c55e' },
  { code: 'AUTOMOTRIZ', name: 'Automotriz', icon: '🚗', description: 'Talleres y autopartes', active: true, color: '#dc2626' },
  { code: 'TECNOLOGIA', name: 'Tecnología', icon: '💻', description: 'Hardware y software', active: true, color: '#0ea5e9' },
  { code: 'FLORERIA', name: 'Florería', icon: '🌸', description: 'Florerías y jardines', active: true, color: '#f472b6' },
  { code: 'GIMNASIO', name: 'Gimnasio', icon: '🏋️', description: 'Centros fitness', active: true, color: '#7c3aed' },
  { code: 'HOTEL', name: 'Hotelería', icon: '🏨', description: 'Hoteles y hospedaje', active: true, color: '#0891b2' },
  { code: 'SPA', name: 'Spa & Wellness', icon: '💆', description: 'Spas y centros de relajación', active: true, color: '#a855f7' }
];

@Component({
  selector: 'app-industries-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="industries-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/admin/dashboard" class="back-link">← Dashboard</a>
          <h1>🏪 Catálogo de Industrias</h1>
          <p class="subtitle">{{ industries().length }} tipos de negocio disponibles</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <span>➕</span> Nueva Industria
        </button>
      </header>

      <!-- Search & Filters -->
      <div class="filters-bar">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          placeholder="🔍 Buscar industria..."
          class="search-input">
        <div class="filter-buttons">
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'all'"
            (click)="activeFilter = 'all'">
            Todas
          </button>
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'active'"
            (click)="activeFilter = 'active'">
            ✅ Activas
          </button>
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'inactive'"
            (click)="activeFilter = 'inactive'">
            ⏸️ Inactivas
          </button>
        </div>
      </div>

      <!-- Industries Grid -->
      <div class="industries-grid">
        @for (industry of filteredIndustries(); track industry.code; let i = $index) {
          <div 
            class="industry-card" 
            [class.inactive]="!industry.active"
            [style.--delay]="i * 30 + 'ms'"
            [style.--accent]="industry.color">
            
            <!-- Card Header -->
            <div class="card-gradient"></div>
            <div class="card-content">
              <div class="card-header">
                <span class="industry-icon">{{ industry.icon }}</span>
                <div class="card-actions">
                  <button class="btn-icon" (click)="openModal(industry)" title="Editar">✏️</button>
                  <button class="btn-icon" (click)="toggleActive(industry)" [title]="industry.active ? 'Desactivar' : 'Activar'">
                    {{ industry.active ? '🔴' : '🟢' }}
                  </button>
                </div>
              </div>
              
              <h3>{{ industry.name }}</h3>
              <span class="industry-code">{{ industry.code }}</span>
              @if (industry.description) {
                <p class="industry-desc">{{ industry.description }}</p>
              }
              
              <div class="card-footer">
                <span class="status-badge" [class.active]="industry.active">
                  {{ industry.active ? '✓ Activa' : '⏸ Inactiva' }}
                </span>
              </div>
            </div>
          </div>
        }

        <!-- Add New Card -->
        <div class="industry-card add-new" (click)="openModal()">
          <div class="add-content">
            <span class="add-icon">➕</span>
            <span class="add-text">Agregar industria</span>
          </div>
        </div>
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingIndustry() ? '✏️ Editar' : '➕ Nueva' }} Industria</h2>
              <button class="btn-close" (click)="closeModal()">×</button>
            </div>

            <form (ngSubmit)="saveIndustry()" class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Código *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="formData.code" 
                    name="code"
                    placeholder="RETAIL"
                    [disabled]="!!editingIndustry()"
                    required>
                </div>
                <div class="form-group">
                  <label>Nombre *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="formData.name" 
                    name="name"
                    placeholder="Retail / Comercio"
                    required>
                </div>
              </div>

              <div class="form-group">
                <label>Descripción</label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.description" 
                  name="description"
                  placeholder="Breve descripción del tipo de negocio">
              </div>

              <div class="form-group">
                <label>Color</label>
                <div class="color-picker">
                  @for (color of availableColors; track color) {
                    <button 
                      type="button" 
                      class="color-option"
                      [style.background]="color"
                      [class.selected]="formData.color === color"
                      (click)="formData.color = color">
                    </button>
                  }
                </div>
              </div>

              <div class="form-group">
                <label>Icono</label>
                <div class="icon-picker">
                  @for (category of iconCategories; track category.name) {
                    <div class="icon-category">
                      <span class="category-name">{{ category.name }}</span>
                      <div class="icon-grid">
                        @for (icon of category.icons; track icon) {
                          <button 
                            type="button" 
                            class="icon-option"
                            [class.selected]="formData.icon === icon"
                            (click)="formData.icon = icon">
                            {{ icon }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="!formData.code || !formData.name">
                  💾 Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a1a 0%, #12122a 50%, #1a1a3a 100%);
      color: white;
    }

    .industries-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-left { display: flex; flex-direction: column; gap: 0.5rem; }
    .back-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.85rem; }
    .back-link:hover { color: white; }
    
    h1 { 
      margin: 0; 
      font-size: 1.75rem;
      background: linear-gradient(90deg, #fff, #f0abfc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: rgba(255,255,255,0.5); margin: 0; }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(236,72,153,0.4); }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 0.875rem 1.25rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
    }
    .search-input:focus { outline: none; border-color: #ec4899; }
    .search-input::placeholder { color: rgba(255,255,255,0.3); }

    .filter-buttons { display: flex; gap: 0.5rem; }
    .filter-btn {
      padding: 0.75rem 1.25rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { background: rgba(255,255,255,0.08); }
    .filter-btn.active { 
      background: rgba(236,72,153,0.2); 
      border-color: rgba(236,72,153,0.5); 
      color: #f0abfc; 
    }

    /* Grid */
    .industries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }

    /* Card */
    .industry-card {
      position: relative;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s;
      animation: fadeIn 0.4s ease forwards;
      animation-delay: var(--delay);
      opacity: 0;
    }
    @keyframes fadeIn { to { opacity: 1; } }

    .industry-card:hover {
      transform: translateY(-4px);
      border-color: var(--accent, rgba(255,255,255,0.2));
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    .industry-card.inactive { opacity: 0.6; }

    .card-gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--accent, #6366f1);
    }

    .card-content { padding: 1.5rem; }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .industry-icon {
      font-size: 3rem;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
    }

    .card-actions { display: flex; gap: 0.5rem; }
    .btn-icon {
      width: 32px; height: 32px;
      border: none; border-radius: 8px;
      background: rgba(255,255,255,0.05);
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-icon:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }

    h3 { margin: 0 0 0.25rem; font-size: 1.2rem; }
    .industry-code { 
      font-size: 0.75rem; 
      color: rgba(255,255,255,0.4); 
      font-family: monospace;
      background: rgba(255,255,255,0.05);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .industry-desc { 
      font-size: 0.85rem; 
      color: rgba(255,255,255,0.6); 
      margin: 0.75rem 0 0;
      line-height: 1.4;
    }

    .card-footer { margin-top: 1rem; }
    .status-badge {
      display: inline-block;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-badge.active { background: rgba(16,185,129,0.2); color: #34d399; }
    .status-badge:not(.active) { background: rgba(239,68,68,0.2); color: #f87171; }

    /* Add New Card */
    .add-new {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      border: 2px dashed rgba(255,255,255,0.1);
      cursor: pointer;
      background: transparent;
    }
    .add-new:hover { 
      border-color: rgba(236,72,153,0.5); 
      background: rgba(236,72,153,0.05);
    }
    .add-content { text-align: center; }
    .add-icon { display: block; font-size: 2.5rem; margin-bottom: 0.5rem; }
    .add-text { color: rgba(255,255,255,0.5); }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .modal-header h2 { margin: 0; font-size: 1.25rem; }
    .btn-close { 
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.05);
      border: none; border-radius: 8px;
      color: white; font-size: 1.5rem;
      cursor: pointer;
    }

    .modal-body { padding: 1.5rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { 
      display: block; 
      margin-bottom: 0.5rem; 
      font-size: 0.9rem; 
      color: rgba(255,255,255,0.7); 
    }
    .form-group input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: white;
      font-size: 1rem;
    }
    .form-group input:focus { outline: none; border-color: #ec4899; }
    .form-group input:disabled { opacity: 0.5; }

    .color-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .color-option {
      width: 36px; height: 36px;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .color-option:hover { transform: scale(1.1); }
    .color-option.selected { border-color: white; box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }

    .icon-picker {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1rem;
      background: rgba(0,0,0,0.2);
    }
    .icon-category { margin-bottom: 1rem; }
    .icon-category:last-child { margin-bottom: 0; }
    .category-name { 
      display: block;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
      margin-bottom: 0.5rem;
    }
    .icon-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .icon-option {
      width: 44px; height: 44px;
      background: rgba(255,255,255,0.05);
      border: 2px solid transparent;
      border-radius: 10px;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .icon-option:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
    .icon-option.selected { border-color: #ec4899; background: rgba(236,72,153,0.2); }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .btn-secondary {
      padding: 0.875rem 1.5rem;
      background: rgba(255,255,255,0.1);
      border: none; border-radius: 10px;
      color: white; cursor: pointer;
    }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
      .industries-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class IndustriesCatalogComponent implements OnInit {
  industries = signal<Industry[]>([]);
  showModal = signal(false);
  editingIndustry = signal<Industry | null>(null);
  searchTerm = '';
  activeFilter: 'all' | 'active' | 'inactive' = 'all';

  iconCategories = ICON_CATEGORIES;
  availableColors = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6b7280'
  ];

  formData: Partial<Industry> = {
    code: '',
    name: '',
    icon: '🛒',
    description: '',
    color: '#6366f1',
    active: true
  };

  filteredIndustries = computed(() => {
    let result = this.industries();

    // Filter by status
    if (this.activeFilter === 'active') {
      result = result.filter(i => i.active);
    } else if (this.activeFilter === 'inactive') {
      result = result.filter(i => !i.active);
    }

    // Filter by search
    const search = this.searchTerm.toLowerCase();
    if (search) {
      result = result.filter(i =>
        i.name.toLowerCase().includes(search) ||
        i.code.toLowerCase().includes(search)
      );
    }

    return result;
  });

  ngOnInit() {
    this.loadIndustries();
  }

  loadIndustries() {
    const stored = localStorage.getItem('industries_catalog');
    if (stored) {
      this.industries.set(JSON.parse(stored));
    } else {
      this.industries.set(DEFAULT_INDUSTRIES);
      this.saveToStorage();
    }
  }

  saveToStorage() {
    localStorage.setItem('industries_catalog', JSON.stringify(this.industries()));
  }

  openModal(industry?: Industry) {
    if (industry) {
      this.editingIndustry.set(industry);
      this.formData = { ...industry };
    } else {
      this.editingIndustry.set(null);
      this.formData = { code: '', name: '', icon: '🛒', description: '', color: '#6366f1', active: true };
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingIndustry.set(null);
  }

  saveIndustry() {
    if (this.editingIndustry()) {
      this.industries.update(list =>
        list.map(i => i.code === this.formData.code ? { ...i, ...this.formData } as Industry : i)
      );
    } else {
      this.industries.update(list => [...list, { ...this.formData, active: true } as Industry]);
    }
    this.saveToStorage();
    this.closeModal();
  }

  toggleActive(industry: Industry) {
    this.industries.update(list =>
      list.map(i => i.code === industry.code ? { ...i, active: !i.active } : i)
    );
    this.saveToStorage();
  }
}
