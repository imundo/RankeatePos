import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { AuthService } from '@core/auth/auth.service';
import { CatalogService, Category, Product } from '@core/services/catalog.service';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';

interface MenuStyle {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  layout: 'modern' | 'classic' | 'minimal';
}

interface MenuConfig {
  title: string;
  subtitle: string;
  showPrices: boolean;
  showDescriptions: boolean;
  showImages: boolean;
  selectedCategories: string[];
  style: MenuStyle;
}

@Component({
  selector: 'app-menu-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastModule, ColorPickerModule],
  providers: [MessageService],
  template: `
    <div class="menu-generator-container">
      <!-- Header -->
      <header class="generator-header">
        <div class="header-left">
          <button class="btn-back" routerLink="/pos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>Generador de Carta</h1>
            <span class="subtitle">Crea tu menú digital con QR</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="generateQR()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Generar QR
          </button>
          <button class="btn-primary" (click)="exportPDF()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar PDF
          </button>
        </div>
      </header>

      <div class="generator-content">
        <!-- Sidebar Configuration -->
        <aside class="config-sidebar">
          <!-- Brand Section -->
          <div class="config-section">
            <h3 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Marca
            </h3>
            <div class="form-group">
              <label>Título del Menú</label>
              <input type="text" [(ngModel)]="config.title" placeholder="Mi Restaurante" />
            </div>
            <div class="form-group">
              <label>Subtítulo</label>
              <input type="text" [(ngModel)]="config.subtitle" placeholder="Los mejores sabores" />
            </div>
            <div class="form-group logo-upload">
              <label>Logo</label>
              <div class="logo-preview" (click)="fileInput.click()">
                @if (logoUrl()) {
                  <img [src]="logoUrl()" alt="Logo" />
                } @else {
                  <div class="upload-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Subir logo</span>
                  </div>
                }
              </div>
              <input #fileInput type="file" accept="image/*" (change)="onLogoUpload($event)" hidden />
            </div>
          </div>

          <!-- Style Section -->
          <div class="config-section">
            <h3 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/>
              </svg>
              Estilo
            </h3>
            <div class="layout-options">
              <button 
                class="layout-btn" 
                [class.active]="config.style.layout === 'modern'"
                (click)="config.style.layout = 'modern'"
              >
                <span class="layout-icon">✨</span>
                Moderno
              </button>
              <button 
                class="layout-btn" 
                [class.active]="config.style.layout === 'classic'"
                (click)="config.style.layout = 'classic'"
              >
                <span class="layout-icon">📜</span>
                Clásico
              </button>
              <button 
                class="layout-btn" 
                [class.active]="config.style.layout === 'minimal'"
                (click)="config.style.layout = 'minimal'"
              >
                <span class="layout-icon">◻️</span>
                Minimal
              </button>
            </div>
            <div class="color-pickers">
              <div class="color-picker-item">
                <label>Principal</label>
                <div class="color-preview" [style.background]="config.style.primaryColor" 
                     (click)="showColorPicker('primaryColor')">
                </div>
              </div>
              <div class="color-picker-item">
                <label>Secundario</label>
                <div class="color-preview" [style.background]="config.style.secondaryColor"
                     (click)="showColorPicker('secondaryColor')">
                </div>
              </div>
              <div class="color-picker-item">
                <label>Fondo</label>
                <div class="color-preview" [style.background]="config.style.backgroundColor"
                     (click)="showColorPicker('backgroundColor')">
                </div>
              </div>
              <div class="color-picker-item">
                <label>Acento</label>
                <div class="color-preview" [style.background]="config.style.accentColor"
                     (click)="showColorPicker('accentColor')">
                </div>
              </div>
            </div>
          </div>

          <!-- Categories Section -->
          <div class="config-section">
            <h3 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Categorías
            </h3>
            <div class="category-list">
              @for (cat of categories(); track cat.id) {
                <label class="category-checkbox">
                  <input 
                    type="checkbox" 
                    [checked]="isCategorySelected(cat.id)"
                    (change)="toggleCategory(cat.id)"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="category-name">{{ cat.nombre }}</span>
                  <span class="category-count">{{ getCategoryProductCount(cat.id) }}</span>
                </label>
              }
            </div>
            <button class="btn-select-all" (click)="selectAllCategories()">
              {{ allCategoriesSelected() ? 'Deseleccionar todo' : 'Seleccionar todo' }}
            </button>
          </div>

          <!-- Options Section -->
          <div class="config-section">
            <h3 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Opciones
            </h3>
            <label class="toggle-option">
              <input type="checkbox" [(ngModel)]="config.showPrices" />
              <span class="toggle-custom"></span>
              <span>Mostrar precios</span>
            </label>
            <label class="toggle-option">
              <input type="checkbox" [(ngModel)]="config.showDescriptions" />
              <span class="toggle-custom"></span>
              <span>Mostrar descripciones</span>
            </label>
            <label class="toggle-option">
              <input type="checkbox" [(ngModel)]="config.showImages" />
              <span class="toggle-custom"></span>
              <span>Mostrar imágenes</span>
            </label>
          </div>
        </aside>

        <!-- Preview Area -->
        <main class="preview-area">
          <div class="preview-toolbar">
            <span class="preview-label">Vista previa</span>
            <div class="preview-actions">
              <button class="preview-btn" [class.active]="previewDevice() === 'desktop'" (click)="previewDevice.set('desktop')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </button>
              <button class="preview-btn" [class.active]="previewDevice() === 'mobile'" (click)="previewDevice.set('mobile')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="preview-container" [class.mobile]="previewDevice() === 'mobile'">
            <div class="menu-preview" 
                 [class.layout-modern]="config.style.layout === 'modern'"
                 [class.layout-classic]="config.style.layout === 'classic'"
                 [class.layout-minimal]="config.style.layout === 'minimal'"
                 [style.backgroundColor]="config.style.backgroundColor"
                 [style.color]="config.style.textColor">
              
              <!-- Menu Header -->
              <div class="menu-header" [style.background]="getHeaderGradient()">
                @if (logoUrl()) {
                  <img [src]="logoUrl()" alt="Logo" class="menu-logo" />
                }
                <h1 class="menu-title">{{ config.title || tenantName() }}</h1>
                @if (config.subtitle) {
                  <p class="menu-subtitle">{{ config.subtitle }}</p>
                }
              </div>

              <!-- Menu Content -->
              <div class="menu-content">
                @for (cat of getSelectedCategories(); track cat.id) {
                  <div class="menu-category">
                    <h2 class="category-title" [style.color]="config.style.primaryColor">
                      {{ cat.nombre }}
                    </h2>
                    <div class="category-items">
                      @for (product of getProductsByCategory(cat.id); track product.id) {
                        <div class="menu-item">
                          @if (config.showImages && product.imagenUrl) {
                            <img [src]="product.imagenUrl" [alt]="product.nombre" class="item-image" />
                          }
                          <div class="item-info">
                            <div class="item-header">
                              <span class="item-name">{{ product.nombre }}</span>
                              @if (config.showPrices) {
                                <span class="item-price" [style.color]="config.style.accentColor">
                                  {{ formatPrice(product.variants?.[0]?.precioBruto || 0) }}
                                </span>
                              }
                            </div>
                            @if (config.showDescriptions && product.descripcion) {
                              <p class="item-description">{{ product.descripcion }}</p>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- QR Section -->
              <div class="menu-footer">
                <div class="qr-section" [style.borderColor]="config.style.primaryColor">
                  <div class="qr-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                  </div>
                  <span class="qr-label">Escanea para ver el menú</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- QR Modal -->
      @if (showQRModal) {
        <div class="modal-overlay" (click)="showQRModal = false">
          <div class="qr-modal" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="showQRModal = false">✕</button>
            <h2>Tu Código QR</h2>
            <div class="qr-display">
              <div class="qr-code-large">
                <canvas #qrCanvas></canvas>
              </div>
              <p class="qr-url">{{ getMenuUrl() }}</p>
            </div>
            <div class="qr-actions">
              <button class="btn-secondary" (click)="downloadQR()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar PNG
              </button>
              <button class="btn-primary" (click)="copyQRLink()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar enlace
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <p-toast position="bottom-center"></p-toast>
  `,
  styles: [`
    .menu-generator-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      display: flex;
      flex-direction: column;
    }

    .generator-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
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
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #8B5CF6, #EC4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .subtitle {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      svg { width: 18px; height: 18px; }
    }

    .btn-primary {
      background: linear-gradient(135deg, #8B5CF6, #6366F1);
      color: white;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px -4px rgba(139, 92, 246, 0.4);
      }
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      
      &:hover { background: rgba(255, 255, 255, 0.15); }
    }

    .generator-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .config-sidebar {
      width: 340px;
      background: rgba(30, 41, 59, 0.8);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      overflow-y: auto;
      padding: 1.5rem;
    }

    .config-section {
      margin-bottom: 2rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      
      svg { width: 16px; height: 16px; color: #8B5CF6; }
    }

    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.5rem;
      }
      
      input[type="text"] {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 0.9rem;
        
        &::placeholder { color: rgba(255, 255, 255, 0.3); }
        &:focus {
          outline: none;
          border-color: #8B5CF6;
        }
      }
    }

    .logo-preview {
      width: 100%;
      height: 120px;
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      overflow: hidden;
      
      &:hover { border-color: #8B5CF6; }
      
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.4);
      
      svg { width: 32px; height: 32px; }
      span { font-size: 0.8rem; }
    }

    .layout-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .layout-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      
      .layout-icon { font-size: 1.25rem; }
      
      &:hover { background: rgba(255, 255, 255, 0.1); }
      
      &.active {
        background: rgba(139, 92, 246, 0.2);
        border-color: #8B5CF6;
        color: white;
      }
    }

    .color-pickers {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .color-picker-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      
      label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .color-preview {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid rgba(255, 255, 255, 0.2);
      transition: all 0.2s;
      
      &:hover {
        transform: scale(1.1);
        border-color: white;
      }
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .category-checkbox {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      
      input { display: none; }
      
      &:hover { background: rgba(255, 255, 255, 0.08); }
    }

    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      position: relative;
      transition: all 0.2s;
      
      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        font-size: 12px;
        color: white;
        transition: transform 0.2s;
      }
    }

    .category-checkbox input:checked + .checkbox-custom {
      background: #8B5CF6;
      border-color: #8B5CF6;
      
      &::after { transform: translate(-50%, -50%) scale(1); }
    }

    .category-name {
      flex: 1;
      font-size: 0.85rem;
    }

    .category-count {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.6);
    }

    .btn-select-all {
      width: 100%;
      margin-top: 0.75rem;
      padding: 0.6rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }

    .toggle-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0;
      cursor: pointer;
      
      input { display: none; }
      
      span:last-child {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .toggle-custom {
      width: 40px;
      height: 22px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 11px;
      position: relative;
      transition: all 0.2s;
      
      &::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        transition: all 0.2s;
      }
    }

    .toggle-option input:checked + .toggle-custom {
      background: #8B5CF6;
      
      &::after { left: 20px; }
    }

    .preview-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .preview-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: rgba(30, 41, 59, 0.6);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .preview-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .preview-actions {
      display: flex;
      gap: 0.25rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 4px;
    }

    .preview-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      svg { width: 18px; height: 18px; }
      
      &:hover { color: white; }
      &.active { background: rgba(139, 92, 246, 0.3); color: white; }
    }

    .preview-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: auto;
      
      &.mobile {
        .menu-preview {
          width: 375px;
          max-width: 100%;
        }
      }
    }

    .menu-preview {
      width: 100%;
      max-width: 800px;
      min-height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      color: #1a1a1a;
    }

    .menu-header {
      padding: 2.5rem 2rem;
      text-align: center;
      color: white;
      
      .menu-logo {
        width: 80px;
        height: 80px;
        object-fit: contain;
        margin-bottom: 1rem;
        border-radius: 12px;
      }
      
      .menu-title {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
      }
      
      .menu-subtitle {
        margin: 0.5rem 0 0;
        opacity: 0.9;
        font-size: 1rem;
      }
    }

    .menu-content {
      padding: 2rem;
    }

    .menu-category {
      margin-bottom: 2rem;
      
      .category-title {
        margin: 0 0 1rem;
        font-size: 1.25rem;
        font-weight: 600;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid currentColor;
      }
    }

    .category-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .menu-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 8px;
      transition: background 0.2s;
      
      &:hover { background: rgba(0, 0, 0, 0.03); }
      
      .item-image {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
      }
      
      .item-info { flex: 1; }
      
      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .item-name {
        font-weight: 500;
        font-size: 0.95rem;
      }
      
      .item-price {
        font-weight: 600;
        white-space: nowrap;
      }
      
      .item-description {
        margin: 0.35rem 0 0;
        font-size: 0.8rem;
        color: #666;
        line-height: 1.4;
      }
    }

    .menu-footer {
      padding: 2rem;
      background: rgba(0, 0, 0, 0.02);
      display: flex;
      justify-content: center;
    }

    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 2px dashed;
      border-radius: 12px;
      
      .qr-placeholder {
        width: 80px;
        height: 80px;
        opacity: 0.3;
        
        svg { width: 100%; height: 100%; }
      }
      
      .qr-label {
        font-size: 0.75rem;
        color: #666;
      }
    }

    /* Layout Variations */
    .layout-classic {
      .menu-header {
        background: #2c2c2c !important;
        
        .menu-title { font-family: Georgia, serif; }
      }
      
      .menu-item {
        border-bottom: 1px dotted #ddd;
        border-radius: 0;
        padding: 0.75rem 0;
      }
    }

    .layout-minimal {
      .menu-header {
        padding: 3rem 2rem;
        background: white !important;
        color: #1a1a1a;
        border-bottom: 1px solid #eee;
      }
      
      .category-title {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        border-bottom: 1px solid #ddd !important;
      }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .qr-modal {
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(30, 41, 59, 0.9));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      position: relative;
      max-width: 400px;
      width: 90%;
      
      h2 {
        margin: 0 0 1.5rem;
        font-size: 1.5rem;
      }
    }

    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      
      &:hover { background: rgba(255, 255, 255, 0.2); }
    }

    .qr-display {
      margin-bottom: 1.5rem;
    }

    .qr-code-large {
      width: 200px;
      height: 200px;
      margin: 0 auto 1rem;
      background: white;
      padding: 1rem;
      border-radius: 12px;
      
      svg { width: 100%; height: 100%; }
    }

    .qr-url {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
    }

    .qr-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
  `]
})
export class MenuGeneratorComponent implements OnInit {
  private authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private messageService = inject(MessageService);

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  // State
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  logoUrl = signal<string>('');
  previewDevice = signal<'desktop' | 'mobile'>('desktop');
  showQRModal = false;
  qrDataUrl = signal<string>('');

