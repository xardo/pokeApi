import { Platform } from 'react-native';
import * as Network from 'expo-network';
import {
  GET_DOCENTE_ACTUALIZAR_BASE_URL,
  GET_DOCENTE_CONSULTAR_BASE_URL,
  GET_DOCENTE_CREAR_BASE_URL,
  GET_DOCENTE_ELIMINAR_BASE_URL,
} from '@/constants/apiConfig';
import {
  cacheServerProfesores,
  getPendingSyncRecords,
  getSyncStats,
  markRecordSynced,
  removeLocalRecord,
} from './profesorDatabase';
import { Profesor } from './profesorApi';

type NetworkListener = (isOnline: boolean) => void;
type SyncListener = (syncedCount: number, error?: string) => void;

class NetworkSyncService {
  private isSimulatedOffline: boolean = false;
  private isRealConnected: boolean = true;
  private isSyncing: boolean = false;
  private networkListeners: Set<NetworkListener> = new Set();
  private syncListeners: Set<SyncListener> = new Set();
  private checkInterval: any = null;

  constructor() {
    this.initNetworkMonitoring();
  }

  private async initNetworkMonitoring() {
    try {
      const state = await Network.getNetworkStateAsync();
      this.isRealConnected = !!(state.isConnected && (state.isInternetReachable ?? true));
    } catch {
      this.isRealConnected = true;
    }

    try {
      Network.addNetworkStateListener((state) => {
        const connected = !!(state.isConnected && (state.isInternetReachable ?? true));
        const changed = connected !== this.isRealConnected;
        this.isRealConnected = connected;
        if (changed) {
          this.notifyNetworkChange();
          if (this.isEffectiveOnline()) {
            this.syncPendingRecords();
          }
        }
      });
    } catch {
      // Ignorar si addNetworkStateListener no está soportado en la plataforma actual
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isRealConnected = true;
        this.notifyNetworkChange();
        if (this.isEffectiveOnline()) {
          this.syncPendingRecords();
        }
      });

