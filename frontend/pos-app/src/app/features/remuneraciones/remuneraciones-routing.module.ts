import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RemuneracionesDashboardComponent } from './pages/remuneraciones-dashboard.component';

const routes: Routes = [
    { path: '', component: RemuneracionesDashboardComponent },
    {
        path: 'empleados',
        loadComponent: () => import('./pages/empleados.component').then(m => m.EmpleadosComponent)
    },
    {
        path: 'liquidaciones',
        loadComponent: () => import('./pages/liquidaciones.component').then(m => m.LiquidacionesComponent)
    },
    {
        path: 'procesar-nomina',
        loadComponent: () => import('./pages/procesar-nomina.component').then(m => m.ProcesarNominaComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RemuneracionesRoutingModule { }
