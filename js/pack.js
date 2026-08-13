/* the killer tv — the narration pack, stored in the browser.

   A static site can't write into /audio, so dropped files live in IndexedDB
   instead. Same origin, so the TV window sees whatever the setup window
   installed, and it survives closing the browser. Drop them once. */

const Pack = (function () {
  const DB = 'killer-tv-audio';
  const STORE = 'clips';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('no indexedDB'));
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  function tx(mode, fn) {
    return open().then((db) => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const req = fn(store);
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
    }));
  }

  const put = (id, blob) => tx('readwrite', (s) => s.put(blob, id));
  const get = (id) => tx('readonly', (s) => s.get(id));
  const del = (id) => tx('readwrite', (s) => s.delete(id));
  const clear = () => tx('readwrite', (s) => s.clear());
  const ids = () => tx('readonly', (s) => s.getAllKeys()).then((k) => k || []);

  /* Turn a dropped filename into a line id: "call_killer.mp3" -> call_killer.
     Tolerates numbering, spaces and case, because file pickers are messy. */
  function idFor(filename) {
    const base = String(filename).replace(/\.[a-z0-9]+$/i, '');
    const cleaned = base.trim().toLowerCase()
      .replace(/^\d+[\s._-]+/, '')
      .replace(/[\s-]+/g, '_');
    if (LINES[cleaned]) return cleaned;
    const loose = cleaned.replace(/[^a-z0-9_]/g, '');
    return LINES[loose] ? loose : null;
  }

  /* Install a FileList / array of Files. Returns what landed and what didn't. */
  function install(files) {
    const list = Array.from(files || []);
    const taken = [], skipped = [];
    const jobs = list.map((file) => {
      const id = idFor(file.name);
      if (!id) { skipped.push(file.name); return Promise.resolve(); }
      taken.push(id);
      return put(id, file);
    });
    return Promise.all(jobs).then(() => ({ taken: taken, skipped: skipped }));
  }

  return { put, get, del, clear, ids, idFor, install, available: 'indexedDB' in window };
})();
