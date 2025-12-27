import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Receivable {
    id: string;
    documentNumber: string;
    customerName: string;
    customerId: string;
    amount: number;
    paidAmount: number;
    balance: number;
    dueDate: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
    daysOverdue?: number;
}

export interface Payable {
    id: string;
    documentNumber: string;
    supplierName: string;
    supplierId: string;
    amount: number;
    paidAmount: number;
    balance: number;
    dueDate: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}

export interface PaymentsSummary {
    totalReceivables: number;
    totalPayables: number;
    overdueReceivables: number;
    overduePayables: number;
    receivablesCount: number;
    payablesCount: number;
}

export interface CollectPaymentRequest {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentsService {
    private baseUrl = `${environment.apiUrl}/api/payments`;

    constructor(private http: HttpClient) { }

    // Receivables (Cuentas por Cobrar)
    getReceivables(status?: string): Observable<Receivable[]> {
        const url = status ? `${this.baseUrl}/receivables?status=${status}` : `${this.baseUrl}/receivables`;
        return this.http.get<Receivable[]>(url);
    }

    getReceivablesSummary(): Observable<PaymentsSummary> {
        return this.http.get<PaymentsSummary>(`${this.baseUrl}/receivables/summary`);
    }

    collectPayment(receivableId: string, payment: CollectPaymentRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/receivables/${receivableId}/collect`, payment);
    }

    // Payables (Cuentas por Pagar)
    getPayables(status?: string): Observable<Payable[]> {
        const url = status ? `${this.baseUrl}/payables?status=${status}` : `${this.baseUrl}/payables`;
        return this.http.get<Payable[]>(url);
    }

    getPayablesSummary(): Observable<PaymentsSummary> {
        return this.http.get<PaymentsSummary>(`${this.baseUrl}/payables/summary`);
    }

    makePayment(payableId: string, payment: CollectPaymentRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/payables/${payableId}/pay`, payment);
    }
}
