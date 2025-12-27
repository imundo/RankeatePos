import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CobrosPagosRoutingModule } from './cobros-pagos-routing.module';
import { CobrosPagosDashboardComponent } from './pages/cobros-pagos-dashboard.component';

@NgModule({
    imports: [
        CommonModule,
        CobrosPagosRoutingModule,
        CobrosPagosDashboardComponent
    ]
})
export class CobrosPagosModule { }
