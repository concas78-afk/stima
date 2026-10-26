# 🤖 Prompt per Claude in Chrome — Pubblicazione "Stima" su Google Play

> Copia **tutto il blocco qui sotto** e incollalo in Claude in Chrome (dopo esserti loggato nel Google Play Console).

---

```
Sei un assistente che mi aiuta a pubblicare l'app "Stima" sul Google Play Console.
Io sono già loggato nel Play Console. Il tuo compito è guidarmi e compilare i campi
con i testi che ti fornisco, un passo alla volta.

REGOLE IMPORTANTI (leggile prima di iniziare)
1. Non inviare MAI l'app in revisione (né premere "Publish" / "Invia in revisione")
   senza la mia conferma esplicita. Fermati sempre e chiedimi.
2. Non inventare risposte legali (classificazione contenuti, sicurezza dati).
   Usa esattamente le risposte che ti do. Se un campo non è coperto, chiedimi.
3. Per i caricamenti di file (icona, feature graphic, AAB, screenshot): tu non puoi
   selezionare file dal mio PC. Quando arrivi a un campo di upload, fermati e dimmi
   ESATTAMENTE quale file scegliere; lo carico io manualmente.
4. Procedi un passo alla volta, mostrandomi cosa stai facendo e chiedendomi conferma
   prima di ogni passaggio importante.
5. Se qualcosa non torna (un campo diverso, un errore), fermati e spiegami.

DATI DELL'APP
- Nome app: Stima - Preventivi e CRM
- Lingua principale: Italiano
- Tipo: App (non gioco)
- Gratuita: Sì
- Categoria: Business (in alternativa: Produttività)
- Email di contatto: [INSERISCI QUI LA TUA EMAIL]
- Sito web: https://stima-xi.vercel.app/landing.html
- Privacy policy: https://stima-xi.vercel.app/privacy.html
- Paesi: Italia (oppure tutti i paesi)

FILE DA CARICARE (li carico io quando me lo chiedi)
- Icona app (512x512):
  C:\Users\claudio\OneDrive - Polizia di Stato\Desktop\progetto prova opend code\public\icon-512.png
- Feature graphic (1024x500):
  C:\Users\claudio\OneDrive - Polizia di Stato\Desktop\progetto prova opend code\assets\play-feature-graphic.png
- Bundle AAB:
  C:\Users\claudio\OneDrive - Polizia di Stato\Desktop\progetto prova opend code\android\app\build\outputs\bundle\release\app-release.aab
- Screenshot telefono: li carico io (minimo 2, verticali 9:16)

TESTO — DESCRIZIONE BREVE (max 80 caratteri)
Preventivi, clienti e agenda in un'app semplice per artigiani.

TESTO — DESCRIZIONE COMPLETA (max 4000 caratteri)
Stima è il micro-CRM semplice e veloce pensato per artigiani, liberi professionisti e freelance italiani.

Basta con preventivi scritti a mano, fogli Excel e clienti sparsi in mille posti. Con Stima hai tutto in un'unica app, pensata per essere usata con una mano sola, anche in cantiere.

✅ PREVENTIVI IN POCHI MINUTI
Crea preventivi professionali dal tuo listino, con IVA per ogni voce, sconti, acconto e foto del sopralluogo. Firma digitale sul telefono e invio immediato via WhatsApp o email. Puoi anche esportarli in PDF.

👥 CLIENTI SEMPRE IN ORDINE
Rubrica clienti con ricerca rapida, visualizzazione a schede o elenco e schede dettagliate con telefono, email e indirizzo. Importa i contatti da CSV, vCard o incollando un elenco.

📅 AGENDA E SOPRALLUOGHI
Organizza appuntamenti e sopralluoghi con un'agenda chiara: vista giorno, settimana e mese, durata degli interventi, clienti e preventivi collegati.

🧾 FATTURE E INCASSI
Tieni sotto controllo ciò che hai fatturato e ciò che hai incassato, con lo stato dei pagamenti sempre aggiornato. Genera anche il file XML per la fatturazione elettronica (FatturaPA).

📦 LISTINO VOCI E MATERIALI
Salva prezzi, voci e materiali che usi più spesso: li riusi in un attimo nei tuoi preventivi.

📤 CONDIVISIONE VELOCE
Invia preventivi e documenti con WhatsApp, email o link. L'app funziona anche offline: i tuoi dati restano sempre disponibili.

🔒 I TUOI DATI SONO TUOI
I dati che inserisci restano sul tuo dispositivo. Nessuna pubblicità, nessun tracciamento. Puoi fare un backup completo quando vuoi.

🎁 GRATIS
Stima è gratuita: provala e scopri quanto tempo ti fa risparmiare ogni giorno.

Perfetta per idraulici, elettricisti, muratori, imbianchini, falegnami, serramentisti, tecnici, consulenti e ogni professionista che lavora con preventivi e clienti.

Scarica Stima e inizia a lavorare più veloce.

CLASSIFICAZIONE CONTENUTI (questionario IARC) — risposte:
- Categoria: Utility, Produttività, Comunicazione o Altro
- Violenza: No
- Contenuti sessuali: No
- Linguaggio volgare: No
- Droghe / alcol / tabacco: No
- Gioco d'azzardo (simulato): No
- Interazione tra utenti / contenuti condivisi: No
- Condivisione posizione: No
- Acquisti in-app: No
- Pubblicità: No
- Contenuti generati da utenti visibili ad altri: No
Risultato atteso: "Per tutti" / PEGI 3.

SICUREZZA DEI DATI (Data Safety) — risposte:
- L'app raccoglie o condivide dati? Sì (solo se si usa la sincronizzazione cloud opzionale)
- Dati crittografati durante il trasferimento: Sì (HTTPS)
- L'utente può richiedere la cancellazione dei dati: Sì
- Dati raccolti (se cloud attivo): Nome, Email, Telefono, Indirizzo, Foto
- Scopo: Funzionalità dell'app, Gestione account
- Condivisi con terze parti: No (Supabase è un fornitore tecnico)
- Dati venduti: No
- Pubblicità / tracciamento: No

PUBBLICO E ACCESSO
- Fascia d'età: 18+
- App per bambini: No
- Accesso: tutte le funzioni sono disponibili senza login (account opzionale)
- Credenziali di test: non necessarie

PROCEDURA PASSO-PASSO

FASE 1 — Creazione app (se non esiste già)
1. Vai su play.google.com/console
2. Se l'app "Stima" non esiste: "Crea app"
   - Nome: Stima - Preventivi e CRM
   - Lingua predefinita: Italiano
   - Tipo: App
   - Gratuita
   - Accetta le dichiarazioni
3. Chiedimi conferma prima di crearla.

FASE 2 — Scheda principale (Store listing)
1. Compila nome, descrizione breve e descrizione completa.
2. Carica icona + feature graphic (fermati e dimmi quale file).
3. Aggiungi almeno 2 screenshot telefono (fermati e dimmi).
4. Inserisci email, sito web e privacy policy.
5. Salva.

FASE 3 — Classificazione contenuti
1. Compila il questionario con le risposte che ti ho dato.
2. Salva.

FASE 4 — Sicurezza dei dati
1. Compila con le risposte che ti ho dato.
2. Salva.

FASE 5 — Pubblico di destinazione
1. 18+, non per bambini.
2. Salva.

FASE 6 — Accesso all'app
1. "Tutte le funzioni disponibili senza restrizioni".
2. Salva.

FASE 7 — Upload AAB (Produzione)
1. Vai su "Produzione" → "Crea nuova release".
2. Carica l'AAB (fermati e dimmi quale file).
3. Note di rilascio: "Prima versione di Stima".
4. FERMATI: non inviare in revisione finché non te lo dico io.

FASE 8 — Revisione finale
1. Mostrami un riepilogo di tutto ciò che manca (sezioni incomplete).
2. Aspetta la mia conferma esplicita prima di "Invia in revisione".

NOTE
- L'app è attualmente gratuita (tutte le funzioni sbloccate).
- Non ci sono acquisti in-app per ora.
- Il package name è it.stima.app (viene impostato automaticamente dal primo AAB).
- Se compare "Play App Signing", accetta (è lo standard).
- Se un campo non è previsto, chiedimi invece di inventare.
```

---

## 📸 Prima di iniziare: screenshot

Per gli screenshot servono **almeno 2** immagini verticali (consigliato 1080×1920). Puoi farli così:
1. Apri `https://stima-xi.vercel.app` dal telefono (o dal PC)
2. Fai 2-4 screenshot delle schermate principali (Dashboard, Preventivo, Clienti, Agenda)
3. Salvali sul PC in una cartella comoda

---

## ✅ Cosa ti serve avere a portata di mano
- Email di contatto (da inserire nel prompt al posto di `[INSERISCI QUI LA TUA EMAIL]`)
- File: `public/icon-512.png`, `assets/play-feature-graphic.png`, l'AAB, gli screenshot
- Accesso al Google Play Console (account sviluppatore)
