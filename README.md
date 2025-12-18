# 🏪 SaaS POS + Inventario + Finanzas (Chile-Ready)

Sistema SaaS orientado a microempresas chilenas (panaderías, charcuterías, minimarkets) para controlar ventas (POS), stock, finanzas básica y promociones.

## 🚀 Características

- **POS Mobile-First**: Venta rápida con soporte offline
- **Inventario**: Control de stock, movimientos, mermas, alertas
- **Multi-tenant**: Empresas aisladas con branding propio
- **Chile-Ready**: CLP, IVA 19%, boleta simple, RUT
- **Plantillas por Rubro**: Panadería, Charcutería, Minimarket

## 📁 Estructura del Proyecto

```
inventario/
├── backend/
│   ├── api-gateway/          # Spring Cloud Gateway
│   ├── auth-service/         # Autenticación, usuarios, tenants
│   ├── catalog-service/      # Productos, categorías, precios
│   ├── inventory-service/    # Stock, movimientos, alertas
│   ├── sales-service/        # POS, ventas, caja
│   ├── partners-service/     # Clientes, proveedores
│   ├── reporting-service/    # Reportes y dashboards
│   └── shared-lib/           # Librería común
├── frontend/
│   └── pos-app/              # Angular 18 PWA
├── docker/
│   ├── docker-compose.yml
│   └── .env.example
├── docs/
│   └── api/                  # OpenAPI specs
└── scripts/
    └── seed-data/            # Datos semilla por rubro
```

## 🛠️ Tecnologías

### Backend
- Java 21 + Spring Boot 3.2
- PostgreSQL 16
- Flyway (migraciones)
- JWT + Spring Security
- OpenAPI/Swagger

### Frontend
- Angular 18 (Standalone Components)
- PrimeNG (UI Components)
- Signals (State Management)
- IndexedDB + Dexie.js (Offline)
- PWA + Workbox

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)

## 🏃 Quick Start

### Requisitos
- Java 21+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (o usar Docker)

### Desarrollo Local

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd inventario

# 2. Iniciar servicios con Docker
cd docker
cp .env.example .env
docker-compose up -d postgres

# 3. Backend (cada servicio en terminal separada)
cd backend/auth-service
./mvnw spring-boot:run

# 4. Frontend
cd frontend/pos-app
npm install
npm start
```

### Docker Compose (todo junto)

```bash
cd docker
docker-compose up --build
```

Acceder a:
- **Frontend**: http://localhost:4200
- **API Gateway**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html

## 📋 Roles del Sistema

| Rol | Permisos |
|-----|----------|
| **OWNER_ADMIN** | Todo + configuración + auditoría |
| **MANAGER** | Supervisa POS/caja, aprueba descuentos, anula ventas |
| **CASHIER** | Vender, gestionar su caja |
| **STOCKKEEPER** | Movimientos de inventario, recepción |

## 🇨🇱 Configuración Chile

- **Moneda**: CLP (sin decimales)
- **Impuesto**: IVA 19%
- **Zona horaria**: America/Santiago
- **Documentos**: Boleta simple interna (MVP), DTE en v2

## 📄 Licencia

MIT License
