import { Injectable, computed, signal } from '@angular/core';

export type CountryCode = 'CL' | 'PE' | 'AR' | 'VE' | 'GENERIC';

export interface TaxTerminology {
  taxIdName: string; // RUT, RUC, CUIT, RIF
  taxAuthority: string; // SII, SUNAT, AFIP, SENIAT
  documentIdName: string; // Folio, Correlativo, Número de Control
  authorizationName: string; // CAF, Resolucion, Providencia, CAE
  salesTaxName: string; // IVA, IGV
}

const TERMINOLOGIES: Record<CountryCode, TaxTerminology> = {
  CL: {
    taxIdName: 'RUT',
    taxAuthority: 'SII',
    documentIdName: 'Folio',
    authorizationName: 'CAF',
    salesTaxName: 'IVA'
  },
  PE: {
    taxIdName: 'RUC',
    taxAuthority: 'SUNAT',
    documentIdName: 'Correlativo',
    authorizationName: 'Rango de Folios',
    salesTaxName: 'IGV'
  },
  VE: {
    taxIdName: 'RIF',
    taxAuthority: 'SENIAT',
    documentIdName: 'N° de Control',
    authorizationName: 'Providencia',
    salesTaxName: 'IVA'
  },
  AR: {
    taxIdName: 'CUIT',
    taxAuthority: 'AFIP',
    documentIdName: 'Número',
    authorizationName: 'CAE',
    salesTaxName: 'IVA'
  },
  GENERIC: {
    taxIdName: 'Tax ID',
    taxAuthority: 'Tax Authority',
    documentIdName: 'Doc Number',
    authorizationName: 'Auth Code',
    salesTaxName: 'Tax'
  }
};

@Injectable({ providedIn: 'root' })
export class TaxTerminologyService {
  private _activeCountry = signal<CountryCode>('CL');

  readonly country = this._activeCountry.asReadonly();
  
  readonly term = computed(() => TERMINOLOGIES[this._activeCountry()]);

  setCountry(country: CountryCode) {
    this._activeCountry.set(country);
  }
}
