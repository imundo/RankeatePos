import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContabilidadDashboardComponent } from './pages/contabilidad-dashboard.component';

const routes: Routes = [
    {
        path: '',
        component: ContabilidadDashboardComponent,
        data: { title: 'Contabilidad' }
    },
    {
        path: 'plan-cuentas',
        loadComponent: () => import('./pages/plan-cuentas.component').then(m => m.PlanCuentasComponent),
        data: { title: 'Plan de Cuentas' }
    },
    {
        path: 'libro-diario',
        loadComponent: () => import('./pages/libro-diario.component').then(m => m.LibroDiarioComponent),
        data: { title: 'Libro Diario' }
    },
    {
        path: 'asientos/nuevo',
        loadComponent: () => import('./pages/crear-asiento.component').then(m => m.CrearAsientoComponent),
        data: { title: 'Nuevo Asiento' }
    },
    {
        path: 'conciliacion-bancaria',
        loadComponent: () => import('./pages/conciliacion-bancaria.component').then(m => m.ConciliacionBancariaComponent),
        data: { title: 'Conciliación Bancaria' }
    },
    {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes-contables.component').then(m => m.ReportesContablesComponent),
        data: { title: 'Reportes Contables' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ContabilidadRoutingModule { }
