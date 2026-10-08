# Microservicio de Docentes (CRUD Completo + Swagger + Cloud)

Microservicio REST desarrollado en **Node.js agnóstico** (utilizando el módulo nativo `http` sin dependencias de frameworks externos pesados), conectado a una base de datos relacional en la nube (**PostgreSQL en Render o Neon**) y documentado interactivamente con **Swagger UI / OpenAPI 3.0**.

---

## 📋 Características y Requerimientos Cumplidos
1. **CRUD Completo sobre Docentes:**
   - ➕ **Create (`POST /api/profesores`):** Inserta un nuevo docente (`nombre`, `imagen`, `formacion`).
   - 🔍 **Read (`GET /api/profesores`):** Consulta todos los docentes o filtra por nombre (`?nombre=...`).
   - 🔍 **Read By ID (`GET /api/profesores/:id`):** Consulta un docente específico por ID numérico.
   - ✏️ **Update (`PUT /api/profesores/:id`):** Modifica los datos de un docente existente.
   - 🗑️ **Delete (`DELETE /api/profesores/:id`):** Elimina un docente de la base de datos.
2. **Documentación Swagger / OpenAPI interactiva:**
   - Interfaz web interactiva en `/docs` con botón *Try it out* para probar las peticiones directamente desde el navegador.
   - Especificación JSON en `/swagger.json`.
3. **Persistencia dual y resiliente:**
   - Si se define `DATABASE_URL`, se conecta a PostgreSQL en la nube (Render / Neon) y crea automáticamente la tabla `profesor` con auto-semillero.
   - Si no se define `DATABASE_URL` (desarrollo local offline), utiliza un almacén en memoria con docentes precargados para permitir pruebas inmediatas sin errores de arranque.
4. **CORS universal habilitado:**
   - Soporte total para peticiones web y móviles (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`).

---

## 📡 Tabla de Endpoints del Microservicio

| Método | Endpoint | Descripción | Body / Parámetros | Código de Respuesta |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/docs` | Interfaz interactiva de Swagger UI | Ninguno | `200 OK (HTML)` |
| `GET` | `/swagger.json` | Esquema OpenAPI 3.0 | Ninguno | `200 OK (JSON)` |
| `GET` | `/api/health` | Estado del microservicio y de la BD | Ninguno | `200 OK` |
| `GET` | `/api/profesores` | Listar docentes (con filtro opcional) | Query param opcional `?nombre=Ana` | `200 OK` |
| `GET` | `/api/profesores/:id` | Consultar un docente por ID | Path param `:id` | `200 OK` / `404 Not Found` |
| `POST` | `/api/profesores` | Insertar un nuevo docente | JSON `{ nombre, imagen, formacion }` | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/profesores/:id` | Actualizar un docente | Path param `:id` + JSON `{ nombre, imagen, formacion }` | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/profesores/:id` | Eliminar un docente | Path param `:id` | `200 OK` / `404 Not Found` |

---

## 💻 Ejecución Local

1. Navegar a la carpeta del microservicio:
   ```bash
   cd services/profesor-service-node
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar el servidor:
   ```bash
   npm start
   ```
4. Abrir en el navegador:
   - Swagger UI: [http://localhost:4000/docs](http://localhost:4000/docs)
   - Endpoint de Docentes: [http://localhost:4000/api/profesores](http://localhost:4000/api/profesores)

---

## ☁️ Guía Paso a Paso para Despliegue en la Nube (Render + PostgreSQL)

### Paso 1: Crear la Base de Datos PostgreSQL
1. Ingresa a [Render.com](https://dashboard.render.com/) o [Neon.tech](https://neon.tech/).
2. Crea una nueva base de datos PostgreSQL gratuita (ej: `docentes-db`).
3. Copia la cadena de conexión externa (`External Database URL`), cuyo formato es:
   `postgresql://usuario:contraseña@servidor.render.com/nombre_db`

### Paso 2: Desplegar el Microservicio en Render
1. En el Dashboard de Render, pulsa **New +** y selecciona **Web Service**.
2. Conecta el repositorio de GitHub donde está este proyecto (`pokeApi`).
3. Configura los parámetros de despliegue:
   - **Name:** `profesor-service-node` (o `docente-service-uninpahu`)
   - **Root Directory:** `services/profesor-service-node`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. En la sección **Environment Variables**, añade:
   - `DATABASE_URL` = *(Pega aquí la URL copiada en el Paso 1)*
   - `PORT` = `10000` *(o el puerto asignado por Render)*
5. Pulsa **Create Web Service**.

### Paso 3: Conectar la Aplicación Móvil
Una vez desplegado, Render te proporcionará una URL pública (ejemplo: `https://profesor-service-node.onrender.com`).
Pega esta URL en el archivo de configuración de la app:
[src/constants/apiConfig.ts](file:///c:/Users/Angel/Downloads/pokeApi/src/constants/apiConfig.ts):

```typescript
export const PROFESOR_CLOUD_URL: string = 'https://profesor-service-node.onrender.com';
```
