import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface Employee {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    rut: string;
    email: string;
    phone: string;
    position: string;
    pinCode: string;
    hireDate: string;
    terminationDate?: string;
    baseSalary: number;
    address?: string;
    birthDate?: string;
    nationality?: string;
    photoUrl?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountType?: string;
    countryCode: string;
    active: boolean;
    initials: string;
    fullName: string;
    vacationDaysRemaining: number;
    documentsCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEmployeeRequest {
    firstName: string;
    lastName: string;
    rut: string;
    email?: string;
    phone?: string;
    position: string;
    pinCode?: string;
    hireDate: string;
    baseSalary?: number;
    address?: string;
    birthDate?: string;
    nationality?: string;
    photoUrl?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountType?: string;
    countryCode?: string;
}

export interface UpdateEmployeeRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    position?: string;
    baseSalary?: number;
    address?: string;
    birthDate?: string;
    nationality?: string;
    photoUrl?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountType?: string;
}

export interface PayrollConfig {
    id: string;
    employeeId: string;
    healthSystem: 'FONASA' | 'ISAPRE';
    isapreName?: string;
    healthRate: number;
    isapreAdditionalUf?: number;
    afpName: string;
    afpRate: number;
    hasApv: boolean;
    apvMonthlyAmount?: number;
    gratificationType: 'MONTHLY' | 'ANNUAL' | 'NONE';
    gratificationAmount?: number;
    hasLunchAllowance: boolean;
    lunchAllowanceAmount?: number;
    hasTransportAllowance: boolean;
    transportAllowanceAmount?: number;
    exemptFromOvertime: boolean;
    overtimeMultiplier: number;
}

export interface EmployeeDocument {
    id: string;
    category: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSizeBytes?: number;
    mimeType?: string;
    documentDate?: string;
    expirationDate?: string;
    notes?: string;
    uploadedAt: string;
}

export interface EmployeeHistory {
    id: string;
    eventType: string;
    description: string;
    previousValue?: string;
    newValue?: string;
    eventDate: string;
    recordedBy?: string;
}

export interface LeaveBalance {
    id: string;
    employeeId: string;
    year: number;
    countryCode: string;
    daysEntitled: number;
    daysAccrued: number;
    daysTaken: number;
    daysRemaining: number;
    monthlyAccrualRate: number;
    seniorityBonusDays: number;
    carryoverDays: number;
    lastAccruedMonth?: number;
}

export interface EmployeeStats {
    totalEmployees: number;
    activeEmployees: number;
    pendingLeaveRequests: number;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

@Injectable({
    providedIn: 'root'
})
export class StaffService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/employees`;

    // ============ CRUD ============

    getAll(page = 0, size = 20, search?: string, activeOnly = true): Observable<Page<Employee>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('activeOnly', activeOnly.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<Page<Employee>>(this.baseUrl, { params });
    }

    getAllActive(): Observable<Employee[]> {
        return this.http.get<Employee[]>(`${this.baseUrl}/list`);
    }

    getById(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.baseUrl}/${id}`);
    }

    create(employee: CreateEmployeeRequest): Observable<Employee> {
        return this.http.post<Employee>(this.baseUrl, employee);
    }

    update(id: string, employee: UpdateEmployeeRequest): Observable<Employee> {
        return this.http.put<Employee>(`${this.baseUrl}/${id}`, employee);
    }

    deactivate(id: string, reason?: string): Observable<void> {
        const params = reason ? new HttpParams().set('reason', reason) : undefined;
        return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
    }

    regeneratePin(id: string): Observable<Employee> {
        return this.http.post<Employee>(`${this.baseUrl}/${id}/regenerate-pin`, {});
    }

    // ============ Payroll Config ============

    getPayrollConfig(employeeId: string): Observable<PayrollConfig> {
        return this.http.get<PayrollConfig>(`${this.baseUrl}/${employeeId}/payroll-config`);
    }

    updatePayrollConfig(employeeId: string, config: Partial<PayrollConfig>): Observable<PayrollConfig> {
        return this.http.put<PayrollConfig>(`${this.baseUrl}/${employeeId}/payroll-config`, config);
    }

    // ============ Documents ============

    getDocuments(employeeId: string): Observable<EmployeeDocument[]> {
        return this.http.get<EmployeeDocument[]>(`${this.baseUrl}/${employeeId}/documents`);
    }

    addDocument(employeeId: string, document: Partial<EmployeeDocument>): Observable<EmployeeDocument> {
        return this.http.post<EmployeeDocument>(`${this.baseUrl}/${employeeId}/documents`, document);
    }

    deleteDocument(documentId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/documents/${documentId}`);
    }

    // ============ History ============

    getHistory(employeeId: string): Observable<EmployeeHistory[]> {
        return this.http.get<EmployeeHistory[]>(`${this.baseUrl}/${employeeId}/history`);
    }

    // ============ Leave Balance ============

    getLeaveBalance(employeeId: string): Observable<LeaveBalance> {
        return this.http.get<LeaveBalance>(`${this.baseUrl}/${employeeId}/leave-balance`);
    }

    getLeaveBalanceHistory(employeeId: string): Observable<LeaveBalance[]> {
        return this.http.get<LeaveBalance[]>(`${this.baseUrl}/${employeeId}/leave-balance/history`);
    }

    // ============ Stats ============

    getStats(): Observable<EmployeeStats> {
        return this.http.get<EmployeeStats>(`${this.baseUrl}/stats`);
    }
}
