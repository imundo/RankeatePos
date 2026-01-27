import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface LeaveRequest {
    id: string;
    tenantId: string;
    employeeId: string;
    employeeName: string;
    type: LeaveRequestType;
    startDate?: string;
    endDate?: string;
    daysRequested?: number;
    amountRequested?: number;
    benefitCode?: string;
    reason?: string;
    notes?: string;
    attachmentUrl?: string;
    attachmentFileName?: string;
    status: LeaveRequestStatus;
    approvedBy?: string;
    approverName?: string;
    rejectionReason?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export type LeaveRequestType =
    | 'VACATION'
    | 'LEAVE_WITHOUT_PAY'
    | 'MEDICAL_LEAVE'
    | 'SALARY_ADVANCE'
    | 'ADMINISTRATIVE_DAY'
    | 'COMPENSATORY'
    | 'BENEFIT';

export type LeaveRequestStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'EXPIRED';

export interface CreateLeaveRequest {
    employeeId: string;
    type: LeaveRequestType;
    startDate?: string;
    endDate?: string;
    daysRequested?: number;
    amountRequested?: number;
    benefitCode?: string;
    reason?: string;
    notes?: string;
    attachmentUrl?: string;
    attachmentFileName?: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface LeaveStats {
    pendingRequests: number;
}

@Injectable({
    providedIn: 'root'
})
export class LeaveService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/leaves`;

    // ============ Leave Requests ============

    getAll(page = 0, size = 20): Observable<Page<LeaveRequest>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<Page<LeaveRequest>>(this.baseUrl, { params });
    }

    getPending(): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.baseUrl}/pending`);
    }

    getByEmployee(employeeId: string, page = 0, size = 20): Observable<Page<LeaveRequest>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<Page<LeaveRequest>>(`${this.baseUrl}/employee/${employeeId}`, { params });
    }

    create(request: CreateLeaveRequest): Observable<LeaveRequest> {
        return this.http.post<LeaveRequest>(this.baseUrl, request);
    }

    approve(id: string): Observable<LeaveRequest> {
        return this.http.post<LeaveRequest>(`${this.baseUrl}/${id}/approve`, {});
    }

    reject(id: string, reason: string): Observable<LeaveRequest> {
        const params = new HttpParams().set('reason', reason);
        return this.http.post<LeaveRequest>(`${this.baseUrl}/${id}/reject`, {}, { params });
    }

    cancel(id: string): Observable<LeaveRequest> {
        return this.http.post<LeaveRequest>(`${this.baseUrl}/${id}/cancel`, {});
    }

    // ============ Stats ============

    getStats(): Observable<LeaveStats> {
        return this.http.get<LeaveStats>(`${this.baseUrl}/stats`);
    }

    // ============ Helpers ============

    getTypeLabel(type: LeaveRequestType): string {
        const labels: Record<LeaveRequestType, string> = {
            VACATION: 'Vacaciones',
            LEAVE_WITHOUT_PAY: 'Permiso sin goce',
            MEDICAL_LEAVE: 'Licencia médica',
            SALARY_ADVANCE: 'Anticipo de sueldo',
            ADMINISTRATIVE_DAY: 'Día administrativo',
            COMPENSATORY: 'Compensatorio',
            BENEFIT: 'Beneficio'
        };
        return labels[type] || type;
    }

    getStatusLabel(status: LeaveRequestStatus): string {
        const labels: Record<LeaveRequestStatus, string> = {
            PENDING: 'Pendiente',
            APPROVED: 'Aprobada',
            REJECTED: 'Rechazada',
            CANCELLED: 'Cancelada',
            EXPIRED: 'Expirada'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: LeaveRequestStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const severities: Record<LeaveRequestStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            PENDING: 'warn',
            APPROVED: 'success',
            REJECTED: 'danger',
            CANCELLED: 'secondary',
            EXPIRED: 'secondary'
        };
        return severities[status] || 'info';
    }
}
