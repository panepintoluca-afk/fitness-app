// Unico modulo che accede a IndexedDB.
const DB_NAME = 'gym-db';
const DB_VERSION = 1;

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('schede')) {
        db.createObjectStore('schede', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('progressi')) {
        const p = db.createObjectStore('progressi', { keyPath: 'id', autoIncrement: true });
        p.createIndex('esercizioKey', 'esercizioKey');
        p.createIndex('esercizio_data', ['esercizioKey', 'data']);
        p.createIndex('schedaId', 'schedaId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function store(name, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

export function normalizzaNome(nome) {
  return nome
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---- Schede ----
export async function getSchede() {
  return promisify((await store('schede')).getAll());
}

export async function getScheda(id) {
  return promisify((await store('schede')).get(id));
}

export async function salvaScheda(scheda) {
  const now = new Date().toISOString();
  const record = { ...scheda, creataIl: scheda.creataIl ?? now, aggiornataIl: now };
  return promisify((await store('schede', 'readwrite')).put(record));
}

export async function eliminaScheda(id) {
  return promisify((await store('schede', 'readwrite')).delete(id));
}

// ---- Progressi ----
export async function aggiungiProgresso({ esercizioKey, schedaId, kg, serie, ripetizioni, data }) {
  const record = {
    esercizioKey, schedaId, kg, serie, ripetizioni,
    data: data ?? new Date().toISOString().slice(0, 10),
  };
  return promisify((await store('progressi', 'readwrite')).add(record));
}

// Ultimo progresso registrato per un esercizio (usato quando si crea una nuova scheda).
export async function getUltimoProgresso(esercizioKey) {
  const index = (await store('progressi')).index('esercizio_data');
  const range = IDBKeyRange.bound([esercizioKey, ''], [esercizioKey, '￿']);
  return new Promise((resolve, reject) => {
    const req = index.openCursor(range, 'prev');
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoricoEsercizio(esercizioKey) {
  const index = (await store('progressi')).index('esercizioKey');
  return promisify(index.getAll(esercizioKey));
}

// ---- Backup ----
export async function esportaTutto() {
  return {
    versione: DB_VERSION,
    esportatoIl: new Date().toISOString(),
    schede: await getSchede(),
    progressi: await promisify((await store('progressi')).getAll()),
  };
}
