import { listPostsCached, getPostCached } from "../../../shared/js/cach/postsCache.js";
import { escapeHtml, formatDate } from "../../../shared/js/ui/helpers.js";
import { renderPostsCards } from "../../../shared/js/ui/posts-render.js";
import { initCommentsSection } from './commentsFeature.js';
import { APP_CONFIG } from "../../../admin/assets/js/config/appConfig.js";

const container = document.getElementById("post-container");
const loading = document.getElementById("loading");
const commentsContainer = document.getElementById("comments-container");
const commentForm = document.getElementById("comment-form");

const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

// 🧱 skeleton
function renderSkeleton() {
  return `
    <article class="animate-pulse p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
      <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
      <div class="space-y-3">
        <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </article>
  `;
}

async function displayPost(post) {
  if (!post) return;
  container.innerHTML = "";

  const article = document.createElement("article");
  article.className = "bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 fade-in";

  article.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:justify-between gap-2 mb-4 text-gray-500 dark:text-gray-400 text-sm items-start sm:items-center">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-user text-gold"></i>
        <span>المؤلف: ${escapeHtml(post.full_name || "غير معروف")}</span>
      </div>
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-tags text-green-500"></i>
        <span>الفئة: ${escapeHtml(post.categories.name)}</span>
      </div>
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-calendar-days text-yellow-400"></i>
        <time datetime="${escapeHtml(post.created_at)}">${formatDate(post.created_at)}</time>
      </div>
    </div>

    <h1 class="text-3xl font-bold text-gold mb-6">${escapeHtml(post.title)}</h1>

    <div class="prose prose-indigo dark:prose-invert text-gray-700 dark:text-gray-300 max-w-full">
      ${post.content || "<p>لا يوجد محتوى</p>"}
    </div>
  `;

  container.appendChild(article);

  // GSAP fade-in effect
  gsap.to(article, { opacity: 1, y: 0, duration: 0.6 });

  // مقالات ذات صلة
  renderRelatedPosts(post);

  // قسم التعليقات
  initCommentsSection(post.id, commentsContainer, commentForm);
}

async function renderPostDetails(id) {
  if (!container) return console.error("post-container element not found");
  if (!id) {
    container.innerHTML = `<p class="text-red-500 text-center">معرف البوست غير موجود</p>`;
    loading.style.display = "none";
    return;
  }

  container.innerHTML = renderSkeleton();
  loading.style.display = "none";

  try {
    const post = await getPostCached(id);
    if (!post) {
      container.innerHTML = `<p class="text-gray-500 text-center">لا يوجد محتوى لهذا البوست</p>`;
      return;
    }
    displayPost(post);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-red-500 text-center">حدث خطأ أثناء جلب البوست</p>`;
  }
}

async function renderRelatedPosts(currentPost) {
  try {
    const relatedPostsData = await listPostsCached({ category_id: currentPost.categories?.id, per: 3 });
    if (!relatedPostsData?.posts?.length) return;

    const section = document.createElement("section");
    section.className = "mt-12 fade-in";
    section.innerHTML = `
      <h2 class="text-xl font-bold text-gold mb-4">مقالات ذات صلة</h2>
      <div class="grid md:grid-cols-3 gap-4" id="related-posts-grid"></div>
    `;
    container.appendChild(section);

    const grid = section.querySelector("#related-posts-grid");
    renderPostsCards(grid, relatedPostsData.posts.filter(p => p.id !== currentPost.id), {
      linkTemplate: post => `post.html?id=${post.id}`,
      showCategory: false
    });

    gsap.to(section, { opacity: 1, y: 0, duration: 0.6, delay: 0.2 });
  } catch (err) {
    console.warn("Failed to render related posts:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderPostDetails(postId);
});
