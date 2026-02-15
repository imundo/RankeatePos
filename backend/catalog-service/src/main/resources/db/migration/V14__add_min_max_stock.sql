ALTER TABLE product_variants 
ADD COLUMN stock_maximo INTEGER DEFAULT 0;

-- Index for querying low/high stock
CREATE INDEX idx_pv_stock_minimo ON product_variants(stock_minimo);
CREATE INDEX idx_pv_stock_maximo ON product_variants(stock_maximo);
