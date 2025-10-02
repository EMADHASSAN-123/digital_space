// assets/js/theme.js
// Theme toggle + reusable logic for all pages

(function() {
  const htmlEl = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  const storedTheme = localStorage.getItem('theme'); // 'dark' or 'light'
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      document.body.classList.remove('bg-white');
      document.body.classList.add('bg-gray-900');
    } else {
      htmlEl.classList.remove('dark');
      document.body.classList.remove('bg-gray-900');
      document.body.classList.add('bg-white');
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (!themeIcon) return;

    // تحديث الأيقونة (Lucide أو أي SVG)
    themeIcon.innerHTML = htmlEl.classList.contains('dark')
      ? '<i data-lucide="sun" class="text-yellow-300"></i>'
      : '<i data-lucide="moon" class="text-indigo-600"></i>';

    if (window.lucide && lucide.createIcons) lucide.createIcons();
  }

  // تهيئة الوضع عند تحميل الصفحة
  applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

  // ربط الزر إذا كان موجود
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = htmlEl.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      applyTheme(isDark ? 'dark' : 'light');
    });
  }
})();
