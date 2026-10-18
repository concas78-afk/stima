# 💳 Guida all'Integrazione dei Pagamenti (Passo 3)

Questa guida spiega come collegare QuickCraft CRM a un sistema di pagamento per
incassare gli abbonamenti Pro dai tuoi clienti.

> **Importante:** questo serve per incassare TU l'abbonamento (7,99 €/mese o 79,90 €/anno).
> È diverso dal "link di pagamento" che abbiamo aggiunto per far incassare gli artigiani
> dai LORO clienti.

---

## Scelta consigliata: Paddle o Lemon Squeezy (Merchant of Record)

Per una SRL italiana che vende in tutta Europa, consigliamo **Paddle** o **Lemon Squeezy**:
sono "Merchant of Record", cioè emettono loro la fattura al cliente finale e versano
l'IVA per te, evitandoti la complessità del regime OSS/IVA intracomunitaria.

| | Paddle | Lemon Squeezy | Stripe |
|---|---|---|---|
| Merchant of Record (gestisce IVA UE) | ✅ | ✅ | ❌ (la gestisci tu) |
| Abbonamenti ricorrenti | ✅ | ✅ | ✅ |
| Commissione tipica | ~5% + 0,50 € | ~5% + 0,50 € | ~1,4% + 0,25 € |
| Facilità di setup | Media | Alta | Media |

---

## Procedura (con Lemon Squeezy, il più semplice)

1. **Crea l'account** su <https://www.lemonsqueezy.com>.
2. Vai su **Products → New product** e crea un prodotto "Subscription" (abbonamento).
3. Configura due varianti di prezzo:
   - **Mensile** → 7,99 € (rinnovo automatico ogni mese)
   - **Annuale** → 79,90 € (rinnovo ogni anno)
4. Nelle impostazioni del prodotto, imposta una **prova gratuita di 4 mesi** (se vuoi la trial).
5. Copia il **link di checkout** del prodotto (es. `https://tuonome.lemonsqueezy.com/buy/xxxxx`).
6. Incolla il link nel file **`js/config.js`**, nel campo `checkoutUrl`.

### Poi collega il link ai pulsanti:

- **Landing page** (`landing.html`): trova il pulsante "Inizia la Prova Gratuita"
  nel blocco Pro e sostituisci `href="index.html"` con il tuo link di checkout.
- **Modale di upgrade** (`index.html`): il pulsante "Passa a Pro" chiama
  `App.goToLanding()`, che apre la landing page → da lì l'utente clicca sul checkout.

---

## Come attivare il "Pro" dopo il pagamento

Con Paddle/Lemon Squeezy puoi usare i **webhook** per sapere quando un cliente ha pagato.
In una versione con backend (Supabase o simile) puoi:
1. Ricevere il webhook "subscription.activated" / "order.created".
2. Segnare l'utente come Pro nel database.

Nella versione attuale (senza backend), il piano Pro si attiva con:
- **Prova gratuita automatica** di 4 mesi (già implementata).
- **Codice invito (referral)** che regala 1 mese (già implementato).
- Inserimento manuale del piano da parte tua (futuro pannello admin).

---

## Riepilogo dei file coinvolti

| File | Scopo |
|---|---|
| `js/config.js` | Inserisci qui il link di checkout |
| `landing.html` | Pagina di vendita con i prezzi |
| `index.html` | Modale di upgrade e pulsanti "Passa a Pro" |
| `js/db.js` | Logica piano (trial, referral, isPro) |
| `js/app.js` | `requirePro()` che blocca le funzioni Pro |

---

## Prossimi passi consigliati

1. Creare l'account su Lemon Squeezy/Paddle e incollare il link.
2. (Opzionale) Aggiungere un backend Supabase per la gestione reale degli abbonamenti
   e dei webhook → qui intervengono gli agenti `mobile-architect` e `fiscalista-commercialista`.
3. Collegare la **fatturazione elettronica SDI** per i clienti italiani con partita IVA.
