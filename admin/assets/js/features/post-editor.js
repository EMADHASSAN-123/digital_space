// post-editor.js (نسخة متكاملة ومتقدمة)

import {
  getPost,
  createPost,
  updatePost,
  listCategories,
} from "../api/postsApi.js";
import { showToast } from "../ui/toast.js";
import { confirmDialog } from "../ui/modal.js";
import { supabase } from "../supabaseClient.js";

// --- عناصر DOM ---
const postForm = document.getElementById("postForm");
const titleInput = document.getElementById("postTitle");
const categorySelect = document.getElementById("categorySelect");
const excerptInput = document.getElementById("postExcerpt");
const statusInput = document.getElementById("postStatus");
const cancelBtn = document.getElementById("cancelBtn");

// --- حالة التطبيق ---
let categoriesCache = [];
let isDirty = false;
let isSaving = false;
const params = new URLSearchParams(window.location.search);
const postId = params.get("id") || "NEW";

// ---------------- Utilities ----------------
function setDirty(val = true) { isDirty = Boolean(val); }
function escapeHtml(s = "") {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function parseErrorMessage(err) {
  if (!err) return "حدث خطأ غير معروف";
  if (err.message) return err.message;
  if (err.body) {
    if (typeof err.body === "string") return err.body;
    if (err.body?.error) return err.body.error;
    if (err.body?.message) return err.body.message;
  }
  return String(err);
}
function setSavingUI(on = true) {
  const saveBtn = postForm.querySelector('button[type="submit"]');
  if (!saveBtn) return;
  saveBtn.disabled = on;
  saveBtn.classList.toggle("opacity-50", on);
  saveBtn.setAttribute("aria-busy", String(on));
}
function waitForEditor(editorId = "postContent", timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      const ed = window.tinymce?.get(editorId);
      if (ed) return resolve(ed);
      if (Date.now() - start > timeout)
        return reject(new Error("TinyMCE initialization timed out"));
      setTimeout(check, 50);
    })();
  });
}

// ---------------- تتبع التعديلات ----------------
[titleInput, categorySelect, excerptInput, statusInput].forEach(el => {
  if (!el) return;
  el.addEventListener("input", () => setDirty(true));
});

