import { Platform } from 'react-native';

export const POKEMON_CLOUD_URL: string = 'https://pokeapi-cmsz.onrender.com';
export const ANIME_CLOUD_URL: string = 'https://anime-service-python.onrender.com';

export const DOCENTE_CONSULTAR_URL: string = 'https://docente-consultar-service.onrender.com';
export const DOCENTE_CREAR_URL: string = 'https://docente-crear-service.onrender.com';
export const DOCENTE_ACTUALIZAR_URL: string = 'https://docente-actualizar-service.onrender.com';
export const DOCENTE_ELIMINAR_URL: string = 'https://docente-eliminar-service.onrender.com';

export const PROFESOR_CLOUD_URL: string = 'https://profesor-service-node.onrender.com';
export const DOCENTE_CLOUD_URL = PROFESOR_CLOUD_URL;

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

export const GET_DOCENTE_CONSULTAR_BASE_URL = (): string => {
  if (DOCENTE_CONSULTAR_URL && DOCENTE_CONSULTAR_URL.trim() !== '') {
    return `${DOCENTE_CONSULTAR_URL.replace(/\/$/, '')}/api/profesores`;
  }
  if (PROFESOR_CLOUD_URL && PROFESOR_CLOUD_URL.trim() !== '') {
    return `${PROFESOR_CLOUD_URL.replace(/\/$/, '')}/api/profesores`;
  }
  return Platform.select({
    android: 'http://10.0.2.2:4001/api/profesores',
    default: 'http://localhost:4001/api/profesores',
  }) || 'http://localhost:4001/api/profesores';
};

export const GET_DOCENTE_CREAR_BASE_URL = (): string => {
  if (DOCENTE_CREAR_URL && DOCENTE_CREAR_URL.trim() !== '') {
    return `${DOCENTE_CREAR_URL.replace(/\/$/, '')}/api/profesores`;
  }
  if (PROFESOR_CLOUD_URL && PROFESOR_CLOUD_URL.trim() !== '') {
    return `${PROFESOR_CLOUD_URL.replace(/\/$/, '')}/api/profesores`;
  }
  return Platform.select({
    android: 'http://10.0.2.2:4002/api/profesores',
    default: 'http://localhost:4002/api/profesores',
  }) || 'http://localhost:4002/api/profesores';
};

export const GET_DOCENTE_ACTUALIZAR_BASE_URL = (): string => {
  if (DOCENTE_ACTUALIZAR_URL && DOCENTE_ACTUALIZAR_URL.trim() !== '') {
    return `${DOCENTE_ACTUALIZAR_URL.replace(/\/$/, '')}/api/profesores`;
  }
  if (PROFESOR_CLOUD_URL && PROFESOR_CLOUD_URL.trim() !== '') {
    return `${PROFESOR_CLOUD_URL.replace(/\/$/, '')}/api/profesores`;
  }
  return Platform.select({
    android: 'http://10.0.2.2:4003/api/profesores',
    default: 'http://localhost:4003/api/profesores',
  }) || 'http://localhost:4003/api/profesores';
};

export const GET_DOCENTE_ELIMINAR_BASE_URL = (): string => {
  if (DOCENTE_ELIMINAR_URL && DOCENTE_ELIMINAR_URL.trim() !== '') {
    return `${DOCENTE_ELIMINAR_URL.replace(/\/$/, '')}/api/profesores`;
  }
  if (PROFESOR_CLOUD_URL && PROFESOR_CLOUD_URL.trim() !== '') {
    return `${PROFESOR_CLOUD_URL.replace(/\/$/, '')}/api/profesores`;
  }
  return Platform.select({
    android: 'http://10.0.2.2:4004/api/profesores',
    default: 'http://localhost:4004/api/profesores',
  }) || 'http://localhost:4004/api/profesores';
};

export const GET_PROFESOR_BASE_URL = GET_DOCENTE_CONSULTAR_BASE_URL;
export const GET_DOCENTE_BASE_URL = GET_DOCENTE_CONSULTAR_BASE_URL;
