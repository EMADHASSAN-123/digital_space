// table.js - مكوّن بسيط يعرض بطاقات أو صفوف بحسب ما تمرّر
export function renderPostsCards(rootEl, posts, { onEdit, onDelete } = {}) {
  if (!rootEl) return;

  rootEl.innerHTML = "";

  if (!posts || posts.length === 0) {
    rootEl.innerHTML = '<div class="text-gray-300">لا توجد تدوينات</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  posts.forEach((p) => {
    const card = document.createElement("article");
    card.setAttribute("role", "article");
    card.className = "bg-gray-700 rounded-lg p-4 flex flex-col justify-between h-full";

    // محتوى البطاقة الأساسي
    let contentHtml = `
      <div>
        <h4 class="text-white font-medium truncate mb-1" title="${escapeAttr(p.title)}">${escapeHtml(p.title)}</h4>
        <p class="text-gray-400 text-sm truncate" title="${escapeAttr(p.excerpt || "")}">${escapeHtml(p.excerpt || "")}</p>
      </div>
    `;

    // بناء الأزرار فقط إذا وُجدت callbacks
    if (typeof onEdit === "function" || typeof onDelete === "function") {
      contentHtml += `<div class="mt-3 flex flex-col sm:flex-row justify-end gap-2">`;

      if (typeof onEdit === "function") {
        contentHtml += `<button type="button" data-action="edit" data-id="${p.id}"
          aria-label="تحرير ${escapeAttr(p.title)}"
          class="w-full sm:w-auto py-2 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm shadow-sm">
          تحرير
        </button>`;
      }

      if (typeof onDelete === "function") {
        contentHtml += `<button type="button" data-action="delete" data-id="${p.id}"
          aria-label="حذف ${escapeAttr(p.title)}"
          class="w-full sm:w-auto py-2 px-3 rounded bg-red-600 hover:bg-red-500 text-white text-sm shadow-sm">
          حذف
        </button>`;
      }

      contentHtml += `</div>`;
    }

    card.innerHTML = contentHtml;
    frag.appendChild(card);
  });

  rootEl.appendChild(frag);

  // مستمع واحد فقط للأزرار
  if (!rootEl._listenerAdded && (typeof onEdit === "function" || typeof onDelete === "function")) {
    rootEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !rootEl.contains(btn)) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === "edit" && typeof onEdit === "function") onEdit(id);
      if (action === "delete" && typeof onDelete === "function") onDelete(id);
    });
    rootEl._listenerAdded = true;
  }
}

function escapeHtml(s = "") {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escapeAttr(s = "") {
  return String(s).replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
