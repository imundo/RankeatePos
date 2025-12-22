import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { Category } from './catalog.service';

export type IndustryType = 'panaderia' | 'cursos' | 'editorial' | 'minimarket' | 'charcuteria';

// Simplified product interface for mock data
export interface MockProduct {
    id: string;
    nombre: string;
    descripcion?: string;
    precioVenta: number;
    categoriaId: string;
    codigoBarras?: string;
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
}

export interface IndustryConfig {
    type: IndustryType;
    name: string;
    icon: string;
    terminology: {
        product: string;
        products: string;
        category: string;
        categories: string;
        sale: string;
        price: string;
        stock: string;
        client: string;
    };
    features: {
        showStock: boolean;       // Editorial/Panaderia need stock, Cursos dont
        showDuration: boolean;    // Cursos shows duration
        showPages: boolean;       // Editorial shows pages
        showWeight: boolean;      // Panaderia shows weight
        showModality: boolean;    // Cursos: Online/Presencial
        showFormat: boolean;      // Editorial: PDF, Print, etc
    };
}

@Injectable({ providedIn: 'root' })
export class IndustryMockDataService {
    private authService = inject(AuthService);

    private industryConfigs: Record<string, IndustryConfig> = {
        'eltrigal.cl': {
            type: 'panaderia',
            name: 'Panadería',
            icon: '🥖',
            terminology: {
                product: 'Producto', products: 'Productos',
                category: 'Categoría', categories: 'Categorías',
                sale: 'Venta', price: 'Precio', stock: 'Stock', client: 'Cliente'
            },
            features: { showStock: true, showDuration: false, showPages: false, showWeight: true, showModality: false, showFormat: false }
        },
        'aprende.cl': {
            type: 'cursos',
            name: 'Academia Online',
            icon: '🎓',
            terminology: {
                product: 'Curso', products: 'Cursos',
                category: 'Área', categories: 'Áreas',
                sale: 'Inscripción', price: 'Inversión', stock: 'Cupos', client: 'Estudiante'
            },
            features: { showStock: false, showDuration: true, showPages: false, showWeight: false, showModality: true, showFormat: false }
        },
        'imprenta.cl': {
            type: 'editorial',
            name: 'Editorial',
            icon: '📚',
            terminology: {
                product: 'Publicación', products: 'Publicaciones',
                category: 'Tipo', categories: 'Tipos',
                sale: 'Pedido', price: 'Precio', stock: 'Inventario', client: 'Cliente'
            },
            features: { showStock: true, showDuration: false, showPages: true, showWeight: false, showModality: false, showFormat: true }
        },
        'donpedro.cl': {
            type: 'minimarket',
            name: 'Minimarket',
            icon: '🛒',
            terminology: {
                product: 'Producto', products: 'Productos',
                category: 'Categoría', categories: 'Categorías',
                sale: 'Venta', price: 'Precio', stock: 'Stock', client: 'Cliente'
            },
            features: { showStock: true, showDuration: false, showPages: false, showWeight: false, showModality: false, showFormat: false }
        },
        'laselecta.cl': {
            type: 'charcuteria',
            name: 'Charcutería',
            icon: '🧀',
            terminology: {
                product: 'Producto', products: 'Productos',
                category: 'Categoría', categories: 'Categorías',
                sale: 'Venta', price: 'Precio', stock: 'Stock', client: 'Cliente'
            },
            features: { showStock: true, showDuration: false, showPages: false, showWeight: true, showModality: false, showFormat: false }
        }
    };

    getIndustryConfig(): IndustryConfig {
        const email = this.authService.user()?.email || '';
        const domain = email.split('@')[1] || 'eltrigal.cl';
        return this.industryConfigs[domain] || this.industryConfigs['eltrigal.cl'];
    }

