// # منطق عرض التعليقات في لوحة التحكم، إدارة، فلترة، البحث

// الدور: منطق المسؤول في لوحة التحكم.
// وظائف رئيسية:
// جلب التعليقات لجميع البوستات أو بوست محدد.
// تصفية التعليقات حسب الحالة أو البوست.
// إدارة التعليقات: الموافقة، الإخفاء، الحذف.
// ربط البيانات بمكون commentsTable.js.
// comments.js
//    │   │       ├─ loadComments(postId?, status?) → جلب التعليقات
//    │   │       ├─ handleApprove(commentId) → الموافقة
//    │   │       ├─ handleHide(commentId) → الإخفاء
//    │   │       └─ handleDelete(commentId) → الحذف


// D:\digital_space\admin\assets\js\features\comments.js
import { fetchComments, adminUpdateStatus, deleteComment } from '../api/commentsApi.js';
import { CommentsTable } from '../ui/commentsTable.js';
import { showToast } from '../ui/toast.js';
const table = new CommentsTable('commentsTableContainer');
 
const DEFAULT_PER = 20;
let currentFilters = {
  postId: null,
  status: null,
  q: null,
  page: 1,
  per: DEFAULT_PER
};
 
let lastLoadPromise = null;

/**
 * تهيئة عناصر واجهة التعليقات في لوحة التحكم.
 * يربط أزرار البحث والفلترة وزر التحديث بزر التحميل.
 */
export function initAdminComments() {
  const sectionBtn = document.querySelector('[data-section="comments"]');
  const searchInput = document.getElementById('commentsSearchInput');
  const statusSelect = document.getElementById('commentsStatusFilter');
  const postsSelect = document.getElementById('commentsPostFilter'); // يمكن تعبئته ديناميكياً لاحقاً
  const refreshBtn = document.getElementById('commentsRefreshBtn');

  // عند فتح قسم التعليقات، حمل التعليقات (فقط إذا لم تُحمَّل مؤخرًا)
  if (sectionBtn) {
    sectionBtn.addEventListener('click', () => {
      // إعادة تهيئة صفحة إلى الأولى عند الدخول للقسم
      currentFilters.page = 1;
      loadComments();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      const q = searchInput.value.trim();
      currentFilters.q = q || null;
      currentFilters.page = 1;
      loadComments();
    }, 350));
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      currentFilters.status = statusSelect.value || null;
      currentFilters.page = 1;
      loadComments();
    });
  }

  if (postsSelect) {
    postsSelect.addEventListener('change', () => {
      currentFilters.postId = postsSelect.value || null;
      currentFilters.page = 1;
      loadComments();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadComments();
    });
  }

  // تحميل أولي مشروط (إذا كان القسم ظاهرًا حالياً)
  // إذا أردت التحميل عند بدء التطبيق فعّل السطر التالي:
  // loadComments();
}

/**
 * حمل التعليقات بناءً على currentFilters وعرّضها باستخدام CommentsTable.
 * يتعامل مع استجابات Edge Function: { comments, page, per, total_count }
 */
export async function loadComments() {
  const postId = currentFilters.postId;
  // ملاحظة مهمة: الـ Edge Function يتطلب post_id في GET.
  if (!postId) {
    // إن لم يتم تحديد بوست، نحاول جلب تعليقات من كل البوستات غير ممكنة حسب دالتك.
    // لذا نعرض رسالة وننهي العملية.
    table.container.innerHTML = `<div class="text-gray-300 py-6 text-center">اختر بوستًا من الفلتر لعرض تعليقاته.</div>`;
    return;
  }

  const params = {
    postId,
    page: currentFilters.page || 1,
    per: currentFilters.per || DEFAULT_PER,
    status: currentFilters.status || null
  };

  // إلغاء التحميل المتكرر إذا كان قيد التنفيذ
  if (lastLoadPromise) {
    try { await lastLoadPromise; } catch (e) { /* ignore previous error */ }
  }

  lastLoadPromise = (async () => {
    try {
      // ضع مؤشر تحميل بسيط
      table.container.innerHTML = `<div class="text-gray-300 py-6 text-center">جارٍ جلب التعليقات...</div>`;

      const res = await fetchComments(params);
      // res شكل: { comments, page, per, total_count }
      const comments = res?.comments || [];

      // Render table مع callbacks
      table.render(comments, {
        onApprove: async (id) => {
          try {
            await adminUpdateStatus({ id, action: 'approve' });
            showToast('تم اعتماد التعليق.');
            await loadComments();
          } catch (err) {
            console.error('approve error', err);
            showToast(err?.body?.error || 'فشل اعتماد التعليق.');
          }
        },
        onHide: async (id) => {
          try {
            await adminUpdateStatus({ id, action: 'hide' });
            showToast('تم إخفاء التعليق.');
            await loadComments();
          } catch (err) {
            console.error('hide error', err);
            showToast(err?.body?.error || 'فشل إخفاء التعليق.');
          }
        },
        onDelete: async (id) => {
          if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
          try {
            await deleteComment({ id });
            showToast('تم حذف التعليق.');
            await loadComments();
          } catch (err) {
            console.error('delete error', err);
            showToast(err?.body?.error || 'فشل حذف التعليق.');
          }
        }
      });

      // لو احتجت معلومات pagination يمكنك الوصول إلى res.page / res.total_count
      // مثال: تحديث عناصر صفحة/عدد النتائج إن رغبت بإظهارها في الواجهة.

    } catch (err) {
      console.error('loadComments failed', err);
      table.container.innerHTML = `<div class="text-red-400 py-6 text-center">تعذر جلب التعليقات.</div>`;
      showToast(err?.body?.error || 'فشل جلب التعليقات.');
    } finally {
      lastLoadPromise = null;
    }
  })();

  return lastLoadPromise;
}

/* ----- وظائف مساعدة ----- */

/**
 * يمكنك استخدام هذه الدالة لملء فلتر البوستات (<select id="commentsPostFilter">)
 * posts: array of { id, title }
 */

export function populatePostsFilter(posts = [], commentsTableInstance) {
  const postsSelect = document.getElementById('commentsPostFilter');
  if (!postsSelect) return;

  postsSelect.innerHTML = `<option value="">اختر بوستًا</option>`;
  posts.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.title || p.id;
    postsSelect.appendChild(opt);
  });

  // ربط حدث تغيير الفلتر لتحميل التعليقات تلقائيًا
  postsSelect.addEventListener('change', async () => {
    const postId = postsSelect.value;
    if (!postId) {
      commentsTableInstance.clear(); // دالة لمسح الجدول أو عرض رسالة
      return;
    }
    await commentsTableInstance.load(postId);
  });
}

/* debounce بسيط */
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
