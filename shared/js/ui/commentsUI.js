// commentsUI.js
// -----------------------------------------------------------
// مكونات الواجهة الخاصة بالتعليقات (عرض + إدخال + رسالة تسجيل الدخول)
// متكامل مع commentsFeature.js
// -----------------------------------------------------------

/**
 * 🧱 إنشاء عنصر تعليق واحد في الواجهة
 * @param {Object} comment - بيانات التعليق (id, content, user_name, created_at, status)
 * @param {Boolean} isTemporary - إن كان التعليق مؤقتًا (قبل الحفظ في السيرفر)
 */
export function renderComment(comment, isTemporary = false) {
  const el = document.createElement("div");
  el.className =
    "comment-item p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md mb-3";

  const createdAt = new Date(comment.created_at).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const name = sanitizeText(comment.profiles.username || "مستخدم مجهول");
  const content = sanitizeText(comment.content || "");
  const statusLabel =
    comment.status === "hidden"
      ? `<span class="text-xs text-red-500">مخفي</span>`
      : comment.status === "pending"
      ? `<span class="text-xs text-yellow-500">قيد المراجعة</span>`
      : "";

  el.innerHTML = `
    <div class="flex items-start justify-between">
      <div class="flex items-start space-x-3 space-x-reverse">
        <div class="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-tr from-green-400 to-green-600 text-white flex items-center justify-center font-bold">
          ${name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p class="font-medium text-gray-800 dark:text-gray-100">${name}</p>
          <p class="text-xs text-gray-500">${createdAt}</p>
        </div>
      </div>
      ${
        isTemporary
          ? `<span class="text-sm text-gray-400 italic">جاري الإرسال...</span>`
          : ""
      }
    </div>
    <p class="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed break-words">${content}</p>
  `;

  return el;
}

/**
 * 🧩 عرض رسالة تطلب تسجيل الدخول
 */
export function renderLoginPrompt() {
  const box = document.createElement("div");
  box.className =
    "login-prompt bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-4 text-center";
  box.innerHTML = `
    <p class="text-sm text-gray-800 dark:text-gray-200 mb-2">يرجى تسجيل الدخول للتفاعل مع التعليقات.</p>
    <button
      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
      id="loginRedirectBtn"
    >
      تسجيل الدخول أو إنشاء حساب
    </button>
  `;

  box.querySelector("#loginRedirectBtn").addEventListener("click", () => {
    window.location.href = "/auth/login.html";
  });

  return box;
}

/**
 * 🧼 دالة مساعدة لتنظيف النص من أي أكواد HTML
 */
function sanitizeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
