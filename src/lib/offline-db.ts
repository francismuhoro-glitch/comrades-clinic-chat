// Offline-first local storage layer (zero dependency — hand-rolled IndexedDB
// wrapper that mirrors the ergonomics of `idb` but ships no extra code).
//
// One database, `comrades-clinic-offline` (v1), with four object stores:
//   1. consultations  — cached patient consultation records
//   2. messages       — outbound chat messages queued while offline
//   3. clinic_settings — cached clinic settings (fees, helpline, Pochi)
//   4. sync_queue     — generic queue for any pending mutation (intake, payments…)
//
// The Supabase flow is NEVER replaced — we only read this cache when the
// network is unavailable, and keep it fresh after every successful fetch.

const DB_NAME = "comrades-clinic-offline";
const DB_VERSION = 1;

export const STORES = {
  consultations: "consultations",
  messages: "messages",
  clinicSettings: "clinic_settings",
  syncQueue: "sync_queue",
} as const;

export type OfflineStoreName = (typeof STORES)[keyof typeof STORES];

// ---------------------------------------------------------------------------
// Loosely-typed shapes — kept permissive on purpose because the rows arrive
// from multiple sources (Supabase rows, in-memory ConsultSession objects, or the
// clinic settings map). The UI only reads the fields it needs.
// ---------------------------------------------------------------------------

export interface OfflineConsultation {
  id: string;
  patient_name?: string;
  status?: string;
  consultation_type?: string;
  fee_kes?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface OfflineClinicSetting {
  key: string;
  value: unknown;
}

export type QueuedMessageStatus = "queued" | "sent" | "failed";

export interface QueuedMessage {
  id: string;
  consultationId: string;
  /** Plaintext body kept for local render only — the encrypted blob is what we upload. */
  body: string;
  encryptedContent: string;
  senderId: string;
  /** "student" | "doctor" | "system" — matches the `messages.sender_role` column. */
  sender: string;
  timestamp: string;
  status: QueuedMessageStatus;
}

export type SyncQueueItemType = "intake" | "payment" | "message" | "generic";

export interface SyncQueueItem {
  id: string;
  type: SyncQueueItemType;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/** Open (and create-on-first-run) the offline database. Safe to call repeatedly. */
export function openOfflineDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.consultations)) {
        db.createObjectStore(STORES.consultations, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.messages)) {
        db.createObjectStore(STORES.messages, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.clinicSettings)) {
        db.createObjectStore(STORES.clinicSettings, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        db.createObjectStore(STORES.syncQueue, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open offline database"));
  });

  return dbPromise;
}

function withStore<T>(
  storeName: OfflineStoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openOfflineDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = fn(store);

        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
      }),
  );
}

function getAll<T>(storeName: OfflineStoreName): Promise<T[]> {
  return withStore<T[]>(storeName, "readonly", (store) => store.getAll());
}

function put<T>(storeName: OfflineStoreName, value: T): Promise<IDBValidKey> {
  return withStore<IDBValidKey>(storeName, "readwrite", (store) =>
    store.put(value as unknown as object),
  );
}

function del(storeName: OfflineStoreName, key: IDBValidKey): Promise<undefined> {
  return withStore<undefined>(storeName, "readwrite", (store) => store.delete(key));
}

function clearStore(storeName: OfflineStoreName): Promise<undefined> {
  return withStore<undefined>(storeName, "readwrite", (store) => store.clear());
}

// ---------------------------------------------------------------------------
// consultations
// ---------------------------------------------------------------------------

export async function saveConsultationsLocally(
  consultations: OfflineConsultation[],
): Promise<void> {
  for (const c of consultations) {
    if (c && c.id) await put(STORES.consultations, c);
  }
}

export async function getLocalConsultations(): Promise<OfflineConsultation[]> {
  return getAll<OfflineConsultation>(STORES.consultations);
}

// ---------------------------------------------------------------------------
// clinic_settings — store as key/value rows so a single setting can be upserted
// without rewriting the whole map.
// ---------------------------------------------------------------------------

export async function saveClinicSettingsLocally(settings: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(settings).map(([key, value]) => ({ key, value }));
  for (const e of entries) await put(STORES.clinicSettings, e);
}

export async function getLocalClinicSettings(): Promise<Record<string, unknown>> {
  const rows = await getAll<OfflineClinicSetting>(STORES.clinicSettings);
  return rows.reduce<Record<string, unknown>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// messages — outbound queue. Read directly by the chat UI while offline.
// ---------------------------------------------------------------------------

export async function putQueuedMessage(msg: QueuedMessage): Promise<void> {
  await put(STORES.messages, msg);
}

export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const all = await getAll<QueuedMessage>(STORES.messages);
  return all.filter((m) => m.status === "queued");
}

export async function getQueuedMessagesFor(consultationId: string): Promise<QueuedMessage[]> {
  const all = await getQueuedMessages();
  return all.filter((m) => m.consultationId === consultationId);
}

export async function updateQueuedMessageStatus(
  id: string,
  status: QueuedMessageStatus,
): Promise<void> {
  const existing = await withStore<QueuedMessage | undefined>(
    STORES.messages,
    "readonly",
    (store) => store.get(id),
  );
  if (!existing) return;
  await put(STORES.messages, { ...existing, status });
}

export async function deleteQueuedMessage(id: string): Promise<void> {
  await del(STORES.messages, id);
}

// ---------------------------------------------------------------------------
// sync_queue — generic pending mutations (intake forms, payment claims, …)
// ---------------------------------------------------------------------------

export async function enqueueSyncItem(
  type: SyncQueueItemType,
  payload: Record<string, unknown>,
): Promise<string> {
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `sync-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  await put<SyncQueueItem>(STORES.syncQueue, {
    id,
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  return id;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return getAll<SyncQueueItem>(STORES.syncQueue);
}

export async function removeSyncItem(id: string): Promise<void> {
  await del(STORES.syncQueue, id);
}

/** Used by the SW `sync` handler to open the queue without importing the app. */
export async function peekQueuedSyncItems(): Promise<SyncQueueItem[]> {
  return getSyncQueue();
}

export function isOfflineStorageAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function clearOfflineData(): Promise<void> {
  await Promise.all([
    clearStore(STORES.consultations),
    clearStore(STORES.messages),
    clearStore(STORES.clinicSettings),
    clearStore(STORES.syncQueue),
  ]);
}
