# Microservicio Anime (Python + FastAPI + Firebase Firestore / MongoDB)

Microservicio REST desarrollado en Python con FastAPI y base de datos no relacional en la nube (**Firebase Cloud Firestore** o **MongoDB**), documentado automáticamente con Swagger / OpenAPI.

## 🚀 Características
- Almacena y gestiona personajes de anime en una base de datos no relacional (**Firebase Firestore** o MongoDB).
- Sincronización (seeding) de personajes al iniciar la aplicación o mediante script.
- Fallback automático en memoria si aún no se configuran las credenciales.
- Documentación Swagger interactiva en `/docs` y ReDoc en `/redoc`.
- Diseñado para despliegue en **Railway** o **Render**.

## 📡 Endpoints
- `GET /docs` - Documentación interactiva Swagger UI
- `GET /redoc` - Documentación ReDoc
- `GET /api/health` - Estado de salud y base de datos no relacional conectada
- `GET /api/characters` - Lista de todos los personajes de anime
- `GET /api/characters/{query}` - Búsqueda por posición numérica, mal_id o nombre

## 🔥 Configuración con Firebase Firestore
1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto.
2. Crea una base de datos en **Firestore Database** (Modo de prueba o con reglas de lectura/escritura).
3. Ve a **Project Settings** (el engranaje) -> pestaña **Service Accounts**.
4. Haz clic en **Generate new private key** (descargará un archivo `.json`).
5. Para desarrollo local: renombra el archivo a `firebase-key.json` y colócalo en esta carpeta (`services/anime-service-python/`).
6. Para producción en Railway / Render: copia el contenido del archivo JSON y pégalo en la variable de entorno `FIREBASE_CREDENTIALS`.
