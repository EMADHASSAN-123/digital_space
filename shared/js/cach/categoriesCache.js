// categoriesCache.js
import { listCategories } from "../../../admin/assets/js/api/postsApi.js";

 
/* ---------- Memory Cache ---------- */
const memoryCache = {};

/* ---------- Helpers ---------- */

function generateCacheKey(prefix, params = {}) {
  return `${prefix}_${JSON.stringify(params)}`;
}

export function checkCache(key) {
  if (memoryCache[key]) return memoryCache[key];

  const cached = sessionStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      memoryCache[key] = parsed;
      return parsed;
    } catch (e) {
      console.warn("Failed to parse cached data:", e);
      return null;
    }
  }
  return null;
} 

export function saveCache(key, data) {
  memoryCache[key] = data;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save data to sessionStorage:", e);
  }
}

async function revalidateCache(fetcher, key) {
  try {
    const freshData = await fetcher();
    saveCache(key, freshData);
  } catch (e) {
    console.warn("Failed to revalidate cache:", e);
  }
} 

export async function fetchWithCache(fetcher, key) {
  const cached = checkCache(key);
  if (cached) {
    // تحديث خلفي
    revalidateCache(fetcher, key);
    return cached;
  }
  const data = await fetcher();
  saveCache(key, data);
  return data;
} 
  
/* ---------- Wrapped API Function ---------- */

export async function listCategoriesCached() {
  const key = generateCacheKey("categories");
  return fetchWithCache(() => listCategories(), key);
}
