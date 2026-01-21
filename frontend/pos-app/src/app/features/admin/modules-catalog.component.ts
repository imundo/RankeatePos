import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

interface ModuleDisplay {
    code: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    active: boolean;
}

@Component({
    selector: 'app-modules-catalog',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="catalog-page">
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/admin/dashboard" class="back-link">← Dashboard</a>
          <h1>📊 Catálogo de Módulos</h1>
          <p class="subtitle">Funcionalidades disponibles en la plataforma</p>
        </div>
      </header>

      <!-- Categories -->
      @for (category of categories(); track category.name) {
        <section class="category-section">
          <h2 class="category-title">{{ category.icon }} {{ category.name }}</h2>
          <div class="modules-grid">
            @for (module of category.modules; track module.code) {
              <div class="module-card" [class.inactive]="!module.active">
                <div class="module-header">
                  <span class="module-icon">{{ module.icon }}</span>
                  <label class="toggle">
                    <input type="checkbox" [checked]="module.active" (change)="toggleModule(module)">
                    <span class="slider"></span>
                  </label>
                </div>
                <h3>{{ module.name }}</h3>
                <span class="code">{{ module.code }}</span>
                <p class="description">{{ module.description }}</p>
              </div>
            }
          </div>
        </section>
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

    .catalog-page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .header-left { display: flex; flex-direction: column; gap: 0.5rem; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { color: white; }
    h1 { font-size: 1.5rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.5); margin: 0; }

    .category-section { margin-bottom: 2.5rem; }

    .category-title {
      font-size: 1.1rem;
      margin: 0 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .module-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 1.25rem;
      transition: all 0.2s;
    }
    .module-card:hover { background: rgba(255,255,255,0.05); }
    .module-card.inactive { opacity: 0.5; }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .module-icon { font-size: 2rem; }

    /* Toggle Switch */
    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
    }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      transition: 0.3s;
    }
    .slider::before {
      content: '';
      position: absolute;
      width: 18px; height: 18px;
      left: 3px; bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
    .toggle input:checked + .slider { background: #10b981; }
    .toggle input:checked + .slider::before { transform: translateX(20px); }

    h3 { margin: 0 0 0.25rem; font-size: 1rem; }
    .code { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-family: monospace; }
    .description { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 0.75rem 0 0; }
  `]
})
export class ModulesCatalogComponent implements OnInit {
    private adminService = inject(AdminService);

    modules = signal<ModuleDisplay[]>([]);

    categories = signal<{ name: string; icon: string; modules: ModuleDisplay[] }[]>([]);

    ngOnInit() {
        this.loadModules();
    }

    loadModules() {
        const allModules: ModuleDisplay[] = [
            { code: 'pos', name: 'Punto de Venta', icon: '💰', category: 'Core', description: 'Terminal de ventas y caja', active: true },
            { code: 'inventory', name: 'Inventario', icon: '📦', category: 'Core', description: 'Control de stock y productos', active: true },
            { code: 'invoicing', name: 'Facturación Electrónica', icon: '📄', category: 'Core', description: 'DTEs y boletas electrónicas', active: true },
            { code: 'crm', name: 'CRM Clientes', icon: '👥', category: 'Growth', description: 'Gestión de clientes y contactos', active: true },
            { code: 'loyalty', name: 'Fidelización', icon: '⭐', category: 'Growth', description: 'Puntos y recompensas', active: true },
            { code: 'reservations', name: 'Reservas', icon: '📅', category: 'Growth', description: 'Citas y reservaciones', active: true },
            { code: 'kds', name: 'Pantalla Cocina', icon: '🍳', category: 'Operations', description: 'Sistema de comandas para cocina', active: true },
            { code: 'payroll', name: 'Remuneraciones', icon: '💼', category: 'Admin', description: 'Nómina y RRHH', active: true },
            { code: 'accounting', name: 'Contabilidad', icon: '📊', category: 'Admin', description: 'Libros contables y reportes', active: true }
        ];

        this.modules.set(allModules);

        // Group by category
        const grouped = new Map<string, ModuleDisplay[]>();
        allModules.forEach(m => {
            if (!grouped.has(m.category)) grouped.set(m.category, []);
            grouped.get(m.category)!.push(m);
        });

        const categoryIcons: Record<string, string> = {
            'Core': '🏪',
            'Growth': '📈',
            'Operations': '⚙️',
            'Admin': '🔒'
        };

        this.categories.set(
            Array.from(grouped.entries()).map(([name, modules]) => ({
                name,
                icon: categoryIcons[name] || '📌',
                modules
            }))
        );
    }

    toggleModule(module: ModuleDisplay) {
        this.modules.update(list =>
            list.map(m => m.code === module.code ? { ...m, active: !m.active } : m)
        );
        // Re-group
        this.loadModules();
    }
}
