const http = require('http');
const fs = require('fs');
const path = require('path');
try {
  require('dotenv').config();
} catch (e) {}

let Pool = null;
try {
  const pg = require('pg');
  Pool = pg.Pool;
} catch (e) {}

const PORT = process.env.PORT || 4006;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const DATABASE_URL = process.env.DATABASE_URL || '';
const POKEMON_SERVICE_URL = process.env.POKEMON_SERVICE_URL || 'https://pokeapi-cmsz.onrender.com';
const ANIME_SERVICE_URL = process.env.ANIME_SERVICE_URL || 'https://anime-service-python.onrender.com';

const MAX_QUESTIONS_LIMIT = parseInt(process.env.MAX_QUESTIONS_LIMIT || '10', 10);
const usageStore = new Map();

function obtenerInfoLimite(clientId) {
  const ahora = Date.now();
  const unDiaMs = 24 * 60 * 60 * 1000;
  let registro = usageStore.get(clientId);

  if (!registro || ahora - registro.resetTime > unDiaMs) {
    registro = { count: 0, resetTime: ahora };
    usageStore.set(clientId, registro);
  }

  const remaining = Math.max(0, MAX_QUESTIONS_LIMIT - registro.count);
  return {
    limit: MAX_QUESTIONS_LIMIT,
    used: registro.count,
    remaining,
    isExceeded: registro.count >= MAX_QUESTIONS_LIMIT,
  };
}

function registrarPregunta(clientId) {
  const info = obtenerInfoLimite(clientId);
  if (!info.isExceeded) {
    const registro = usageStore.get(clientId);
    registro.count += 1;
    usageStore.set(clientId, registro);
  }
  return obtenerInfoLimite(clientId);
}

const pool =
  DATABASE_URL && Pool
    ? new Pool({
        connectionString: DATABASE_URL,
        ssl: !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1')
          ? { rejectUnauthorized: false }
          : false,
      })
    : null;

// Cargar respaldos locales de los 10 Pokémon y 10 personajes de Death Note
let localPokemons = [];
let localCharacters = [];

try {
  const pokePath = path.join(__dirname, 'seedPokemons.json');
  if (fs.existsSync(pokePath)) {
    localPokemons = JSON.parse(fs.readFileSync(pokePath, 'utf8'));
  }
} catch (err) {
  console.error('[Groq IA Service] Error leyendo seedPokemons.json:', err.message);
}

try {
  const charPath = path.join(__dirname, 'seedCharacters.json');
  if (fs.existsSync(charPath)) {
    localCharacters = JSON.parse(fs.readFileSync(charPath, 'utf8'));
  }
} catch (err) {
  console.error('[Groq IA Service] Error leyendo seedCharacters.json:', err.message);
}

/**
 * Obtiene los 10 Pokémon desde PostgreSQL, microservicio Render o respaldo local
 */
async function obtenerPokemonsDeBaseDeDatos() {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM pokemons ORDER BY id ASC LIMIT 10;');
      if (res.rows && res.rows.length > 0) {
        return { source: 'PostgreSQL / Neon Database', data: res.rows };
      }
    } catch (e) {}
  }

  if (POKEMON_SERVICE_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const url = `${POKEMON_SERVICE_URL.replace(/\/$/, '')}/api/pokemon`;
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) {
          return { source: 'Microservicio Pokémon (PostgreSQL/Render)', data: json.slice(0, 10) };
        }
      }
    } catch (e) {}
  }

  return { source: 'Base de Datos Propia (10 Pokémon)', data: localPokemons };
}

/**
 * Obtiene los 10 personajes de Anime desde microservicio Render o respaldo local
 */
async function obtenerAnimesDeBaseDeDatos() {
  if (ANIME_SERVICE_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const url = `${ANIME_SERVICE_URL.replace(/\/$/, '')}/api/characters`;
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const json = await resp.json();
        const lista = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(lista) && lista.length > 0) {
          return { source: 'Microservicio Anime (Firebase Firestore/Render)', data: lista.slice(0, 10) };
        }
      }
    } catch (e) {}
  }

  return { source: 'Base de Datos Propia (10 Personajes Death Note - Firebase)', data: localCharacters };
}

