# Mock Data Setup Script for POS Chile Demo

# Run this after all services are up:
# - auth-service (port 8081)
# - catalog-service (port 8082)  
# - sales-service (port 8083)

# ======= STEP 1: Create Demo Companies and Users =======

Write-Host "=== Creating Demo Data ===" -ForegroundColor Green

# Company 1: Panaderia El Trigal
$company1 = @{
    rut = "76123456-7"
    razonSocial = "Panaderia El Trigal Ltda"
    nombreFantasia = "El Trigal"
    giro = "Panaderia y Pasteleria"
    email = "admin@eltrigal.cl"
    password = "Demo2024!"
    nombre = "Carlos"
    apellido = "Gonzalez"
} | ConvertTo-Json

try {
    $r1 = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" -Method POST -Body $company1 -ContentType "application/json"
    Write-Host "Created: $($r1.tenant.nombre) - $($r1.user.email)" -ForegroundColor Cyan
    $token1 = $r1.accessToken
    $tenantId1 = $r1.tenant.id
    $userId1 = $r1.user.id
} catch {
    Write-Host "Company 1 already exists or error: $_" -ForegroundColor Yellow
}

# Company 2: Minimarket Don Pedro
$company2 = @{
    rut = "76987654-3"
    razonSocial = "Minimarket Don Pedro Ltda"
    nombreFantasia = "Don Pedro"
    giro = "Minimarket"
    email = "pedro@donpedro.cl"
    password = "Demo2024!"
    nombre = "Pedro"
    apellido = "Ramirez"
} | ConvertTo-Json

try {
    $r2 = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" -Method POST -Body $company2 -ContentType "application/json"
    Write-Host "Created: $($r2.tenant.nombre) - $($r2.user.email)" -ForegroundColor Cyan
} catch {
    Write-Host "Company 2 already exists or error" -ForegroundColor Yellow
}

# ======= STEP 2: Login to get tokens for API calls =======

$loginBody = @{ email = "admin@eltrigal.cl"; password = "Demo2024!" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $login.accessToken
$tenantId = $login.tenant.id
$userId = $login.user.id

Write-Host "Logged in as: $($login.user.email)" -ForegroundColor Cyan

# Headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $token"
    "X-Tenant-Id" = $tenantId
    "X-User-Id" = $userId
    "Content-Type" = "application/json"
}

# ======= STEP 3: Create Categories in Catalog Service =======

Write-Host "`n=== Creating Categories ===" -ForegroundColor Green

$categories = @(
    @{ nombre = "Panes"; descripcion = "Panes frescos y artesanales"; orden = 1 },
    @{ nombre = "Pasteles"; descripcion = "Tortas y pasteles"; orden = 2 },
    @{ nombre = "Bebidas"; descripcion = "Bebidas frias y calientes"; orden = 3 },
    @{ nombre = "Lacteos"; descripcion = "Productos lacteos"; orden = 4 },
    @{ nombre = "Abarrotes"; descripcion = "Productos de almacen"; orden = 5 }
)

foreach ($cat in $categories) {
    try {
        $body = $cat | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "http://localhost:8082/api/categories" -Method POST -Headers $headers -Body $body
        Write-Host "Category: $($r.nombre)" -ForegroundColor Cyan
    } catch {
        Write-Host "Category error: $($cat.nombre)" -ForegroundColor Yellow
    }
}

# ======= STEP 4: Create Products =======

Write-Host "`n=== Creating Products ===" -ForegroundColor Green

$products = @(
    @{ sku = "PAN-001"; nombre = "Pan Marraqueta"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "PAN-001"; precioBruto = 150; stock = 100 }) },
    @{ sku = "PAN-002"; nombre = "Pan Hallulla"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "PAN-002"; precioBruto = 130; stock = 80 }) },
    @{ sku = "PAN-003"; nombre = "Pan Integral"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "PAN-003"; precioBruto = 200; stock = 50 }) },
    @{ sku = "PAS-001"; nombre = "Torta Chocolate"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "PAS-001"; precioBruto = 12000; stock = 10 }) },
    @{ sku = "PAS-002"; nombre = "Kuchen Manzana"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "PAS-002"; precioBruto = 8500; stock = 15 }) },
    @{ sku = "BEB-001"; nombre = "Cafe Americano"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "BEB-001"; precioBruto = 1500; stock = 200 }) },
    @{ sku = "BEB-002"; nombre = "Jugo Natural"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "BEB-002"; precioBruto = 2000; stock = 50 }) },
    @{ sku = "LAC-001"; nombre = "Leche 1L"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "LAC-001"; precioBruto = 1200; stock = 100 }) },
    @{ sku = "LAC-002"; nombre = "Yogurt Natural"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "LAC-002"; precioBruto = 800; stock = 60 }) },
    @{ sku = "ABR-001"; nombre = "Arroz 1kg"; tipoProducto = "PRODUCTO"; variants = @(@{ sku = "ABR-001"; precioBruto = 1500; stock = 80 }) }
)

foreach ($prod in $products) {
    try {
        $body = $prod | ConvertTo-Json -Depth 3
        $r = Invoke-RestMethod -Uri "http://localhost:8082/api/products" -Method POST -Headers $headers -Body $body
        Write-Host "Product: $($r.nombre) - $($r.variants[0].precioBruto) CLP" -ForegroundColor Cyan
    } catch {
        Write-Host "Product error: $($prod.nombre) - $_" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Mock Data Setup Complete ===" -ForegroundColor Green
Write-Host "`nDemo Credentials:" -ForegroundColor White
Write-Host "  Email: admin@eltrigal.cl" -ForegroundColor Cyan
Write-Host "  Password: Demo2024!" -ForegroundColor Cyan
Write-Host "`n  Email: pedro@donpedro.cl" -ForegroundColor Cyan
Write-Host "  Password: Demo2024!" -ForegroundColor Cyan
