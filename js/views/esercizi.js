// Tab "Esercizi" (libreria). Step (a): solo layout; dati e filtri arrivano allo step (b).
import { html, raw, crea } from '../ui/dom.js';
import { icone } from '../ui/icone.js';
import { titoloGrande } from '../ui/componenti.js';

export async function render() {
  const el = crea(html`
    <div class="contenuto">
      <label class="campo-ricerca">
        ${raw(icone.cerca)}
        <input type="search" placeholder="Cerca esercizio" autocomplete="off" enterkeyhint="search">
      </label>
      <div class="card vuoto">
        <p>La libreria esercizi arriva allo step (b).</p>
      </div>
    </div>
  `);
  el.prepend(titoloGrande('Esercizi'));
  return el;
}
