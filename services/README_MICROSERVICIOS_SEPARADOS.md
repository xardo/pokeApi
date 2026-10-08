# 🏛️ ARQUITECTURA DE MICROSERVICIOS SEPARADOS PARA DOCENTES (CRUD)

Este proyecto implementa **microservicios separados e independientes** para cada operación del ciclo CRUD sobre la base de datos de docentes en **Neon Database (PostgreSQL)**, cumpliendo estrictamente con el requerimiento académico de microservicios desacoplados con documentación Swagger en la nube.

---

## 📂 1. Organización de Carpetas de los Microservicios

Cada microservicio cuenta con su propio servidor, su propio puerto, sus dependencias y su propia interfaz interactiva de Swagger UI:

| Microservicio | Carpeta | Operación CRUD | Endpoint Principal | Puerto Local | Swagger UI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Consulta** | `services/docente-consultar-service/` | **READ** | `GET /api/profesores`<br>`GET /api/profesores/:id` | `4001` | `/docs` |
| **Creación** | `services/docente-crear-service/` | **CREATE** | `POST /api/profesores` | `4002` | `/docs` |
| **Actualización**| `services/docente-actualizar-service/` | **UPDATE** | `PUT /api/profesores/:id` | `4003` | `/docs` |
| **Eliminación** | `services/docente-eliminar-service/` | **DELETE** | `DELETE /api/profesores/:id` | `4004` | `/docs` |
| **Unificado (Gateway)** | `services/profesor-service-node/` | **CRUD Completo** | `GET, POST, PUT, DELETE` | `4000` | `/docs` |

---

## 🗄️ 2. Conexión a Neon Database

Todos los microservicios se conectan a la **misma base de datos de Neon** y operan sobre la misma tabla `profesor`:

```sql
CREATE TABLE IF NOT EXISTS profesor (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  imagen TEXT NOT NULL,
  formacion TEXT NOT NULL
);
```

Para conectar cualquiera de los microservicios a tu base de datos de Neon, simplemente debes asignar la variable de entorno `DATABASE_URL` con tu cadena de conexión:
```text
DATABASE_URL=postgresql://neondb_owner:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## ☁️ 3. Despliegue en la Nube (Render)

### ¿Cómo desplegar cada microservicio separado en Render?
1. Ve al [Dashboard de Render](https://dashboard.render.com/) e inicia sesión.
2. Crea un **New +** ➔ **Web Service** para cada uno de los microservicios que vayas a desplegar:

#### Para el Microservicio de Consulta (READ):
* **Name:** `docente-consultar-service`
* **Root Directory:** `services/docente-consultar-service`
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* **Environment Variable:** `DATABASE_URL` = *(Tu URL de Neon)*

#### Para el Microservicio de Creación (CREATE):
* **Name:** `docente-crear-service`
* **Root Directory:** `services/docente-crear-service`
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* **Environment Variable:** `DATABASE_URL` = *(Tu URL de Neon)*

#### Para el Microservicio de Actualización (UPDATE):
* **Name:** `docente-actualizar-service`
* **Root Directory:** `services/docente-actualizar-service`
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* **Environment Variable:** `DATABASE_URL` = *(Tu URL de Neon)*

#### Para el Microservicio de Eliminación (DELETE):
* **Name:** `docente-eliminar-service`
* **Root Directory:** `services/docente-eliminar-service`
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* **Environment Variable:** `DATABASE_URL` = *(Tu URL de Neon)*

---

## 📱 4. Conexión con la Aplicación Móvil

En el archivo [src/constants/apiConfig.ts](file:///c:/Users/Angel/Downloads/pokeApi/src/constants/apiConfig.ts), configuras las URLs que te dio Render para cada microservicio:

```typescript
export const DOCENTE_CONSULTAR_URL: string = 'https://docente-consultar-service.onrender.com';
export const DOCENTE_CREAR_URL: string = 'https://docente-crear-service.onrender.com';
export const DOCENTE_ACTUALIZAR_URL: string = 'https://docente-actualizar-service.onrender.com';
export const DOCENTE_ELIMINAR_URL: string = 'https://docente-eliminar-service.onrender.com';
```

*(Si por límite de servicios gratuitos en Render prefieres desplegar solo un servicio que responda a todas las rutas, pones la URL en `PROFESOR_CLOUD_URL` y la aplicación móvil automáticamente usará esa URL para todas las operaciones como fallback).*

---

## 💻 5. Comandos para Ejecutar en Local

Puedes arrancar cada microservicio individualmente desde la raíz del proyecto:

* **Microservicio Consulta:** `npm run service:docente:consultar` ➔ [http://localhost:4001/docs](http://localhost:4001/docs)
* **Microservicio Creación:** `npm run service:docente:crear` ➔ [http://localhost:4002/docs](http://localhost:4002/docs)
* **Microservicio Actualización:** `npm run service:docente:actualizar` ➔ [http://localhost:4003/docs](http://localhost:4003/docs)
* **Microservicio Eliminación:** `npm run service:docente:eliminar` ➔ [http://localhost:4004/docs](http://localhost:4004/docs)
* **Todos a la vez:** `npm run services:docentes:all`
