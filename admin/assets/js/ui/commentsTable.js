// # مكون جدول التعليقات للوحة التحكم (CRUD + فلترة)

// الدور: مكون عرض التعليقات في صفحة البوست.
// مميزات:
// عرض التعليقات بشكل قائمة مرتبة.
// عرض اسم المعلق، تاريخ التعليق، ومحتوى التعليق.
// تصميم مناسب للزائر (Grid أو List).
// commentsTable.js
//        │       ├─ renderCommentsTable(comments) → جدول قابل لإعادة الاستخدام
//        │       ├─ أزرار approve/hide/delete لكل صف
//        │       └─ دعم البحث والفلترة
function truncate(text, n = 120) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n) + '…' : text;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

function mapStatusToLabel(status) {
  switch (status) {
    case 'pending': return 'جديد';
    case 'approved': return 'نشط';
    case 'hidden': return 'مخفى';
    default: return status || 'غير معروف';
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export class CommentsTable {
  constructor(containerId, opts = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`CommentsTable: container #${containerId} not found`);

    // modal root (must exist on the page as #modalRoot or fallback to body)
    this.modalRoot = document.getElementById('modalRoot') || document.body;
    this.currentCallbacks = {};
    // only bind the keydown handler that we actually have
    this._boundKeydown = this._onKeyDown.bind(this);
    this._modalEl = null;
  }

  render(comments = [], callbacks = {}) {
    // save callbacks for modal actions
    this.currentCallbacks = callbacks || {};

    this.container.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'min-w-full text-right bg-transparent';

    table.innerHTML = `
      <thead class="bg-gray-700 text-white">
        <tr>
          <th class="px-4 py-3 text-sm">المعلق</th>
          <th class="px-4 py-3 text-sm">البريد</th>
          <th class="px-4 py-3 text-sm">البوست</th>
          <th class="px-4 py-3 text-sm">المحتوى</th>
          <th class="px-4 py-3 text-sm">التاريخ</th>
          <th class="px-4 py-3 text-sm">الحالة</th>
          <th class="px-4 py-3 text-sm">إجراءات</th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement('tbody');

    comments.forEach((c) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-700 hover:bg-gray-800 cursor-pointer';
      tr.dataset.commentId = c.id;

      tr.innerHTML = `
        <td class="px-4 py-3 align-top">${escapeHtml((c.author && c.author.name) || c.author?.id || 'مجهول')}</td>
        <td class="px-4 py-3 align-top text-sm opacity-90">${escapeHtml(c.email || (c.author && c.author.id) || '---')}</td>
        <td class="px-4 py-3 align-top text-sm">${escapeHtml(c.post_title || c.post_id || '---')}</td>
        <td class="px-4 py-3 align-top text-sm">${escapeHtml(truncate(c.content || ''))}</td>
        <td class="px-4 py-3 align-top text-sm">${formatDate(c.created_at)}</td>
        <td class="px-4 py-3 align-top text-sm">${mapStatusToLabel(c.status)}</td>
        <td class="px-4 py-3 align-top text-sm">
          <div class="flex gap-2">
            <button class="approve-btn px-2 py-1 rounded bg-green-600 text-white text-sm" title="اعتماد">اعتماد</button>
            <button class="hide-btn px-2 py-1 rounded bg-yellow-600 text-white text-sm" title="إخفاء">إخفاء</button>
            <button class="delete-btn px-2 py-1 rounded bg-red-600 text-white text-sm" title="حذف">حذف</button>
          </div>
        </td>
      `;

      // Attach event listeners for action buttons (stop propagation so row click doesn't trigger)
      const approveBtn = tr.querySelector('.approve-btn');
      const hideBtn = tr.querySelector('.hide-btn');
      const deleteBtn = tr.querySelector('.delete-btn');

      approveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.currentCallbacks.onApprove === 'function') this.currentCallbacks.onApprove(c.id, c);
      });

      hideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.currentCallbacks.onHide === 'function') this.currentCallbacks.onHide(c.id, c);
      });

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.currentCallbacks.onDelete === 'function') this.currentCallbacks.onDelete(c.id, c);
      });

      // row click opens modal (full detail)
      tr.addEventListener('click', (e) => {
        // if click was on a button (some browsers bubble), ensure we don't double-handle
        if (e.target.closest('button')) return;
        this.showModal(c);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    this.container.appendChild(table);

    if (!comments.length) {
      const empty = document.createElement('div');
      empty.className = 'text-gray-300 py-6 text-center';
      empty.textContent = 'لا توجد تعليقات لعرضها.';
      this.container.appendChild(empty);
    }
  }

  /* ---------- Modal logic ---------- */

  showModal(comment) {
    // close existing modal if present
    this.closeModal();

    // create modal element
    this._modalEl = this._createModalElement(comment);
    this.modalRoot.appendChild(this._modalEl);

    // trap Escape key
    document.addEventListener('keydown', this._boundKeydown);

    // focus first actionable button for accessibility
    const firstBtn = this._modalEl.querySelector('button');
    if (firstBtn) firstBtn.focus();
  }

  closeModal() {
    if (!this._modalEl) return;
    document.removeEventListener('keydown', this._boundKeydown);
    try { this._modalEl.remove(); } catch (e) { /* ignore */ }
    this._modalEl = null;
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') this.closeModal();
  }

  _createModalElement(comment) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    overlay.style.background = 'rgba(2,6,23,0.6)'; // semi-dark backdrop

    // modal container
    const modal = document.createElement('div');
    modal.className = 'max-w-3xl w-full bg-gray-800 text-gray-100 rounded-xl shadow-lg overflow-hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'تفاصيل التعليق');

    modal.innerHTML = `
      <div class="p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
              ${escapeHtml((comment.author && comment.author.name) ? comment.author.name.charAt(0) : '?')}
            </div>
            <div>
              <div class="font-semibold">${escapeHtml((comment.author && comment.author.name) || comment.author?.id || 'مجهول')}</div>
              <div class="text-sm opacity-80">${escapeHtml(comment.email || '')}</div>
            </div>
          </div>
          <div class="text-sm opacity-80">${formatDate(comment.created_at)}</div>
        </div>

        <hr class="my-4 border-gray-700" />

        <div class="prose prose-invert max-w-none text-sm leading-relaxed">
          <p id="modalCommentContent">${escapeHtml(comment.content || '')}</p>
        </div>

        <div class="mt-4 text-sm opacity-80">
          <strong>البوست:</strong> ${escapeHtml(comment.post_title || comment.post_id || '---')}
          <span class="mx-2">|</span>
          <strong>الحالة:</strong> ${mapStatusToLabel(comment.status)}
        </div>

        <div class="mt-6 flex gap-2 justify-end">
          <button class="modal-approve-btn px-3 py-2 rounded bg-green-600 text-white">اعتماد</button>
          <button class="modal-hide-btn px-3 py-2 rounded bg-yellow-600 text-white">إخفاء</button>
          <button class="modal-delete-btn px-3 py-2 rounded bg-red-600 text-white">حذف</button>
          <button class="modal-close-btn px-3 py-2 rounded bg-gray-700 text-white">إغلاق</button>
        </div>
      </div>
    `;

    // clicking outside modal content closes it
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });

    // action buttons
    const approveBtn = modal.querySelector('.modal-approve-btn');
    const hideBtn = modal.querySelector('.modal-hide-btn');
    const deleteBtn = modal.querySelector('.modal-delete-btn');
    const closeBtn = modal.querySelector('.modal-close-btn');

    approveBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (typeof this.currentCallbacks.onApprove === 'function') {
        try {
          await this.currentCallbacks.onApprove(comment.id, comment);
        } catch (err) {
          // callback handles errors (showToast)
        }
      }
    });

    hideBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (typeof this.currentCallbacks.onHide === 'function') {
        try {
          await this.currentCallbacks.onHide(comment.id, comment);
        } catch (err) {}
      }
    });

    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
      if (typeof this.currentCallbacks.onDelete === 'function') {
        try {
          await this.currentCallbacks.onDelete(comment.id, comment);
        } catch (err) {}
      }
      this.closeModal();
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeModal();
    });

    overlay.appendChild(modal);
    return overlay;
  }
}