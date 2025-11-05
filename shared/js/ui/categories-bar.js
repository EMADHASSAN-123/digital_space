import { renderPostsCards } from "./posts-render.js";
import { listPostsCached } from "../cach/postsCache.js";
import { listCategoriesCached } from "../cach/categoriesCache.js";

// 🔹 إنشاء زر فئة بتصميم أنيق
function createCategoryButton({ id, name, isActive = false }) {
  const btn = document.createElement("button");
  btn.className = `
    px-5 py-2 rounded-full border border-[#6b573c] text-sm font-semibold
    whitespace-nowrap transition-colors duration-300
    ${isActive ? "bg-[#d0b16b] text-black" : "text-white hover:bg-[#6b573c] hover:text-white"}
  `;
  btn.textContent = name;
  btn.dataset.id = id;
  return btn;
}

// 🔸 تغيير الحالة النشطة للأزرار
function setActiveBtn(container, activeBtn) {
  container.querySelectorAll("button").forEach((b) => {
    b.classList.remove("bg-[#d0b16b]", "text-black");
    b.classList.add("text-white");
  });
  activeBtn.classList.add("bg-[#d0b16b]", "text-black");
}

// 🦴 عرض هيكل تحميل مؤقت (Skeleton) لأزرار الفئات
function showCategoriesSkeleton(container, count = 5) {
  container.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = `
      animate-pulse bg-[#d0b16b]/30 h-8 w-${Math.floor(Math.random() * 10) + 10} rounded-full 
      flex-shrink-0
    `;
    frag.appendChild(skeleton);
  }
  container.appendChild(frag);
}

// 🧠 تهيئة شريط الفئات + تحميل البوستات
export async function initCategoriesBar(barId = "categories-bar", postsRootId = "latest-posts") {
  const container = document.getElementById(barId);
  const postsRoot = document.getElementById(postsRootId);
  if (!container || !postsRoot) return;

  container.classList.add(
  "flex",
  "gap-4",
 
);

  // تحسين التمرير السلس على الموبايل
  container.style.scrollBehavior = "smooth";

  // ✨ إظهار skeleton مؤقت للأزرار
  showCategoriesSkeleton(container);

  try {
    // تحميل الفئات والبوستات بالتوازي
    const [categories, { posts }] = await Promise.all([listCategoriesCached(), listPostsCached()]);

    // تنظيف السكيليتون
    container.innerHTML = "";

    // زر "الكل"
    const allBtn = createCategoryButton({ id: "all", name: "الكل", isActive: true });
    container.appendChild(allBtn);

    allBtn.addEventListener("click", async () => {
      setActiveBtn(container, allBtn);
      const { posts } = await listPostsCached();
      renderPostsCards(postsRoot, posts);
    });

    // بقية الفئات
    categories.forEach((cat) => {
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

    // ⚡️ تحريك الأزرار عند ظهورها (اختياري)
    if (window.gsap) {
      gsap.from(container.children, {
        opacity: 0,
        y: 10,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
      });
    }
  } catch (error) {
    console.error("خطأ أثناء تحميل الفئات:", error);
    container.innerHTML = `<div class="text-gray-400 text-sm">تعذر تحميل الفئات ⚠️</div>`;
  }
}
