import { GET_ANIME_BASE_URL } from '@/constants/apiConfig';

export interface NoteVoiceActor {
  person: {
    mal_id: number;
    name: string;
    url: string;
    images?: {
      jpg?: {
        image_url?: string;
      };
    };
  };
  language: string;
}

export interface NoteCharacter {
  mal_id: number;
  name: string;
  url: string;
  images: {
    jpg: {
      image_url: string;
    };
    webp?: {
      image_url?: string;
      small_image_url?: string;
    };
  };
}

export interface NoteCharacterItem {
  character: NoteCharacter;
  role: string;
  favorites: number;
  voice_actors: NoteVoiceActor[];
}

export interface NoteResult {
  character: NoteCharacterItem;
  index: number;
  total: number;
  prev: NoteCharacterItem | null;
  next: NoteCharacterItem | null;
}

// Guarda la lista en memoria para evitar peticiones repetitivas
let cachedList: NoteCharacterItem[] | null = null;

/**
 * Consulta la lista completa de los 10 personajes desde el microservicio de Anime (Firebase)
 */
export async function getCharactersList(): Promise<NoteCharacterItem[]> {
  if (cachedList && cachedList.length > 0) {
    return cachedList;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const url = GET_ANIME_BASE_URL();
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: no se pudo cargar la base de datos de anime`);
    }

    const json = await response.json();
    if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
      cachedList = json.data as NoteCharacterItem[];
      return cachedList;
    }

    throw new Error('La base de datos de anime no devolvió ningún personaje');
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con el microservicio de Anime');
    }
    throw new Error(error.message || 'Error al conectar con el microservicio de Anime');
  }
}

/**
 * Obtiene un personaje por su índice (0 a 9)
 */
export async function getCharacterByIndex(index: number): Promise<NoteResult> {
  const list = await getCharactersList();

  if (list.length === 0) {
    throw new Error('No hay personajes disponibles en la base de datos');
  }

  const safeIndex = Math.max(0, Math.min(index, list.length - 1));
  const character = list[safeIndex];
  const prev = safeIndex > 0 ? list[safeIndex - 1] : null;
  const next = safeIndex < list.length - 1 ? list[safeIndex + 1] : null;

  return {
    character,
    index: safeIndex,
    total: list.length,
    prev,
    next,
  };
}

/**
 * Busca un personaje por ID, índice o nombre
 */
export async function getCharacter(query: string | number): Promise<NoteResult> {
  const list = await getCharactersList();
  const q = String(query).trim().toLowerCase();

  if (!q) {
    throw new Error('Debes escribir el nombre o ID de un personaje');
  }

  const num = Number(q);
  let index = -1;

  // Búsqueda por número (índice 1-10 o mal_id)
  if (!isNaN(num) && num > 0) {
    if (num <= list.length) {
      index = num - 1;
    } else {
      index = list.findIndex((item) => item.character.mal_id === num);
    }
  }

  // Búsqueda por texto (nombre)
  if (index === -1) {
    index = list.findIndex((item) => item.character.name.toLowerCase().includes(q));
  }

  if (index === -1) {
    throw new Error(`Personaje "${query}" no encontrado en la base de datos`);
  }

  return getCharacterByIndex(index);
}
