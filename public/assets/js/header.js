import { getCurrentUser, signOut } from "../../../admin/assets/js/auth/auth.js";
import { listPostsCached } from "../../../shared/js/cach/postsCache.js";
import { APP_CONFIG } from "../../../admin/assets/js/config/appConfig.js";

export const Header = (() => {

  /* ---------- الهيكل الأساسي ---------- */
  function renderSkeleton() {
    const header = document.getElementById("site-header");
    if (!header) return;

    header.innerHTML = `
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
      <header class="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#161616]/95 via-[#1f1f1f]/95 to-[#161616]/95 backdrop-blur-md shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">

            <!-- شعار -->
            <div class="flex-shrink-0 flex items-center gap-2">
              <span class="text-2xl font-bold text-[#d0b16b]">مساحتي</span>
            </div>

            <!-- روابط Desktop -->
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-200">
              <a href="${APP_CONFIG.INDEX_PAGE}" class="flex items-center gap-1 hover:text-yellow-400 transition">
                <i class="fa-solid fa-home"></i> الرئيسية
              </a>
              <a href="${APP_CONFIG.INDEX_PAGE}#categories-bar" class="flex items-center gap-1 hover:text-yellow-400 transition">
                <i class="fa-solid fa-newspaper"></i> منشوراتي
              </a>
              <a href="${APP_CONFIG.RESOURCES_PAGE}" class="flex items-center gap-1 hover:text-yellow-400 transition">
                <i class="fa-solid fa-book"></i> مكتبة الموارد
              </a>
              <a href="${APP_CONFIG.ADMIN_PAGE}" class="flex items-center gap-1 hover:text-yellow-400 transition">
                <i class="fa-solid fa-cogs"></i> إدارة
              </a>
            </nav>

            <!-- البحث Desktop -->
            <div class="hidden md:block w-1/3 relative group">
              <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 group-focus-within:text-yellow-400">
                <i class="fa-solid fa-magnifying-glass"></i>
              </span>
              <input id="search-input-desktop" type="text" placeholder="ابحث..."
                class="w-full pl-10 pr-8 py-2 rounded-xl border border-gray-700 
                       bg-[#1f1f1f]/80 text-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 
                       transition duration-300 outline-none">
              <button id="clear-search-desktop" 
                class="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-red-500 hidden">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <div id="search-suggestions-desktop"
                class="absolute w-full bg-[#161616]/90 shadow-lg backdrop-blur-md rounded-xl mt-1 hidden z-50 max-h-80 overflow-y-auto"></div>
            </div>

            <!-- أزرار المستخدم والوضع الداكن والقائمة الجوالية -->
            <div class="flex items-center gap-4">
              <!-- الوضع الداكن -->
              <button id="theme-toggle" aria-label="Toggle dark mode"
                class="p-2 rounded-lg hover:bg-gray-700 transition-transform duration-300">
                <i id="theme-icon" class="fa-solid fa-moon text-yellow-400"></i>
              </button>

              <!-- المستخدم -->
              <div id="user-placeholder" class="relative text-gray-200">
                <i class="fa-solid fa-spinner fa-spin"></i>
              </div>

              <!-- القائمة الجوال -->
              <button id="mobile-menu-toggle" aria-controls="mobile-menu" aria-expanded="false"
                class="md:hidden p-2 rounded-lg hover:bg-gray-700 transition">
               <i class="fa-solid fa-bars text-gray-200"></i>
              </button>
            </div>

          </div>
        </div>

        <!-- القائمة الجوال -->
        <nav id="mobile-menu" class="md:hidden hidden px-4 pb-4 space-y-2 bg-[#161616]/95 backdrop-blur-md rounded-b-xl">
          <div class="relative mb-3">
            <input id="search-input-mobile" type="text" placeholder="ابحث..."
              class="w-full px-3 py-2 rounded-xl border border-gray-700 bg-[#1f1f1f]/80 text-gray-200 text-sm focus:ring-2 focus:ring-yellow-400">
            <div id="search-suggestions-mobile" class="absolute w-full bg-[#1f1f1f]/90 shadow-lg backdrop-blur-md rounded-xl mt-1 hidden z-50 max-h-80 overflow-y-auto"></div>
          </div>
          <a href="${APP_CONFIG.INDEX_PAGE}" class="block px-3 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-home"></i> الرئيسية
          </a>
          <a href="${APP_CONFIG.INDEX_PAGE}#categories-bar" class="block px-3 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-newspaper"></i> منشوراتي
          </a>
          <a href="${APP_CONFIG.RESOURCES_PAGE}" class="block px-3 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-book"></i> مكتبة الموارد
          </a>
          <a href="${APP_CONFIG.SINGUp_PAGE}" class="block px-3 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-cogs"></i> إدارة
          </a>
        </nav>
      </header>
    `;
  }

  /* ---------- تحديث بيانات المستخدم ---------- */
  async function renderUser() {
    const user = await getCurrentUser();
    const placeholder = document.getElementById("user-placeholder");
    if (!placeholder) return;

    placeholder.innerHTML = user
  ? `
    <div class="relative">
      <button id="user-btn" aria-haspopup="true" aria-expanded="false"
        class="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-700 transition">
        
        <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm">
          ${user.email ? user.email.charAt(0).toUpperCase() : "?"}
        </div>
        
        <span class="hidden sm:inline text-sm">${user.email ? user.email.split("@")[0] : "حسابي"}</span>
      </button>

      <div id="user-dropdown"
        class="absolute right-0 mt-2 mr-5 w-48 bg-[#1f1f1f]/90 border border-gray-700 rounded-xl shadow-lg hidden backdrop-blur-md sm:right-0 translate-x-[-10%] sm:translate-x-0 z-50">
        <a href="${APP_CONFIG.PROFILE_PAGE}?id=${user.id}"
          class="block px-4 py-2 text-sm hover:bg-gray-700 rounded-lg">الملف الشخصي</a>
        <button id="logout-btn"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 rounded-lg">تسجيل الخروج</button>
      </div>
    </div>
  `
  : `
    <a href="${APP_CONFIG.LOGIN_PAGE}" class="px-4 py-2 hover:bg-gray-700 rounded-xl text-sm">تسجيل الدخول</a>
    <a href="${APP_CONFIG.SINGUp_PAGE}" class="px-4 py-2 hover:bg-gray-700 rounded-xl text-sm">إنشاء حساب</a>
  `;
  
    bindUserEvents();
  }

  /* ---------- باقي الدوال تبقى كما هي ---------- */
  function bindUserEvents() {
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

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut();
        location.reload();
      });
    }
  }

  function bindEvents() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
      });
    }

    const mobileToggle = document.getElementById("mobile-menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener("click", () => {
        const expanded = mobileToggle.getAttribute("aria-expanded") === "true";
        mobileToggle.setAttribute("aria-expanded", !expanded);
        mobileMenu.classList.toggle("hidden");
      });
    }

    setupSearch("search-input-desktop", "search-suggestions-desktop");
    setupSearch("search-input-mobile", "search-suggestions-mobile");

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
               class="block px-3 py-2 hover:bg-gray-700 dark:hover:bg-gray-800 cursor-pointer rounded-lg">
              <div class="font-medium text-gray-200">${post.title}</div>
              ${post.excerpt ? `<div class="text-xs text-gray-400 truncate">${post.excerpt}</div>` : ""}
            </a>
          `).join("");

      suggestionsEl.classList.remove("hidden");
    });

    inputEl.addEventListener("blur", () => {
      setTimeout(() => suggestionsEl.classList.add("hidden"), 150);
    });
  }

  /* ---------- التهيئة ---------- */
  return {
    async init() {
      renderSkeleton();
      bindEvents();
      await renderUser();
    },
  };
})();
