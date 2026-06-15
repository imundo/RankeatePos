ALTER TABLE sales ADD COLUMN tipo_documento VARCHAR(50);
ALTER TABLE sales ADD COLUMN cliente_rut VARCHAR(12);
ALTER TABLE sales ADD COLUMN cliente_razon_social VARCHAR(100);
ALTER TABLE sales ADD COLUMN cliente_giro VARCHAR(80);
ALTER TABLE sales ADD COLUMN cliente_direccion VARCHAR(70);
ALTER TABLE sales ADD COLUMN cliente_email VARCHAR(80);
ALTER TABLE sales ADD COLUMN dte_id UUID;
ALTER TABLE sales ADD COLUMN dte_folio INTEGER;
