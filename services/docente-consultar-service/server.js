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
  console.log('ℹ️ Modo memoria local activo en microservicio de consulta.');
}

const PORT = process.env.PORT || 4001;
const DATABASE_URL = process.env.DATABASE_URL;

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
    const countRes = await client.query('SELECT COUNT(*) FROM profesor;');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      for (const p of inMemoryProfesores) {
        await client.query(
          'INSERT INTO profesor (nombre, imagen, formacion) VALUES ($1, $2, $3);',
          [p.nombre, p.imagen, p.formacion]
        );
      }
    }
    client.release();
    console.log('✅ Microservicio de CONSULTA conectado a PostgreSQL/Neon');
  } catch (err) {
    console.error('❌ Error DB Consulta:', err.message);
  }
}

function responderJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/' && req.method === 'GET') {
    return responderJSON(res, 200, {
      microservicio: 'Docentes - Microservicio de Consulta (READ)',
      puerto: PORT,
      swagger: '/docs',
      endpoints: {
        listar_todos: 'GET /api/profesores',
        buscar_por_id: 'GET /api/profesores/:id',
        filtrar_por_nombre: 'GET /api/profesores?nombre=:nombre',
        salud: 'GET /api/health'
      }
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
      microservicio: 'Consulta de Docentes (READ)',
      database: pool ? 'Neon / PostgreSQL Conectado' : 'Memoria local'
    });
  }

  const pathParts = pathname.split('/').filter(Boolean);

  // GET /api/profesores/:id
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores' && pathParts[2] && req.method === 'GET') {
    const id = parseInt(pathParts[2], 10);
    if (isNaN(id)) {
      return responderJSON(res, 400, { error: 'El ID debe ser un número entero.' });
    }
    try {
      if (pool) {
        const resultado = await pool.query('SELECT * FROM profesor WHERE id = $1;', [id]);
        if (resultado.rows.length > 0) return responderJSON(res, 200, resultado.rows[0]);
      } else {
        const prof = inMemoryProfesores.find(p => p.id === id);
        if (prof) return responderJSON(res, 200, prof);
      }
      return responderJSON(res, 404, { error: `Docente con ID ${id} no encontrado.` });
    } catch (err) {
      return responderJSON(res, 500, { error: err.message });
    }
  }

  // GET /api/profesores
  if (pathParts[0] === 'api' && pathParts[1] === 'profesores' && pathParts.length === 2 && req.method === 'GET') {
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
          lista = lista.filter(p => p.nombre.toLowerCase().includes(filtroNombre.toLowerCase().trim()));
        }
        return responderJSON(res, 200, lista);
      }
    } catch (err) {
      return responderJSON(res, 500, { error: err.message });
    }
  }

  return responderJSON(res, 404, { error: 'Ruta no encontrada en microservicio de consulta.' });
});

server.listen(PORT, async () => {
  console.log(`🔍 [Microservicio Consulta Docentes] Activo en http://localhost:${PORT}`);
  console.log(`📖 Swagger UI en http://localhost:${PORT}/docs`);
  await initDB();
});
