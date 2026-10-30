# 🤖 Prompt per Claude in Chrome — Aggiornare la release su Google Play

> Copia tutto il blocco qui sotto e incollalo in Claude in Chrome (già loggato nel Play Console).

---

```
Sei in Claude in Chrome e mi aiuti ad AGGIORNARE una release già caricata sul Google Play Console.
Sono già loggato nel Play Console.

CONTESTO
- App: Stima
- Devo sostituire la versione precedente con una NUOVA versione (versionCode 2, versionName 1.0.1).
- Il file da caricare è:
  C:\Users\claudio\OneDrive - Polizia di Stato\Desktop\Stima - File Play Store\Stima-1.0.1.aab
- La modifica rispetto alla versione precedente: correzione della barra di navigazione su Android
  (i pulsanti non si sovrappongono più ai tasti di sistema).

REGOLE IMPORTANTI
1. Non inviare MAI in revisione (né premere "Pubblica" / "Invia in revisione") senza la mia
   conferma esplicita. Fermati sempre e chiedimi.
2. Per l'upload del file: tu non puoi selezionare file dal mio PC. Quando arrivi al campo di
   upload, fermati e dimmi ESATTAMENTE quale file selezionare; lo carico io manualmente.
3. Procedi un passo alla volta, mostrandomi cosa fai e chiedendomi conferma prima di ogni
   azione importante.
4. Se compare un errore (es. "versionCode già utilizzato", "bundle non valido"), fermati e
   spiegami cosa dice, senza inventare soluzioni.

PROCEDURA
1. Vai su play.google.com/console e apri l'app "Stima".
2. Vai nella sezione dove avevo caricato la release precedente:
   - Se era in "Produzione" → Produzione → Release
   - Se era in un'altra traccia (Test interno / Test chiuso) → vai lì
3. Apri la release in bozza (draft) in modifica.
   - Se non c'è una bozza: "Crea nuova release".
4. Nella sezione "Bundle dell'app" (App bundle):
   - Se c'è già il vecchio AAB, scegli di SOSTITUIRLO / AGGIORNARLO (se chiede di scartare
     la bozza, chiedimi prima).
   - Fermati e dimmi di selezionare questo file:
     C:\Users\claudio\OneDrive - Polizia di Stato\Desktop\Stima - File Play Store\Stima-1.0.1.aab
5. Verifica che il Play Console mostri:
   - versionCode: 2
   - versionName: 1.0.1
   (Se mostra ancora 1 / 1.0, dimmelo: significa che è stato caricato il file vecchio.)
6. Nelle "Note di rilascio" (release notes) scrivi:
   "Correzione della barra di navigazione su Android: i pulsanti non si sovrappongono più ai tasti di sistema."
7. Salva (Save).
8. NON inviare in revisione. Mostrami un riepilogo di cosa manca e aspetta la mia conferma
   esplicita prima di procedere.

NOTE
- Se la release precedente era già stata inviata in revisione o pubblicata, potrebbe servire
  creare una NUOVA release (non modificare quella pubblicata). In quel caso spiegami e chiedimi.
- Se il Play Console chiede di "rivedere" o "confermare" qualcosa, mostrami la schermata.
- Se compare la richiesta di "Play App Signing", accetta (è lo standard).
```

---

## 📁 File da scegliere

Quando Claude te lo chiede, seleziona:

```
C:\Users\claudio\OneDrive - Polizia di Stato\Desktop\Stima - File Play Store\Stima-1.0.1.aab
```

> ⚠️ **Attenzione**: nella cartella c'è ancora anche il vecchio `Stima-1.0.aab`. Scegli quello **1.0.1**!

## ✅ Cosa cambia

- **versionCode 2** (necessario: Google non accetta due volte lo stesso numero)
- **versionName 1.0.1**
- Fix della barra di navigazione Android
