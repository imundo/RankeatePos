import { Injectable, signal } from '@angular/core';

/**
 * Demo Data Service - Provides sample data for testing innovation modules
 * This data simulates what would come from backend services
 * Data is tenant-aware (El Trigal bakery context)
 */
@Injectable({
    providedIn: 'root'
})
export class DemoDataService {
    // ==================== LOYALTY MODULE ====================
    loyaltyCustomers = signal([
        { id: '1', nombre: 'María González', email: 'maria.gonzalez@email.com', telefono: '+56912345678', puntos: 2450, nivel: 'Oro', fechaRegistro: '2024-03-15', ultimaCompra: '2024-12-24', comprasTotal: 45 },
        { id: '2', nombre: 'Juan Pérez', email: 'juan.perez@email.com', telefono: '+56987654321', puntos: 1200, nivel: 'Plata', fechaRegistro: '2024-05-20', ultimaCompra: '2024-12-23', comprasTotal: 28 },
        { id: '3', nombre: 'Ana Martínez', email: 'ana.martinez@email.com', telefono: '+56911223344', puntos: 580, nivel: 'Bronce', fechaRegistro: '2024-08-10', ultimaCompra: '2024-12-22', comprasTotal: 12 },
        { id: '4', nombre: 'Carlos López', email: 'carlos.lopez@email.com', telefono: '+56955667788', puntos: 3800, nivel: 'Platino', fechaRegistro: '2023-11-05', ultimaCompra: '2024-12-25', comprasTotal: 89 },
        { id: '5', nombre: 'Patricia Díaz', email: 'patricia.diaz@email.com', telefono: '+56944556677', puntos: 920, nivel: 'Bronce', fechaRegistro: '2024-09-01', ultimaCompra: '2024-12-20', comprasTotal: 15 },
        { id: '6', nombre: 'Roberto Silva', email: 'roberto.silva@email.com', telefono: '+56933445566', puntos: 1650, nivel: 'Plata', fechaRegistro: '2024-04-18', ultimaCompra: '2024-12-24', comprasTotal: 34 },
    ]);

    loyaltyRedemptions = signal([
        { id: '1', clienteId: '4', clienteNombre: 'Carlos López', recompensa: 'Torta de Cumpleaños Gratis', puntos: 500, fecha: '2024-12-24', estado: 'canjeado' },
        { id: '2', clienteId: '1', clienteNombre: 'María González', recompensa: '20% Descuento', puntos: 200, fecha: '2024-12-23', estado: 'canjeado' },
        { id: '3', clienteId: '2', clienteNombre: 'Juan Pérez', recompensa: 'Café Gratis', puntos: 50, fecha: '2024-12-25', estado: 'pendiente' },
    ]);

    // ==================== WHATSAPP MODULE ====================
    whatsappMessages = signal([
        { id: '1', clienteNombre: 'María González', telefono: '+56912345678', mensaje: '¿Tienen torta de chocolate disponible?', tipo: 'entrante', hora: '09:15', fecha: '2024-12-25', leido: false },
        { id: '2', clienteNombre: 'Juan Pérez', telefono: '+56987654321', mensaje: 'Confirmo pedido para las 14:00', tipo: 'entrante', hora: '08:45', fecha: '2024-12-25', leido: false },
        { id: '3', clienteNombre: 'Sistema', telefono: '', mensaje: 'Pedido #0028 confirmado - María González', tipo: 'saliente', hora: '09:20', fecha: '2024-12-25', leido: true },
        { id: '4', clienteNombre: 'Carlos López', telefono: '+56955667788', mensaje: '¿Puedo cancelar mi reserva de hoy?', tipo: 'entrante', hora: '10:30', fecha: '2024-12-25', leido: false },
    ]);

    whatsappStats = signal({
        mensajesHoy: 47,
        noLeidos: 3,
        pedidosViaWA: 12,
        tasaRespuesta: 94
    });

