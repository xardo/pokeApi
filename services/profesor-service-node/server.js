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
  console.error('❌ Módulo "pg" no disponible.');
}

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = (DATABASE_URL && Pool)
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: !DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
    })
  : null;

async function initDB() {
  if (!pool) {
    console.error('DATABASE_URL no configurada.');
    return;
  }
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
    const total = parseInt(countRes.rows[0].count, 10);
    console.log(`Base de datos Neon conectada con ${total} profesores.`);
    client.release();
  } catch (err) {
    console.error('Error al conectar DB:', err.message);
  }
}

function responderJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body || body.trim() === '') return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Formato JSON inválido en el cuerpo de la petición.'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  if (pathname === '/' && method === 'GET') {
    return responderJSON(res, 200, {
      mensaje: 'API de Microservicio de Profesores / Docentes Uninpahu (Neon DB)',
      version: '1.2.0',
      documentacion_swagger: '/docs',
      especificacion_openapi: '/swagger.json',
      base_de_datos: pool ? 'Neon PostgreSQL Conectado' : 'Sin conexión',
      crud_endpoints: {
        listar_todos: 'GET /api/profesores',
        buscar_por_id: 'GET /api/profesores/:id',
        filtrar_por_nombre: 'GET /api/profesores?nombre=:nombre',
        crear_docente: 'POST /api/profesores',
        actualizar_docente: 'PUT /api/profesores/:id',
        eliminar_docente: 'DELETE /api/profesores/:id',
        salud_servidor: 'GET /api/health'
      }
    });
  }

  if ((pathname === '/docs' || pathname === '/docs/') && method === 'GET') {
    const htmlPath = path.join(__dirname, 'swagger.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(htmlPath, 'utf8'));
  }

  if (pathname === '/swagger.json' && method === 'GET') {
    const jsonPath = path.join(__dirname, 'swagger.json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(jsonPath, 'utf8'));
  }

  if (pathname === '/api/health' && method === 'GET') {
    return responderJSON(res, pool ? 200 : 503, {
      status: pool ? 'ok' : 'error',
      servicio: 'Docentes Uninpahu - CRUD Microservicio',
      database: pool ? 'Neon PostgreSQL Conectado' : 'Sin conexión a base de datos',
      timestamp: new Date().toISOString()
    });
  }

  // Verificación estricta de base de datos Neon: Sin datos de respaldo falsos
  if (!pool) {
    return responderJSON(res, 503, {
      error: 'Error de conexión: La base de datos de Neon no está disponible o DATABASE_URL no fue configurada.'
    });
  }

  const pathParts = pathname.split('/').filter(Boolean);

  // ==========================================
  // OPERACIONES CRUD: /api/profesores/:id
  // ==========================================
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores' && pathParts[2]) {
    const id = parseInt(pathParts[2], 10);
    if (isNaN(id)) {
      return responderJSON(res, 400, { error: 'El ID del profesor debe ser un número entero válido.' });
    }

    // 1. CONSULTAR PROFESOR POR ID (GET)
    if (method === 'GET') {
      try {
        const resultado = await pool.query('SELECT * FROM profesor WHERE id = $1;', [id]);
        if (resultado.rows.length > 0) {
          return responderJSON(res, 200, resultado.rows[0]);
        }
        return responderJSON(res, 404, { error: `Profesor con ID ${id} no encontrado en Neon Database.` });
      } catch (err) {
        return responderJSON(res, 500, { error: `Error en Neon Database: ${err.message}` });
      }
    }

    // 2. ACTUALIZAR PROFESOR POR ID (PUT)
    if (method === 'PUT') {
      try {
        const body = await parseBody(req);
        const { nombre, imagen, formacion } = body;

        if (!nombre || !nombre.trim() || !imagen || !imagen.trim() || !formacion || !formacion.trim()) {
          return responderJSON(res, 400, {
            error: 'Los campos "nombre", "imagen" y "formacion" son obligatorios para actualizar.'
          });
        }

        const updateRes = await pool.query(
          'UPDATE profesor SET nombre = $1, imagen = $2, formacion = $3 WHERE id = $4 RETURNING *;',
          [nombre.trim(), imagen.trim(), formacion.trim(), id]
        );
        if (updateRes.rows.length === 0) {
          return responderJSON(res, 404, { error: `No se encontró el profesor con ID ${id} para actualizar.` });
        }
        return responderJSON(res, 200, updateRes.rows[0]);
      } catch (err) {
        return responderJSON(res, 500, { error: `Error al actualizar en Neon Database: ${err.message}` });
      }
    }

    // 3. ELIMINAR PROFESOR POR ID (DELETE)
    if (method === 'DELETE') {
      try {
        const deleteRes = await pool.query('DELETE FROM profesor WHERE id = $1 RETURNING *;', [id]);
        if (deleteRes.rows.length === 0) {
          return responderJSON(res, 404, { error: `No se encontró el profesor con ID ${id} para eliminar.` });
        }
        return responderJSON(res, 200, {
          mensaje: `Profesor con ID ${id} eliminado exitosamente de Neon Database.`,
          eliminado: deleteRes.rows[0]
        });
      } catch (err) {
        return responderJSON(res, 500, { error: `Error al eliminar en Neon Database: ${err.message}` });
      }
    }

    return responderJSON(res, 405, { error: `Método ${method} no permitido en esta ruta.` });
  }

  // ==========================================
  // OPERACIONES CRUD: /api/profesores
  // ==========================================
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores' && pathParts.length === 2) {
    // 4. LISTAR PROFESORES (GET)
    if (method === 'GET') {
      const filtroNombre = url.searchParams.get('nombre');
      try {
        let sql = 'SELECT * FROM profesor';
        const params = [];
        if (filtroNombre && filtroNombre.trim() !== '') {
          sql += ' WHERE LOWER(nombre) LIKE $1';
          params.push(`%${filtroNombre.toLowerCase().trim()}%`);
        }
        sql += ' ORDER BY id ASC;';
        const resultado = await pool.query(sql, params);
        return responderJSON(res, 200, resultado.rows);
      } catch (err) {
        return responderJSON(res, 500, { error: `Error al consultar Neon Database: ${err.message}` });
      }
    }

    // 5. INSERTAR / CREAR PROFESOR (POST)
    if (method === 'POST') {
      try {
        const body = await parseBody(req);
        const { nombre, imagen, formacion } = body;

        if (!nombre || !nombre.trim() || !imagen || !imagen.trim() || !formacion || !formacion.trim()) {
          return responderJSON(res, 400, {
            error: 'Los campos "nombre", "imagen" y "formacion" son requeridos para registrar un docente.'
          });
        }

        const insertRes = await pool.query(
          'INSERT INTO profesor (nombre, imagen, formacion) VALUES ($1, $2, $3) RETURNING *;',
          [nombre.trim(), imagen.trim(), formacion.trim()]
        );
        return responderJSON(res, 201, insertRes.rows[0]);
      } catch (err) {
        return responderJSON(res, 500, { error: `Error al insertar en Neon Database: ${err.message}` });
      }
    }

    return responderJSON(res, 405, { error: `Método ${method} no permitido en esta ruta.` });
  }

  return responderJSON(res, 404, { error: 'Ruta no encontrada en el microservicio de profesores.' });
});

server.listen(PORT, async () => {
  console.log(`Servidor de profesores escuchando en http://localhost:${PORT}`);
  console.log(`Swagger en http://localhost:${PORT}/docs`);
  await initDB();
});
