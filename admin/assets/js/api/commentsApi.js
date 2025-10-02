/* ----- مساعدة fetch مع Authorization ----- */

import {getAuthHeader} from '../auth/auth.js';

const BASE_PATH ="https://vbnnzmhopcjlkvtuubcj.supabase.co/functions/v1/comments";

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
export async function fetchComments({ postId, page = 1, per = 10, status = null } = {}) {
  if (!postId) throw new Error('postId is required');
  const url = new URL(BASE_PATH);
  url.searchParams.set('post_id', String(postId));
  url.searchParams.set('page', String(page));
  url.searchParams.set('per', String(per));
  if (status) url.searchParams.set('status', String(status));
  return await fetchWithAuth(url.toString(), { method: 'GET' });
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
  return await fetchWithAuth(BASE_PATH, { method: 'POST', body: JSON.stringify(body) });
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
export async function deleteComment({ id } = {}) {
  if (!id) throw new Error('id is required');
  const url = new URL(BASE_PATH);
  url.searchParams.set('id', String(id));
  return await fetchWithAuth(url.toString(), { method: 'DELETE' });
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
  return await fetchWithAuth(BASE_PATH, { method: 'PATCH', body: JSON.stringify(body) });
}