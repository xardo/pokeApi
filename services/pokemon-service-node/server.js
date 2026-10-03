const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

app.use(cors());
app.use(express.json());

// Load seed data fallback
const seedDataPath = path.join(__dirname, 'data', 'seedPokemons.json');
const seedPokemons = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

let pool = null;
let useDatabase = false;

if (DATABASE_URL) {
  const isCloud = !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  });
}

async function initDatabase() {
  if (!pool) {
    console.log('[PostgreSQL] DATABASE_URL no configurada. Usando datos locales en memoria.');
    return;
  }

  try {
    const client = await pool.connect();
    console.log('[PostgreSQL] Conectado exitosamente a la base de datos.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pokemons (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        height INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        sprites JSONB NOT NULL,
        moves JSONB NOT NULL
      );
    `);

    let nuevos = 0;
    for (const p of seedPokemons) {
      const res = await client.query(
        `INSERT INTO pokemons (id, name, height, weight, sprites, moves)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           height = EXCLUDED.height,
           weight = EXCLUDED.weight,
           sprites = EXCLUDED.sprites,
           moves = EXCLUDED.moves
         RETURNING (xmax = 0) AS fue_insertado;`,
        [p.id, p.name.toLowerCase().trim(), p.height, p.weight, JSON.stringify(p.sprites), JSON.stringify(p.moves)]
      );
      if (res.rows[0]?.fue_insertado) nuevos++;
    }

    const countRes = await client.query('SELECT COUNT(*) FROM pokemons;');
    const count = parseInt(countRes.rows[0].count, 10);
    console.log(`[PostgreSQL] Base de datos sincronizada: ${count} Pokémon en total (${nuevos} nuevos insertados).`);

    client.release();
    useDatabase = true;
  } catch (err) {
    console.error('[PostgreSQL] Error conectando a la base de datos:', err.message);
    console.log('[PostgreSQL] Se utilizará fallback en memoria temporalmente.');
    useDatabase = false;
  }
}

// Swagger UI Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: useDatabase ? 'connected (postgresql)' : 'memory fallback',
    timestamp: new Date().toISOString(),
  });
});

// List all pokemons
app.get('/api/pokemon', async (req, res) => {
  try {
    if (useDatabase && pool) {
      const result = await pool.query('SELECT * FROM pokemons ORDER BY id ASC;');
      return res.json(result.rows);
    }
    return res.json(seedPokemons);
  } catch (err) {
    console.error('Error al listar Pokémon:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single pokemon by ID or Name
app.get('/api/pokemon/:nameOrId', async (req, res) => {
  const query = req.params.nameOrId.toLowerCase().trim();
  const numId = parseInt(query, 10);

  try {
    if (useDatabase && pool) {
      let result;
      if (!isNaN(numId)) {
        result = await pool.query('SELECT * FROM pokemons WHERE id = $1;', [numId]);
      } else {
        result = await pool.query('SELECT * FROM pokemons WHERE LOWER(name) = $1;', [query]);
      }

      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
      return res.status(404).json({ error: 'Pokémon no encontrado en la base de datos' });
    }

    // Memory fallback
    let found = null;
    if (!isNaN(numId)) {
      found = seedPokemons.find((p) => p.id === numId);
    } else {
      found = seedPokemons.find((p) => p.name.toLowerCase() === query);
    }

    if (found) {
      return res.json(found);
    }
    return res.status(404).json({ error: 'Pokémon no encontrado en la base de datos' });
  } catch (err) {
    console.error('Error al buscar Pokémon:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada. Visita /docs para ver la documentación Swagger.' });
});

app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(` Microservicio Pokémon (Node.js + PostgreSQL)`);
  console.log(` Escuchando en el puerto: ${PORT}`);
  console.log(` Documentación Swagger: http://localhost:${PORT}/docs`);
  console.log(`===============================================`);
  await initDatabase();
});