  tenantName = computed(() => this.authService.tenant()?.nombre || 'Mi Restaurante');

  config: MenuConfig = {
    title: '',
    subtitle: '',
    showPrices: true,
    showDescriptions: true,
    showImages: true,
    selectedCategories: [],
    style: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      backgroundColor: '#ffffff',
      textColor: '#1a1a1a',
      accentColor: '#10B981',
      fontFamily: 'Inter, sans-serif',
      layout: 'modern'
    }
  };

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.config.title = this.tenantName();
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        // Select all by default
        this.config.selectedCategories = cats.map(c => c.id);
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadProducts(): void {
    this.catalogService.getProducts().subscribe({
      next: (response: any) => {
        const prods = response.content || response || [];
        this.products.set(prods);
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  isCategorySelected(catId: string): boolean {
    return this.config.selectedCategories.includes(catId);
  }

  toggleCategory(catId: string): void {
    const idx = this.config.selectedCategories.indexOf(catId);
    if (idx > -1) {
      this.config.selectedCategories.splice(idx, 1);
    } else {
      this.config.selectedCategories.push(catId);
    }
  }

  selectAllCategories(): void {
    if (this.allCategoriesSelected()) {
      this.config.selectedCategories = [];
    } else {
      this.config.selectedCategories = this.categories().map(c => c.id);
    }
  }

  allCategoriesSelected(): boolean {
    return this.config.selectedCategories.length === this.categories().length;
  }

  getCategoryProductCount(catId: string): number {
    return this.products().filter(p => p.categoryId === catId).length;
  }

  getSelectedCategories(): Category[] {
    return this.categories().filter(c => this.config.selectedCategories.includes(c.id));
  }

  getProductsByCategory(catId: string): Product[] {
    return this.products().filter(p => p.categoryId === catId);
  }

  getHeaderGradient(): string {
    return `linear-gradient(135deg, ${this.config.style.primaryColor}, ${this.config.style.secondaryColor})`;
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  showColorPicker(colorKey: string): void {
    // For now, cycle through preset colors
    const presets: Record<string, string[]> = {
      primaryColor: ['#8B5CF6', '#6366F1', '#3B82F6', '#0EA5E9', '#EC4899', '#F43F5E'],
      secondaryColor: ['#EC4899', '#F43F5E', '#8B5CF6', '#6366F1', '#10B981', '#F59E0B'],
      backgroundColor: ['#ffffff', '#FAFAFA', '#F5F5F4', '#1a1a1a', '#0f172a'],
      accentColor: ['#10B981', '#F59E0B', '#EC4899', '#6366F1', '#EF4444']
    };

    const colors = presets[colorKey] || [];
    const currentIdx = colors.indexOf((this.config.style as any)[colorKey]);
    const nextIdx = (currentIdx + 1) % colors.length;
    (this.config.style as any)[colorKey] = colors[nextIdx];
  }

  getMenuUrl(): string {
    const slug = this.tenantName().toLowerCase().replace(/\s+/g, '-');
    return `menu.rankeatepos.cl/${slug}`;
  }

  async generateQR(): Promise<void> {
    this.showQRModal = true;

    // Wait for canvas to be available
    setTimeout(async () => {
      if (this.qrCanvas?.nativeElement) {
        const url = `https://${this.getMenuUrl()}`;
        await QRCode.toCanvas(this.qrCanvas.nativeElement, url, {
          width: 200,
          margin: 2,
          color: { dark: '#1a1a1a', light: '#ffffff' }
        });
        this.qrDataUrl.set(this.qrCanvas.nativeElement.toDataURL('image/png'));
      }
    }, 100);
  }

  downloadQR(): void {
    if (this.qrDataUrl()) {
      const link = document.createElement('a');
      link.download = `menu-qr-${this.tenantName().toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = this.qrDataUrl();
      link.click();

      this.messageService.add({
        severity: 'success',
        summary: 'QR Descargado',
        detail: 'El código QR se guardó en tu dispositivo',
        life: 3000
      });
    }
  }

  copyQRLink(): void {
    const link = `https://${this.getMenuUrl()}`;
    navigator.clipboard?.writeText(link);
    this.messageService.add({
      severity: 'success',
      summary: 'Enlace copiado',
      detail: 'El enlace fue copiado al portapapeles',
      life: 3000
    });
  }

  exportPDF(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Generando PDF',
      detail: 'Tu carta se está exportando...',
      life: 3000
    });

    const doc = new jsPDF();
    const title = this.config.title || this.tenantName();
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, yPos, { align: 'center' });
    yPos += 10;

    if (this.config.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text(this.config.subtitle, 105, yPos, { align: 'center' });
      yPos += 15;
    } else {
      yPos += 10;
    }

    // Line separator
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;

    // Categories and products
    this.getSelectedCategories().forEach(category => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Category name
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text(category.nombre, 20, yPos);
      yPos += 8;

      // Products
      doc.setTextColor(0, 0, 0);
      const products = this.getProductsByCategory(category.id);

      products.forEach(product => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(product.nombre, 25, yPos);

        if (this.config.showPrices && product.variants?.length) {
          const price = this.formatPrice(product.variants[0].precioBruto || 0);
          doc.setFont('helvetica', 'normal');
          doc.text(price, 190, yPos, { align: 'right' });
        }
        yPos += 5;

        if (this.config.showDescriptions && product.descripcion) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          const lines = doc.splitTextToSize(product.descripcion, 150);
          doc.text(lines, 25, yPos);
          yPos += lines.length * 4;
          doc.setTextColor(0, 0, 0);
        }
        yPos += 3;
      });
      yPos += 8;
    });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado por RankeatePos - ${new Date().toLocaleDateString('es-CL')}`, 105, 285, { align: 'center' });

    // Save
    doc.save(`carta-${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);

    this.messageService.add({
      severity: 'success',
      summary: 'PDF Generado',
      detail: 'La carta fue exportada exitosamente',
      life: 3000
    });
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
