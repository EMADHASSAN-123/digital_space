// shared/js/ui/resources.js
import { getResources } from "../../../admin/assets/js/api/resourcesApi.js";
import { listCategoriesCached } from "../cach/categoriesCache.js";

export async function renderLatestResources(containerId = "resources-list", limit = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const [resources, categories] = await Promise.all([
      getResources(),
      listCategoriesCached()
    ]);

    const categoriesMap = {};
    categories.forEach(c => (categoriesMap[c.id] = c.name));

    const sortedResources = resources
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    container.innerHTML = "";

    sortedResources.forEach(r => {
      const shortDesc = r.description
        ? r.description.split(" ").slice(0, 12).join(" ") +
          (r.description.split(" ").length > 12 ? "..." : "")
        : "لا يوجد وصف متاح.";

      const categoryName = categoriesMap[r.category_id] || "عام";

      const isFile = r.resource_type === "file";
      const iconHTML = isFile
        ? `<i class="fa-solid fa-file-arrow-down text-[#d0b16b] text-3xl"></i>`
        : `<i class="fa-solid fa-link text-[#d0b16b] text-3xl"></i>`;

      const card = document.createElement("div");
      card.className = `
        group p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-[#d0b16b]/30 
        shadow-md hover:shadow-lg hover:shadow-[#d0b16b]/30 transition-all duration-300 cursor-pointer hover:scale-[1.03]
      `;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-lg font-bold text-[#d0b16b]">${r.title}</h4>
          <span class="text-xs bg-[#d0b16b]/20 text-[#d0b16b] px-2 py-0.5 rounded-full">${categoryName}</span>
        </div>
        <div class="flex items-center gap-3 mb-3">${iconHTML}
          <p class="text-gray-300 text-sm leading-relaxed group-hover:text-gray-100 transition">${shortDesc}</p>
        </div>
        <div class="text-sm text-gray-500 group-hover:text-[#d0b16b] transition flex items-center gap-2 justify-end">
          <span>عرض المورد</span>
          <i class="fa-solid fa-arrow-right-long"></i>
        </div>
      `;

      card.addEventListener("click", () => {
        window.open(r.url || "#", "_blank");
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("فشل تحميل الموارد:", err);
    container.innerHTML =
      `<p class="text-red-500 text-center">حدث خطأ أثناء تحميل الموارد 😔</p>`;
  }
}
