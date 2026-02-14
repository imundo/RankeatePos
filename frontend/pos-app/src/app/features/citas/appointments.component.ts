import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentsService, Appointment, ServiceCatalog, AvailableSlot, StaffAvailability } from '../../core/services/appointments.service';

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './appointments.component.html',
    styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
    private svc = inject(AppointmentsService);

    // State
    activeView = signal<'agenda' | 'calendar' | 'services' | 'staff'>('agenda');
    selectedDate = signal(this.todayStr());
    currentMonth = signal(new Date().getMonth() + 1);
    currentYear = signal(new Date().getFullYear());
    loading = signal(false);

    // Data
    appointments = signal<Appointment[]>([]);
    services = signal<ServiceCatalog[]>([]);
    availableSlots = signal<AvailableSlot[]>([]);
    staffSchedules = signal<StaffAvailability[]>([]);
    stats = signal<any>({});
    calendarDays = signal<any[]>([]);

    // Modals
    showBooking = signal(false);
    showDetail = signal(false);
    showServiceModal = signal(false);
    showStaffModal = signal(false);
    selectedAppointment = signal<Appointment | null>(null);

    // Booking wizard
    bookingStep = signal(1);
    bookingData: any = {
        serviceId: '', staffId: '', fecha: '', horaInicio: '', horaFin: '',
        customerNombre: '', customerTelefono: '', customerEmail: '', notas: ''
    };

    // Service form
    serviceForm: Partial<ServiceCatalog> = { nombre: '', duracionMinutos: 60, precio: 0, color: '#6366f1', activo: true };
    editingServiceId: string | null = null;

    // Staff form
    staffForm: any = { staffId: '', staffNombre: '', schedules: [] as any[] };

    // Computed
    filteredAppointments = computed(() => {
        return this.appointments().sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });

    todayAppointments = computed(() => this.appointments().filter(a => a.fecha === this.todayStr()));
    pendingCount = computed(() => this.appointments().filter(a => a.estado === 'PROGRAMADA' || a.estado === 'CONFIRMADA').length);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.loadAppointments();
        this.loadServices();
        this.loadStats();
        this.loadStaffSchedules();
    }

    loadAppointments() {
        this.svc.getByDate(this.selectedDate()).subscribe({
            next: data => { this.appointments.set(data); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    loadServices() {
        this.svc.getAllServices().subscribe({ next: data => this.services.set(data), error: () => { } });
    }

    loadStats() {
        this.svc.getStats().subscribe({ next: data => this.stats.set(data), error: () => { } });
    }

    loadStaffSchedules() {
        this.svc.getStaffAvailability().subscribe({ next: data => this.staffSchedules.set(data), error: () => { } });
    }

    loadCalendar() {
        this.svc.getCalendar(this.currentYear(), this.currentMonth()).subscribe({
            next: data => this.calendarDays.set(data.days || []),
            error: () => { }
        });
    }

    // ===== Navigation =====
    setView(view: 'agenda' | 'calendar' | 'services' | 'staff') {
        this.activeView.set(view);
        if (view === 'calendar') this.loadCalendar();
        if (view === 'agenda') this.loadAppointments();
    }

    changeDate(delta: number) {
        const d = new Date(this.selectedDate());
        d.setDate(d.getDate() + delta);
        this.selectedDate.set(this.formatDate(d));
        this.loadAppointments();
    }

    selectCalendarDate(dateStr: string) {
        this.selectedDate.set(dateStr);
        this.setView('agenda');
    }

    prevMonth() {
        let m = this.currentMonth() - 1, y = this.currentYear();
        if (m < 1) { m = 12; y--; }
        this.currentMonth.set(m); this.currentYear.set(y); this.loadCalendar();
    }

    nextMonth() {
        let m = this.currentMonth() + 1, y = this.currentYear();
        if (m > 12) { m = 1; y++; }
        this.currentMonth.set(m); this.currentYear.set(y); this.loadCalendar();
    }

    // ===== Booking Wizard =====
    openBooking() {
        this.bookingStep.set(1);
        this.bookingData = {
            serviceId: '', staffId: '', fecha: this.selectedDate(),
            horaInicio: '', horaFin: '', customerNombre: '', customerTelefono: '', customerEmail: '', notas: ''
        };
        this.showBooking.set(true);
    }

    selectService(svc: ServiceCatalog) {
        this.bookingData.serviceId = svc.id;
        this.bookingData.serviceName = svc.nombre;
        this.bookingData.duration = svc.duracionMinutos;
        this.bookingData.color = svc.color;
        this.bookingStep.set(2);
        this.loadSlots();
    }

    loadSlots() {
        this.svc.getAvailableSlots(this.bookingData.fecha, this.bookingData.serviceId, this.bookingData.staffId || undefined)
            .subscribe({ next: data => this.availableSlots.set(data), error: () => { } });
    }

    selectSlot(slot: AvailableSlot) {
        if (!slot.disponible) return;
        this.bookingData.horaInicio = slot.horaInicio;
        this.bookingData.horaFin = slot.horaFin;
        this.bookingData.staffId = slot.staffId;
        this.bookingData.staffName = slot.staffNombre;
        this.bookingStep.set(3);
    }

    confirmBooking() {
        const payload: any = {
            fecha: this.bookingData.fecha,
            horaInicio: this.bookingData.horaInicio,
            horaFin: this.bookingData.horaFin,
            staffId: this.bookingData.staffId,
            staffNombre: this.bookingData.staffName,
            customerNombre: this.bookingData.customerNombre,
            customerTelefono: this.bookingData.customerTelefono,
            customerEmail: this.bookingData.customerEmail,
            notas: this.bookingData.notas,
            service: { id: this.bookingData.serviceId },
            color: this.bookingData.color
        };
        this.svc.create(payload).subscribe({
            next: () => { this.showBooking.set(false); this.loadAppointments(); },
            error: (err) => alert('Error: ' + (err.error?.message || err.message))
        });
    }

    // ===== Appointment Actions =====
    openDetail(apt: Appointment) {
        this.selectedAppointment.set(apt);
        this.showDetail.set(true);
    }

    updateStatus(id: string, estado: string) {
        this.svc.updateStatus(id, estado).subscribe({
            next: () => { this.showDetail.set(false); this.loadAppointments(); },
            error: () => { }
        });
    }

    deleteAppointment(id: string) {
        if (!confirm('¿Eliminar esta cita?')) return;
        this.svc.delete(id).subscribe({
            next: () => { this.showDetail.set(false); this.loadAppointments(); },
            error: () => { }
        });
    }

    // ===== Service Catalog =====
    openServiceModal(svc?: ServiceCatalog) {
        if (svc) {
            this.editingServiceId = svc.id;
            this.serviceForm = { ...svc };
        } else {
            this.editingServiceId = null;
            this.serviceForm = { nombre: '', duracionMinutos: 60, precio: 0, color: '#6366f1', activo: true };
        }
        this.showServiceModal.set(true);
    }

    saveService() {
        const obs = this.editingServiceId
            ? this.svc.updateService(this.editingServiceId, this.serviceForm)
            : this.svc.createService(this.serviceForm);
        obs.subscribe({
            next: () => { this.showServiceModal.set(false); this.loadServices(); },
            error: () => { }
        });
    }

    deleteService(id: string) {
        if (!confirm('¿Eliminar este servicio?')) return;
        this.svc.deleteService(id).subscribe({ next: () => this.loadServices(), error: () => { } });
    }

    // ===== Staff Schedule =====
    openStaffModal() {
        this.staffForm = { staffId: '', staffNombre: '', schedules: this.generateWeekTemplate() };
        this.showStaffModal.set(true);
    }

    generateWeekTemplate() {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days.map((name, i) => ({
            name, diaSemana: i, horaInicio: '09:00', horaFin: '18:00', activo: i >= 1 && i <= 5
        }));
    }

    saveStaffSchedule() {
        const active = this.staffForm.schedules.filter((s: any) => s.activo).map((s: any) => ({
            staffId: this.staffForm.staffId, staffNombre: this.staffForm.staffNombre,
            diaSemana: s.diaSemana, horaInicio: s.horaInicio, horaFin: s.horaFin, activo: true
        }));
        this.svc.saveStaffSchedule(this.staffForm.staffId, active).subscribe({
            next: () => { this.showStaffModal.set(false); this.loadStaffSchedules(); },
            error: () => { }
        });
    }

    // ===== Helpers =====
    todayStr(): string { return this.formatDate(new Date()); }
    formatDate(d: Date): string { return d.toISOString().split('T')[0]; }

    formatTime(t: string): string {
        if (!t) return '';
        const [h, m] = t.split(':');
        return `${h}:${m}`;
    }

    getStatusLabel(s: string): string {
        const m: Record<string, string> = {
            PROGRAMADA: 'Programada', CONFIRMADA: 'Confirmada', EN_PROGRESO: 'En Progreso',
            COMPLETADA: 'Completada', CANCELADA: 'Cancelada', NO_SHOW: 'No Show'
        };
        return m[s] || s;
    }

    getStatusColor(s: string): string {
        const m: Record<string, string> = {
            PROGRAMADA: '#6366f1', CONFIRMADA: '#10b981', EN_PROGRESO: '#f59e0b',
            COMPLETADA: '#22c55e', CANCELADA: '#ef4444', NO_SHOW: '#6b7280'
        };
        return m[s] || '#6b7280';
    }

    getStatusIcon(s: string): string {
        const m: Record<string, string> = {
            PROGRAMADA: '📅', CONFIRMADA: '✅', EN_PROGRESO: '⏳',
            COMPLETADA: '🎉', CANCELADA: '❌', NO_SHOW: '👻'
        };
        return m[s] || '📅';
    }

    getDayName(dateStr: string): string {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    getMonthName(): string {
        const d = new Date(this.currentYear(), this.currentMonth() - 1, 1);
        return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    }

    isToday(dateStr: string): boolean { return dateStr === this.todayStr(); }

    formatPrice(v: number | undefined): string {
        if (v == null) return '-';
        return '$' + v.toLocaleString('es-CL');
    }
}
