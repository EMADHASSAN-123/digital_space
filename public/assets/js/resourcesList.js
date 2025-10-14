import { listCategoriesCached } from "../../../shared/js/cach/categoriesCache.js";
import { APP_CONFIG } from "../../../admin/assets/js/config/appConfig.js";

const resourcesGrid = document.getElementById("resourcesGrid");
const emptyState = document.getElementById("emptyState");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const searchInput = document.getElementById("searchInput");
const toastsRoot = document.getElementById("toasts-root");

const FUNCTIONS_BASE = "https://ugswbpfwmaoztigppacu.supabase.co/functions/v1/get-resources";// GET endpoint

// إذا كنت تخزن الملفات في bucket عام باسم "resources" في Supabase:
const STORAGE_PUBLIC_PREFIX = window.STORAGE_PUBLIC_PREFIX || null; 
// ---- utilities (simple toast + loader) ----
function toast(message, type = "info", timeout = 3000) {
  const el = document.createElement("div");
  el.className = `mb-2 p-2 px-3 rounded shadow text-white ${type === "error" ? "bg-red-600" : "bg-green-600"}`;
  el.textContent = message;
  toastsRoot.appendChild(el);
  setTimeout(() => { el.classList.add("opacity-0"); setTimeout(()=>el.remove(),300); }, timeout);
}

function showError(msg){ toast(msg, "error"); }
function showSuccess(msg){ toast(msg, "success"); }

// ---- fetching resources ----
async function fetchResources() {
  try {
    const res = await fetch(FUNCTIONS_BASE, { method: "GET" });
    if (!res.ok) {
      const body = await res.json().catch(()=>({error: 'invalid'}));
      throw new Error(body.error || `خطأ في تحميل الموارد (${res.status})`);
    }
    const json = await res.json();
    // توقع شكل: { resources: [...] } أو مصفوفة مباشرة
    return Array.isArray(json) ? json : (json.resources || []);
  } catch (err) {
    console.error("fetchResources error:", err);
    showError("تعذّر جلب الموارد. حاول لاحقًا.");
    return [];
  }
}

// ---- تحميل التصنيفات ثم ملؤها في الفلتر ----
async function loadCategoriesToFilter() {
  try {
    categoryFilter.innerHTML = `<option value="">كل التصنيفات</option>`;
    const cats = await listCategoriesCached();
    if (!Array.isArray(cats)) return;
    cats.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      categoryFilter.appendChild(opt);
    });
  } catch (err) {
    console.warn("Failed to load categories:", err);
  }
}

