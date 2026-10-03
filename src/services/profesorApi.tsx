import { GET_PROFESOR_BASE_URL } from '@/constants/apiConfig';

export interface Profesor {
  id: number;
  nombre: string;
  imagen: string;
  formacion: string;
}

/**
 * Consulta la lista de profesores desde el microservicio
 * Permite filtrar por nombre mediante Query Param (?nombre=...)
 */
export async function getProfesores(nombre?: string): Promise<Profesor[]> {
  const baseUrl = GET_PROFESOR_BASE_URL();
  const url = nombre && nombre.trim() !== ''
    ? `${baseUrl}?nombre=${encodeURIComponent(nombre.trim())}`
    : baseUrl;

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error('No se pudo consultar la lista de profesores');
  }
  return respuesta.json();
}

/**
 * Consulta un profesor específico por ID mediante Path Param (/api/profesores/:id)
 */
export async function getProfesorById(id: number | string): Promise<Profesor> {
  const baseUrl = GET_PROFESOR_BASE_URL();
  const respuesta = await fetch(`${baseUrl}/${id}`);
  if (!respuesta.ok) {
    throw new Error('Profesor no encontrado');
  }
  return respuesta.json();
}
