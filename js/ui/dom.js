// Helper minimi per costruire DOM da template string, con escaping automatico.
//   html`<p>${nomeUtente}</p>`   → i valori vengono escapati
//   html`<ul>${lista.map(x => html`<li>${x}</li>`)}</ul>`  → annidabile
//   raw(stringa)                  → inserisce HTML fidato senza escaping (es. icone SVG)

const RAW = Symbol('raw');

export const raw = (s) => ({ [RAW]: String(s) });

export function esc(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function valore(v) {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(valore).join('');
  if (typeof v === 'object' && RAW in v) return v[RAW];
  return esc(v);
}

export function html(strings, ...valori) {
  let out = strings[0];
  valori.forEach((v, i) => { out += valore(v) + strings[i + 1]; });
  return raw(out);
}

// Trasforma un html`` in nodo DOM: elemento singolo se la radice è una, altrimenti DocumentFragment.
export function crea(frammento) {
  const t = document.createElement('template');
  t.innerHTML = (typeof frammento === 'object' && RAW in frammento ? frammento[RAW] : String(frammento)).trim();
  return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content;
}
