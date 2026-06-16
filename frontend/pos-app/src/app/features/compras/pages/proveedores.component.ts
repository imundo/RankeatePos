import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier, SupplierProduct } from '../../../core/services/supplier.service';
import { CatalogService, Product } from '../../../core/services/catalog.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container" [class.panel-open]="selectedSupplier() != null">
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
          <p class="subtitle">Centro de Control de Compras, Pagos y Desempeño</p>
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

      <!-- Main Tools Bar (Tabs + View Toggle) -->
      <div class="tools-bar">
        <div class="tabs-bar">
          <button class="tab" [class.active]="activeTab === 'list'" (click)="activeTab = 'list'">Directorio</button>
          <button class="tab" [class.active]="activeTab === 'ranking'" (click)="activeTab = 'ranking'">Ranking</button>
        </div>
        
        @if (activeTab === 'list') {
          <div class="view-toggle">
            <button class="icon-btn" [class.active]="isGridMode()" (click)="isGridMode.set(true)" title="Vista Grilla">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            </button>
            <button class="icon-btn" [class.active]="!isGridMode()" (click)="isGridMode.set(false)" title="Vista Tarjetas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Sincronizando proveedores...</p>
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

          <!-- GRID VIEW (TABLE) -->
          @if (isGridMode()) {
            <div class="grid-wrapper">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>RUT</th>
                    <th>Categoría</th>
                    <th>Contacto</th>
                    <th>Condiciones</th>
                    <th>Desempeño</th>
                    <th class="text-right">Total Compras</th>
                  </tr>
                </thead>
                <tbody>
                  @for (supplier of filteredSuppliers(); track supplier.id) {
                    <tr class="interactive-row" (click)="openSupplierDetails(supplier)">
                      <td>
                        <div class="td-supplier-info">
                          <div class="td-avatar" [style.background]="getAvatarColor(supplier)">
                            {{ (supplier.fantasyName || supplier.businessName || '?').charAt(0).toUpperCase() }}
                          </div>
                          <div class="td-names">
                            <span class="td-fantasy">{{ supplier.fantasyName || supplier.businessName }}</span>
                            <span class="td-business">{{ supplier.businessName }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="td-muted">{{ supplier.rut }}</td>
                      <td><span class="tag category-tag">{{ getCategoryLabel(supplier.category) }}</span></td>
                      <td class="td-muted">{{ supplier.contactName || 'Sin contacto' }}<br><small>{{ supplier.phone }}</small></td>
                      <td>
                        <div class="td-condiciones">
                          <span>{{ supplier.paymentTerms || 30 }} días</span>
                          @if(supplier.discountPercentage) { <span class="badge-dcto">-{{supplier.discountPercentage}}%</span> }
                        </div>
                      </td>
                      <td>
                        <div class="td-rating">
                          <span class="star filled">★</span> {{ (supplier.trustRating || 0).toFixed(1) }}
                        </div>
                      </td>
                      <td class="text-right font-bold text-gradient">
                        {{ formatCurrency(supplier.totalSpent || 0) }}
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" class="text-center py-8 text-gray-500">No hay proveedores que coincidan con los filtros.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <!-- CARDS VIEW -->
            <div class="suppliers-grid">
              @for (supplier of filteredSuppliers(); track supplier.id) {
                <div class="supplier-card" [class.inactive]="!supplier.isActive" (click)="openSupplierDetails(supplier)">
                  <div class="card-header">
                    <div class="supplier-avatar" [style.background]="getAvatarColor(supplier)">
                      {{ (supplier.fantasyName || supplier.businessName || '?').charAt(0).toUpperCase() }}
                    </div>
                    <div class="card-info">
                      <h3>{{ supplier.fantasyName || supplier.businessName }}</h3>
                      <span class="supplier-rut">{{ supplier.rut }}</span>
                    </div>
                    <div class="card-status">
                      <span class="status-dot" [class]="supplier.status?.toLowerCase() || (supplier.isActive ? 'active' : 'inactive')"></span>
                    </div>
                  </div>

                  <div class="card-body">
                    <div class="card-meta">
                      @if (supplier.category) {
                        <span class="tag category-tag">{{ getCategoryLabel(supplier.category) }}</span>
                      }
                    </div>

                    <div class="rating-row">
                      <div class="stars">
                        @for (star of [1,2,3,4,5]; track star) {
                          <span class="star" [class.filled]="star <= (supplier.trustRating || 0)" (click)="$event.stopPropagation(); setRating(supplier, star)">★</span>
                        }
                      </div>
                      <span class="rating-value">{{ (supplier.trustRating || 0).toFixed(1) }}</span>
                    </div>

                    <div class="card-metrics">
                      <div class="metric">
                        <span class="metric-value">{{ supplier.paymentTerms || 30 }}d</span>
                        <span class="metric-label">Pago</span>
                      </div>
                      <div class="metric">
                        <span class="metric-value">{{ supplier.avgDeliveryDays || 0 }}d</span>
                        <span class="metric-label">Entrega</span>
                      </div>
                      <div class="metric">
                        <span class="metric-value text-green-400">{{ formatCurrency(supplier.totalSpent || 0) }}</span>
                        <span class="metric-label">Compras</span>
                      </div>
                    </div>
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
        }

        <!-- RANKING TAB -->
        @if (activeTab === 'ranking') {
          <div class="ranking-list">
            @for (supplier of rankedSuppliers(); track supplier.id; let i = $index) {
              <div class="ranking-item" (click)="openSupplierDetails(supplier)">
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
                  <div class="rm"><span class="rm-val text-green-400">{{ formatCurrency(supplier.totalSpent || 0) }}</span><span class="rm-lbl">Compras</span></div>
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

      <!-- DETAILS SLIDE-OVER PANEL -->
      <div class="slide-over-backdrop" [class.visible]="selectedSupplier() != null" (click)="closeSupplierDetails()"></div>
      <div class="slide-over-panel" [class.open]="selectedSupplier() != null">
        @if (selectedSupplier(); as sup) {
          <div class="slide-over-header">
            <div class="slide-header-top">
              <button class="close-btn" (click)="closeSupplierDetails()">✕</button>
              <div class="header-actions-sm">
                <button class="action-btn" title="Editar" (click)="editSupplier(sup)">✏️</button>
              </div>
            </div>
            
            <div class="slide-supplier-profile">
              <div class="slide-avatar" [style.background]="getAvatarColor(sup)">
                {{ (sup.fantasyName || sup.businessName || '?').charAt(0).toUpperCase() }}
              </div>
              <div class="slide-profile-info">
                <h2>{{ sup.fantasyName || sup.businessName }}</h2>
                <div class="slide-rut-row">
                  <span class="rut">{{ sup.rut }}</span>
                  <span class="tag category-tag">{{ getCategoryLabel(sup.category) }}</span>
                  <span class="status-dot" [class]="sup.status?.toLowerCase() || (sup.isActive ? 'active' : 'inactive')"></span>
                </div>
              </div>
            </div>

            <!-- Slide Tabs -->
            <div class="slide-tabs">
              <button [class.active]="detailTab() === 'resumen'" (click)="detailTab.set('resumen')">Resumen</button>
              <button [class.active]="detailTab() === 'compromisos'" (click)="detailTab.set('compromisos')">Compromisos</button>
              <button [class.active]="detailTab() === 'ordenes'" (click)="detailTab.set('ordenes')">Órdenes</button>
              <button [class.active]="detailTab() === 'productos'" (click)="detailTab.set('productos')">Catálogo</button>
            </div>
          </div>

          <div class="slide-over-body">
            
            @if (detailTab() === 'resumen') {
              <div class="tab-content resumen-tab">
                <div class="slide-kpi-grid">
                  <div class="s-kpi">
                    <span class="lbl">Total Comprado</span>
                    <span class="val text-green-400">{{ formatCurrency(sup.totalSpent || 0) }}</span>
                  </div>
                  <div class="s-kpi">
                    <span class="lbl">Órdenes</span>
                    <span class="val">{{ sup.totalOrders || 0 }}</span>
                  </div>
                  <div class="s-kpi">
                    <span class="lbl">Plazo Pago</span>
                    <span class="val">{{ sup.paymentTerms || 30 }} días</span>
                  </div>
                  <div class="s-kpi">
                    <span class="lbl">Puntualidad</span>
                    <span class="val">{{ getOnTimePercent(sup) }}%</span>
                  </div>
                </div>

                <div class="info-card">
                  <h3>Información de Contacto</h3>
                  <div class="info-row"><span class="i-lbl">Nombre:</span> <span class="i-val">{{ sup.contactName || '—' }}</span></div>
                  <div class="info-row"><span class="i-lbl">Teléfono:</span> <span class="i-val">{{ sup.phone || '—' }}</span></div>
                  <div class="info-row"><span class="i-lbl">Email:</span> <span class="i-val">{{ sup.email || '—' }}</span></div>
                  <div class="info-row"><span class="i-lbl">Dirección:</span> <span class="i-val">{{ sup.address || '—' }}, {{ sup.city || '—' }}</span></div>
                </div>

                <div class="info-card">
                  <h3>Datos Bancarios y Comerciales</h3>
                  <div class="info-row"><span class="i-lbl">Razón Social:</span> <span class="i-val">{{ sup.businessName }}</span></div>
                  <div class="info-row"><span class="i-lbl">Giro:</span> <span class="i-val">{{ sup.giro || '—' }}</span></div>
                  <div class="info-row"><span class="i-lbl">Moneda:</span> <span class="i-val">{{ sup.currency || 'CLP' }}</span></div>
                  <div class="info-row"><span class="i-lbl">Banco:</span> <span class="i-val">{{ sup.bankName || '—' }}</span></div>
                  <div class="info-row"><span class="i-lbl">Cuenta:</span> <span class="i-val">{{ sup.bankAccount || '—' }}</span></div>
                  <div class="info-row"><span class="i-lbl">Tipo Entrega:</span> <span class="i-val">{{ getDeliveryLabel(sup.deliveryType) }}</span></div>
                </div>
              </div>
            }

            @if (detailTab() === 'compromisos') {
              <div class="tab-content compromisos-tab">
                <div class="alert-box success" style="margin-bottom: 16px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span>Módulo de Cuentas por Pagar conectado con Base de Datos real.</span>
                </div>
                
                <div class="kpi-row" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
                  <div class="kpi-card" style="padding: 16px;">
                    <div class="kpi-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                    <div class="kpi-data">
                      <span class="kpi-value text-amber-400" style="font-size: 1.25rem;">{{ formatCurrency(getPendingPayablesTotal()) }}</span>
                      <span class="kpi-label">Pendiente de Pago</span>
                    </div>
                  </div>
                  <div class="kpi-card" style="padding: 16px;">
                    <div class="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                    <div class="kpi-data">
                      <span class="kpi-value text-green-400" style="font-size: 1.25rem;">{{ formatCurrency(getPaidPayablesTotal()) }}</span>
                      <span class="kpi-label">Pagado Histórico</span>
                    </div>
                  </div>
                </div>

                <div class="link-product-box" style="margin-bottom: 20px;">
                  <h4>Registrar Nuevo Compromiso</h4>
                  <form (ngSubmit)="createPayable()" class="form-row">
                    <div class="form-group">
                      <label>Tipo Doc.</label>
                      <select [(ngModel)]="payableForm.documentType" name="docType">
                        <option value="FACTURA">Factura</option>
                        <option value="BOLETA">Boleta</option>
                        <option value="RECIBO">Recibo / Otro</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Número de Documento</label>
                      <input type="text" [(ngModel)]="payableForm.documentNumber" name="docNum" required>
                    </div>
                    <div class="form-group">
                      <label>Monto</label>
                      <input type="number" [(ngModel)]="payableForm.amount" name="amount" required min="1">
                    </div>
                    <div class="form-group">
                      <label>Fecha Emisión</label>
                      <input type="date" [(ngModel)]="payableForm.issueDate" name="issDate" required>
                    </div>
                    <div class="form-group">
                      <label>Fecha Vencimiento</label>
                      <input type="date" [(ngModel)]="payableForm.dueDate" name="dueDate" required>
                    </div>
                    <div class="form-group" style="padding-top: 24px;">
                      <button type="submit" class="btn btn-primary" [disabled]="creatingPayable() || !payableForm.amount" style="width: 100%; justify-content: center;">
                        {{ creatingPayable() ? 'Guardando...' : '+ Registrar' }}
                      </button>
                    </div>
                  </form>
                </div>

                @if (loadingPayables()) {
                  <div class="text-center py-4"><div class="spinner inline-block"></div></div>
                } @else {
                  <table class="mock-table">
                    <thead>
                      <tr><th>Vencimiento</th><th>Doc</th><th>Monto</th><th>Estado</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
                      @for(c of supplierPayables(); track c.id) {
                        <tr class="interactive-row">
                          <td>
                            <div style="display: flex; flex-direction: column;">
                              <span class="font-bold">{{ c.dueDate }}</span>
                              @if (c.status === 'PENDING') {
                                <span class="td-muted" style="font-size: 0.75rem;">Faltan {{ getDaysLeft(c.dueDate) }} días</span>
                              }
                            </div>
                          </td>
                          <td>
                            <div style="display: flex; flex-direction: column;">
                              <span style="color: #818cf8; font-weight: 500;">{{ c.documentNumber }}</span>
                              <span class="td-muted" style="font-size: 0.75rem;">{{ c.documentType }}</span>
                            </div>
                          </td>
                          <td class="font-bold" [class.text-green-400]="c.status === 'PAID'">{{ formatCurrency(c.amount) }}</td>
                          <td>
                            @if (c.status === 'PENDING') {
                              <span class="neon-tag pending">Pendiente</span>
                            } @else if (c.status === 'PAID') {
                              <span class="neon-tag active">Pagado</span>
                            } @else {
                              <span class="neon-tag">{{ c.status }}</span>
                            }
                          </td>
                          <td>
                            @if (c.status === 'PENDING') {
                              <button class="btn btn-primary btn-sm" (click)="payAccountPayable(c.id)">Pagar</button>
                            }
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="5" class="text-center py-4">No hay compromisos registrados.</td></tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            }

            @if (detailTab() === 'ordenes') {
              <div class="tab-content ordenes-tab">
                <div class="alert-box success" style="margin-bottom: 16px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span>Historial de Órdenes de Compra (Integrado a Base de Datos).</span>
                </div>

                @if (loadingOrders()) {
                  <div class="text-center py-4"><div class="spinner inline-block"></div></div>
                } @else {
                  <div class="timeline">
                    @for(o of supplierOrders(); track o.id) {
                      <div class="timeline-item">
                        <div class="t-dot" [class]="o.status"></div>
                        <div class="t-content interactive-row">
                          <div class="t-header">
                            <span class="t-title" style="color: #818cf8; font-size: 1rem;">OC #{{ o.orderNumber }}</span>
                            <span class="t-date">{{ o.orderDate }}</span>
                          </div>
                          <div class="t-body" style="margin-top: 8px;">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                              <span style="font-size: 1.1rem; font-weight: 700; color: #fff;">{{ formatCurrency(o.total) }}</span>
                            </div>
                            <span class="neon-tag" [class]="o.status" style="align-self: flex-start;">{{ o.status }}</span>
                          </div>
                        </div>
                      </div>
                    } @empty {
                      <div class="text-center py-4 td-muted">No hay órdenes registradas para este proveedor.</div>
                    }
                  </div>
                }
              </div>
            }

            @if (detailTab() === 'productos') {
              <div class="tab-content productos-tab">
                <div class="link-product-box">
                  <h4>Vincular Producto al Proveedor</h4>
                  <form (ngSubmit)="linkProductToSupplier()" class="form-row">
                    <div class="form-group" style="grid-column: span 2;">
                      <label>Producto de Inventario</label>
                      <select [(ngModel)]="linkForm.productVariantId" name="variantId" required>
                        <option value="">-- Seleccionar --</option>
                        @for (p of allProducts(); track p.id) {
                          @for (v of p.variants; track v.id) {
                            <option [value]="v.id">{{ p.nombre }} {{ v.nombre ? ' - ' + v.nombre : '' }}</option>
                          }
                        }
                      </select>
                    </div>
                    <div class="form-group">
                      <label>SKU del Proveedor</label>
                      <input type="text" [(ngModel)]="linkForm.supplierSku" name="supSku" placeholder="Opcional">
                    </div>
                    <div class="form-group">
                      <label>Unidad de Medida</label>
                      <select [(ngModel)]="linkForm.unitOfMeasure" name="uom">
                        <option value="UN">Individual (Unidad)</option>
                        <option value="DOZ">Docena</option>
                        <option value="BOX">Caja</option>
                        <option value="PACK">Pack / Lote</option>
                        <option value="KG">Kilogramos</option>
                        <option value="LT">Litros</option>
                        <option value="PALLET">Pallet</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Costo Acordado</label>
                      <input type="number" [(ngModel)]="linkForm.lastCost" name="lastCost" required min="0">
                    </div>
                    <div class="form-group" style="padding-top: 24px;">
                      <button type="submit" class="btn btn-primary" [disabled]="!linkForm.productVariantId || linkingProduct()" style="width: 100%; justify-content: center;">
                        {{ linkingProduct() ? '...' : '+ Vincular' }}
                      </button>
                    </div>
                  </form>
                </div>

                @if (loadingProducts()) {
                  <div class="text-center p-4"><div class="spinner inline-block"></div></div>
                } @else {
                  <table class="mock-table" style="margin-top: 16px;">
                    <thead>
                      <tr><th>SKU Prov</th><th>Producto</th><th>U. Medida</th><th>Costo Ref.</th></tr>
                    </thead>
                    <tbody>
                      @for(p of supplierProducts(); track p.id) {
                        <tr>
                          <td><span class="neon-tag pending">{{ p.supplierSku || 'N/A' }}</span></td>
                          <td class="font-bold">{{ p.productVariantName }}</td>
                          <td><span class="tag category-tag">{{ p.unitOfMeasure || 'UN' }}</span></td>
                          <td class="text-green-400 font-bold">{{ formatCurrency(p.lastCost || 0) }}</td>
                        </tr>
                      } @empty {
                        <tr><td colspan="4" class="text-center py-4">No hay productos asociados a este proveedor en el catálogo.</td></tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            }

          </div>
        }
      </div>

      <!-- CREATE/EDIT MODAL -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingSupplier() ? '✏️ Editar' : '➕ Nuevo' }} Proveedor</h2>
              <button class="close-btn" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveSupplier()" class="modal-body form-body">
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
    :host { display: block; overflow-x: hidden; }
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); font-family: 'Inter', -apple-system, sans-serif; transition: padding-right 0.4s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
    .page-container.panel-open { padding-right: 480px; }

    /* Utilities */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .text-green-400 { color: #4ade80; }
    .text-gray-500 { color: #6b7280; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .p-4 { padding: 1rem; }
    .inline-block { display: inline-block; }

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
    .icon-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .icon-btn.active { background: rgba(99,102,241,0.2); color: #818cf8; border-color: #6366f1; }
    .icon-btn:hover:not(.active) { background: rgba(255,255,255,0.1); color: #fff; }

    /* KPIs */
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; transition: all 0.3s; backdrop-filter: blur(10px); }
    .kpi-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon.green { background: rgba(16,185,129,0.15); color: #10b981; }
    .kpi-icon.blue { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .kpi-icon.amber { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .kpi-icon.purple { background: rgba(139,92,246,0.15); color: #8b5cf6; }
    .kpi-data { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #fff; }
    .kpi-label { font-size: 0.8rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.5px; }

    /* Tools Bar */
    .tools-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .tabs-bar { display: flex; gap: 4px; background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px; border: 1px solid rgba(255,255,255,0.06); width: fit-content; }
    .tab { padding: 8px 20px; border-radius: 8px; border: none; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s; }
    .tab.active { background: rgba(99,102,241,0.2); color: #818cf8; }
    .tab:hover:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
    .view-toggle { display: flex; gap: 8px; }

    /* Filters */
    .filter-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-chip { padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6); cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
    .filter-chip.active { background: rgba(99,102,241,0.2); border-color: #6366f1; color: #818cf8; }
    .filter-chip:hover:not(.active) { background: rgba(255,255,255,0.08); }

    /* Table Grid View */
    .grid-wrapper { overflow-x: auto; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .premium-table { width: 100%; border-collapse: collapse; min-width: 800px; }
    .premium-table th { text-align: left; padding: 16px; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); font-weight: 600; }
    .premium-table td { padding: 16px; color: #e2e8f0; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.02); vertical-align: middle; }
    .interactive-row { cursor: pointer; transition: all 0.2s; }
    .interactive-row:hover { background: rgba(99,102,241,0.05); }
    .td-supplier-info { display: flex; align-items: center; gap: 12px; }
    .td-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; flex-shrink: 0; }
    .td-names { display: flex; flex-direction: column; }
    .td-fantasy { font-weight: 600; color: #fff; }
    .td-business { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .td-muted { color: rgba(255,255,255,0.6); }
    .td-condiciones { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
    .badge-dcto { background: rgba(16,185,129,0.15); color: #34d399; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .text-gradient { background: linear-gradient(135deg, #4ade80, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    /* Tags & Status */
    .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .status-dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
    .status-dot.inactive { background: #6b7280; }
    .status-dot.blocked { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
    .tag { padding: 3px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .category-tag { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .neon-tag { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .neon-tag.pending { background: rgba(245,158,11,0.1); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
    .neon-tag.paid { background: rgba(16,185,129,0.1); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
    .neon-tag.overdue { background: rgba(239,68,68,0.1); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
    .neon-tag.delivered { background: rgba(59,130,246,0.1); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }

    /* Cards View */
    .suppliers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .supplier-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; transition: all 0.3s; cursor: pointer; }
    .supplier-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .supplier-card.inactive { opacity: 0.6; }
    .card-header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 0; }
    .supplier-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700; color: white; flex-shrink: 0; }
    .card-info { flex: 1; min-width: 0; }
    .card-info h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .supplier-rut { font-size: 0.8rem; color: rgba(255,255,255,0.4); }
    .card-body { padding: 12px 16px; }
    .card-meta { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
    .rating-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .stars { display: flex; gap: 2px; }
    .star { font-size: 1.1rem; color: rgba(255,255,255,0.15); transition: all 0.2s; }
    .star.filled { color: #f59e0b; text-shadow: 0 0 6px rgba(245,158,11,0.5); }
    .rating-value { font-size: 0.85rem; font-weight: 600; color: #f59e0b; }
    .card-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .metric { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px; text-align: center; }
    .metric-value { display: block; font-size: 1rem; font-weight: 700; color: #fff; }
    .metric-label { font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; }

    /* Ranking */
    .ranking-list { display: flex; flex-direction: column; gap: 8px; }
    .ranking-item { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; transition: all 0.2s; cursor: pointer; }
    .ranking-item:hover { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.3); }
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

    /* SLIDE OVER PANEL */
    .slide-over-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 900; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }
    .slide-over-backdrop.visible { opacity: 1; pointer-events: auto; }
    
    .slide-over-panel { position: fixed; top: 0; right: -480px; width: 480px; height: 100vh; background: linear-gradient(180deg, rgba(20,20,40,0.98) 0%, rgba(15,15,30,0.98) 100%); border-left: 1px solid rgba(255,255,255,0.1); box-shadow: -10px 0 30px rgba(0,0,0,0.5); z-index: 950; display: flex; flex-direction: column; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); backdrop-filter: blur(20px); }
    .slide-over-panel.open { right: 0; }
    
    .slide-over-header { padding: 24px 24px 0; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); }
    .slide-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header-actions-sm { display: flex; gap: 8px; }
    .slide-supplier-profile { display: flex; gap: 16px; margin-bottom: 24px; align-items: center; }
    .slide-avatar { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: white; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .slide-profile-info h2 { margin: 0 0 6px 0; font-size: 1.4rem; color: #fff; }
    .slide-rut-row { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    
    .slide-tabs { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 8px; }
    .slide-tabs button { background: transparent; border: none; color: rgba(255,255,255,0.5); padding: 8px 16px; cursor: pointer; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
    .slide-tabs button:hover { color: rgba(255,255,255,0.8); }
    .slide-tabs button.active { color: #818cf8; border-bottom-color: #6366f1; }

    .slide-over-body { flex: 1; overflow-y: auto; padding: 24px; }
    .tab-content { animation: fadeIn 0.3s ease; }
    
    .slide-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .s-kpi { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; }
    .s-kpi .lbl { font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 4px; }
    .s-kpi .val { font-size: 1.25rem; font-weight: 700; color: #fff; }

    .info-card { background: rgba(0,0,0,0.2); border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .info-card h3 { margin: 0 0 16px 0; font-size: 0.95rem; color: #818cf8; text-transform: uppercase; letter-spacing: 1px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 6px; }
    .info-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
    .i-lbl { color: rgba(255,255,255,0.5); }
    .i-val { color: #fff; font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }

    .alert-box { padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; font-size: 0.85rem; margin-bottom: 20px; }
    .alert-box.info { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: #93c5fd; }
    
    .mock-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .mock-table th { text-align: left; padding: 10px; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.1); }
    .mock-table td { padding: 12px 10px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    
    .timeline { display: flex; flex-direction: column; gap: 16px; position: relative; padding-left: 12px; }
    .timeline::before { content: ''; position: absolute; left: 16px; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.1); }
    .timeline-item { position: relative; padding-left: 24px; }
    .t-dot { position: absolute; left: 0; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #6366f1; border: 2px solid #1a1a3e; transform: translateX(-4px); }
    .t-dot.delivered { background: #10b981; }
    .t-dot.pending { background: #f59e0b; }
    .t-dot.processing { background: #3b82f6; }
    .t-content { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
    .t-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .t-title { font-weight: 600; color: #fff; font-size: 0.9rem; }
    .t-date { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .t-body { display: flex; justify-content: space-between; font-size: 0.85rem; color: rgba(255,255,255,0.6); }
    .t-status { font-weight: 600; }

    /* Modal Form UI */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 10, 25, 0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(12px); animation: fadeIn 0.3s ease; }
    .modal-content { background: linear-gradient(145deg, rgba(30,30,74,0.95), rgba(20,20,50,0.95)); border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1); border-radius: 24px; width: 95%; max-width: 800px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); position: sticky; top: 0; background: rgba(22, 22, 55, 0.9); backdrop-filter: blur(10px); z-index: 10; border-radius: 24px 24px 0 0; }
    .modal-header h2 { margin: 0; color: #fff; font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .form-body { padding: 32px; display: flex; flex-direction: column; gap: 32px; }
    .form-section { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.04); border-radius: 16px; padding: 24px; }
    .section-title { color: #818cf8; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #6366f1; border-radius: 50%; box-shadow: 0 0 10px #6366f1; }
    .form-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 16px; }
    .form-row.three-col { grid-template-columns: repeat(3, 1fr); }
    .form-row:last-child { margin-bottom: 0; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 500; }
    .form-group input, .form-group select, .form-group textarea { padding: 12px 16px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #fff; font-size: 0.95rem; font-family: inherit; transition: all 0.3s; width: 100%; box-sizing: border-box; }
    .form-group input:hover, .form-group select:hover, .form-group textarea:hover { border-color: rgba(255,255,255,0.25); background: rgba(0,0,0,0.3); }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #818cf8; background: rgba(99,102,241,0.05); }
    .form-group select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; cursor: pointer; }
    .form-group select option { background: #1e1e4a; color: #fff; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 16px; padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.08); background: rgba(22, 22, 55, 0.95); position: sticky; bottom: 0; z-index: 10; border-radius: 0 0 24px 24px; }
    .link-product-box { background: rgba(99, 102, 241, 0.1); border: 1px dashed rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .link-product-box h4 { margin: 0 0 12px; font-size: 0.9rem; color: #818cf8; font-weight: 600; }
  `]
})
export class ProveedoresComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  
  // UI State
  isGridMode = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editingSupplier = signal<Supplier | null>(null);
  searchTerm = '';
  activeTab = 'list';
  statusFilter = 'all';

  // Slide-over State
  selectedSupplier = signal<Supplier | null>(null);
  detailTab = signal<'resumen' | 'compromisos' | 'ordenes' | 'productos'>('resumen');
  supplierProducts = signal<SupplierProduct[]>([]);
  supplierOrders = signal<PurchaseOrder[]>([]);
  supplierPayables = signal<AccountPayable[]>([]);
  loadingProducts = signal(false);
  loadingOrders = signal(false);
  loadingPayables = signal(false);

  // Payable Form
  payableForm = {
    documentNumber: '',
    documentType: 'FACTURA',
    issueDate: '',
    dueDate: '',
    amount: 0
  };
  creatingPayable = signal(false);

  // Linking state
  allProducts = signal<Product[]>([]);
  linkForm = {
    productVariantId: '',
    supplierSku: '',
    lastCost: 0,
    unitOfMeasure: 'UN'
  };
  linkingProduct = signal(false);

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
    if (this.statusFilter === 'active') result = result.filter(s => s.isActive && s.status !== 'BLOCKED');
    else if (this.statusFilter === 'inactive') result = result.filter(s => !s.isActive || s.status === 'INACTIVE');
    else if (this.statusFilter === 'blocked') result = result.filter(s => s.status === 'BLOCKED');
    
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

  constructor(private supplierService: SupplierService, private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadAllProducts();
  }

  loadAllProducts(): void {
    this.catalogService.getProductsForSync().subscribe({
      next: (prods) => this.allProducts.set(prods || []),
      error: (err) => console.error('Error loading products', err)
    });
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        // Fix: Backend might not return isActive, default to true
        const rawList = Array.isArray(data) ? data : (data.content || []);
        const list = rawList.map((s: any) => ({
          ...s,
          isActive: s.isActive !== undefined ? s.isActive : true
        }));
        this.suppliers.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {}

  // Slide-over Logic
  openSupplierDetails(supplier: Supplier) {
    this.selectedSupplier.set(supplier);
    this.detailTab.set('resumen');
    this.loadSupplierProducts(supplier.id);
    this.loadSupplierOrders(supplier.id);
    this.loadSupplierPayables(supplier.id);
  }

  closeSupplierDetails() {
    this.selectedSupplier.set(null);
  }

  loadSupplierProducts(supplierId: string) {
    this.loadingProducts.set(true);
    this.supplierService.getSupplierProducts(supplierId).subscribe({
      next: (prods) => {
        this.supplierProducts.set(prods || []);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.supplierProducts.set([]);
        this.loadingProducts.set(false);
      }
    });
  }

  linkProductToSupplier() {
    const sId = this.selectedSupplier()?.id;
    if (!sId || !this.linkForm.productVariantId) return;
    this.linkingProduct.set(true);
    this.supplierService.addSupplierProduct(sId, {
      productVariantId: this.linkForm.productVariantId,
      supplierSku: this.linkForm.supplierSku,
      lastCost: this.linkForm.lastCost,
      unitOfMeasure: this.linkForm.unitOfMeasure
    }).subscribe({
      next: () => {
        this.linkForm = { productVariantId: '', supplierSku: '', lastCost: 0, unitOfMeasure: 'UN' };
        this.linkingProduct.set(false);
        this.loadSupplierProducts(sId);
      },
      error: (err) => {
        console.error('Error linking product', err);
        this.linkingProduct.set(false);
        alert('Error al vincular producto (puede que ya esté vinculado).');
      }
    });
  }

  loadSupplierOrders(supplierId: string) {
    this.loadingOrders.set(true);
    this.supplierService.getSupplierOrders(supplierId).subscribe({
      next: (orders) => {
        this.supplierOrders.set(orders || []);
        this.loadingOrders.set(false);
      },
      error: () => {
        this.supplierOrders.set([]);
        this.loadingOrders.set(false);
      }
    });
  }

  loadSupplierPayables(supplierId: string) {
    this.loadingPayables.set(true);
    this.supplierService.getSupplierPayables(supplierId).subscribe({
      next: (payables) => {
        this.supplierPayables.set(payables || []);
        this.loadingPayables.set(false);
      },
      error: () => {
        this.supplierPayables.set([]);
        this.loadingPayables.set(false);
      }
    });
  }

  createPayable() {
    const sId = this.selectedSupplier()?.id;
    if (!sId) return;
    
    this.creatingPayable.set(true);
    this.supplierService.createPayable({
      supplierId: sId,
      documentNumber: this.payableForm.documentNumber,
      documentType: this.payableForm.documentType,
      issueDate: this.payableForm.issueDate,
      dueDate: this.payableForm.dueDate,
      amount: this.payableForm.amount,
      balance: this.payableForm.amount,
      status: 'PENDING'
    }).subscribe({
      next: () => {
        this.payableForm = { documentNumber: '', documentType: 'FACTURA', issueDate: '', dueDate: '', amount: 0 };
        this.creatingPayable.set(false);
        this.loadSupplierPayables(sId);
      },
      error: (err) => {
        console.error('Error creating payable', err);
        this.creatingPayable.set(false);
      }
    });
  }

  payAccountPayable(id: string) {
    if (!confirm('¿Marcar como pagado?')) return;
    this.supplierService.payAccountPayable(id).subscribe({
      next: () => {
        const sId = this.selectedSupplier()?.id;
        if (sId) this.loadSupplierPayables(sId);
      },
      error: (err) => console.error('Error paying', err)
    });
  }

  getDaysLeft(dueDate: string): number {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }

  getPendingPayablesTotal(): number {
    return this.supplierPayables()
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getPaidPayablesTotal(): number {
    return this.supplierPayables()
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  // Form Modals
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
        next: () => {
          this.loadSuppliers();
          if (this.selectedSupplier()?.id === supplier.id) this.closeSupplierDetails();
        },
        error: (err) => console.error('Error deleting supplier', err)
      });
    }
  }

  setRating(supplier: Supplier, rating: number): void {
    this.supplierService.updateRating(supplier.id, rating).subscribe({
      next: (updated) => {
        const list = this.suppliers().map(s => s.id === updated.id ? { ...updated, isActive: s.isActive } : s);
        this.suppliers.set(list);
        if (this.selectedSupplier()?.id === updated.id) this.selectedSupplier.set({ ...updated, isActive: supplier.isActive });
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
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
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
