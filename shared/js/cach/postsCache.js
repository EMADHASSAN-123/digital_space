import { listPosts, getPost } from "../../../admin/assets/js/api/postsApi.js";

/* ---------- Memory Cache ---------- */
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
      memoryCache[key] = parsed;
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
 * ويدعم callback لتحديث العرض فور وصول البيانات الجديدة
 * @param {Function} fetcher - دالة fetch من API
 * @param {string} key - مفتاح الكاش
 * @param {Function} [callback] - دالة لتحديث العرض عند وصول البيانات الجديدة
 */
async function revalidateCache(fetcher, key, callback) {
  try {
    const freshData = await fetcher();
    saveCache(key, freshData);
    if (callback && typeof callback === "function") callback(freshData);
  } catch (e) {
    console.warn("Failed to revalidate cache:", e);
  }
}

/**
 * Fetch ذكي مع الكاش: يتحقق من الكاش أولاً، ثم fetch إذا لم يكن موجودًا
 * يدعم stale-while-revalidate و callback لتحديث العرض
 * @param {Function} fetcher - دالة fetch من API
 * @param {string} key - مفتاح الكاش
 * @param {boolean} forceRefresh - فرض جلب جديد من السيرفر
 * @param {Function} [callback] - دالة لتحديث العرض عند وصول بيانات جديدة
 * @returns {Promise<any>}
 */
export async function fetchWithCache(fetcher, key, forceRefresh = false, callback) {
  if (!forceRefresh) {
    const cached = checkCache(key);
    if (cached) {
      // تحديث خلفي بدون انتظار المستخدم
      revalidateCache(fetcher, key, callback);
      return cached;
    }
  }

  // Fetch مباشر من السيرفر
  const data = await fetcher();
  saveCache(key, data);
  if (callback && typeof callback === "function") callback(data);
  return data;
}

/* ---------- Wrapped API Functions with Cache ---------- */

/**
 * جلب البوستات مع دعم الكاش
 * @param {object} options - خيارات الجلب (فئة، عدد، صفحة...)
 * @param {boolean} forceRefresh - فرض تحديث البيانات
 * @param {Function} [callback] - دالة لتحديث العرض عند وصول بيانات جديدة
 * @returns {Promise<any>}
 */
export async function listPostsCached(options = {}, forceRefresh = false, callback) {
  const key = generateCacheKey("posts", options);
  return fetchWithCache(() => listPosts(options), key, forceRefresh, callback);
}

/**
 * جلب بوست واحد مع دعم الكاش
 * @param {string|number} id - معرف البوست
 * @param {boolean} forceRefresh - فرض تحديث البيانات
 * @param {Function} [callback] - دالة لتحديث العرض عند وصول بيانات جديدة
 * @returns {Promise<any>}
 */
export async function getPostCached(id, forceRefresh = false, callback) {
  if (!id) throw new Error("getPostCached: missing id");
  const key = generateCacheKey("post", { id });
  return fetchWithCache(() => getPost(id), key, forceRefresh, callback);
}

/* ---------- Utilities إضافية ---------- */

/**
 * مسح الكاش بالكامل أو حسب المفتاح
 * @param {string} [key] - إذا تم تمريره، يمسح الكاش لمفتاح معين
 */
export function clearCache(key) {
  if (key) {
    delete memoryCache[key];
    sessionStorage.removeItem(key);
  } else {
    Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
    sessionStorage.clear();
  }
}
