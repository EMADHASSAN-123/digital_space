// commentsFeature.js
// -----------------------------------------------------------
// طبقة واجهة المستخدم الخاصة بالتعليقات
// تعتمد على api/commentsApi.js (الذي يتصل بـ Edge Function)
// -----------------------------------------------------------

import { fetchComments, createComment } from "../../../admin/assets/js/api/commentsApi.js";
import { supabase } from "../../../admin/assets/js/supabaseClient.js";
import {APP_CONFIG} from "../../../admin/assets/js/config/appConfig.js";
import {getCurrentUser} from "../../../admin/assets/js/auth/auth.js";
import { showToast } from "../../../shared/js/ui/toast.js";
import { renderComment, renderLoginPrompt } from "../../../shared/js/ui/commentsUI.js";

/* ----------------------------------------------------------
   🔐 التحقق من المستخدم الحالي
----------------------------------------------------------- */
// async function getCurrentUser() {
//   try {
//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser();
//     if (error) throw error;
//     return user;
//   } catch (err) {
//     console.warn("فشل جلب المستخدم:", err.message);
//     return null;
//   }
// }

/* ----------------------------------------------------------
   🧹 تنظيف النص وتطهيره من الأكواد
----------------------------------------------------------- */
function sanitizeInput(text) {
  const div = document.createElement("div");
  div.textContent = text.trim();
  return div.innerHTML;
}

/* ----------------------------------------------------------
   ✅ التحقق من صلاحية الإدخال
----------------------------------------------------------- */
function validateComment(text) {
  if (!text || text.trim().length < 3) {
    throw new Error("التعليق قصير جدًا، يجب أن يحتوي على 3 أحرف على الأقل.");
  }
}

/* ----------------------------------------------------------
   📥 تحميل التعليقات الخاصة ببوست معين
----------------------------------------------------------- */
export async function loadComments(postId, containerElement, options = {}) {
  const { page = 1, per = 10 } = options;
  try {
    const data = await fetchComments({ postId, page, per });
    const comments = data.comments || [];
    console.log(comments);
    renderComments(containerElement, comments);
  } catch (error) {
    console.error("خطأ أثناء تحميل التعليقات:", error);
    showToast("تعذر تحميل التعليقات. حاول مجددًا لاحقًا.", "error");
  }
}

/* ----------------------------------------------------------
   🧱 عرض التعليقات في الواجهة
----------------------------------------------------------- */
function renderComments(container, comments) {
  container.innerHTML = "";
  if (!comments || comments.length === 0) {
    container.innerHTML = "<p class='text-gray-500 text-sm'>لا توجد تعليقات بعد.</p>";
    return;
  }
  comments.forEach((comment) => {
    const el = renderComment(comment);
    container.appendChild(el);
  });
}

/* ----------------------------------------------------------
   🔐 تهيئة واجهة قسم التعليقات
----------------------------------------------------------- */
export async function initCommentsSection(postId, containerElement, formElement) {
  if (!postId) {
    console.error("معرف البوست غير موجود!");
    containerElement.innerHTML = "<p class='text-red-500 text-sm'>معرف البوست غير موجود!</p>";
    formElement.style.display = "none";
    return;
  }

  const user =  getCurrentUser();

  // إذا لم يسجل المستخدم الدخول
  if (!user) {
    const loginPrompt = renderLoginPrompt();
    containerElement.prepend(loginPrompt);

    formElement.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showToast("يجب تسجيل الدخول لإضافة تعليق.", "warning", {
        actionText: "تسجيل الدخول",
        actionHandler: () => {
          window.location.href = APP_CONFIG.LOGIN_PAGE;
        },
      });
    });

   loadComments(postId, containerElement);
    return;
  }

  // المستخدم مسجل الدخول ✅
  await loadComments(postId, containerElement);
  setupCommentForm(postId, user, formElement, containerElement);
}

/* ----------------------------------------------------------
   💬 منطق إضافة تعليق جديد (مع حماية Rate Limit)
----------------------------------------------------------- */
const COMMENT_COOLDOWN = 15 * 1000; // 15 ثانية
let lastCommentTime = 0;

function setupCommentForm(postId, user, form, container) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const textarea = form.querySelector("textarea");
    const rawText = textarea.value;

    try {
      const now = Date.now();

      // تحقق من معدل الإرسال (Rate Limit)
      if (now - lastCommentTime < COMMENT_COOLDOWN) {
        showToast("يرجى الانتظار قليلًا قبل إرسال تعليق آخر.", "info");
        return;
      }

      validateComment(rawText);
      const cleanText = sanitizeInput(rawText);

      // عرض التعليق مباشرة في الواجهة (Optimistic UI)
      const tempComment = {
        id: `temp-${now}`,
        post_id: postId,
        user_id: user.id,
profiles: {
    username: user.user_metadata?.username || "مستخدم",
    avatar_url: user.user_metadata?.avatar_url || null,
  },
          content: cleanText,
        status: "pending",
        created_at: new Date().toISOString(),
      };
      const tempEl = renderComment(tempComment, true);
      container.prepend(tempEl);
      textarea.value = "";

      // إرسال التعليق إلى السيرفر بما يتوافق مع اسكيما جدول التعليقات
      const res = await createComment({
        post_id: postId,
        user_id: user.id,
        content: cleanText,
        status: "pending",
      });

      const savedComment = res.comment || res;
      tempEl.replaceWith(renderComment(savedComment));

      lastCommentTime = now;
      showToast("تم إرسال تعليقك بنجاح!", "success");
    } catch (error) {
      console.error("خطأ أثناء إضافة التعليق:", error);
      if (error.status === 401) {
        showToast("يجب تسجيل الدخول لإضافة تعليق.", "warning", {
          actionText: "تسجيل الدخول",
          actionHandler: () => (window.location.href = APP_CONFIG.LOGIN_PAGE),
        });
      } else {
        showToast(error.message || "حدث خطأ أثناء إرسال التعليق.", "error");
      }
    }
  });
}
