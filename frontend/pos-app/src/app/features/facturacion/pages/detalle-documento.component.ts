import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalle-documento',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dte-viewer-container">
      <div class="dte-paper">
        <div class="dte-header">
           <div class="logo-area">LOGO</div>
           <div class="company-info">
             <h2>Razón Social Emisor</h2>
             <p>Giro: Venta de Todo</p>
             <p>Dirección: Calle Falsa 123</p>
           </div>
           <div class="dte-folio-box">
             <h3>R.U.T.: 76.123.456-7</h3>
             <h2>FACTURA ELECTRONICA</h2>
             <h3>N° 2505</h3>
           </div>
        </div>
        
        <div class="client-info">
           <p><strong>Señor(es):</strong> Empresa Cliente SpA</p>
           <p><strong>RUT:</strong> 77.777.777-7</p>
           <p><strong>Fecha:</strong> {{ today | date:'dd/MM/yyyy' }}</p>
        </div>

        <table class="dte-items">
          <thead>
            <tr>
              <th>Cant</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Catering Evento Corporativo</td>
              <td>$126.050</td>
              <td>$126.050</td>
            </tr>
          </tbody>
        </table>

        <div class="dte-totals">
          <div class="total-row"><span>Neto:</span> <span>$126.050</span></div>
          <div class="total-row"><span>IVA (19%):</span> <span>$23.950</span></div>
          <div class="total-row final"><span>Total:</span> <span>$150.000</span></div>
        </div>

        <div class="dte-footer">
          <div class="barcode-placeholder">TIMBRE ELECTRONICO SII</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dte-viewer-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
      background: #525659;
      min-height: 100vh;
    }
    
    .dte-paper {
      background: white;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      color: #000;
      font-family: Arial, sans-serif;
    }

    .dte-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .dte-folio-box {
      border: 3px solid #cc0000;
      color: #cc0000;
      padding: 10px;
      text-align: center;
      font-weight: bold;
    }

    .dte-items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      
      th, td {
        border: 1px solid #000;
        padding: 5px;
      }
    }

    .dte-totals {
      float: right;
      width: 300px;
      margin-top: 20px;
      
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        &.final { font-weight: bold; font-size: 1.2rem; }
      }
    }
    
    .dte-footer {
        clear: both;
        margin-top: 50px;
        text-align: center;
        border: 1px dashed #ccc;
        padding: 20px;
    }
  `]
})
export class DetalleDocumentoComponent {
  today = new Date();
}
