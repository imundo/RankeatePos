import { Injectable } from '@angular/core';

/**
 * Service for generating PDF417 and QR codes for DTE documents.
 * Uses bwip-js for PDF417 and qrcode for QR codes.
 */
@Injectable({
    providedIn: 'root'
})
export class BarcodeService {
    private bwipjs: any;
    private QRCode: any;
    private librariesLoaded = false;

    constructor() {
        this.loadLibraries();
    }

    private async loadLibraries(): Promise<void> {
        if (this.librariesLoaded) return;

        try {
            // Dynamic imports for browser compatibility
            const bwipModule = await import('bwip-js');
            this.bwipjs = bwipModule.default || bwipModule;

            const qrModule = await import('qrcode');
            this.QRCode = qrModule.default || qrModule;

            this.librariesLoaded = true;
            console.log('Barcode libraries loaded successfully');
        } catch (e) {
            console.error('Error loading barcode libraries:', e);
        }
    }

    /**
     * Generate PDF417 barcode as data URL (Timbre Electrónico SII format)
     * @param data The data to encode (typically includes folio, RUT, total, etc.)
     * @returns Promise<string> Data URL of the generated barcode
     */
    async generatePDF417(data: string): Promise<string> {
        if (!this.bwipjs) {
            await this.loadLibraries();
        }

        return new Promise((resolve, reject) => {
            try {
                // Create a canvas element
                const canvas = document.createElement('canvas');

                const bwip = this.bwipjs.default || this.bwipjs;
                bwip.toCanvas(canvas, {
                    bcid: 'pdf417',
                    text: data,
                    scale: 2,
                    height: 8,
                    includetext: false,
                    textxalign: 'center',
                    columns: 10,  // PDF417 columns for reasonable width
                    rowmult: 2,   // Row height multiplier
                });

                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                console.error('PDF417 generation error:', e);
                reject(e);
            }
        });
    }

    /**
     * Generate QR Code as data URL
     * @param data The data to encode
     * @returns Promise<string> Data URL of the generated QR code
     */
    async generateQRCode(data: string): Promise<string> {
        if (!this.QRCode) {
            await this.loadLibraries();
        }

        try {
            // Handle both ESM and CJS module formats
            const qr = this.QRCode.default || this.QRCode;
            const toDataURL = qr.toDataURL || qr;

            const result = await toDataURL(data, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 150,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });

            console.log('QR Code generated successfully');
            return result;
        } catch (e) {
            console.error('QR generation error:', e);
            throw e;
        }
    }

    /**
     * Generate the complete Timbre Electrónico data string for SII
     * This is a simplified version - real implementation needs cryptographic signature
     */
    generateTimbreData(params: {
        tipoDte: string;
        folio: number;
        fechaEmision: string;
        rutEmisor: string;
        razonSocialEmisor: string;
        montoTotal: number;
        rutReceptor?: string;
    }): string {
        const { tipoDte, folio, fechaEmision, rutEmisor, razonSocialEmisor, montoTotal, rutReceptor } = params;

        // Simplified Timbre format - in production this would include digital signature
        const timbreData = [
            `RE:${rutEmisor}`,
            `RS:${razonSocialEmisor.substring(0, 40)}`,
            `TD:${this.getTipoDocumentoCodigo(tipoDte)}`,
            `F:${folio}`,
            `FE:${fechaEmision}`,
            `RR:${rutReceptor || '66666666-6'}`,
            `MNT:${Math.round(montoTotal)}`,
            `IT1:Documento Electrónico`,
            `TSTED:${new Date().toISOString()}`
        ].join('\n');

        return timbreData;
    }

    /**
     * Generate URL data for QR code (verification link)
     */
    generateQRData(params: {
        tipoDte: string;
        folio: number;
        fechaEmision: string;
        rutEmisor: string;
        montoTotal: number;
    }): string {
        const { tipoDte, folio, fechaEmision, rutEmisor, montoTotal } = params;

        // SII verification URL format
        return `https://www.sii.cl/verificar?` +
            `rut=${encodeURIComponent(rutEmisor)}&` +
            `tipo=${this.getTipoDocumentoCodigo(tipoDte)}&` +
            `folio=${folio}&` +
            `fecha=${encodeURIComponent(fechaEmision)}&` +
            `monto=${Math.round(montoTotal)}`;
    }

    private getTipoDocumentoCodigo(tipoDte: string): number {
        const codigos: Record<string, number> = {
            'BOLETA_ELECTRONICA': 39,
            'BOLETA': 39,
            'FACTURA_ELECTRONICA': 33,
            'FACTURA': 33,
            'NOTA_CREDITO': 61,
            'NOTA_DEBITO': 56,
            'GUIA_DESPACHO': 52
        };
        return codigos[tipoDte] || 39;
    }

    /**
     * Generate a unique verification hash based on document data
     * This creates a SHA-256 style hash for document verification
     */
    generateVerificationHash(params: {
        folio: number;
        fechaEmision: string;
        rutEmisor: string;
        montoTotal: number;
    }): string {
        const { folio, fechaEmision, rutEmisor, montoTotal } = params;

        // Create a deterministic string for hashing
        const dataString = `${folio}|${fechaEmision}|${rutEmisor}|${montoTotal}|${Date.now()}`;

        // Simple hash function (for demo - in production use SubtleCrypto)
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        // Convert to hex and take first 16 chars
        const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
        const timestamp = Date.now().toString(16).toUpperCase().slice(-8);

        return `${hexHash}${timestamp}`;
    }

    /**
     * Generate structured QR data with folio, date, and verification hash
     * Format similar to official DTE verification codes
     */
    generateStructuredQRData(params: {
        tipoDte: string;
        folio: number;
        fechaEmision: string;
        fechaHora: string;
        rutEmisor: string;
        montoTotal: number;
    }): string {
        const { tipoDte, folio, fechaEmision, fechaHora, rutEmisor, montoTotal } = params;

        // Generate verification hash
        const hash = this.generateVerificationHash({
            folio,
            fechaEmision,
            rutEmisor,
            montoTotal
        });

        // Structured format for QR content
        const tipoDoc = this.getTipoDocumentoCodigo(tipoDte);
        const tipoNombre = tipoDoc === 39 ? 'BOLETA' : tipoDoc === 33 ? 'FACTURA' : 'DTE';

        // Format: TYPE|FOLIO|DATE|TIME|HASH
        return [
            `${tipoNombre} ELECTRONICA`,
            `N° ${folio.toString().padStart(6, '0')}`,
            `FECHA: ${fechaEmision}`,
            `HORA: ${fechaHora}`,
            `TOTAL: $${montoTotal.toLocaleString('es-CL')}`,
            `VERIFICAR: ${hash}`
        ].join('\n');
    }
}
