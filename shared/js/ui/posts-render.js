// assets/js/ui/posts-render.js
// رندر بطاقات البوستات بتنسيق الصفحة الثابتة مع Dark/Light Mode ودعم النقر والـKeyboard
import { escapeHtml, escapeAttr, guessExcerpt, formatDate } from "./helpers.js";
import {APP_CONFIG} from "../../../admin/assets/js/config/appConfig.js";
export function renderPostsCards(rootEl, posts = [], { onRead, linkTemplate } = {}) {
  if (!rootEl) return;
  rootEl.innerHTML = "";

  if (!Array.isArray(posts) || posts.length === 0) {
    rootEl.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد تدوينات</div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  posts.forEach(post => {
    const id = post.id ?? "";
    const title = escapeHtml(post.title ?? "بدون عنوان");
    const excerpt = escapeHtml(guessExcerpt(post.excerpt, 40));
    const createdAt = post.publishedAt || post.created_at || "";
    const postLink = linkTemplate ? escapeAttr(linkTemplate(post)) : `${APP_CONFIG.POST_PAGE}?id=${escapeAttr(id)}`;

    const card = document.createElement("article");
    card.className = `
      bg-gray-800 rounded-2xl p-6 border-2 border-[#6b573c] shadow-lg
      hover:shadow-2xl hover:scale-105 transition transform duration-300
      flex flex-col justify-between relative cursor-pointer
    `;
    card.tabIndex = 0;

    card.innerHTML = `
      <h3 class="text-xl font-bold text-[#6b573c] mb-2">${title}</h3>
      <p class="text-gray-300 text-sm md:text-base mb-4 leading-relaxed">${excerpt}</p>
      <div class="flex justify-between items-center mt-auto">
        <time class="text-xs text-gray-500">${createdAt ? formatDate(createdAt, 'ar-EG') : ''}</time>
        <a href="${postLink}" class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[#d0b16b] hover:text-yellow-300 transition">
          اقرأ المزيد
          <i class="fa-solid fa-arrow-left-long"></i>
        </a>
      </div>
    `;

    // دعم النقر على البطاقة بالكامل
    card.addEventListener("click", () => onRead ? onRead(id, post) : window.location.href = postLink);

    // دعم الوصول عبر لوحة المفاتيح (Enter)
    card.addEventListener("keydown", e => {
      if (e.key === "Enter") window.location.href = postLink;
    });

    frag.appendChild(card);
  });

  rootEl.appendChild(frag);
}
