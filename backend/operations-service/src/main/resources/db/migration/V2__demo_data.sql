-- ============================================================
-- Demo Data for Operations Service
-- For testing with tenant: El Trigal (from auth-service)
-- ============================================================

-- Demo Tenant ID (same as El Trigal in auth-service)
-- tenant_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851'

-- ================== LOYALTY CUSTOMERS ==================

INSERT INTO loyalty_customers (id, tenant_id, nombre, email, telefono, puntos_actuales, puntos_totales, nivel, fecha_registro, ultima_compra, activo)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'María González', 'maria.gonzalez@email.com', '+56912345678', 2450, 2450, 'ORO', NOW() - INTERVAL '9 months', NOW() - INTERVAL '1 day', true),
    ('a1000000-0000-0000-0000-000000000002', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Juan Pérez', 'juan.perez@email.com', '+56987654321', 1200, 1200, 'PLATA', NOW() - INTERVAL '7 months', NOW() - INTERVAL '2 days', true),
    ('a1000000-0000-0000-0000-000000000003', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Ana Martínez', 'ana.martinez@email.com', '+56911223344', 580, 580, 'BRONCE', NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 days', true),
    ('a1000000-0000-0000-0000-000000000004', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Carlos López', 'carlos.lopez@email.com', '+56955667788', 3800, 4300, 'PLATINO', NOW() - INTERVAL '13 months', NOW(), true),
    ('a1000000-0000-0000-0000-000000000005', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Patricia Díaz', 'patricia.diaz@email.com', '+56944556677', 920, 920, 'BRONCE', NOW() - INTERVAL '3 months', NOW() - INTERVAL '5 days', true),
    ('a1000000-0000-0000-0000-000000000006', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Roberto Silva', 'roberto.silva@email.com', '+56933445566', 1650, 1650, 'PLATA', NOW() - INTERVAL '8 months', NOW() - INTERVAL '1 day', true);

-- ================== LOYALTY TRANSACTIONS ==================

INSERT INTO loyalty_transactions (customer_id, tipo, puntos, descripcion, created_at)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'EARN', 150, 'Compra de pan y pasteles', NOW() - INTERVAL '7 days'),
    ('a1000000-0000-0000-0000-000000000001', 'EARN', 200, 'Torta de cumpleaños', NOW() - INTERVAL '3 days'),
    ('a1000000-0000-0000-0000-000000000001', 'EARN', 100, 'Desayuno familiar', NOW() - INTERVAL '1 day'),
    ('a1000000-0000-0000-0000-000000000004', 'EARN', 350, 'Pedido grande para evento', NOW() - INTERVAL '2 days'),
    ('a1000000-0000-0000-0000-000000000004', 'REDEEM', -500, 'Canje: Torta de Cumpleaños Gratis', NOW() - INTERVAL '1 day'),
    ('a1000000-0000-0000-0000-000000000002', 'EARN', 80, 'Café y croissants', NOW() - INTERVAL '2 days');

-- ================== REWARDS ==================

INSERT INTO rewards (id, tenant_id, nombre, descripcion, puntos_requeridos, tipo, valor, activo)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Café Gratis', 'Un café de tu elección completamente gratis', 50, 'PRODUCTO_GRATIS', 0, true),
    ('b1000000-0000-0000-0000-000000000002', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '10% Descuento', '10% de descuento en tu próxima compra', 100, 'DESCUENTO_PORCENTAJE', 10, true),
    ('b1000000-0000-0000-0000-000000000003', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '20% Descuento', '20% de descuento en compras sobre $10.000', 200, 'DESCUENTO_PORCENTAJE', 20, true),
    ('b1000000-0000-0000-0000-000000000004', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Torta de Cumpleaños', 'Torta de cumpleaños pequeña gratis', 500, 'PRODUCTO_GRATIS', 0, true),
    ('b1000000-0000-0000-0000-000000000005', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '$5.000 Descuento', '$5.000 de descuento en compras sobre $20.000', 300, 'DESCUENTO_MONTO', 5000, true);

-- ================== TABLES ==================

INSERT INTO tables (id, tenant_id, branch_id, numero, capacidad, ubicacion, estado, activo)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '1', 2, 'interior', 'DISPONIBLE', true),
    ('c1000000-0000-0000-0000-000000000002', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '2', 2, 'interior', 'DISPONIBLE', true),
    ('c1000000-0000-0000-0000-000000000003', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '3', 2, 'interior', 'RESERVADA', true),
    ('c1000000-0000-0000-0000-000000000004', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '4', 4, 'interior', 'OCUPADA', true),
    ('c1000000-0000-0000-0000-000000000005', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '5', 4, 'interior', 'RESERVADA', true),
    ('c1000000-0000-0000-0000-000000000006', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '6', 4, 'terraza', 'DISPONIBLE', true),
    ('c1000000-0000-0000-0000-000000000007', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '7', 4, 'terraza', 'RESERVADA', true),
    ('c1000000-0000-0000-0000-000000000008', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '8', 6, 'terraza', 'DISPONIBLE', true),
    ('c1000000-0000-0000-0000-000000000009', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '9', 6, 'privado', 'DISPONIBLE', true),
    ('c1000000-0000-0000-0000-000000000010', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '10', 10, 'privado', 'RESERVADA', true);

-- ================== RESERVATIONS ==================

INSERT INTO reservations (id, tenant_id, branch_id, cliente_nombre, cliente_telefono, fecha, hora, personas, table_id, estado, notas)
VALUES
    ('d1000000-0000-0000-0000-000000000001', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'María González', '+56912345678', CURRENT_DATE, '13:00', 4, 'c1000000-0000-0000-0000-000000000005', 'CONFIRMADA', ''),
    ('d1000000-0000-0000-0000-000000000002', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Juan Pérez', '+56987654321', CURRENT_DATE, '14:30', 2, 'c1000000-0000-0000-0000-000000000003', 'CONFIRMADA', 'Aniversario - traer postre especial'),
    ('d1000000-0000-0000-0000-000000000003', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Empresa ABC', '+56911223344', CURRENT_DATE, '12:30', 8, 'c1000000-0000-0000-0000-000000000010', 'PENDIENTE', 'Reunión de negocios'),
    ('d1000000-0000-0000-0000-000000000004', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Ana Martínez', '+56955667788', CURRENT_DATE, '19:00', 6, NULL, 'PENDIENTE', 'Cumpleaños - necesitan decoración'),
    ('d1000000-0000-0000-0000-000000000005', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Carlos López', '+56944556677', CURRENT_DATE, '20:00', 2, 'c1000000-0000-0000-0000-000000000007', 'CONFIRMADA', '');

-- ================== KITCHEN ORDERS ==================

INSERT INTO kitchen_orders (id, tenant_id, branch_id, numero, tipo, mesa, cliente_nombre, estado, prioridad, notas, tiempo_ingreso)
VALUES
    ('e1000000-0000-0000-0000-000000000001', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '#0028', 'LOCAL', '5', NULL, 'PREPARANDO', 'NORMAL', NULL, NOW() - INTERVAL '8 minutes'),
    ('e1000000-0000-0000-0000-000000000002', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '#0029', 'DELIVERY', NULL, 'Juan Pérez', 'PENDIENTE', 'ALTA', 'Sin cebolla en las empanadas', NOW() - INTERVAL '3 minutes'),
    ('e1000000-0000-0000-0000-000000000003', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '#0030', 'PICKUP', NULL, 'Ana Martínez', 'LISTO', 'NORMAL', NULL, NOW() - INTERVAL '12 minutes'),
    ('e1000000-0000-0000-0000-000000000004', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', '#0031', 'LOCAL', '12', NULL, 'PENDIENTE', 'URGENTE', '¡CLIENTE VIP - PRIORIDAD!', NOW() - INTERVAL '1 minute');

-- ================== KITCHEN ORDER ITEMS ==================

INSERT INTO kitchen_order_items (order_id, producto_nombre, cantidad, modificadores, estado)
VALUES
    ('e1000000-0000-0000-0000-000000000001', 'Café con Leche', 2, NULL, 'LISTO'),
    ('e1000000-0000-0000-0000-000000000001', 'Tostada Francés', 2, '["Sin mantequilla"]', 'PREPARANDO'),
    ('e1000000-0000-0000-0000-000000000001', 'Jugo Natural', 1, '["Naranja"]', 'PENDIENTE'),
    ('e1000000-0000-0000-0000-000000000002', 'Empanada Pino', 6, NULL, 'PENDIENTE'),
    ('e1000000-0000-0000-0000-000000000002', 'Empanada Queso', 4, NULL, 'PENDIENTE'),
    ('e1000000-0000-0000-0000-000000000003', 'Torta Chocolate', 1, NULL, 'LISTO'),
    ('e1000000-0000-0000-0000-000000000003', 'Croissants', 6, NULL, 'LISTO'),
    ('e1000000-0000-0000-0000-000000000004', 'Café Espresso', 2, NULL, 'PENDIENTE'),
    ('e1000000-0000-0000-0000-000000000004', 'Pan con Palta', 2, '["Extra palta", "Huevo pochado"]', 'PENDIENTE');

-- ================== SUBSCRIPTION PLANS ==================

INSERT INTO subscription_plans (id, tenant_id, nombre, descripcion, frecuencia, precio, productos, activo)
VALUES
    ('f1000000-0000-0000-0000-000000000001', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Pan Diario', 'Entrega diaria de pan fresco a la puerta de tu casa', 'DIARIA', 45000, '[{"nombre": "Marraqueta 1kg", "cantidad": 1}]', true),
    ('f1000000-0000-0000-0000-000000000002', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Desayuno Familiar', 'Pack semanal con pan, pasteles y café', 'SEMANAL', 35000, '[{"nombre": "Marraqueta 1kg", "cantidad": 2}, {"nombre": "Croissants", "cantidad": 6}, {"nombre": "Café 250g", "cantidad": 1}]', true),
    ('f1000000-0000-0000-0000-000000000003', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Cafetería Oficina', 'Suscripción para oficinas con entregas diarias', 'DIARIA', 85000, '[{"nombre": "Café 500g", "cantidad": 1}, {"nombre": "Croissants", "cantidad": 12}]', true);

-- ================== SUBSCRIPTIONS ==================

INSERT INTO subscriptions (id, tenant_id, plan_id, cliente_nombre, cliente_telefono, direccion_entrega, estado, proxima_entrega, fecha_inicio)
VALUES
    ('g1000000-0000-0000-0000-000000000001', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'f1000000-0000-0000-0000-000000000001', 'María González', '+56912345678', 'Av. Providencia 1234, Depto 501', 'ACTIVA', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE - INTERVAL '30 days'),
    ('g1000000-0000-0000-0000-000000000002', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'f1000000-0000-0000-0000-000000000002', 'Juan Pérez', '+56987654321', 'Los Leones 567', 'ACTIVA', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE - INTERVAL '60 days'),
    ('g1000000-0000-0000-0000-000000000003', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'f1000000-0000-0000-0000-000000000003', 'Empresa DEF', '+56911223344', 'Av. Apoquindo 4500, Of. 302', 'ACTIVA', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE - INTERVAL '90 days'),
    ('g1000000-0000-0000-0000-000000000004', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'f1000000-0000-0000-0000-000000000001', 'Ana Martínez', '+56955667788', 'Vitacura 3200', 'PAUSADA', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE - INTERVAL '45 days');

-- ================== SUBSCRIPTION DELIVERIES ==================

INSERT INTO subscription_deliveries (subscription_id, fecha, hora_programada, estado, direccion)
VALUES
    ('g1000000-0000-0000-0000-000000000001', CURRENT_DATE, '08:00', 'ENTREGADO', 'Av. Providencia 1234, Depto 501'),
    ('g1000000-0000-0000-0000-000000000003', CURRENT_DATE, '08:30', 'ENTREGADO', 'Av. Apoquindo 4500, Of. 302'),
    ('g1000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', '08:00', 'PENDIENTE', 'Av. Providencia 1234, Depto 501'),
    ('g1000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '1 day', '08:30', 'PENDIENTE', 'Av. Apoquindo 4500, Of. 302');
