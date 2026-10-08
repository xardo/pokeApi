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
  console.log('ℹ️ Modo memoria local activo en microservicio de eliminación.');
}

const PORT = process.env.PORT || 4004;
const DATABASE_URL = process.env.DATABASE_URL;

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
    console.log('✅ Microservicio de ELIMINACIÓN conectado a PostgreSQL/Neon');
  } catch (err) {
    console.error('❌ Error DB Eliminación:', err.message);
  }
}

function responderJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/' && req.method === 'GET') {
    return responderJSON(res, 200, {
      microservicio: 'Docentes - Microservicio de Eliminación (DELETE)',
      puerto: PORT,
      swagger: '/docs',
      endpoint_eliminar: 'DELETE /api/profesores/:id',
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
      microservicio: 'Eliminación de Docentes (DELETE)',
      database: pool ? 'Neon / PostgreSQL Conectado' : 'Memoria local'
    });
  }

  const pathParts = pathname.split('/').filter(Boolean);

  // DELETE /api/profesores/:id
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores' && pathParts[2] && req.method === 'DELETE') {
    const id = parseInt(pathParts[2], 10);
    if (isNaN(id)) {
      return responderJSON(res, 400, { error: 'El ID debe ser un número entero válido.' });
    }

    try {
      if (pool) {
        const deleteRes = await pool.query('DELETE FROM profesor WHERE id = $1 RETURNING *;', [id]);
        if (deleteRes.rows.length === 0) {
          return responderJSON(res, 404, { error: `Docente con ID ${id} no encontrado para eliminar.` });
        }
        return responderJSON(res, 200, {
          mensaje: `Docente con ID ${id} eliminado exitosamente.`,
          eliminado: deleteRes.rows[0]
        });
      } else {
        return responderJSON(res, 200, {
          mensaje: `Docente con ID ${id} eliminado exitosamente (modo local).`,
          id
        });
      }
    } catch (err) {
      return responderJSON(res, 500, { error: err.message });
    }
  }

  return responderJSON(res, 404, { error: 'Ruta no encontrada en microservicio de eliminación.' });
});

server.listen(PORT, async () => {
  console.log(`🗑️ [Microservicio Eliminar Docente] Activo en http://localhost:${PORT}`);
  console.log(`📖 Swagger UI en http://localhost:${PORT}/docs`);
  await initDB();
});
