import { fetchComments, createComment } from "../../../admin/assets/js/api/commentsApi.js";
const CACHE_PREFIX = "comments-";

/**
 * جلب التعليقات (أولاً من الكاش، ثم من السيرفر إذا لزم الأمر)
 */
export async function getComments(postId) {
  const cached = loadCommentsFromCache(postId);
  if (cached && cached.length) return cached;

  const res = await fetchComments({ postId, page: 1, per: 200 });
  const comments = res?.comments ?? [];
  saveCommentsToCache(postId, comments);
  return comments;
}

/**
 * إضافة تعليق جديد
 */
export async function addComment(postId, content) {
  const res = await createComment({ post_id: postId, content });
  const newComment = res?.comment ?? res;
  mergeCommentsInCache(postId, [newComment]);
  return newComment;
}

/**
 * إضافة رد على تعليق
 */
export async function addReply(postId, parentId, content) {
  const res = await createComment({ post_id: postId, content, parent_id: parentId });
  const reply = res?.comment ?? res;
  mergeCommentsInCache(postId, [reply]);
  return reply;
}

/* ----- Helpers للكاش ----- */
function saveCommentsToCache(postId, comments) {
  try { sessionStorage.setItem(`${CACHE_PREFIX}${postId}`, JSON.stringify(comments)); } catch {}
}

function loadCommentsFromCache(postId) {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${postId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function mergeCommentsInCache(postId, newComments) {
  const existing = loadCommentsFromCache(postId);
  const map = new Map();
  [...newComments, ...existing].forEach(c => map.set(c.id, c));
  const merged = Array.from(map.values()).sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );
  saveCommentsToCache(postId, merged);
  return merged;
}