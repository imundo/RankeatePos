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

    constructor() {
        this.loadLibraries();
    }

    private async loadLibraries(): Promise<void> {
        try {
            // Dynamic imports for browser compatibility
            this.bwipjs = await import('bwip-js');
            this.QRCode = await import('qrcode');
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

                this.bwipjs.toCanvas(canvas, {
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
            return await this.QRCode.toDataURL(data, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 120,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
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
}
