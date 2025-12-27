import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContabilidadRoutingModule } from './contabilidad-routing.module';
import { ContabilidadDashboardComponent } from './pages/contabilidad-dashboard.component';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        ContabilidadRoutingModule,
        ContabilidadDashboardComponent
    ]
})
export class ContabilidadModule { }
