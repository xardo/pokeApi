const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'services', 'pokemon-service-node', 'data', 'seedPokemons.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let sql = `-TABLA POKEMONS
CREATE TABLE IF NOT EXISTS pokemons (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  height INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  sprites JSONB NOT NULL,
  moves JSONB NOT NULL
);

-INSERTAR LOS 10 POKEMON
INSERT INTO pokemons (id, name, height, weight, sprites, moves) VALUES
`;

const values = data.map(p => {
  const sprites = JSON.stringify(p.sprites).replace(/'/g, "''");
  const moves = JSON.stringify(p.moves).replace(/'/g, "''");
  return `(${p.id}, '${p.name}', ${p.height}, ${p.weight}, '${sprites}'::jsonb, '${moves}'::jsonb)`;
});

sql += values.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';
sql += `-VERIFICAR LOS REGISTROS
SELECT id, name, height, weight FROM pokemons ORDER BY id ASC;
`;

const outputPath = path.join(__dirname, 'seed_neon.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log('SQL generado en scripts/seed_neon.sql');