      window.addEventListener('offline', () => {
        this.isRealConnected = false;
        this.notifyNetworkChange();
      });
    }

    // Monitoreo periódico en segundo plano
    this.checkInterval = setInterval(async () => {
      if (this.isEffectiveOnline() && !this.isSyncing) {
        const stats = await getSyncStats();
        if (stats.pendingCount > 0) {
          this.syncPendingRecords();
        }
      }
    }, 15000);
  }

  /**
   * Indica si la aplicación tiene conexión efectiva (ni modo simulado ni desconexión real).
   */
  public isEffectiveOnline(): boolean {
    if (this.isSimulatedOffline) {
      return false;
    }
    return this.isRealConnected;
  }

  /**
   * Consulta el estado de la conexión en tiempo real.
   */
  public async checkOnlineAsync(): Promise<boolean> {
    if (this.isSimulatedOffline) {
      return false;
    }
    try {
      const state = await Network.getNetworkStateAsync();
      this.isRealConnected = !!(state.isConnected && (state.isInternetReachable ?? true));
    } catch {
      // Si falla la consulta nativa, mantener valor actual
    }
    return this.isRealConnected;
  }

  /**
   * Activa o desactiva la simulación de apagado de internet.
   */
  public setSimulatedOffline(offline: boolean): void {
    const previousState = this.isEffectiveOnline();
    this.isSimulatedOffline = offline;
    const currentState = this.isEffectiveOnline();

    if (previousState !== currentState) {
      this.notifyNetworkChange();
      // Si se apagó y se volvió a prender internet, se suben los cambios automáticamente
      if (currentState) {
        this.syncPendingRecords();
      }
    }
  }

  public getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  public toggleSimulatedOffline(): boolean {
    this.setSimulatedOffline(!this.isSimulatedOffline);
    return this.isSimulatedOffline;
  }

  public onNetworkChange(listener: NetworkListener): () => void {
    this.networkListeners.add(listener);
    listener(this.isEffectiveOnline());
    return () => this.networkListeners.delete(listener);
  }

  public onSyncComplete(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notifyNetworkChange(): void {
    const online = this.isEffectiveOnline();
    this.networkListeners.forEach((listener) => {
      try {
        listener(online);
      } catch (e) {
        console.warn('Error en listener de red:', e);
      }
    });
  }

  private notifySyncComplete(count: number, error?: string): void {
    this.syncListeners.forEach((listener) => {
      try {
        listener(count, error);
      } catch (e) {
        console.warn('Error en listener de sincronización:', e);
      }
    });
  }

  /**
   * Sincroniza todas las operaciones pendientes de SQLite con el microservicio en Neon.
   */
  public async syncPendingRecords(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, error: 'Sincronización en curso' };
    }

    if (!this.isEffectiveOnline()) {
      return { success: false, syncedCount: 0, error: 'Dispositivo sin conexión' };
    }

    this.isSyncing = true;
    let syncedCount = 0;

    try {
      const pending = await getPendingSyncRecords();
      if (pending.length === 0) {
        this.isSyncing = false;
        return { success: true, syncedCount: 0 };
      }

      console.log(`🔄 Iniciando sincronización de ${pending.length} operaciones con el microservicio Neon...`);

      for (const record of pending) {
        if (!this.isEffectiveOnline()) {
          break; // Si se cortó la red en mitad del proceso
        }

        try {
          if (record.sync_status === 'pending_create') {
            // Subir nuevo profesor al microservicio de creación (Neon DB)
            const createUrl = GET_DOCENTE_CREAR_BASE_URL();
            const res = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                nombre: record.nombre,
                imagen: record.imagen,
                formacion: record.formacion,
              }),
            });

            if (res.ok) {
              const remoteDocente: Profesor = await res.json();
              await markRecordSynced(record.id, remoteDocente.id);
              syncedCount++;
              console.log(`✅ Docente "${record.nombre}" subido a Neon con ID ${remoteDocente.id}`);
            } else {
              console.warn(`No se pudo sincronizar creación de docente ${record.nombre}: Status ${res.status}`);
            }
          } else if (record.sync_status === 'pending_update' && record.server_id) {
            // Actualizar profesor en el microservicio de actualización (Neon DB)
            const updateUrl = `${GET_DOCENTE_ACTUALIZAR_BASE_URL()}/${record.server_id}`;
            const res = await fetch(updateUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                nombre: record.nombre,
                imagen: record.imagen,
                formacion: record.formacion,
              }),
            });

            if (res.ok) {
              await markRecordSynced(record.id, record.server_id);
              syncedCount++;
            }
          } else if (record.sync_status === 'pending_delete' && record.server_id) {
            // Eliminar profesor en el microservicio de eliminación (Neon DB)
            const deleteUrl = `${GET_DOCENTE_ELIMINAR_BASE_URL()}/${record.server_id}`;
            const res = await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                Accept: 'application/json',
              },
            });

            if (res.ok || res.status === 404) {
              await removeLocalRecord(record.id);
              syncedCount++;
            }
          }
        } catch (itemErr: any) {
          console.warn(`Error sincronizando registro local ID ${record.id}:`, itemErr?.message);
        }
      }

      // Descargar datos actualizados del microservicio para refrescar la BD local SQLite
      try {
        const consultarUrl = GET_DOCENTE_CONSULTAR_BASE_URL();
        const res = await fetch(consultarUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const docentesServidor: Profesor[] = await res.json();
          await cacheServerProfesores(docentesServidor);
        }
      } catch (cacheErr) {
        console.warn('No se pudo refrescar el caché completo desde el servidor:', cacheErr);
      }

      this.isSyncing = false;
      this.notifySyncComplete(syncedCount);
      return { success: true, syncedCount };
    } catch (err: any) {
      this.isSyncing = false;
      this.notifySyncComplete(syncedCount, err?.message);
      return { success: false, syncedCount, error: err?.message };
    }
  }
}

export const networkSync = new NetworkSyncService();
