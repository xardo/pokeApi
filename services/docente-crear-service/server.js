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
} catch (e) {
  console.log('ℹ️ Modo memoria local activo en microservicio de creación.');
}

const PORT = process.env.PORT || 4002;
const DATABASE_URL = process.env.DATABASE_URL;

let nextMemoryId = 100;

const pool = (DATABASE_URL && Pool)
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: !DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
    })
  : null;

async function initDB() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS profesor (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        imagen TEXT NOT NULL,
        formacion TEXT NOT NULL
      );
    `);
    client.release();
    console.log('✅ Microservicio de CREACIÓN conectado a PostgreSQL/Neon');
  } catch (err) {
    console.error('❌ Error DB Creación:', err.message);
  }
}

function responderJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body || body.trim() === '') return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON inválido en el cuerpo de la petición.'));
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/' && req.method === 'GET') {
    return responderJSON(res, 200, {
      microservicio: 'Docentes - Microservicio de Creación (CREATE)',
      puerto: PORT,
      swagger: '/docs',
      endpoint_creacion: 'POST /api/profesores',
      salud: 'GET /api/health'
    });
  }

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

  if (pathname === '/api/health' && req.method === 'GET') {
    return responderJSON(res, 200, {
      status: 'ok',
      microservicio: 'Creación de Docentes (CREATE)',
      database: pool ? 'Neon / PostgreSQL Conectado' : 'Memoria local'
    });
  }

  // POST /api/profesores
  if (pathname === '/api/profesores' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { nombre, imagen, formacion } = body;

      if (!nombre || !nombre.trim() || !imagen || !imagen.trim() || !formacion || !formacion.trim()) {
        return responderJSON(res, 400, {
          error: 'Los campos "nombre", "imagen" y "formacion" son obligatorios.'
        });
      }

      if (pool) {
        const resultado = await pool.query(
          'INSERT INTO profesor (nombre, imagen, formacion) VALUES ($1, $2, $3) RETURNING *;',
          [nombre.trim(), imagen.trim(), formacion.trim()]
        );
        return responderJSON(res, 201, resultado.rows[0]);
      } else {
        const nuevo = {
          id: nextMemoryId++,
          nombre: nombre.trim(),
          imagen: imagen.trim(),
          formacion: formacion.trim(),
        };
        return responderJSON(res, 201, nuevo);
      }
    } catch (err) {
      return responderJSON(res, 500, { error: err.message });
    }
  }

  return responderJSON(res, 404, { error: 'Ruta no encontrada en microservicio de creación.' });
});

server.listen(PORT, async () => {
  console.log(`➕ [Microservicio Crear Docente] Activo en http://localhost:${PORT}`);
  console.log(`📖 Swagger UI en http://localhost:${PORT}/docs`);
  await initDB();
});
