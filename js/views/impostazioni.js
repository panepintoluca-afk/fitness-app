// Impostazioni (Profilo → Impostazioni). Step (a): solo la sezione Diagnostica,
// utile per verificare sul telefono standalone, safe area, service worker e storage.
import { html, crea } from '../ui/dom.js';
import { navbar } from '../ui/componenti.js';
import { VERSIONE_APP } from '../config.js';

function safeArea() {
  const sonda = document.createElement('div');
  sonda.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(sonda);
  const s = getComputedStyle(sonda);
  const v = [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map((x) => parseFloat(x) || 0);
  sonda.remove();
  return v;
}

async function diagnostica() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const [top, right, bottom, left] = safeArea();
  const persistente = (await navigator.storage?.persisted?.()) ?? null;
  const sw = navigator.serviceWorker?.controller ? 'attivo' : 'non attivo';
  return [
    ['Versione', VERSIONE_APP],
    ['Modalità', standalone ? 'App (Home)' : 'Browser'],
    ['Viewport', `${innerWidth} × ${innerHeight} pt`],
    ['Pixel ratio', `${devicePixelRatio}×`],
    ['Safe area', `↑${top} →${right} ↓${bottom} ←${left}`],
    ['Service worker', sw],
    ['Storage persistente', persistente === null ? 'n/d' : persistente ? 'sì' : 'no'],
    ['Online', navigator.onLine ? 'sì' : 'no'],
  ];
}

export async function render() {
  const righe = await diagnostica();
  const el = crea(html`
    <div>
      <div class="contenuto">
        <h2 class="sezione-titolo">Diagnostica</h2>
        <div class="gruppo">
          ${righe.map(([k, v]) => html`
            <div class="riga">
              <span class="riga-testo">${k}</span>
              <span class="riga-valore">${v}</span>
            </div>`)}
        </div>
        <p class="nota-piccola">Timer, suono, warm-up e backup arrivano allo step (g).</p>
      </div>
    </div>
  `);
  el.prepend(navbar({ titolo: 'Impostazioni', etichettaIndietro: 'Profilo' }));
  return el;
}