// ---- بناء رابط التحميل/الفتح للملف ----
function resolveFileUrl(file_path) {
  if (!file_path) return null;
  // إذا كان file_path رابط كامل
  if (/^https?:\/\//i.test(file_path)) return file_path;
  if (STORAGE_PUBLIC_PREFIX) return STORAGE_PUBLIC_PREFIX + file_path;
  // fallback: حاول مباشرة الوصول لمسار خام (قد يحتاج ضبط)
  return file_path;
}

// ---- render card ----
// دالة عرض بطاقة المورد
function renderResourceCard(resource, categoriesMap) {
  const type = (resource.resource_type || "").toLowerCase();
  const isFile = type === "file";
  const url = resource.url || (resource.file_path ? resolveFileUrl(resource.file_path) : null);
  const categoryName = categoriesMap?.[resource.category_id] || "غير مصنف";

  // عدد التحميلات / الزيارات (إذا لم يوجد يظهر 0)
  const downloads = resource.downloads || 0;
  const visits = resource.visits || 0;

  // النصوص والألوان حسب نوع المورد
  const actionLabel = isFile ? "تحميل" : "زيارة";
  const actionColor = isFile
    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
    : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600";
  const actionIcon = isFile ? "download" : "external-link";

  // أيقونة المورد الرئيسية
  const resourceIcon = isFile ? "file-text" : "link";

  // امتداد الملف أو اسم الموقع
  const resourceInfo = isFile
    ? (resource.extension || "ملف")
    : (url ? new URL(url).hostname.replace("www.", "") : "رابط");

  // إنشاء العنصر
  const card = document.createElement("article");
  card.className =
    "bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200  p-5 flex flex-col justify-between h-full transition-colors duration-300";
  card.setAttribute("data-id", resource.id);
  card.setAttribute("data-type", type);
  card.setAttribute("data-category", resource.category_id);

  card.innerHTML = `
    <div class="flex items-start gap-3 mb-4">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <i data-lucide="${resourceIcon}" class="w-6 h-6 text-white "></i>
      </div>
      <div>
        <h3 class="font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(resource.title)}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${escapeHtml(resource.description || "")}</p>
      </div>
    </div>

    <div class="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-4 flex-wrap">
      <span class="flex items-center gap-1">
        <i data-lucide="${isFile ? "download" : "eye"}" class="w-4 h-4"></i>
        ${isFile ? downloads + " تحميل" : visits + " زيارة"}
      </span>
      <span class="flex items-center gap-1">
        <i data-lucide="file" class="w-4 h-4"></i>
        ${escapeHtml(resourceInfo)}
      </span>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        ${escapeHtml(categoryName)}
      </span>
      ${
        url
          ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition ${actionColor}">
             <i data-lucide="${actionIcon}" class="w-4 h-4"></i>
             ${actionLabel}
           </a>`
          : `<button disabled class="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
             <i data-lucide="ban" class="w-4 h-4"></i>
             غير متاح
           </button>`
      }
    </div>
  `;

  // تفعيل أيقونات Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  return card;
}




// ---- helper: escape text for safety ----
function escapeHtml(str) {
  return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escapeAttr(str){ return String(str || "").replaceAll('"','&quot;'); }

// ---- main init ----
export async function initResourcesListPage() {
  // header component (if لديك ملف header.js يستطيع تهيئة الرأس)
  try {
    const headerModule = await import("/public/js/header.js").catch(()=>null);
    if (headerModule && typeof headerModule.initHeader === "function") headerModule.initHeader();
  } catch (e) { /* ignore */ }

  // load categories so we can build a map
  const categories = await listCategoriesCached().catch(()=>[]);
  const categoriesMap = {};
  (categories || []).forEach(c => categoriesMap[c.id] = c.name);

  // populate filter select
  loadCategoriesToFilter();

  // load resources
  const resources = await fetchResources();

  if (!resources || resources.length === 0) {
    emptyState.classList.remove("hidden");
    resourcesGrid.innerHTML = "";
    return;
  } else {
    emptyState.classList.add("hidden");
  }

  // render all cards
  resourcesGrid.innerHTML = "";
  for (const r of resources) {
    const card = renderResourceCard(r, categoriesMap);
    card.dataset.aos = "fade-up";
    resourcesGrid.appendChild(card);
  }

  // wire search & filters (client-side)
  function applyFilters() {
    const q = (searchInput.value || "").trim().toLowerCase();
    const cat = categoryFilter.value;
    const type = typeFilter.value;

    const cards = Array.from(resourcesGrid.children);
    let visibleCount = 0;
    cards.forEach(card => {
      const title = card.querySelector("h3")?.textContent?.toLowerCase() || "";
      const matchesQ = !q || title.includes(q);
      const matchesCat = !cat || card.dataset.category === cat;
      const matchesType = !type || card.dataset.type === type;

      const show = matchesQ && matchesCat && matchesType;
      card.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    if (visibleCount === 0) emptyState.classList.remove("hidden");
    else emptyState.classList.add("hidden");
  }

  // events
  searchInput.addEventListener("input", () => debounce(applyFilters, 200)());
  categoryFilter.addEventListener("change", applyFilters);
  typeFilter.addEventListener("change", applyFilters);
}

// ---- small debounce util ----
function debounce(fn, wait=200){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); }; }

// ---- Kick off on load ----
document.addEventListener("DOMContentLoaded", () => { initResourcesListPage().catch(err=>console.error(err)); });