function construirResumenBaseDeDatos(pokemons, characters) {
  const resumenPokemon = pokemons.map((p) => {
    const movesList = (p.moves || [])
      .map((m) => (typeof m === 'string' ? m : m?.move?.name))
      .filter(Boolean)
      .join(', ');
    return `- ID #${p.id}: ${p.name.toUpperCase()} | Altura: ${p.height} (decímetros) | Peso: ${p.weight} (hectogramos) | Movimientos registrados: ${movesList}`;
  });

  const resumenAnime = characters.map((item, idx) => {
    const char = item.character || {};
    const voces = (item.voice_actors || [])
      .map((va) => `${va.person?.name} (${va.language})`)
      .join('; ');
    return `- Posición #${idx + 1} (MAL ID #${char.mal_id}): ${char.name} | Rol en Death Note: ${item.role} | Favoritos: ${item.favorites} | Actores de voz: ${voces || 'Sin registro'}`;
  });

  return {
    pokemonsSummary: resumenPokemon.join('\n'),
    animesSummary: resumenAnime.join('\n'),
    pokemonsNames: pokemons.map((p) => p.name),
    charactersNames: characters.map((c) => c.character?.name),
  };
}

function construirPrompt(question, mode, contextoTexto) {
  if (mode === 'free') {
    return {
      systemInstruction:
        'Eres un asistente de consulta para la aplicación PokeAnime potenciado por Groq Cloud. En este modo puedes responder cualquier pregunta sobre Pokémon, anime, videojuegos, ciencia o cultura general en español de forma concisa y directa.',
      userPrompt: question,
    };
  }

  const pokemonsListado = contextoTexto.pokemonsNames.join(', ');
  const charactersListado = contextoTexto.charactersNames.join(', ');

  const systemInstruction = `Eres el asistente de la aplicación PokeAnime (Motor Groq LPU).
Tu objetivo es responder consultas asociadas a los Pokémon y personajes de anime de la base de datos propia de la aplicación.

ENTIDADES DE LA BASE DE DATOS:
- POKEMON REGISTRADOS: [ ${pokemonsListado} ]
- PERSONAJES DE ANIME REGISTRADOS (Death Note): [ ${charactersListado} ]
- SERIE: Death Note.

DATOS DISPONIBLES EN LA BASE DE DATOS:
POKEMON:
${contextoTexto.pokemonsSummary}

PERSONAJES DE DEATH NOTE:
${contextoTexto.animesSummary}

REGLAS DE RESPUESTA:
1. Si la pregunta es sobre alguno de los Pokémon o personajes registrados (o sobre Death Note):
   - Responde la consulta.
   - Si la información solicitada no se encuentra textualmente en la base de datos (por ejemplo apariciones en el anime, episodios, forma shiny, lore o curiosidades), complementa con conocimiento general de la serie.
   - Menciona los datos de la aplicación cuando sea relevante (peso, altura, movimientos, actores de voz).

2. Si la pregunta es sobre un Pokémon que NO está en la lista (como Pikachu, Mewtwo, etc.) o sobre otro anime diferente (como Naruto, Goku, One Piece, etc.) o temas no relacionados:
   - Indica brevemente que la consulta no pertenece a los registros de la aplicación.
   - Lista los nombres que sí se encuentran disponibles (${pokemonsListado}) y los de Death Note.

3. Responde en español, de manera clara, directa y formal, sin usar emoticonos ni saludos exagerados.`;

  return {
    systemInstruction,
    userPrompt: `Pregunta: ${question}`,
  };
}

/**
 * Consulta a la API de Groq Cloud
 */
