// Router su hash (#/percorso) con pila di schermate e transizioni push/pop stile iOS.
//
// Ogni rotta ha:
//   tab          → a quale tab appartiene ('allenamento' | 'esercizi' | 'profilo')
//   profondita   → 0 = radice della tab; maggiore = schermata "spinta" sopra
//   schermoIntero→ nasconde la tab bar (es. workout live)
//   genitore     → percorso a cui torna "Indietro" se la schermata è stata aperta direttamente
//   vista(ctx)   → async, restituisce un Node. ctx = { params, alDistruggere(fn), alRitorno(fn) }
//
// Le schermate sotto la cima restano nel DOM (nascoste) così tornando indietro
// si ritrova lo scroll; alRitorno(fn) permette di aggiornare i dati quando ridiventano visibili.

const rotte = [];
let contenitore = null;
let opzioniAvvio = {};
let pila = [];        // [{ percorso, rotta, params, el, distruttori, ritorni, conHistory }]
let token = 0;        // per scartare navigazioni superate da una più recente
let prossimaConHistory = false;

const ridotto = matchMedia('(prefers-reduced-motion: reduce)');
const DURATA = 380;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export function rotta(pattern, opzioni) {
  const chiavi = [];
  const sorgente = pattern.replace(/:(\w+)/g, (_, k) => { chiavi.push(k); return '([^/]+)'; });
  rotte.push({ pattern, re: new RegExp(`^${sorgente}/?$`), chiavi, profondita: 0, ...opzioni });
}

export function avvia(el, opzioni) {
  contenitore = el;
  opzioniAvvio = opzioni;
  window.addEventListener('hashchange', gestisci);
  gestisci();
}

export function percorsoAttuale() {
  return location.hash.replace(/^#/, '') || '/';
}

export function schermataCorrente() {
  return pila.at(-1) ?? null;
}

export function vaiA(percorso, { sostituisci = false } = {}) {
  if (percorso === percorsoAttuale()) return;
  if (sostituisci) {
    location.replace(`#${percorso}`);
  } else {
    prossimaConHistory = true;
    location.hash = percorso;
  }
}

export function indietro() {
  const cima = pila.at(-1);
  const sotto = pila.at(-2);
  if (!sotto) {
    // Aperta da link diretto: non c'è niente sotto → vado al genitore dichiarato nella rotta.
    if (cima?.rotta.genitore) vaiA(cima.rotta.genitore, { sostituisci: true });
    return;
  }
  if (cima.conHistory) history.back();
  else vaiA(sotto.percorso, { sostituisci: true });
}

function trova(percorso) {
  for (const r of rotte) {
    const m = percorso.match(r.re);
    if (!m) continue;
    const params = {};
    r.chiavi.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    return { rotta: r, params };
  }
  return null;
}

async function gestisci() {
  const mio = ++token;
  const conHistory = prossimaConHistory;
  prossimaConHistory = false;

  const percorso = percorsoAttuale();
  const trovata = trova(percorso);
  if (!trovata) {
    vaiA(opzioniAvvio.predefinita, { sostituisci: true });
    return;
  }

  const cima = pila.at(-1);
  if (cima?.percorso === percorso) return;

  // Pop: la destinazione è già nella pila (es. bottone Indietro, swipe back).
  const indice = pila.findIndex((s) => s.percorso === percorso);
  if (indice !== -1) {
    await pop(indice);
    return;
  }

  const { rotta: r, params } = trovata;
  const schermata = { percorso, rotta: r, params, el: null, distruttori: [], ritorni: [], conHistory };
  const ctx = {
    params,
    alDistruggere: (fn) => schermata.distruttori.push(fn),
    alRitorno: (fn) => schermata.ritorni.push(fn),
  };

  let contenuto;
  try {
    contenuto = await r.vista(ctx);
  } catch (err) {
    console.error(err);
    contenuto = schermataErrore(err);
  }
  if (mio !== token) { distruggi(schermata); return; }

  const el = document.createElement('section');
  el.className = 'schermata';
  el.append(contenuto);
  schermata.el = el;

  const stessaTab = cima && cima.rotta.tab === r.tab;
  opzioniAvvio.alCambio?.(r, params);

  if (stessaTab && r.profondita > cima.rotta.profondita) {
    // PUSH
    contenitore.append(el);
    pila.push(schermata);
    await animaPush(el, cima.el);
    if (pila.at(-1) === schermata) cima.el.classList.add('nascosta');
  } else {
    // SOSTITUZIONE (cambio tab, deep link, livello più alto non in pila)
    const vecchie = pila;
    pila = [schermata];
    if (stessaTab && cima) {
      contenitore.insertBefore(el, cima.el);
      await animaPop(cima.el, el);
    } else {
      contenitore.append(el);
    }
    vecchie.forEach(distruggi);
  }
}

async function pop(indice) {
  const destinazione = pila[indice];
  const rimosse = pila.slice(indice + 1);
  pila = pila.slice(0, indice + 1);
  opzioniAvvio.alCambio?.(destinazione.rotta, destinazione.params);

  destinazione.el.classList.remove('nascosta');
  rimosse.slice(0, -1).forEach((s) => s.el.classList.add('nascosta'));
  await animaPop(rimosse.at(-1).el, destinazione.el);
  rimosse.forEach(distruggi);
  destinazione.ritorni.forEach((fn) => fn());
}

function distruggi(s) {
  s.distruttori.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  s.el?.remove();
}

function anima(el, fotogrammi) {
  if (ridotto.matches) return Promise.resolve();
  return el.animate(fotogrammi, { duration: DURATA, easing: EASING }).finished.catch(() => {});
}

function animaPush(nuova, vecchia) {
  return Promise.all([
    anima(nuova, [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }]),
    anima(vecchia, [
      { transform: 'translateX(0)', filter: 'brightness(1)' },
      { transform: 'translateX(-30%)', filter: 'brightness(0.6)' },
    ]),
  ]);
}

function animaPop(uscente, entrante) {
  return Promise.all([
    anima(uscente, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }]),
    anima(entrante, [
      { transform: 'translateX(-30%)', filter: 'brightness(0.6)' },
      { transform: 'translateX(0)', filter: 'brightness(1)' },
    ]),
  ]);
}

function schermataErrore(err) {
  const div = document.createElement('div');
  div.className = 'contenuto';
  div.innerHTML = '<h1 class="titolo-grande">Ops</h1><p class="testo-secondario"></p>';
  div.querySelector('p').textContent = `Qualcosa è andato storto: ${err?.message ?? err}`;
  return div;
}
