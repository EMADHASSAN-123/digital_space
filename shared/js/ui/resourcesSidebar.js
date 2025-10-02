// shared/js/ui/resources.js
import { getResources } from "../../../admin/assets/js/api/resourcesApi.js";
import { listCategoriesCached } from "../cach/categoriesCache.js"; // تأكد أن لديك API لجلب الفئات

export async function renderLatestResources(containerId = "resources", limit = 5) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try { 
    // جلب الموارد والفئات بالتوازي
    const [resources, categories] = await Promise.all([getResources(), listCategoriesCached()]);

    // إنشاء خريطة ID => Name
    const categoriesMap = {};
    categories.forEach(c => categoriesMap[c.id] = c.name);

    // ترتيب الموارد حسب الأحدث وتحديد العدد المطلوب
    const sortedResources = resources
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    container.innerHTML = `
      <div class="p-4 rounded-xl  bg-gray-900 shadow-2xl">
        
      <div class="space-y-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="resources-list"></div>
        
      </div>
    `;

    const listContainer = container.querySelector("#resources-list");

   sortedResources.forEach(r => {
  const shortDesc = r.description
    ? r.description.split(" ").slice(0, 10).join(" ") + (r.description.split(" ").length > 10 ? "..." : "")
    : "";

  const categoryName = categoriesMap[r.category_id] || "عام";

  const card = document.createElement("div");
  card.className = " p-6 rounded-2xl border-2 border-[#6b573c] shadow-lg hover:shadow-2xl hover:scale-105 transition transform duration-300 cursor-pointer";

  const iconHTML = r.resource_type === "file" 
    ? `<i class="fa-solid fa-file-arrow-down text-[#d0b16b] text-2xl mb-2"></i>` 
    : `<i class="fa-solid fa-arrow-up-right-from-square text-[#d0b16b] text-2xl mb-2"></i>`;

  card.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <h4 class="text-lg font-bold text-[#d0b16b]">${r.title}</h4>
      <span class="text-xs bg-[#d0b16b]/20 text-[#d0b16b] px-2 py-0.5 rounded-full ml-2">${categoryName}</span>
    </div>
    ${iconHTML}
    <p class="text-gray-300 text-sm leading-relaxed">${shortDesc}</p>
  `;

  card.addEventListener("click", () => {
    if(r.resource_type === "file") {
      window.open(r.url || "#", "_blank");
    } else if(r.resource_type === "link") {
      window.open(r.url, "_blank");
    }
  });

  listContainer.appendChild(card);
});


  } catch (err) {
    console.error("فشل تحميل الموارد:", err);
    container.innerHTML = `<p class="text-red-500">فشل تحميل الموارد</p>`;
  }
}
