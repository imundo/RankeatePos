-- =====================================================
-- V3: Demo Data for Billing Service
-- Sample DTEs, CAF, and Configuration for El Trigal tenant
-- =====================================================

-- Demo Tenant ID (same as El Trigal in auth-service)
-- tenant_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851'

-- ================== CONFIG FACTURACION ==================

INSERT INTO config_facturacion (id, tenant_id, ambiente, auto_enviar_sii, auto_enviar_email, giro_default, acteco_default, resolucion_numero, resolucion_fecha)
VALUES (
    'cf000000-0000-0000-0000-000000000001',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'certificacion',
    true,
    true,
    'Restaurant y Servicios de Alimentación',
    561000,
    80,
    '2024-01-15'
);

-- ================== CAF (Demo Folios) ==================

-- CAF para Boletas Electrónicas (Tipo 39)
INSERT INTO caf (id, tenant_id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, fecha_vencimiento, xml_caf, activo, agotado)
VALUES (
    'ca390000-0000-0000-0000-000000000001',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'BOLETA_ELECTRONICA',
    1,
    1000,
    5,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    '<?xml version="1.0"?><AUTORIZACION><CAF version="1.0"><DA><RE>76.XXX.XXX-X</RE><RS>Empresa Demo</RS><TD>39</TD><RNG><D>1</D><H>1000</H></RNG><FA>2024-01-01</FA><RSAPK><M>...</M><E>...</E></RSAPK><IDK>300</IDK></DA><FRMA algoritmo="SHA1withRSA">...</FRMA></CAF><RSASK>...</RSASK><RSAPUBK>...</RSAPUBK></AUTORIZACION>',
    true,
    false
);

-- CAF para Facturas Electrónicas (Tipo 33)
INSERT INTO caf (id, tenant_id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, fecha_vencimiento, xml_caf, activo, agotado)
VALUES (
    'ca330000-0000-0000-0000-000000000001',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'FACTURA_ELECTRONICA',
    1,
    500,
    3,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    '<?xml version="1.0"?><AUTORIZACION><CAF version="1.0"><DA><RE>76.XXX.XXX-X</RE><RS>Empresa Demo</RS><TD>33</TD><RNG><D>1</D><H>500</H></RNG><FA>2024-01-01</FA><RSAPK><M>...</M><E>...</E></RSAPK><IDK>300</IDK></DA><FRMA algoritmo="SHA1withRSA">...</FRMA></CAF><RSASK>...</RSASK><RSAPUBK>...</RSAPUBK></AUTORIZACION>',
    true,
    false
);

-- CAF para Notas de Crédito (Tipo 61)
INSERT INTO caf (id, tenant_id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, fecha_vencimiento, xml_caf, activo, agotado)
VALUES (
    'ca610000-0000-0000-0000-000000000001',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'NOTA_CREDITO_ELECTRONICA',
    1,
    100,
    1,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    '<?xml version="1.0"?><AUTORIZACION><CAF version="1.0"><DA><RE>76.XXX.XXX-X</RE><RS>Empresa Demo</RS><TD>61</TD><RNG><D>1</D><H>100</H></RNG><FA>2024-01-01</FA><RSAPK><M>...</M><E>...</E></RSAPK><IDK>300</IDK></DA><FRMA algoritmo="SHA1withRSA">...</FRMA></CAF><RSASK>...</RSASK><RSAPUBK>...</RSAPUBK></AUTORIZACION>',
    true,
    false
);

-- ================== DTEs DE EJEMPLO ==================

-- Boleta 1 - Aceptada
INSERT INTO dte (id, tenant_id, branch_id, tipo_dte, folio, fecha_emision, 
    emisor_rut, emisor_razon_social, emisor_giro, emisor_direccion, emisor_comuna,
    receptor_rut, receptor_razon_social,
    monto_neto, tasa_iva, monto_iva, monto_total, estado, track_id, glosa_estado, fecha_envio, fecha_respuesta)
VALUES (
    'dte00000-0000-0000-0000-000000000001',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'BOLETA_ELECTRONICA',
    1,
    CURRENT_DATE - INTERVAL '5 days',
    '76.XXX.XXX-X',
    'El Trigal - Panadería',
    'Panadería y Pastelería',
    'Av. Providencia 1234',
    'Providencia',
    '11111111-1',
    'Consumidor Final',
    8403,
    19,
    1597,
    10000,
    'ACEPTADO',
    'MOCK-123456789',
    'Documento aceptado por el SII',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '5 days'
);

-- Boleta 2 - Aceptada
INSERT INTO dte (id, tenant_id, branch_id, tipo_dte, folio, fecha_emision, 
    emisor_rut, emisor_razon_social, emisor_giro, emisor_direccion, emisor_comuna,
    monto_neto, tasa_iva, monto_iva, monto_total, estado, track_id)
VALUES (
    'dte00000-0000-0000-0000-000000000002',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'BOLETA_ELECTRONICA',
    2,
    CURRENT_DATE - INTERVAL '3 days',
    '76.XXX.XXX-X',
    'El Trigal - Panadería',
    'Panadería y Pastelería',
    'Av. Providencia 1234',
    'Providencia',
    12605,
    19,
    2395,
    15000,
    'ACEPTADO',
    'MOCK-123456790'
);

-- Boleta 3 - Pendiente
INSERT INTO dte (id, tenant_id, branch_id, tipo_dte, folio, fecha_emision, 
    emisor_rut, emisor_razon_social, emisor_giro, emisor_direccion, emisor_comuna,
    monto_neto, tasa_iva, monto_iva, monto_total, estado)
