// Tab "Allenamento" (home). Step (a): solo layout; schede e workout arrivano negli step (c) e (d).
import { html, raw, crea } from '../ui/dom.js';
import { icone } from '../ui/icone.js';
import { titoloGrande } from '../ui/componenti.js';

export async function render() {
  const el = crea(html`
    <div class="contenuto">
      <button class="btn btn-primario btn-largo" type="button" disabled>
        ${raw(icone.piu)} Inizia allenamento vuoto
      </button>

      <div class="sezione-testata">
        <h2 class="sezione-titolo">Schede</h2>
      </div>
      <div class="riga-bottoni">
        <button class="btn btn-secondario" type="button" disabled>${raw(icone.piu)} Nuova scheda</button>
        <button class="btn btn-secondario" type="button" disabled>${raw(icone.cartella)} Nuova cartella</button>
      </div>

      <div class="card vuoto">
        <p>Nessuna scheda ancora.</p>
        <p class="testo-secondario">Le schede arrivano allo step (c).</p>
      </div>
    </div>
  `);
  el.prepend(titoloGrande('Allenamento'));
  return el;
}
