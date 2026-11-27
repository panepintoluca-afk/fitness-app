// Pezzi di UI riusati da più viste.
import { html, raw, crea } from './dom.js';
import { icone } from './icone.js';
import { indietro } from '../router.js';

// Barra di navigazione per le schermate "spinte" (profondità > 0): ‹ Indietro · Titolo · azione
export function navbar({ titolo, etichettaIndietro = 'Indietro', azione = null }) {
  const el = crea(html`
    <header class="navbar">
      <button class="navbar-indietro" type="button">${raw(icone.indietro)}<span>${etichettaIndietro}</span></button>
      <h1 class="navbar-titolo">${titolo}</h1>
      <div class="navbar-azione"></div>
    </header>
  `);
  el.querySelector('.navbar-indietro').addEventListener('click', indietro);
  if (azione) el.querySelector('.navbar-azione').append(azione);
  return el;
}

// Intestazione con titolo grande per le schermate radice delle tab.
export function titoloGrande(titolo) {
  return crea(html`<header class="intestazione"><h1 class="titolo-grande">${titolo}</h1></header>`);
}
