import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CotizacionesDashboardComponent } from './pages/cotizaciones-dashboard.component';

const routes: Routes = [
    { path: '', component: CotizacionesDashboardComponent },
    {
        path: 'nueva',
        loadComponent: () => import('./pages/crear-cotizacion.component').then(m => m.CrearCotizacionComponent)
    },
    {
        path: 'lista',
        loadComponent: () => import('./pages/lista-cotizaciones.component').then(m => m.ListaCotizacionesComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CotizacionesRoutingModule { }
