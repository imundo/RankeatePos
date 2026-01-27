import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PublicAttendanceLink {
    id: string;
    tenantId: string;
    branchId?: string;
    token: string;
    name: string;
    description?: string;
    active: boolean;
    deactivatedAt?: string;
    deactivatedBy?: string;
    deactivationReason?: string;
    totalClockIns: number;
    totalClockOuts: number;
    lastUsedDate?: string;
    lastUsedAt?: string;
    createdBy: string;
    createdAt: string;
    publicUrl: string;
}

export interface AttendanceStatistics {
    id: string;
    tenantId: string;
    employeeId: string;
    year: number;
    month: number;
    totalWorkDays: number;
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
    daysEarlyLeave: number;
    totalWorkedMinutes: number;
    totalOvertimeMinutes: number;
    totalLateMinutes: number;
    attendancePercentage: number;
    punctualityPercentage: number;
}

export interface ClockResponse {
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    message: string;
    employeeName: string;
    timestamp: string;
}

export interface AttendanceAverages {
    averageAttendance: number;
    averagePunctuality: number;
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/attendance`;

    // ============ Links ============

    getLinks(): Observable<PublicAttendanceLink[]> {
        return this.http.get<PublicAttendanceLink[]>(`${this.baseUrl}/links`);
    }

    createLink(name: string, branchId?: string): Observable<PublicAttendanceLink> {
        return this.http.post<PublicAttendanceLink>(`${this.baseUrl}/links`, { name, branchId });
    }

    deactivateLink(id: string, reason?: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/links/${id}/deactivate`, null, {
            params: reason ? { reason } : {}
        });
    }

    reactivateLink(id: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/links/${id}/reactivate`, null);
    }

    // ============ Statistics ============

    getStatistics(year: number, month: number): Observable<AttendanceStatistics[]> {
        return this.http.get<AttendanceStatistics[]>(`${this.baseUrl}/statistics`, {
            params: { year: year.toString(), month: month.toString() }
        });
    }

    getEmployeeStatistics(employeeId: string, year: number): Observable<AttendanceStatistics[]> {
        return this.http.get<AttendanceStatistics[]>(`${this.baseUrl}/statistics/employee/${employeeId}`, {
            params: { year: year.toString() }
        });
    }

    calculateStatistics(year: number, month: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/statistics/calculate`, null, {
            params: { year: year.toString(), month: month.toString() }
        });
    }

    getAverages(year: number, month: number): Observable<AttendanceAverages> {
        return this.http.get<AttendanceAverages>(`${this.baseUrl}/statistics/averages`, {
            params: { year: year.toString(), month: month.toString() }
        });
    }

    // ============ Public Clock (for public page) ============

    publicClock(token: string, pinCode: string): Observable<ClockResponse> {
        return this.http.post<ClockResponse>(`${environment.apiUrl.replace('/api', '')}/public/attendance/${token}/clock`, {
            pinCode
        });
    }

    validateLink(token: string): Observable<{ valid: boolean; name?: string }> {
        return this.http.get<{ valid: boolean; name?: string }>(
            `${environment.apiUrl.replace('/api', '')}/public/attendance/${token}/validate`
        );
    }
}
