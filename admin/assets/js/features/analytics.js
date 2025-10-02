// analytics.js
import { getOverview } from '../api/analyticsApi.js';

export async function initAnalyticsWidget() {
  // تأكد من وجود العنصر قبل محاولة التحديث
  const elTotal = document.getElementById('total-visits');
  if (!elTotal) return;

  try {
    const { total, published, drafts } = await getOverview();
    // مثال بسيط: نعرض الأرقام في الحقول المناسبة
    const totalPostsEl = document.getElementById('total-visits');
    if (totalPostsEl) totalPostsEl.textContent = total ?? 0;

    const recentList = document.getElementById('recentPostsList');
    if (recentList) {
      // يمكن جلب أحدث المنشورات وعرضها — هنا نُبقي Placeholder
      recentList.innerHTML = `<div class="text-gray-300">قائمة آخر التدوينات ستظهر هنا.</div>`;
    }
    // لاحقًا: تهيئة رسوم Chart.js إن أردت (استدعي هنا التهيئة)
  } catch (e) {
    console.error(e);
  }
}