    // ==================== KDS (KITCHEN) MODULE ====================
    kdsOrders = signal([
        {
            id: '1', numero: '#0028', tipo: 'local', mesa: '5', estado: 'preparando', prioridad: 'normal',
            tiempoIngreso: new Date(Date.now() - 8 * 60000), tiempoEstimado: 15,
            items: [
                { id: '1', nombre: 'Café con Leche', cantidad: 2, estado: 'listo' },
                { id: '2', nombre: 'Tostada Francés', cantidad: 2, modificadores: ['Sin mantequilla'], estado: 'preparando' },
                { id: '3', nombre: 'Jugo Natural', cantidad: 1, modificadores: ['Naranja'], estado: 'pendiente' }
            ]
        },
        {
            id: '2', numero: '#0029', tipo: 'delivery', cliente: 'Juan Pérez', estado: 'pendiente', prioridad: 'alta',
            tiempoIngreso: new Date(Date.now() - 3 * 60000), tiempoEstimado: 20,
            notas: 'Sin cebolla en las empanadas',
            items: [
                { id: '4', nombre: 'Empanada Pino', cantidad: 6, estado: 'pendiente' },
                { id: '5', nombre: 'Empanada Queso', cantidad: 4, estado: 'pendiente' }
            ]
        },
        {
            id: '3', numero: '#0030', tipo: 'pickup', cliente: 'Ana Martínez', estado: 'listo', prioridad: 'normal',
            tiempoIngreso: new Date(Date.now() - 12 * 60000), tiempoEstimado: 10,
            items: [
                { id: '6', nombre: 'Torta Chocolate', cantidad: 1, estado: 'listo' },
                { id: '7', nombre: 'Croissants', cantidad: 6, estado: 'listo' }
            ]
        },
        {
            id: '4', numero: '#0031', tipo: 'local', mesa: '12', estado: 'pendiente', prioridad: 'urgente',
            tiempoIngreso: new Date(Date.now() - 1 * 60000), tiempoEstimado: 8,
            notas: '¡CLIENTE VIP - PRIORIDAD!',
            items: [
                { id: '8', nombre: 'Café Espresso', cantidad: 2, estado: 'pendiente' },
                { id: '9', nombre: 'Pan con Palta', cantidad: 2, modificadores: ['Extra palta', 'Huevo pochado'], estado: 'pendiente' }
            ]
        }
    ]);

    kdsStats = signal({
        pendientes: 2,
        enPreparacion: 1,
        listos: 1,
        tiempoPromedio: 12
    });

    // ==================== RESERVATIONS MODULE ====================
    reservationsToday = signal([
        { id: '1', cliente: 'María González', telefono: '+56912345678', hora: '13:00', personas: 4, mesa: '5', estado: 'confirmada', notas: '' },
        { id: '2', cliente: 'Juan Pérez', telefono: '+56987654321', hora: '14:30', personas: 2, mesa: '3', estado: 'confirmada', notas: 'Aniversario - traer postre especial' },
        { id: '3', cliente: 'Empresa ABC', telefono: '+56911223344', hora: '12:30', personas: 8, mesa: '10', estado: 'pendiente', notas: 'Reunión de negocios' },
        { id: '4', cliente: 'Ana Martínez', telefono: '+56955667788', hora: '19:00', personas: 6, mesa: '', estado: 'pendiente', notas: 'Cumpleaños - necesitan decoración' },
        { id: '5', cliente: 'Carlos López', telefono: '+56944556677', hora: '20:00', personas: 2, mesa: '7', estado: 'confirmada', notas: '' },
    ]);

    reservationsTables = signal([
        { numero: '1', capacidad: 2, ubicacion: 'interior', estado: 'disponible' },
        { numero: '2', capacidad: 2, ubicacion: 'interior', estado: 'disponible' },
        { numero: '3', capacidad: 2, ubicacion: 'interior', estado: 'reservada' },
        { numero: '4', capacidad: 4, ubicacion: 'interior', estado: 'ocupada' },
        { numero: '5', capacidad: 4, ubicacion: 'interior', estado: 'reservada' },
        { numero: '6', capacidad: 4, ubicacion: 'terraza', estado: 'disponible' },
        { numero: '7', capacidad: 4, ubicacion: 'terraza', estado: 'reservada' },
        { numero: '8', capacidad: 6, ubicacion: 'terraza', estado: 'disponible' },
        { numero: '9', capacidad: 6, ubicacion: 'privado', estado: 'disponible' },
        { numero: '10', capacidad: 10, ubicacion: 'privado', estado: 'reservada' },
    ]);