    getMockCategories(): Category[] {
        const config = this.getIndustryConfig();

        switch (config.type) {
            case 'cursos':
                return [
                    { id: '1', nombre: 'Desarrollo Web', descripcion: 'Cursos de programación web', orden: 1, activa: true },
                    { id: '2', nombre: 'Marketing Digital', descripcion: 'Publicidad y redes sociales', orden: 2, activa: true },
                    { id: '3', nombre: 'Diseño UX/UI', descripcion: 'Experiencia de usuario e interfaces', orden: 3, activa: true },
                    { id: '4', nombre: 'Liderazgo', descripcion: 'Habilidades de gestión', orden: 4, activa: true },
                    { id: '5', nombre: 'Finanzas Personales', descripcion: 'Educación financiera', orden: 5, activa: true },
                ];

            case 'editorial':
                return [
                    { id: '1', nombre: 'Libros Impresos', descripcion: 'Libros físicos encuadernados', orden: 1, activa: true },
                    { id: '2', nombre: 'Revistas', descripcion: 'Publicaciones periódicas', orden: 2, activa: true },
                    { id: '3', nombre: 'Catálogos', descripcion: 'Catálogos corporativos', orden: 3, activa: true },
                    { id: '4', nombre: 'Folletos', descripcion: 'Material promocional', orden: 4, activa: true },
                    { id: '5', nombre: 'Tarjetas', descripcion: 'Tarjetas de presentación', orden: 5, activa: true },
                ];

            case 'minimarket':
                return [
                    { id: '1', nombre: 'Bebidas', descripcion: 'Gaseosas, jugos, agua', orden: 1, activa: true },
                    { id: '2', nombre: 'Snacks', descripcion: 'Papas, galletas, dulces', orden: 2, activa: true },
                    { id: '3', nombre: 'Lácteos', descripcion: 'Leche, yogurt, queso', orden: 3, activa: true },
                    { id: '4', nombre: 'Panadería', descripcion: 'Pan, pasteles', orden: 4, activa: true },
                    { id: '5', nombre: 'Abarrotes', descripcion: 'Arroz, fideos, aceite', orden: 5, activa: true },
                ];

            case 'charcuteria':
                return [
                    { id: '1', nombre: 'Jamones', descripcion: 'Jamones curados y cocidos', orden: 1, activa: true },
                    { id: '2', nombre: 'Quesos', descripcion: 'Quesos nacionales e importados', orden: 2, activa: true },
                    { id: '3', nombre: 'Embutidos', descripcion: 'Salchichones, chorizos y más', orden: 3, activa: true },
                    { id: '4', nombre: 'Aceitunas', descripcion: 'Aceitunas y encurtidos', orden: 4, activa: true },
                    { id: '5', nombre: 'Vinos', descripcion: 'Vinos para acompañar', orden: 5, activa: true },
                    { id: '6', nombre: 'Tablas', descripcion: 'Tablas armadas y picoteo', orden: 6, activa: true },
                ];

            default: // panaderia
                return [
                    { id: '1', nombre: 'Panadería', descripcion: 'Panes frescos del día', orden: 1, activa: true },
                    { id: '2', nombre: 'Pastelería', descripcion: 'Tortas y pasteles', orden: 2, activa: true },
                    { id: '3', nombre: 'Empanadas', descripcion: 'Empanadas de horno', orden: 3, activa: true },
                    { id: '4', nombre: 'Café', descripcion: 'Bebidas calientes', orden: 4, activa: true },
                ];
        }
    }

