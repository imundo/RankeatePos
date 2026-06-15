-- Clear DTE backlog to prevent massive spamming of old sales to the tax authority
-- Since the scheduler was disabled, many test sales were stuck in PENDING status.
UPDATE sales
SET dte_status = 'NONE', 
    dte_error = 'Omitido automáticamente para limpieza de backlog'
WHERE dte_status = 'PENDING';
