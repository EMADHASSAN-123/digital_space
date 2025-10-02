// postsApi.js
import { APP_CONFIG } from "../config/appConfig.js";
import { getAuthHeader } from "../auth/auth.js";
import { SUPABASE_URL} from "../supabaseClient.js";

/* ---------- Helpers ---------- */
const fnBase = (fn) => `${SUPABASE_URL}/functions/v1/${fn}`;

/**
 * يحلل استجابة JSON ويعالج الأخطاء
 */
async function handleJsonResponse(res) {
  let body = {};
  const text = await res.text().catch(() => "");

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  
  if (!res.ok) {
    const msg =
      body?.error || body?.message || body?.error_message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

/**
 * يبني الـ headers مع محاولة إضافة التوكن
 */
async function buildHeaders({ json = true, requireAuth = false } = {}) {
  const headers = {};
  if (json) {
    headers["Accept"] = "application/json";
    headers["Content-Type"] = "application/json";
  }

  try {
    const authHeader = await getAuthHeader();
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (!requireAuth) {
      // headers["apikey"] = SUPABASE_ANON_KEY;
    } else {
      throw new Error("Unauthorized");
    }
  } catch (err) {
    if (requireAuth) throw err;
    console.warn("buildHeaders warning:", err.message);
  }

  return headers;
}

/**
 * دالة موحدة لتنفيذ الطلبات
 */
async function makeRequest(url, options = {}) {
  const res = await fetch(url, options);
  return handleJsonResponse(res);
}
 
/* ---------- POSTS ---------- */
export async function listPosts({
  search = "",
  category_id = "",
  page = 1,
  per = APP_CONFIG.PAGE_SIZE,
  with_count = true,
} = {}) {
  const params = new URLSearchParams({
    page: String(Math.max(1, page)),
    per: String(Math.max(1, per)),
    with_count: String(Boolean(with_count)),
  });

  if (category_id && category_id !== "all") params.set("category_id", category_id);
  if (search) params.set("search", search);

  const url = `${fnBase("get-public-posts")}?${params.toString()}`;
  const headers = await buildHeaders({ json: true });

  const body = await makeRequest(url, { method: "GET", headers });

  return {
    posts: body.posts ?? [],
    page: body.page ?? page,
    per: body.per ?? per,
    has_more: body.has_more ?? false,
    total_count: body.total_count ?? Number(body?.total_count || 0),
  };
}

export async function getPost(id) {
  if (!id) throw new Error("getPost: missing id");

  const params = new URLSearchParams({
    page: "1",
    per: "1",
    with_count: "false",
    id,
  });

  const url = `${fnBase("get-public-posts")}?${params}`;
  const headers = await buildHeaders();

  const body = await makeRequest(url, { method: "GET", headers });
  return body.posts?.[0] ?? null;
}

export async function createPost(payload = {}) {
  if (typeof payload !== "object") throw new Error("createPost: invalid payload");

  const url = fnBase("create-post");
  const headers = await buildHeaders({ json: true });

  const body = await makeRequest(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return body.post ?? body;
}

export async function updatePost(id, payload = {}) {
  if (!id) throw new Error("updatePost: missing id");
  if (typeof payload !== "object") throw new Error("updatePost: invalid payload");

  const url = fnBase("update-post");
  const headers = await buildHeaders({ json: true });

  const body = await makeRequest(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ id, changes: payload }),
  });

  return body.post ?? body;
}

export async function deletePost(id) {
  if (!id) throw new Error("deletePost: missing id");

  const url = fnBase("delete-post");
  const headers = await buildHeaders({ json: true });

  const body = await makeRequest(url, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ id }),
  });

  return { success: !!body?.success, raw: body };
}

/* ---------- CATEGORIES ---------- */
export async function listCategories() {
  const url = fnBase("get-categories");
  try {
    const body = await makeRequest(url, { method: "GET", cache: "no-store" });
    return body.categories ?? [];
  } catch (err) {
    console.error("listCategories error:", err);
    return [];
  }
}

export async function createCategory(payload = {}) {
  if (!payload?.name) throw new Error("createCategory: invalid payload");

  const url = fnBase("create-category");
  // لا نحتاج requireAuth بعد الآن
  const headers = await buildHeaders({ json: true, requireAuth: false });

  const body = await makeRequest(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  // الباكيند الآن يعيد { category: {...} }
  return body.category ?? body;
}
/* ---------- CATEGORIES ---------- */
export async function deleteCategory(id) {
  if (!id) throw new Error("deleteCategory: missing id");

  const url = fnBase("delete-category"); // اسم Edge Function
  const headers = await buildHeaders({ json: true, requireAuth: true });
 
  const body = await makeRequest(url, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ id }),
  });

  return body.success ?? false;
}