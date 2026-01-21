-- =====================================================
-- V13: Create Modules Catalog
-- Central registry of all system features/modules
-- =====================================================

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50) NOT NULL DEFAULT 'Core',
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Seed default modules
INSERT INTO modules (code, name, description, icon, category, sort_order) VALUES
('pos', 'Punto de Venta', 'Ventas, caja y transacciones', '🛒', 'Core', 1),
('products', 'Catálogo', 'Productos, categorías y precios', '📦', 'Core', 2),
('inventory', 'Inventario', 'Stock, bodegas y movimientos', '📊', 'Core', 3),
('customers', 'Clientes', 'Base de datos de clientes y CRM', '👥', 'Growth', 10),
('reservations', 'Reservas', 'Citas, agenda y disponibilidad', '📅', 'Growth', 11),
('marketing', 'Marketing', 'Campañas, automatizaciones y fidelización', '📣', 'Growth', 12),
('reports', 'Reportes', 'Dashboards, analytics y exportaciones', '📈', 'Admin', 20),
('users', 'Usuarios', 'Gestión de equipo y permisos', '👤', 'Admin', 21),
('billing', 'Facturación', 'DTE, boletas y documentos tributarios', '🧾', 'Admin', 22),
('settings', 'Configuración', 'Ajustes del sistema y preferencias', '⚙️', 'Admin', 23),
('integrations', 'Integraciones', 'APIs, webhooks y conexiones externas', '🔌', 'Admin', 24)
ON CONFLICT (code) DO NOTHING;

CREATE INDEX idx_modules_category ON modules(category);
CREATE INDEX idx_modules_active ON modules(active);