    // ==================== SUBSCRIPTIONS MODULE ====================
    subscriptionsActive = signal([
        { id: '1', cliente: 'María González', plan: 'Pan Diario', frecuencia: 'Diaria', proximaEntrega: '2024-12-26', total: 45000, estado: 'activa' },
        { id: '2', cliente: 'Juan Pérez', plan: 'Desayuno Familiar', frecuencia: 'Semanal', proximaEntrega: '2024-12-28', total: 35000, estado: 'activa' },
        { id: '3', cliente: 'Empresa DEF', plan: 'Cafetería Oficina', frecuencia: 'Diaria', proximaEntrega: '2024-12-26', total: 85000, estado: 'activa' },
        { id: '4', cliente: 'Ana Martínez', plan: 'Pan Diario', frecuencia: 'Diaria', proximaEntrega: '2025-01-10', total: 30000, estado: 'pausada' },
    ]);

    subscriptionsDeliveriesToday = signal([
        { id: '1', cliente: 'María González', direccion: 'Av. Providencia 1234, Depto 501', hora: '08:00', productos: ['1kg Marraqueta', '0.5kg Hallulla'], total: 3000, entregado: true },
        { id: '2', cliente: 'Empresa DEF', direccion: 'Av. Apoquindo 4500, Of. 302', hora: '08:30', productos: ['Café 500g', '12 Croissants'], total: 15000, entregado: true },
        { id: '3', cliente: 'Roberto Silva', direccion: 'Los Leones 567', hora: '09:00', productos: ['1kg Pan Integral'], total: 2500, entregado: false },
        { id: '4', cliente: 'Carlos López', direccion: 'Vitacura 3200', hora: '10:00', productos: ['1.5kg Marraqueta'], total: 3000, entregado: false },
    ]);

    // ==================== NOTIFICATION COUNTS ====================
    getNotificationCounts() {
        return {
            whatsapp: this.whatsappMessages().filter(m => !m.leido && m.tipo === 'entrante').length,
            reservations: this.reservationsToday().length,
            kds: this.kdsOrders().filter(o => o.estado !== 'listo').length,
            subscriptions: this.subscriptionsDeliveriesToday().filter(d => !d.entregado).length
        };
    }

    // ==================== TENANT-SPECIFIC DATA ====================
    // ==================== RRHH MODULE ====================
    employees = signal([
        { id: '1', firstName: 'Juan', lastName: 'Pérez', rut: '12.345.678-9', email: 'juan.perez@eltrigal.cl', position: 'Panadero Jefe', active: true, baseSalary: 850000, hireDate: '2023-01-15', pinCode: '1234', initials: 'JP', vacationDaysRemaining: 15, documentsCount: 3, createdAt: '', updatedAt: '', countryCode: 'CL', tenantId: 'demo' },
        { id: '2', firstName: 'Ana', lastName: 'Soto', rut: '13.456.789-0', email: 'ana.soto@eltrigal.cl', position: 'Vendedora', active: true, baseSalary: 550000, hireDate: '2023-03-20', pinCode: '5678', initials: 'AS', vacationDaysRemaining: 12, documentsCount: 2, createdAt: '', updatedAt: '', countryCode: 'CL', tenantId: 'demo' },
        { id: '3', firstName: 'Carlos', lastName: 'Muñoz', rut: '14.567.890-1', email: 'carlos.munoz@eltrigal.cl', position: 'Pastelero', active: true, baseSalary: 700000, hireDate: '2023-06-10', pinCode: '9012', initials: 'CM', vacationDaysRemaining: 10, documentsCount: 2, createdAt: '', updatedAt: '', countryCode: 'CL', tenantId: 'demo' },
        { id: '4', firstName: 'María', lastName: 'López', rut: '15.678.901-2', email: 'maria.lopez@eltrigal.cl', position: 'Cajera', active: true, baseSalary: 520000, hireDate: '2023-08-01', pinCode: '3456', initials: 'ML', vacationDaysRemaining: 8, documentsCount: 1, createdAt: '', updatedAt: '', countryCode: 'CL', tenantId: 'demo' },
        { id: '5', firstName: 'Pedro', lastName: 'Ramírez', rut: '16.789.012-3', email: 'pedro.ramirez@eltrigal.cl', position: 'Ayudante', active: false, baseSalary: 450000, hireDate: '2023-11-15', pinCode: '7890', initials: 'PR', vacationDaysRemaining: 0, documentsCount: 5, createdAt: '', updatedAt: '', countryCode: 'CL', tenantId: 'demo' },
    ]);

