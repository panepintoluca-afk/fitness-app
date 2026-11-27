// Tab "Profilo". Step (a): solo il link a Impostazioni (serve anche a provare la transizione push).
import { html, raw, crea } from '../ui/dom.js';
import { icone } from '../ui/icone.js';
import { titoloGrande } from '../ui/componenti.js';

export async function render() {
  const el = crea(html`
    <div class="contenuto">
      <div class="card vuoto">
        <p>Statistiche, calendario e storico arrivano allo step (g).</p>
      </div>
      <div class="gruppo">
        <a class="riga" href="#/profilo/impostazioni">
          <span class="riga-icona">${raw(icone.ingranaggio)}</span>
          <span class="riga-testo">Impostazioni</span>
          <span class="riga-freccia">${raw(icone.avanti)}</span>
        </a>
      </div>
    </div>
  `);
  el.prepend(titoloGrande('Profilo'));
  return el;
}
