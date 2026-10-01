import fallbackData from '@/constants/deathNoteCharacters.json';
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

let cachedList: NoteCharacterItem[] | null = null;

export async function getCharactersList(): Promise<NoteCharacterItem[]> {
  if (cachedList && cachedList.length > 0) {
    return cachedList;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const url = GET_ANIME_BASE_URL();
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timer);

    if (response.ok) {
      const json = await response.json();
      if (json?.data?.length > 0) {
        cachedList = json.data as NoteCharacterItem[];
        return cachedList;
      }
    }
  } catch {
  }

  cachedList = fallbackData as unknown as NoteCharacterItem[];
  return cachedList;
}

export async function getCharacterByIndex(index: number): Promise<NoteResult> {
  const list = await getCharactersList();

  if (list.length === 0) {
    throw new Error('No hay personajes disponibles');
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

export async function getCharacter(query: string | number): Promise<NoteResult> {
  const list = await getCharactersList();
  const q = String(query).trim().toLowerCase();

  if (!q) {
    throw new Error('Debes escribir el nombre o ID de un personaje');
  }

  const num = Number(q);
  let index = -1;

  if (!isNaN(num) && num > 0) {
    if (num <= list.length) {
      index = num - 1;
    } else {
      index = list.findIndex((item) => item.character.mal_id === num);
    }
  }

  if (index === -1) {
    index = list.findIndex((item) => item.character.name.toLowerCase().includes(q));
  }

  if (index === -1) {
    throw new Error(`Personaje "${query}" no encontrado`);
  }

  return getCharacterByIndex(index);
}