    getMockProducts(): MockProduct[] {
        const config = this.getIndustryConfig();

        switch (config.type) {
            case 'cursos':
                return [
                    { id: '1', nombre: 'HTML, CSS y JavaScript desde Cero', descripcion: 'Aprende las bases del desarrollo web frontend. 40 horas de contenido.', precioVenta: 89990, categoriaId: '1', codigoBarras: 'CUR001', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '2', nombre: 'React.js Avanzado', descripcion: 'Domina React con hooks, context y Redux. 60 horas.', precioVenta: 129990, categoriaId: '1', codigoBarras: 'CUR002', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '3', nombre: 'Meta Ads y Google Ads', descripcion: 'Publicidad digital efectiva. 25 horas + certificación.', precioVenta: 79990, categoriaId: '2', codigoBarras: 'CUR003', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '4', nombre: 'Redes Sociales para Negocios', descripcion: 'Instagram, TikTok, LinkedIn para empresas. 20 horas.', precioVenta: 59990, categoriaId: '2', codigoBarras: 'CUR004', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '5', nombre: 'Diseño UX con Figma', descripcion: 'Prototipado profesional. 35 horas + proyecto final.', precioVenta: 99990, categoriaId: '3', codigoBarras: 'CUR005', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '6', nombre: 'UI Design Systems', descripcion: 'Crea sistemas de diseño escalables. 30 horas.', precioVenta: 89990, categoriaId: '3', codigoBarras: 'CUR006', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '7', nombre: 'Liderazgo Transformacional', descripcion: 'Lidera equipos de alto rendimiento. 15 horas.', precioVenta: 69990, categoriaId: '4', codigoBarras: 'CUR007', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '8', nombre: 'Inversiones para Principiantes', descripcion: 'Fondos, acciones y cripto. 20 horas.', precioVenta: 49990, categoriaId: '5', codigoBarras: 'CUR008', stockActual: 999, stockMinimo: 0, activo: true },
                ];

            case 'editorial':
                return [
                    { id: '1', nombre: 'Libro 100 páginas - Rústica', descripcion: 'Impresión offset, tapa blanda', precioVenta: 15990, categoriaId: '1', codigoBarras: 'EDI001', stockActual: 150, stockMinimo: 20, activo: true },
                    { id: '2', nombre: 'Libro 200 páginas - Tapa Dura', descripcion: 'Encuadernación premium con lomo', precioVenta: 29990, categoriaId: '1', codigoBarras: 'EDI002', stockActual: 80, stockMinimo: 15, activo: true },
                    { id: '3', nombre: 'Revista A4 - 32 páginas', descripcion: 'Papel couché brillante 150gr', precioVenta: 8990, categoriaId: '2', codigoBarras: 'EDI003', stockActual: 500, stockMinimo: 50, activo: true },
                    { id: '4', nombre: 'Catálogo Corporativo', descripcion: '24 páginas full color A4', precioVenta: 12990, categoriaId: '3', codigoBarras: 'EDI004', stockActual: 200, stockMinimo: 30, activo: true },
                    { id: '5', nombre: 'Tríptico Promocional', descripcion: 'Papel couché 200gr, laminado', precioVenta: 890, categoriaId: '4', codigoBarras: 'EDI005', stockActual: 1000, stockMinimo: 100, activo: true },
                    { id: '6', nombre: 'Díptico Institucional', descripcion: 'A4 doblado, full color', precioVenta: 590, categoriaId: '4', codigoBarras: 'EDI006', stockActual: 800, stockMinimo: 100, activo: true },
                    { id: '7', nombre: 'Tarjetas de Visita x100', descripcion: 'Papel 350gr, laminado mate', precioVenta: 5990, categoriaId: '5', codigoBarras: 'EDI007', stockActual: 300, stockMinimo: 50, activo: true },
                    { id: '8', nombre: 'Tarjetas Premium x100', descripcion: 'Hot stamping dorado + relieve', precioVenta: 14990, categoriaId: '5', codigoBarras: 'EDI008', stockActual: 100, stockMinimo: 20, activo: true },
                ];

            case 'minimarket':
                return [
                    { id: '1', nombre: 'Coca-Cola 500ml', descripcion: 'Bebida gaseosa', precioVenta: 990, categoriaId: '1', codigoBarras: '7802800001', stockActual: 120, stockMinimo: 24, activo: true },
                    { id: '2', nombre: 'Agua Mineral 1.5L', descripcion: 'Sin gas', precioVenta: 790, categoriaId: '1', codigoBarras: '7802800002', stockActual: 60, stockMinimo: 12, activo: true },
                    { id: '3', nombre: 'Papas Fritas Lays 150g', descripcion: 'Sabor clásico', precioVenta: 1890, categoriaId: '2', codigoBarras: '7802800003', stockActual: 48, stockMinimo: 12, activo: true },
                    { id: '4', nombre: 'Galletas Oreo', descripcion: 'Paquete familiar', precioVenta: 1590, categoriaId: '2', codigoBarras: '7802800004', stockActual: 36, stockMinimo: 10, activo: true },
                    { id: '5', nombre: 'Leche Entera 1L', descripcion: 'Caja tetrapack', precioVenta: 990, categoriaId: '3', codigoBarras: '7802800005', stockActual: 80, stockMinimo: 20, activo: true },
                    { id: '6', nombre: 'Yogurt Pack x6', descripcion: 'Sabores surtidos', precioVenta: 2390, categoriaId: '3', codigoBarras: '7802800006', stockActual: 24, stockMinimo: 8, activo: true },
                ];

            case 'charcuteria':
                return [
                    { id: '1', nombre: 'Jamón Serrano Gran Reserva', descripcion: '18 meses de curación, origen España', precioVenta: 4990, categoriaId: '1', codigoBarras: 'JAM001', stockActual: 50, stockMinimo: 5, activo: true },
                    { id: '2', nombre: 'Jamón Ibérico de Bellota', descripcion: '36 meses, cerdos de bellota', precioVenta: 12990, categoriaId: '1', codigoBarras: 'JAM002', stockActual: 30, stockMinimo: 3, activo: true },
                    { id: '3', nombre: 'Prosciutto di Parma DOP', descripcion: 'Importado de Italia, 24 meses', precioVenta: 8990, categoriaId: '1', codigoBarras: 'JAM003', stockActual: 40, stockMinimo: 4, activo: true },
                    { id: '4', nombre: 'Queso Manchego Curado', descripcion: '12 meses de maduración, oveja', precioVenta: 3500, categoriaId: '2', codigoBarras: 'QUE001', stockActual: 80, stockMinimo: 8, activo: true },
                    { id: '5', nombre: 'Queso Brie Francés', descripcion: 'Cremoso, corteza enmohecida', precioVenta: 4990, categoriaId: '2', codigoBarras: 'QUE002', stockActual: 50, stockMinimo: 5, activo: true },
                    { id: '6', nombre: 'Parmigiano Reggiano 24 meses', descripcion: 'El rey de los quesos italianos', precioVenta: 6990, categoriaId: '2', codigoBarras: 'QUE003', stockActual: 40, stockMinimo: 4, activo: true },
                    { id: '7', nombre: 'Chorizo Español Picante', descripcion: 'Con pimentón de la Vera', precioVenta: 2999, categoriaId: '3', codigoBarras: 'EMB001', stockActual: 80, stockMinimo: 8, activo: true },
                    { id: '8', nombre: 'Salchichón Ibérico', descripcion: 'Embutido curado de cerdo ibérico', precioVenta: 3990, categoriaId: '3', codigoBarras: 'EMB002', stockActual: 60, stockMinimo: 6, activo: true },
                    { id: '9', nombre: 'Aceitunas Kalamata', descripcion: 'Griegas, en aceite extra virgen', precioVenta: 2000, categoriaId: '4', codigoBarras: 'ACE001', stockActual: 100, stockMinimo: 10, activo: true },
                    { id: '10', nombre: 'Tabla Española 4 personas', descripcion: 'Jamón serrano, manchego, chorizo', precioVenta: 25990, categoriaId: '6', codigoBarras: 'TAB001', stockActual: 10, stockMinimo: 2, activo: true },
                ];

            default: // panaderia
                return [
                    { id: '1', nombre: 'Marraqueta Kilo', descripcion: 'Pan marraqueta tradicional por kilo', precioVenta: 2000, categoriaId: '1', codigoBarras: 'PAN001', stockActual: 100, stockMinimo: 20, activo: true },
                    { id: '2', nombre: 'Hallulla Kilo', descripcion: 'Pan hallulla por kilo', precioVenta: 2000, categoriaId: '1', codigoBarras: 'PAN002', stockActual: 80, stockMinimo: 15, activo: true },
                    { id: '3', nombre: 'Coliza', descripcion: 'Pan coliza tradicional', precioVenta: 300, categoriaId: '1', codigoBarras: 'PAN003', stockActual: 60, stockMinimo: 10, activo: true },
                    { id: '4', nombre: 'Pan Amasado', descripcion: 'Pan casero tradicional chileno', precioVenta: 250, categoriaId: '1', codigoBarras: 'PAN004', stockActual: 40, stockMinimo: 10, activo: true },
                    { id: '5', nombre: 'Kuchen Manzana', descripcion: 'Kuchen de manzana con canela', precioVenta: 6000, categoriaId: '2', codigoBarras: 'PAS001', stockActual: 8, stockMinimo: 2, activo: true },
                    { id: '6', nombre: 'Torta Chocolate', descripcion: 'Torta de chocolate con ganache', precioVenta: 18000, categoriaId: '2', codigoBarras: 'PAS002', stockActual: 4, stockMinimo: 1, activo: true },
                    { id: '7', nombre: 'Empanada Pino', descripcion: 'Empanada de pino tradicional', precioVenta: 2500, categoriaId: '3', codigoBarras: 'EMP001', stockActual: 30, stockMinimo: 10, activo: true },
                    { id: '8', nombre: 'Empanada Queso', descripcion: 'Empanada de queso derretido', precioVenta: 2000, categoriaId: '3', codigoBarras: 'EMP002', stockActual: 25, stockMinimo: 10, activo: true },
                    { id: '9', nombre: 'Café Espresso', descripcion: 'Espresso italiano', precioVenta: 1500, categoriaId: '4', codigoBarras: 'CAF001', stockActual: 999, stockMinimo: 0, activo: true },
                    { id: '10', nombre: 'Cappuccino', descripcion: 'Cappuccino con espuma', precioVenta: 2200, categoriaId: '4', codigoBarras: 'CAF002', stockActual: 999, stockMinimo: 0, activo: true },
                ];
        }
    }

    getMockTopProducts(): { nombre: string; cantidad: number; total: number }[] {
        const config = this.getIndustryConfig();

        switch (config.type) {
            case 'charcuteria':
                return [
                    { nombre: 'Jamón Serrano Gran Reserva', cantidad: 28, total: 139720 },
                    { nombre: 'Queso Manchego Curado', cantidad: 45, total: 157500 },
                    { nombre: 'Tabla Española 4 personas', cantidad: 12, total: 311880 },
                    { nombre: 'Chorizo Español Picante', cantidad: 38, total: 113962 },
                    { nombre: 'Prosciutto di Parma DOP', cantidad: 22, total: 197780 },
                ];
            case 'cursos':
                return [
                    { nombre: 'React.js Avanzado', cantidad: 15, total: 1949850 },
                    { nombre: 'HTML, CSS y JavaScript', cantidad: 28, total: 2519720 },
                    { nombre: 'Diseño UX con Figma', cantidad: 18, total: 1799820 },
                    { nombre: 'Meta Ads y Google Ads', cantidad: 22, total: 1759780 },
                    { nombre: 'Liderazgo Transformacional', cantidad: 12, total: 839880 },
                ];
            case 'editorial':
                return [
                    { nombre: 'Tarjetas de Visita x100', cantidad: 85, total: 509150 },
                    { nombre: 'Tríptico Promocional', cantidad: 320, total: 284800 },
                    { nombre: 'Libro 200 páginas - Tapa Dura', cantidad: 18, total: 539820 },
                    { nombre: 'Catálogo Corporativo', cantidad: 45, total: 584550 },
                    { nombre: 'Revista A4 - 32 páginas', cantidad: 120, total: 1078800 },
                ];
            case 'minimarket':
                return [
                    { nombre: 'Coca-Cola 500ml', cantidad: 156, total: 154440 },
                    { nombre: 'Papas Fritas Lays 150g', cantidad: 89, total: 168210 },
                    { nombre: 'Leche Entera 1L', cantidad: 120, total: 118800 },
                    { nombre: 'Agua Mineral 1.5L', cantidad: 95, total: 75050 },
                    { nombre: 'Galletas Oreo', cantidad: 67, total: 106530 },
                ];
            default: // panaderia
                return [
                    { nombre: 'Pan Marraqueta', cantidad: 156, total: 312000 },
                    { nombre: 'Empanada Pino', cantidad: 89, total: 222500 },
                    { nombre: 'Hallulla Kilo', cantidad: 78, total: 156000 },
                    { nombre: 'Café Espresso', cantidad: 120, total: 180000 },
                    { nombre: 'Kuchen Manzana', cantidad: 25, total: 150000 },
                ];
        }
    }

    getMockDashboardData(): { ventasHoy: number; ticketPromedio: number; transacciones: number; topProducto: string } {
        const config = this.getIndustryConfig();

        switch (config.type) {
            case 'charcuteria':
                return { ventasHoy: 485000, ticketPromedio: 18500, transacciones: 26, topProducto: 'Tabla Española 4 personas' };
            case 'cursos':
                return { ventasHoy: 2890000, ticketPromedio: 95000, transacciones: 18, topProducto: 'React.js Avanzado' };
            case 'editorial':
                return { ventasHoy: 1250000, ticketPromedio: 12500, transacciones: 85, topProducto: 'Tarjetas de Visita x100' };
            case 'minimarket':
                return { ventasHoy: 320000, ticketPromedio: 4500, transacciones: 71, topProducto: 'Coca-Cola 500ml' };
            default: // panaderia
                return { ventasHoy: 450000, ticketPromedio: 6500, transacciones: 45, topProducto: 'Pan Marraqueta' };
        }
    }
}
