# Prueba Tecnica Backend Senior - Microservicios

Dos microservicios independientes (Productos e Inventario) que se comunican via HTTP siguiendo el estandar JSON:API.

## Arquitectura

```
                    ┌─────────────────────┐
                    │      Cliente        │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
        ┌────────▼────────┐        ┌─────────▼───────┐
        │ Products Service│        │Inventory Service │
        │   (port 3001)   │◄───────│   (port 3002)    │
        └────────┬────────┘  HTTP  └─────────┬────────┘
                 │                           │
        ┌────────▼────────┐        ┌─────────▼────────┐
        │  products_db    │        │  inventory_db     │
        │  (PostgreSQL)   │        │  (PostgreSQL)     │
        └─────────────────┘        └──────────────────┘
```

### Flujo de Comunicacion entre Servicios

```
┌──────────┐    PATCH /inventory/:id     ┌───────────────────┐
│  Cliente  │ ─────────────────────────► │ Inventory Service  │
└──────────┘                             └────────┬──────────┘
                                                  │
                                    1. Valida producto via HTTP
                                                  │
                                    GET /api/v1/products/:id
                                    Header: X-API-Key
                                                  │
                                         ┌────────▼──────────┐
                                         │ Products Service   │
                                         └────────┬──────────┘
                                                  │
                                    2. Responde con producto o error
                                                  │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                         200 OK              404 Not Found       503/504 Error
                         (existe)            (no existe)         (servicio caido)
                              │                    │                    │
                              ▼                    ▼                    ▼
                     3a. Upsert en           3b. Retorna          3c. Retorna
                     inventory_db            JSON:API 404         JSON:API 503/504
                              │
                              ▼
                     4. Emite evento
                     (log estructurado)
                              │
                              ▼
                     5. Retorna JSON:API
                     200 al cliente
```

### Patrones de Diseno Utilizados

- **Repository Pattern**: Abstrae el acceso a datos, facilita testing con mocks
- **Service Layer**: Logica de negocio aislada de controladores y repositorios
- **Dependency Injection**: Servicios inyectados via constructor, facilita testing y desacoplamiento
- **Serializer Pattern**: Transformacion de datos a formato JSON:API centralizada
- **Factory Pattern**: `createApp()` y `createHttpClient()` permiten configuracion flexible

## Stack Tecnologico

| Componente | Tecnologia | Justificacion |
|---|---|---|
| Runtime | Node.js + TypeScript | Requisito de la vacante. TypeScript agrega type-safety en compilacion |
| Framework | Express.js | Demuestra capacidad arquitectonica sin depender de framework opinionado |
| ORM | Prisma | Genera tipos TypeScript automaticamente, migraciones declarativas |
| Base de datos | PostgreSQL | Relacional, ACID compliance necesario para consistencia de inventario |
| Testing | Jest + Supertest | Estandar de la industria, mocking nativo, testing HTTP |
| HTTP Client | axios + axios-retry | Reintentos con backoff exponencial integrado |
| Validacion | zod | Type-safe, se integra naturalmente con TypeScript |
| Documentacion | swagger-jsdoc + swagger-ui-express | Genera docs desde anotaciones JSDoc |
| JSON:API | jsonapi-serializer | Serializacion JSON:API estandar |
| Logging | pino | Structured logging en JSON, alto rendimiento |

## Inicio Rapido

### Con Docker (recomendado)

```bash
# Clonar el repositorio
git clone <repo-url>
cd prueba-tecnica-backend

# Levantar todo el stack
docker-compose up --build
```

Los servicios estaran disponibles en:
- **Products Service:** http://localhost:3001
- **Inventory Service:** http://localhost:3002
- **Swagger UI Products:** http://localhost:3001/api/v1/docs
- **Swagger UI Inventory:** http://localhost:3002/api/v1/docs

### Desarrollo Local

```bash
# Instalar dependencias
cd products-service && npm install
cd ../inventory-service && npm install

# Configurar variables de entorno (copiar .env.example)
# Levantar PostgreSQL (o usar docker-compose solo para las DBs)
docker-compose up products-db inventory-db

# Ejecutar migraciones
cd products-service && npx prisma migrate dev
cd ../inventory-service && npx prisma migrate dev

# Iniciar servicios
cd products-service && npm run dev
cd ../inventory-service && npm run dev
```

## API Endpoints

### Products Service (puerto 3001)

| Metodo | Endpoint | Descripcion |
|---|---|---|
| POST | `/api/v1/products` | Crear producto |
| GET | `/api/v1/products/:id` | Obtener producto por ID |
| PATCH | `/api/v1/products/:id` | Actualizar producto |
| DELETE | `/api/v1/products/:id` | Eliminar producto |
| GET | `/api/v1/products` | Listar con paginacion |
| GET | `/api/v1/docs` | Swagger UI |

