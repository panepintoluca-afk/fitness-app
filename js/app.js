// Entry point di Fapp: service worker, storage persistente, rotte, tab bar.
import { rotta, avvia, vaiA, schermataCorrente } from './router.js';

// ---- Service worker ----
if ('serviceWorker' in navigator) {
  // Se c'era già un SW e ne arriva uno nuovo, ricarico per usare i file aggiornati.
  // (Dallo step (d): non ricaricare durante un allenamento attivo.)
  const avevaController = Boolean(navigator.serviceWorker.controller);
  let ricaricato = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!avevaController || ricaricato) return;
    ricaricato = true;
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW non registrato', e));
}
navigator.storage?.persist?.().catch(() => {});

// ---- Rotte ----
const vista = (carica) => async (ctx) => (await carica()).render(ctx);

rotta('/allenamento', { tab: 'allenamento', vista: vista(() => import('./views/allenamento.js')) });
rotta('/esercizi', { tab: 'esercizi', vista: vista(() => import('./views/esercizi.js')) });
rotta('/profilo', { tab: 'profilo', vista: vista(() => import('./views/profilo.js')) });
rotta('/profilo/impostazioni', {
  tab: 'profilo', profondita: 1, genitore: '/profilo', vista: vista(() => import('./views/impostazioni.js')),
});

// ---- Tab bar ----
const tabbar = document.getElementById('tabbar');
const radici = { allenamento: '/allenamento', esercizi: '/esercizi', profilo: '/profilo' };

function aggiornaTabbar(r) {
  for (const tab of tabbar.querySelectorAll('[data-tab]')) {
    const attiva = tab.dataset.tab === r.tab;
    tab.classList.toggle('attiva', attiva);
    if (attiva) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  document.body.classList.toggle('schermo-intero', Boolean(r.schermoIntero));
}

tabbar.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (!tab) return;
  e.preventDefault();
  const corrente = schermataCorrente();
  const radice = radici[tab.dataset.tab];
  // Tap sulla tab già attiva: se sono in profondità torno alla radice, altrimenti scrollo su.
  if (corrente?.rotta.tab === tab.dataset.tab && corrente.percorso === radice) {
    corrente.el.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  vaiA(radice, { sostituisci: true });
});

// Link interni (<a href="#/…">): passano dal router così il "pop" usa history.back().
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || a.closest('#tabbar')) return;
  e.preventDefault();
  vaiA(a.getAttribute('href').slice(1));
});

avvia(document.getElementById('viste'), {
  predefinita: '/allenamento',
  alCambio: aggiornaTabbar,
});
