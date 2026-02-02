ALTER TABLE sales ADD COLUMN dte_status VARCHAR(20) DEFAULT 'NONE';
ALTER TABLE sales ADD COLUMN dte_error TEXT;

-- Update existing records to have a valid status (optional, but good practice)
UPDATE sales SET dte_status = 'SENT' WHERE estado = 'COMPLETADA';
UPDATE sales SET dte_status = 'NONE' WHERE dte_status IS NULL;
