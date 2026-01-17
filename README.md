# Beauty Store API

API backend para sistema de ventas de productos de belleza. Desarrollada como prueba técnica para Backend Developer Senior.

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

## 🛠️ Instalación

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

Editar `.env` con tus credenciales:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/beauty-store

# JWT
JWT_SECRET=your-super-secret-key

# Email (Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password

# Webhook
WEBHOOK_SECRET=your-webhook-secret
```

### 4. Levantar servicios con Docker

```bash
# Inicia MongoDB y LocalStack (S3)
docker compose up -d mongodb localstack
```

### 5. Ejecutar la aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### 6. Crear usuarios de prueba (opcional)

```bash
npm run seed
```

Esto crea:
- **Admin:** admin@beauty.com / admin123
- **User:** user@beauty.com / user123

## 📚 Documentación API

Una vez iniciada la aplicación, accede a:

- **Swagger UI:** http://localhost:3000/api/docs
- **API Base URL:** http://localhost:3000

## 🔐 Autenticación

### Registrar usuario

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Usar el token

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <TOKEN>"
```

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

## 💳 Flujo de Pago (Mock)

1. **Crear orden:**
```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<PRODUCT_ID>","quantity":2}]}'
```

2. **Iniciar pago:**
```bash
curl -X POST http://localhost:3000/orders/<ORDER_ID>/pay \
  -H "Authorization: Bearer <TOKEN>"
```

3. **Simular pago exitoso (obtener webhook payload):**
```bash
curl http://localhost:3000/payments/mock/<TRANSACTION_ID>/success
```

4. **Enviar webhook:**
```bash
curl -X POST http://localhost:3000/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: <SIGNATURE>" \
  -d '<WEBHOOK_PAYLOAD>'
```

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
