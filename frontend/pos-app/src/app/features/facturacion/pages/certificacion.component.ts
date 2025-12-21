import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface TestCase {
  numero: number;
  nombre: string;
  descripcion: string;
  tipoDte: string;
  codigoSii: number;
  folio: number;
  montoTotal: number;
  resultadoEsperado: string;
  valido: boolean;
  trackId: string;
  estadoSii: string;
  errorMessage: string;
}

interface Requisito {
  tipo: string;
  codigo: number;
  cantidad_minima: number;
}

@Component({
  selector: 'app-certificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="cert-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>🏆 Certificación SII</h1>
          <p class="subtitle">Proceso de certificación para ambiente de producción</p>
        </div>
      </header>

      <!-- Estado actual -->
      <div class="status-banner" [class]="estadoCertificacion()">
        <div class="status-icon">
          @switch (estadoCertificacion()) {
            @case ('PENDIENTE') { <span>⏳</span> }
            @case ('EN_PROCESO') { <span>🔄</span> }
            @case ('APROBADO') { <span>✅</span> }
            @case ('RECHAZADO') { <span>❌</span> }
          }
        </div>
        <div class="status-content">
          <h2>{{ getStatusTitle() }}</h2>
          <p>{{ getStatusDescription() }}</p>
        </div>
        @if (estadoCertificacion() === 'APROBADO') {
          <button class="btn-success" (click)="activarProduccion()">
            🚀 Activar Producción
          </button>
        }
      </div>

      <!-- Pasos del proceso -->
      <section class="steps-section">
        <h2>📋 Pasos del proceso</h2>
        <div class="steps-timeline">
          <div class="step" [class.completed]="paso() >= 1" [class.active]="paso() === 1">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Verificar Configuración</h3>
              <p>Datos de empresa, certificado digital y CAFs</p>
              @if (paso() === 1) {
                <button class="btn-primary" (click)="verificarConfiguracion()">
                  Verificar
                </button>
              } @else if (paso() > 1) {
                <span class="check">✓ Completado</span>
              }
            </div>
          </div>

          <div class="step" [class.completed]="paso() >= 2" [class.active]="paso() === 2">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Generar Set de Pruebas</h3>
              <p>10 documentos de diferentes tipos</p>
              @if (paso() === 2) {
                <button class="btn-primary" (click)="generarSetPruebas()">
                  Generar Set
                </button>
              } @else if (paso() > 2) {
                <span class="check">✓ {{ testCases().length }} documentos</span>
              }
            </div>
          </div>

          <div class="step" [class.completed]="paso() >= 3" [class.active]="paso() === 3">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Enviar al SII</h3>
              <p>Ambiente de certificación (Maullin)</p>
              @if (paso() === 3) {
                <button class="btn-primary" (click)="enviarAlSii()" [disabled]="enviando()">
                  @if (enviando()) {
                    <span class="spinner"></span> Enviando...
                  } @else {
                    Enviar Documentos
                  }
                </button>
              } @else if (paso() > 3) {
                <span class="check">✓ Enviados</span>
              }
            </div>
          </div>

          <div class="step" [class.completed]="paso() >= 4" [class.active]="paso() === 4">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>Verificar Resultados</h3>
              <p>Validar respuesta del SII</p>
              @if (paso() === 4) {
                <button class="btn-primary" (click)="verificarResultados()">
                  Verificar
                </button>
              } @else if (paso() > 4) {
                <span class="check">✓ Aprobado</span>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Requisitos -->
      <section class="requisitos-section">
        <h2>📝 Requisitos de Certificación</h2>
        <div class="requisitos-grid">
          <div class="requisito-card" [class.check]="configCompleta()">
            <span class="req-icon">{{ configCompleta() ? '✓' : '○' }}</span>
            <div>
              <strong>Configuración Empresa</strong>
              <p>RUT, razón social, giro, dirección</p>
            </div>
          </div>
          <div class="requisito-card" [class.check]="tieneCertificado()">
            <span class="req-icon">{{ tieneCertificado() ? '✓' : '○' }}</span>
            <div>
              <strong>Certificado Digital</strong>
              <p>Archivo .pfx válido y vigente</p>
            </div>
          </div>
          <div class="requisito-card" [class.check]="tieneCafs()">
            <span class="req-icon">{{ tieneCafs() ? '✓' : '○' }}</span>
            <div>
              <strong>CAFs de Prueba</strong>
              <p>Del ambiente Maullin (certificación)</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Set de pruebas -->
      @if (testCases().length > 0) {
        <section class="testcases-section">
          <h2>🧪 Set de Pruebas</h2>
          <div class="testcases-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Folio</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Track ID</th>
                </tr>
              </thead>
              <tbody>
                @for (tc of testCases(); track tc.numero) {
                  <tr [class.success]="tc.valido" [class.error]="tc.errorMessage">
                    <td>{{ tc.numero }}</td>
                    <td>
                      <strong>{{ tc.nombre }}</strong>
                      <span class="desc">{{ tc.descripcion }}</span>
                    </td>
                    <td>
                      <span class="badge">{{ tc.tipoDte }}</span>
                    </td>
                    <td>{{ tc.folio }}</td>
                    <td>{{ formatCurrency(tc.montoTotal) }}</td>
                    <td>
                      @if (tc.estadoSii) {
                        <span class="status" [class]="tc.estadoSii.toLowerCase()">
                          {{ tc.estadoSii }}
                        </span>
                      } @else {
                        <span class="status pending">Pendiente</span>
                      }
                    </td>
                    <td>
                      <code>{{ tc.trackId || '—' }}</code>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Resultados -->
          @if (resultado()) {
            <div class="resultado-card" [class.success]="resultado()!.exito" [class.error]="!resultado()!.exito">
              <div class="resultado-header">
                <span class="resultado-icon">{{ resultado()!.exito ? '✅' : '❌' }}</span>
                <div>
                  <h3>{{ resultado()!.mensaje }}</h3>
                  <p>{{ resultado()!.pasaron }}/{{ resultado()!.total }} casos pasaron</p>
                </div>
              </div>
              @if (resultado()!.errores && resultado()!.errores.length > 0) {
                <div class="errores-list">
                  <h4>Errores encontrados:</h4>
                  <ul>
                    @for (error of resultado()!.errores; track $index) {
                      <li>{{ error }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </section>
      }

      <!-- Ayuda -->
      <section class="help-section">
        <h2>❓ Ayuda</h2>
        <div class="help-cards">
          <a href="https://www.sii.cl/factura_electronica/instructivo_dt.pdf" target="_blank" class="help-card">
            <span class="help-icon">📄</span>
            <span>Manual SII</span>
          </a>
          <a href="https://maullin.sii.cl" target="_blank" class="help-card">
            <span class="help-icon">🧪</span>
            <span>Ambiente Maullin</span>
          </a>
          <a href="https://www.sii.cl/servicios_online/1040-1180.html" target="_blank" class="help-card">
            <span class="help-icon">🔢</span>
            <span>Solicitar CAF Pruebas</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .cert-container {
      padding: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .page-header h1 {
      font-size: 1.5rem;
      margin: 0;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.5);
      margin: 0.25rem 0 0;
    }

    /* Status Banner */
    .status-banner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 14px;
      margin: 1.5rem 0;
      backdrop-filter: blur(12px);
    }

    .status-banner.PENDIENTE {
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.4);
    }

    .status-banner.EN_PROCESO {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
    }

    .status-banner.APROBADO {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
    }

    .status-banner.RECHAZADO {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .status-icon {
      font-size: 2.5rem;
    }

    .status-content h2 {
      margin: 0;
      font-size: 1.25rem;
      color: white;
    }

    .status-content p {
      margin: 0.25rem 0 0;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Steps */
    .steps-section {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .steps-section h2 {
      margin: 0 0 1.5rem;
      font-size: 1.1rem;
      color: white;
    }

    .steps-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .step {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s;
    }

    .step.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.5);
    }

    .step.completed {
      opacity: 0.6;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step.completed .step-number {
      background: linear-gradient(135deg, #22c55e, #16a34a);
    }

    .step-content h3 {
      margin: 0;
      font-size: 1rem;
      color: white;
    }

    .step-content p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .step-content .btn-primary {
      margin-top: 0.75rem;
    }

    .check {
      color: #22c55e;
      font-weight: 500;
      margin-top: 0.5rem;
      display: inline-block;
    }

    /* Requisitos */
    .requisitos-section {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .requisitos-section h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: white;
    }

    .requisitos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .requisito-card {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .requisito-card.check {
      border-color: rgba(34, 197, 94, 0.5);
      background: rgba(34, 197, 94, 0.1);
    }

    .req-icon {
      font-size: 1.25rem;
    }

    .requisito-card strong {
      display: block;
      color: white;
    }

    .requisito-card p {
      margin: 0.25rem 0 0;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    /* Test Cases */
    .testcases-section {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .testcases-section h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: white;
    }

    .testcases-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 0.75rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.05);
    }

    td {
      padding: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
    }

    tr.success {
      background: rgba(34, 197, 94, 0.1);
    }

    tr.error {
      background: rgba(239, 68, 68, 0.1);
    }

    td strong {
      display: block;
      color: white;
    }

    td .desc {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .badge {
      background: rgba(99, 102, 241, 0.2);
      color: #6366F1;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status.enviado { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
    .status.aceptado { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
    .status.rechazado { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    .status.pending { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); }

    code {
      font-size: 0.7rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Resultado */
    .resultado-card {
      margin-top: 1.5rem;
      padding: 1.5rem;
      border-radius: 14px;
    }

    .resultado-card.success {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
    }

    .resultado-card.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .resultado-header {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .resultado-icon {
      font-size: 2rem;
    }

    .resultado-header h3 {
      margin: 0;
      color: white;
    }

    .resultado-header p {
      margin: 0.25rem 0 0;
      color: rgba(255, 255, 255, 0.7);
    }

    .errores-list {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .errores-list h4 {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
      color: white;
    }

    .errores-list ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .errores-list li {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Help */
    .help-section {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .help-section h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: white;
    }

    .help-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .help-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      text-decoration: none;
      color: white;
      transition: all 0.2s;
    }

    .help-card:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
    }

    .help-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    /* Buttons */
    .btn-primary, .btn-success {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }

    .btn-success {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .btn-success:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .requisitos-grid, .help-cards {
        grid-template-columns: 1fr;
      }

      .status-banner {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class CertificacionComponent implements OnInit {
  private http = inject(HttpClient);

  estadoCertificacion = signal<'PENDIENTE' | 'EN_PROCESO' | 'APROBADO' | 'RECHAZADO'>('PENDIENTE');
  paso = signal(1);
  testCases = signal<TestCase[]>([]);
  enviando = signal(false);
  resultado = signal<{ exito: boolean; mensaje: string; pasaron: number; total: number; errores: string[] } | null>(null);

  configCompleta = signal(false);
  tieneCertificado = signal(false);
  tieneCafs = signal(false);

  ngOnInit() {
    this.verificarRequisitos();
  }

  verificarRequisitos() {
    // TODO: Verificar desde el backend
    const config = localStorage.getItem('config_empresa');
    this.configCompleta.set(!!config);

    // Simular estado
    this.tieneCertificado.set(false);
    this.tieneCafs.set(false);
  }

  getStatusTitle(): string {
    const titles: Record<string, string> = {
      'PENDIENTE': 'Certificación Pendiente',
      'EN_PROCESO': 'Certificación en Proceso',
      'APROBADO': '¡Certificación Aprobada!',
      'RECHAZADO': 'Certificación Rechazada'
    };
    return titles[this.estadoCertificacion()];
  }

  getStatusDescription(): string {
    const descriptions: Record<string, string> = {
      'PENDIENTE': 'Complete los pasos para obtener la certificación SII',
      'EN_PROCESO': 'Documentos enviados, esperando respuesta del SII',
      'APROBADO': 'Ya puede emitir documentos en ambiente de producción',
      'RECHAZADO': 'Revise los errores y vuelva a intentar'
    };
    return descriptions[this.estadoCertificacion()];
  }

  verificarConfiguracion() {
    // Verificar que todo esté configurado
    if (!this.configCompleta()) {
      alert('Complete la configuración de empresa primero');
      return;
    }

    this.paso.set(2);
  }

  generarSetPruebas() {
    const config = JSON.parse(localStorage.getItem('config_empresa') || '{}');

    // Simular generación de set
    this.testCases.set([
      { numero: 1, nombre: 'Factura Afecta Simple', descripcion: 'Múltiples productos afectos', tipoDte: 'FACTURA_ELECTRONICA', codigoSii: 33, folio: 1, montoTotal: 50000, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 2, nombre: 'Factura Exenta', descripcion: 'Productos exentos de IVA', tipoDte: 'FACTURA_EXENTA', codigoSii: 34, folio: 1, montoTotal: 100000, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 3, nombre: 'Factura con Descuento', descripcion: 'Descuento porcentual', tipoDte: 'FACTURA_ELECTRONICA', codigoSii: 33, folio: 2, montoTotal: 90000, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 4, nombre: 'Factura con Recargo', descripcion: 'Recargo por flete', tipoDte: 'FACTURA_ELECTRONICA', codigoSii: 33, folio: 3, montoTotal: 124950, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 5, nombre: 'Boleta Simple', descripcion: 'Venta a consumidor final', tipoDte: 'BOLETA_ELECTRONICA', codigoSii: 39, folio: 1, montoTotal: 15970, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 6, nombre: 'Boleta con Descuento', descripcion: 'Descuento promocional', tipoDte: 'BOLETA_ELECTRONICA', codigoSii: 39, folio: 2, montoTotal: 8492, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 7, nombre: 'NC Anulación', descripcion: 'Anula factura completa', tipoDte: 'NOTA_CREDITO', codigoSii: 61, folio: 1, montoTotal: 50000, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 8, nombre: 'NC Descuento', descripcion: 'Descuento posterior', tipoDte: 'NOTA_CREDITO', codigoSii: 61, folio: 2, montoTotal: 5950, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 9, nombre: 'ND Intereses', descripcion: 'Cobro de intereses mora', tipoDte: 'NOTA_DEBITO', codigoSii: 56, folio: 1, montoTotal: 2975, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' },
      { numero: 10, nombre: 'Guía de Despacho', descripcion: 'Traslado mercadería', tipoDte: 'GUIA_DESPACHO', codigoSii: 52, folio: 1, montoTotal: 595000, resultadoEsperado: 'Aceptado', valido: false, trackId: '', estadoSii: '', errorMessage: '' }
    ]);

    this.paso.set(3);
  }

  enviarAlSii() {
    this.enviando.set(true);
    this.estadoCertificacion.set('EN_PROCESO');

    // Simular envío
    setTimeout(() => {
      const updated = this.testCases().map(tc => ({
        ...tc,
        valido: true,
        trackId: 'MOCK-CERT-' + Date.now() + '-' + tc.numero,
        estadoSii: 'ENVIADO'
      }));
      this.testCases.set(updated);
      this.enviando.set(false);
      this.paso.set(4);
    }, 3000);
  }

  verificarResultados() {
    // Simular verificación
    const allPassed = this.testCases().every(tc => tc.valido);

    this.resultado.set({
      exito: allPassed,
      mensaje: allPassed ? '✅ Todos los documentos fueron aceptados' : '❌ Algunos documentos fueron rechazados',
      pasaron: this.testCases().filter(tc => tc.valido).length,
      total: this.testCases().length,
      errores: []
    });

    if (allPassed) {
      this.estadoCertificacion.set('APROBADO');
    } else {
      this.estadoCertificacion.set('RECHAZADO');
    }
  }

  activarProduccion() {
    if (confirm('¿Está seguro de activar el ambiente de producción? Los documentos emitidos serán reales y tendrán validez tributaria.')) {
      alert('Ambiente de producción activado. ¡Ya puede emitir documentos oficiales!');
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  }
}
