# QuickCraft CRM 💼⚡
> **Micro CRM & Preventivi Veloci per Artigiani, Freelance e Professionisti**

QuickCraft CRM è un'applicazione web mobile-first pensata per risolvere il problema numero 1 di artigiani e freelance: **gestire i clienti e incassare velocemente senza software contabili complicati**.

---

## 🚀 Come testarla subito sul tuo computer

1. Vai nella cartella `progetto prova opend code` sul tuo Desktop.
2. Fai doppio clic sul file **`index.html`** (si aprirà direttamente nel tuo browser: Chrome, Edge, Safari, Firefox).
3. Troverai già caricati dei **dati dimostrativi** (clienti e preventivi di esempio) per poter provare subito tutte le funzioni!

---

## ✨ Funzionalità Pronte all'Uso

1. **Dashboard Finanziaria:**
   - Calcolo istantaneo del fatturato incassato (Saldato), in attesa e approvato.
   - Tasso di chiusura trattative in percentuale.
   - Accesso rapido alle azioni più frequenti.

2. **Rubrica Clienti con WhatsApp One-Click:**
   - Scheda anagrafica completa (telefono, email, indirizzo, note).
   - Tasto verde **WhatsApp**: apre la chat WhatsApp con messaggio personalizzato già compilato.
   - Chiamata rapida ed invio email con un clic.

3. **Generatore di Preventivi in 30 Secondi:**
   - Numerazione progressiva automatica (`PREV-2026-001`).
   - Calcolo automatico di subtotale, sconti ed eventuale IVA.
   - Stati avanzamento: *Bozza*, *Inviato*, *Approvato*, *Saldato*, *Rifiutato*.
   - **Condivisione WhatsApp:** genera un messaggio di riepilogo con l'importo totale pronto da spedire.

4. **Stampa A4 e Download PDF:**
   - Layout elegante e conforme con intestazione aziendale, dati cliente, tabella prezzi e coordinate IBAN.
   - Spazio per la firma del cliente per accettazione.
   - Pulsante dedicato per salvare come PDF o stampare su carta.

5. **Privacy & Offline First:**
   - Tutti i dati rimangono memorizzati nel browser del dispositivo (`localStorage`).
   - Pulsanti per **Esportare un Backup JSON** e ripristinarlo in qualsiasi momento.

---

## 📱 Come usarla su Smartphone (Android & iOS)

### Metodo 1: Progressive Web App (PWA) - Immediato e Senza Costi
Puoi installarla su qualsiasi smartphone senza passare dagli store:
- **iPhone (Safari):** Apri l'app nel browser, tocca il pulsante **Condividi** (quadrato con freccia verso l'alto) e seleziona **"Aggiungi alla schermata Home"**.
- **Android (Chrome):** Apri l'app, tocca i tre puntini in alto a destra e seleziona **"Installa app"** o **"Aggiungi a schermata Home"**.
L'app si aprirà a schermo intero come un'app nativa con la sua icona dedicata!

### Metodo 2: Compilazione Nativa con Capacitor (Google Play & App Store)
Grazie al file `capacitor.config.json` già presente nel progetto, puoi generare i progetti nativi:
```bash
# Installa Capacitor
npm install @capacitor/core @capacitor/cli

# Aggiungi le piattaforme native
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Apri in Android Studio o Xcode per pubblicare
npx cap open android
npx cap open ios
```

---

## 💰 Strategia di Monetizzazione (Come fare soldi con questo tool)

1. **Modello Micro-SaaS ad Abbonamento (B2B):**
   - **Piano Free:** Fino a 3 clienti e 3 preventivi al mese (gratis per far provare il valore).
   - **Piano Pro:** 7,99€ / mese oppure 79,90€ / anno (clienti e preventivi illimitati, logo personalizzato, firma digitale, backup cloud automatico).
   - **Perché funziona:** Per un idraulico, un imbianchino o un personal trainer, 7,99€ al mese equivalgono a meno di un caffè a settimana: se gli fa risparmiare 5 ore al mese e gli fa chiudere un lavoro in più, è un acquisto automatico.

2. **Integrazione Pagamenti (Stripe / Lemon Squeezy):**
   - Puoi integrare **Stripe Checkout** per riscuotere l'abbonamento mensile direttamente dal sito web o dall'app.
