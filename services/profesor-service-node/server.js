const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;

// Datos de respaldo si la base de datos no está conectada
const PROFESORES_MEMORIA = [
  {
    id: 1,
    nombre: 'Ing. Carlos Mendoza',
    imagen: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    formacion: 'Ingeniero de Sistemas y Magíster en Ingeniería de Software. Docente líder de arquitectura de microservicios y desarrollo móvil en Uninpahu con más de 12 años de trayectoria académica.'
  },
  {
    id: 2,
    nombre: 'Dra. Martha Patricia Gómez',
    imagen: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    formacion: 'Doctora en Ciencias de la Información y Licenciada en Computación. Coordinadora de investigación en Uninpahu e investigadora senior en Inteligencia Artificial y Minería de Datos.'
  },
  {
    id: 3,
    nombre: 'Ing. Andrés Felipe Torres',
    imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    formacion: 'Ingeniero Telemático egresado de Uninpahu con especialización en Seguridad Informática. Certificado en CISSP y DevOps, docente de infraestructura cloud.'
  }
];

// Conexión a Neon Database (PostgreSQL)
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: !DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
    })
  : null;

// Función para inicializar la tabla en Neon
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

    const countRes = await client.query('SELECT COUNT(*) FROM profesor;');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      for (const p of PROFESORES_MEMORIA) {
        await client.query(
          'INSERT INTO profesor (nombre, imagen, formacion) VALUES ($1, $2, $3);',
          [p.nombre, p.imagen, p.formacion]
        );
      }
    }
    client.release();
    console.log('[Neon DB] Conectado y tabla profesor lista.');
  } catch (err) {
    console.error('[Neon DB] Error al conectar:', err.message);
  }
}

// Función de respuesta JSON simple con CORS
function responderJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// Servidor HTTP agnóstico (sin Express)
const server = http.createServer(async (req, res) => {
  // Manejo de CORS
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

  // 1. Swagger UI y Docs
  if (pathname === '/' || pathname === '/docs') {
    const htmlPath = path.join(__dirname, 'swagger.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(htmlPath, 'utf8'));
  }

  if (pathname === '/swagger.json') {
    const jsonPath = path.join(__dirname, 'swagger.json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(jsonPath, 'utf8'));
  }

  // 2. Health check
  if (pathname === '/api/health') {
    return responderJSON(res, 200, { status: 'ok', servicio: 'Docentes Uninpahu' });
  }

  // 3. Path Param: GET /api/profesores/:id
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores' && pathParts[2]) {
    const id = parseInt(pathParts[2], 10);
    if (pool) {
      try {
        const resultado = await pool.query('SELECT * FROM profesor WHERE id = $1;', [id]);
        if (resultado.rows.length > 0) return responderJSON(res, 200, resultado.rows[0]);
        return responderJSON(res, 404, { error: 'Docente no encontrado' });
      } catch (err) {
        return responderJSON(res, 500, { error: err.message });
      }
    }
    const profe = PROFESORES_MEMORIA.find(p => p.id === id);
    return profe ? responderJSON(res, 200, profe) : responderJSON(res, 404, { error: 'No encontrado' });
  }

  // 4. Query Params: GET /api/profesores (o ?nombre=...)
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores') {
    const filtroNombre = url.searchParams.get('nombre');
    if (pool) {
      try {
        let sql = 'SELECT * FROM profesor';
        const params = [];
        if (filtroNombre) {
          sql += ' WHERE LOWER(nombre) LIKE $1';
          params.push(`%${filtroNombre.toLowerCase()}%`);
        }
        sql += ' ORDER BY id ASC;';
        const resultado = await pool.query(sql, params);
        return responderJSON(res, 200, resultado.rows);
      } catch (err) {
        return responderJSON(res, 500, { error: err.message });
      }
    }
    let lista = PROFESORES_MEMORIA;
    if (filtroNombre) {
      lista = lista.filter(p => p.nombre.toLowerCase().includes(filtroNombre.toLowerCase()));
    }
    return responderJSON(res, 200, lista);
  }

  return responderJSON(res, 404, { error: 'Ruta no encontrada' });
});

server.listen(PORT, async () => {
  console.log(`Servidor de Docentes escuchando en http://localhost:${PORT}`);
  console.log(`Documentación Swagger en http://localhost:${PORT}/docs`);
  await initDB();
});
