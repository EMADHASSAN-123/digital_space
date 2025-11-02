import { listCategories, createCategory ,deleteCategory} from "../api/postsApi.js";
export function initCategoriesFeature() {
  const section = document.getElementById("section-Category");
  if (!section) return;

  const categoriesList = section.querySelector("#categoriesList");
  const input = section.querySelector("input[type='text']");
  const addBtn = section.querySelector("button");
 
  // عرض الفئات
  async function renderCategories() {
    categoriesList.innerHTML = `<li class="text-surface-light">جارٍ التحميل...</li>`;
    const categories = await listCategories();
    if (!categories.length) {
      categoriesList.innerHTML = `<li class="text-muted">لا توجد فئات حالياً.</li>`;
      return;
    }

    categoriesList.innerHTML = "";
    categories.forEach(cat => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center p-2 rounded-lg hover:bg-deep-700 transition";
      li.innerHTML = `
        <span>${cat.name}</span>
        <button data-id="${cat.id}" class="text-red-500 hover:text-red-400">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      `;
      categoriesList.appendChild(li);

      // حدث الحذف (اختياري)
      li.querySelector("button")?.addEventListener("click", async () => {
  if (!confirm("هل تريد حذف هذه الفئة؟")) return;

  try {
    await deleteCategory(cat.id);
    li.remove();
  } catch (err) {
    console.error(err);
    alert("حدث خطأ أثناء حذف الفئة.");
  }
});
    });

    if (window.lucide && lucide.createIcons) lucide.createIcons();
  }

  // إضافة فئة جديدة
  addBtn.addEventListener("click", async () => {
    const name = input.value.trim();
    if (!name) return alert("الرجاء إدخال اسم الفئة.");

    try {
      await createCategory({ name });
      input.value = "";
      renderCategories();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إضافة الفئة.");
    }
  });

  renderCategories();
}