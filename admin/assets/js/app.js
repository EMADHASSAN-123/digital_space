// assets/js/app.js
// ربط التطبيق بالميزات وتهيئة المحتوى

import { initPostsFeature } from "./features/posts.js";
import { initAdminComments, populatePostsFilter } from "./features/comments.js";
import { initCategoriesFeature } from "./features/categories.js";
import { initResourcesFeature } from "./features/resources.js";
import { APP_CONFIG } from "./config/appConfig.js";
import { signOut } from "./auth/auth.js";

async function boot() {
  try {
    // تهيئة الميزات الأساسية (تعمل فقط إذا كانت الـ DOM والعناصر موجودة)
    initPostsFeature();
    initCategoriesFeature();
    // initResourcesFeature(); // إضافة ميزة الموارد

    // تهيئة ميزة التعليقات في لوحة التحكم (ترتبط بزر القسم وتقوم بالـ load عند الفتح)
    try {
      initAdminComments();
    } catch (err) {
      console.warn("initAdminComments failed or not available:", err);
    }

    // محاولة تهيئة نظام الاشعارات (اختياري ــ إذا لديك ملف features/notifications.js)
    // يتم التحميل ديناميكياً حتى لا يفشل الاستيراد إن لم يكن الملف موجودًا
 

    // حاول ملء فلتر البوستات في قسم التعليقات إن وُجد لديك API للبوستات
    // نستخدم import ديناميكي حتى لا يكسر التطبيق إن لم يوجد ملف postsApi.js
    (async () => {
  try {
    const postsApi = await import("./api/postsApi.js");
    let posts = null;

    if (typeof postsApi.listPosts === "function") {
      const result = await postsApi.listPosts({ page: 1, per: 200 });
      posts = result.posts ?? [];
    }

    if (Array.isArray(posts) && posts.length) {
      const normalized = posts.map(p => ({
        id: p.id,
        title: p.title || p.headline || p.slug || `بوست ${p.id}`
      }));
      populatePostsFilter(normalized);
    }
  } catch (err) {
    console.warn("Failed to populate posts filter:", err);
  }
})();

    // عناصر عامة
    document
      .getElementById("logoutButton")
      ?.addEventListener("click", async () => {
        await signOut();
        location.href = `${APP_CONFIG.LOGIN_PAGE}`;
      });

    // ربط منطق تبديل الأقسام
    initSectionsSwitch();

    // ربط البحث العلوي مع البحث الخاص بالبوستات (اختياري)
    initHeaderSearch();

    // تهيئة أيقونات lucide إن رغبت (HTML يستدعي lucide بشكل defer أيضاً)
    try { if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons(); } catch (e) {}

  } catch (err) {
    console.error("boot failed:", err);
  } finally {
    // اخفاء الـ loading overlay في النهاية
    document.getElementById("loadingOverlay")?.remove();
  }
}



function initSectionsSwitch() {
  const buttons = document.querySelectorAll(".show-section");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // إخفاء جميع الأقسام
      document
        .querySelectorAll('[id^="section-"]')
        .forEach((s) => s.classList.add("hidden"));

      // إظهار القسم المطلوب
      const section = btn.dataset.section;
      const target = document.getElementById(`section-${section}`);
      if (target) target.classList.remove("hidden");

      // إبراز الزر الحالي وإزالة الـ active من باقي الأزرار
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if(section === "media"){
        initResourcesFeature();
      }

      // تمرير لأعلى الصفحة
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // تحديد القسم الافتراضي عند تحميل الصفحة (مثلاً: dashboard)
  const defaultSection = document.querySelector('.show-section[data-section="dashboard"]');
  if (defaultSection) defaultSection.click();
}

function initHeaderSearch() {
  const headerSearch = document.getElementById("headerSearchInput");
  const postsSearch = document.getElementById("searchInputPosts");
  if (!headerSearch || !postsSearch) return;
  // ربط البحث العلوي مع البحث في قسم المنشورات
  headerSearch.addEventListener("input", (e) => {
    postsSearch.value = e.target.value;
    postsSearch.dispatchEvent(new Event("input"));
  });
}

boot();
