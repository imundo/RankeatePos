-- V33__add_uom_to_supplier_products.sql

ALTER TABLE supplier_products ADD COLUMN unit_of_measure VARCHAR(20) DEFAULT 'UN';
