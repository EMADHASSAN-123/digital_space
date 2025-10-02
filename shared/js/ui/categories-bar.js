// shared/js/ui/categories-bar.js
import { renderPostsCards } from "./posts-render.js";
import { listPostsCached } from "../cach/postsCache.js";
import { listCategoriesCached } from "../cach/categoriesCache.js";

// دالة لإنشاء زر فئة بتنسيق الصفحة الثابتة
function createCategoryButton({ id, name, isActive = false }) {
  const btn = document.createElement("button");
  btn.className = `
    px-5 py-2 rounded-full border border-[#6b573c] text-sm font-semibold
    whitespace-nowrap transition-colors duration-300
    ${isActive ? 'bg-[#d0b16b] text-black' : 'text-white hover:bg-[#6b573c] hover:text-white'}
  `;
  btn.textContent = name;
  btn.dataset.id = id;
  return btn;
}

// تغيير الحالة النشطة للزر
function setActiveBtn(container, activeBtn) {
  container.querySelectorAll("button").forEach(b => {
    b.classList.remove('bg-[#d0b16b]', 'text-black');
    b.classList.add('text-white');
  });
  activeBtn.classList.add('bg-[#d0b16b]', 'text-black');
}

// تهيئة شريط الفئات والبوستات
export async function initCategoriesBar(barId = "categories-bar", postsRootId = "latest-posts") {
  const container = document.getElementById(barId);
 
  const postsRoot = document.getElementById(postsRootId);
  if (!container || !postsRoot) return;
 container.classList.add(
  "flex", "gap-4", "overflow-x-auto", "py-2", "px-1",
  "scrollbar-thin", "scrollbar-thumb-[#d0b16b]/60", "scrollbar-track-gray-800/40",
  "scrollbar-thumb-rounded-full", "scrollbar-track-rounded-full"
);
// تحسين التمرير السلس على الموبايل
container.style.scrollBehavior = "smooth";

// منع ظهور Scrollbar عمودي عن طريق Tailwind
container.classList.add("whitespace-nowrap");
  // تحميل الفئات والبوستات بالتوازي
  const [categories, { posts }] = await Promise.all([
    listCategoriesCached(),
    listPostsCached()
  ]);

  // زر الكل
  const allBtn = createCategoryButton({ id: 'all', name: 'الكل', isActive: true });
  container.appendChild(allBtn);

  allBtn.addEventListener("click", async () => {
    setActiveBtn(container, allBtn);
    const { posts } = await listPostsCached();
    renderPostsCards(postsRoot, posts);
  });

  // بقية الفئات
  categories.forEach(cat => {
    const btn = createCategoryButton({ id: cat.id, name: cat.name });
    container.appendChild(btn);

    btn.addEventListener("click", async () => {
      setActiveBtn(container, btn);
      const { posts } = await listPostsCached({ category_id: cat.id });
      renderPostsCards(postsRoot, posts);
    });
  });

  // تحميل البوستات الافتراضية عند فتح الصفحة
  renderPostsCards(postsRoot, posts);

  // إضافة Scroll أنيق (Tailwind)
  container.classList.add("flex", "gap-4", "overflow-x-auto", "scrollbar-thin", "scrollbar-thumb-[#d0b16b]/60", "scrollbar-track-gray-800/40", "py-2", "px-1");
}
