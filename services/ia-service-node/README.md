# 🤖 Microservicio de Inteligencia Artificial (Google AI Studio / Gemini)

Este microservicio actúa como intermediario (**Backend**) entre la aplicación móvil **Expo (PokeAnime)** y la API pública de **Google AI Studio (Gemini)**, tal como se especifica en el diagrama de arquitectura del proyecto.

---

## 🎯 Cumplimiento de los Requerimientos

1. **Requerimiento 1 (`mode: "free"` - IA Libre):**
   Se conecta a la API de Google AI Studio (Gemini) y responde cualquier pregunta general que haga el usuario.
2. **Requerimiento 2 (`mode: "restricted"` - Limitado a Base de Datos Propia 10/10):**
   Configura el `system_instruction` del modelo desde el microservicio inyectando en tiempo real los **10 Pokémon** almacenados en **PostgreSQL (Neon Database)** y los **10 personajes del anime Death Note** almacenados en **Firebase Cloud Firestore**. Si el usuario pregunta por cualquier otro Pokémon (ej. Pikachu), otro anime (ej. Naruto) o cualquier otro tema que no esté en esos 20 registros propios, el modelo rechaza amablemente la pregunta indicando que solo puede responder con la información de la base de datos propia.

---

## 🔑 Paso 1: Obtener tu API Key gratuita en Google AI Studio

1. Ingresa a **[Google AI Studio](https://aistudio.google.com/)**.
2. Inicia sesión con tu cuenta de Google.
3. En el menú lateral izquierdo, haz clic en **"Get API key"** (Obtener clave de API).
4. Haz clic en el botón **"Create API key"** (Crear clave de API).
5. Copia la clave generada (comienza con `AIzaSy...`).

---

## ☁️ Paso 2: Desplegar este Microservicio en Render

1. Sube tus cambios a tu repositorio de **GitHub**.
2. Entra a tu **[Dashboard de Render](https://dashboard.render.com/)**.
3. Haz clic en **New +** ➔ **Web Service** y selecciona tu repositorio.
4. Configura el servicio con estos datos exactos:
   * **Name:** `ia-service-node`
   * **Root Directory:** `services/ia-service-node`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
   * **Instance Type:** `Free`
5. En la sección **Environment Variables** (Variables de entorno) de Render, agrega:
   * `GEMINI_API_KEY` = *(Pega aquí tu clave `AIzaSy...` de Google AI Studio)*
   * `POKEMON_SERVICE_URL` = `https://pokeapi-cmsz.onrender.com`
   * `ANIME_SERVICE_URL` = `https://anime-service-python.onrender.com`
   * `DATABASE_URL` = *(Opcional: Tu URL de conexión de Neon PostgreSQL)*
6. Haz clic en **Deploy Web Service**.
7. Cuando termine de desplegar, copia la URL que te da Render (por ejemplo: `https://ia-service-node.onrender.com`) y verifica que esté colocada en `src/constants/apiConfig.ts` en la constante `IA_CLOUD_URL`.

---

## 💻 Ejecución en Local

Desde la raíz del proyecto puedes ejecutar:

```bash
npm run service:ia
```

* **Endpoint de consulta (GET):** `http://localhost:4005/api/ia/ask?question=Quien+es+L+Lawliet&mode=restricted`
* **Endpoint de consulta (POST):** `http://localhost:4005/api/ia/ask`
* **Documentación interactiva Swagger UI:** `http://localhost:4005/docs`
