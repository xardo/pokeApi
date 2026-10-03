const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
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
  } catch (err) {
    console.error('Error al conectar DB:', err.message);
  }
}

function responderJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/') {
    return responderJSON(res, 200, {
      mensaje: 'API de Profesores Uninpahu',
      version: '1.0.0',
      documentacion: '/docs',
      endpoints: {
        listar_profesores: '/api/profesores',
        buscar_por_id: '/api/profesores/:id',
        filtrar_por_nombre: '/api/profesores?nombre=nombre_profesor',
        salud: '/api/health'
      }
    });
  }

  if (pathname === '/docs' || pathname === '/docs/') {
    const htmlPath = path.join(__dirname, 'swagger.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(htmlPath, 'utf8'));
  }

  if (pathname === '/swagger.json') {
    const jsonPath = path.join(__dirname, 'swagger.json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(jsonPath, 'utf8'));
  }

  if (pathname === '/api/health') {
    return responderJSON(res, 200, {
      status: 'ok',
      servicio: 'Docentes Uninpahu',
      database: pool ? 'conectado' : 'desconectado',
    });
  }

  if (!pool) {
    return responderJSON(res, 500, {
      error: 'DATABASE_URL no configurada',
    });
  }

  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores' && pathParts[2]) {
    const id = parseInt(pathParts[2], 10);
    try {
      const resultado = await pool.query('SELECT * FROM profesor WHERE id = $1;', [id]);
      if (resultado.rows.length > 0) {
        return responderJSON(res, 200, resultado.rows[0]);
      }
      return responderJSON(res, 404, { error: 'Profesor no encontrado' });
    } catch (err) {
      return responderJSON(res, 500, { error: err.message });
    }
  }

  if (pathParts[0] === 'api' && pathParts[1] === 'profesores') {
    const filtroNombre = url.searchParams.get('nombre');
    try {
      let sql = 'SELECT * FROM profesor';
      const params = [];

      if (filtroNombre) {
        sql += ' WHERE LOWER(nombre) LIKE $1';
        params.push(`%${filtroNombre.toLowerCase().trim()}%`);
      }

      sql += ' ORDER BY id ASC;';
      const resultado = await pool.query(sql, params);
      return responderJSON(res, 200, resultado.rows);
    } catch (err) {
      return responderJSON(res, 500, { error: err.message });
    }
  }

  return responderJSON(res, 404, { error: 'Ruta no encontrada' });
});

server.listen(PORT, async () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Swagger en http://localhost:${PORT}/docs`);
  await initDB();
});