async function consultarGroq(question, mode, contextoTexto, customApiKey, requestedModel) {
  const apiKey = (customApiKey || GROQ_API_KEY || '').trim();

  if (!apiKey || apiKey === 'gsk_TU_API_KEY_DE_GROQ_AQUI') {
    throw new Error(
      'No se ha configurado GROQ_API_KEY en el microservicio. Configúrala en Render o en el archivo .env.'
    );
  }

  const { systemInstruction, userPrompt } = construirPrompt(question, mode, contextoTexto);
  const targetModel =
    requestedModel === 'groq-small' || requestedModel === 'llama-8b'
      ? 'llama-3.1-8b-instant'
      : GROQ_MODEL || 'llama-3.3-70b-versatile';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature: mode === 'restricted' ? 0.2 : 0.7,
      max_tokens: 800,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Error HTTP ${response.status} en Groq Cloud`);
  }

  const answer = data?.choices?.[0]?.message?.content || 'No se obtuvo respuesta de Groq.';
  return {
    answer: answer.trim(),
    model: targetModel,
    provider: targetModel.includes('8b') ? 'Groq (Llama 3.1 8B)' : 'Groq (Llama 3.3 70B)',
  };
}

function responderJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Groq-Api-Key, X-Api-Key',
  });
  res.end(JSON.stringify(data));
}

function leerBodyJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body || body.trim() === '') return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('El cuerpo de la petición no es un JSON válido.'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Groq-Api-Key, X-Api-Key',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Ruta raíz informativa
  if (pathname === '/' && req.method === 'GET') {
    return responderJSON(res, 200, {
      microservicio: 'PokeAnime IA - Microservicio Independiente Groq Cloud (Llama 3.3 / Llama 3.1)',
      puerto: PORT,
      swagger: '/docs',
      apiKeyConfigurada: Boolean(GROQ_API_KEY && GROQ_API_KEY !== 'gsk_TU_API_KEY_DE_GROQ_AQUI'),
      modeloPorDefecto: GROQ_MODEL,
      endpoints: {
        preguntar_get: 'GET /api/ia/ask?question=TuPregunta&mode=restricted|free&provider=groq|llama-8b',
        preguntar_post: 'POST /api/ia/ask { "question": "...", "mode": "restricted" | "free", "provider": "groq" }',
        contexto_bd: 'GET /api/ia/context',
        salud: 'GET /api/health',
      },
    });
  }

  // Swagger UI
  if ((pathname === '/docs' || pathname === '/docs/') && req.method === 'GET') {
    const htmlPath = path.join(__dirname, 'swagger.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(htmlPath, 'utf8'));
  }

  if (pathname === '/swagger.json' && req.method === 'GET') {
    const jsonPath = path.join(__dirname, 'swagger.json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(jsonPath, 'utf8'));
  }

  // Health Check
  if (pathname === '/api/health' && req.method === 'GET') {
    const pokeInfo = await obtenerPokemonsDeBaseDeDatos();
    const animeInfo = await obtenerAnimesDeBaseDeDatos();
    return responderJSON(res, 200, {
      status: 'ok',
      microservicio: 'Microservicio IA Independiente (Groq Cloud)',
      apiKeyConfigured: Boolean(GROQ_API_KEY && GROQ_API_KEY !== 'gsk_TU_API_KEY_DE_GROQ_AQUI'),
      model: GROQ_MODEL,
      databases: {
        pokemon: { source: pokeInfo.source, count: pokeInfo.data.length },
        anime: { source: animeInfo.source, count: animeInfo.data.length },
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Límites
  if (pathname === '/api/ia/limit' && req.method === 'GET') {
    const clientId = req.headers['x-client-id'] || req.socket.remoteAddress || 'default-user';
    const limitInfo = obtenerInfoLimite(clientId);
    return responderJSON(res, 200, limitInfo);
  }

  // Contexto BD
  if (pathname === '/api/ia/context' && req.method === 'GET') {
    const pokeInfo = await obtenerPokemonsDeBaseDeDatos();
    const animeInfo = await obtenerAnimesDeBaseDeDatos();
    const resumen = construirResumenBaseDeDatos(pokeInfo.data, animeInfo.data);

    return responderJSON(res, 200, {
      descripcion: 'Datos exclusivos de la base de datos propia usados para limitar las respuestas de Groq',
      pokemonSource: pokeInfo.source,
      animeSource: animeInfo.source,
      totalPokemons: pokeInfo.data.length,
      totalCharacters: animeInfo.data.length,
      pokemons: resumen.pokemonsNames,
      characters: resumen.charactersNames,
      formattedContext: {
        pokemon: resumen.pokemonsSummary,
        anime: resumen.animesSummary,
      },
    });
  }

  // Endpoint de Consulta (/api/ia/ask o /api/ia)
  if ((pathname === '/api/ia/ask' || pathname === '/api/ia') && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const clientId = req.headers['x-client-id'] || req.socket.remoteAddress || 'default-user';

      let question = '';
      let mode = 'restricted';
      let provider = 'groq';
      let delaySimuladoMs = 0;
      let customApiKey = req.headers['x-groq-api-key'] || req.headers['x-api-key'] || '';

      if (req.method === 'GET') {
        question = url.searchParams.get('question') || url.searchParams.get('q') || '';
        mode = url.searchParams.get('mode') || 'restricted';
        provider = url.searchParams.get('provider') || 'groq';
        delaySimuladoMs = parseInt(url.searchParams.get('delay') || '0', 10);
        if (url.searchParams.get('apiKey')) {
          customApiKey = url.searchParams.get('apiKey');
        }
      } else {
        const body = await leerBodyJSON(req);
        question = body.question || body.q || body.prompt || '';
        mode = body.mode || 'restricted';
        provider = body.provider || 'groq';
        delaySimuladoMs = parseInt(body.delay || '0', 10);
        if (body.apiKey) {
          customApiKey = body.apiKey;
        }
      }

      // Simulación de demora para probar tiempos de espera
      if (delaySimuladoMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(delaySimuladoMs, 180000)));
      }

      if (!question || String(question).trim() === '') {
        return responderJSON(res, 400, {
          error: 'Debes enviar una pregunta en el parámetro "question".',
        });
      }

      const cleanMode = mode === 'free' ? 'free' : 'restricted';

      let limitInfo = obtenerInfoLimite(clientId);
      if (cleanMode === 'restricted' && limitInfo.isExceeded) {
        return responderJSON(res, 429, {
          error: `Has alcanzado el límite máximo de ${limitInfo.limit} preguntas permitidas para consultas de la base de datos. Puedes seguir haciendo consultas en el modo General.`,
          limitInfo,
        });
      }

      const [pokeInfo, animeInfo] = await Promise.all([
        obtenerPokemonsDeBaseDeDatos(),
        obtenerAnimesDeBaseDeDatos(),
      ]);

      const contextoTexto = construirResumenBaseDeDatos(pokeInfo.data, animeInfo.data);

      const resultadoIA = await consultarGroq(
        String(question).trim(),
        cleanMode,
        contextoTexto,
        customApiKey,
        provider
      );

      let updatedLimit = limitInfo;
      if (cleanMode === 'restricted') {
        updatedLimit = registrarPregunta(clientId);
      }

      return responderJSON(res, 200, {
        question: String(question).trim(),
        mode: cleanMode,
        modeDescription:
          cleanMode === 'restricted'
            ? 'Limitado a Base de Datos Propia (10 Pokémon + 10 Personajes Death Note)'
            : 'Modo Libre (Cualquier pregunta)',
        provider: resultadoIA.provider,
        model: resultadoIA.model,
        answer: resultadoIA.answer,
        limitInfo: updatedLimit,
        sources: {
          pokemon: pokeInfo.source,
          anime: animeInfo.source,
          allowedPokemons: contextoTexto.pokemonsNames,
          allowedCharacters: contextoTexto.charactersNames,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Groq IA Service] Error al procesar pregunta:', err.message);
      return responderJSON(res, 500, {
        error: err.message || 'Error interno al consultar Groq Cloud.',
      });
    }
  }

  return responderJSON(res, 404, {
    error: 'Ruta no encontrada en el microservicio de Groq IA. Visita /docs para ver Swagger UI.',
  });
});

server.listen(PORT, () => {
  console.log('=====================================================');
  console.log(' Microservicio IA Separado: Groq Cloud (Llama 3.3)');
  console.log(` Escuchando en: http://localhost:${PORT}`);
  console.log(` Documentación Swagger: http://localhost:${PORT}/docs`);
  console.log('=====================================================');
});
