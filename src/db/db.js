const DB_NAME = 'instagram-local';
const DB_VERSION = 1;

const DEFAULT_PROFILE = {
  username: 'your_username',
  displayName: 'Your Name',
  avatarBlob: null,
  bio: '',
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile');
      }
      if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function store(db, name, mode) {
  return db.transaction(name, mode).objectStore(name);
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getProfile() {
  const db = await openDB();
  const result = await reqToPromise(store(db, 'profile', 'readonly').get('me'));
  return result ?? { ...DEFAULT_PROFILE };
}

export async function saveProfile(profile) {
  const db = await openDB();
  await reqToPromise(store(db, 'profile', 'readwrite').put(profile, 'me'));
  return profile;
}

export async function addPost(post) {
  const db = await openDB();
  await reqToPromise(store(db, 'posts', 'readwrite').put(post));
  return post;
}

export async function getPosts() {
  const db = await openDB();
  const all = await reqToPromise(store(db, 'posts', 'readonly').getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePost(id) {
  const db = await openDB();
  await reqToPromise(store(db, 'posts', 'readwrite').delete(id));
}

export async function addPosts(list) {
  const db = await openDB();
  const tx = db.transaction('posts', 'readwrite');
  const st = tx.objectStore('posts');
  for (const p of list) st.put(p);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAll() {
  dbPromise = null;
  const db = await openDB();
  const tx = db.transaction(['profile', 'posts'], 'readwrite');
  tx.objectStore('profile').clear();
  tx.objectStore('posts').clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
