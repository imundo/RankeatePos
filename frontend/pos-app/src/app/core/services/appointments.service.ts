import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface ServiceCatalog {
    id: string;
    nombre: string;
    descripcion?: string;
    duracionMinutos: number;
    precio?: number;
    color: string;
    icono?: string;
    categoria?: string;
    activo: boolean;
    orden?: number;
    requiereProfesional?: boolean;
}

export interface Appointment {
    id: string;
    tenantId: string;
    branchId?: string;
    customerId?: string;
    customerNombre: string;
    customerTelefono?: string;
    customerEmail?: string;
    staffId?: string;
    staffNombre?: string;
    service?: ServiceCatalog;
    serviceNombre?: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: 'PROGRAMADA' | 'CONFIRMADA' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA' | 'NO_SHOW';
    notas?: string;
    notasInternas?: string;
    precioEstimado?: number;
    precioFinal?: number;
    color?: string;
    canalReserva?: string;
    recurrente?: boolean;
    recurrenciaRegla?: string;
    recordatorioEnviado?: boolean;
    createdAt?: string;
}

export interface AvailableSlot {
    horaInicio: string;
    horaFin: string;
    disponible: boolean;
    staffId: string;
    staffNombre: string;
}

export interface StaffAvailability {
    id?: string;
    staffId: string;
    staffNombre?: string;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    activo: boolean;
}

export interface CalendarData {
    year: number;
    month: number;
    totalAppointments: number;
    days: {
        fecha: string;
        count: number;
        appointments: Appointment[];
    }[];
}

export interface AppointmentStats {
    hoy: number;
    programadas: number;
    confirmadas: number;
    completadasMes: number;
    canceladasMes: number;
    noShowMes: number;
    totalMes: number;
    staffPerformance: { nombre: string; totalCitas: number }[];
}

@Injectable({
    providedIn: 'root'
})
export class AppointmentsService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/operations/appointments`;

    // ============ APPOINTMENTS ============

    getAll(page = 0, size = 20): Observable<any> {
        return this.http.get(this.baseUrl, { params: { page, size } });
    }

    getById(id: string): Observable<Appointment> {
        return this.http.get<Appointment>(`${this.baseUrl}/${id}`);
    }

    getByDate(fecha: string): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${this.baseUrl}/date`, { params: { fecha } });
    }

    getByDateRange(start: string, end: string): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${this.baseUrl}/range`, { params: { start, end } });
    }

    getByStaff(staffId: string, fecha: string): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${this.baseUrl}/staff/${staffId}`, { params: { fecha } });
    }

    getByCustomer(customerId: string): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${this.baseUrl}/customer/${customerId}`);
    }

    create(appointment: Partial<Appointment>): Observable<Appointment> {
        return this.http.post<Appointment>(this.baseUrl, appointment);
    }

    update(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
        return this.http.put<Appointment>(`${this.baseUrl}/${id}`, appointment);
    }

    updateStatus(id: string, estado: string, precioFinal?: number): Observable<Appointment> {
        const body: any = { estado };
        if (precioFinal != null) body.precioFinal = precioFinal;
        return this.http.put<Appointment>(`${this.baseUrl}/${id}/status`, body);
    }

    reschedule(id: string, fecha: string, horaInicio: string, horaFin: string): Observable<Appointment> {
        return this.http.put<Appointment>(`${this.baseUrl}/${id}/reschedule`, { fecha, horaInicio, horaFin });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // ============ SLOTS ============

    getAvailableSlots(fecha: string, serviceId?: string, staffId?: string): Observable<AvailableSlot[]> {
        let params = new HttpParams().set('fecha', fecha);
        if (serviceId) params = params.set('serviceId', serviceId);
        if (staffId) params = params.set('staffId', staffId);
        return this.http.get<AvailableSlot[]>(`${this.baseUrl}/available-slots`, { params });
    }

    // ============ CALENDAR & STATS ============

    getCalendar(year: number, month: number): Observable<CalendarData> {
        return this.http.get<CalendarData>(`${this.baseUrl}/calendar`, { params: { year, month } });
    }

    getStats(): Observable<AppointmentStats> {
        return this.http.get<AppointmentStats>(`${this.baseUrl}/stats`);
    }

    // ============ SERVICE CATALOG ============

    getServices(): Observable<ServiceCatalog[]> {
        return this.http.get<ServiceCatalog[]>(`${this.baseUrl}/services`);
    }

    getAllServices(): Observable<ServiceCatalog[]> {
        return this.http.get<ServiceCatalog[]>(`${this.baseUrl}/services/all`);
    }

    getService(id: string): Observable<ServiceCatalog> {
        return this.http.get<ServiceCatalog>(`${this.baseUrl}/services/${id}`);
    }

    createService(service: Partial<ServiceCatalog>): Observable<ServiceCatalog> {
        return this.http.post<ServiceCatalog>(`${this.baseUrl}/services`, service);
    }

    updateService(id: string, service: Partial<ServiceCatalog>): Observable<ServiceCatalog> {
        return this.http.put<ServiceCatalog>(`${this.baseUrl}/services/${id}`, service);
    }

    deleteService(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/services/${id}`);
    }

    // ============ STAFF AVAILABILITY ============

    getStaffAvailability(): Observable<StaffAvailability[]> {
        return this.http.get<StaffAvailability[]>(`${this.baseUrl}/staff-availability`);
    }

    getStaffSchedule(staffId: string): Observable<StaffAvailability[]> {
        return this.http.get<StaffAvailability[]>(`${this.baseUrl}/staff-availability/${staffId}`);
    }

    saveStaffSchedule(staffId: string, schedule: StaffAvailability[]): Observable<StaffAvailability[]> {
        return this.http.post<StaffAvailability[]>(`${this.baseUrl}/staff-availability/${staffId}`, schedule);
    }
}
