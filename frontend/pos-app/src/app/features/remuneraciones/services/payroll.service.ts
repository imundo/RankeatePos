import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Employee {
    id: string;
    rut: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    hireDate: string;
    terminationDate?: string;
    contractType: 'INDEFINIDO' | 'PLAZO_FIJO' | 'POR_OBRA' | 'HONORARIOS';
    position?: string;
    department?: string;
    baseSalary: number;
    afpCode?: string;
    healthInsuranceCode?: string;
    isActive: boolean;
}

export interface PayrollPeriod {
    id: string;
    periodYear: number;
    periodMonth: number;
    periodName: string;
    paymentDate?: string;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    status: 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'CLOSED';
}

export interface Payslip {
    id: string;
    employeeId: string;
    employeeName: string;
    daysWorked: number;
    baseSalary: number;
    overtimeAmount: number;
    bonusAmount: number;
    grossSalary: number;
    afpAmount: number;
    healthAmount: number;
    taxAmount: number;
    totalDeductions: number;
    netSalary: number;
}

@Injectable({
    providedIn: 'root'
})
export class PayrollService {
    private baseUrl = `${environment.apiUrl}/api/payroll`;

    constructor(private http: HttpClient) { }

    // Employees
    getEmployees(active?: boolean): Observable<Employee[]> {
        const url = active !== undefined ? `${this.baseUrl}/employees?active=${active}` : `${this.baseUrl}/employees`;
        return this.http.get<Employee[]>(url);
    }

    getEmployee(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.baseUrl}/employees/${id}`);
    }

    createEmployee(employee: Partial<Employee>): Observable<Employee> {
        return this.http.post<Employee>(`${this.baseUrl}/employees`, employee);
    }

    // Payroll Periods
    getPayrollPeriods(): Observable<PayrollPeriod[]> {
        return this.http.get<PayrollPeriod[]>(`${this.baseUrl}/periods`);
    }

    createPayrollPeriod(period: Partial<PayrollPeriod>): Observable<PayrollPeriod> {
        return this.http.post<PayrollPeriod>(`${this.baseUrl}/periods`, period);
    }

    processPayroll(periodId: string): Observable<PayrollPeriod> {
        return this.http.post<PayrollPeriod>(`${this.baseUrl}/periods/${periodId}/process`, {});
    }

    // Payslips
    getPayslips(periodId: string): Observable<Payslip[]> {
        return this.http.get<Payslip[]>(`${this.baseUrl}/periods/${periodId}/payslips`);
    }
}
