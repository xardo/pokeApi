const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

async function runSeeder() {
  const seedDataPath = path.join(__dirname, 'data', 'seedPokemons.json');

  if (!fs.existsSync(seedDataPath)) {
    console.error(`❌ [Error] No se encontró el archivo de datos en: ${seedDataPath}`);
    process.exit(1);
  }

  const seedPokemons = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
  console.log(`\n======================================================`);
  console.log(`  🌱 Seeder de Pokémon (PostgreSQL)`);
  console.log(`  📦 Leyendo ${seedPokemons.length} Pokémon desde seedPokemons.json`);
  console.log(`======================================================\n`);

  if (!DATABASE_URL) {
    console.log('⚠️ [Aviso] No se encontró la variable DATABASE_URL en el archivo .env');
    console.log('   Si deseas poblar una base de datos en la nube (Render / Supabase / Neon):');
    console.log('   Crea o edita el archivo .env en esta carpeta con:');
    console.log('   DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db\n');
    console.log('ℹ️ Para el funcionamiento local en memoria, seedPokemons.json ya está listo con tus Pokémon.');
    return;
  }

  const isCloud = !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ [PostgreSQL] Conectado exitosamente a la base de datos.');

    // Crear tabla si no existe
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
    let existentes = 0;

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
        [
          p.id,
          p.name.toLowerCase().trim(),
          p.height,
          p.weight,
          JSON.stringify(p.sprites),
          JSON.stringify(p.moves),
        ]
      );

      const fueInsertado = res.rows[0]?.fue_insertado;
      if (fueInsertado) {
        nuevos++;
        console.log(`  ➕ [Nuevo] Insertado #${p.id} ${p.name}`);
      } else {
        existentes++;
        console.log(`  🔄 [Sincronizado] #${p.id} ${p.name}`);
      }
    }

    const countRes = await client.query('SELECT COUNT(*) FROM pokemons;');
    const totalEnBD = parseInt(countRes.rows[0].count, 10);

    console.log(`\n======================================================`);
    console.log(`🎉 [Éxito] Seeder completado.`);
    console.log(`   - Pokémon nuevos insertados: ${nuevos}`);
    console.log(`   - Pokémon actualizados/existentes: ${existentes}`);
    console.log(`   - Total actual en la tabla 'pokemons': ${totalEnBD}`);
    console.log(`======================================================\n`);

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ [Error] Falló la ejecución del seeder:', err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

runSeeder();
