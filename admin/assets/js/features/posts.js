// admin/assets/js/Features/posts.js
// Feature: إدارة التدوينات — يصل بين API وواجهة المستخدم (cards + table)
// مسؤوليات: جلب البيانات، عرضها بالشكل المناسب، التعامل مع الأحداث (تحرير/حذف/بحث/فلترة/تبديل عرض)
 
import { deletePost }       from "../api/postsApi.js";
import { listPostsCached }  from "../../../../shared/js/cach/postsCache.js";
import { escapeHtml }       from "../../../../shared/js/ui/helpers.js";
import { renderPostsCards } from "../ui/table.js";
import { confirmDialog }    from "../ui/modal.js";
import { showToast }        from "../ui/toast.js";
 
/* === عناصر DOM === */
const postsContainer      = document.getElementById("postsContainer"); // شبكة البطاقات
const postsListContainer  = document.getElementById("postsListContainer"); // وِرقة الجدول (حاوية الجدول)
const postsListBody       = document.getElementById("postsListBody"); // tbody الجدول
const searchInput         = document.getElementById("searchInputPosts");
const statusFilter        = document.getElementById("statusFilter");
const newPostBtn          = document.getElementById("newPostBtn");
const gridViewBtn         = document.getElementById("gridViewBtn");
const listViewBtn         = document.getElementById("listViewBtn");

/* === حالة (state) وإدارة طلبات === */
let state = { search: "", status: "", page: 1 };
let currentRequestToken = 0; // لتجاهل الاستجابات القديمة
let view = localStorage.getItem("postsView") || "grid";

/* === أدوات مساعدة === */

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* تحديث حالة التحميل (UI lightweight) */
function setLoading(on = false) {
  // ضع هنا مؤشر تحميل مناسب إن رغبت (spinner ...)؛ الآن مجرد تغيير شفافية
  postsContainer?.classList.toggle("opacity-50", on);
  postsListContainer?.classList.toggle("opacity-50", on);
}

      /* === تبديل العرض (grid / list) === */
function applyView(v) {
  view = v;
  localStorage.setItem("postsView", view);

  if (view === "grid") {
    postsContainer?.classList.remove("hidden");
    postsListContainer?.classList.add("hidden");
    gridViewBtn?.classList.replace("text-gray-500", "text-gray-200");
    gridViewBtn?.classList.remove("text-gray-500");
    listViewBtn?.classList.replace("text-gray-200", "text-gray-500");
  } else {
    postsContainer?.classList.add("hidden");
    postsListContainer?.classList.remove("hidden");
    listViewBtn?.classList.replace("text-gray-500", "text-gray-200");
    gridViewBtn?.classList.replace("text-gray-200", "text-gray-500");
  }
}

/* === معالجة حذف تدوينة (مع رسالة تأكيد) === */
async function handleDelete(id) {
  const ok = await confirmDialog({
    title: "حذف التدوينة",
    text: "هل تريد حذف هذه التدوينة نهائياً؟",
  });
  if (!ok) return;
  try {
    await deletePost(id);
    showToast("تم الحذف");
    await refresh();
  } catch (e) {
    console.error(e);
    showToast("خطأ أثناء الحذف");
  }
}

/* === معالجة نقرات الجدول (delegation) === */
function onTableClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "edit") {
    location.href = `./post-editor.html?id=${id}`;
  } else if (action === "delete") {
    handleDelete(id);
  }
}

