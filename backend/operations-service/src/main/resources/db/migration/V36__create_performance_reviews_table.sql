-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    period VARCHAR(20) NOT NULL,
    review_date DATE,
    reviewer_name VARCHAR(100),
    overall_score INTEGER,
    feedback TEXT,
    goals TEXT,
    status VARCHAR(30) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_perf_review_tenant ON performance_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perf_review_employee ON performance_reviews(employee_id);
