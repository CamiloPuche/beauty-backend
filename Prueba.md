# [cite_start]PRUEBA TÉCNICA - BACKEND DEVELOPER SENIOR (Node.js / NestJS o Express + AWS + MongoDB) [cite: 2, 3]

## Objetivo
[cite_start]Construir una API backend lista para producción (a nivel de arquitectura y calidad) que permita gestionar productos, crear órdenes de compra, procesar un pago (modo sandbox/mock) y ejecutar acciones post-pago: guardar evidencia en S3 y enviar notificación por correo. [cite: 5]
[cite_start]Debe contemplar idempotencia, seguridad, observabilidad mínima y pruebas. [cite: 6]

## Contexto funcional (dominio)
Sistema de ventas simple para una tienda (ej: e-commerce/beauty). [cite_start]Un usuario puede listar productos, crear una orden y pagarla. [cite: 7, 8]
[cite_start]Cuando el pago es confirmado por webhook, el sistema marca la orden como pagada, guarda un comprobante en S3 y envía un correo de confirmación. [cite: 9]

## Stack requerido
* [cite_start]**Node.js:** (NestJS recomendado, Express aceptado). [cite: 12]
* [cite_start]**Base de datos:** MongoDB (Mongoose o driver nativo). [cite: 12]
* **AWS:** S3 obligatorio. (Se acepta LocalStack para desarrollo)[cite_start]. [cite: 13]
* [cite_start]**Sistema de correo:** SES, Sendgrid, Mailgun o Nodemailer (modo sandbox aceptado). [cite: 14]
* [cite_start]**Pagos:** integración sandbox/mock con endpoint de webhook (simular un gateway real). [cite: 15]
* [cite_start]**Infraestructura:** Docker (recomendado) + README de ejecución. [cite: 16]

---

## Requerimientos mínimos (MVP)

### 1. Autenticación y autorización
* [cite_start]JWT (login/registro). [cite: 19]
* Roles: USER | [cite_start]ADMIN. [cite: 20]
* ADMIN puede crear/editar/desactivar productos. [cite_start]USER compra. [cite: 21]

### 2. Productos
* [cite_start]CRUD de productos (ADMIN). [cite: 26]
* [cite_start]Campos sugeridos: `name`, `description`, `price`, `currency`, `stock`, `isActive`, `category`. [cite: 27]

### 3. Órdenes
* [cite_start]Crear orden (USER) con uno o varios items. [cite: 29]
* [cite_start]Calcular subtotal/total. [cite: 30]
* [cite_start]Estado de orden: `CREATED`, `PAYMENT_PENDING`, `PAID`, `FAILED`, `CANCELED`. [cite: 31]
* [cite_start]Endpoint para consultar órdenes del usuario. [cite: 32]
* [cite_start]Admin puede listar todas con filtros básicos. [cite: 33]

### 4. Pago (mock/sandbox) + Webhook
* [cite_start]Endpoint "iniciar pago" que genere un `paymentIntent` / `transactionId` (mock). [cite: 35]
* [cite_start]Endpoint webhook que reciba eventos del "gateway" y confirme el pago. [cite: 36]
* [cite_start]Validar firma del webhook (aunque sea una firma simple con secret compartido). [cite: 37]
* [cite_start]**Reglas de idempotencia:** el mismo webhook/eventId no puede procesarse 2 veces (no debe duplicar cambios). [cite: 38]

### 5. S3 (obligatorio)
* [cite_start]Al confirmar pago: generar un "recibo" (JSON o PDF simple) y subirlo a S3. [cite: 40]
* [cite_start]Guardar en la orden la referencia del archivo (key) y opcional: presigned URL de lectura. [cite: 41]

### 6. Email (obligatorio)
* [cite_start]Al confirmar pago: enviar correo de confirmación al usuario (subject + body). [cite: 43]
* [cite_start]El envío debe ser tolerante a fallos (no tumbar la confirmación de la orden; registrar error y permitir reintento). [cite: 44]

---