VALUES (
    'dte00000-0000-0000-0000-000000000003',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'BOLETA_ELECTRONICA',
    3,
    CURRENT_DATE,
    '76.XXX.XXX-X',
    'El Trigal - Panadería',
    'Panadería y Pastelería',
    'Av. Providencia 1234',
    'Providencia',
    4202,
    19,
    798,
    5000,
    'PENDIENTE'
);

-- Boleta 4 - Hoy
INSERT INTO dte (id, tenant_id, branch_id, tipo_dte, folio, fecha_emision, 
    emisor_rut, emisor_razon_social, emisor_giro, emisor_direccion, emisor_comuna,
    monto_neto, tasa_iva, monto_iva, monto_total, estado)
VALUES (
    'dte00000-0000-0000-0000-000000000004',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'BOLETA_ELECTRONICA',
    4,
    CURRENT_DATE,
    '76.XXX.XXX-X',
    'El Trigal - Panadería',
    'Panadería y Pastelería',
    'Av. Providencia 1234',
    'Providencia',
    21008,
    19,
    3992,
    25000,
    'ACEPTADO',
    'MOCK-123456791'
);

-- Factura 1 - Para empresa
INSERT INTO dte (id, tenant_id, branch_id, tipo_dte, folio, fecha_emision, 
    emisor_rut, emisor_razon_social, emisor_giro, emisor_direccion, emisor_comuna,
    receptor_rut, receptor_razon_social, receptor_giro, receptor_direccion, receptor_comuna, receptor_email,
    monto_neto, tasa_iva, monto_iva, monto_total, estado, track_id)
VALUES (
    'dte00000-0000-0000-0000-000000000010',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'FACTURA_ELECTRONICA',
    1,
    CURRENT_DATE - INTERVAL '7 days',
    '76.XXX.XXX-X',
    'El Trigal - Panadería',
    'Panadería y Pastelería',
    'Av. Providencia 1234',
    'Providencia',
    '96.XXX.XXX-X',
    'Empresa ABC Ltda.',
    'Servicios Empresariales',
    'Av. Apoquindo 4500',
    'Las Condes',
    'facturacion@empresaabc.cl',
    84033,
    19,
    15967,
    100000,
    'ACEPTADO',
    'MOCK-FAC-001'
);

-- Factura 2 - Reciente
INSERT INTO dte (id, tenant_id, branch_id, tipo_dte, folio, fecha_emision, 
    emisor_rut, emisor_razon_social, emisor_giro, emisor_direccion, emisor_comuna,
    receptor_rut, receptor_razon_social, receptor_giro, receptor_direccion, receptor_comuna,
    monto_neto, tasa_iva, monto_iva, monto_total, estado, track_id)
VALUES (
    'dte00000-0000-0000-0000-000000000011',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'FACTURA_ELECTRONICA',
    2,
    CURRENT_DATE - INTERVAL '2 days',
    '76.XXX.XXX-X',
    'El Trigal - Panadería',
    'Panadería y Pastelería',
    'Av. Providencia 1234',
    'Providencia',
    '77.XXX.XXX-X',
    'Restaurant La Cocina SpA',
    'Restaurant',
    'Av. Manuel Montt 890',
    'Providencia',
    168067,
    19,
    31933,
    200000,
    'ACEPTADO',
    'MOCK-FAC-002'
);

-- ================== DETALLE DE DTEs ==================

-- Detalle Boleta 1
INSERT INTO dte_detalle (dte_id, numero_linea, nombre_item, cantidad, unidad_medida, precio_unitario, monto_item)
VALUES 
    ('dte00000-0000-0000-0000-000000000001', 1, 'Marraqueta 1kg', 2, 'UN', 1500, 3000),
    ('dte00000-0000-0000-0000-000000000001', 2, 'Croissant Chocolate', 4, 'UN', 800, 3200),
    ('dte00000-0000-0000-0000-000000000001', 3, 'Café con Leche Grande', 2, 'UN', 1900, 3800);

-- Detalle Boleta 2
INSERT INTO dte_detalle (dte_id, numero_linea, nombre_item, cantidad, unidad_medida, precio_unitario, monto_item)
VALUES 
    ('dte00000-0000-0000-0000-000000000002', 1, 'Torta Tres Leches Med.', 1, 'UN', 12000, 12000),
    ('dte00000-0000-0000-0000-000000000002', 2, 'Velas Cumpleaños', 1, 'UN', 3000, 3000);

-- Detalle Factura 1
INSERT INTO dte_detalle (dte_id, numero_linea, nombre_item, cantidad, unidad_medida, precio_unitario, monto_item)
VALUES 
    ('dte00000-0000-0000-0000-000000000010', 1, 'Servicio de Coffee Break', 1, 'SV', 50000, 50000),
    ('dte00000-0000-0000-0000-000000000010', 2, 'Pasteles Surtidos (30 un)', 1, 'PK', 30000, 30000),
    ('dte00000-0000-0000-0000-000000000010', 3, 'Café Premium 1kg', 2, 'UN', 10000, 20000);

-- Detalle Factura 2
INSERT INTO dte_detalle (dte_id, numero_linea, nombre_item, cantidad, unidad_medida, precio_unitario, monto_item)
VALUES 
    ('dte00000-0000-0000-0000-000000000011', 1, 'Pan para Evento (500 un)', 1, 'PK', 100000, 100000),
    ('dte00000-0000-0000-0000-000000000011', 2, 'Pasteles Premium (100 un)', 1, 'PK', 80000, 80000),
    ('dte00000-0000-0000-0000-000000000011', 3, 'Servicio de Instalación', 1, 'SV', 20000, 20000);
