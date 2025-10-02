// assets/js/ui/helpers.js

/**
 * escapeHtml - يحمي النصوص من XSS عند إدراجها في DOM
 * @param {string} s - النص المراد تنقيته
 * @returns {string} النص بعد تحويل الرموز الخاصة إلى كيانات HTML
 */
export function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * escapeAttr - يحمي القيم المستخدمة في خصائص العناصر (Attributes)
 * @param {string} s - النص المراد تنقيته
 * @returns {string} النص بعد التحويل
 */
export function escapeAttr(s = "") {
  return escapeHtml(String(s));
}
 
/**
 * formatDate - تنسيق التاريخ بصيغة عربية قصيرة
 * @param {string|Date} dateStr - تاريخ يمكن أن يكون نص أو كائن Date
 * @param {Object} options - خيارات إضافية لتنسيق التاريخ
 * @returns {string} التاريخ المنسق
 */ 
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return "";
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
  try {
    return d.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    });
  } catch (e) {
    return d.toLocaleDateString();
  }
}

/**
 * guessExcerpt - استخراج مقتطف من المحتوى للنصوص الطويلة
 * @param {string} content - محتوى النص (قد يحتوي HTML)
 * @param {number} length - طول المقتطف المطلوب (افتراضي 160)
 * @returns {string} المقتطف
 */
export function guessExcerpt(content = "", length = 160) {
  if (!content) return "";
  const tmp = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return tmp.length > length ? tmp.slice(0, length - 3) + "..." : tmp;
}
