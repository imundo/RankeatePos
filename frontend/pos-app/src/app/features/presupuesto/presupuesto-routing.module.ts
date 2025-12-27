import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PresupuestoDashboardComponent } from './pages/presupuesto-dashboard.component';

const routes: Routes = [
    { path: '', component: PresupuestoDashboardComponent },
    {
        path: 'crear',
        loadComponent: () => import('./pages/crear-presupuesto.component').then(m => m.CrearPresupuestoComponent)
    },
    {
        path: 'ejecutar',
        loadComponent: () => import('./pages/ejecucion-presupuesto.component').then(m => m.EjecucionPresupuestoComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PresupuestoRoutingModule { }
