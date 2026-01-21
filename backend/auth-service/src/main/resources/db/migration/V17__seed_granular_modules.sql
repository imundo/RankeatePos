-- =====================================================
-- V17: Seed Granular Modules
-- Adding specific capabilities for detailed permission control
-- =====================================================

INSERT INTO modules (code, name, description, icon, category, sort_order) VALUES
-- General
('dashboard', 'Dashboard', 'Panel de control principal y estadísticas', '📊', 'General', 0),

-- Ventas (Granular)
('sales-history', 'Historial Ventas', 'Ver y anular ventas pasadas', '📜', 'Ventas', 4),
('cash-close', 'Cierre de Caja', 'Arqueo y cierre de turnos', '🔒', 'Ventas', 5),
('quotes', 'Cotizaciones', 'Crear y enviar presupuestos', '📝', 'Ventas', 6),

-- Inventario (Granular)
('stock-movements', 'Movimientos', 'Ajustes, mermas y traslados', '🚚', 'Inventario', 30),
('suppliers', 'Proveedores', 'Gestión de proveedores', '🏭', 'Inventario', 31),
('purchases', 'Órdenes Compra', 'Solicitudes de compra y recepción', '🛒', 'Inventario', 32),

-- Finanzas (Granular)
('expenses', 'Gastos y Pagos', 'Registro de egresos operacionales', '💸', 'Finanzas', 40),
('cash-flow', 'Flujo de Caja', 'Reporte de ingresos vs egresos', '📈', 'Finanzas', 41),
('banks', 'Bancos', 'Conciliación bancaria', '🏦', 'Finanzas', 42),

-- Operaciones
('kds', 'Pantalla Cocina', 'Kitchen Display System', '🍳', 'Operaciones', 50),
('menu-digital', 'Menú Digital', 'Gestión de carta QR', '📱', 'Operaciones', 51),

-- Marketing (Granular)
('loyalty', 'Programa Lealtad', 'Gestión de puntos y canjes', '🌟', 'Marketing', 60),
('email-marketing', 'Email Marketing', 'Campañas de correo masivo', '📧', 'Marketing', 61),
('whatsapp', 'WhatsApp', 'Mensajería automatizada', '💬', 'Marketing', 62),

-- Configuración
('company', 'Datos Empresa', 'Logo, rut y datos tributarios', '🏢', 'Configuración', 90),
('printers', 'Impresoras', 'Configuración de impresoras POS', '🖨️', 'Configuración', 91)
ON CONFLICT (code) DO NOTHING;
