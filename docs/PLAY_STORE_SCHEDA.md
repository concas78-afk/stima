# 📱 Scheda Google Play Console — Stima

Documento pronto per la compilazione del **Google Play Console**.
Copia e incolla i testi nelle sezioni indicate.

---

## 1. Informazioni base

| Campo | Valore |
|---|---|
| **Nome app** (max 30 caratteri) | `Stima - Preventivi e CRM` |
| **Categoria** | Business |
| **Tag** | Produttività / CRM |
| **Email di contatto** | *(inserisci la tua email, es. info@stima.it)* |
| **Sito web** | `https://stima-xi.vercel.app/landing.html` |
| **Privacy policy** | `https://stima-xi.vercel.app/privacy.html` |
| **Paesi** | Italia (in alternativa: tutti i paesi) |
| **Tipo** | App gratuita |

---

## 2. Descrizione breve (max 80 caratteri)

> **Preventivi, clienti e agenda in un'app semplice per artigiani.**

*(63 caratteri — alternativa:)*
> **Il CRM semplice per artigiani: preventivi veloci e clienti in ordine.**

---

## 3. Descrizione completa (max 4000 caratteri)

```
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
```

---

## 4. Grafica

| Asset | Specifiche | File pronto |
|---|---|---|
| **Icona app** | PNG 512×512 | `public/icon-512.png` ✅ |
| **Feature graphic** | PNG 1024×500 | `assets/play-feature-graphic.png` ✅ |
| **Screenshot telefono** | min 2, 1080×1920 consigliato | ⬇️ vedi guida sotto |
| **Screenshot tablet** | opzionale (consigliato) | ⬇️ vedi guida sotto |

### 📸 Screenshot consigliati (fai 5-6)

1. **Dashboard** — la schermata iniziale con i numeri (preventivi, clienti, incassi)
2. **Preventivo** — un preventivo aperto con le voci e i totali
3. **Rubrica clienti** — l'elenco clienti
4. **Agenda** — la vista settimanale con gli appuntamenti
5. **Fatture/Incassi** — la lista con gli stati
6. **Listino** — le voci e i materiali

**Come farli:**
- Apri l'app dal telefono (o dal PC) → `https://stima-xi.vercel.app`
- Carica i dati demo (se presenti) o crea 2-3 clienti/preventivi di esempio
- Fai uno screenshot per ogni schermata
- Gli screenshot devono essere **verticali** (ritaglio 9:16)

> 💡 Suggerimento: usa la modalità chiara, senza dati personali reali (usa nomi tipo "Mario Rossi").

---

## 5. Classificazione contenuti (questionario IARC)

Rispondi così:

| Domanda | Risposta |
|---|---|
| Categoria del questionario | **Utility, Produttività, Comunicazione o Altro** |
| Violenza | No |
| Contenuti sessuali | No |
| Linguaggio volgare | No |
| Droghe / alcol / tabacco | No |
| Gioco d'azzardo (simulato) | No |
| Interazione tra utenti / contenuti condivisi | **No** (è un CRM privato, nessuna funzione social) |
| Condivisione posizione | No |
| Acquisti in-app | **No** (al momento l'app è gratuita) |
| Pubblicità | **No** |
| Contenuti generati dall'utente visibili ad altri | No |

➡️ Risultato atteso: **Classificazione "Per tutti" / PEGI 3**.

---

## 6. Sicurezza dei dati (Data Safety)

L'app salva i dati **sul dispositivo**. La sincronizzazione cloud (Supabase) è **opzionale** (solo se l'utente crea un account).

### Risposte consigliate

| Domanda | Risposta |
|---|---|
| L'app raccoglie o condivide dati? | **Sì** (solo se si usa la sincronizzazione cloud) |
| I dati sono crittografati durante il trasferimento? | **Sì** (HTTPS) |
| L'utente può richiedere la cancellazione dei dati? | **Sì** (cancellando l'account o i dati dall'app) |

### Dati raccolti (se cloud attivo)

| Tipo | Raccolto | Scopo |
|---|---|---|
| **Nome** | Sì | Funzionalità dell'app |
| **Email** | Sì | Gestione account / login |
| **Telefono** | Sì | Funzionalità dell'app (contatti clienti) |
| **Indirizzo** | Sì | Funzionalità dell'app (clienti / sopralluoghi) |
| **Foto** | Sì | Funzionalità dell'app (foto sopralluogo) |

- **Dati condivisi con terze parti?** → No (Supabase è un fornitore tecnico, non rivende i dati)
- **Dati venduti?** → No
- **Pubblicità / tracciamento?** → No

> ⚠️ Se in futuro togli la sincronizzazione cloud o la rendi obbligatoria, aggiorna questa sezione.

---

## 7. Pubblico e accesso

| Domanda | Risposta |
|---|---|
| **Fascia d'età** | 18+ (adulti / professionisti) |
| **L'app è per bambini?** | No |
| **Accesso all'app** | Tutte le funzioni sono disponibili **senza login** (account opzionale) |
| **Credenziali di test** | Non necessarie (l'app funziona senza account) |

---

## 8. Checklist finale prima dell'invio

- [ ] Nome app inserito: `Stima - Preventivi e CRM`
- [ ] Descrizione breve + completa incollate
- [ ] Icona 512×512 caricata (`public/icon-512.png`)
- [ ] Feature graphic 1024×500 caricata (`assets/play-feature-graphic.png`)
- [ ] Almeno 2 screenshot telefono caricati
- [ ] Privacy policy URL inserita
- [ ] Email di contatto inserita
- [ ] Classificazione contenuti completata
- [ ] Scheda Sicurezza dei dati compilata
- [ ] Pubblico di destinazione impostato (18+)
- [ ] **AAB caricato**: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Inviato in revisione

---

## 9. Dopo la pubblicazione

- La revisione di Google richiede in genere **1-7 giorni**.
- Se viene rifiutata, leggi il motivo (spesso è un campo mancante o una policy sulla privacy) e correggi.
- Per gli aggiornamenti futuri: ricompila l'AAB, incrementa `versionCode` (in `android/app/build.gradle`) e carica.

---

*Documento generato per il progetto Stima.*
