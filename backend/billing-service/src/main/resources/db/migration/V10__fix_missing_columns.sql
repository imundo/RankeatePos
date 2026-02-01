ALTER TABLE config_facturacion ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE config_facturacion ADD COLUMN IF NOT EXISTS api_key VARCHAR(500);
ALTER TABLE config_facturacion ADD COLUMN IF NOT EXISTS certificate_password VARCHAR(200);
ALTER TABLE config_facturacion ADD COLUMN IF NOT EXISTS certificate_storage_path VARCHAR(500);
