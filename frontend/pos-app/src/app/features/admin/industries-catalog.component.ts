import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Industry {
    id?: string;
    code: string;
    name: string;
    icon: string;
    description?: string;
    active: boolean;
}

const AVAILABLE_ICONS = ['🛒', '🥖', '🎓', '📚', '🍕', '💊', '🔧', '🏥', '🏨', '☕', '🍰', '🧀', '🍺', '🎮', '💇', '🚗', '🐕', '🌸', '👔', '🏋️'];

@Component({
    selector: 'app-industries-catalog',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="catalog-page">
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/admin/dashboard" class="back-link">← Dashboard</a>
          <h1>🏪 Catálogo de Industrias</h1>
          <p class="subtitle">Tipos de negocio disponibles en la plataforma</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          ➕ Nueva Industria
        </button>
      </header>

      <!-- Industries Grid -->
      <div class="industries-grid">
        @for (industry of industries(); track industry.code) {
          <div class="industry-card" [class.inactive]="!industry.active">
            <div class="card-header">
              <span class="icon">{{ industry.icon }}</span>
              <div class="card-actions">
                <button class="btn-icon" (click)="openModal(industry)" title="Editar">✏️</button>
                <button class="btn-icon danger" (click)="toggleActive(industry)" [title]="industry.active ? 'Desactivar' : 'Activar'">
                  {{ industry.active ? '🔴' : '🟢' }}
                </button>
              </div>
            </div>
            <h3>{{ industry.name }}</h3>
            <span class="code">{{ industry.code }}</span>
            @if (industry.description) {
              <p class="description">{{ industry.description }}</p>
            }
            <span class="status" [class.active]="industry.active">
              {{ industry.active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingIndustry() ? 'Editar' : 'Nueva' }} Industria</h2>
              <button class="btn-close" (click)="closeModal()">×</button>
            </div>

            <form (ngSubmit)="saveIndustry()" class="modal-body">
              <div class="form-group">
                <label>Código *</label>
                <input type="text" [(ngModel)]="formData.code" name="code" 
                       placeholder="RETAIL" required [disabled]="!!editingIndustry()">
              </div>

              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" [(ngModel)]="formData.name" name="name" 
                       placeholder="Retail / Comercio" required>
              </div>

              <div class="form-group">
                <label>Descripción</label>
                <textarea [(ngModel)]="formData.description" name="description" 
                          placeholder="Tiendas minoristas, supermercados..."></textarea>
              </div>

              <div class="form-group">
                <label>Icono *</label>
                <div class="icon-selector">
                  @for (icon of availableIcons; track icon) {
                    <button type="button" class="icon-option" 
                            [class.selected]="formData.icon === icon"
                            (click)="formData.icon = icon">
                      {{ icon }}
                    </button>
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
      background: linear-gradient(135deg, #0a0a1a 0%, #12122a 100%);
      color: white;
    }

    .catalog-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-left { display: flex; flex-direction: column; gap: 0.5rem; }

    .back-link {
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .back-link:hover { color: white; }

    h1 { font-size: 1.5rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.5); margin: 0; }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }

    .industries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.25rem;
    }

    .industry-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.2s;
    }
    .industry-card:hover { background: rgba(255,255,255,0.05); }
    .industry-card.inactive { opacity: 0.6; }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .icon { font-size: 2.5rem; }
    .card-actions { display: flex; gap: 0.5rem; }

    .btn-icon {
      width: 32px; height: 32px;
      border: none; border-radius: 8px;
      background: rgba(255,255,255,0.05);
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.danger:hover { background: rgba(239,68,68,0.2); }

    h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }
    .code { font-size: 0.8rem; color: rgba(255,255,255,0.4); font-family: monospace; }
    .description { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 0.75rem 0; }

    .status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }
    .status.active { background: rgba(16,185,129,0.2); color: #10b981; }
    .status:not(.active) { background: rgba(239,68,68,0.2); color: #ef4444; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: #1a1a2e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      width: 100%; max-width: 480px;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .modal-header h2 { margin: 0; font-size: 1.25rem; }
    .btn-close { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }

    .modal-body { padding: 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
    .form-group input, .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: white;
      font-size: 1rem;
    }
    .form-group input:focus, .form-group textarea:focus {
      outline: none;
      border-color: #6366f1;
    }
    .form-group textarea { min-height: 80px; resize: vertical; }

    .icon-selector {
      display: flex; flex-wrap: wrap; gap: 0.5rem;
    }
    .icon-option {
      width: 44px; height: 44px;
      background: rgba(255,255,255,0.05);
      border: 2px solid transparent;
      border-radius: 10px;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .icon-option:hover { background: rgba(255,255,255,0.1); }
    .icon-option.selected { border-color: #6366f1; background: rgba(99,102,241,0.2); }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex; justify-content: flex-end; gap: 1rem;
    }
    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: rgba(255,255,255,0.1);
      border: none; border-radius: 8px;
      color: white; cursor: pointer;
    }
  `]
})
export class IndustriesCatalogComponent implements OnInit {
    private http = inject(HttpClient);

    industries = signal<Industry[]>([]);
    showModal = signal(false);
    editingIndustry = signal<Industry | null>(null);

    availableIcons = AVAILABLE_ICONS;

    formData: Partial<Industry> = {
        code: '',
        name: '',
        icon: '🛒',
        description: '',
        active: true
    };

    ngOnInit() {
        this.loadIndustries();
    }

    loadIndustries() {
        // For now, load from local storage or use defaults
        const stored = localStorage.getItem('industries_catalog');
        if (stored) {
            this.industries.set(JSON.parse(stored));
        } else {
            // Default industries
            this.industries.set([
                { code: 'RETAIL', name: 'Retail', icon: '🛒', description: 'Tiendas y comercio minorista', active: true },
                { code: 'PANADERIA', name: 'Panadería', icon: '🥖', description: 'Panaderías y pastelerías', active: true },
                { code: 'EDUCACION', name: 'Educación', icon: '🎓', description: 'Cursos y academias', active: true },
                { code: 'EDITORIAL', name: 'Editorial', icon: '📚', description: 'Librerías y editoriales', active: true },
                { code: 'RESTAURANTE', name: 'Restaurant', icon: '🍕', description: 'Restaurantes y cafeterías', active: true },
                { code: 'FARMACIA', name: 'Farmacia', icon: '💊', description: 'Farmacias y droguerías', active: true },
                { code: 'SERVICIOS', name: 'Servicios', icon: '🔧', description: 'Servicios profesionales', active: true }
            ]);
        }
    }

    saveIndustries() {
        localStorage.setItem('industries_catalog', JSON.stringify(this.industries()));
    }

    openModal(industry?: Industry) {
        if (industry) {
            this.editingIndustry.set(industry);
            this.formData = { ...industry };
        } else {
            this.editingIndustry.set(null);
            this.formData = { code: '', name: '', icon: '🛒', description: '', active: true };
        }
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingIndustry.set(null);
    }

    saveIndustry() {
        if (this.editingIndustry()) {
            // Update existing
            this.industries.update(list =>
                list.map(i => i.code === this.formData.code ? { ...i, ...this.formData } as Industry : i)
            );
        } else {
            // Create new
            this.industries.update(list => [...list, { ...this.formData, active: true } as Industry]);
        }
        this.saveIndustries();
        this.closeModal();
    }

    toggleActive(industry: Industry) {
        this.industries.update(list =>
            list.map(i => i.code === industry.code ? { ...i, active: !i.active } : i)
        );
        this.saveIndustries();
    }
}
