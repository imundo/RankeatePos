-- V42: Appointments & Service Catalog System
-- Integrated with existing operations-service (reservations, loyalty, etc.)

-- Catálogo de servicios disponibles para agendar
CREATE TABLE IF NOT EXISTS service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_minutos INTEGER NOT NULL DEFAULT 60,
    precio DECIMAL(12,2),
    color VARCHAR(7) DEFAULT '#6366f1',
    icono VARCHAR(50) DEFAULT 'calendar',
    categoria VARCHAR(50),
    requiere_profesional BOOLEAN DEFAULT TRUE,
    max_reservas_simultaneas INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_service_catalog_tenant ON service_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_branch ON service_catalog(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_activo ON service_catalog(tenant_id, activo);

-- Disponibilidad de profesionales/staff
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    staff_id UUID NOT NULL,
    staff_nombre VARCHAR(100),
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=DOM, 6=SAB
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_availability_tenant ON staff_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON staff_availability(tenant_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_dia ON staff_availability(tenant_id, dia_semana, activo);

-- Bloqueos de horario (vacaciones, feriados, etc.)
CREATE TABLE IF NOT EXISTS staff_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    motivo VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_blocks_tenant ON staff_blocks(tenant_id, staff_id);

-- Citas / Appointments (integrado con el sistema de reservaciones existente)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    customer_id UUID,
    customer_nombre VARCHAR(100),
    customer_telefono VARCHAR(20),
    customer_email VARCHAR(100),
    staff_id UUID,
    staff_nombre VARCHAR(100),
    service_id UUID REFERENCES service_catalog(id),
    service_nombre VARCHAR(100),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) DEFAULT 'PROGRAMADA'
        CHECK (estado IN ('PROGRAMADA','CONFIRMADA','EN_PROGRESO','COMPLETADA','CANCELADA','NO_SHOW','REPROGRAMADA')),
    notas TEXT,
    notas_internas TEXT,
    precio_estimado DECIMAL(12,2),
    precio_final DECIMAL(12,2),
    canal_reserva VARCHAR(20) DEFAULT 'MANUAL'
        CHECK (canal_reserva IN ('MANUAL','WEB','WHATSAPP','APP','TELEFONO')),
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    recurrente BOOLEAN DEFAULT FALSE,
    recurrencia_patron VARCHAR(20), -- SEMANAL, QUINCENAL, MENSUAL
    recurrencia_parent_id UUID,
    color VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(tenant_id, fecha);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(tenant_id, staff_id, fecha);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_estado ON appointments(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_appointments_branch ON appointments(tenant_id, branch_id, fecha);

-- Historial de recordatorios enviados
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('EMAIL','WHATSAPP','SMS','PUSH')),
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','ENVIADO','FALLIDO','ENTREGADO')),
    fecha_programada TIMESTAMPTZ,
    fecha_envio TIMESTAMPTZ,
    contenido TEXT,
    error_detalle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_estado ON appointment_reminders(estado);
