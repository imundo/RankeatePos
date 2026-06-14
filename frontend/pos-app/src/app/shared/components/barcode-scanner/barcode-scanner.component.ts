import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scanner-modal-overlay">
      <div class="scanner-modal-content">
        <div class="scanner-header">
          <h2>📷 Escanear Código</h2>
          <button class="btn-close" (click)="close.emit()">✕</button>
        </div>
        
        <div class="scanner-body">
          <div id="reader" width="100%"></div>
          <p class="scanner-hint">Apunta la cámara al código de barras o QR del producto.</p>
        </div>
        
        <div class="scanner-footer">
          <button class="btn-cancel" (click)="close.emit()">Cancelar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scanner-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    
    .scanner-modal-content {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      width: 100%;
      max-width: 500px;
      padding: 1.5rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      color: white;
    }

    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      
      h2 {
        margin: 0;
        font-size: 1.25rem;
      }
      
      .btn-close {
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        &:hover { color: white; }
      }
    }

    .scanner-body {
      #reader {
        width: 100%;
        border: 2px solid rgba(99, 102, 241, 0.5);
        border-radius: 12px;
        overflow: hidden;
        background: black;
      }
      
      /* Style overrides for html5-qrcode inner elements */
      #reader__dashboard_section_csr span,
      #reader__dashboard_section_swaplink {
        color: white !important;
      }
      #reader button {
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 0.5rem;
      }
      
      .scanner-hint {
        text-align: center;
        color: #94a3b8;
        font-size: 0.9rem;
        margin-top: 1rem;
      }
    }

    .scanner-footer {
      margin-top: 1.5rem;
      display: flex;
      justify-content: center;
      
      .btn-cancel {
        padding: 0.75rem 2rem;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @Output() scanSuccess = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  private html5QrcodeScanner: Html5QrcodeScanner | null = null;

  ngOnInit() {
    this.html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      },
      false
    );

    this.html5QrcodeScanner.render(
      (decodedText) => {
        // Success
        this.scanSuccess.emit(decodedText);
      },
      (errorMessage) => {
        // Ignore parsing errors, it fails on every frame without a barcode
      }
    );
  }

  ngOnDestroy() {
    if (this.html5QrcodeScanner) {
      this.html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    }
  }
}
