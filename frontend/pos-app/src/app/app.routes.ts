import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
    {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent),
        canActivate: [authGuard]
    },
    {
        path: 'catalog',
        loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
        canActivate: [authGuard]
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
        canActivate: [authGuard]
    },
    {
        path: 'reports',
        loadComponent: () => import('./features/reports/sales-report.component').then(m => m.SalesReportComponent),
        canActivate: [authGuard]
    },
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
        path: 'earnings',
        loadComponent: () => import('./features/earnings/daily-earnings.component').then(m => m.DailyEarningsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'loyalty',
        loadComponent: () => import('./features/loyalty/loyalty.component').then(m => m.LoyaltyComponent),
        canActivate: [authGuard]
    },
    {
        path: 'subscriptions',
        loadComponent: () => import('./features/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'kds',
        loadComponent: () => import('./features/kds/kds.component').then(m => m.KdsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'whatsapp',
        loadComponent: () => import('./features/whatsapp/whatsapp.component').then(m => m.WhatsappComponent),
        canActivate: [authGuard]
    },
    {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservations.component').then(m => m.ReservationsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'menu-generator',
        loadComponent: () => import('./features/menu-generator/menu-generator.component').then(m => m.MenuGeneratorComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/login',
        loadComponent: () => import('./features/admin/admin-login.component').then(m => m.AdminLoginComponent)
    },
    {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
        canActivate: [authGuard]
        // TODO: Add adminGuard to verify SAAS_ADMIN role
    },
    {
        path: 'facturacion',
        loadChildren: () => import('./features/facturacion/facturacion.routes').then(m => m.FACTURACION_ROUTES),
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'pos'
    }
];
