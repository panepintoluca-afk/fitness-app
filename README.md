# Fapp

PWA offline per creare schede di allenamento, seguire il workout in palestra e tracciare
progressi e record. HTML/CSS/JS puro + IndexedDB, nessun backend, nessuna build:
si installa sulla Home dell'iPhone e funziona senza rete.

## Funzioni (Stage 1, in corso)
- Schede organizzate in cartelle, con serie, kg/reps target, recupero e superset
- Workout live: valori della volta precedente, ✓ per completare la serie, timer di recupero
- Libreria di ~60 esercizi in italiano + esercizi personalizzati
- Dettaglio esercizio con grafici, storico e record (1RM stimato con Epley)
- Profilo con calendario, storico allenamenti ed export/import JSON dei dati

## Stack
HTML, CSS, JavaScript (ES modules), IndexedDB, Service Worker. Hosting su GitHub Pages.

## Avvio in locale
Servire la cartella con un qualsiasi server statico (es. estensione VS Code "Live Server",
`npx serve .` o `python -m http.server 8000`) e aprire `http://localhost:…`.
