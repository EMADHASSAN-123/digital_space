// assets/js/post-detail.js
import {listPostsCached ,getPostCached} from "../../../shared/js/cach/postsCache.js";
import { escapeHtml, formatDate } from "../../../shared/js/ui/helpers.js";
import { renderPostsCards } from "../../../shared/js/ui/posts-render.js ";
import {initCommentsSection} from './commentsFeature.js';
import { APP_CONFIG } from "../../../admin/assets/js/config/appConfig.js";

const container = document.getElementById("post-container");
const loading = document.getElementById("loading");
 
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

async function renderPostDetails(id) {
  if (!container) return console.error("post-container element not found");

  if (!id) {
    container.innerHTML = `<p class="text-red-500 text-center">معرف البوست غير موجود</p>`;
    return;
  }

  try {
    const post = await getPostCached(id);

    if (!post) {
      container.innerHTML = `<p class="text-gray-500 text-center">لا يوجد محتوى لهذا البوست</p>`;
      return;
    }

    container.innerHTML = `
      <article class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div class="flex flex-col sm:flex-row sm:justify-between gap-2 mb-4 text-gray-500 dark:text-gray-400 text-sm items-start sm:items-center">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A7.966 7.966 0 0112 15a7.966 7.966 0 016.879 2.804M12 12a5 5 0 100-10 5 5 0 000 10z" />
            </svg>
            <span>المؤلف: ${escapeHtml(post.author || "غير معروف")}</span>
          </div>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>الفئة: ${escapeHtml(post.categories?.name || "عام")}</span>
          </div>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
            </svg>
            <time datetime="${escapeHtml(post.created_at)}">${formatDate(post.created_at)}</time>
          </div>
        </div>

        <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">${escapeHtml(post.title)}</h1>

        <div class="prose prose-indigo dark:prose-invert text-gray-700 dark:text-gray-300 max-w-full">
          ${post.content || "<p>لا يوجد محتوى</p>"}
        </div>
      </article>
    `;

    // أدخل قسم التعليقات المضمن في HTML الحالي (يجب أن يكون موجوداً فعلياً في post.html)
    // إن لم يكن موجودًا في HTML، سيتوجب عليك إضافته يدوياً كما أوضحت في أعلى الرسالة.
    // نركّب الموديول الخاص بالتعليقات بشكل ديناميكي
    try {
       await initCommentsSection(post.id);
      
    } catch (err) {
      console.warn('Failed to import comments module:', err);
    }

    // قسم مقالات ذات صلة
    await renderRelatedPosts(post);

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-red-500 text-center">حدث خطأ أثناء جلب البوست</p>`;
  } finally {
    loading.style.display = "none";
  }
}

async function renderRelatedPosts(currentPost) {
  const relatedPostsData = await listPostsCached({ category_id: currentPost.categories?.id, per: 3 });
  if (!relatedPostsData.posts.length) return;

  const section = document.createElement("section");
  section.className = "mt-12";

  const title = document.createElement("h2");
  title.className = "text-xl font-bold mb-4";
  title.textContent = "مقالات ذات صلة";
  section.appendChild(title);

  const gridContainer = document.createElement("div");
  gridContainer.className = "grid md:grid-cols-3 gap-4";
  section.appendChild(gridContainer);

  renderPostsCards(
    gridContainer,
    relatedPostsData.posts.filter(p => p.id !== currentPost.id),
    {
      linkTemplate: post => `${APP_CONFIG.POST_PAGE}?id=${post.id}`,
      showCategory: false
    }
  );

  container.appendChild(section);
}

document.addEventListener('DOMContentLoaded', () => {
  renderPostDetails(postId);
  
});
