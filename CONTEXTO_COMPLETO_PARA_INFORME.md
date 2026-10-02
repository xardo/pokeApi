# 📄 MEMORIA TÉCNICA Y CONTEXTO COMPLETO DEL PROYECTO: ESCALAMIENTO POKEANIME

Este documento contiene todo el contexto, arquitectura, tecnologías, bases de datos, microservicios, seeders, endpoints y configuración del proyecto. Puedes copiar y pegar este texto directamente a cualquier IA o utilizarlo como base para redactar el informe técnico / PDF de entrega.

---

## 1. 🎯 OBJETIVO GENERAL Y REQUERIMIENTOS

El objetivo del proyecto es transformar una aplicación móvil construida en **React Native / Expo** (Pokeanime) que antes consumía APIs públicas externas directamente (PokeAPI y Jikan API), para que ahora funcione bajo una arquitectura orientada a **microservicios propios desplegados en la nube** conectados a sus **propias bases de datos gestionadas**:

1. **Base de Datos Relacional en la Nube:**
   - Debe almacenar **10 Pokémon** iniciales (Bulbasaur a Caterpie) con sus características físicas, imágenes y movimientos.
2. **Microservicio 1 (Node.js):**
   - Construido con Express.
   - Desplegado públicamente en la nube (**Render**).
   - Conectado a la base de datos relacional PostgreSQL.
   - Documentado con **Swagger / OpenAPI** en español.
3. **Base de Datos No Relacional en la Nube:**
   - Debe almacenar **10 personajes de Anime** (franquicia Death Note) con roles, votos, fotos y actores de voz.
   - Implementada en **Firebase Cloud Firestore**.
4. **Microservicio 2 (Python):**
   - Construido con **FastAPI**.
   - Desplegado públicamente en la nube (**Render**).
   - Conectado a la base de datos no relacional Firebase Cloud Firestore.
   - Documentado con **Swagger / OpenAPI** interactivo en español.
5. **Aplicación Móvil (Frontend):**
   - Construida en React Native con Expo Router.
   - Modificada para consumir **única y exclusivamente los dos microservicios en la nube**, eliminando llamadas y fallbacks a APIs externas.

---

## 2. 🏗️ ARQUITECTURA GENERAL DEL SISTEMA

```text
                               +--------------------------------------------+
                               |     APLICACIÓN MÓVIL (React Native / Expo) |
                               |   (Pestaña Pokémon  |  Pestaña Death Note) |
                               +---------------------+----------------------+
                                                     |
                         +---------------------------+---------------------------+
                         | HTTP GET                                              | HTTP GET
                         v                                                       v
        +-----------------------------------+                   +-----------------------------------+
        |       MICROSERVICIO POKÉMON       |                   |        MICROSERVICIO ANIME        |
        |      (Node.js + Express.js)       |                   |         (Python + FastAPI)        |
        |   Desplegado en Render (Cloud)    |                   |   Desplegado en Render (Cloud)    |
        |   Swagger en /docs                |                   |   Swagger en /docs                |
        +-----------------+-----------------+                   +-----------------+-----------------+
                          | SQL Query                                             | Google Firestore SDK
                          v                                                       v
        +-----------------------------------+                   +-----------------------------------+
        |       BASE DE DATOS RELACIONAL    |                   |     BASE DE DATOS NO RELACIONAL   |
        |       PostgreSQL en la Nube       |                   |      Cloud Firestore (Firebase)   |
        |          (Render / Neon)          |                   |       Proyecto: pokeanime-db      |
        |         Tabla: `pokemons`         |                   |      Colección: `characters`      |
        |           (10 Registros)          |                   |           (10 Documentos)         |
        +-----------------------------------+                   +-----------------------------------+
```

---

## 3. 💾 BASES DE DATOS Y MECANISMO DE SEEDERS

### A. Base de Datos Relacional (PostgreSQL)
* **Motor:** PostgreSQL (compatible tanto con Render PostgreSQL como con Neon Database Serverless).
* **Esquema de la tabla (`pokemons`):**
  ```sql
  CREATE TABLE pokemons (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    height INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    sprites JSONB NOT NULL,
    moves JSONB NOT NULL
  );
  ```
* **Mecanismo del Seeder:**
  1. **Seeder Automático en Servidor:** Al iniciar el servidor en `services/pokemon-service-node/server.js`, la función `initDatabase()` ejecuta un `SELECT COUNT(*) FROM pokemons;`. Si la tabla está vacía, lee el archivo `data/seedPokemons.json` y realiza inserciones parametrizadas con `ON CONFLICT (id) DO NOTHING` para garantizar exactamente los 10 registros.
  2. **Script SQL Directo (`scripts/seed_neon.sql`):** Generado para sembrar manualmente en Neon Database o cualquier cliente SQL mediante inserciones masivas con tipos nativos `JSONB`.
* **Datos guardados (10 Pokémon):**
  1. Bulbasaur (ID 1)
  2. Ivysaur (ID 2)
  3. Venusaur (ID 3)
  4. Charmander (ID 4)
  5. Charmeleon (ID 5)
  6. Charizard (ID 6)
  7. Squirtle (ID 7)
  8. Wartortle (ID 8)
  9. Blastoise (ID 9)
  10. Caterpie (ID 10)

