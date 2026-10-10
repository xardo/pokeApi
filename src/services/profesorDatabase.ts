import * as SQLite from 'expo-sqlite';
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

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (dbInstance) return;

  const db = await SQLite.openDatabaseAsync('profesores.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS profesores_locales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      nombre TEXT NOT NULL,
      imagen TEXT NOT NULL,
      formacion TEXT NOT NULL,
      sync_status TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  dbInstance = db;
  console.log('✅ Base de datos SQLite (expo-sqlite nativo) inicializada exitosamente.');
}

export async function getLocalProfesores(filtroNombre?: string): Promise<Profesor[]> {
  await initDatabase();

  let query = `
    SELECT id, server_id, nombre, imagen, formacion, sync_status 
    FROM profesores_locales 
    WHERE sync_status != 'pending_delete'
  `;
  const params: any[] = [];

  if (filtroNombre && filtroNombre.trim() !== '') {
    query += ` AND LOWER(nombre) LIKE ?`;
    params.push(`%${filtroNombre.trim().toLowerCase()}%`);
  }

  query += ` ORDER BY id ASC`;

  const rows = await dbInstance!.getAllAsync<LocalProfesorRecord>(query, params);
  return rows.map((r) => ({
    id: r.server_id ?? r.id,
    nombre: r.nombre,
    imagen: r.imagen,
    formacion: r.formacion,
    _sync_status: r.sync_status,
    _local_id: r.id,
  }));
}

export async function getLocalProfesorById(id: number | string): Promise<Profesor | null> {
  await initDatabase();
  const numId = Number(id);

  const row = await dbInstance!.getFirstAsync<LocalProfesorRecord>(
    `SELECT id, server_id, nombre, imagen, formacion, sync_status 
     FROM profesores_locales 
     WHERE (server_id = ? OR id = ?) AND sync_status != 'pending_delete'`,
    [numId, numId]
  );
  if (row) {
    return {
      id: row.server_id ?? row.id,
      nombre: row.nombre,
      imagen: row.imagen,
      formacion: row.formacion,
      _sync_status: row.sync_status,
      _local_id: row.id,
    };
  }
  return null;
}