// ---------------- تحميل التصنيفات ----------------
async function loadCategories() {
  try {
    const cats = await listCategories();
    categoriesCache = Array.isArray(cats) ? cats : [];
    categorySelect.innerHTML = ['<option value="">-- اختر تصنيف --</option>']
      .concat(categoriesCache.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`))
      .join("");
  } catch (err) {
    console.error("loadCategories:", err);
    showToast("خطأ أثناء تحميل التصنيفات");
  }
}

// ---------------- تحميل تدوينة ----------------
async function loadPost(id) {
  if (!id || id === "NEW") return;
  try {
    const post = await getPost(id);
    if (!post) { showToast("لم يتم العثور على التدوينة"); return; }

    titleInput.value = post.title ?? "";
    excerptInput.value = post.excerpt ?? "";
    categorySelect.value = post.categories?.id ?? "";
    statusInput.value = post.status ?? "draft";

    try {
      const editor = await waitForEditor("postContent", 10000);
      editor.setContent(post.content ?? "");
    } catch {
      const ta = document.getElementById("postContent");
      if (ta) ta.value = post.content ?? "";
    }
    setDirty(false);
  } catch (err) {
    console.error("loadPost:", err);
    showToast(parseErrorMessage(err));
  }
}

// ---------------- ضغط الصور قبل الرفع ----------------

// ---------------- ضغط الصور قبل الرفع ----------------
async function compressImage(file, quality = 0.8, maxWidth = 1200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: "image/webp" })),
          "image/webp",
          quality
        );
      };
    };
    reader.readAsDataURL(file);
  });
}

// ---------------- رفع الصور ----------------
async function uploadImageToSupabase(file) {
  try {
    const compressedFile = await compressImage(file);
    const fileName = `${Date.now()}-${compressedFile.name}`;
    const { error } = await supabase.storage
      .from("blog-media")
      .upload(`images/${fileName}`, compressedFile, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("blog-media").getPublicUrl(`images/${fileName}`);
    return data.publicUrl;
  } catch (err) {
    console.error("خطأ أثناء رفع الصورة:", err);
    throw new Error("فشل رفع الصورة");
  }
}


// ---------------- تهيئة TinyMCE ----------------
function initTinyMCE() {
  if (!window.tinymce) { console.error("TinyMCE not loaded"); return; }

  tinymce.init({
    selector: "#postContent",
    height: 400,
    toolbar: "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | code | uploadImage | gsap | mindmap | accordion | tabs | cta",
    menubar: false,
    content_style: "body { color: white; background-color: #cad0d7ff; font-family: sans-serif; }",
    license_key: "gpl",
    setup(editor) {
      editor.on("change keyup paste", () => setDirty(true));

      // --- رفع الصورة ---
      editor.ui.registry.addButton("uploadImage", { text: "📷 رفع صورة", onAction: () => handleImageUpload(editor) });

      // --- GSAP Animation ---
      editor.ui.registry.addButton("gsap", { text: "GSAP", onAction: () => insertGSAP(editor) });

      // --- MindMup Map ---
      editor.ui.registry.addButton("mindmap", { text: "MindMup", onAction: () => insertMindMap(editor) });

      
      // --- Accordion ---
      editor.ui.registry.addButton("accordion", { text: "Accordion", onAction: () => insertAccordion(editor) });

      // --- Tabs ---
      editor.ui.registry.addButton("tabs", { text: "Tabs", onAction: () => insertTabs(editor) });

      // --- CTA Box ---
      editor.ui.registry.addButton("cta", { text: "CTA Box", onAction: () => insertCTA(editor) });
    }
  });
}

// ---------------- إدراج عناصر تفاعلية ----------------
function insertGSAP(editor) {
  const html = `<span class="gsap-wrapper" contenteditable="true" data-gsap='{"type":"translateY","duration":2,"loop":true}'>نص متحرك</span><p><br></p>`;
  editor.insertContent(html);
}

// ---------------- إدراج صندوق متحرك مع GSAP ----------------


function insertMindMap(editor) {
  const html = `
    <div class="mindmap-wrapper" contenteditable="false" data-mindmap='{}'>
      <ul>
        <li>الفكرة الرئيسية
          <ul>
            <li>فرع 1</li>
            <li>فرع 2</li>
          </ul>
        </li>
      </ul>
    </div><p><br></p>`;
  editor.insertContent(html);
}

function insertAccordion(editor) {
  const html = `
    <div class="accordion">
      <div class="accordion-header">اضغط للتوسيع</div>
      <div class="accordion-body">المحتوى هنا</div>
    </div><p><br></p>`;
  editor.insertContent(html);
}

function insertTabs(editor) {
  const html = `
    <div class="tabs">
      <div class="tab active">Tab 1</div>
      <div class="tab">Tab 2</div>
      <div class="tab">Tab 3</div>
    </div><p><br></p>`;
  editor.insertContent(html);
}

function insertCTA(editor) {
  const html = `
    <div class="cta-box">
      <p>ادخل نص الحث على اتخاذ إجراء هنا</p>
      <button>اضغط هنا</button>
    </div><p><br></p>`;
  editor.insertContent(html);
}

// ---------------- دالة رفع الصور ----------------
async function handleImageUpload(editor) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
 
    try {
      showToast("⏳ جاري ضغط ورفع الصورة...");
      const url = await uploadImageToSupabase(file);
      const html = `<p><br></p><div class="image-wrapper" contenteditable="false"><img src="${url}" alt="صورة" style="max-width:100%; height:auto;" loading="lazy"/></div><p><br></p>`;
      editor.insertContent(html);
      showToast("✅ تم رفع الصورة وإدراجها بنجاح");
    } catch (err) {
      console.error(err);
      showToast("❌ فشل رفع الصورة");
    }
  };
}

// ---------------- حفظ التدوينة ----------------
postForm.addEventListener("submit", async e => {
  e.preventDefault();
  if (isSaving) return;

  let content = "";
  try { content = window.tinymce?.get("postContent")?.getContent() ?? ""; } 
  catch { content = document.getElementById("postContent")?.value ?? ""; }

  const payload = {
    title: titleInput.value.trim(),
    category_id: categorySelect.value || null,
    status: statusInput.value,
    excerpt: excerptInput.value.trim(),
    content,
    
  };

  if (!payload.title) return showToast("يرجى إدخال عنوان التدوينة");
  if (!payload.category_id) return showToast("يرجى اختيار التصنيف");

  isSaving = true;
  setSavingUI(true);

  try {
    if (postId === "NEW") {
      await createPost(payload);
      showToast("تم إنشاء التدوينة بنجاح");
      postForm.reset();
      window.tinymce?.get("postContent")?.setContent("");
    } else {
      await updatePost(postId, payload);
      showToast("تم تحديث التدوينة بنجاح");
    }
    setDirty(false);
  } catch (err) {
    console.error("savePost:", err);
    showToast(parseErrorMessage(err));
  } finally {
    isSaving = false;
    setSavingUI(false);
  }
});

// ---------------- زر الإلغاء ----------------
cancelBtn.addEventListener("click", async () => {
  if (isDirty) {
    const ok = await confirmDialog({ title: "تأكيد الإلغاء", text: "هناك تغييرات لم تحفظ بعد. هل تريد الاستمرار؟" });
    if (!ok) return;
  }
  window.history.back();
});

// ---------------- التهيئة الكاملة ----------------
(async function init() {
  await loadCategories();
  initTinyMCE();
  try {
    const editor = await waitForEditor("postContent", 10000);
    editor.on("change keyup paste", () => setDirty(true));
    
  } catch (err) { console.warn("TinyMCE init warning:", err); }
  await loadPost(postId);
})();
