import { Platform } from 'react-native';

/**
 * CONFIGURACIÓN DE MICROSERVICIOS EN LA NUBE (Render / Railway)
 *
 * Pega aquí las URLs públicas una vez desplegados en Render o Railway:
 * Ejemplo:
 *   export const POKEMON_CLOUD_URL: string = 'https://pokemon-service-node.onrender.com';
 *   export const ANIME_CLOUD_URL: string = 'https://anime-service-python.up.railway.app';
 */
export const POKEMON_CLOUD_URL: string = 'https://pokeapi-cmsz.onrender.com';
export const ANIME_CLOUD_URL: string = 'https://anime-service-python.onrender.com';

export const GET_POKEMON_BASE_URL = (): string => {
  if (POKEMON_CLOUD_URL && POKEMON_CLOUD_URL.trim() !== '') {
    return `${POKEMON_CLOUD_URL.replace(/\/$/, '')}/api/pokemon`;
  }
  return Platform.select({
    android: 'http://10.0.2.2:3000/api/pokemon',
    default: 'http://localhost:3000/api/pokemon',
  }) || 'http://localhost:3000/api/pokemon';
};

export const GET_ANIME_BASE_URL = (): string => {
  if (ANIME_CLOUD_URL && ANIME_CLOUD_URL.trim() !== '') {
    return `${ANIME_CLOUD_URL.replace(/\/$/, '')}/api/characters`;
  }
  return Platform.select({
    android: 'http://10.0.2.2:8000/api/characters',
    default: 'http://localhost:8000/api/characters',
  }) || 'http://localhost:8000/api/characters';
};

export const PROFESOR_CLOUD_URL: string = 'https://profesor-service-node.onrender.com';

export const GET_PROFESOR_BASE_URL = (): string => {
  if (PROFESOR_CLOUD_URL && PROFESOR_CLOUD_URL.trim() !== '') {
    return `${PROFESOR_CLOUD_URL.replace(/\/$/, '')}/api/profesores`;
  }
  return Platform.select({
    android: 'http://10.0.2.2:4000/api/profesores',
    default: 'http://localhost:4000/api/profesores',
  }) || 'http://localhost:4000/api/profesores';
};

// Aliases para compatibilidad
export const DOCENTE_CLOUD_URL = PROFESOR_CLOUD_URL;
export const GET_DOCENTE_BASE_URL = GET_PROFESOR_BASE_URL;

