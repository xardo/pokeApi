import { Platform } from 'react-native';

const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api/pokemon',
  default: 'http://localhost:3000/api/pokemon',
});

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
  };
  moves: {
    move: {
      name: string;
      url: string;
    };
  }[];
}

export async function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const query = String(nameOrId).trim().toLowerCase();

  if (!query) {
    throw new Error('Debes escribir el nombre o ID de un Pokémon');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${BASE_URL}/${query}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: Pokemon = await response.json();
      return data;
    } else if (response.status === 404) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Pokémon no encontrado');
    }
  } catch (err: any) {
    if (err?.message === 'Pokémon no encontrado') {
      throw err;
    }
  }

  try {
    const directResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!directResponse.ok) {
      if (directResponse.status === 404) {
        throw new Error('Pokémon no encontrado');
      }
      throw new Error('Ocurrió un error al consultar PokeAPI');
    }

    const parsed = await directResponse.json();
    return {
      id: parsed.id,
      name: parsed.name,
      height: parsed.height,
      weight: parsed.weight,
      sprites: {
        front_default: parsed.sprites?.front_default || null,
      },
      moves: (parsed.moves || []).slice(0, 5).map((m: any) => ({
        move: {
          name: m.move.name,
          url: m.move.url,
        },
      })),
    };
  } catch (err: any) {
    throw new Error(err.message || 'No se pudo consultar el Pokémon');
  }
}
