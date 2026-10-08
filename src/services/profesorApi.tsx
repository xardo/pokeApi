import {
  GET_DOCENTE_ACTUALIZAR_BASE_URL,
  GET_DOCENTE_CONSULTAR_BASE_URL,
  GET_DOCENTE_CREAR_BASE_URL,
  GET_DOCENTE_ELIMINAR_BASE_URL,
} from '@/constants/apiConfig';

export interface Profesor {
  id: number;
  nombre: string;
  imagen: string;
  formacion: string;
}

export interface ProfesorInput {
  nombre: string;
  imagen: string;
  formacion: string;
}

export async function getProfesores(nombre?: string): Promise<Profesor[]> {
  const baseUrl = GET_DOCENTE_CONSULTAR_BASE_URL();
  const url =
    nombre && nombre.trim() !== ''
      ? `${baseUrl}?nombre=${encodeURIComponent(nombre.trim())}`
      : baseUrl;

  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => null);
    throw new Error(errorData?.error || `Error al consultar profesores (${respuesta.status})`);
  }
  return respuesta.json();
}

export async function getProfesorById(id: number | string): Promise<Profesor> {
  const baseUrl = GET_DOCENTE_CONSULTAR_BASE_URL();
  const respuesta = await fetch(`${baseUrl}/${id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => null);
    throw new Error(errorData?.error || 'Docente no encontrado');
  }
  return respuesta.json();
}

export async function createProfesor(data: ProfesorInput): Promise<Profesor> {
  const baseUrl = GET_DOCENTE_CREAR_BASE_URL();
  const respuesta = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => null);
    throw new Error(errorData?.error || `Error al crear profesor (${respuesta.status})`);
  }
  return respuesta.json();
}

export async function updateProfesor(id: number | string, data: ProfesorInput): Promise<Profesor> {
  const baseUrl = GET_DOCENTE_ACTUALIZAR_BASE_URL();
  const respuesta = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => null);
    throw new Error(errorData?.error || `Error al actualizar profesor (${respuesta.status})`);
  }
  return respuesta.json();
}

export async function deleteProfesor(id: number | string): Promise<{ mensaje: string; eliminado?: Profesor }> {
  const baseUrl = GET_DOCENTE_ELIMINAR_BASE_URL();
  const respuesta = await fetch(`${baseUrl}/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => null);
    throw new Error(errorData?.error || `Error al eliminar profesor (${respuesta.status})`);
  }
  return respuesta.json();
}
