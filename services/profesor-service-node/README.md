# Microservicio Docentes Uninpahu (Node.js Agnóstico + Neon Database)

Microservicio REST desarrollado en **Node.js puro (código agnóstico sin librerías como Express)** utilizando únicamente el módulo nativo `http`. Conectado a **Neon Database (PostgreSQL en la nube)** y documentado con **Swagger UI**.

## 🚀 Requerimientos Cumplidos
- **Sin Express / Agnóstico:** Construido con `http.createServer` nativo de Node.js.
- **Sin Body Params:** Solo consultas mediante **Path Params** (`/api/profesores/:id`) y **Query Params** (`/api/profesores?nombre=...`).
- **Base de Datos en la nube:** Tabla `profesor` en Neon Database (PostgreSQL).
- **Documentación Swagger:** Swagger UI interactivo servido en `/docs` y especificación OpenAPI 3.0 en `/swagger.json`.
- **Fallback en memoria:** Funciona de inmediato incluso si la base de datos no está configurada aún.

## 📡 Endpoints
- `GET /docs` - Documentación interactiva Swagger UI
- `GET /swagger.json` - Especificación OpenAPI
- `GET /api/health` - Estado de salud y conexión a Neon
- `GET /api/profesores` - Listado de docentes (o filtro `?nombre=...` / `?id=...`)
- `GET /api/profesores/:id` - Detalle y formación completa por Path Param

## 🛠️ Ejecución Local
```bash
cd services/docente-service-node
npm install
npm start
```
Abre en tu navegador: `http://localhost:4000/docs`

## ☁️ Despliegue en Render (Nuevo Servicio)
1. En el [Dashboard de Render](https://dashboard.render.com/), haz clic en **New +** -> **Web Service**.
2. Conecta tu repositorio `pokeApi`.
3. Configura los siguientes campos:
   - **Name:** `docente-service-uninpahu` (o el nombre que desees)
   - **Root Directory:** `services/docente-service-node`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. En la sección **Environment Variables**, añade:
   - `DATABASE_URL`: *(Tu cadena de conexión de Neon Database con formato `postgresql://...`)*
5. Haz clic en **Deploy Web Service**.
6. Copia la URL pública generada por Render (ej. `https://docente-service-uninpahu.onrender.com`) y pégala en `src/constants/apiConfig.ts`:
   ```typescript
   export const DOCENTE_CLOUD_URL: string = 'https://docente-service-uninpahu.onrender.com';
   ```
