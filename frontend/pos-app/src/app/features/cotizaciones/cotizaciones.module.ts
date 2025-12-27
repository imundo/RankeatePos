import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CotizacionesRoutingModule } from './cotizaciones-routing.module';
import { CotizacionesDashboardComponent } from './pages/cotizaciones-dashboard.component';

@NgModule({
    imports: [
        CommonModule,
        CotizacionesRoutingModule,
        CotizacionesDashboardComponent
    ]
})
export class CotizacionesModule { }
