import { Profesor, ProfesorInput } from './profesorApi';

export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';

export interface LocalProfesorRecord {
  id: number;
  server_id: number | null;
  nombre: string;
  imagen: string;
  formacion: string;
  sync_status: SyncStatus;
  updated_at: number;
}

const fallbackStorageKey = 'poke_api_profesores_sqlite_fallback';
let memoryRecords: LocalProfesorRecord[] = [];

function loadFallbackRecords(): LocalProfesorRecord[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = window.localStorage.getItem(fallbackStorageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Ignorar error de acceso a localStorage
    }
  }
  return memoryRecords;
}

function saveFallbackRecords(records: LocalProfesorRecord[]): void {
  memoryRecords = records;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(fallbackStorageKey, JSON.stringify(records));
    } catch {
      // Ignorar error de almacenamiento
    }
  }
}

export async function initDatabase(): Promise<void> {
  memoryRecords = loadFallbackRecords();
}

export async function getLocalProfesores(filtroNombre?: string): Promise<Profesor[]> {
  const records = loadFallbackRecords().filter((r) => r.sync_status !== 'pending_delete');
  let filtered = records;
  if (filtroNombre && filtroNombre.trim() !== '') {
    const q = filtroNombre.trim().toLowerCase();
    filtered = records.filter((r) => r.nombre.toLowerCase().includes(q));
  }

  return filtered.map((r) => ({
    id: r.server_id ?? r.id,
    nombre: r.nombre,
    imagen: r.imagen,
    formacion: r.formacion,
    _sync_status: r.sync_status,
    _local_id: r.id,
  }));
}

export async function getLocalProfesorById(id: number | string): Promise<Profesor | null> {
  const numId = Number(id);
  const records = loadFallbackRecords();
  const found = records.find(
    (r) => (r.server_id === numId || r.id === numId) && r.sync_status !== 'pending_delete'
  );
  if (found) {
    return {
      id: found.server_id ?? found.id,
      nombre: found.nombre,
      imagen: found.imagen,
      formacion: found.formacion,
      _sync_status: found.sync_status,
      _local_id: found.id,
    };
  }
  return null;
}

export async function insertLocalProfesor(
  input: ProfesorInput,
  syncStatus: SyncStatus = 'pending_create',
  serverId: number | null = null
): Promise<Profesor> {
  const now = Date.now();
  const records = loadFallbackRecords();
  const newId = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;
  const newRecord: LocalProfesorRecord = {
    id: newId,
    server_id: serverId,
    nombre: input.nombre.trim(),
    imagen: input.imagen.trim(),
    formacion: input.formacion.trim(),
    sync_status: syncStatus,
    updated_at: now,
  };
  records.push(newRecord);
  saveFallbackRecords(records);

  return {
    id: serverId ?? newId,
    nombre: newRecord.nombre,
    imagen: newRecord.imagen,
    formacion: newRecord.formacion,
    _sync_status: syncStatus,
    _local_id: newId,
  };
}

export async function updateLocalProfesor(
  id: number | string,
  input: ProfesorInput,
  syncStatus: SyncStatus = 'pending_update'
): Promise<Profesor> {
  const numId = Number(id);
  const now = Date.now();
  const records = loadFallbackRecords();
  const idx = records.findIndex((r) => r.server_id === numId || r.id === numId);
  if (idx >= 0) {
    const current = records[idx];
    const nextStatus = current.sync_status === 'pending_create' ? 'pending_create' : syncStatus;
    records[idx] = {
      ...current,
      nombre: input.nombre.trim(),
      imagen: input.imagen.trim(),
      formacion: input.formacion.trim(),
      sync_status: nextStatus,
      updated_at: now,
    };
    saveFallbackRecords(records);
    return {
      id: current.server_id ?? current.id,
      nombre: input.nombre.trim(),
      imagen: input.imagen.trim(),
      formacion: input.formacion.trim(),
      _sync_status: nextStatus,
      _local_id: current.id,
    };
  }

  return {
    id: numId,
    nombre: input.nombre.trim(),
    imagen: input.imagen.trim(),
    formacion: input.formacion.trim(),
    _sync_status: syncStatus,
  };
}

export async function deleteLocalProfesor(id: number | string): Promise<{ eliminada: boolean; eraLocal: boolean }> {
  const numId = Number(id);
  const records = loadFallbackRecords();
  const idx = records.findIndex((r) => r.server_id === numId || r.id === numId);
  if (idx >= 0) {
    const current = records[idx];
    if (current.sync_status === 'pending_create' || !current.server_id) {
      records.splice(idx, 1);
      saveFallbackRecords(records);
      return { eliminada: true, eraLocal: true };
    }
    records[idx].sync_status = 'pending_delete';
    records[idx].updated_at = Date.now();
    saveFallbackRecords(records);
    return { eliminada: true, eraLocal: false };
  }

  return { eliminada: false, eraLocal: false };
}

export async function getPendingSyncRecords(): Promise<LocalProfesorRecord[]> {
  return loadFallbackRecords().filter((r) =>
    ['pending_create', 'pending_update', 'pending_delete'].includes(r.sync_status)
  );
}

export async function markRecordSynced(localId: number, serverId: number): Promise<void> {
  const records = loadFallbackRecords();
  const item = records.find((r) => r.id === localId);
  if (item) {
    item.server_id = serverId;
    item.sync_status = 'synced';
    item.updated_at = Date.now();
    saveFallbackRecords(records);
  }
}

export async function removeLocalRecord(localId: number): Promise<void> {
  const records = loadFallbackRecords().filter((r) => r.id !== localId);
  saveFallbackRecords(records);
}

export async function cacheServerProfesores(serverList: Profesor[]): Promise<void> {
  const now = Date.now();
  const pendingRecords = await getPendingSyncRecords();
  const pendingServerIds = new Set(
    pendingRecords.filter((p) => p.server_id !== null).map((p) => p.server_id!)
  );

  let records = loadFallbackRecords();
  const serverIdsSet = new Set(serverList.map((s) => s.id));
  if (serverIdsSet.size > 0) {
    records = records.filter(
      (r) => r.sync_status !== 'synced' || (r.server_id !== null && serverIdsSet.has(r.server_id))
    );
  }

  for (const item of serverList) {
    if (pendingServerIds.has(item.id)) continue;

    const existingIndex = records.findIndex((r) => r.server_id === item.id);
    if (existingIndex >= 0) {
      records[existingIndex] = {
        ...records[existingIndex],
        nombre: item.nombre,
        imagen: item.imagen,
        formacion: item.formacion,
        sync_status: 'synced',
        updated_at: now,
      };
    } else {
      const newId = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;
      records.push({
        id: newId,
        server_id: item.id,
        nombre: item.nombre,
        imagen: item.imagen,
        formacion: item.formacion,
        sync_status: 'synced',
        updated_at: now,
      });
    }
  }
  saveFallbackRecords(records);
}

export async function getSyncStats(): Promise<{ pendingCount: number; totalLocal: number }> {
  const records = loadFallbackRecords();
  return {
    pendingCount: records.filter((r) => r.sync_status !== 'synced').length,
    totalLocal: records.filter((r) => r.sync_status !== 'pending_delete').length,
  };
}
