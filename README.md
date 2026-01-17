# Beauty Store API

API backend para sistema de ventas de productos de belleza. Desarrollada como prueba técnica para Backend Developer.

## 🚀 Stack Tecnológico

- **Framework:** NestJS (Node.js)
- **Base de datos:** MongoDB (Mongoose)
- **Almacenamiento:** AWS S3 (LocalStack para desarrollo)
- **Email:** Nodemailer (Mailtrap para desarrollo)
- **Autenticación:** JWT
- **Documentación:** Swagger/OpenAPI
- **Contenedores:** Docker

## 📋 Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- npm o yarn
## 🚀 Quick Start

```bash
git clone https://github.com/CamiloPuche/beauty-backend.git
cd beauty-backend
npm install
docker compose up -d mongodb localstack
npm run seed
npm run start:dev
```

**URLs:**
- **Swagger:** http://localhost:3000/api/docs
- **API:** http://localhost:3000

**Credenciales:**
- **Admin:** admin@beauty.com / admin123
- **User:** user@beauty.com / user123

---

## 🛠️ Instalación Detallada

### 1. Clonar el repositorio

```bash
git clone https://github.com/CamiloPuche/beauty-backend.git
cd beauty-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales (opcional, los valores por defecto funcionan para desarrollo):

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/beauty-store

# JWT
JWT_SECRET=your-super-secret-key

# Email (Mailtrap - opcional)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password

# Webhook
WEBHOOK_SECRET=your-webhook-secret
```

### 4. Levantar servicios con Docker

```bash
docker compose up -d mongodb localstack
```

### 5. Crear usuarios de prueba

Por seguridad, no se puede auto-asignar el rol ADMIN al registrar un usuario. Ejecuta el seed para crear usuarios de prueba:

```bash
npm run seed
```

Esto crea:
- **Admin:** admin@beauty.com / admin123
- **User:** user@beauty.com / user123

### 6. Ejecutar la aplicación

```bash
npm run start:dev
```

## 📚 Documentación API

Una vez iniciada la aplicación, accede a:

- **Swagger UI:** http://localhost:3000/api/docs
- **API Base URL:** http://localhost:3000

## 🔐 Autenticación (usando Postman)

Importa la colección `Beauty-Store-API.postman_collection.json` en Postman.

### Registrar usuario
📁 **Auth** → **Register User**
```json
{
  "name": "Test User",
  "email": "user@beauty.com",
  "password": "user123"
}
```

### Login
📁 **Auth** → **Login User** o **Login Admin**
- Los tokens se guardan automáticamente en las variables de la colección

### Ver perfil
📁 **Auth** → **Get Profile**
- Requiere token de autenticación

## 📦 Endpoints Principales

### Auth
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| GET | `/auth/profile` | Ver perfil | Sí |

### Products
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/products` | Listar productos | No |
| GET | `/products/:id` | Ver producto | No |
| POST | `/products` | Crear producto | ADMIN |
| PATCH | `/products/:id` | Actualizar producto | ADMIN |
| DELETE | `/products/:id` | Eliminar producto | ADMIN |

### Orders
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/orders` | Crear orden | USER |
| GET | `/orders` | Mis órdenes | USER |
| GET | `/orders/:id` | Ver orden | USER |
| GET | `/admin/orders` | Todas las órdenes | ADMIN |

### Payments
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/orders/:id/pay` | Iniciar pago | USER |
| POST | `/payments/webhook` | Webhook de pagos | No* |

*El webhook valida firma HMAC

## 💳 Flujo de Pago Completo (usando Postman)

Importa la colección `Beauty-Store-API.postman_collection.json` en Postman.

### Paso 1: Login Admin
📁 **Auth** → **Login Admin**
- Email: `admin@beauty.com`
- Password: `admin123`
- ✅ El token se guarda automáticamente en `{{adminToken}}`

### Paso 2: Crear Producto (Admin)
📁 **Products** → **Create Product (Admin)**
- Requiere token de admin
- ✅ El `productId` se guarda automáticamente

### Paso 3: Login User
📁 **Auth** → **Login User**
- Email: `user@beauty.com`
- Password: `user123`
- ✅ El token se guarda en `{{token}}`

### Paso 4: Crear Orden
📁 **Orders** → **Create Order**
- Usa el token de user
- ✅ El `orderId` se guarda automáticamente

### Paso 5: Iniciar Pago
📁 **Payments** → **1. Initiate Payment**
- ✅ El `transactionId` se guarda automáticamente

### Paso 6: Obtener Webhook Mock
📁 **Payments** → **2. Get Mock Success Webhook**
- ✅ El `webhookPayload` y `webhookSignature` se guardan automáticamente

### Paso 7: Enviar Webhook
📁 **Payments** → **3. Send Webhook (Success)**
- Response esperado: `{"success": true, "message": "Event processed successfully"}`

### Paso 8: Verificar Orden Pagada
📁 **Orders** → **Get Order by ID**
- Response esperado: `status: "PAID"` y `receiptUrl` con URL de S3

### Paso 9: Probar Idempotencia
📁 **Payments** → **3. Send Webhook (Success)** (ejecutar de nuevo)
- Response esperado: `{"success": true, "message": "Event already processed"}`
- ✅ Demuestra que el webhook no reprocesa eventos duplicados

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 🏗️ Arquitectura

```
src/
├── common/           # Elementos compartidos
│   ├── decorators/   # @Roles, @CurrentUser, @Public
│   ├── filters/      # Exception filters
│   ├── guards/       # JWT, Roles
│   └── interceptors/ # Logging
├── config/           # Configuración
├── modules/
│   ├── auth/         # Autenticación JWT
│   ├── users/        # Gestión de usuarios
│   ├── products/     # CRUD productos
│   ├── orders/       # Gestión de órdenes
│   ├── payments/     # Pagos + Webhook
│   ├── storage/      # S3 para recibos
│   └── notifications/# Email
└── main.ts
```

## ✅ Características Implementadas

- [x] JWT Authentication con roles (USER/ADMIN)
- [x] CRUD de productos con soft-delete
- [x] Órdenes con cálculo de totales
- [x] Pagos mock con webhook
- [x] **Idempotencia** en webhook (no procesa eventos duplicados)
- [x] **Validación de firma** HMAC en webhook
- [x] Subida de recibos a S3
- [x] Envío de emails de confirmación
- [x] Manejo global de errores con correlationId
- [x] Swagger/OpenAPI
- [x] Docker + Docker Compose

## 📝 Decisiones Técnicas

1. **Idempotencia:** Se guarda cada `eventId` del webhook en MongoDB antes de procesar. Si ya existe, se retorna éxito sin reprocesar.

2. **Tolerancia a fallos en email:** El envío de email es asíncrono y no bloquea la confirmación del pago.

3. **Recibo JSON:** Se optó por JSON en lugar de PDF por simplicidad, guardado en S3 con URL prefirmada de 7 días.

4. **Firma de webhook:** HMAC-SHA256 con secret compartido, usando `timingSafeEqual` para evitar timing attacks.

## 👤 Autor

**Camilo Puche**  
- GitHub: [@CamiloPuche](https://github.com/CamiloPuche)
- Email: camilopuche73@gmail.com
