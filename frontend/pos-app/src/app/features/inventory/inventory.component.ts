import { BranchContextService } from '@core/services/branch-context.service';

@Component({
  // ...
})
export class InventoryComponent implements OnInit {
  private authService = inject(AuthService);
  private stockService = inject(StockService);
  private offlineService = inject(OfflineService);
  private branchService = inject(BranchContextService); // New injection

  // ...

  async loadData(forceApi = false) {
    this.loading.set(true);
    // Use active branch if available, otherwise fallback (though stock usually requires branch)
    const branchId = this.branchService.activeBranchId() || this.authService.tenant()?.id || '';

    console.log('Loading inventory for branch:', branchId);

    try {
      // ...
      branchId: branchId,
      // ...

      // 2. Fallback to API
      const stockData = await this.stockService.getStockByBranch(branchId).toPromise().catch(e => {
        // ...
      }

  // ...

  async submitAdjustment() {
        if(!this.selectedStockItem) return;
      const branchId = this.branchService.activeBranchId() || this.authService.tenant()?.id || '';

      const req: StockAdjustmentRequest = {
        variantId: this.selectedStockItem.variantId,
        branchId,
        //...

        this.loading.set(true);
        try {
          const updatedStock = await this.stockService.adjustStock(req).toPromise();

          // Update local cache manually to reflect changes immediately
          if(updatedStock) {
            console.log('Adjustment success, updating UI for variant:', updatedStock.variantId);

            // Strategy: We will reload data from API to be sure, avoiding cache for this read
            console.log('Clearing local cache to force refresh...');
            await this.offlineService.clearCache();

            // Update the specific item in the list signal directly for immediate UI feedback (using variantId for safety)
            this.stock.update(items => items.map(i => i.variantId === updatedStock.variantId ? updatedStock : i));

            // Also update selected item if still open (though we close modal)
          }

      this.closeAdjustModal();
          this.loadData(true); // reload with forceApi = true
        } catch(e) { console.error('Error submitting adjustment:', e); alert('Error al ajustar stock'); }
    finally { this.loading.set(false); }
      }

      // Helpers
      calculateTotalValue(): string {
        // Mock calculation as cost price might not be in StockDto, assumes $1000 avg for demo
        return '$' + (this.stock().reduce((acc, i) => acc + i.cantidadDisponible, 0) * 1000).toLocaleString();
      }

      calculateProgress(item: StockDto): number {
        const max = Math.max(item.stockMinimo * 3, item.cantidadDisponible);
        return max > 0 ? (item.cantidadDisponible / max) * 100 : 0;
      }

      getMovementIcon(tipo: TipoMovimiento) {
        if (tipo.includes('ENTRADA') || tipo.includes('POSITIVO')) return '📥';
        if (tipo.includes('SALIDA') || tipo.includes('NEGATIVO') || tipo.includes('MERMA')) return '📤';
        return '🔄';
      }

      isPositive(tipo: TipoMovimiento) {
        return ['ENTRADA', 'AJUSTE_POSITIVO', 'TRANSFERENCIA_ENTRADA', 'DEVOLUCION'].includes(tipo);
      }

      formatMovementType(t: string) { return t.replace(/_/g, ' '); }

      formatDate(d: string) { return new Date(d).toLocaleDateString(); }
    }
