# fitness-app
PWA offline per creare schede di allenamento e tracciare i progressi in palestra. HTML/JS puro + IndexedDB, nessun backend: si installa sulla Home dell'iPhone e funziona senza rete.

# GymLog
Web app installabile (PWA) per gestire le schede di allenamento e
tenere traccia dei carichi, pensata per l'uso in palestra da smartphone.

- Crea più schede (es. "Upper A", "Lower B") scegliendo gli esercizi
  da un catalogo filtrabile per Upper/Lower e Fondamentali/Complementari
- Durante l'allenamento ti mostra cosa hai fatto la volta precedente
  e ti permette di registrare il nuovo carico
- Funziona offline: i dati restano sul dispositivo (IndexedDB)

## Modello dati
- `schede`: composizione delle schede (nome → elenco esercizi)
- `progressi`: storico dei carichi per esercizio, indipendente dalle schede

## Stack
HTML, CSS, JavaScript (ES modules), IndexedDB, Service Worker.
Nessun framework, nessun backend, nessuna build.
