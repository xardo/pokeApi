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
  console.log('ℹ️ Librería "pg" no cargada o en modo memoria.');
}

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;

// Datos de semilla inicial en memoria (actúa como fallback si no hay PostgreSQL configurada)
let inMemoryProfesores = [
  {
    id: 1,
    nombre: 'Dr. Carlos Mendoza',
    imagen: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    formacion: 'Doctor en Ciencias de la Computación e Inteligencia Artificial. Magíster en Ingeniería de Software. Más de 12 años de experiencia como docente investigador en Uninpahu.'
  },
  {
    id: 2,
    nombre: 'Dra. Mariana Restrepo',
    imagen: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500',
    formacion: 'Doctora en Robótica y Sistemas Autónomos. Especialista en Desarrollo Móvil y Cloud Computing. Líder del semillero de desarrollo móvil en Uninpahu.'
  },
  {
    id: 3,
    nombre: 'Ing. Felipe Valencia',
    imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    formacion: 'Magíster en Seguridad de la Información y Arquitecto de Microservicios Cloud. Docente titular del área de Bases de Datos y Backend en Uninpahu.'
  }
];
let nextInMemoryId = 4;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: !DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
    })
  : null;

async function initDB() {
  if (!pool) {
    console.log('⚠️  DATABASE_URL no configurada. Usando almacén en memoria para operaciones CRUD.');
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

    // Sembrar registros iniciales si la tabla está vacía
    const countRes = await client.query('SELECT COUNT(*) FROM profesor;');
    const total = parseInt(countRes.rows[0].count, 10);
    if (total === 0) {
      for (const p of inMemoryProfesores) {
        await client.query(
          'INSERT INTO profesor (nombre, imagen, formacion) VALUES ($1, $2, $3);',
          [p.nombre, p.imagen, p.formacion]
        );
      }
      console.log('🌱 Semillas iniciales de profesores insertadas en PostgreSQL.');
    } else {
      console.log(`✅ Base de datos PostgreSQL conectada con ${total} profesores existentes.`);
    }

    client.release();
  } catch (err) {
    console.error('❌ Error al conectar DB:', err.message);
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
      if (!body || body.trim() === '') {
        return resolve({});
      }
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
  // Manejo de Preflight CORS
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

  // Ruta raíz
  if (pathname === '/' && method === 'GET') {
    return responderJSON(res, 200, {
      mensaje: 'API de Microservicio de Profesores / Docentes Uninpahu',
      version: '1.1.0',
      documentacion_swagger: '/docs',
      especificacion_openapi: '/swagger.json',
      base_de_datos: pool ? 'PostgreSQL (Nube / Neon)' : 'Memoria persistente de respaldo',
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

  // Swagger UI HTML
  if ((pathname === '/docs' || pathname === '/docs/') && method === 'GET') {
    const htmlPath = path.join(__dirname, 'swagger.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(htmlPath, 'utf8'));
  }

  // Swagger OpenAPI JSON
  if (pathname === '/swagger.json' && method === 'GET') {
    const jsonPath = path.join(__dirname, 'swagger.json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(jsonPath, 'utf8'));
  }

  // Health Check
  if (pathname === '/api/health' && method === 'GET') {
    return responderJSON(res, 200, {
      status: 'ok',
      servicio: 'Docentes Uninpahu - CRUD Microservicio',
      database: pool ? 'PostgreSQL conectado' : 'Modo memoria local activo',
      timestamp: new Date().toISOString()
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
        if (pool) {
          const resultado = await pool.query('SELECT * FROM profesor WHERE id = $1;', [id]);
          if (resultado.rows.length > 0) {
            return responderJSON(res, 200, resultado.rows[0]);
          }
        } else {
          const prof = inMemoryProfesores.find((p) => p.id === id);
          if (prof) return responderJSON(res, 200, prof);
        }
        return responderJSON(res, 404, { error: `Profesor con ID ${id} no encontrado.` });
      } catch (err) {
        return responderJSON(res, 500, { error: err.message });
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

        if (pool) {
          const updateRes = await pool.query(
            'UPDATE profesor SET nombre = $1, imagen = $2, formacion = $3 WHERE id = $4 RETURNING *;',
            [nombre.trim(), imagen.trim(), formacion.trim(), id]
          );
          if (updateRes.rows.length === 0) {
            return responderJSON(res, 404, { error: `No se encontró el profesor con ID ${id} para actualizar.` });
          }
          return responderJSON(res, 200, updateRes.rows[0]);
        } else {
          const index = inMemoryProfesores.findIndex((p) => p.id === id);
          if (index === -1) {
            return responderJSON(res, 404, { error: `No se encontró el profesor con ID ${id} para actualizar.` });
          }
          inMemoryProfesores[index] = {
            id,
            nombre: nombre.trim(),
            imagen: imagen.trim(),
            formacion: formacion.trim(),
          };
          return responderJSON(res, 200, inMemoryProfesores[index]);
        }
      } catch (err) {
        return responderJSON(res, 400, { error: err.message });
      }
    }

    // 3. ELIMINAR PROFESOR POR ID (DELETE)
    if (method === 'DELETE') {
      try {
        if (pool) {
          const deleteRes = await pool.query('DELETE FROM profesor WHERE id = $1 RETURNING *;', [id]);
          if (deleteRes.rows.length === 0) {
            return responderJSON(res, 404, { error: `No se encontró el profesor con ID ${id} para eliminar.` });
          }
          return responderJSON(res, 200, {
            mensaje: `Profesor con ID ${id} eliminado exitosamente.`,
            eliminado: deleteRes.rows[0]
          });
        } else {
          const index = inMemoryProfesores.findIndex((p) => p.id === id);
          if (index === -1) {
            return responderJSON(res, 404, { error: `No se encontró el profesor con ID ${id} para eliminar.` });
          }
          const eliminado = inMemoryProfesores.splice(index, 1)[0];
          return responderJSON(res, 200, {
            mensaje: `Profesor con ID ${id} eliminado exitosamente.`,
            eliminado
          });
        }
      } catch (err) {
        return responderJSON(res, 500, { error: err.message });
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
        if (pool) {
          let sql = 'SELECT * FROM profesor';
          const params = [];
          if (filtroNombre && filtroNombre.trim() !== '') {
            sql += ' WHERE LOWER(nombre) LIKE $1';
            params.push(`%${filtroNombre.toLowerCase().trim()}%`);
          }
          sql += ' ORDER BY id ASC;';
          const resultado = await pool.query(sql, params);
          return responderJSON(res, 200, resultado.rows);
        } else {
          let lista = [...inMemoryProfesores];
          if (filtroNombre && filtroNombre.trim() !== '') {
            const query = filtroNombre.toLowerCase().trim();
            lista = lista.filter((p) => p.nombre.toLowerCase().includes(query));
          }
          lista.sort((a, b) => a.id - b.id);
          return responderJSON(res, 200, lista);
        }
      } catch (err) {
        return responderJSON(res, 500, { error: err.message });
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

        if (pool) {
          const insertRes = await pool.query(
            'INSERT INTO profesor (nombre, imagen, formacion) VALUES ($1, $2, $3) RETURNING *;',
            [nombre.trim(), imagen.trim(), formacion.trim()]
          );
          return responderJSON(res, 201, insertRes.rows[0]);
        } else {
          const nuevo = {
            id: nextInMemoryId++,
            nombre: nombre.trim(),
            imagen: imagen.trim(),
            formacion: formacion.trim(),
          };
          inMemoryProfesores.push(nuevo);
          return responderJSON(res, 201, nuevo);
        }
      } catch (err) {
        return responderJSON(res, 400, { error: err.message });
      }
    }

    return responderJSON(res, 405, { error: `Método ${method} no permitido en esta ruta.` });
  }

  return responderJSON(res, 404, { error: 'Ruta no encontrada en el microservicio de profesores.' });
});

server.listen(PORT, async () => {
  console.log(`🚀 Microservicio de Profesores escuchando en http://localhost:${PORT}`);
  console.log(`📖 Documentación Swagger UI en http://localhost:${PORT}/docs`);
  await initDB();
});
