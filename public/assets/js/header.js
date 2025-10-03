import { getCurrentUser, signOut } from "../../../admin/assets/js/auth/auth.js";
import { listPostsCached } from "../../../shared/js/cach/postsCache.js";
import {APP_CONFIG} from "../../../admin/assets/js/config/appConfig.js";
 
export const Header = (() => {
  async function render() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const user = await getCurrentUser();

    header.innerHTML = `
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
      
      <header class="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#161616] via-[#1f1f1f] to-[#161616] dark:bg-gray-900 shadow-md backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <!-- الشعار -->
            <div class="flex-shrink-0 flex items-center gap-2">
              <span class="text-xl font-bold text-[#d0b16b]">مساحتي</span>
            </div>

            <!-- روابط التنقل Desktop -->
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-200">
              <a href="${APP_CONFIG.INDEX_PAGE}" class="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                <i class="fa-solid fa-home"></i>
                الرئيسية
              </a>
              <a href="${APP_CONFIG.INDEX_PAGE}#categories-bar" class="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                <i class="fa-solid fa-newspaper"></i>
                منشوراتي
              </a>
              <a href="${APP_CONFIG.RESOURCES_PAGE}" class="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                 <i class="fa-solid fa-book"></i>
                مكتبة الموارد
              </a>
              <a href="${APP_CONFIG.ADMIN_PAGE}" class="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                <i class="fa-solid fa-cogs"></i>
                إدارة
              </a>
            </nav>

            <!-- البحث Desktop -->
            <div class="hidden md:block w-1/3 relative group">
              <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 group-focus-within:text-yellow-400">
                <i class="fa-solid fa-magnifying-glass text-gray-400 group-focus-within:text-yellow-400"></i>
              </span>
              <input id="search-input-desktop" type="text" placeholder="ابحث..."
                class="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-700 
                       bg-[#1f1f1f] text-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 
                       transition-colors duration-300">
              <button id="clear-search-desktop" 
                class="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-red-500 hidden">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <div id="search-suggestions-desktop"
                class="absolute w-full bg-[#161616] shadow-lg rounded-lg mt-1 hidden z-50 max-h-80 overflow-y-auto"></div>
            </div>

            <!-- الأزرار (الوضع + المستخدم + القائمة الجوالية) -->
            <div class="flex items-center gap-4">
              <!-- زر الوضع -->
              <button id="theme-toggle" aria-label="Toggle dark mode"
                class="p-2 rounded-lg hover:bg-gray-700 transition-transform duration-300">
                <i id="theme-icon" class="fa-solid fa-moon text-yellow-400"></i>
              </button>

              <!-- المستخدم -->
              <div class="relative">
                <button id="user-btn" aria-haspopup="true" aria-expanded="false"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700">
                  <span class="text-sm text-gray-200">
                    ${user ? (user.email ?? "حسابي") : "حسابي"}
                  </span>
                 <i class="fa-solid fa-user text-gray-200"></i>
                </button>
                <div id="user-dropdown"
                  class="absolute right-0 mt-2 w-48 bg-[#1f1f1f] border border-gray-700 rounded-lg shadow hidden">
                  ${
                    user
                      ? `
                        <a href="${APP_CONFIG.PROFILE_PAGE}?id=${user.id}" class="block px-4 py-2 text-sm hover:bg-gray-700">الملف الشخصي</a>
                        <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-700">تسجيل الخروج</button>
                      `
                      : `
                        <a href="${APP_CONFIG.LOGIN_PAGE}" class="block px-4 py-2 text-sm hover:bg-gray-700">تسجيل الدخول</a>
                        <a href="${APP_CONFIG.SINGUp_PAGE}" class="block px-4 py-2 text-sm hover:bg-gray-700">إنشاء حساب</a>
                      `
                  }
                </div>
              </div>

              <!-- زر القائمة للجوال -->
              <button id="mobile-menu-toggle" aria-controls="mobile-menu" aria-expanded="false"
                class="md:hidden p-2 rounded-lg hover:bg-gray-700">
               <i class="fa-solid fa-bars text-gray-200"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- القائمة للجوال -->
        <nav id="mobile-menu" class="md:hidden hidden px-4 pb-4 space-y-2 bg-[#161616]">
          <div class="relative mb-3">
            <input id="search-input-mobile" type="text" placeholder="ابحث..."
              class="w-full px-3 py-2 rounded-lg border border-gray-700 bg-[#1f1f1f] text-gray-200 text-sm focus:ring-2 focus:ring-yellow-400">
            <div id="search-suggestions-mobile" class="absolute w-full bg-[#1f1f1f] shadow-lg rounded-lg mt-1 hidden z-50 max-h-80 overflow-y-auto"></div>
          </div>
          <a href="${APP_CONFIG.INDEX_PAGE}" class="block px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-home"></i> الرئيسية
          </a>
          <a href="${APP_CONFIG.INDEX_PAGE}#categories-bar" class="block px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-newspaper"></i> منشوراتي
          </a>
          <a href="${APP_CONFIG.RESOURCES_PAGE}" class="block px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-book"></i> مكتبة الموارد
          </a>
          <a href="${APP_CONFIG.SINGUp_PAGE}" class="block px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-cogs"></i> إدارة
          </a>
        </nav>
      </header>
    `;
  }

  function bindEvents() {
    // الوضع الداكن
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
      });
    }

    // قائمة المستخدم
    const userBtn = document.getElementById("user-btn");
    const userDropdown = document.getElementById("user-dropdown");
    if (userBtn && userDropdown) {
      userBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const expanded = userBtn.getAttribute("aria-expanded") === "true";
        userBtn.setAttribute("aria-expanded", !expanded);
        userDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", (e) => {
        if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.add("hidden");
          userBtn.setAttribute("aria-expanded", "false");
        }
      });
    }

    // تسجيل الخروج
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut();
        location.reload();
      });
    }

    // القائمة الجوالية
    const mobileToggle = document.getElementById("mobile-menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener("click", () => {
        const expanded = mobileToggle.getAttribute("aria-expanded") === "true";
        mobileToggle.setAttribute("aria-expanded", !expanded);
        mobileMenu.classList.toggle("hidden");
      });
    }

    // البحث
    setupSearch("search-input-desktop", "search-suggestions-desktop");
    setupSearch("search-input-mobile", "search-suggestions-mobile");

    // مسح البحث Desktop
    const inputDesktop = document.getElementById("search-input-desktop");
    const clearBtnDesktop = document.getElementById("clear-search-desktop");
    if (inputDesktop && clearBtnDesktop) {
      inputDesktop.addEventListener("input", () => {
        clearBtnDesktop.classList.toggle("hidden", inputDesktop.value.trim() === "");
      });
      clearBtnDesktop.addEventListener("click", () => {
        inputDesktop.value = "";
        clearBtnDesktop.classList.add("hidden");
        inputDesktop.focus();
        document.getElementById("search-suggestions-desktop").classList.add("hidden");
      });
    }
  }

  async function setupSearch(inputId, suggestionsId) {
    const inputEl = document.getElementById(inputId);
    const suggestionsEl = document.getElementById(suggestionsId);
    if (!inputEl || !suggestionsEl) return;

    const posts = await listPostsCached();
    const postsArray = posts.posts ?? [];

    inputEl.addEventListener("input", () => {
      const query = inputEl.value.trim();
      if (!query) {
        suggestionsEl.classList.add("hidden");
        suggestionsEl.innerHTML = "";
        return;
      }

      const results = postsArray.filter(post =>
        post.title?.toLowerCase().includes(query.toLowerCase())
      );
      suggestionsEl.innerHTML =
        results.length === 0
          ? `<div class="px-3 py-2 text-sm text-gray-500">لا توجد نتائج</div>`
          : results.map(post => `
            <a href="${APP_CONFIG.POST_PAGE}?id=${post.id}" 
               class="block px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg">
              <div class="font-medium text-gray-900 dark:text-white">${post.title}</div>
              ${post.excerpt ? `<div class="text-xs text-gray-500 truncate">${post.excerpt}</div>` : ""}
            </a>
          `).join("");

      suggestionsEl.classList.remove("hidden");
    });

    inputEl.addEventListener("blur", () => {
      setTimeout(() => suggestionsEl.classList.add("hidden"), 150);
    });
  }

  return {
    async init() {
      await render();
      bindEvents();
    },
  };
})();
