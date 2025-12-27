import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComprasRoutingModule } from './compras-routing.module';
import { ComprasDashboardComponent } from './pages/compras-dashboard.component';

@NgModule({
    imports: [
        CommonModule,
        ComprasRoutingModule,
        ComprasDashboardComponent
    ]
})
export class ComprasModule { }