    attendanceLogs = signal([
        { id: '1', employeeId: '1', employeeName: 'Juan Pérez', type: 'CHECK_IN', timestamp: new Date(new Date().setHours(7, 30, 0)), verified: true },
        { id: '2', employeeId: '2', employeeName: 'Ana Soto', type: 'CHECK_IN', timestamp: new Date(new Date().setHours(8, 0, 0)), verified: true },
        { id: '3', employeeId: '3', employeeName: 'Carlos Muñoz', type: 'CHECK_IN', timestamp: new Date(new Date().setHours(8, 15, 0)), verified: true },
        { id: '4', employeeId: '4', employeeName: 'María López', type: 'CHECK_IN', timestamp: new Date(new Date().setHours(8, 30, 0)), verified: true },
    ]);

    rrhhStats = signal({
        totalEmployees: 5,
        activeEmployees: 4,
        pendingLeaveRequests: 2,
        attendanceToday: '90%',
        totalPayroll: 2620000
    });

    shifts = signal([
        { id: '1', employee: { id: '1', firstName: 'Juan', lastName: 'Pérez' }, start: new Date(new Date().setHours(7, 0, 0)), end: new Date(new Date().setHours(15, 0, 0)), type: 'MORNING' },
        { id: '2', employee: { id: '2', firstName: 'Ana', lastName: 'Soto' }, start: new Date(new Date().setHours(8, 0, 0)), end: new Date(new Date().setHours(16, 0, 0)), type: 'MORNING' },
        { id: '3', employee: { id: '3', firstName: 'Carlos', lastName: 'Muñoz' }, start: new Date(new Date().setHours(14, 0, 0)), end: new Date(new Date().setHours(22, 0, 0)), type: 'AFTERNOON' },
        { id: '4', employee: { id: '4', firstName: 'María', lastName: 'López' }, start: new Date(new Date().setHours(15, 0, 0)), end: new Date(new Date().setHours(23, 0, 0)), type: 'AFTERNOON' }
    ]);

    leaveRequests = signal([
        { id: '1', employeeId: '1', employeeName: 'Juan Pérez', type: 'VACATION', startDate: '2025-02-01', endDate: '2025-02-15', daysRequested: 10, status: 'PENDING', createdAt: '2025-01-20', reason: 'Vacaciones familiares' },
        { id: '2', employeeId: '2', employeeName: 'Ana Soto', type: 'MEDICAL_LEAVE', startDate: '2025-01-25', endDate: '2025-01-28', daysRequested: 3, status: 'APPROVED', createdAt: '2025-01-18', reason: 'Gripe' },
        { id: '3', employeeId: '3', employeeName: 'Carlos Muñoz', type: 'SALARY_ADVANCE', amountRequested: 200000, status: 'PENDING', createdAt: '2025-01-22', reason: 'Reparación auto', daysRequested: 0 },
        { id: '4', employeeId: '4', employeeName: 'María López', type: 'ADMINISTRATIVE_DAY', startDate: '2025-01-30', endDate: '2025-01-30', daysRequested: 1, status: 'APPROVED', createdAt: '2025-01-15', reason: 'Trámite personal' }
    ]);

    getTenantDemoData(tenantId: string) {
        // Returns demo data customized for the tenant
        // For now, all tenants get the same El Trigal bakery data
        return {
            loyalty: {
                customers: this.loyaltyCustomers(),
                redemptions: this.loyaltyRedemptions()
            },
            whatsapp: {
                messages: this.whatsappMessages(),
                stats: this.whatsappStats()
            },
            kds: {
                orders: this.kdsOrders(),
                stats: this.kdsStats()
            },
            reservations: {
                today: this.reservationsToday(),
                tables: this.reservationsTables()
            },
            subscriptions: {
                active: this.subscriptionsActive(),
                deliveriesToday: this.subscriptionsDeliveriesToday()
            },
            rrhh: {
                employees: this.employees(),
                attendance: this.attendanceLogs(),
                stats: this.rrhhStats(),
                shifts: this.shifts(),
                leaveRequests: this.leaveRequests()
            }
        };
    }
}
