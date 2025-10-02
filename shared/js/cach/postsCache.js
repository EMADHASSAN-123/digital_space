import { listPosts , getPost } from "../../../admin/assets/js/api/postsApi.js";

const memoryCache = {};

/* ---------- Helpers ---------- */

/**
 * توليد مفتاح فريد للكاش بناءً على اسم الدالة والخيارات
 * @param {string} prefix - اسم الدالة أو نوع البيانات
 * @param {object} params - الباراميترات الخاصة بالدالة
 * @returns {string} - مفتاح فريد للكاش
 */
function generateCacheKey(prefix, params = {}) {
  return `${prefix}_${JSON.stringify(params)}`;
} 
 
/**
 * التحقق من وجود بيانات في الكاش (Memory + SessionStorage)
 * @param {string} key
 * @returns {any|null} البيانات إذا كانت موجودة، أو null
 */
export function checkCache(key) {
  if (memoryCache[key]) return memoryCache[key];

  const cached = sessionStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      memoryCache[key] = parsed; // تحديث الذاكرة
      return parsed;
    } catch (e) {
      console.warn("Failed to parse cached data:", e);
      return null;
    }
  }
  return null;
}

/**
 * حفظ البيانات في الكاش (Memory + SessionStorage)
 * @param {string} key
 * @param {any} data
 */
export function saveCache(key, data) {
  memoryCache[key] = data;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save data to sessionStorage:", e);
  }
} 

/**
 * تحديث الكاش في الخلفية (stale-while-revalidate)
 * @param {Function} fetcher - دالة fetch من API
 * @param {string} key - مفتاح الكاش
 */
async function revalidateCache(fetcher, key) {
  try {
    const freshData = await fetcher();
    saveCache(key, freshData);
  } catch (e) {
    console.warn("Failed to revalidate cache:", e);
  }
}

/**
 * Fetch ذكي مع الكاش: يتحقق من الكاش أولاً، ثم fetch إذا لم يكن موجودًا
 * يدعم stale-while-revalidate
 * @param {Function} fetcher - دالة fetch من API
 * @param {string} key - مفتاح الكاش
 * @returns {Promise<any>}
 */
export async function fetchWithCache(fetcher, key) {
  const cached = checkCache(key);
  if (cached) {
    // تحديث خلفي بدون انتظار المستخدم
    revalidateCache(fetcher, key);
    return cached;
  }

  // إذا لم يكن موجود في الكاش، fetch من السيرفر
  const data = await fetcher();
  saveCache(key, data);
  return data;
}

/* ---------- Wrapped API Functions with Cache ---------- */


/**
 * جلب البوستات مع دعم الكاش
 * @param {object} options
 * @returns {Promise<any>}
 */
export async function listPostsCached(options = {}) {
  const key = generateCacheKey("posts", options);
  return fetchWithCache(() => listPosts(options), key);
}
 
/**
 * جلب بوست واحد مع دعم الكاش
 * @param {string|number} id
 * @returns {Promise<any>}
 */
export async function getPostCached(id) {
  if (!id) throw new Error("getPostCached: missing id");
  const key = generateCacheKey("post", { id });
  return fetchWithCache(() => getPost(id), key);
} 