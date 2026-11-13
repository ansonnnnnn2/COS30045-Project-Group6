// Hash-linked views retain shared filters and support browser Back/Forward.
document.addEventListener('DOMContentLoaded', () => {
  const buttons = [...document.querySelectorAll('.header-nav .nav-btn')];
  const sections = [...document.querySelectorAll('.dashboard-section')];
  function show() {
    const hash = location.hash.slice(1);
    const requested = ['users', 'ages'].includes(hash) ? 'groups' : (hash || 'overview');
    const view = buttons.some(b => b.dataset.section === requested) ? requested : 'overview';
    sections.forEach(s => { s.hidden = s.id !== view + '-section'; });
    buttons.forEach(b => {
      const active = b.dataset.section === view;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
      if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });

    document.querySelector('.tip')?.style.setProperty('display', 'none');
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }
  buttons.forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.section; }));
  window.addEventListener('hashchange', show);
  const notes = document.getElementById('dataNotes');
  document.querySelectorAll('[data-open-notes]').forEach(b => b.addEventListener('click', () => notes.showModal()));
  document.getElementById('closeNotes').addEventListener('click', () => notes.close());
  show();
});
