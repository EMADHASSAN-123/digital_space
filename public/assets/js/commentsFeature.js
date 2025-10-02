// public/assets/js/commentsFeature.js
// import { fetchComments, createComment } from "../../../admin/assets/js/api/commentsApi.js";
import { getCurrentUser } from "../../../admin/assets/js/auth/auth.js";
import { escapeHtml, formatDate } from "../../../shared/js/ui/helpers.js";
import { showToast } from  "../../../shared/js/ui/toast.js";
import * as CommentsCache from "../../../shared/js/cach/commentsCache.js";


/* =========================================================
   ✨ أدوات مساعدة لعرض التعليقات (UI Helpers)
========================================================= */
function renderCommentHtml(c) {
  const name = (c.author?.name || c.author?.full_name) || c.user_name || "مستخدم";
  const time = formatDate(c.created_at);
  const likes = c.metadata?.likes ?? 0;
  const replies = c.replies_count ?? 0;

  return `
    <div class="p-4 bg-white dark:bg-gray-900 rounded-md shadow-sm border-l-4 border-primary hover:shadow-md transition comment-item" data-id="${escapeHtml(c.id)}">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-200">
            ${escapeHtml(name.charAt(0).toUpperCase())}
          </div>
        </div>
        <div class="flex-1">
          <div class="flex items-start justify-between">
            <div>
              <div class="font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(name)}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500">${escapeHtml(time)}</div>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">${replies ? replies + " رد" : ""}</div>
          </div>
          <div class="mt-3 text-gray-700 dark:text-gray-200 whitespace-pre-wrap">${escapeHtml(c.content)}</div>
          <div class="mt-3 flex gap-4 text-sm">
            <button class="reply-btn flex items-center gap-2 text-gray-500 hover:text-primary" type="button">
              <i class="fas fa-reply"></i><span>رد</span>
            </button>
            <button class="like-btn flex items-center gap-2 text-gray-500 hover:text-primary" type="button">
              <i class="fas fa-thumbs-up"></i><span class="likes-count">${likes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   ✨ المكوّن الرئيسي للتعليقات
========================================================= */
export async function initCommentsSection(postId) {
  if (!postId) return console.warn("initCommentsSection: postId missing");

  // عناصر DOM
  const section   = document.getElementById("comments-section");
  const listEl    = document.getElementById("comments-list");
  const input     = document.getElementById("comment-input");
  const submitBtn = document.getElementById("comment-submit");
  const form      = document.getElementById("comment-form");
  const countEl   = document.getElementById("commentsCount");

  if (!section || !listEl) {
    console.warn("initCommentsSection: missing DOM nodes (comments-section or comments-list)");
    return;
  }
  section.classList.remove("hidden");
 
  /* ---------- التحقق من تسجيل الدخول ---------- */
  let currentUser = null;
  try { currentUser = await getCurrentUser(); } catch {}
  const isAuthenticated = !!currentUser;

  if (!isAuthenticated) setupLoginBanner();
  else setupWelcomeNote();

  /* ---------- تحميل التعليقات ---------- */
  async function loadComments() {
    listEl.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center">جارٍ تحميل التعليقات...</p>`;
    try {
      const comments = await CommentsCache.getComments(postId, { page: 1, per: 20 });
      updateCommentsList(comments);
    } catch (err) {
      console.error("loadComments error", err);
      listEl.innerHTML = `<p class="text-red-500 text-center">فشل تحميل التعليقات.</p>`;
      showToast("فشل تحميل التعليقات", { type: "error" });
    }
  }

  /* ---------- إرسال تعليق جديد ---------- */
  async function submitNewComment() {
    if (!isAuthenticated) return redirectToLogin();

    const content = (input?.value || "").trim();
    if (!content) return showToast("اكتب تعليقاً قبل الإرسال", { type: "error" });

    const orig = submitBtn?.innerHTML;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = "جـارٍ الإرسـال..."; }

    try {
      const newComment = await CommentsCache.addComment(postId, content);
      prependComment(newComment);
      input.value = "";
      showToast("تم إضافة التعليق", { type: "success" });
    } catch (err) {
      console.error("create comment error", err);
      showToast("فشل إرسال التعليق", { type: "error" });
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = orig; }
    }
  }

  /* ---------- UI Helpers داخل المكون ---------- */
  function setupLoginBanner() { /* نفس الكود عندك مع التبسيط */ }
  function setupWelcomeNote() { /* رسالة ترحيبية */ }

  function redirectToLogin() {
    showToast("يجب تسجيل الدخول أولاً", { type: "error" });
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    setTimeout(() => window.location.href = `../shared/login.html?next=${next}`, 800);
  }

  function updateCommentsList(comments) {
    if (countEl) countEl.textContent = `${comments.length} تعليق${comments.length === 1 ? "" : "ات"}`;

    if (!comments.length) {
      listEl.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center">لا توجد تعليقات بعد. كن أول من يعلق!</p>`;
      return;
    }

    listEl.innerHTML = "";
    comments.forEach(c => appendComment(c));
  }

  function appendComment(c) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderCommentHtml(c);

    const el = wrapper.firstElementChild;
    bindCommentActions(el, c.id);
    listEl.appendChild(el);
  }

  function prependComment(c) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderCommentHtml(c);

    const el = wrapper.firstElementChild;
    bindCommentActions(el, c.id);
    listEl.insertBefore(el, listEl.firstChild);

    if (countEl) {
      const cur = Number((countEl.textContent || "0").replace(/\D/g, "")) || 0;
      countEl.textContent = `${cur + 1} تعليق${cur + 1 === 1 ? "" : "ات"}`;
    }
  }

  function bindCommentActions(el, commentId) {
    const replyBtn = el.querySelector(".reply-btn");
    const likeBtn  = el.querySelector(".like-btn");
    const likesEl  = el.querySelector(".likes-count");

    replyBtn?.addEventListener("click", () => openReplyBox(el, commentId));
    likeBtn?.addEventListener("click", () => { if (likesEl) likesEl.textContent = Number(likesEl.textContent || 0) + 1; });
  }

  async function openReplyBox(commentNode, parentId) {
    if (!isAuthenticated) return redirectToLogin();
    if (commentNode.querySelector(".reply-box")) return;

    const box = document.createElement("div");
    box.className = "reply-box mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded";
    box.innerHTML = `
      <textarea class="reply-textarea w-full p-2 border border-gray-300 dark:border-gray-700 rounded" rows="3" placeholder="اكتب ردك..."></textarea>
      <div class="flex gap-2 justify-end mt-2">
        <button class="btn-cancel px-3 py-1 rounded border" type="button">إلغاء</button>
        <button class="btn-send px-3 py-1 rounded bg-primary text-white" type="button">إرسال</button>
      </div>
    `;

    const ta = box.querySelector(".reply-textarea");
    const cancel = box.querySelector(".btn-cancel");
    const send = box.querySelector(".btn-send");

    cancel.addEventListener("click", () => box.remove());
    send.addEventListener("click", async () => {
      const content = ta.value.trim();
      if (!content) return showToast("اكتب نص الرد", { type: "error" });

      send.disabled = true;
      try {
        await CommentsCache.addComment(postId, content, parentId);
        showToast("تم إرسال الرد", { type: "success" });
        box.remove();
        await loadComments();
      } catch (err) {
        console.error("reply error", err);
        showToast("فشل إرسال الرد", { type: "error" });
        send.disabled = false;
      }
    });

    commentNode.appendChild(box);
    ta.focus();
  }

  /* ---------- Events ---------- */
  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => { e.preventDefault(); submitNewComment(); });
  } else if (form) {
    form.addEventListener("submit", (e) => { e.preventDefault(); submitNewComment(); });
  }

  // تشغيل أول تحميل
  await loadComments();
}