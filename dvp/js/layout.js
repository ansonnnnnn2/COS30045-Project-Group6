// Accessible two-view layout. The shared filters stay in place between views.
document.addEventListener('DOMContentLoaded', () => {
  const buttons = [...document.querySelectorAll('.header-nav .nav-btn')];
  const overview = document.getElementById('overview-section');
  const where = document.getElementById('where-section');
  function show(view, scroll = true) {
    overview.hidden = view !== 'overview';
    where.hidden = view !== 'where';
    buttons.forEach(b => { const active = b.dataset.section === view; b.classList.toggle('active', active); b.setAttribute('aria-selected', String(active)); });
    if (view === 'where') setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    if (scroll) window.scrollTo({top:0,behavior:'smooth'});
  }
  buttons.forEach(b => b.addEventListener('click', () => show(b.dataset.section)));
  show('overview', false);
});