### Inventory Service (puerto 3002)

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/api/v1/inventory/:productId` | Consultar stock |
| PATCH | `/api/v1/inventory/:productId` | Actualizar stock (upsert) |
| GET | `/api/v1/docs` | Swagger UI |

## Autenticacion

Todas las peticiones requieren el header `X-API-Key`:

```bash
curl -H "X-API-Key: my-secret-api-key" http://localhost:3001/api/v1/products
```

## Ejemplos de Uso

### Crear un producto
```bash
curl -X POST http://localhost:3001/api/v1/products \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-api-key" \
  -d '{
    "data": {
      "type": "products",
      "attributes": {
        "name": "Laptop Gaming",
        "description": "Laptop para gaming de alta gama",
        "price": 1299.99,
        "sku": "LAP-001"
      }
    }
  }'
```

### Actualizar inventario
```bash
curl -X PATCH http://localhost:3002/api/v1/inventory/<product-id> \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-api-key" \
  -d '{
    "data": {
      "type": "inventory",
      "attributes": {
        "quantity": 50
      }
    }
  }'
```

### Consultar inventario
```bash
curl http://localhost:3002/api/v1/inventory/<product-id> \
  -H "X-API-Key: my-secret-api-key"
```

## Resiliencia

El servicio de Inventario implementa las siguientes estrategias de resiliencia al comunicarse con el servicio de Productos:

- **Timeout**: 5 segundos por request
- **Reintentos**: 3 intentos con backoff exponencial (1s, 2s, 4s) para errores de red, 503 y 504
- **Manejo de errores**: Errores de red se mapean a respuestas JSON:API apropiadas

| Escenario | Status | Mensaje |
|---|---|---|
| Producto no encontrado | 404 | Product not found |
| Servicio no disponible | 503 | Products service is currently unavailable |
| Timeout | 504 | Products service did not respond in time |

## Eventos de Inventario

Los cambios de inventario se registran como logs estructurados (pino):

```json
{
  "level": "info",
  "event": "inventory.updated",
  "productId": "uuid",
  "previousQuantity": 100,
  "newQuantity": 95,
  "change": -5
}
```

## Pruebas

### Estrategia de Testing

Se priorizaron pruebas que validan la logica de negocio critica y la comunicacion entre servicios, ya que estos son los puntos de mayor riesgo en una arquitectura de microservicios.

### Pruebas Unitarias

**Products Service** (`tests/unit/product.service.test.ts`) - 10 tests
| Test | Que valida | Por que es importante |
|---|---|---|
| Crear producto | Transformacion de precio a Decimal, llamada al repositorio | Asegura que los datos llegan correctos a la BD |
| Duplicado SKU | ConflictError al violar constraint unique | Previene productos duplicados |
| Buscar por ID | Retorno correcto cuando existe | Flujo basico de consulta |
| No encontrado | NotFoundError cuando no existe | Manejo correcto de 404 |
| Paginacion | Calculo de skip/take correcto | Evita bugs de offset en listados |
| Paginacion pagina 2 | Skip = (page-1) * pageSize | Valida la formula de paginacion |
| Actualizar | Datos actualizados correctamente | Flujo basico de edicion |
| Actualizar inexistente | NotFoundError previo al update | Previene updates fantasma |
| Eliminar | Eliminacion exitosa | Flujo basico de eliminacion |
| Eliminar inexistente | NotFoundError previo al delete | Previene deletes fantasma |

**Inventory Service** (`tests/unit/inventory.service.test.ts`) - 6 tests
| Test | Que valida | Por que es importante |
|---|---|---|
| Consultar stock existente | Retorna inventario tras validar producto | Flujo critico de consulta |
| Producto sin inventario | NotFoundError si no hay registro | Distingue "no existe" de "cantidad 0" |
| Producto inexistente | Propaga error del product client | Validacion inter-servicio funciona |
| Crear inventario nuevo | Upsert cuando no existe registro previo | Primera compra de un producto |
| Actualizar inventario existente | Upsert cuando ya existe registro | Compras subsiguientes |
| Producto inexistente en update | Error propagado, sin upsert ejecutado | Previene inventario huerfano |

### Pruebas de Integracion

**Products Service** (`tests/integration/product.routes.test.ts`) - CRUD HTTP completo
| Test | Que valida | Por que es importante |
|---|---|---|
| POST crea producto | Ciclo HTTP completo, formato JSON:API | Contrato de API funciona end-to-end |
| POST datos invalidos | Respuesta 422 con errores de validacion | Zod + middleware funcionan juntos |
| POST sin API Key | Respuesta 401 Unauthorized | Autenticacion protege endpoints |
| POST SKU duplicado | Respuesta 409 Conflict | Constraint de BD llega al cliente |
| GET por ID | Respuesta JSON:API con datos correctos | Serializacion funciona |
| GET inexistente | Respuesta 404 JSON:API | Error handling consistente |
| GET lista paginada | Meta con total/pages, links de navegacion | Paginacion JSON:API completa |
| PATCH actualiza | Datos modificados en respuesta | Update end-to-end |
| DELETE exitoso | Status 204 No Content | Eliminacion end-to-end |
| DELETE inexistente | Status 404 | Error handling en delete |

**Inventory Service** (`tests/integration/product-client.test.ts`) - Comunicacion entre servicios
| Test | Que valida | Por que es importante |
|---|---|---|
| Producto existe | Retorna datos del producto | Comunicacion HTTP exitosa |
| Producto no encontrado (404) | Lanza NotFoundError | Manejo de producto inexistente |
| Timeout (ECONNABORTED) | Lanza GatewayTimeoutError | Resiliencia ante latencia |
| Conexion rechazada (ECONNREFUSED) | Lanza ServiceUnavailableError | Resiliencia ante servicio caido |
| Error generico del servidor | Lanza ServiceUnavailableError | Fallback para errores inesperados |

**Inventory Service** (`tests/integration/inventory.routes.test.ts`) - Rutas HTTP
| Test | Que valida | Por que es importante |
|---|---|---|
| GET inventario existente | Formato JSON:API correcto | Contrato de API |
| GET sin API Key | Respuesta 401 | Autenticacion funciona |
| PATCH upsert | Crea/actualiza inventario | Flujo principal de compra |
| PATCH cantidad invalida | Respuesta 422 | Validacion previene datos erroneos |

### Ejecutar Pruebas

```bash
# Products Service
cd products-service
npm test              # Todas las pruebas
npm run test:unit     # Solo unitarias
npm run test:integration  # Solo integracion (requiere BD)

