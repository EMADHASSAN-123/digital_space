// notifications.js

let loadingEl = null;

/**
 * إظهار رسالة نجاح
 * @param {string} message 
 */
export function showSuccess(message) {
  showToast(message, "success");
}

/**
 * إظهار رسالة خطأ
 * @param {string} message 
 */
export function showError(message) {
  showToast(message, "error");
}

/**
 * إظهار رسالة تحميل (loading)
 * مع سبينر متحرك
 */
export function showLoading(message = "جاري التحميل...") {
  if (loadingEl) return; // لا تكرر
  loadingEl = document.createElement("div");
  loadingEl.className = "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow bg-blue-600 text-white animate-pulse";
  loadingEl.innerHTML = `
    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span>${message}</span>
  `;
  document.body.appendChild(loadingEl);
}

/**
 * إخفاء رسالة التحميل
 */
export function hideLoading() {
  if (loadingEl) {
    loadingEl.remove();
    loadingEl = null;
  }
}

/**
 * دالة داخلية لإظهار toast عام
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");

  // الألوان حسب النوع
  let bgColor = type === "success" ? "bg-green-600" : "bg-red-600";

  toast.className = `
    fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow text-white ${bgColor}
    transform transition-all duration-300 opacity-0 translate-y-2
  `;
  toast.innerText = message;

  document.body.appendChild(toast);

  // تشغيل الأنيميشن
  setTimeout(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
  }, 50);

  // إخفاء بعد 3 ثواني
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
