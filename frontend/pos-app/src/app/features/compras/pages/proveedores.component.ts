import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier } from '../../../core/services/supplier.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/pos" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver al POS
          </a>
          <h1>
            <span class="title-icon">🏭</span>
            Gestión de Proveedores
          </h1>
          <p class="subtitle">Control integral de proveedores, pagos y entregas</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar proveedor..." [(ngModel)]="searchTerm" (ngModelChange)="onSearch()">
          </div>
          <button class="btn btn-primary" (click)="openModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Proveedor
          </button>
        </div>
      </header>

      <!-- KPI Cards -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-value">{{ activeCount() }}</span>
            <span class="kpi-label">Proveedores Activos</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-value">{{ totalCount() }}</span>
            <span class="kpi-label">Total Registrados</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-value">{{ avgRating().toFixed(1) }}</span>
            <span class="kpi-label">Rating Promedio</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-value">{{ formatCurrency(totalSpent()) }}</span>
            <span class="kpi-label">Total Compras</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab" [class.active]="activeTab === 'list'" (click)="activeTab = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Lista
        </button>
        <button class="tab" [class.active]="activeTab === 'ranking'" (click)="activeTab = 'ranking'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Ranking
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando proveedores...</p>
        </div>
      } @else {

        <!-- LIST TAB -->
        @if (activeTab === 'list') {
          <!-- Filter chips -->
          <div class="filter-row">
            <button class="filter-chip" [class.active]="statusFilter === 'all'" (click)="statusFilter = 'all'; onSearch()">Todos</button>
            <button class="filter-chip" [class.active]="statusFilter === 'active'" (click)="statusFilter = 'active'; onSearch()">Activos</button>
            <button class="filter-chip" [class.active]="statusFilter === 'inactive'" (click)="statusFilter = 'inactive'; onSearch()">Inactivos</button>
            <button class="filter-chip" [class.active]="statusFilter === 'blocked'" (click)="statusFilter = 'blocked'; onSearch()">Bloqueados</button>
          </div>

          <div class="suppliers-grid">
            @for (supplier of filteredSuppliers(); track supplier.id) {
              <div class="supplier-card" [class.inactive]="!supplier.isActive">
                <div class="card-header">
                  <div class="supplier-avatar" [style.background]="getAvatarColor(supplier)">
                    {{ (supplier.fantasyName || supplier.businessName || '?').charAt(0).toUpperCase() }}
                  </div>
                  <div class="card-info">
                    <h3>{{ supplier.fantasyName || supplier.businessName }}</h3>
                    <span class="supplier-rut">{{ supplier.rut }}</span>
                  </div>
                  <div class="card-status">
                    <span class="status-dot" [class]="supplier.status?.toLowerCase() || 'active'"></span>
                  </div>
                </div>

                <div class="card-body">
                  <div class="card-meta">
                    @if (supplier.category) {
                      <span class="tag category-tag">{{ getCategoryLabel(supplier.category) }}</span>
                    }
                    @if (supplier.deliveryType) {
                      <span class="tag delivery-tag">{{ getDeliveryLabel(supplier.deliveryType) }}</span>
                    }
                  </div>

                  <div class="card-details">
                    @if (supplier.contactName) {
                      <div class="detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/></svg> {{ supplier.contactName }}</div>
                    }
                    @if (supplier.phone) {
                      <div class="detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> {{ supplier.phone }}</div>
                    }
                    @if (supplier.email) {
                      <div class="detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> {{ supplier.email }}</div>
                    }
                  </div>

                  <!-- Rating Stars -->
                  <div class="rating-row">
                    <div class="stars">
                      @for (star of [1,2,3,4,5]; track star) {
                        <span class="star" [class.filled]="star <= (supplier.trustRating || 0)" (click)="setRating(supplier, star)">★</span>
                      }
                    </div>
                    <span class="rating-value">{{ (supplier.trustRating || 0).toFixed(1) }}</span>
                  </div>

                  <div class="card-metrics">
                    <div class="metric">
                      <span class="metric-value">{{ supplier.paymentTerms || 30 }}d</span>
                      <span class="metric-label">Plazo pago</span>
                    </div>
                    <div class="metric">
                      <span class="metric-value">{{ supplier.avgDeliveryDays || 0 }}d</span>
                      <span class="metric-label">Entrega</span>
                    </div>
                    <div class="metric">
                      <span class="metric-value">{{ supplier.totalOrders || 0 }}</span>
                      <span class="metric-label">Órdenes</span>
                    </div>
                  </div>
                </div>

                <div class="card-actions">
                  <button class="action-btn" title="Editar" (click)="editSupplier(supplier)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn danger" title="Desactivar" (click)="deleteSupplier(supplier)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">🏭</div>
                <h3>Sin proveedores</h3>
                <p>Agrega tu primer proveedor para comenzar a gestionar compras</p>
                <button class="btn btn-primary" (click)="openModal()">Agregar Proveedor</button>
              </div>
            }
          </div>
        }

        <!-- RANKING TAB -->
        @if (activeTab === 'ranking') {
          <div class="ranking-list">
            @for (supplier of rankedSuppliers(); track supplier.id; let i = $index) {
              <div class="ranking-item">
                <span class="rank-number" [class.top3]="i < 3">{{ i + 1 }}</span>
                <div class="rank-avatar" [style.background]="getAvatarColor(supplier)">
                  {{ (supplier.fantasyName || supplier.businessName || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="rank-info">
                  <h4>{{ supplier.fantasyName || supplier.businessName }}</h4>
                  <span class="rank-category">{{ getCategoryLabel(supplier.category) }}</span>
                </div>
                <div class="rank-stars">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span class="star" [class.filled]="star <= (supplier.trustRating || 0)">★</span>
                  }
                </div>
                <div class="rank-metrics">
                  <div class="rm"><span class="rm-val">{{ supplier.totalOrders || 0 }}</span><span class="rm-lbl">Órdenes</span></div>
                  <div class="rm"><span class="rm-val">{{ getOnTimePercent(supplier) }}%</span><span class="rm-lbl">Puntualidad</span></div>
                  <div class="rm"><span class="rm-val">{{ formatCurrency(supplier.totalSpent || 0) }}</span><span class="rm-lbl">Compras</span></div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No hay proveedores para rankear</p>
              </div>
            }
          </div>
        }
      }

      <!-- CREATE/EDIT MODAL -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingSupplier() ? '✏️ Editar' : '➕ Nuevo' }} Proveedor</h2>
              <button class="close-btn" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveSupplier()" class="modal-body">
              <!-- Section: Datos Básicos -->
              <div class="form-section">
                <h3 class="section-title">Datos de la Empresa</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label>RUT *</label>
                    <input type="text" [(ngModel)]="form.rut" name="rut" placeholder="76.123.456-7" required>
                  </div>
                  <div class="form-group">
                    <label>Giro</label>
                    <input type="text" [(ngModel)]="form.giro" name="giro" placeholder="Actividad comercial">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Razón Social *</label>
                    <input type="text" [(ngModel)]="form.businessName" name="businessName" required>
                  </div>
                  <div class="form-group">
                    <label>Nombre Fantasía</label>
                    <input type="text" [(ngModel)]="form.fantasyName" name="fantasyName">
                  </div>
                </div>
              </div>

              <!-- Section: Contacto -->
              <div class="form-section">
                <h3 class="section-title">Contacto</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label>Nombre Contacto</label>
                    <input type="text" [(ngModel)]="form.contactName" name="contactName">
                  </div>
                  <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" [(ngModel)]="form.phone" name="phone">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" [(ngModel)]="form.email" name="email">
                  </div>
                  <div class="form-group">
                    <label>Sitio Web</label>
                    <input type="url" [(ngModel)]="form.website" name="website" placeholder="https://">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" [(ngModel)]="form.address" name="address">
                  </div>
                  <div class="form-group">
                    <label>Ciudad</label>
                    <input type="text" [(ngModel)]="form.city" name="city">
                  </div>
                </div>
              </div>

              <!-- Section: Condiciones Comerciales -->
              <div class="form-section">
                <h3 class="section-title">Condiciones Comerciales</h3>
                <div class="form-row three-col">
                  <div class="form-group">
                    <label>Plazo de Pago (días)</label>
                    <input type="number" [(ngModel)]="form.paymentTerms" name="paymentTerms" min="0">
                  </div>
                  <div class="form-group">
                    <label>Dcto. Pronto Pago %</label>
                    <input type="number" [(ngModel)]="form.discountPercentage" name="discountPercentage" min="0" max="100" step="0.5">
                  </div>
                  <div class="form-group">
                    <label>Moneda</label>
                    <select [(ngModel)]="form.currency" name="currency">
                      <option value="CLP">CLP - Peso Chileno</option>
                      <option value="USD">USD - Dólar</option>
                      <option value="PEN">PEN - Sol Peruano</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Banco</label>
                    <input type="text" [(ngModel)]="form.bankName" name="bankName" placeholder="Banco de Chile">
                  </div>
                  <div class="form-group">
                    <label>Cuenta Bancaria</label>
                    <input type="text" [(ngModel)]="form.bankAccount" name="bankAccount">
                  </div>
                </div>
              </div>

              <!-- Section: Clasificación -->
              <div class="form-section">
                <h3 class="section-title">Clasificación y Entrega</h3>
                <div class="form-row three-col">
                  <div class="form-group">
                    <label>Categoría</label>
                    <select [(ngModel)]="form.category" name="category">
                      <option value="GENERAL">General</option>
                      <option value="RAW_MATERIALS">Materias Primas</option>
                      <option value="SERVICES">Servicios</option>
                      <option value="TECHNOLOGY">Tecnología</option>
                      <option value="LOGISTICS">Logística</option>
                      <option value="PACKAGING">Empaques</option>
                      <option value="FOOD">Alimentos</option>
                      <option value="BEVERAGES">Bebidas</option>
                      <option value="CLEANING">Limpieza</option>
                      <option value="OFFICE">Oficina</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Tipo de Entrega</label>
                    <select [(ngModel)]="form.deliveryType" name="deliveryType">
                      <option value="DELIVERY">Despacho</option>
                      <option value="PICKUP">Retiro</option>
                      <option value="COURIER">Courier</option>
                      <option value="DIGITAL">Digital</option>
                      <option value="MIXED">Mixto</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Días Entrega Prom.</label>
                    <input type="number" [(ngModel)]="form.avgDeliveryDays" name="avgDeliveryDays" min="0">
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div class="form-section">
                <div class="form-group">
                  <label>Notas / Observaciones</label>
                  <textarea [(ngModel)]="form.notes" name="notes" rows="3" placeholder="Información adicional sobre el proveedor..."></textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar Proveedor' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); font-family: 'Inter', -apple-system, sans-serif; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .back-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
    .back-link:hover { color: #818cf8; }
    h1 { color: #fff; margin: 0; font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .title-icon { font-size: 1.5rem; }
    .subtitle { color: rgba(255,255,255,0.4); font-size: 0.9rem; margin: 0; }

    .search-box { position: relative; }
    .search-box svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); }
    .search-box input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px 10px 36px; color: #fff; width: 220px; transition: all 0.3s; font-size: 0.9rem; }
    .search-box input:focus { width: 280px; background: rgba(255,255,255,0.1); outline: none; border-color: #6366f1; }
    .search-box input::placeholder { color: rgba(255,255,255,0.3); }

    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
    .btn-primary { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-secondary { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.1); }
    .btn-secondary:hover { background: rgba(255,255,255,0.15); }

    /* KPIs */
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; transition: all 0.3s; }
    .kpi-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon.green { background: rgba(16,185,129,0.15); color: #10b981; }
    .kpi-icon.blue { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .kpi-icon.amber { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .kpi-icon.purple { background: rgba(139,92,246,0.15); color: #8b5cf6; }
    .kpi-data { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #fff; }
    .kpi-label { font-size: 0.8rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.5px; }

    /* Tabs */
    .tabs-bar { display: flex; gap: 4px; margin-bottom: 20px; background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px; border: 1px solid rgba(255,255,255,0.06); width: fit-content; }
    .tab { padding: 8px 20px; border-radius: 8px; border: none; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
    .tab.active { background: rgba(99,102,241,0.2); color: #818cf8; }
    .tab:hover:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }

    /* Filters */
    .filter-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-chip { padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6); cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
    .filter-chip.active { background: rgba(99,102,241,0.2); border-color: #6366f1; color: #818cf8; }
    .filter-chip:hover:not(.active) { background: rgba(255,255,255,0.08); }

    /* Supplier Cards Grid */
    .suppliers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .supplier-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; transition: all 0.3s; }
    .supplier-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .supplier-card.inactive { opacity: 0.6; }

    .card-header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 0; }
    .supplier-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700; color: white; flex-shrink: 0; }
    .card-info { flex: 1; min-width: 0; }
    .card-info h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .supplier-rut { font-size: 0.8rem; color: rgba(255,255,255,0.4); }
    .card-status { }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .status-dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
    .status-dot.inactive { background: #6b7280; }
    .status-dot.blocked { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
    .status-dot.pending_approval { background: #f59e0b; }

    .card-body { padding: 12px 16px; }
    .card-meta { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
    .tag { padding: 3px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .category-tag { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .delivery-tag { background: rgba(16,185,129,0.15); color: #34d399; }

    .card-details { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
    .detail { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: rgba(255,255,255,0.6); }
    .detail svg { color: rgba(255,255,255,0.3); flex-shrink: 0; }

    .rating-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .stars { display: flex; gap: 2px; }
    .star { font-size: 1.1rem; color: rgba(255,255,255,0.15); cursor: pointer; transition: all 0.2s; }
    .star.filled { color: #f59e0b; text-shadow: 0 0 6px rgba(245,158,11,0.5); }
    .star:hover { transform: scale(1.2); }
    .rating-value { font-size: 0.85rem; font-weight: 600; color: #f59e0b; }

    .card-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .metric { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px; text-align: center; }
    .metric-value { display: block; font-size: 1rem; font-weight: 700; color: #fff; }
    .metric-label { font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; }

    .card-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.05); }
    .action-btn { width: 36px; height: 36px; border-radius: 8px; border: none; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .action-btn:hover { background: rgba(99,102,241,0.2); color: #818cf8; }
    .action-btn.danger:hover { background: rgba(239,68,68,0.2); color: #ef4444; }

    /* Ranking */
    .ranking-list { display: flex; flex-direction: column; gap: 8px; }
    .ranking-item { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; transition: all 0.2s; }
    .ranking-item:hover { background: rgba(255,255,255,0.06); }
    .rank-number { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-weight: 700; color: rgba(255,255,255,0.5); font-size: 0.9rem; flex-shrink: 0; }
    .rank-number.top3 { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
    .rank-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; flex-shrink: 0; }
    .rank-info { flex: 1; min-width: 0; }
    .rank-info h4 { margin: 0; color: #fff; font-size: 0.95rem; }
    .rank-category { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .rank-stars { display: flex; gap: 2px; }
    .rank-metrics { display: flex; gap: 20px; }
    .rm { display: flex; flex-direction: column; align-items: center; }
    .rm-val { font-size: 0.9rem; font-weight: 600; color: #fff; }
    .rm-lbl { font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; }

    /* Empty & Loading */
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px; color: rgba(255,255,255,0.5); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5); }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-state h3 { color: rgba(255,255,255,0.7); margin: 0 0 8px; }
    .empty-state p { margin-bottom: 20px; }

    /* Modal Premium UI */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 10, 25, 0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(12px); animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-content { background: linear-gradient(145deg, rgba(30,30,74,0.95), rgba(20,20,50,0.95)); border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1); border-radius: 24px; width: 95%; max-width: 800px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; transform: translateY(0); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); position: sticky; top: 0; background: rgba(22, 22, 55, 0.9); backdrop-filter: blur(10px); z-index: 10; border-radius: 24px 24px 0 0; }
    .modal-header h2 { margin: 0; color: #fff; font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .close-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 1.2rem; cursor: pointer; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
    .close-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #f87171; transform: scale(1.05); }
    
    .modal-body { padding: 32px; display: flex; flex-direction: column; gap: 32px; }
    .form-section { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.04); border-radius: 16px; padding: 24px; }
    .section-title { color: #818cf8; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #6366f1; border-radius: 50%; box-shadow: 0 0 10px #6366f1; }
    
    .form-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 16px; }
    .form-row.three-col { grid-template-columns: repeat(3, 1fr); }
    .form-row:last-child { margin-bottom: 0; }
    
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 500; }
    .form-group input, .form-group select, .form-group textarea { padding: 12px 16px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #fff; font-size: 0.95rem; font-family: inherit; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); width: 100%; box-sizing: border-box; }
    .form-group input:hover, .form-group select:hover, .form-group textarea:hover { border-color: rgba(255,255,255,0.25); background: rgba(0,0,0,0.3); }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #818cf8; background: rgba(99,102,241,0.05); box-shadow: 0 0 0 4px rgba(99,102,241,0.15), inset 0 2px 4px rgba(0,0,0,0.1); transform: translateY(-1px); }
    .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
    
    .form-group select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; cursor: pointer; }
    .form-group select option { background: #1e1e4a; color: #fff; padding: 12px; }
    .form-group textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
    
    .modal-footer { display: flex; justify-content: flex-end; gap: 16px; padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.08); background: rgba(22, 22, 55, 0.95); position: sticky; bottom: 0; z-index: 10; border-radius: 0 0 24px 24px; backdrop-filter: blur(10px); }
    .modal-footer .btn { padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 1rem; transition: all 0.3s ease; }
    .modal-footer .btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
    .modal-footer .btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
    .modal-footer .btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; box-shadow: 0 4px 15px rgba(99,102,241,0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
    .modal-footer .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.6); }
    .modal-footer .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }
    
    @media (max-width: 768px) {
      .page-header { flex-direction: column; }
      .header-actions { width: 100%; }
      .search-box input { width: 100%; }
      .suppliers-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .form-row.three-col { grid-template-columns: 1fr; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .rank-metrics { gap: 10px; }
      .ranking-item { flex-wrap: wrap; }
    }
  `]
})
export class ProveedoresComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editingSupplier = signal<Supplier | null>(null);
  searchTerm = '';
  activeTab = 'list';
  statusFilter = 'all';

  form: any = this.getEmptyForm();

  activeCount = computed(() => this.suppliers().filter(s => s.isActive).length);
  totalCount = computed(() => this.suppliers().length);
  avgRating = computed(() => {
    const active = this.suppliers().filter(s => s.isActive);
    if (active.length === 0) return 0;
    return active.reduce((sum, s) => sum + (s.trustRating || 3), 0) / active.length;
  });
  totalSpent = computed(() => this.suppliers().reduce((sum, s) => sum + (s.totalSpent || 0), 0));

  filteredSuppliers = computed(() => {
    let result = this.suppliers();
    // Status filter
    if (this.statusFilter === 'active') result = result.filter(s => s.isActive && s.status !== 'BLOCKED');
    else if (this.statusFilter === 'inactive') result = result.filter(s => !s.isActive || s.status === 'INACTIVE');
    else if (this.statusFilter === 'blocked') result = result.filter(s => s.status === 'BLOCKED');
    // Search
    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      result = result.filter(s =>
        (s.businessName || '').toLowerCase().includes(q) ||
        (s.fantasyName || '').toLowerCase().includes(q) ||
        (s.rut || '').toLowerCase().includes(q) ||
        (s.contactName || '').toLowerCase().includes(q)
      );
    }
    return result;
  });

  rankedSuppliers = computed(() =>
    [...this.suppliers()]
      .filter(s => s.isActive)
      .sort((a, b) => (b.trustRating || 0) - (a.trustRating || 0))
  );

  constructor(private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        // Backend may return array directly or paginated
        const list = Array.isArray(data) ? data : (data.content || []);
        this.suppliers.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    // Filtering is done via computed, no API call needed
  }

  openModal(): void {
    this.editingSupplier.set(null);
    this.form = this.getEmptyForm();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingSupplier.set(null);
  }

  editSupplier(supplier: Supplier): void {
    this.editingSupplier.set(supplier);
    this.form = {
      rut: supplier.rut,
      businessName: supplier.businessName,
      fantasyName: supplier.fantasyName,
      giro: supplier.giro,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      website: supplier.website,
      address: supplier.address,
      city: supplier.city,
      paymentTerms: supplier.paymentTerms || 30,
      discountPercentage: supplier.discountPercentage || 0,
      currency: supplier.currency || 'CLP',
      bankAccount: supplier.bankAccount,
      bankName: supplier.bankName,
      category: supplier.category || 'GENERAL',
      deliveryType: supplier.deliveryType || 'DELIVERY',
      avgDeliveryDays: supplier.avgDeliveryDays || 3,
      notes: supplier.notes
    };
    this.showModal.set(true);
  }

  deleteSupplier(supplier: Supplier): void {
    const name = supplier.fantasyName || supplier.businessName;
    if (confirm(`¿Desactivar el proveedor "${name}"?`)) {
      this.supplierService.deleteSupplier(supplier.id).subscribe({
        next: () => this.loadSuppliers(),
        error: (err) => console.error('Error deleting supplier', err)
      });
    }
  }

  setRating(supplier: Supplier, rating: number): void {
    this.supplierService.updateRating(supplier.id, rating).subscribe({
      next: (updated) => {
        const list = this.suppliers().map(s => s.id === updated.id ? updated : s);
        this.suppliers.set(list);
      },
      error: (err) => console.error('Error updating rating', err)
    });
  }

  saveSupplier(): void {
    this.saving.set(true);
    const request = this.editingSupplier()
      ? this.supplierService.updateSupplier(this.editingSupplier()!.id, this.form)
      : this.supplierService.createSupplier(this.form);

    request.subscribe({
      next: () => {
        this.loadSuppliers();
        this.closeModal();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error saving supplier:', err);
        this.saving.set(false);
      }
    });
  }

  // Helpers
  formatCurrency(value: number): string {
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
    return '$' + value.toFixed(0);
  }

  getOnTimePercent(s: Supplier): number {
    if (!s.totalOrders || s.totalOrders === 0) return 0;
    return Math.round(((s.onTimeDeliveries || 0) / s.totalOrders) * 100);
  }

  getCategoryLabel(cat: string): string {
    const labels: Record<string, string> = {
      GENERAL: 'General', RAW_MATERIALS: 'Materias Primas', SERVICES: 'Servicios',
      TECHNOLOGY: 'Tecnología', LOGISTICS: 'Logística', PACKAGING: 'Empaques',
      FOOD: 'Alimentos', BEVERAGES: 'Bebidas', CLEANING: 'Limpieza', OFFICE: 'Oficina'
    };
    return labels[cat] || cat || 'General';
  }

  getDeliveryLabel(dt: string): string {
    const labels: Record<string, string> = {
      DELIVERY: 'Despacho', PICKUP: 'Retiro', COURIER: 'Courier', DIGITAL: 'Digital', MIXED: 'Mixto'
    };
    return labels[dt] || dt || 'Despacho';
  }

  getAvatarColor(s: Supplier): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #ef4444, #dc2626)',
      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'linear-gradient(135deg, #ec4899, #be185d)',
      'linear-gradient(135deg, #14b8a6, #0d9488)'
    ];
    const idx = (s.businessName || 'A').charCodeAt(0) % colors.length;
    return colors[idx];
  }

  private getEmptyForm(): any {
    return {
      rut: '', businessName: '', fantasyName: '', giro: '',
      contactName: '', phone: '', email: '', website: '',
      address: '', city: '',
      paymentTerms: 30, discountPercentage: 0, currency: 'CLP',
      bankAccount: '', bankName: '',
      category: 'GENERAL', deliveryType: 'DELIVERY', avgDeliveryDays: 3,
      notes: ''
    };
  }
}
