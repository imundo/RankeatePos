ALTER TABLE config_facturacion
ADD COLUMN emisor_rut VARCHAR(20),
ADD COLUMN emisor_razon_social VARCHAR(200),
ADD COLUMN emisor_giro VARCHAR(200),
ADD COLUMN emisor_direccion VARCHAR(200),
ADD COLUMN emisor_comuna VARCHAR(100),
ADD COLUMN emisor_ciudad VARCHAR(100),
ADD COLUMN emisor_email VARCHAR(100),
ADD COLUMN emisor_telefono VARCHAR(50),
ADD COLUMN emisor_logo_url VARCHAR(500),
ADD COLUMN emisor_actividad_economica INTEGER;
