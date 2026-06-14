CREATE TABLE countries (
    id UUID PRIMARY KEY,
    iso_code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    tax_id_format VARCHAR(50),
    tax_id_name VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE currencies (
    id UUID PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    decimals INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Seed data for LATAM
INSERT INTO countries (id, iso_code, name, tax_id_format, tax_id_name) VALUES
(gen_random_uuid(), 'CL', 'Chile', 'XX.XXX.XXX-X', 'RUT'),
(gen_random_uuid(), 'PE', 'Perú', 'XXXXXXXXXXX', 'RUC'),
(gen_random_uuid(), 'MX', 'México', 'XXXXXXXXXXXXX', 'RFC'),
(gen_random_uuid(), 'CO', 'Colombia', 'XXXXXXXXXX-X', 'NIT'),
(gen_random_uuid(), 'AR', 'Argentina', 'XX-XXXXXXXX-X', 'CUIT');

INSERT INTO currencies (id, code, name, symbol, decimals) VALUES
(gen_random_uuid(), 'CLP', 'Peso Chileno', '$', 0),
(gen_random_uuid(), 'PEN', 'Sol Peruano', 'S/', 2),
(gen_random_uuid(), 'MXN', 'Peso Mexicano', '$', 2),
(gen_random_uuid(), 'COP', 'Peso Colombiano', '$', 0),
(gen_random_uuid(), 'ARS', 'Peso Argentino', '$', 2),
(gen_random_uuid(), 'USD', 'Dólar Estadounidense', '$', 2);
