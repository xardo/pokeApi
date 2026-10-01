# 📋 Contexto y Estado del Proyecto: Tarea 8 - Escalamiento Pokeanime

Documento de traspaso y continuación para trabajar en cualquier otro equipo.

---

## 🎯 Objetivo de la Tarea
Modificar la aplicación móvil Pokeanime con los siguientes requisitos:
1. **Base de datos relacional en la nube** para almacenar 10 Pokémon.
2. **Microservicio en Node.js** desplegado públicamente (Render) que consuma la BD relacional.
3. **Documentación Swagger** del microservicio de Node.js.
4. **Base de datos no relacional en la nube** para almacenar 10 personajes de anime.
5. **Microservicio en Python** desplegado públicamente (Render o Railway) que consuma la BD no relacional.
6. **Documentación Swagger** del microservicio de Python.
7. **Modificar la app móvil** para consumir ambos microservicios.
8. **Entregables**:
   - Archivo `.zip` del proyecto sin `node_modules`.
   - Documento `.pdf` con capturas de pantalla de los microservicios, bases de datos y documentaciones Swagger.

---

## 🏗️ Arquitectura y Estado de Avance

| Componente | Tecnología | Dónde está alojado | Estado Actual |
| :--- | :--- | :--- | :--- |
| **BD Relacional** | PostgreSQL 18 | **Render** (`poke-postgres-db`) | ✅ **100% Creada y poblada con 10 Pokémon** |
| **Microservicio 1** | Node.js + Express + Swagger | **Render** (`pokemon-service-node`) | ✅ **100% En vivo y funcionando** |
| **BD No Relacional**| Cloud Firestore | **Firebase** (`pokeanime-db`) | ✅ **Proyecto creado y clave privada descargada** |
| **Microservicio 2** | Python + FastAPI + Swagger | **Render** (o Railway) | ⏳ **Código listo en `services/anime-service-python`, pendiente desplegar en Render** |
| **App Móvil** | React Native + Expo | Local (`src/`) | ✅ **Conectada al primer microservicio vía `apiConfig.ts`** |
| **Empaquetado** | PowerShell Script | `npm run zip` | ✅ **Probado y generando `pokeApi_entrega.zip` sin `node_modules`** |

---

## 🔗 URLs y Credenciales Activas

### 1. Microservicio Pokémon (Node.js en Render)
- **URL pública API / Swagger**: `https://pokeapi-1a0b.onrender.com/docs`
- **Endpoint lista 10 Pokémon**: `https://pokeapi-1a0b.onrender.com/api/pokemon`
- **Endpoint Pokémon individual**: `https://pokeapi-1a0b.onrender.com/api/pokemon/1`
- **Cadena de conexión PostgreSQL (Render)**:
  `postgresql://pokeadmin:4pE3DRQSAlCoNoyEhfdEWbpUbGf9s9kb@dpg-dav6qsrtqb8s739eaug0-a.virginia-postgres.render.com/pokedb_ndhf`

### 2. Base de Datos NoSQL (Firebase Firestore)
- **ID de Proyecto Firebase**: `pokeanime-db`
- **Base de datos**: Cloud Firestore (modo de prueba activo).
- **Colección objetivo**: `characters` (el microservicio la crea y siembra 10 personajes automáticamente).
- **Credenciales**: Archivo Service Account JSON descargado desde la pestaña *Cuentas de servicio* en Firebase.

---

## 📂 Estructura del Repositorio

```text
pokeApi/
├── src/
│   ├── app/                      # Pantallas principales (index.tsx, note.tsx, details.tsx)
│   ├── constants/
│   │   ├── apiConfig.ts          # URLs centralizadas de los microservicios en la nube
│   │   └── deathNoteCharacters.json # Datos de referencia de anime
│   └── services/
│       ├── pokeApi.tsx           # Servicio móvil que consume el microservicio de Pokémon
│       └── noteApi.tsx           # Servicio móvil que consume el microservicio de Anime
│
├── services/
│   ├── pokemon-service-node/     # MICROSERVICIO 1 (Node.js + PostgreSQL + Swagger)
│   │   ├── server.js
│   │   ├── swagger.json
│   │   ├── package.json
│   │   └── data/seedPokemons.json (10 pokémon: Bulbasaur a Caterpie)
│   │
│   └── anime-service-python/     # MICROSERVICIO 2 (Python + FastAPI + Firebase + Swagger)
│       ├── main.py
│       ├── requirements.txt
│       ├── Procfile
│       └── data/seedCharacters.json (10 personajes de anime)
│
├── scripts/
│   └── create-submission-zip.ps1 # Script de empaquetado para la entrega
├── package.json
└── README.md
```

---

## 🚀 Pasos Pendientes para Continuar en el Otro Equipo

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/xardo/pokeApi.git
cd pokeApi
npm install
```

### Paso 2: Desplegar el Microservicio de Python en Render
1. Entrar a [Render Dashboard](https://dashboard.render.com/).
2. Crear un nuevo **Web Service** conectado al repo `pokeApi`.
3. Configurar:
   - **Name**: `anime-service-python`
   - **Root Directory**: `services/anime-service-python`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `FIREBASE_CREDENTIALS` = *(Pegar el contenido del archivo JSON de la clave privada de Firebase)*
4. Desplegar. Una vez finalizado, Render dará la URL pública (ej: `https://anime-service-python-xxxx.onrender.com/docs`).

### Paso 3: Configurar la URL en la App Móvil
En [`src/constants/apiConfig.ts`](file:///c:/Users/Angel/Downloads/pokeApi/src/constants/apiConfig.ts):
```typescript
export const POKEMON_CLOUD_URL: string = 'https://pokeapi-1a0b.onrender.com';
export const ANIME_CLOUD_URL: string = 'https://tu-anime-service-en-render.onrender.com';
```

### Paso 4: Probar la App Móvil
```bash
npx expo start
```
Verificar que la pestaña de Pokémon cargue desde Render y la de Anime cargue desde el servicio de Python conectado a Firebase.

### Paso 5: Generar la Entrega
1. **Archivo ZIP**:
   ```bash
   npm run zip
   ```
   Genera `pokeApi_entrega.zip` sin `node_modules`.
2. **Documento PDF**:
   Tomar capturas de:
   - Swagger de Node.js en Render (`https://pokeapi-1a0b.onrender.com/docs`) haciendo Execute.
   - Swagger de Python en Render (`.../docs`) haciendo Execute.
   - Dashboard de Render mostrando PostgreSQL y los servicios activos.
   - Consola de Firebase Firestore mostrando la colección `characters` con los 10 personajes.
   - La aplicación móvil navegando en Pokémon y Anime.
