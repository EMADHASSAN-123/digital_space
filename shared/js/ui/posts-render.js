import { escapeHtml, escapeAttr, guessExcerpt, formatDate } from "./helpers.js";
import { APP_CONFIG } from "../../../admin/assets/js/config/appConfig.js";

/**
 * عرض بطاقات التدوينات بتصميم حديث مع عرض هيكل تحميل مؤقت (Skeleton)
 * @param {HTMLElement} rootEl - العنصر الجذري
 * @param {Array} posts - مصفوفة التدوينات
 * @param {Object} options - خيارات إضافية (onRead, linkTemplate)
 */
export function renderPostsCards(rootEl, posts = [], { onRead, linkTemplate } = {}) {
  if (!rootEl) return;

  // 🦴 إنشاء هيكل تحميل مؤقت Skeleton قبل عرض البوستات الحقيقية
  const showSkeleton = (count = 4) => {
    rootEl.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement("article");
      skeleton.className = `
        animate-pulse rounded-2xl p-6 bg-white/5 border border-[#d0b16b]/10 
        backdrop-blur-sm shadow-sm flex flex-col justify-between
      `;
      skeleton.innerHTML = `
        <div>
          <div class="h-5 w-2/3 bg-[#d0b16b]/30 rounded mb-4"></div>
          <div class="h-3 w-full bg-gray-700/40 rounded mb-2"></div>
          <div class="h-3 w-5/6 bg-gray-700/40 rounded mb-2"></div>
          <div class="h-3 w-4/6 bg-gray-700/40 rounded"></div>
        </div>
        <div class="flex justify-between items-center mt-auto pt-4">
          <div class="h-3 w-20 bg-gray-700/40 rounded"></div>
          <div class="h-6 w-24 bg-[#d0b16b]/30 rounded-full"></div>
        </div>
      `;
      frag.appendChild(skeleton);
    }

    rootEl.appendChild(frag);
  };

  // 🔹 إظهار skeleton فورًا حتى يتم جلب التدوينات
  showSkeleton();

  // ⏳ تأخير بسيط لمحاكاة وقت الجلب (في الحالة الحقيقية استخدمه بعد جلب البيانات)
  setTimeout(() => {
    renderRealPosts(rootEl, posts, { onRead, linkTemplate });
  }, 400); // يمكنك تقليلها أو ربطها بزمن الجلب الحقيقي
}

/**
 * 🔸 عرض البوستات الفعلية بعد انتهاء التحميل
 */
function renderRealPosts(rootEl, posts = [], { onRead, linkTemplate } = {}) {
  rootEl.innerHTML = "";

  if (!Array.isArray(posts) || posts.length === 0) {
    rootEl.innerHTML = `<div class="text-center py-10 text-gray-400 text-lg">لا توجد تدوينات بعد ✍️</div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  posts.forEach((post) => {
    const id = post.id ?? "";
    const title = escapeHtml(post.title ?? "بدون عنوان");
    const excerpt = escapeHtml(guessExcerpt(post.excerpt || post.content, 40));
    const createdAt = post.publishedAt || post.created_at || "";
    const postLink = linkTemplate
      ? escapeAttr(linkTemplate(post))
      : `${APP_CONFIG.POST_PAGE}?id=${escapeAttr(id)}`;

    const card = document.createElement("article");
    card.className = `
      group relative rounded-2xl p-6 bg-white/5 border border-[#d0b16b]/20 
      shadow-md hover:shadow-[#d0b16b]/30 hover:shadow-lg 
      backdrop-blur-md transition-all duration-300 
      hover:-translate-y-1 hover:border-[#d0b16b]/60 cursor-pointer
      flex flex-col justify-between
    `;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `اقرأ المزيد عن ${title}`);

    card.innerHTML = `
      <div>
        <h3 class="text-lg md:text-xl font-bold text-[#d0b16b] mb-3 group-hover:text-yellow-300 transition-colors">
          ${title}
        </h3>
        <p class="text-gray-300 text-sm md:text-base leading-relaxed mb-4 line-clamp-3">
          ${excerpt}
        </p>
      </div>
      <div class="flex justify-between items-center mt-auto pt-2">
        <time class="text-xs text-gray-500">${createdAt ? formatDate(createdAt, "ar-EG") : ""}</time>
        <a href="${postLink}" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-[#d0b16b] border border-[#d0b16b]/40 hover:bg-[#d0b16b]/20 transition-all">
          اقرأ المزيد
          <i class="fa-solid fa-arrow-left-long text-xs"></i>
        </a>
      </div>
    `;

    // دعم النقر ولوحة المفاتيح
    card.addEventListener("click", () => (onRead ? onRead(id, post) : (window.location.href = postLink)));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") (onRead ? onRead(id, post) : (window.location.href = postLink));
    });

    frag.appendChild(card);
  });

  rootEl.appendChild(frag);

  // ✨ تأثير دخول أنيق باستخدام GSAP
  if (window.gsap) {
    gsap.from(rootEl.children, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.07,
      ease: "power2.out",
    });
  }
}