/* === جلب البيانات وعرضها === */
export async function refresh() {
  const token = ++currentRequestToken; // ماركر للطلب الحالي
  setLoading(true);
  try {
    const res = await listPostsCached({
      search: state.search,
      status: state.status,
      page: state.page,
    });

    // تجاهل الردود القديمة التي قد تصل بعد استجابة أحدث
    if (token !== currentRequestToken) return;

    const { posts } = res || { posts: [] };

    // عرض الشبكي فقط إذا العرض grid مفعل
    if (view === "grid") {
      console.log("posts data:", posts);
      // افترض أن renderPostsCards يتعامل مع المحتوى والـ callbacks
      renderPostsCards(postsContainer, posts, {
        onEdit: (id) => (location.href = `/admin/post-editor.html?id=${id}`),
        onDelete: async (id) => {
          const ok = await confirmDialog({
            title: "حذف التدوينة",
            text: "هل تريد حذف هذه التدوينة نهائياً؟",
          });
          if (!ok) return;
          try {
            await deletePost(id);
            showToast("تم الحذف");
            await refresh();
          } catch (e) {
            console.error(e);
            showToast("خطأ أثناء الحذف");
          }
        },
      });
    }

    // عرض الجدول (إذا العنصر موجود) — نبني صفوف tbody بأمان
    if (postsListBody) {
      // نفض محتوى tbody
      postsListBody.innerHTML = "";
      (posts || []).forEach((p) => {
        const tr = document.createElement("tr");
        tr.className =
          "border-b border-gray-600 hover:bg-gray-700 text-gray-200";

        // قمنا بهروب للقيم لمنع XSS
        tr.innerHTML = `
          <td class="px-6 py-3 ">${escapeHtml(p.title)}</td>
          <td class="px-6 py-3">${escapeHtml(p.categories?.name || "")}</td>
          <td class="px-6 py-3">${escapeHtml(p.status || "")}</td>
          <td class="px-6 py-3">${
            p.created_at ? new Date(p.created_at).toLocaleDateString() : ""
          }</td>
         
          <td class="px-6 py-3">
            <button data-action="edit" data-id="${
              p.id
            }" class="text-indigo-400">تحرير</button>
            <button data-action="delete" data-id="${
              p.id
            }" class="text-red-400 ms-2">حذف</button>
          </td>
        `;
        postsListBody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
    // عرض رسالة خطأ مكان الشبكة (يمكن تحسينها لإظهار retry button)
    if (postsContainer) {
      postsContainer.innerHTML =
        '<div class="text-red-500">خطأ أثناء جلب التدوينات</div>';
    }
    if (postsListBody) {
      postsListBody.innerHTML =
        '<tr><td colspan="6" class="text-red-500 p-4">خطأ أثناء جلب التدوينات</td></tr>';
    }
  } finally {
    setLoading(false);
  }
}

/* === تهيئة الميزة (اضافة المستمعين مرة واحدة) === */
export async function initPostsFeature() {
  // هذا الملف قد يُحمّل في صفحات مختلفة — نتحقق من وجود العنصر الأساسي
  if (!postsContainer && !postsListBody) return;

  // زر إنشاء تدوينة — انتقل لمحرر جديد
  newPostBtn?.addEventListener(
    "click",
    () => (location.href = "./post-editor.html?id=NEW")
  );

  // أزرار تبديل العرض: نضيفها هنا مرة واحدة
  gridViewBtn?.addEventListener("click", () => {
    applyView("grid");
    // بعد التبديل نعيد رسم/جلب إن رغبت (في حالات قد تتغير البيانات)
    refresh();
  });
  listViewBtn?.addEventListener("click", () => {
    applyView("list");
    refresh();
  });

  // حفظ/تطبيق العرض الحالي عند التحميل
  applyView(view);

  // بحث مع debounce لمنع طلبات متكررة لكل حرف
  searchInput?.addEventListener(
    "input",
    debounce((e) => {
      state.search = e.target.value;
      // إعادة الصفحة الأولى عادة عند تغيير البحث
      state.page = 1;
      refresh();
    }, 350)
  );

  // فلتر الحالة
  statusFilter?.addEventListener("change", (e) => {
    state.status = e.target.value;
    state.page = 1;
    refresh();
  });

  // ربط مستمع واحد لتفويض أحداث أزرار الجدول (prevents accumulation)
  if (postsListBody && !postsListBody._listenerAdded) {
    postsListBody.addEventListener("click", onTableClick);
    postsListBody._listenerAdded = true;
  }

  // استدعاء أولي لجلب البيانات وعرضها
  await refresh();
}
