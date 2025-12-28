-- V6__seed_test_data.sql
-- Test data for E2E testing

-- Tenant ID for testing
-- Using a fixed UUID for demo: 11111111-1111-1111-1111-111111111111

-- =============================================
-- CUSTOMERS (20 customers in different segments)
-- =============================================

INSERT INTO customers (id, tenant_id, name, email, phone, segment, clv, total_purchases, total_spent, average_ticket, last_purchase_date, first_purchase_date, birth_date, loyalty_points, loyalty_tier, score, referral_code) VALUES
-- VIP Customers (3)
('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'María González Pérez', 'maria.gonzalez@email.cl', '+56912345671', 'VIP', 1500000, 45, 950000, 21111, '2024-12-20', '2023-01-15', '1985-03-15', 12500, 'PLATINUM', 95, 'REFMARIA01'),
('a0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Carlos Rodríguez Silva', 'carlos.rodriguez@empresa.cl', '+56912345672', 'VIP', 1200000, 38, 780000, 20526, '2024-12-18', '2023-02-20', '1978-07-22', 10200, 'PLATINUM', 90, 'REFCARLOS2'),
('a0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Ana María López', 'ana.lopez@gmail.com', '+56912345673', 'VIP', 980000, 32, 620000, 19375, '2024-12-22', '2023-03-10', '1990-11-08', 8500, 'GOLD', 88, 'REFANA0003'),

-- REGULAR Customers (8)
('a0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Pedro Sánchez Mora', 'pedro.sanchez@hotmail.com', '+56912345674', 'REGULAR', 350000, 15, 220000, 14667, '2024-12-15', '2023-06-01', '1982-04-30', 3200, 'SILVER', 72, 'REFPEDRO4'),
('a0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Sofía Torres Vega', 'sofia.torres@outlook.com', '+56912345675', 'REGULAR', 280000, 12, 180000, 15000, '2024-12-10', '2023-07-15', '1995-09-12', 2800, 'SILVER', 68, 'REFSOFIA5'),
('a0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Roberto Díaz Fuentes', 'roberto.diaz@email.cl', '+56912345676', 'REGULAR', 220000, 10, 145000, 14500, '2024-12-08', '2023-08-20', '1988-12-25', 2100, 'SILVER', 65, 'REFROBERT'),
('a0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Valentina Muñoz', 'vale.munoz@gmail.com', '+56912345677', 'REGULAR', 180000, 8, 120000, 15000, '2024-12-05', '2023-09-10', '1992-06-18', 1800, 'SILVER', 60, 'REFVALE07'),
('a0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Martín Herrera', 'martin.herrera@email.cl', '+56912345678', 'REGULAR', 150000, 7, 98000, 14000, '2024-12-01', '2023-10-05', '1980-02-14', 1500, 'BRONZE', 55, 'REFMARTI8'),
('a0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Camila Fernández', 'camila.fernandez@hotmail.com', '+56912345679', 'REGULAR', 120000, 6, 85000, 14167, '2024-11-28', '2023-11-01', '1998-08-05', 1200, 'BRONZE', 52, 'REFCAMIL9'),
('a0000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Diego Contreras', 'diego.contreras@email.cl', '+56912345680', 'REGULAR', 100000, 5, 72000, 14400, '2024-11-25', '2023-12-10', NULL, 950, 'BRONZE', 48, 'REFDIEGO0'),
('a0000001-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Francisca Araya', 'francisca.araya@gmail.com', '+56912345681', 'REGULAR', 85000, 4, 58000, 14500, '2024-11-20', '2024-01-15', '1993-01-28', 750, 'BRONZE', 45, 'REFFRANC1'),

-- NEW Customers (4)
('a0000001-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Joaquín Sepúlveda', 'joaquin.sepulveda@email.cl', '+56912345682', 'NEW', 30000, 1, 18500, 18500, '2024-12-20', '2024-12-20', '2000-05-10', 185, 'BRONZE', 25, 'REFJOAQU2'),
('a0000001-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Isidora Valenzuela', 'isidora.valenzuela@outlook.com', '+56912345683', 'NEW', 25000, 1, 15200, 15200, '2024-12-18', '2024-12-18', '1996-10-30', 152, 'BRONZE', 22, 'REFISIDO3'),
('a0000001-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'Tomás Rojas', 'tomas.rojas@gmail.com', '+56912345684', 'NEW', 20000, 1, 12800, 12800, '2024-12-15', '2024-12-15', NULL, 128, 'BRONZE', 20, 'REFTOMAS4'),
('a0000001-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Antonia Castro', 'antonia.castro@email.cl', '+56912345685', 'NEW', 0, 0, 0, 0, NULL, NULL, '1999-03-22', 0, 'BRONZE', 10, 'REFANTON5'),

-- AT_RISK Customers (3)
('a0000001-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'Felipe Morales', 'felipe.morales@hotmail.com', '+56912345686', 'AT_RISK', 180000, 8, 125000, 15625, '2024-10-01', '2023-05-15', '1987-07-14', 1800, 'SILVER', 35, 'REFFELIP6'),
('a0000001-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'Javiera Núñez', 'javiera.nunez@gmail.com', '+56912345687', 'AT_RISK', 150000, 6, 98000, 16333, '2024-09-15', '2023-06-20', '1991-11-25', 1500, 'BRONZE', 30, 'REFJAVIER'),
('a0000001-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'Nicolás Bravo', 'nicolas.bravo@email.cl', '+56912345688', 'AT_RISK', 120000, 5, 78000, 15600, '2024-09-01', '2023-07-10', '1984-04-08', 1200, 'BRONZE', 28, 'REFNICOL8'),

-- LOST Customers (2)
('a0000001-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'Ignacio Pizarro', 'ignacio.pizarro@outlook.com', '+56912345689', 'LOST', 80000, 3, 45000, 15000, '2024-05-01', '2023-08-15', '1979-12-01', 600, 'BRONZE', 15, 'REFIGNAC9'),
('a0000001-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'Constanza Vera', 'constanza.vera@email.cl', '+56912345690', 'LOST', 50000, 2, 32000, 16000, '2024-04-15', '2023-09-01', '1994-08-18', 400, 'BRONZE', 12, 'REFCONST0');

-- Customer Tags
INSERT INTO customer_tags (customer_id, name, color) VALUES
('a0000001-0000-0000-0000-000000000001', 'VIP', '#FFD700'),
('a0000001-0000-0000-0000-000000000001', 'Cumpleaños Marzo', '#EC4899'),
('a0000001-0000-0000-0000-000000000002', 'VIP', '#FFD700'),
('a0000001-0000-0000-0000-000000000002', 'Empresarial', '#3B82F6'),
('a0000001-0000-0000-0000-000000000003', 'VIP', '#FFD700'),
('a0000001-0000-0000-0000-000000000016', 'Requiere seguimiento', '#EF4444'),
('a0000001-0000-0000-0000-000000000017', 'Requiere seguimiento', '#EF4444');

-- =============================================
-- EMAIL TEMPLATES (5 templates)
-- =============================================

INSERT INTO email_templates (id, tenant_id, name, subject, body_html, type, trigger, active) VALUES
('b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Bienvenida', '¡Bienvenido/a a nuestra familia, {{name}}!', '<html><body><h1>¡Hola {{name}}!</h1><p>Gracias por unirte a nosotros. Como regalo de bienvenida, te damos <strong>500 puntos</strong> para tu primera compra.</p><p>¡Te esperamos pronto!</p></body></html>', 'AUTOMATED', 'WELCOME', true),
('b0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Cumpleaños', '🎂 ¡Feliz Cumpleaños {{name}}! Tu regalo te espera', '<html><body><h1>¡Feliz Cumpleaños {{name}}! 🎉</h1><p>En tu día especial, te regalamos un <strong>20% de descuento</strong> en tu próxima compra.</p><p>Válido por 7 días.</p></body></html>', 'AUTOMATED', 'BIRTHDAY', true),
('b0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Te extrañamos', '{{name}}, te extrañamos 😢 Vuelve con 15% OFF', '<html><body><h1>¡Hola {{name}}!</h1><p>Hace tiempo que no te vemos. Te extrañamos y queremos que vuelvas.</p><p>Por eso te damos un <strong>15% de descuento</strong> en tu próxima visita.</p><p>Código: VUELVE15</p></body></html>', 'AUTOMATED', 'RE_ENGAGEMENT', true),
('b0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Promoción Fin de Semana', '🔥 Solo este fin de semana: hasta 30% OFF', '<html><body><h1>¡Oferta Especial!</h1><p>Solo este fin de semana disfruta de hasta <strong>30% de descuento</strong> en productos seleccionados.</p><p>¡No te lo pierdas!</p></body></html>', 'MARKETING', NULL, true),
('b0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Gracias por tu compra', '¡Gracias por tu compra, {{name}}!', '<html><body><h1>¡Gracias {{name}}!</h1><p>Tu compra ha sido procesada exitosamente.</p><p>Ganaste <strong>{{points}} puntos</strong> con esta compra.</p><p>¡Vuelve pronto!</p></body></html>', 'TRANSACTIONAL', 'POST_PURCHASE', true);

-- =============================================
-- PROMOTIONS (5 promotions)
-- =============================================

INSERT INTO promotions (id, tenant_id, name, description, type, discount_value, min_purchase, max_discount, start_date, end_date, max_uses, current_uses, target_segment, target_tier, active) VALUES
('c0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10% Descuento Navidad', 'Descuento especial de Navidad para todas las compras', 'PERCENTAGE', 10, 10000, 50000, '2024-12-01', '2024-12-31', 1000, 156, NULL, NULL, true),
('c0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '15% VIP Exclusivo', 'Descuento exclusivo para clientes VIP', 'PERCENTAGE', 15, 20000, 100000, '2024-12-01', '2025-01-31', 500, 42, 'VIP', NULL, true),
('c0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '$5.000 de Descuento', 'Descuento fijo de $5.000 en compras sobre $25.000', 'FIXED_AMOUNT', 5000, 25000, NULL, '2024-12-15', '2025-01-15', 500, 89, NULL, NULL, true),
('c0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '2x1 en Postres', 'Lleva dos postres y paga solo uno', 'BOGO', 50, 0, NULL, '2024-12-20', '2024-12-27', 200, 34, NULL, NULL, true),
('c0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '20% Platino', 'Descuento especial para miembros Platino', 'PERCENTAGE', 20, 15000, 80000, '2024-12-01', '2025-03-31', NULL, 28, NULL, 'PLATINUM', true);

-- Coupons for promotions
INSERT INTO coupons (id, promotion_id, code, max_uses, current_uses, active) VALUES
('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'NAVIDAD10', 1000, 156, true),
('d0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 'VIP15', 500, 42, true),
('d0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', 'AHORRA5K', 500, 89, true),
('d0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004', 'POSTRE2X1', 200, 34, true),
('d0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000005', 'PLATINO20', 1000, 28, true);

-- =============================================
-- REVIEWS (15 reviews)
-- =============================================

INSERT INTO reviews (id, tenant_id, customer_id, rating, comment, is_public, response, status, is_verified, created_at) VALUES
('e0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 5, '¡Excelente atención y productos de primera calidad! Siempre vuelvo.', true, '¡Muchas gracias María! Nos alegra mucho saber que disfrutas de nuestros productos.', 'APPROVED', true, '2024-12-20'),
('e0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', 5, 'El mejor lugar para reuniones de negocios. Ambiente perfecto.', true, '¡Gracias Carlos! Es un placer atenderte.', 'APPROVED', true, '2024-12-18'),
('e0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', 5, 'Me encanta el programa de lealtad, los beneficios son geniales.', true, NULL, 'APPROVED', true, '2024-12-22'),
('e0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000004', 4, 'Muy buena comida, solo el tiempo de espera fue un poco largo.', true, 'Gracias por tu feedback Pedro. Estamos trabajando para mejorar los tiempos.', 'APPROVED', true, '2024-12-15'),
('e0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000005', 4, 'Rica comida y buen ambiente. Volveré pronto.', true, NULL, 'APPROVED', true, '2024-12-10'),
('e0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000006', 5, 'Los postres son increíbles. Mi favorito el tiramisú.', true, '¡Gracias Roberto! El tiramisú es uno de nuestros favoritos también.', 'APPROVED', true, '2024-12-08'),
('e0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000007', 3, 'La comida estuvo bien, pero el servicio podría mejorar.', true, 'Gracias por tu honestidad Valentina. Trabajaremos en mejorar el servicio.', 'APPROVED', true, '2024-12-05'),
('e0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000008', 4, 'Buena relación precio-calidad.', true, NULL, 'APPROVED', true, '2024-12-01'),
('e0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000009', 5, 'Mi lugar favorito para almorzar. Super recomendado.', true, '¡Qué gusto Camila! Te esperamos pronto.', 'APPROVED', true, '2024-11-28'),
('e0000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000010', 4, 'Muy rico todo, los sandwiches son gigantes.', true, NULL, 'APPROVED', true, '2024-11-25'),
('e0000001-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000012', 5, 'Primera vez que vengo y quedé encantado!', true, NULL, 'PENDING', true, '2024-12-20'),
('e0000001-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000013', 4, 'Buena experiencia en general.', true, NULL, 'PENDING', true, '2024-12-18'),
('e0000001-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000016', 2, 'Mi última visita no fue buena, la comida llegó fría.', true, NULL, 'PENDING', false, '2024-10-01'),
('e0000001-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000017', 1, 'Muy decepcionado. No volvería.', false, NULL, 'PENDING', false, '2024-09-15'),
('e0000001-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000011', 5, 'Perfecto para trabajar con laptop, tienen buen WiFi.', true, NULL, 'APPROVED', true, '2024-11-20');

-- =============================================
-- REFERRALS (10 referrals)
-- =============================================

INSERT INTO referrals (id, tenant_id, referrer_id, referred_id, referral_code, referred_email, status, referrer_reward, referred_reward, referrer_reward_type, referred_reward_type, referrer_rewarded, referred_rewarded, first_purchase_amount, converted_at, created_at) VALUES
('f0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000012', 'REFMARIA01', 'joaquin.sepulveda@email.cl', 'REWARDED', 5000, 3000, 'DISCOUNT', 'DISCOUNT', true, true, 18500, '2024-12-20', '2024-12-15'),
('f0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000013', 'REFMARIA01', 'isidora.valenzuela@outlook.com', 'CONVERTED', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, true, 15200, '2024-12-18', '2024-12-10'),
('f0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000014', 'REFCARLOS2', 'tomas.rojas@gmail.com', 'CONVERTED', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, true, 12800, '2024-12-15', '2024-12-01'),
('f0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000015', 'REFANA0003', 'antonia.castro@email.cl', 'REGISTERED', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, false, NULL, NULL, '2024-12-20'),
('f0000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000004', NULL, 'REFPEDRO4', 'amigo1@email.cl', 'PENDING', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, false, NULL, NULL, '2024-12-22'),
('f0000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', NULL, 'REFMARIA01', 'amigo2@email.cl', 'PENDING', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, false, NULL, NULL, '2024-12-23'),
('f0000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', NULL, 'REFCARLOS2', 'amigo3@email.cl', 'PENDING', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, false, NULL, NULL, '2024-12-24'),
('f0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000005', NULL, 'REFSOFIA5', 'amigo4@email.cl', 'EXPIRED', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, false, NULL, NULL, '2024-06-01'),
('f0000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000006', NULL, 'REFROBERT', 'amigo5@email.cl', 'EXPIRED', 5000, 3000, 'DISCOUNT', 'DISCOUNT', false, false, NULL, NULL, '2024-05-15'),
('f0000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', NULL, 'REFANA0003', 'amigo6@email.cl', 'PENDING', 5000, 3000, 'POINTS', 'DISCOUNT', false, false, NULL, NULL, '2024-12-25');