# Inventory Service
cd inventory-service
npm test
npm run test:unit
npm run test:integration
```

## Decisiones Tecnicas

1. **Express.js sin framework opinionado**: Demuestra capacidad de disenar arquitectura limpia (Repository -> Service -> Controller) sin depender de convenciones de framework como NestJS.

2. **PostgreSQL como base de datos**: Se eligio SQL por la necesidad de ACID compliance en operaciones de inventario (consistencia en cantidades), constraints (SKU unico), y relaciones estructuradas. NoSQL no ofrece ventajas en este dominio.

3. **Bases de datos separadas**: Cada microservicio tiene su propia base de datos PostgreSQL, respetando el principio de database-per-service. El inventario no tiene FK real al producto; la validacion se hace via HTTP.

4. **Prisma como ORM**: Genera tipos TypeScript automaticamente desde el schema, migraciones declarativas, y excelente developer experience con autocompletado.

5. **Validacion con zod**: Type-safe validation que se integra naturalmente con TypeScript, evitando discrepancias entre tipos y validaciones runtime.

6. **axios-retry para resiliencia**: Reintentos con backoff exponencial integrado para errores de red, 503 y 504, sin necesidad de implementar logica de reintentos manual.

7. **Structured logging con pino**: Logs en formato JSON que facilitan el procesamiento y analisis en sistemas de observabilidad (ELK, Datadog, etc).

8. **Versionado de API (`/api/v1/`)**: Permite evolucionar la API sin romper clientes existentes. Futuras versiones pueden coexistir en `/api/v2/`.

## Suposiciones Realizadas

1. **Inventario como cantidad absoluta**: El PATCH de inventario establece la cantidad total, no un delta. Se asumio que el cliente (punto de venta, ERP) calcula la nueva cantidad.

2. **Un registro de inventario por producto**: Relacion 1:1 entre producto e inventario. No se modelaron multiples almacenes o ubicaciones.

3. **API Key unica compartida**: Se asumio un unico API Key para comunicacion entre servicios. En produccion se usarian keys por servicio con rotacion.

4. **Sin soft delete**: Los productos se eliminan fisicamente. Se asumio que no hay necesidad de auditoría de eliminaciones para esta prueba.

5. **Sin cache**: Las consultas al servicio de productos no se cachean. Se priorizo simplicidad sobre rendimiento.

6. **Eventos como logs**: Los eventos de inventario se emiten como logs estructurados en consola, no a un message broker, segun lo indicado en los requisitos.

## Posibles Mejoras con Mas Tiempo

1. **Message Broker (RabbitMQ/Kafka)**: Reemplazar logs por eventos reales para comunicacion asincrona entre servicios, reduciendo acoplamiento temporal.

2. **Circuit Breaker Pattern**: Implementar con `opossum` para cortar circuito cuando el servicio de productos falla repetidamente, evitando cascading failures.

3. **Cache con Redis**: Cachear respuestas del servicio de productos para reducir latencia y carga en consultas frecuentes.

4. **Rate Limiting**: Agregar `express-rate-limit` para proteger los endpoints de abuso.

5. **Correlation IDs**: Propagar un ID de request entre servicios para facilitar tracing distribuido.

6. **Kubernetes + Helm**: Migrar de docker-compose a K8s para escalado horizontal, health checks avanzados, y rolling deployments.

7. **CI/CD Pipeline**: GitHub Actions con build, test, lint, y deploy automatizado.

8. **Monitoring**: Integrar Prometheus + Grafana para metricas de latencia, throughput, y error rates.

9. **API Gateway**: Agregar Kong o AWS API Gateway como punto de entrada unico con rate limiting, auth centralizada, y load balancing.

10. **Soft Delete + Auditoría**: Agregar `deletedAt` para eliminacion logica y tabla de auditoría para cambios criticos de inventario.
