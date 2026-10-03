import { GET_PROFESOR_BASE_URL } from '@/constants/apiConfig';

export interface Profesor {
  id: number;
  nombre: string;
  imagen: string;
  formacion: string;
}

export async function getProfesores(nombre?: string): Promise<Profesor[]> {
  const baseUrl = GET_PROFESOR_BASE_URL();
  const url = nombre && nombre.trim() !== ''
    ? `${baseUrl}?nombre=${encodeURIComponent(nombre.trim())}`
    : baseUrl;

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error('Error al consultar profesores');
  }
  return respuesta.json();
}

export async function getProfesorById(id: number | string): Promise<Profesor> {
  const baseUrl = GET_PROFESOR_BASE_URL();
  const respuesta = await fetch(`${baseUrl}/${id}`);
  if (!respuesta.ok) {
    throw new Error('Profesor no encontrado');
  }
  return respuesta.json();
}