### B. Base de Datos No Relacional (Firebase Cloud Firestore)
* **Motor:** Google Cloud Firestore (modo NoSQL documental).
* **Proyecto Firebase:** `pokeanime-db`.
* **Colección objetivo:** `characters`.
* **Estructura de cada Documento:**
  - `character`: Objeto con `mal_id`, `name`, `url` y URLs de `images` (`jpg` y `webp`).
  - `role`: Rol en la serie (`Main` o `Supporting`).
  - `favorites`: Número entero de votos favoritos.
  - `voice_actors`: Arreglo de actores de doblaje con nombre, idioma y foto.
* **Mecanismo del Seeder (`services/anime-service-python/seed_firebase.py`):**
  - Utiliza el SDK oficial `firebase-admin` con autenticación por clave de servicio (`Service Account`).
  - Lee el archivo `data/seedCharacters.json` y usa operaciones `set()` sobre la colección `characters` usando el `mal_id` de cada personaje como ID del documento en Firestore.
* **Datos guardados (10 Personajes de Death Note):**
  1. Lawliet, L (ID 71)
  2. Ryuk (ID 75)
  3. Yagami, Light (ID 80)
  4. Amane, Misa (ID 835)
  5. Aizawa, Shuuichi (ID 3767)
  6. Bullook, Halle (ID 3769)
  7. Aizawa, Yumi (ID 84527)
  8. Aizawa, Eriko (ID 84531)
  9. Block, Kyle (ID 182770)
  10. Armonia Justin Beyondormason (ID 207498)

---

## 4. 🌐 MICROSERVICIOS Y DOCUMENTACIÓN SWAGGER

### Microservicio 1: Pokémon (Node.js + Express)
* **Tecnología:** Node.js v20+, Express.js, librería `pg` (PostgreSQL client pool), `swagger-ui-express`.
* **Ubicación en el repo:** `services/pokemon-service-node/`.
* **URL Pública en Render:** `https://pokeapi-cmsz.onrender.com`
* **Swagger UI:** `https://pokeapi-cmsz.onrender.com/docs`
* **Endpoints:**
  - `GET /docs` ➔ Interfaz interactiva de Swagger UI documentada en español.
  - `GET /api/pokemon` ➔ Retorna el arreglo JSON con los 10 Pokémon desde PostgreSQL.
  - `GET /api/pokemon/{nameOrId}` ➔ Busca un Pokémon por ID (1-10) o nombre (ej. `bulbasaur`).
  - `GET /api/health` ➔ Comprobación de estado y confirmación de conexión a PostgreSQL.

### Microservicio 2: Anime (Python + FastAPI)
* **Tecnología:** Python 3.11+, FastAPI, Uvicorn, `firebase-admin`, `pydantic`.
* **Ubicación en el repo:** `services/anime-service-python/`.
* **URL Pública en Render:** `https://anime-service-python.onrender.com`
* **Swagger UI:** `https://anime-service-python.onrender.com/docs`
* **Endpoints:**
  - `GET /docs` ➔ Interfaz interactiva OpenAPI / Swagger nativa de FastAPI en español.
  - `GET /api/characters` ➔ Retorna los 10 personajes desde Firestore.
  - `GET /api/characters/{query}` ➔ Busca por posición (1-10), por ID o por nombre.
  - `GET /api/health` ➔ Comprobación de disponibilidad y base de datos activa (`firebase firestore`).

---

## 5. 📱 APLICACIÓN MÓVIL (REACT NATIVE / EXPO)

* **Estructura del frontend:**
  - `src/constants/apiConfig.ts`: Centraliza las URLs de los dos microservicios en la nube (`POKEMON_CLOUD_URL` y `ANIME_CLOUD_URL`).
  - `src/services/pokeApi.tsx`: Consume únicamente el microservicio de Node.js mediante `fetch`. No tiene fallbacks a PokeAPI.
  - `src/services/noteApi.tsx`: Consume el microservicio de Python mediante `fetch`. No depende de archivos locales de respaldo.
  - `src/app/index.tsx`: Pantalla principal del buscador y navegador de Pokémon (restringido exactamente a los IDs 1 a 10 almacenados en BD).
  - `src/app/details.tsx`: Ficha técnica de características y movimientos del Pokémon seleccionado.
  - `src/app/note.tsx`: Pantalla de consulta de personajes de Death Note con paginación de los 10 registros.
  - `src/app/note-details.tsx`: Detalle ampliado del personaje, actores de doblaje y rol.

---

## 6. ☁️ CÓMO FUNCIONA RENDER Y ASPECTOS TÉCNICOS DESTACADOS

* **Alojamiento PaaS (Platform as a Service):** Render toma el repositorio de GitHub, detecta el directorio raíz de cada microservicio (`Root Directory`), instala dependencias (`npm install` o `pip install`) y ejecuta el proceso en contenedores administrados.
* **Cold Starts (Suspensión por inactividad):** En el tier gratuito de Render, tras 15 minutos sin tráfico entrante, las instancias entran en modo suspensión para ahorrar recursos. Al recibir una petición nueva, tardan entre 40 y 50 segundos en reactivarse. La app móvil implementa timeouts controlados (6 segundos) para evitar bloqueos del hilo principal.
* **Seguridad y Variables de Entorno:**
  - Las credenciales sensibles no se guardaron en el código del repositorio (`.gitignore` protege archivos `.env` y llaves `.json`).
  - En Render se configuraron como variables de entorno seguras:
    - `DATABASE_URL` para la cadena de conexión de PostgreSQL.
    - `FIREBASE_CREDENTIALS` con el JSON de la cuenta de servicio para Firestore.
