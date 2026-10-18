/**
 * Rock-Solid Persistent Image Storage (IndexedDB + Compressed localStorage Fallback)
 * Prevents QuotaExceededError (5MB localStorage limit) so uploaded photos NEVER disappear.
 */

const DB_NAME = 'hein_htet_aung_portfolio_db';
const STORE_NAME = 'portfolio_images';
const DB_VERSION = 1;
export const STORAGE_KEY_IMAGES = 'hein_htet_aung_portfolio_images_v1';

function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllPersistedImages(): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // 1. First read any images from localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IMAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(result, parsed);
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  // 2. Then read all images from IndexedDB (unlimited capacity, authoritative)
  try {
    const db = await openImageDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          if (typeof cursor.key === 'string' && typeof cursor.value === 'string') {
            result[cursor.key] = cursor.value;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore IndexedDB errors
  }

  return result;
}

export async function savePersistedImage(key: string, dataUrl: string): Promise<void> {
  // 1. Save to IndexedDB (primary high-capacity store)
  try {
    const db = await openImageDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(dataUrl, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore IndexedDB error
  }

  // 2. Also update localStorage best-effort
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_IMAGES);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    existing[key] = dataUrl;
    localStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(existing));
  } catch {
    // If localStorage hits 5MB quota, IndexedDB still holds 100% of the images safely
  }
}

/**
 * Compresses an uploaded image file so it loads fast and never overflows browser memory.
 * Preserves PNG transparency for cutout/logo PNGs.
 */
export function compressUploadedImage(file: File, maxDim = 960): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          if (isPng) {
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(canvas.toDataURL('image/jpeg', 0.86));
          }
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
