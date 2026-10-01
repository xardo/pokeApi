const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

let localCharactersFallback = [];
try {
  const fallbackPath = path.join(__dirname, 'src', 'constants', 'deathNoteCharacters.json');
  if (fs.existsSync(fallbackPath)) {
    localCharactersFallback = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  }
} catch {
}

function fetchPokemonFromPokeAPI(nameOrId) {
  return new Promise((resolve, reject) => {
    const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 404) {
          return reject(new Error('Pokémon no encontrado'));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Error de PokeAPI: ${res.statusCode}`));
        }
        try {
          const parsed = JSON.parse(data);
          const pokemonData = {
            id: parsed.id,
            name: parsed.name,
            height: parsed.height,
            weight: parsed.weight,
            sprites: {
              front_default: parsed.sprites?.front_default || null,
            },
            moves: (parsed.moves || []).slice(0, 5).map((m) => ({
              move: {
                name: m.move.name,
                url: m.move.url,
              },
            })),
          };
          resolve(pokemonData);
        } catch {
          reject(new Error('Error al procesar los datos de PokeAPI'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function fetchCharactersFromJikan() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.jikan.moe/v4/anime/1535/characters';
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          if (localCharactersFallback.length > 0) {
            return resolve(localCharactersFallback);
          }
          return reject(new Error(`Error de Jikan: ${res.statusCode}`));
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed?.data?.length > 0) {
            return resolve(parsed.data);
          }
          if (localCharactersFallback.length > 0) {
            return resolve(localCharactersFallback);
          }
          reject(new Error('Sin datos'));
        } catch {
          if (localCharactersFallback.length > 0) {
            return resolve(localCharactersFallback);
          }
          reject(new Error('Error al procesar datos'));
        }
      });
    }).on('error', (err) => {
      if (localCharactersFallback.length > 0) {
        return resolve(localCharactersFallback);
      }
      reject(err);
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  
  if (parsedUrl.pathname.startsWith('/api/pokemon')) {
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    let queryParam = parsedUrl.searchParams.get('name') || parsedUrl.searchParams.get('id');
    let pokemonQuery = parts[2] || queryParam;

    if (!pokemonQuery) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Debes proporcionar el nombre o ID del Pokémon' }));
      return;
    }

    try {
      const data = await fetchPokemonFromPokeAPI(pokemonQuery);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (error) {
      const status = error.message === 'Pokémon no encontrado' ? 404 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } 
  else if (parsedUrl.pathname.startsWith('/api/notes') || parsedUrl.pathname.startsWith('/api/characters')) {
    try {
      const characters = await fetchCharactersFromJikan();
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      const characterQuery = parts[2] || parsedUrl.searchParams.get('q');

      if (!characterQuery) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: characters }));
        return;
      }

      const q = characterQuery.toLowerCase().trim();
      const num = Number(q);
      let found = null;
      if (!isNaN(num) && num > 0) {
        if (num <= characters.length) {
          found = characters[num - 1];
        } else {
          found = characters.find(c => c.character.mal_id === num);
        }
      }
      if (!found) {
        found = characters.find(c => c.character.name.toLowerCase().includes(q));
      }

      if (!found) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Personaje no encontrado' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: found }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
  }
});

server.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
