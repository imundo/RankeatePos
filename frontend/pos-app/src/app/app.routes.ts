import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { moduleGuard } from './core/auth/module.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'pos',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    // === Core POS (always available) ===
    {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent),
        canActivate: [authGuard]
    },
    {
        path: 'service-pos',
        loadComponent: () => import('./features/service-pos/service-pos.component').then(m => m.ServicePosComponent),
        canActivate: [authGuard, moduleGuard('service_pos')]
    },
    {
        path: 'smart-pos',
        loadComponent: () => import('./features/smart-pos/smart-pos.component').then(m => m.SmartPosComponent),
        canActivate: [authGuard, moduleGuard('smart_pos')]
    },
    // === Catalog & Products ===
    {
        path: 'catalog',
        loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
        canActivate: [authGuard, moduleGuard('products')]
    },
    {
        path: 'price-lists',
        loadComponent: () => import('./features/pricing/price-list.component').then(m => m.PriceListComponent),
        canActivate: [authGuard, moduleGuard('products')]
    },
    // === Dashboard & Analytics ===
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
        canActivate: [authGuard, moduleGuard('analytics')]
    },
    {
        path: 'reports',
        loadComponent: () => import('./features/reports/sales-report.component').then(m => m.SalesReportComponent),
        canActivate: [authGuard, moduleGuard('analytics')]
    },
    {
        path: 'earnings',
        loadComponent: () => import('./features/earnings/daily-earnings.component').then(m => m.DailyEarningsComponent),
        canActivate: [authGuard]
    },
    // === Inventory ===
    {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
        canActivate: [authGuard, moduleGuard('inventory')]
    },
    // === Settings & Account ===
    {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'company',
        loadComponent: () => import('./features/settings/company-management/company-management.component').then(m => m.CompanyManagementComponent),
        canActivate: [authGuard]
    },
    {
        path: 'my-account',
        loadComponent: () => import('./features/account/my-account.component').then(m => m.MyAccountComponent),
        canActivate: [authGuard]
    },
    // === Loyalty & Subscriptions ===
    {
        path: 'loyalty',
        loadComponent: () => import('./features/loyalty/loyalty.component').then(m => m.LoyaltyComponent),
        canActivate: [authGuard, moduleGuard('loyalty')]
    },
    {
        path: 'subscriptions',
        loadComponent: () => import('./features/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent),
        canActivate: [authGuard, moduleGuard('subscriptions')]
    },
    // === Kitchen Display ===
    {
        path: 'kds',
        loadComponent: () => import('./features/kds/kds.component').then(m => m.KdsComponent),
        canActivate: [authGuard, moduleGuard('kds')]
    },
    // === WhatsApp ===
    {
        path: 'whatsapp',
        loadComponent: () => import('./features/whatsapp/whatsapp.component').then(m => m.WhatsappComponent),
        canActivate: [authGuard, moduleGuard('whatsapp')]
    },
    // === Reservations & Appointments ===
    {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservations.component').then(m => m.ReservationsComponent),
        canActivate: [authGuard, moduleGuard('reservations')]
    },
    {
        path: 'appointments',
        loadComponent: () => import('./features/citas/appointments.component').then(m => m.AppointmentsComponent),
        canActivate: [authGuard, moduleGuard('appointments')]
    },
    // === Menu Generator ===
    {
        path: 'menu-generator',
        loadComponent: () => import('./features/menu-generator/menu-generator.component').then(m => m.MenuGeneratorComponent),
        canActivate: [authGuard, moduleGuard('menu_generator')]
    },
    // === Admin (Super Admin only) ===
    {
        path: 'admin/login',
        loadComponent: () => import('./features/admin/admin-login.component').then(m => m.AdminLoginComponent)
    },
    {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
        canActivate: [authGuard]
        // Admin routes have their own SAAS_ADMIN role check inside
    },
    // === Facturación ===
    {
        path: 'facturacion',
        loadChildren: () => import('./features/facturacion/facturacion.routes').then(m => m.FACTURACION_ROUTES),
        canActivate: [authGuard, moduleGuard('billing')]
    },
    // === ERP Modules ===
    {
        path: 'contabilidad',
        loadChildren: () => import('./features/contabilidad/contabilidad.module').then(m => m.ContabilidadModule),
        canActivate: [authGuard, moduleGuard('accounting')]
    },
    {
        path: 'cobros-pagos',
        loadChildren: () => import('./features/cobros-pagos/cobros-pagos.module').then(m => m.CobrosPagosModule),
        canActivate: [authGuard, moduleGuard('collections')]
    },
    {
        path: 'compras',
        loadChildren: () => import('./features/compras/compras.module').then(m => m.ComprasModule),
        canActivate: [authGuard, moduleGuard('purchases')]
    },
    {
        path: 'purchase-requests',
        loadComponent: () => import('./features/compras/requests/purchase-request.component').then(m => m.PurchaseRequestComponent),
        canActivate: [authGuard, moduleGuard('purchases')]
    },
    {
        path: 'reception',
        loadComponent: () => import('./features/compras/reception/reception.component').then(m => m.ReceptionComponent),
        canActivate: [authGuard, moduleGuard('purchases')]
    },
    {
        path: 'presupuesto',
        loadChildren: () => import('./features/presupuesto/presupuesto.module').then(m => m.PresupuestoModule),
        canActivate: [authGuard, moduleGuard('budget')]
    },
    {
        path: 'flujo-caja',
        loadChildren: () => import('./features/flujo-caja/flujo-caja.module').then(m => m.FlujoCajaModule),
        canActivate: [authGuard, moduleGuard('cashflow')]
    },
    // === RRHH ===
    {
        path: 'remuneraciones',
        loadComponent: () => import('./features/rrhh/payroll/payroll.component').then(m => m.PayrollComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'staff',
        loadComponent: () => import('./features/rrhh/staff/staff-list.component').then(m => m.StaffListComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'rrhh/staff',
        loadComponent: () => import('./features/rrhh/staff/staff-list.component').then(m => m.StaffListComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'rrhh/staff/:id',
        loadComponent: () => import('./features/rrhh/staff/employee-detail.component').then(m => m.EmployeeDetailComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'rrhh/dashboard',
        loadComponent: () => import('./features/rrhh/dashboard/hr-dashboard.component').then(m => m.HrDashboardComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'rrhh/reviews',
        loadComponent: () => import('./features/rrhh/reviews/performance-review.component').then(m => m.PerformanceReviewComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'rrhh/leaves',
        loadComponent: () => import('./features/rrhh/leaves/leave-requests.component').then(m => m.LeaveRequestsComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'attendance',
        loadComponent: () => import('./features/rrhh/attendance/attendance.component').then(m => m.AttendanceComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'rrhh/attendance-admin',
        loadComponent: () => import('./features/rrhh/attendance/admin/attendance-admin.component').then(m => m.AttendanceAdminComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'public/attendance/clock-in',
        loadComponent: () => import('./features/public/attendance-clock-in/attendance-clock-in.component').then(m => m.AttendanceClockInComponent)
    },
    {
        path: 'rrhh/shifts',
        loadComponent: () => import('./features/rrhh/shifts/shift-admin.component').then(m => m.ShiftAdminComponent),
        canActivate: [authGuard, moduleGuard('hr')]
    },
    {
        path: 'attendance/public/:token',
        loadComponent: () => import('./features/rrhh/attendance/public-attendance.component').then(m => m.PublicAttendanceComponent)
        // No authGuard - public route
    },
    // === Cotizaciones ===
    {
        path: 'cotizaciones',
        loadChildren: () => import('./features/cotizaciones/cotizaciones.module').then(m => m.CotizacionesModule),
        canActivate: [authGuard, moduleGuard('quotes')]
    },
    // === Marketing ===
    {
        path: 'marketing/crm',
        loadComponent: () => import('./features/marketing/crm.component').then(m => m.CrmComponent),
        canActivate: [authGuard, moduleGuard('crm')]
    },
    {
        path: 'marketing/email',
        loadComponent: () => import('./features/marketing/email.component').then(m => m.EmailComponent),
        canActivate: [authGuard, moduleGuard('marketing')]
    },
    {
        path: 'marketing/promotions',
        loadComponent: () => import('./features/marketing/promotions.component').then(m => m.PromotionsComponent),
        canActivate: [authGuard, moduleGuard('marketing')]
    },
    {
        path: 'marketing/reviews',
        loadComponent: () => import('./features/marketing/reviews.component').then(m => m.ReviewsComponent),
        canActivate: [authGuard, moduleGuard('marketing')]
    },
    {
        path: 'marketing/referrals',
        loadComponent: () => import('./features/marketing/referrals.component').then(m => m.ReferralsComponent),
        canActivate: [authGuard, moduleGuard('marketing')]
    },
    {
        path: '**',
        redirectTo: 'pos'
    }
];
