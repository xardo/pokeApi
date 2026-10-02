import { GET_POKEMON_BASE_URL } from '@/constants/apiConfig';

export interface PokemonMove {
  move: {
    name: string;
    url: string;
  };
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
  };
  moves: PokemonMove[];
}

/**
 * Consulta un Pokémon (por ID del 1 al 10 o por nombre) desde el microservicio en la nube (PostgreSQL)
 */
export async function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const query = String(nameOrId).trim().toLowerCase();

  if (!query) {
    throw new Error('Debes escribir el nombre o ID de un Pokémon');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const baseUrl = GET_POKEMON_BASE_URL();
    const response = await fetch(`${baseUrl}/${query}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: Pokemon = await response.json();
      return data;
    }

    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Pokémon no encontrado en la base de datos');
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con el microservicio de Pokémon');
    }
    throw new Error(err.message || 'Error al conectar con la base de datos de Pokémon');
  }
}
