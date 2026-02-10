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

**Comunicacion entre servicios:** El servicio de Inventario valida la existencia de productos llamando al servicio de Productos via HTTP antes de crear/actualizar registros de inventario.

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Testing | Jest + Supertest |
| HTTP Client | axios + axios-retry |
| Validacion | zod |
| Documentacion | swagger-jsdoc + swagger-ui-express |
| JSON:API | jsonapi-serializer |
| Logging | pino |

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
- **Reintentos**: 3 intentos con backoff exponencial (1s, 2s, 4s)
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

## Testing

```bash
# Products Service
cd products-service
npm test              # Todas las pruebas
npm run test:unit     # Solo unitarias
npm run test:integration  # Solo integracion

# Inventory Service
cd inventory-service
npm test
npm run test:unit
npm run test:integration
```

## Decisiones Tecnicas

1. **Express.js sin framework opinionado**: Demuestra capacidad de disenar arquitectura limpia (Repository -> Service -> Controller) sin depender de convenciones de framework.

2. **Prisma como ORM**: Genera tipos TypeScript automaticamente, migraciones declarativas, y excelente developer experience con autocompletado.

3. **Bases de datos separadas**: Cada microservicio tiene su propia base de datos PostgreSQL, respetando el principio de database-per-service.

4. **Validacion con zod**: Type-safe validation que se integra naturalmente con TypeScript, evitando discrepancias entre tipos y validaciones runtime.

5. **axios-retry para resiliencia**: Reintentos con backoff exponencial integrado, sin necesidad de implementar logica de reintentos manual.

6. **Structured logging con pino**: Logs en formato JSON que facilitan el procesamiento y analisis en sistemas de observabilidad.

7. **JSON:API como estandar**: Formato de respuesta consistente y predecible que facilita el consumo por parte de clientes.
