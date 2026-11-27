# CLAUDE.md — Fapp

Linee guida per lavorare su questo progetto. Rispondi in italiano.

## Cos'è
**Fapp**: web app installabile (PWA) per creare schede di allenamento, seguire l'allenamento
in palestra (serie, kg, reps, timer di recupero) e vedere progressi e record.
Target unico: **iPhone 15 Pro, iOS 27, Safari → "Aggiungi alla schermata Home"**.
Niente App Store / licenza Apple Developer: la PWA è la scelta voluta, non va riproposta un'alternativa nativa.

## Vincoli tecnici
- **Vanilla HTML/CSS/JS con ES modules**, nessun framework, nessun build step, nessuna dipendenza npm.
  Niente Vite, niente Dexie (decisione presa: IndexedDB a mano in `js/db.js`).
  Si apre `index.html` servito da un server statico e funziona.
- **Offline-first**: in palestra la rete può mancare. Tutto deve funzionare senza connessione
  dopo il primo caricamento (service worker `sw.js` con cache degli asset).
- **Tutti i dati in IndexedDB**, nessun backend, nessun account. Accesso al DB solo tramite `js/db.js`,
  che fa da "repository": le viste non toccano mai IndexedDB, così in futuro si può sostituire con un backend.
- Hosting: **GitHub Pages** (HTTPS, richiesto da service worker e installazione).
  L'app vive in una sottocartella (`https://<utente>.github.io/fitness-app/`):
  **usare sempre percorsi relativi** (`./…`), mai assoluti (`/…`). Routing solo via hash (`#/…`),
  così GitHub Pages non restituisce 404 sui deep link.
- UI **mobile-first, una mano, pollice**: bottoni grandi (min 44×44 pt), input numerici con
  `inputmode="decimal"` (kg) / `"numeric"` (reps) e font-size ≥ 16px (evita lo zoom di iOS),
  rispettare le safe area (`env(safe-area-inset-*)`), dark mode.

## Schermo target: iPhone 15 Pro
| Grandezza | Valore |
|---|---|
| Diagonale | 6,1" — OLED Super Retina XDR, ProMotion 120 Hz |
| Risoluzione fisica | 1179 × 2556 px, 460 ppi |
| Device pixel ratio | 3 (`@3x`) |
| **Viewport CSS (portrait)** | **393 × 852 pt** |
| Safe area portrait | top **59** (Dynamic Island) · bottom **34** (home indicator) · left/right 0 |
| Safe area landscape | left/right **59** · bottom **21** · top 0 |
| Status bar | ~54 pt (con `black-translucent` il contenuto ci passa sotto → usare safe-area-top) |
| Icona Home | `apple-touch-icon` 180 × 180 px |

- Progettare per **393 pt di larghezza**: con margini laterali di 16 pt restano 361 pt utili.
- In standalone + `black-translucent` la pagina occupa tutti gli 852 pt: lo spazio verticale
  utile è 852 − 59 − 34 = **759 pt**, meno la tab bar (49 pt).
- **Non scrivere in CSS i valori delle safe area**: usare sempre `env(safe-area-inset-*)`
  (i numeri qui sopra servono per il layout e per la modalità mobile dei DevTools: preset
  "iPhone 15 Pro" o custom 393×852, DPR 3). Su iOS 27 i valori vanno ricontrollati sul dispositivo.
- Le stesse grandezze sono in `css/style.css` come custom properties (`--screen-w`, `--tap-min`, …).
- App pensata solo in **portrait**.

## Struttura file
```
index.html               shell dell'app + meta iOS (apple-touch-icon, status bar, viewport-fit)
manifest.webmanifest     nome, icone, display: standalone
sw.js                    service worker: cache degli asset (nella radice del progetto)
css/style.css            stili + design token
js/app.js                avvio: registra il SW, tab bar, mini-barra workout, avvia il router
js/router.js             router su hash con transizioni push/slide
js/stato.js              store pub/sub minimale (allenamento attivo, timer)
js/db.js                 unico modulo che parla con IndexedDB (API async/Promise)
js/calcoli.js            volume, 1RM (Epley), PR, streak
js/dati/esercizi-seed.js ~60 esercizi in italiano
js/views/                una vista per file (allenamento, scheda-editor, workout-live, riepilogo,
                         esercizi, esercizio-dettaglio, profilo)
js/ui/                   componenti: sheet (action/bottom sheet), timer, audio, grafico SVG, wake lock
icons/                   icon-180.png (apple-touch-icon), icon-192.png, icon-512.png
```

## Modello dati (IndexedDB `gym-db`)
Ogni modifica allo schema → incrementare `DB_VERSION` e gestire la migrazione in `onupgradeneeded`,
**senza mai perdere dati esistenti**. (v1 aveva `schede` + `progressi` nel vecchio formato: la v2 li migra.)