## 7. Calidad técnica
* [cite_start]Manejo de errores consistente (HTTP codes + mensajes). [cite: 49]
* [cite_start]Validaciones de DTO/inputs (ej: class-validator en Nest). [cite: 49]
* [cite_start]Logs mínimos con `correlationId` / `requestId`. [cite: 49]
* [cite_start]Variables de entorno y configuración limpia. [cite: 50]

### [cite_start]Endpoints sugeridos (puedes proponer otros) [cite: 51]
[cite_start]**Auth** [cite: 52]
* [cite_start]`POST /auth/register` [cite: 53]
* [cite_start]`POST /auth/login` [cite: 54]

[cite_start]**Products** [cite: 55]
* [cite_start]`GET /products` [cite: 56]
* [cite_start]`POST /products` (ADMIN) [cite: 57]
* [cite_start]`PATCH /products/:id` (ADMIN) [cite: 58]
* [cite_start]`DELETE /products/:id` (ADMIN) o soft-delete [cite: 60]

[cite_start]**Orders** [cite: 59]
* [cite_start]`POST /orders` (USER) [cite: 62]
* [cite_start]`GET /orders` (USER) [cite: 63]
* [cite_start]`GET /orders/:id` (USER/ADMIN con reglas) [cite: 64]

[cite_start]**Payments** [cite: 65]
* [cite_start]`POST /orders/:id/pay` (USER) -> retorna `transactionId` + info para simular pago [cite: 66]
* [cite_start]`POST /payments/webhook` -> recibe evento (paid/failed) [cite: 67]

---

## Entrega (obligatorio)
* [cite_start]Repositorio en GitHub con commits claros. [cite: 69]
* [cite_start]README: cómo ejecutar local (Docker/LocalStack), variables de entorno, y pasos de prueba. [cite: 70]
* [cite_start]Colección Postman/Insomnia o curl examples. [cite: 71]
* [cite_start]Pruebas: unitarias y al menos integración del flujo de webhook/idempotencia. [cite: 72, 75, 76]
* (Opcional) [cite_start]Diagrama simple del flujo (orden → pago → webhook → S3 + email). [cite: 77]

---

## [cite_start]CRITERIOS DE EVALUACIÓN (LO QUE SE REVISA EN NIVEL SENIOR) [cite: 81]
1.  [cite_start]**Arquitectura:** Separación por capas, adaptadores/servicios, diseño limpio. [cite: 82]
2.  [cite_start]**Correctitud de negocio:** Estados, totales, validaciones. [cite: 82]
3.  [cite_start]**Idempotencia y concurrencia:** Duplicados de webhook, doble confirmación, race conditions. [cite: 83]
4.  [cite_start]**Seguridad:** JWT, roles, validación firma webhook, manejo de secrets, no filtrar datos sensibles. [cite: 84]
5.  [cite_start]**Integración AWS S3:** Subida correcta, permisos, manejo de errores. [cite: 85]
6.  [cite_start]**Email:** Estrategia de reintento o registro de fallos. [cite: 86]
7.  [cite_start]**Testing:** Cobertura real de lógica + tests de flujo crítico. [cite: 87]
8.  [cite_start]**Observabilidad:** Logs útiles y trazabilidad mínima. [cite: 88]

### [cite_start]Extras (puntos adicionales) [cite: 89]
* [cite_start]Cola/eventos (SQS o equivalente) para email/recibos. [cite: 90]
* [cite_start]Rate limiting en endpoints críticos. [cite: 91]
* [cite_start]OpenAPI/Swagger. [cite: 91]
* [cite_start]CI básico (lint + tests). [cite: 91]
* [cite_start]Manejo de stock y consistencia. [cite: 92]

### Notas Adicionales
1.  [cite_start]No se requiere frontend. [cite: 94]
2.  [cite_start]Se permite usar LocalStack para S3 y sandbox para correo/pagos. [cite: 95]
3.  [cite_start]Se valora más la calidad del diseño y robustez que "muchos endpoints". [cite: 96]