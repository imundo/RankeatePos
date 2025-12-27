import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CobrosPagosDashboardComponent } from './pages/cobros-pagos-dashboard.component';

const routes: Routes = [
    { path: '', component: CobrosPagosDashboardComponent },
    {
        path: 'cuentas-por-cobrar',
        loadComponent: () => import('./pages/cuentas-por-cobrar.component').then(m => m.CuentasPorCobrarComponent)
    },
    {
        path: 'cuentas-por-pagar',
        loadComponent: () => import('./pages/cuentas-por-pagar.component').then(m => m.CuentasPorPagarComponent)
    },
    {
        path: 'registrar-cobro',
        loadComponent: () => import('./pages/registrar-cobro.component').then(m => m.RegistrarCobroComponent)
    },
    {
        path: 'registrar-pago',
        loadComponent: () => import('./pages/registrar-pago.component').then(m => m.RegistrarPagoComponent)
    },
    {
        path: 'cobranza',
        loadComponent: () => import('./pages/gestion-cobranza.component').then(m => m.GestionCobranzaComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CobrosPagosRoutingModule { }
