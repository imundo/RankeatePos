-- Incrementar tamaño de columna numero para soportar números más largos
-- V202601162026011600002 tiene 24 caracteres, necesitamos al menos VARCHAR(30)

ALTER TABLE sales ALTER COLUMN numero TYPE VARCHAR(30);
