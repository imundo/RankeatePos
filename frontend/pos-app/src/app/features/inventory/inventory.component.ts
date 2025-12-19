import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { StockService, StockDto, StockMovementDto, TipoMovimiento, StockAdjustmentRequest } from '@core/services/stock.service';
import { CatalogService, Product } from '@core/services/catalog.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="inventory-container">
      <header class="inventory-header">
        <div class="header-left">
          <button class="btn-icon" routerLink="/pos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>📦 Inventario</h1>
            <span class="subtitle">Control de stock y movimientos</span>
          </div>
        </div>
        <button class="btn-primary" (click)="openAdjustModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Ajustar Stock
        </button>
      </header>

      <!-- Stats Cards -->
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-value">{{ stock().length }}</span>
          <span class="stat-label">Productos</span>
        </div>
        <div class="stat-card warning" (click)="activeTab = 'low'; loadLowStock()">
          <span class="stat-value">{{ lowStockCount() }}</span>
          <span class="stat-label">Stock Bajo</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ movements().length }}</span>
          <span class="stat-label">Movimientos</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button 
          class="tab"
          [class.active]="activeTab === 'stock'"
          (click)="activeTab = 'stock'">
          📦 Stock Actual
        </button>
        <button 
          class="tab"
          [class.active]="activeTab === 'low'"
          (click)="activeTab = 'low'; loadLowStock()">
          ⚠️ Stock Bajo
          @if (lowStockCount() > 0) {
            <span class="badge">{{ lowStockCount() }}</span>
          }
        </button>
        <button 
          class="tab"
          [class.active]="activeTab === 'movements'"
          (click)="activeTab = 'movements'; loadMovements()">
          📋 Movimientos
        </button>
      </div>

      <!-- Search -->
      <div class="search-container">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          placeholder="Buscar por nombre o SKU..."
        />
        @if (searchQuery) {
          <button class="clear-btn" (click)="searchQuery = ''">✕</button>
        }
      </div>

      <!-- Stock List -->
      @if (activeTab === 'stock' || activeTab === 'low') {
        <div class="stock-list">
          @for (item of filteredStock(); track item.id) {
            <div class="stock-card" [class.low]="item.stockBajo" (click)="selectStock(item)">
              <div class="stock-icon" [class.warning]="item.stockBajo">
                {{ item.stockBajo ? '⚠️' : '📦' }}
              </div>
              <div class="stock-info">
                <h3>{{ item.productName }}</h3>
                <span class="sku">SKU: {{ item.variantSku }}</span>
              </div>
              <div class="stock-qty" [class.warning]="item.stockBajo">
                <span class="qty-value">{{ item.cantidadDisponible }}</span>
                <span class="qty-label">disponible</span>
              </div>
              <div class="stock-meta">
                <span class="min">Mín: {{ item.stockMinimo }}</span>
                @if (item.cantidadReservada > 0) {
                  <span class="reserved">Reservado: {{ item.cantidadReservada }}</span>
                }
              </div>
              <button class="btn-icon-sm" (click)="openAdjustModalForStock(item, $event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>
          }

          @if (filteredStock().length === 0 && !loading()) {
            <div class="empty-state">
              <span class="empty-icon">{{ activeTab === 'low' ? '✅' : '📭' }}</span>
              <h3>{{ activeTab === 'low' ? '¡Excelente!' : 'Sin datos de stock' }}</h3>
              <p>{{ activeTab === 'low' ? 'No hay productos con stock bajo' : 'Agrega productos al catálogo' }}</p>
            </div>
          }
        </div>
      }

      <!-- Movements List -->
      @if (activeTab === 'movements') {
        <div class="movements-list">
          @for (mov of filteredMovements(); track mov.id) {
            <div class="movement-card">
              <div class="movement-icon" [class]="getMovementClass(mov.tipo)">
                {{ getMovementIcon(mov.tipo) }}
              </div>
              <div class="movement-info">
                <h3>{{ mov.productName }}</h3>
                <span class="movement-type">{{ formatMovementType(mov.tipo) }}</span>
                @if (mov.motivo) {
                  <span class="movement-reason">{{ mov.motivo }}</span>
                }
              </div>
              <div class="movement-qty" [class]="getMovementClass(mov.tipo)">
                {{ isPositive(mov.tipo) ? '+' : '-' }}{{ mov.cantidad }}
              </div>
              <div class="movement-meta">
                <span class="stock-change">{{ mov.stockAnterior }} → {{ mov.stockNuevo }}</span>
                <span class="time">{{ formatDate(mov.createdAt) }}</span>
              </div>
            </div>
          }

          @if (filteredMovements().length === 0 && !loading()) {
            <div class="empty-state">
              <span class="empty-icon">📋</span>
              <h3>Sin movimientos</h3>
              <p>Los movimientos de stock aparecerán aquí</p>
            </div>
          }
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando...</span>
        </div>
      }

      <!-- Adjust Modal -->
      @if (showAdjustModal) {
        <div class="modal-overlay" (click)="closeAdjustModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Ajustar Stock</h2>
              <button class="modal-close" (click)="closeAdjustModal()">✕</button>
            </div>
            
            <!-- Product Selection -->
            @if (!selectedStockItem) {
              <div class="form-group">
                <label>Buscar Producto</label>
                <input 
                  type="text" 
                  [(ngModel)]="productSearch"
                  placeholder="Escribe para buscar..."
                  (input)="searchProducts()"
                />
              </div>
              
              @if (searchedProducts().length > 0) {
                <div class="product-results">
                  @for (item of searchedProducts(); track item.id) {
                    <div class="product-result" (click)="selectProduct(item)">
                      <span class="product-name">{{ item.productName }}</span>
                      <span class="product-sku">{{ item.variantSku }}</span>
                      <span class="product-stock">Stock: {{ item.cantidadDisponible }}</span>
                    </div>
                  }
                </div>
              }
            } @else {
              <!-- Selected Product -->
              <div class="selected-product">
                <div class="product-info">
                  <h3>{{ selectedStockItem.productName }}</h3>
                  <span class="sku">{{ selectedStockItem.variantSku }}</span>
                </div>
                <div class="current-stock">
                  <span class="label">Stock actual:</span>
                  <span class="value">{{ selectedStockItem.cantidadDisponible }}</span>
                </div>
                <button class="btn-change" (click)="selectedStockItem = null">Cambiar</button>
              </div>
              
              <div class="form-group">
                <label>Tipo de Movimiento</label>
                <div class="movement-buttons">
                  <button 
                    class="movement-btn entrada"
                    [class.active]="adjustForm.tipo === 'ENTRADA'"
                    (click)="adjustForm.tipo = 'ENTRADA'">
                    📥 Entrada
                  </button>
                  <button 
                    class="movement-btn salida"
                    [class.active]="adjustForm.tipo === 'SALIDA'"
                    (click)="adjustForm.tipo = 'SALIDA'">
                    📤 Salida
                  </button>
                  <button 
                    class="movement-btn ajuste"
                    [class.active]="adjustForm.tipo === 'AJUSTE_POSITIVO'"
                    (click)="adjustForm.tipo = 'AJUSTE_POSITIVO'">
                    ➕ Ajuste +
                  </button>
                  <button 
                    class="movement-btn merma"
                    [class.active]="adjustForm.tipo === 'MERMA'"
                    (click)="adjustForm.tipo = 'MERMA'">
                    🗑️ Merma
                  </button>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Cantidad</label>
                  <input type="number" [(ngModel)]="adjustForm.cantidad" min="1" placeholder="0">
                </div>
                <div class="form-group">
                  <label>Nuevo Stock</label>
                  <input type="text" [value]="calculateNewStock()" readonly class="readonly">
                </div>
              </div>
              
              <div class="form-group">
                <label>Motivo / Nota</label>
                <input type="text" [(ngModel)]="adjustForm.motivo" placeholder="Razón del ajuste...">
              </div>

              <div class="form-group">
                <label>Documento de Referencia (opcional)</label>
                <input type="text" [(ngModel)]="adjustForm.documentoReferencia" placeholder="Ej: Factura #123">
              </div>
            }
            
            <div class="modal-actions">
              <button class="btn-cancel" (click)="closeAdjustModal()">Cancelar</button>
              <button 
                class="btn-confirm" 
                (click)="submitAdjustment()"
                [disabled]="!canSubmitAdjustment()">
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Success Toast -->
      @if (showToast) {
        <div class="toast" [class]="toastType">
          <span>{{ toastMessage }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .inventory-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .inventory-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: transparent;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      svg { width: 20px; height: 20px; }
      
      &:hover { background: rgba(255, 255, 255, 0.1); }
    }

    .header-title {
      h1 { margin: 0; font-size: 1.5rem; }
      .subtitle { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      svg { width: 18px; height: 18px; }
      
      &:hover {
        box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
      }
    }

    .stats-bar {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      overflow-x: auto;
    }

    .stat-card {
      flex: 1;
      min-width: 100px;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover { border-color: rgba(99, 102, 241, 0.5); }
      
      &.warning {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.1);
        
        .stat-value { color: #f59e0b; }
      }
      
      .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #10B981;
      }
      
      .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      padding: 0 1.5rem 1rem;
      overflow-x: auto;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      
      .badge {
        padding: 0.15rem 0.5rem;
        background: #f59e0b;
        border-radius: 999px;
        font-size: 0.7rem;
        color: white;
      }
      
      &.active {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        border-color: transparent;
        color: white;
      }
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 1.5rem 1rem;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      
      svg {
        width: 20px;
        height: 20px;
        color: rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
      }
      
      input {
        flex: 1;
        background: transparent;
        border: none;
        color: white;
        font-size: 1rem;
        outline: none;
        
        &::placeholder { color: rgba(255, 255, 255, 0.4); }
      }
      
      .clear-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        
        &:hover { background: rgba(255, 255, 255, 0.2); }
      }
    }

    .stock-list, .movements-list {
      padding: 0 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .stock-card, .movement-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(99, 102, 241, 0.3);
      }
      
      &.low {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.1);
      }
    }

    .stock-icon, .movement-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 12px;
      font-size: 1.5rem;
      
      &.warning { background: rgba(245, 158, 11, 0.15); }
      &.positive { background: rgba(16, 185, 129, 0.15); }
      &.negative { background: rgba(239, 68, 68, 0.15); }
    }

    .stock-info, .movement-info {
      flex: 1;
      min-width: 0;
      
      h3 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .sku, .movement-type {
        display: block;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .movement-reason {
        display: block;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
        font-style: italic;
      }
    }

    .stock-qty {
      text-align: right;
      
      .qty-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #10B981;
      }
      
      .qty-label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
      }
      
      &.warning .qty-value { color: #f59e0b; }
    }

    .movement-qty {
      font-size: 1.25rem;
      font-weight: 700;
      
      &.positive { color: #10B981; }
      &.negative { color: #EF4444; }
    }

    .stock-meta, .movement-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      
      .min { color: rgba(255, 255, 255, 0.4); }
      .reserved { color: #f59e0b; }
      .time { font-size: 0.7rem; }
    }

    .btn-icon-sm {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg { width: 16px; height: 16px; }
      
      &:hover {
        background: rgba(99, 102, 241, 0.3);
        color: white;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      color: rgba(255, 255, 255, 0.5);
      
      .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
      h3 { margin: 0; color: white; }
      p { margin: 0.5rem 0 0; }
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      z-index: 1000;
      
      span { color: rgba(255, 255, 255, 0.7); }
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #6366F1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }

    .modal-content {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 1.5rem;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      animation: modalIn 0.2s ease-out;
    }

    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      h2 { margin: 0; font-size: 1.25rem; }
    }

    .modal-close {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      
      &:hover { background: rgba(255, 255, 255, 0.2); }
    }

    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
      }
      
      input, select {
        width: 100%;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #6366F1;
        }
        
        &.readonly {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10B981;
          font-weight: 700;
        }
      }
      
      select option { background: #1e293b; }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .product-results {
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }

    .product-result {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover { background: rgba(255, 255, 255, 0.1); }
      
      &:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .product-name { flex: 1; font-weight: 500; }
      .product-sku { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
      .product-stock { font-size: 0.8rem; color: #10B981; }
    }

    .selected-product {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      margin-bottom: 1rem;
      
      .product-info {
        flex: 1;
        
        h3 { margin: 0 0 0.25rem; font-size: 1rem; }
        .sku { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
      }
      
      .current-stock {
        text-align: right;
        
        .label { display: block; font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
        .value { font-size: 1.25rem; font-weight: 700; color: #10B981; }
      }
      
      .btn-change {
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
        cursor: pointer;
        
        &:hover { background: rgba(255, 255, 255, 0.1); }
      }
    }

    .movement-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .movement-btn {
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover { background: rgba(255, 255, 255, 0.1); }
      
      &.active {
        border-color: transparent;
        
        &.entrada {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
        }
        &.salida {
          background: rgba(59, 130, 246, 0.2);
          color: #3B82F6;
        }
        &.ajuste {
          background: rgba(99, 102, 241, 0.2);
          color: #818CF8;
        }
        &.merma {
          background: rgba(239, 68, 68, 0.2);
          color: #EF4444;
        }
      }
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn-cancel {
      flex: 1;
      padding: 0.875rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover { background: rgba(255, 255, 255, 0.1); }
    }

    .btn-confirm {
      flex: 1;
      padding: 0.875rem;
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.4);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 1rem 1.5rem;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      z-index: 2000;
      animation: toastIn 0.3s ease-out;
      
      &.success { background: linear-gradient(135deg, #10B981, #059669); }
      &.error { background: linear-gradient(135deg, #EF4444, #DC2626); }
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @media (max-width: 640px) {
      .stats-bar { flex-wrap: wrap; }
      .stat-card { min-width: calc(50% - 0.5rem); }
      .form-row { grid-template-columns: 1fr; }
      .movement-buttons { grid-template-columns: 1fr; }
    }
  `]
})
export class InventoryComponent implements OnInit {
  private authService = inject(AuthService);
  private stockService = inject(StockService);
  private catalogService = inject(CatalogService);

  stock = signal<StockDto[]>([]);
  lowStock = signal<StockDto[]>([]);
  movements = signal<StockMovementDto[]>([]);
  loading = signal(false);
  lowStockCount = signal(0);

  activeTab: 'stock' | 'low' | 'movements' = 'stock';
  searchQuery = '';
  productSearch = '';
  searchedProducts = signal<StockDto[]>([]);

  showAdjustModal = false;
  selectedStockItem: StockDto | null = null;

  adjustForm = {
    tipo: 'ENTRADA' as TipoMovimiento,
    cantidad: 1,
    motivo: '',
    documentoReferencia: ''
  };

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  filteredStock = computed(() => {
    const items = this.activeTab === 'low' ? this.lowStock() : this.stock();
    if (!this.searchQuery.trim()) return items;

    const q = this.searchQuery.toLowerCase();
    return items.filter(s =>
      s.productName.toLowerCase().includes(q) ||
      s.variantSku.toLowerCase().includes(q)
    );
  });

  filteredMovements = computed(() => {
    if (!this.searchQuery.trim()) return this.movements();

    const q = this.searchQuery.toLowerCase();
    return this.movements().filter(m =>
      m.productName.toLowerCase().includes(q) ||
      m.variantSku.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadStock();
    this.loadLowStockCount();
  }

  async loadStock() {
    this.loading.set(true);
    try {
      const branchId = this.authService.tenant()?.id || '';
      const data = await this.stockService.getStockByBranch(branchId).toPromise();
      this.stock.set(data || []);
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadLowStock() {
    this.loading.set(true);
    try {
      const branchId = this.authService.tenant()?.id || '';
      const data = await this.stockService.getLowStock(branchId).toPromise();
      this.lowStock.set(data || []);
    } catch (error) {
      console.error('Error loading low stock:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadLowStockCount() {
    try {
      const count = await this.stockService.countLowStock().toPromise();
      this.lowStockCount.set(count || 0);
    } catch (error) {
      console.error('Error loading low stock count:', error);
    }
  }

  async loadMovements() {
    this.loading.set(true);
    try {
      const branchId = this.authService.tenant()?.id || '';
      const response = await this.stockService.getMovements(branchId).toPromise();
      this.movements.set(response?.content || []);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      this.loading.set(false);
    }
  }

  openAdjustModal() {
    this.selectedStockItem = null;
    this.productSearch = '';
    this.searchedProducts.set([]);
    this.adjustForm = {
      tipo: 'ENTRADA',
      cantidad: 1,
      motivo: '',
      documentoReferencia: ''
    };
    this.showAdjustModal = true;
  }

  openAdjustModalForStock(item: StockDto, event: Event) {
    event.stopPropagation();
    this.selectedStockItem = item;
    this.adjustForm = {
      tipo: 'ENTRADA',
      cantidad: 1,
      motivo: '',
      documentoReferencia: ''
    };
    this.showAdjustModal = true;
  }

  closeAdjustModal() {
    this.showAdjustModal = false;
    this.selectedStockItem = null;
  }

  selectStock(item: StockDto) {
    // Could show details or open adjust modal
  }

  selectProduct(item: StockDto) {
    this.selectedStockItem = item;
    this.productSearch = '';
    this.searchedProducts.set([]);
  }

  searchProducts() {
    if (!this.productSearch.trim()) {
      this.searchedProducts.set([]);
      return;
    }

    const q = this.productSearch.toLowerCase();
    const results = this.stock().filter(s =>
      s.productName.toLowerCase().includes(q) ||
      s.variantSku.toLowerCase().includes(q)
    ).slice(0, 10);

    this.searchedProducts.set(results);
  }

  calculateNewStock(): string {
    if (!this.selectedStockItem) return '-';

    const current = this.selectedStockItem.cantidadDisponible;
    const qty = this.adjustForm.cantidad || 0;

    let newStock: number;
    if (this.isPositive(this.adjustForm.tipo)) {
      newStock = current + qty;
    } else {
      newStock = current - qty;
    }

    return `${newStock} unidades`;
  }

  canSubmitAdjustment(): boolean {
    return !!(this.selectedStockItem && this.adjustForm.cantidad > 0);
  }

  async submitAdjustment() {
    if (!this.selectedStockItem || !this.canSubmitAdjustment()) return;

    const branchId = this.authService.tenant()?.id || '';

    const request: StockAdjustmentRequest = {
      variantId: this.selectedStockItem.variantId,
      branchId: branchId,
      tipo: this.adjustForm.tipo,
      cantidad: this.adjustForm.cantidad,
      motivo: this.adjustForm.motivo || undefined,
      documentoReferencia: this.adjustForm.documentoReferencia || undefined
    };

    this.loading.set(true);
    try {
      await this.stockService.adjustStock(request).toPromise();
      this.showNotification('Stock ajustado correctamente', 'success');
      this.closeAdjustModal();
      this.loadStock();
      this.loadLowStockCount();
      if (this.activeTab === 'movements') {
        this.loadMovements();
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      this.showNotification('Error al ajustar stock', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getMovementIcon(tipo: TipoMovimiento): string {
    const icons: Record<TipoMovimiento, string> = {
      'ENTRADA': '📥',
      'SALIDA': '📤',
      'AJUSTE_POSITIVO': '➕',
      'AJUSTE_NEGATIVO': '➖',
      'TRANSFERENCIA_ENTRADA': '⬇️',
      'TRANSFERENCIA_SALIDA': '⬆️',
      'DEVOLUCION': '↩️',
      'MERMA': '🗑️'
    };
    return icons[tipo] || '📦';
  }

  getMovementClass(tipo: TipoMovimiento): string {
    return this.isPositive(tipo) ? 'positive' : 'negative';
  }

  isPositive(tipo: TipoMovimiento): boolean {
    return ['ENTRADA', 'AJUSTE_POSITIVO', 'TRANSFERENCIA_ENTRADA', 'DEVOLUCION'].includes(tipo);
  }

  formatMovementType(tipo: TipoMovimiento): string {
    const names: Record<TipoMovimiento, string> = {
      'ENTRADA': 'Entrada de stock',
      'SALIDA': 'Salida de stock',
      'AJUSTE_POSITIVO': 'Ajuste positivo',
      'AJUSTE_NEGATIVO': 'Ajuste negativo',
      'TRANSFERENCIA_ENTRADA': 'Transferencia entrada',
      'TRANSFERENCIA_SALIDA': 'Transferencia salida',
      'DEVOLUCION': 'Devolución',
      'MERMA': 'Merma'
    };
    return names[tipo] || tipo;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
