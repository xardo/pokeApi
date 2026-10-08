import { Platform } from 'react-native';

/**
 * CONFIGURACIÓN DE MICROSERVICIOS EN LA NUBE (Render / Railway / Neon)
 */
export const POKEMON_CLOUD_URL: string = 'https://pokeapi-cmsz.onrender.com';
export const ANIME_CLOUD_URL: string = 'https://anime-service-python.onrender.com';

/**
 * MICROSERVICIOS SEPARADOS PARA CRUD DE DOCENTES
 *
 * Puedes desplegar 1 microservicio independiente para cada operación CRUD en Render:
 * 1. Consulta (GET): https://docente-consulta.onrender.com
 * 2. Creación (POST): https://docente-crear.onrender.com
 * 3. Actualización (PUT): https://docente-actualizar.onrender.com
 * 4. Eliminación (DELETE): https://docente-eliminar.onrender.com
 *
 * O usar una URL unificada en PROFESOR_CLOUD_URL como fallback.
 */
export const DOCENTE_CONSULTAR_URL: string = '';
export const DOCENTE_CREAR_URL: string = '';
export const DOCENTE_ACTUALIZAR_URL: string = '';
export const DOCENTE_ELIMINAR_URL: string = '';

// URL de fallback general si se usa el microservicio maestro en Render
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

// URL para Microservicio 1: Consulta (READ)
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

// URL para Microservicio 2: Creación (CREATE)
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

// URL para Microservicio 3: Actualización (UPDATE)
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

// URL para Microservicio 4: Eliminación (DELETE)
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

// Aliases para compatibilidad
export const GET_PROFESOR_BASE_URL = GET_DOCENTE_CONSULTAR_BASE_URL;
export const GET_DOCENTE_BASE_URL = GET_DOCENTE_CONSULTAR_BASE_URL;
