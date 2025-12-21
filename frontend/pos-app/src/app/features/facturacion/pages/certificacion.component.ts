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
    }

    .page-header h1 {
      font-size: 1.5rem;
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    /* Status Banner */
    .status-banner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 1.5rem 0;
    }

    .status-banner.PENDIENTE {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 1px solid #f59e0b;
    }

    .status-banner.EN_PROCESO {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      border: 1px solid #3b82f6;
    }

    .status-banner.APROBADO {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      border: 1px solid #22c55e;
    }

    .status-banner.RECHAZADO {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      border: 1px solid #ef4444;
    }

    .status-icon {
      font-size: 2.5rem;
    }

    .status-content h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .status-content p {
      margin: 0.25rem 0 0;
      opacity: 0.8;
    }

    /* Steps */
    .steps-section {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-color);
    }

    .steps-section h2 {
      margin: 0 0 1.5rem;
      font-size: 1.1rem;
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
      border-radius: 8px;
      background: var(--bg-secondary);
      transition: all 0.2s;
    }

    .step.active {
      background: rgba(99,102,241,0.1);
      border: 1px solid var(--primary-color);
    }

    .step.completed {
      opacity: 0.7;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step.completed .step-number {
      background: #22c55e;
    }

    .step-content h3 {
      margin: 0;
      font-size: 1rem;
    }

    .step-content p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
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
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-color);
    }

    .requisitos-section h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
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
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid transparent;
    }

    .requisito-card.check {
      border-color: #22c55e;
      background: rgba(34,197,94,0.1);
    }

    .req-icon {
      font-size: 1.25rem;
    }

    .requisito-card strong {
      display: block;
    }

    .requisito-card p {
      margin: 0.25rem 0 0;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Test Cases */
    .testcases-section {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-color);
    }

    .testcases-section h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
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
      color: var(--text-secondary);
      text-transform: uppercase;
      background: var(--bg-secondary);
    }

    td {
      padding: 0.75rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.875rem;
    }

    tr.success {
      background: rgba(34,197,94,0.05);
    }

    tr.error {
      background: rgba(239,68,68,0.05);
    }

    td strong {
      display: block;
    }

    td .desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .badge {
      background: var(--bg-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .status.enviado { background: #dbeafe; color: #2563eb; }
    .status.aceptado { background: #dcfce7; color: #16a34a; }
    .status.rechazado { background: #fee2e2; color: #dc2626; }
    .status.pending { background: #f3f4f6; color: #6b7280; }

    code {
      font-size: 0.7rem;
      background: var(--bg-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    /* Resultado */
    .resultado-card {
      margin-top: 1.5rem;
      padding: 1.5rem;
      border-radius: 12px;
    }

    .resultado-card.success {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      border: 1px solid #22c55e;
    }

    .resultado-card.error {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      border: 1px solid #ef4444;
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
    }

    .resultado-header p {
      margin: 0.25rem 0 0;
      opacity: 0.8;
    }

    .errores-list {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0,0,0,0.1);
    }

    .errores-list h4 {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }

    .errores-list ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .errores-list li {
      font-size: 0.875rem;
    }

    /* Help */
    .help-section {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
    }

    .help-section h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
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
      background: var(--bg-secondary);
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }

    .help-card:hover {
      background: rgba(99,102,241,0.1);
    }

    .help-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    /* Buttons */
    .btn-primary, .btn-success {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    .btn-success {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
