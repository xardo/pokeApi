# Microservicio Pokémon (Node.js + PostgreSQL)

Microservicio REST desarrollado en Node.js y Express con base de datos relacional PostgreSQL y documentación interactiva Swagger (OpenAPI 3.0).

## 🚀 Características
- Almacena y gestiona 10 Pokémon en PostgreSQL.
- Auto-creación de tablas y auto-poblado (seeding) de los 10 Pokémon al iniciar.
- Fallback automático en memoria si aún no se ha configurado la base de datos en la nube.
- Documentación Swagger UI en `/docs`.
- Diseñado para despliegue inmediato en **Render** o **Railway**.

## 📡 Endpoints
- `GET /docs` - Documentación interactiva Swagger
- `GET /api/health` - Estado de salud y conexión a PostgreSQL
- `GET /api/pokemon` - Listado de los 10 Pokémon
- `GET /api/pokemon/:nameOrId` - Búsqueda de Pokémon por ID o nombre

## 🛠️ Ejecución Local
```bash
cd services/pokemon-service-node
npm install
npm start
```
Abre en tu navegador: `http://localhost:3000/docs`

## ☁️ Despliegue en Render
1. En el dashboard de Render, crea una base de datos PostgreSQL: **New +** -> **PostgreSQL**.
2. Copia la **Internal Database URL** (o External).
3. Crea un nuevo **Web Service**: **New +** -> **Web Service** y conecta tu repositorio.
4. Configura:
   - **Root Directory**: `services/pokemon-service-node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. En **Environment Variables**, añade:
   - `DATABASE_URL`: *(la URL de PostgreSQL copiada en el paso 2)*
6. Haz clic en **Deploy Web Service**.