### `esercizi`
```js
{ id: "panca-piana-bilanciere",      // = normalizzaNome(nome), stabile
  nome: "Panca piana bilanciere",
  muscoloPrimario: "petto", muscoliSecondari: ["tricipiti", "deltoidi anteriori"],
  attrezzo: "bilanciere",            // bilanciere|manubri|macchina|cavi|corpo_libero|altro
  tipo: "peso_reps",                 // peso_reps | corpo_libero_reps | durata
  custom: false, note: "" }
```

### `cartelle`
```js
{ id, nome, ordine }
```

### `schede` (le "routine")
```js
{ id, nome, cartellaId: null, aggiornataIl: "ISO",
  esercizi: [{ esercizioId, recuperoSec: 120, nota: "", superset: null,
               serie: [{ tipo: "normale", kgTarget: 60, repsTarget: 8 }] }] }
```

### `allenamenti` (workout salvati)
```js
{ id, nome, schedaId: null, iniziatoIl: "ISO", finitoIl: "ISO", nota: "",
  eserciziIds: ["panca-piana-bilanciere", …],   // per l'indice multiEntry
  esercizi: [{ esercizioId, nota, superset,
               serie: [{ tipo: "normale|riscaldamento|cedimento|drop",
                         kg, reps, durataSec, rpe, completata, completataIl }] }] }
```
Indici: `iniziatoIl`, `eserciziIds` (multiEntry), `schedaId`.
Storico, "precedente" e record di un esercizio si **calcolano** da qui (non c'è più uno store `progressi`).

### `allenamentoAttivo`
Un solo record (`id: "corrente"`) con lo stato del workout in corso, stessa forma di `allenamenti`
+ `recuperoFineAl`. Salvato a ogni modifica e subito su `visibilitychange` → hidden:
deve sopravvivere alla chiusura dell'app.

### `impostazioni`
Chiave/valore: `recuperoDefaultSec`, `suono`, `riscaldamentoNelleStatistiche`.

**Regola chiave**: l'id dell'esercizio è il nome normalizzato (minuscolo, senza accenti,
spazi → `-`), generato da `normalizzaNome()` in `db.js`, e collega schede, allenamenti e storico.

## Timer (iOS sospende JS in background)
- Mai incrementare contatori: calcolare sempre da timestamp salvati (`iniziatoIl`, `recuperoFineAl`)
  e riallineare l'UI su `visibilitychange`.
- Fine recupero: suono breve via Web Audio API (sbloccato al primo tap) + feedback visivo.
  **Niente Vibration API** (non c'è su iOS). Screen Wake Lock durante il workout, se disponibile.

## Persistenza dei dati (importante su iOS)
- Chiamare `navigator.storage.persist()` all'avvio.
- Prevedere **export/import JSON** dei dati come backup: se l'app viene rimossa dalla Home
  o i dati del sito vengono cancellati, IndexedDB si perde.
- I dati della PWA installata sono separati da quelli di Safari: testare sempre dalla Home.

## Service worker
- Incrementare `CACHE_VERSION` in `sw.js` ad ogni modifica di asset, altrimenti l'iPhone
  continua a usare i file vecchi.
- Aggiungere ogni nuovo file statico alla lista `ASSETS`.

## Sviluppo e test
- Server locale: `npx serve .` oppure `python -m http.server 8000` dalla radice
  (su questo PC né Node né Python sono installati: in alternativa l'estensione VS Code "Live Server").
- Test su iPhone: push su GitHub → GitHub Pages (HTTPS) → aprire in Safari → "Aggiungi alla schermata Home".
- Prima di dire che una funzione è pronta, verificare il flusso nel browser (DevTools in modalità mobile).

## Piano Stage 1 (fermarsi a fine step per i test sul telefono)
(a) shell PWA + tab bar + safe area + SW · (b) data layer + seed + libreria esercizi ·
(c) schede e cartelle · (d) workout live + timer · (e) riepilogo, salvataggio, PR ·
(f) dettaglio esercizio con grafici · (g) profilo, calendario, export/import.
Fuori scope (ma da non precludere): social, account/sync, Apple Health, diagramma muscolare,
misurazioni, foto, backend Node.

## Linee guida UI
- Sfondo quasi nero, card grigio scuro, **un solo accento blu**, verde = serie completata, oro = PR.
- Font di sistema (`-apple-system`), numeri `tabular-nums`.
- Transizioni push/slide, action sheet e bottom sheet in stile iOS.
- Una mano e mani sudate: target grandi, 1 tap per completare una serie uguale alla precedente.

## Convenzioni
- Codice e nomi di dominio in **italiano** (scheda, esercizio, serie, recupero); keyword JS ovviamente in inglese.
- `async/await`, niente callback annidate.
- Niente librerie esterne senza chiedere prima.
