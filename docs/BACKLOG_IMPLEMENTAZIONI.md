# 🗂️ Backlog — Implementazioni future di Stima

Lista delle funzionalità/attività da implementare. Aggiornata a ottobre 2026.

Legenda stato: ⬜ Da fare · 🟡 In corso · ✅ Fatto · ⛔ Bloccato

---

## 🧾 Fatturazione elettronica / SDI

| # | Implementazione | Priorità | Blocco | Stato |
|---|---|---|---|---|
| 1 | **Validazione preventiva XML** (controlla P.IVA, indirizzo, CAP, comune, provincia, codice destinatario/PEC, progressivo duplicato) | Alta | — | ⬜ |
| 2 | **Integrazione provider accreditato** (Aruba, Fatture in Cloud, InfoCert…) per invio automatico | Alta | P.IVA + contratto provider | ⛔ |
| 3 | **Firma digitale delegata** (gestita dal provider) | Alta | Provider | ⛔ |
| 4 | **Ricevute SDI in-app** (consegna / scarto / notifica) | Media | Provider | ⛔ |
| 5 | **Conservazione a norma** (10 anni) | Media | Provider | ⛔ |
| 6 | **Correzione `resolveRecipient`** (gestione corretta `0000000` + PEC, `XXXXXXX` estero) | Media | — | ⬜ |
| 7 | **Progressivo fattura univoco** (evitare duplicati se si eliminano preventivi) | Media | — | ⬜ |
| 8 | **Anteprima fattura PDF leggibile** ("FATTURA" invece di "PREVENTIVO") | Media | — | ⬜ |

---

## 👤 Account, privacy e GDPR

| # | Implementazione | Priorità | Blocco | Stato |
|---|---|---|---|---|
| 9 | **Eliminazione account in-app** (oltre al link web già fatto) | Alta | — | ⬜ |
| 10 | **Export dati utente** (portabilità GDPR) | Media | — | ⬜ |
| 11 | **Completare Privacy Policy** (sostituire i placeholder `[email di contatto]` / `[indirizzo]`) | Alta | Dati reali | ⬜ |
| 12 | **DPA firmabile** (accordo trattamento dati con gli artigiani) | Media | — | ⬜ |

---

## 💳 Monetizzazione

| # | Implementazione | Priorità | Blocco | Stato |
|---|---|---|---|---|
| 13 | **Attivare pagamenti** (Paddle / Lemon Squeezy / Stripe) e `checkoutUrl` | Alta | P.IVA | ⛔ |
| 14 | **Disattivare free mode** + far partire i 4 mesi di prova | Alta | Pagamenti | ⛔ |
| 15 | **Referral auto-accredito** (2 mesi gratis al referrer al pagamento) — estendere `payment-webhook` | Media | Pagamenti | ⛔ |
| 16 | **Gestione abbonamenti** (rinnovo, disdetta, ricevute) | Media | Pagamenti | ⛔ |

---

## 📱 App e piattaforme

| # | Implementazione | Priorità | Blocco | Stato |
|---|---|---|---|---|
| 17 | **App iOS nativa** (App Store) | Media | Mac + Xcode | ⛔ |
| 18 | **Plugin voce nativo** (Web Speech API non funziona nel WebView Android) | Media | — | ⬜ |
| 19 | **Notifiche native agenda** (promemoria appuntamenti) | Media | — | ⬜ |
| 20 | **Deep link / OAuth** per login Supabase nel WebView | Bassa | — | ⬜ |
| 21 | **Aggiornamento PWA/service worker** (gestione cache e update) | Bassa | — | ⬜ |

---

## ✨ Funzionalità prodotto

| # | Implementazione | Priorità | Blocco | Stato |
|---|---|---|---|---|
| 22 | **Backup cloud automatico** | Media | — | ⬜ |
| 23 | **Esportazione contabilità per commercialista** (CSV/Excel) | Media | — | ⬜ |
| 24 | **Multi-utente / team** | Bassa | — | ⬜ |
| 25 | **Firma digitale cliente** (verificare se già completa) | Bassa | — | ⬜ |
| 26 | **Template preventivi personalizzabili** | Bassa | — | ⬜ |

---

## 🌐 Brand e marketing

| # | Implementazione | Priorità | Blocco | Stato |
|---|---|---|---|---|
| 27 | **Dominio custom `stima.it`** | Media | Acquisto dominio | ⬜ |
| 28 | **Sito web/landing aggiornata** | Media | — | ⬜ |
| 29 | **ASO Play Store / App Store** (keyword, screenshot, recensioni) | Media | — | ⬜ |
| 30 | **Email transazionali** (benvenuto, ricevute, reminder) | Bassa | — | ⬜ |

---

## ✅ Già fatto (per riferimento)

- Scheda Google Play + prompt per Claude in Chrome
- Icone app + splash (Android)
- AAB firmato per Google Play
- Pagina web eliminazione account
- Feature graphic Play Store
- Sync cloud Supabase + login/registrazione
- GDPR consent (privacy, DPA, ToS)
- Referral (codice STIMA-, 2 mesi)
- Import CSV/vCard/testo
- FatturaPA XML (bozza)
- Campagne email
- Agenda con voci e sopralluoghi
