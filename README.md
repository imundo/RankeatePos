# 🛒 POS Chile - Sistema de Punto de Venta

Sistema completo de punto de venta para panaderías, minimarkets y cafeterías en Chile.

## 🚀 Demo Rápida

### Credenciales de prueba
| Empresa | Email | Password |
|---------|-------|----------|
| Panadería El Trigal | `admin@eltrigal.cl` | `demo1234` |
| Minimarket Don Pedro | `admin@donpedro.cl` | `demo1234` |

## 🐳 Ejecución Local (Docker)

```bash
cd docker
docker-compose up -d
```

**URL Local:** http://localhost:4200

## ☁️ Despliegue en Render.com

### Opción 1: Deploy automático con Blueprint

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/imundo/RankeatePos)

### Opción 2: Manual

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Conecta tu repositorio GitHub
4. Render detectará `render.yaml` y creará todos los servicios

### Servicios creados automáticamente:
- 3 bases de datos PostgreSQL (auth, catalog, sales)
- 5 web services (auth, catalog, sales, bff-gateway, frontend)

## 📁 Estructura del Proyecto

```
├── backend/
│   ├── auth-service/       # Autenticación y usuarios
│   ├── catalog-service/    # Productos y categorías
│   ├── sales-service/      # Ventas y caja
│   └── bff-gateway/        # API Gateway para frontend
├── frontend/
│   └── pos-app/           # Angular 18 + PrimeNG
├── docker/
│   └── docker-compose.yml  # Orquestación local
└── render.yaml             # Configuración Render.com
```

## 🔧 Tecnologías

- **Backend:** Java 21 + Spring Boot 3.2
- **Frontend:** Angular 18 + PrimeNG
- **Base de Datos:** PostgreSQL 16
- **Containerización:** Docker + Docker Compose

## 📋 Características

- ✅ Punto de venta responsive
- ✅ Multi-tenant (múltiples empresas)
- ✅ Dashboard con métricas
- ✅ Gestión de inventario
- ✅ Control de caja
- ✅ Demo data incluido
