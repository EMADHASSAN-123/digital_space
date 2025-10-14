// إنشاء الحاوي للتوستات (مرة واحدة فقط)
let toastRoot = document.getElementById("toastRoot");
if (!toastRoot) {
  toastRoot = document.createElement("div");
  toastRoot.id = "toastRoot";
  toastRoot.className = "fixed top-4 right-4 flex flex-col items-end gap-2 z-50";
  document.body.appendChild(toastRoot);
}

/**
 * showToast - عرض رسالة منبثقة
 * @param {string} msg - نص الرسالة
 * @param {"info"|"success"|"error"|"warning"} type - نوع الرسالة
 * @param {Object} options - خيارات إضافية
 * @param {number} options.timeout - وقت العرض بالمللي ثانية
 * @param {string} options.actionText - نص زر الإجراء
 * @param {Function} options.actionHandler - دالة عند الضغط على الزر
 */
export function showToast(msg, type = "info", options = {}) {
  const { timeout = 4000, actionText, actionHandler } = options;

  const toast = document.createElement("div");
  toast.className =
    "flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg text-white w-fit max-w-sm transform transition-all duration-300 opacity-0 translate-x-20";

  // لون الخلفية حسب النوع
  switch (type) {
    case "success":
      toast.classList.add("bg-green-600");
      break;
    case "error":
      toast.classList.add("bg-red-600");
      break;
    case "warning":
      toast.classList.add("bg-yellow-400", "text-black");
      break;
    default:
      toast.classList.add("bg-gray-800");
  }

  // نص الرسالة
  const messageEl = document.createElement("span");
  messageEl.textContent = msg;
  toast.appendChild(messageEl);

  // زر الإجراء (اختياري)
  if (actionText && typeof actionHandler === "function") {
    const button = document.createElement("button");
    button.textContent = actionText;
    button.className =
      "ml-3 px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-40 transition text-sm font-medium";
    button.onclick = () => {
      actionHandler();
      toast.remove();
    };
    toast.appendChild(button);
  }

  toastRoot.appendChild(toast);

  // تأثير دخول بعد إضافة الرسالة
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-x-20");
    toast.classList.add("opacity-100", "translate-x-0");
  });

  // إزالة الرسالة بعد المهلة
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-x-20");
    setTimeout(() => toast.remove(), 300);
  }, timeout);
}


