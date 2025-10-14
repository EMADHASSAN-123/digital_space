//api\commentsApi.js

/* ----- مساعدة fetch مع Authorization ----- */
 
import {getAuthHeader} from '../auth/auth.js';
import {SUPABASE_ANON_KEY } from "../supabaseClient.js";
import { showToast } from '../../../../shared/js/ui/toast.js';

const BASE_PATH ="https://ugswbpfwmaoztigppacu.supabase.co/functions/v1/";
 
async function fetchWithAuth(url, opts = {}) {
  const headers = Object.assign({}, opts.headers || {});
  try {
    const authHeader = await getAuthHeader();
    if (authHeader) headers['Authorization'] = authHeader;
  } catch (e) {
    console.warn('getAuthHeader failed', e);
  }

  // اضبط Content-Type إن لم يكن body من نوع FormData
  if (!headers['Content-Type'] && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, Object.assign({}, opts, { headers, mode: 'cors' }));
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { /* non-json */ }

  if (!res.ok) {
    const err = new Error((json && (json.error || json.message)) || res.statusText || 'Request failed');
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

/* ----- API functions ----- */

/**
 * fetchComments({ postId, page = 1, per = 10, status })
 * returns { comments, page, per, total_count }
 * note: Edge fn requires post_id (uuid)
 */
export async function fetchComments( { postId, page = 1, per = 10, status = null } ) {
  const params = new URLSearchParams({
    post_id: postId,
    page,
    per,
  });

  if (status) params.append("status", status);

  const res = await fetch(
    `${BASE_PATH}fetch-comments?${params}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 👇 أضف هذا السطر المهم
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch comments");
  return await res.json();
}

/**
 * createComment({ post_id, content, parent_id? })
 * requires authentication (Authorization header)
 * returns { comment }
 */
export async function createComment({ post_id, content, parent_id = null } = {}) {
  if (!post_id) throw new Error('post_id is required');
  if (!content || !String(content).trim()) throw new Error('content is required');
  const body = { post_id, content: String(content).trim() };
  if (parent_id) body.parent_id = parent_id;
  return await fetchWithAuth(`${BASE_PATH}add-Comment`, { method: 'POST', body: JSON.stringify(body) });
}

/**
 * editComment({ id, content })
 * Owner or admin can edit. returns { comment }
 */
export async function editComment({ id, content } = {}) {
  if (!id) throw new Error('id is required');
  if (!content || !String(content).trim()) throw new Error('content is required');
  const body = { id, content: String(content).trim() };
  return await fetchWithAuth(BASE_PATH, { method: 'PATCH', body: JSON.stringify(body) });
}

/**
 * deleteComment({ id })
 * soft-delete — requires auth (owner or admin)
 * returns { comment }
 */
/**
 * حذف تعليق
 * @param {Object} options
 * @param {string} options.id - معرف التعليق
 * @param {HTMLElement} options.commentEl - العنصر HTML للتعليق المراد حذفه
 */
export async function deleteComment({ id, commentEl }) {
  if (!id) throw new Error("id is required");

  try {
    const url = new URL(`${BASE_PATH}delete-Comment`);
    url.searchParams.set("id", id);

    const res = await fetchWithAuth(url.toString(), { method: "DELETE" });

    if (res?.success) {
      // إزالة التعليق من الصفحة مباشرة
      if (commentEl && commentEl.parentNode) {
        commentEl.remove();
      }
      showToast("تم حذف التعليق بنجاح!", "success");
    } else {
      showToast(res?.error || "فشل حذف التعليق.", "error");
    }
  } catch (error) {
    if (error.status === 403) {
      showToast("غير مصرح لك بحذف هذا التعليق.", "warning");
    } else if (error.status === 401) {
      showToast("يجب تسجيل الدخول أولاً.", "warning", {
        actionText: "تسجيل الدخول",
        actionHandler: () => {
          window.location.href = APP_CONFIG.LOGIN_PAGE;
        },
      });
    } else {
      console.error("خطأ أثناء حذف التعليق:", error);
      showToast(error.message || "حدث خطأ أثناء حذف التعليق.", "error");
    }
  }
}

 
/**
 * adminUpdateStatus({ id, action = null, status = null })
 * Examples:
 *   adminUpdateStatus({ id, action: 'approve' })
 *   adminUpdateStatus({ id, status: 'hidden' })
 * Requires admin privileges on server side (Edge Function checks isAdmin).
 * returns { comment }
 */
export async function adminUpdateStatus({ id, action = null, status = null } = {}) {
  if (!id) throw new Error('id is required');
  const body = { id };
  if (action) body.action = action;
  if (status) body.status = status;
  return await fetchWithAuth(`${BASE_PATH}update-Comment-Status`, { method: 'PATCH', body: JSON.stringify(body) });
}