export async function insertLocalProfesor(
  input: ProfesorInput,
  syncStatus: SyncStatus = 'pending_create',
  serverId: number | null = null
): Promise<Profesor> {
  await initDatabase();
  const now = Date.now();

  const result = await dbInstance!.runAsync(
    `INSERT INTO profesores_locales (server_id, nombre, imagen, formacion, sync_status, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [serverId, input.nombre.trim(), input.imagen.trim(), input.formacion.trim(), syncStatus, now]
  );

  const insertedId = result.lastInsertRowId;
  return {
    id: serverId ?? insertedId,
    nombre: input.nombre.trim(),
    imagen: input.imagen.trim(),
    formacion: input.formacion.trim(),
    _sync_status: syncStatus,
    _local_id: insertedId,
  };
}

export async function updateLocalProfesor(
  id: number | string,
  input: ProfesorInput,
  syncStatus: SyncStatus = 'pending_update'
): Promise<Profesor> {
  await initDatabase();
  const numId = Number(id);
  const now = Date.now();

  const current = await dbInstance!.getFirstAsync<LocalProfesorRecord>(
    `SELECT id, sync_status, server_id FROM profesores_locales WHERE server_id = ? OR id = ?`,
    [numId, numId]
  );

  const nextStatus = current?.sync_status === 'pending_create' ? 'pending_create' : syncStatus;

  await dbInstance!.runAsync(
    `UPDATE profesores_locales 
     SET nombre = ?, imagen = ?, formacion = ?, sync_status = ?, updated_at = ? 
     WHERE server_id = ? OR id = ?`,
    [input.nombre.trim(), input.imagen.trim(), input.formacion.trim(), nextStatus, now, numId, numId]
  );

  return {
    id: current?.server_id ?? current?.id ?? numId,
    nombre: input.nombre.trim(),
    imagen: input.imagen.trim(),
    formacion: input.formacion.trim(),
    _sync_status: nextStatus,
    _local_id: current?.id,
  };
}

export async function deleteLocalProfesor(id: number | string): Promise<{ eliminada: boolean; eraLocal: boolean }> {
  await initDatabase();
  const numId = Number(id);

  const current = await dbInstance!.getFirstAsync<LocalProfesorRecord>(
    `SELECT id, sync_status, server_id FROM profesores_locales WHERE server_id = ? OR id = ?`,
    [numId, numId]
  );

  if (!current) {
    return { eliminada: false, eraLocal: false };
  }

  if (current.sync_status === 'pending_create' || !current.server_id) {
    await dbInstance!.runAsync(`DELETE FROM profesores_locales WHERE id = ?`, [current.id]);
    return { eliminada: true, eraLocal: true };
  }

  await dbInstance!.runAsync(
    `UPDATE profesores_locales SET sync_status = 'pending_delete', updated_at = ? WHERE id = ?`,
    [Date.now(), current.id]
  );
  return { eliminada: true, eraLocal: false };
}

export async function getPendingSyncRecords(): Promise<LocalProfesorRecord[]> {
  await initDatabase();

  return await dbInstance!.getAllAsync<LocalProfesorRecord>(
    `SELECT id, server_id, nombre, imagen, formacion, sync_status, updated_at 
     FROM profesores_locales 
     WHERE sync_status IN ('pending_create', 'pending_update', 'pending_delete')
     ORDER BY id ASC`
  );
}

export async function markRecordSynced(localId: number, serverId: number): Promise<void> {
  await initDatabase();

  await dbInstance!.runAsync(
    `UPDATE profesores_locales 
     SET server_id = ?, sync_status = 'synced', updated_at = ? 
     WHERE id = ?`,
    [serverId, Date.now(), localId]
  );
}

export async function removeLocalRecord(localId: number): Promise<void> {
  await initDatabase();

  await dbInstance!.runAsync(`DELETE FROM profesores_locales WHERE id = ?`, [localId]);
}

export async function cacheServerProfesores(serverList: Profesor[]): Promise<void> {
  await initDatabase();
  const now = Date.now();

  const pendingRecords = await getPendingSyncRecords();
  const pendingServerIds = new Set(
    pendingRecords.filter((p) => p.server_id !== null).map((p) => p.server_id!)
  );

  const serverIds = serverList.map((s) => s.id);
  if (serverIds.length > 0) {
    const placeholders = serverIds.map(() => '?').join(',');
    await dbInstance!.runAsync(
      `DELETE FROM profesores_locales WHERE sync_status = 'synced' AND server_id NOT IN (${placeholders})`,
      serverIds
    );
  }

  for (const item of serverList) {
    if (pendingServerIds.has(item.id)) continue;

    const existing = await dbInstance!.getFirstAsync<LocalProfesorRecord>(
      `SELECT id FROM profesores_locales WHERE server_id = ?`,
      [item.id]
    );

    if (existing) {
      await dbInstance!.runAsync(
        `UPDATE profesores_locales 
         SET nombre = ?, imagen = ?, formacion = ?, sync_status = 'synced', updated_at = ? 
         WHERE id = ?`,
        [item.nombre, item.imagen, item.formacion, now, existing.id]
      );
    } else {
      await dbInstance!.runAsync(
        `INSERT INTO profesores_locales (server_id, nombre, imagen, formacion, sync_status, updated_at) 
         VALUES (?, ?, ?, ?, 'synced', ?)`,
        [item.id, item.nombre, item.imagen, item.formacion, now]
      );
    }
  }
}

export async function getSyncStats(): Promise<{ pendingCount: number; totalLocal: number }> {
  await initDatabase();

  try {
    const pendingRes = await dbInstance!.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM profesores_locales WHERE sync_status != 'synced'`
    );
    const totalRes = await dbInstance!.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM profesores_locales WHERE sync_status != 'pending_delete'`
    );

    return {
      pendingCount: pendingRes?.total ?? 0,
      totalLocal: totalRes?.total ?? 0,
    };
  } catch {
    return { pendingCount: 0, totalLocal: 0 };
  }
}
