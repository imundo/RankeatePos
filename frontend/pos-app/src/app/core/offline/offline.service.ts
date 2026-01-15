import { Injectable, signal, effect } from '@angular/core';
import Dexie, { Table } from 'dexie';

// Interfaces for cached data
export interface CachedProduct {
    id: string;
    sku: string;
    nombre: string;
    categoryId?: string;
    categoryName?: string;
    imagenUrl?: string;
    unitCode: string;
    variants: CachedVariant[];
    syncedAt: Date;
}

export interface CachedVariant {
    id: string;
    sku: string;
    nombre?: string;
    barcode?: string;
    precioBruto: number;
    precioNeto: number;
    taxPercentage: number;
    stock?: number;
}

export interface PendingCommand {
    id: string;
    type: 'CREATE_SALE' | 'CANCEL_SALE';
    payload: any;
    status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
    retries: number;
    createdAt: Date;
    error?: string;
}

class PosDatabase extends Dexie {
    products!: Table<CachedProduct>;
    pendingCommands!: Table<PendingCommand>;

    constructor() {
        super('pos-offline-db');

        this.version(1).stores({
            products: 'id, sku, categoryId, syncedAt',
            pendingCommands: 'id, type, status, createdAt'
        });
    }
}

@Injectable({
    providedIn: 'root'
})
export class OfflineService {
    private db: PosDatabase;

    isOffline = signal(false);
    pendingCount = signal(0);

    constructor() {
        this.db = new PosDatabase();
        this.initNetworkListener();
        this.updatePendingCount();
    }

    private initNetworkListener(): void {
        // Estado inicial
        this.isOffline.set(!navigator.onLine);

        // Listeners
        window.addEventListener('online', () => {
            this.isOffline.set(false);
            this.syncPendingCommands();
        });

        window.addEventListener('offline', () => {
            this.isOffline.set(true);
        });
    }

    // === Productos ===

    /**
     * Cache products for the current tenant.
     * Automatically clears cache if tenant has changed.
     */
    async cacheProducts(products: CachedProduct[], tenantId?: string): Promise<void> {
        // Check if tenant changed - if so, clear old cache
        const storedTenant = localStorage.getItem('pos_cached_tenant');
        if (tenantId && storedTenant && storedTenant !== tenantId) {
            console.log(`Tenant changed from ${storedTenant} to ${tenantId}, clearing cache`);
            await this.clearCache();
        }

        // Store current tenant
        if (tenantId) {
            localStorage.setItem('pos_cached_tenant', tenantId);
        }

        const withSyncTime = products.map(p => ({
            ...p,
            syncedAt: new Date()
        }));
        await this.db.products.bulkPut(withSyncTime);
        console.log(`Cached ${products.length} products for tenant ${tenantId || 'unknown'}`);
    }

    async getCachedProducts(): Promise<CachedProduct[]> {
        return this.db.products.toArray();
    }

    async findProductByCode(code: string): Promise<CachedProduct | undefined> {
        // Buscar por SKU de producto
        let product = await this.db.products.where('sku').equals(code).first();

        if (!product) {
            // Buscar en variantes por SKU o barcode
            const allProducts = await this.db.products.toArray();
            product = allProducts.find(p =>
                p.variants.some(v => v.sku === code || v.barcode === code)
            );
        }

        return product;
    }

    // === Comandos pendientes (ventas offline) ===

    async addPendingCommand(type: PendingCommand['type'], payload: any): Promise<string> {
        const command: PendingCommand = {
            id: crypto.randomUUID(),
            type,
            payload,
            status: 'PENDING',
            retries: 0,
            createdAt: new Date()
        };

        await this.db.pendingCommands.add(command);
        await this.updatePendingCount();

        console.log(`Added pending command: ${command.id}`, command);

        return command.id;
    }

    async getPendingCommands(): Promise<PendingCommand[]> {
        return this.db.pendingCommands
            .where('status')
            .equals('PENDING')
            .sortBy('createdAt');
    }

    async markCommandSynced(id: string): Promise<void> {
        await this.db.pendingCommands.update(id, { status: 'SYNCED' });
        await this.updatePendingCount();
    }

    async markCommandFailed(id: string, error: string): Promise<void> {
        const command = await this.db.pendingCommands.get(id);
        if (command) {
            await this.db.pendingCommands.update(id, {
                status: command.retries >= 3 ? 'FAILED' : 'PENDING',
                retries: command.retries + 1,
                error
            });
        }
        await this.updatePendingCount();
    }

    async syncPendingCommands(): Promise<void> {
        console.log('Syncing pending commands...');
        const commands = await this.getPendingCommands();

        for (const command of commands) {
            try {
                // TODO: Llamar al API para sincronizar
                // Por ahora solo marcamos como sincronizado
                console.log('Would sync:', command);
                // await this.markCommandSynced(command.id);
            } catch (err) {
                console.error('Sync failed for command:', command.id, err);
                // await this.markCommandFailed(command.id, String(err));
            }
        }
    }

    private async updatePendingCount(): Promise<void> {
        const count = await this.db.pendingCommands
            .where('status')
            .equals('PENDING')
            .count();
        this.pendingCount.set(count);
    }

    // === Limpieza ===

    async clearCache(): Promise<void> {
        await this.db.products.clear();
        await this.db.pendingCommands.where('status').equals('SYNCED').delete();
    }
}
