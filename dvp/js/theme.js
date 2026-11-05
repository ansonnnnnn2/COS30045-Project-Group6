// Appearance preferences and reading helpers; no external dependencies.
(() => {
  const key = 'cos30045-dashboard-theme';
  const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  let stored;
  try { stored = localStorage.getItem(key); } catch (_) { /* private browsing */ }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const button = document.getElementById('themeToggle');
    if (button) {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      document.getElementById('themeLabel').textContent = dark ? 'Light mode' : 'Dark mode';
      const icon = document.getElementById('themeIcon');
      if (icon) icon.textContent = dark ? '☀' : '☾';
    }
    document.dispatchEvent(new CustomEvent('dashboard-theme-change', {detail:{theme}}));
  }
  applyTheme(stored === 'dark' || stored === 'light' ? stored : (systemDark() ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(document.documentElement.dataset.theme);
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, next); } catch (_) { /* still switches */ }
      applyTheme(next);
    });
    const progress = document.getElementById('readingProgress');
    const top = document.getElementById('backToTop');
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.width = Math.max(0, Math.min(100, window.scrollY / max * 100)) + '%';
      top.classList.toggle('visible', window.scrollY > 450);
    };
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    top.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
    update();
  });
})();
