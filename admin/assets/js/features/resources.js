// features/resources.js
// مبدأ SRP: كل وظيفة تقوم بمهمة واحدة

import {
  getResources,
  addResource,
  updateResource,
  deleteResource,
} from "../api/resourcesApi.js";
import { listCategoriesCached } from "../../../../shared/js/cach/categoriesCache.js";
import { showError, showSuccess } from "../ui/notifications.js";

export function initResourcesFeature() {
  const newBtn = document.getElementById("newResourceBtn");
  const formContainer = document.getElementById("resourceFormContainer");
  const form = document.getElementById("resourceForm");
  const cancelBtn = document.getElementById("cancelResourceBtn");
  const typeSelect = document.getElementById("resourceType");
  const fileField = document.getElementById("fileUploadField");
  const urlField = document.getElementById("urlField");
  const listContainer = document.getElementById("resourcesList");
  const searchInput = document.getElementById("searchResources");

  if (!newBtn || !form) return;

  let editingId = null; // لو المستخدم يعدّل بدلاً من إضافة

  // ------------------------------
  // فتح النموذج لإضافة مورد جديد
  // ------------------------------
  newBtn.addEventListener("click", async () => {
    editingId = null;
    form.reset();
    await populateCategories();
    formContainer.classList.remove("hidden");
  });

  // ------------------------------
  // إلغاء النموذج
  // ------------------------------
  cancelBtn.addEventListener("click", () => {
    formContainer.classList.add("hidden");
    form.reset();
  });

  // ------------------------------
  // تبديل بين ملف / رابط
  // ------------------------------
  typeSelect.addEventListener("change", () => {
    toggleTypeFields(typeSelect.value);
  });

  // ------------------------------
  // تحميل الموارد عند البداية
  // ------------------------------
  loadResources();

  // ------------------------------
  // إرسال النموذج (إضافة / تعديل)
  // ------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectFormData();
    const valid = validateResourceData(data);
    if (!valid.ok) {
      showError(valid.error);
      return;
    }

    try {
      if (editingId) {
        const updated = await updateResource(editingId, data);
        updateResourceUI(editingId, updated);
        showSuccess("تم تعديل المورد بنجاح");
      } else {
        const created = await addResource(data);
        addResourceToUI(created);
        showSuccess("تم إضافة المورد بنجاح");
      }
      form.reset();
      formContainer.classList.add("hidden");
      editingId = null;
    } catch (err) {
      showError(err.message);
    }
  });

  // ------------------------------
  // البحث في الموارد
  // ------------------------------
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    filterResourcesUI(term);
  });

  // ------------------------------
  // --- وظائف مساعدة ---
  // ------------------------------

  function toggleTypeFields(type) {
    if (type === "file") {
      fileField.classList.remove("hidden");
      urlField.classList.add("hidden");
    } else {
      urlField.classList.remove("hidden");
      fileField.classList.add("hidden");
    }
  }

  async function loadResources() {
    try {
      const resources = await getResources();
      listContainer.innerHTML = "";
      for (const r of resources) {
        await addResourceToUI(r);
      }
    } catch {
      showError("فشل تحميل الموارد");
    }
  }

  function collectFormData() {
    return {
      title: document.getElementById("resourceTitle").value.trim(),
      resource_type: typeSelect.value,
      file_path: document.getElementById("resourceFile").files[0] || null,
      url: document.getElementById("resourceUrl").value.trim(),
      description: document.getElementById("resourceDescription").value.trim(),
      category_id: document.getElementById("resourceCategory").value,
      status: document.getElementById("resourceStatus").value,
    };
  }

  function validateResourceData(data) {
    if (!data.title) return { ok: false, error: "يجب إدخال عنوان المورد" };
    if (data.resource_type === "file" && !data.file_path) return { ok: false, error: "يجب رفع ملف" };
    if (data.resource_type === "link" && !isValidUrl(data.url)) return { ok: false, error: "رابط غير صالح" };
    if (data.file_path && data.file_path.size > 5 * 1024 * 1024) return { ok: false, error: "حجم الملف أكبر من 5MB" };
    return { ok: true };
  }

  function isValidUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  // ------------------------------
  // عرض مورد في UI
  // ------------------------------
  async function addResourceToUI(data) {
    const card = document.createElement("div");
    card.className = "bg-deep-700 rounded-xl2 p-4 text-surface-light shadow-sm";
    card.dataset.id = data.id;

    // استرجاع اسم الفئة بشكل غير متزامن
    let categoryName = "غير محدد";
    try {
      const categories = await listCategoriesCached();
      const category = categories.find(c => c.id == data.category_id);
      if (category) categoryName = category.name;
    } catch {}

    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-bold">${data.title}</h4>
        <span class="text-xs px-2 py-1 rounded bg-gray-600">${data.status}</span>
      </div>
      <p class="text-sm opacity-80 mb-2">${data.description || ""}</p>
      <p class="text-xs mb-2">التصنيف: ${categoryName}</p>
      <div class="flex gap-2 text-sm mb-2">
        ${
          data.resource_type === "file"
            ? `<i data-lucide="file"></i> ملف`
            : `<i data-lucide="link"></i> <a href="${data.url}" target="_blank" class="underline">رابط</a>`
        }
      </div>
      <div class="flex gap-2">
        <button class="editBtn text-xs bg-blue-600 px-2 py-1 rounded">تعديل</button>
        <button class="deleteBtn text-xs bg-red-600 px-2 py-1 rounded">حذف</button>
      </div>
    `;

    card.querySelector(".editBtn").addEventListener("click", () => startEditResource(data));
    card.querySelector(".deleteBtn").addEventListener("click", () => handleDeleteResource(data.id));

    listContainer.appendChild(card);
    if (window.lucide) lucide.createIcons();
  }

  // ------------------------------
  // تحديث UI بعد التعديل
  // ------------------------------
  async function updateResourceUI(id, updated) {
  const card = listContainer.querySelector(`[data-id="${id}"]`);
  if (!card) return;

  card.querySelector("h4").textContent = updated.title;
  card.querySelector("p").textContent = updated.description || "";
  card.querySelector("span").textContent = updated.status;

  // تحديث اسم الفئة
  try {
    const categories = await listCategoriesCached();
    const category = categories.find(c => c.id == updated.category_id);
    const categoryName = category ? category.name : "غير محدد";
    const categoryElement = card.querySelector(".categoryName");
    if (categoryElement) {
      categoryElement.textContent = categoryName;
    } else {
      const p = document.createElement("p");
      p.className = "text-xs mb-2 categoryName";
      p.textContent = categoryName;
      card.insertBefore(p, card.querySelector(".flex.gap-2.text-sm.mb-2"));
    }
  } catch (err) {
    console.error("خطأ في تحديث اسم الفئة:", err);
  }
}

  // ------------------------------
  // حذف مورد
  // ------------------------------
  async function handleDeleteResource(id) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await deleteResource(id);
      const card = listContainer.querySelector(`[data-id="${id}"]`);
      if (card) card.remove();
      showSuccess("تم حذف المورد بنجاح");
    } catch {
      showError("فشل الحذف");
    }
  }

  // ------------------------------
  // بدء التعديل على مورد
  // ------------------------------
  async function startEditResource(data) {
    editingId = data.id;
    document.getElementById("resourceTitle").value = data.title;
    document.getElementById("resourceDescription").value = data.description || "";
    document.getElementById("resourceStatus").value = data.status;
    typeSelect.value = data.resource_type;
    toggleTypeFields(data.resource_type);
    document.getElementById("resourceUrl").value = data.url || "";
    await populateCategories(data.category_id); // تحميل الفئات مع تحديد الحالية
    formContainer.classList.remove("hidden");
  }

  // ------------------------------
  // تصفية الموارد حسب البحث
  // ------------------------------
  function filterResourcesUI(term) {
    const cards = listContainer.querySelectorAll("[data-id]");
    cards.forEach((c) => {
      const title = c.querySelector("h4")?.textContent.toLowerCase() || "";
      c.style.display = title.includes(term) ? "block" : "none";
    });
  }

  // ------------------------------
  // تحميل التصنيفات في القائمة
  // ------------------------------
  async function populateCategories(selectedId = null) {
    const select = document.getElementById("resourceCategory");
    try {
      const categories = await listCategoriesCached();
      select.innerHTML = `<option value="">اختر التصنيف</option>`;
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        if (selectedId && selectedId == cat.id) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error("خطأ أثناء تحميل التصنيفات:", err);
    }
  }
}
