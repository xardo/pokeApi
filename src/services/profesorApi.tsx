import {
  GET_DOCENTE_ACTUALIZAR_BASE_URL,
  GET_DOCENTE_CONSULTAR_BASE_URL,
  GET_DOCENTE_CREAR_BASE_URL,
  GET_DOCENTE_ELIMINAR_BASE_URL,
} from '@/constants/apiConfig';
import {
  cacheServerProfesores,
  deleteLocalProfesor,
  getLocalProfesorById,
  getLocalProfesores,
  getPendingSyncRecords,
  getSyncStats,
  insertLocalProfesor,
  updateLocalProfesor,
} from './profesorDatabase';
import { networkSync } from './networkSyncService';

export interface Profesor {
  id: number;
  nombre: string;
  imagen: string;
  formacion: string;
  _sync_status?: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
  _local_id?: number;
}

export interface ProfesorInput {
  nombre: string;
  imagen: string;
  formacion: string;
}

/**
 * Consulta todos los profesores.
 * Si cuenta con conexión, consulta el microservicio en la nube (Neon DB),
 * actualiza la caché local en SQLite y devuelve los datos unificados.
 * Si no cuenta con conexión (o el microservicio no responde), consulta directamente SQLite.
 */
export async function getProfesores(nombre?: string): Promise<Profesor[]> {
  const isOnline = networkSync.isEffectiveOnline();

  if (isOnline) {
    try {
      const baseUrl = GET_DOCENTE_CONSULTAR_BASE_URL();
      const url =
        nombre && nombre.trim() !== ''
          ? `${baseUrl}?nombre=${encodeURIComponent(nombre.trim())}`
          : baseUrl;

      // Timeout corto para no congelar la UI si el servidor en Render está suspendido
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const respuesta = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (respuesta.ok) {
        const datosServidor: Profesor[] = await respuesta.json();
        // Guardar y sincronizar en SQLite local como respaldo
        await cacheServerProfesores(datosServidor);
        // Si hay registros creados offline pendientes de sincronizar, unificar con SQLite
        const pendientes = await getPendingSyncRecords();
        if (pendientes.length === 0) {
          return datosServidor;
        }
        return await getLocalProfesores(nombre);
      }
    } catch (err) {
      console.warn('⚠️ No se pudo conectar al microservicio Neon. Obteniendo datos desde SQLite local:', err);
    }
  }

  // Modo offline o servidor no disponible: lectura directa y transparente de SQLite
  return await getLocalProfesores(nombre);
}

/**
 * Consulta un profesor por su ID.
 */
export async function getProfesorById(id: number | string): Promise<Profesor> {
  const local = await getLocalProfesorById(id);
  if (local) {
    return local;
  }

  const isOnline = networkSync.isEffectiveOnline();
  if (isOnline) {
    const baseUrl = GET_DOCENTE_CONSULTAR_BASE_URL();
    const respuesta = await fetch(`${baseUrl}/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (respuesta.ok) {
      return respuesta.json();
    }
  }

  throw new Error('Docente no encontrado.');
}

/**
 * Crea/inserta un nuevo profesor de forma transparente:
 * - Si está en línea y el microservicio responde, lo guarda en Neon DB y en SQLite local.
 * - Si está sin internet (o en modo simulación offline), lo guarda inmediatamente en SQLite local
 *   marcado como pendiente. Tan pronto se active internet, se subirá automáticamente a Neon DB.
 */
export async function createProfesor(data: ProfesorInput): Promise<Profesor> {
  const isOnline = networkSync.isEffectiveOnline();

  if (isOnline) {
    try {
      const baseUrl = GET_DOCENTE_CREAR_BASE_URL();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const respuesta = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (respuesta.ok) {
        const creadoEnNeon: Profesor = await respuesta.json();
        // Guardar en SQLite como sincronizado
        await insertLocalProfesor(data, 'synced', creadoEnNeon.id);
        console.log(`✅ Docente guardado en la nube (Neon DB) con ID ${creadoEnNeon.id}`);
        return creadoEnNeon;
      }
    } catch (err) {
      console.warn('⚠️ Fallo al conectar con el microservicio en la nube, guardando localmente en SQLite:', err);
    }
  }

  // Almacenamiento local transparente en SQLite (offline)
  console.log('📦 Guardando docente localmente en SQLite (sin conexión a internet)...');
  const localDocente = await insertLocalProfesor(data, 'pending_create');
  return localDocente;
}

/**
 * Actualiza un profesor de forma transparente:
 * - Si hay conexión, lo actualiza en Neon DB y en SQLite local.
 * - Si no hay conexión, lo actualiza en SQLite local como pendiente de subir.
 */
export async function updateProfesor(id: number | string, data: ProfesorInput): Promise<Profesor> {
  const isOnline = networkSync.isEffectiveOnline();

  if (isOnline) {
    try {
      const baseUrl = GET_DOCENTE_ACTUALIZAR_BASE_URL();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const respuesta = await fetch(`${baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (respuesta.ok) {
        const actualizadoEnNeon: Profesor = await respuesta.json();
        await updateLocalProfesor(id, data, 'synced');
        return actualizadoEnNeon;
      }
    } catch (err) {
      console.warn('⚠️ Fallo al actualizar en la nube, actualizando localmente en SQLite:', err);
    }
  }

  return await updateLocalProfesor(id, data, 'pending_update');
}

/**
 * Elimina un profesor de forma transparente:
 * - Si hay conexión, lo elimina de Neon DB y de SQLite local.
 * - Si no hay conexión, se marca para eliminación en SQLite local.
 */
export async function deleteProfesor(id: number | string): Promise<{ mensaje: string; eliminado?: Profesor }> {
  const isOnline = networkSync.isEffectiveOnline();

  if (isOnline) {
    try {
      const baseUrl = GET_DOCENTE_ELIMINAR_BASE_URL();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const respuesta = await fetch(`${baseUrl}/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (respuesta.ok) {
        await deleteLocalProfesor(id);
        return { mensaje: 'Docente eliminado correctamente de la base de datos de Neon.' };
      }
    } catch (err) {
      console.warn('⚠️ Fallo al eliminar en la nube, procesando eliminación local en SQLite:', err);
    }
  }

  await deleteLocalProfesor(id);
  return { mensaje: 'Docente eliminado localmente en SQLite.' };
}

// Re-exportar utilidades de sincronización y estado de red para la interfaz
export {
  networkSync,
  getSyncStats,
};
