// public/assets/js/main-init.js
// المسؤول عن: تحميل header، تهيئة Vanta، تهيئة شريط الفئات، وتهيئة تفاعلات عامة.
// Designed to be resilient: uses dynamic imports and graceful fallbacks.

const SELECTORS = {
  header: '#site-header',
  vanta: '#vanta-bg',
  categoriesScroll: 'categories-scroll', // id of the inner scroll container (index.html uses this)
  categoriesSection: 'categories-bar',    // fallback if above not present
  postsContainer: 'posts-container',
  loadMoreBtn: 'load-more-btn',
};
 
const VANTA_OPTIONS = {
  selector: SELECTORS.vanta,
  // colors chosen to match your Tailwind config (deep-500 / surface.dark)
  colorHex: 0x355f9f,
  backgroundHex: 0x0B1220,
  mobileDisableWidth: 600, // disable Vanta on very small screens to save perf
};

async function safeImport(path) {
  try {
    return await import(path);
  } catch (err) {
    console.warn(`optional module not found or failed to load: ${path}`, err);
    return null;
  }
}

async function initHeader() {
  // If you already import header.js separately in index.html, this will harmlessly import again.
  const mod = await safeImport('/public/assets/js/header.js');
  if (mod && mod.Header && typeof mod.Header.init === 'function') {
    try {
      await mod.Header.init();
      // expose for debugging
      window.__siteHeader = mod.Header;
    } catch (err) {
      console.error('Header.init() failed:', err);
    }
  } else {
    console.info('Header module not available or does not export Header.init — skipping.');
  }
}

async function initVanta() {
  const el = document.querySelector(VANTA_OPTIONS.selector);
  if (!el) {
    console.info('Vanta target element not found:', VANTA_OPTIONS.selector);
    return;
  }

  // disable on small screens to avoid performance issues
  if (window.innerWidth < VANTA_OPTIONS.mobileDisableWidth) {
    console.info('Screen small — skipping Vanta initialization for performance.');
    return;
  }

  const mod = await safeImport('/public/assets/js/vanta-init.js');
  if (mod && typeof mod.initVanta === 'function') {
    try {
      mod.initVanta(VANTA_OPTIONS.selector, {
        color: VANTA_OPTIONS.colorHex,
        backgroundColor: VANTA_OPTIONS.backgroundHex,
      });
      window.__vantaInited = true;
    } catch (err) {
      console.error('initVanta failed:', err);
    }
  } else {
    // try global VANTA if vanta-init not present
    if (window.VANTA && window.VANTA.NET) {
      try {
        // destroy previous assigned effect if any
        if (el._vantaEffect) el._vantaEffect.destroy();
        el._vantaEffect = VANTA.NET({
          el,
          color: VANTA_OPTIONS.colorHex,
          backgroundColor: VANTA_OPTIONS.backgroundHex,
          mouseControls: true,
          touchControls: true,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
        });
        window.__vantaInited = true;
      } catch (err) {
        console.error('Global VANTA.NET init failed:', err);
      }
    } else {
      console.info('Vanta library not available (skipping).');
    }
  }
}

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

async function initCategoriesAndPosts() {
  // The categories module you have exports initCategoriesBar(barId, postsRootId)
  // we try the inner scroll id first, otherwise the section id.
  const categoriesBarId = document.getElementById(SELECTORS.categoriesScroll) ? SELECTORS.categoriesScroll : SELECTORS.categoriesSection;
  const postsRootId = SELECTORS.postsContainer;
  const mod = await safeImport('/shared/js/ui/categories-bar.js');

  if (mod && typeof mod.initCategoriesBar === 'function') {
    try {
      await mod.initCategoriesBar(categoriesBarId, postsRootId);
      console.info('Categories initialized on', categoriesBarId, ' -> posts root:', postsRootId);
    } catch (err) {
      console.error('initCategoriesBar threw an error:', err);
      showCategoriesFallbackMessage(categoriesBarId);
    }
  } else {
    console.info('categories-bar module not available. Showing fallback message.');
    showCategoriesFallbackMessage(categoriesBarId);
  }
}

function showCategoriesFallbackMessage(barId) {
  const container = document.getElementById(barId);
  if (!container) return;
  container.innerHTML = `<div class="px-4 py-3 text-[var(--c-muted)]">لا يمكن تحميل الفئات الآن.</div>`;
}

// Expose a simple pub/sub event for "requesting more posts" so the posts loader (if separate) can listen
function setupLoadMoreBridge() {
  const btn = document.getElementById(SELECTORS.loadMoreBtn);
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.currentTarget.setAttribute('disabled', 'true');
    e.currentTarget.classList.add('opacity-60', 'cursor-not-allowed');

    // Dispatch a custom event; your posts module should listen to "main:loadMorePosts"
    const ev = new CustomEvent('main:loadMorePosts', {
      detail: { source: 'main-init' },
      bubbles: true,
    });
    document.dispatchEvent(ev);

    // If no listener re-enables button after short timeout
    // (posts module should remove this fallback)
    setTimeout(() => {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-60', 'cursor-not-allowed');
    }, 2500);
  });
}

function observeHeaderHeightVar() {
  const header = document.querySelector(SELECTORS.header);
  if (!header) return;
  // set CSS var initially
  const setVar = () => {
    const h = header.offsetHeight || 64;
    document.documentElement.style.setProperty('--header-h', `${h}px`);
  };
  setVar();

  // observe size changes and update var (ResizeObserver)
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(debounce(() => setVar(), 120));
    ro.observe(header);
  } else {
    window.addEventListener('resize', debounce(setVar, 200));
  }
}

async function initThemeAuto() {
  // try to import existing theme helper for consistent behavior (optional)
  const mod = await safeImport('/shared/js/theme.js');
  if (mod && typeof mod.initTheme === 'function') {
    try { mod.initTheme(); } catch (err) { console.warn('theme.initTheme failed', err); }
  } else {
    // lightweight fallback: read localStorage and set .dark on html
    const t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
    else if (t === 'light') document.documentElement.classList.remove('dark');
    else {
      // respect prefers-color-scheme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
  }
}

async function boot() {
  // run in sequence but non-blocking where safe
  await initThemeAuto();

  // header first (so header height var can be correct)
  await initHeader();
  observeHeaderHeightVar();

  // init vanta (if possible)
  await initVanta();

  // init categories + posts rendering
  await initCategoriesAndPosts();

  // setup bridge button for load more (posts module should listen)
  setupLoadMoreBridge();

  // re-init vanta on resize (debounced) to avoid visual glitches
  window.addEventListener('resize', debounce(async () => {
    // If user resized to very small width, prefer to destroy Vanta. We'll try to re-init if larger.
    try {
      const vMod = await safeImport('/public/assets/js/vanta-init.js');
      if (vMod && typeof vMod.reinitVanta === 'function') {
        // if vanta-init exposes reinit, use it
        vMod.reinitVanta(SELECTORS.vanta);
      } else {
        // fallback: call initVanta again (the implementation should guard against duplications)
        await initVanta();
      }
    } catch (err) {
      console.warn('Resize handler: vanta reinit attempt failed', err);
    }
  }, 250));
}

// Boot on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  boot().catch(err => {
    console.error('main-init boot failed:', err);
  });
});

// expose for debugging in console
window.__mainInit = {
  boot,
  initVanta,
  initHeader,
  initCategoriesAndPosts
};
