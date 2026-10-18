# Progetto: QuickCraft CRM (Micro-CRM & Preventivi Veloci)

Questo progetto è un **Micro-CRM e generatore di preventivi veloci** progettato per liberi professionisti, artigiani e freelance.
È una Web App mobile-first con architettura Single Page Application (SPA), predisposta per funzionare come:
1. **Web App su Desktop e Mobile** (tramite browser)
2. **Progressive Web App (PWA)** (installabile direttamente da browser su iOS e Android senza passare per gli store)
3. **App Nativa iOS e Android** (impacchettabile tramite Capacitor / Apache Cordova)

## Struttura del Progetto (Vite + Capacitor)
Il progetto usa **Vite** come bundler (build in `dist/`) e **Capacitor** per impacchettare in app native.

- `index.html`: Punto di ingresso (Vite entry), layout interfaccia responsive.
- `landing.html`: Pagina di vendita (secondo entry del build).
- `vite.config.js`: Configurazione Vite (`base: './'` per Capacitor, multi-entry).
- `package.json`: Dipendenze e script (`npm run dev`, `npm run build`).
- `src/main.js`: Entry point JS — importa tutti i moduli in ordine e li espone come globali.
- `src/js/*.js`: I 12 moduli dell'app (ora ES modules con `export`).
- `src/styles/app.css`: Stili personalizzati (animazioni, stampa A4, safe-area).
- `public/`: File statici copiati in `dist/` (`manifest.json`, `sw.js`, icone).
- `dist/`: Output della build (generato, da non modificare).
- `capacitor.config.json`: Configurazione Capacitor (`webDir: "dist"`).
- `docs/SUPABASE.md`: Guida tecnica per il backend Supabase.
- `docs/legale/`: Pacchetto legale GDPR.
- `INTEGRAZIONE_PAGAMENTI.md`: Guida per collegare i pagamenti.

### Moduli (in `src/js/`)
- `config.js`: Configurazione globale (free mode, checkout) + `escapeHtml`.
- `db.js`: Database locale (`localStorage`) con CRUD, piano Freemium/Pro e dati demo.
- `clients.js`: Gestione clienti (rubrica, viste, scheda cliente, WhatsApp).
- `import.js`: Importazione in massa (CSV, vCard, testo incollato).
- `fatturapa.js`: Generatore XML FatturaPA (fatturazione elettronica SDI).
- `pricebook.js`: Listino voci & materiali.
- `agenda.js`: Agenda appuntamenti & sopralluoghi.
- `quotes.js`: Gestione preventivi (IVA, acconto, foto, firma, WhatsApp/Email).
- `pdf.js`: Anteprima stampa A4 / PDF.
- `campaigns.js`: Campagne email di massa.
- `settings.js`: Impostazioni profilo aziendale.
- `app.js`: Controller principale, router, tema dark/light.

## Comandi
- `npm run dev` → server di sviluppo (localhost:5173)
- `npm run build` → genera `dist/`
- `npx cap add android` / `npx cap add ios` → progetti nativi
- `npx cap sync` → sincronizza `dist/` nelle app native

## Agenti Specializzati (.opencode/agents/)
- `orchestrator`: **Agente Primario & Coordinatore Generale (CEO/CTO Virtuale)**. Riceve gli obiettivi generali e interroga in autonomia i vari specialisti, sintetizzando un piano d'azione organico. *(modello: deepseek/deepseek-v4-pro)*
- `ui-designer`: Esperto di interfacce, Tailwind CSS, animazioni e responsive mobile/desktop. *(modello: deepseek/deepseek-flash)*
- `growth-marketer`: Esperto di monetizzazione micro-SaaS, pricing, copywriting e lancio commerciale. *(modello: opencode/cat-jam-free — gratuito)*
- `growth-hacker`: Esperto di Growth Hacking, referral/viral loop, onboarding e retention per far scalare l'app. *(modello: opencode/cat-jam-free — gratuito)*
- `mobile-architect`: Esperto di PWA, Capacitor e packaging dell'app per Google Play e Apple App Store. *(modello: deepseek/deepseek-flash)*
- `qa-security`: Esperto di revisione codice, controllo calcoli fiscali/IVA e integrità dati. *(modello: deepseek/deepseek-flash)*
- `fiscalista-commercialista`: Esperto tributario e societario italiano per SRL / Startup Innovativa, fatturazione SDI e gestione IVA/imposte. *(modello: deepseek/deepseek-flash)*
- `gdpr-dpo-officer`: Esperto in conformità privacy (Reg. UE 2016/679), DPA tra SaaS e artigiani, registro dei trattamenti e data breach. *(modello: deepseek/deepseek-flash)*
- `avvocato-saas-legal`: Esperto in contrattualistica digitale, Termini di Servizio (ToS), clausole di manleva/limitazione di responsabilità e EULA per App Store/Google Play. *(modello: deepseek/deepseek-flash)*
- `customer-success-ops`: Esperto di onboarding clienti, riduzione del churn e supporto pratico per artigiani e professionisti italiani. *(modello: opencode/cat-jam-free — gratuito)*
- `backend-engineer`: Esperto Backend Supabase, Edge Functions e integrazioni API (fatturazione SDI, email con allegato, webhook pagamenti). *(modello: deepseek/deepseek-flash)*

## Convenzioni di Codice per OpenCode
- Il progetto ora usa **Vite** come bundler: per testare avvia `npm run dev`, per compilare `npm run build` (output in `dist/`).
- I moduli in `src/js/` sono **ES modules**: ogni file usa `export const` e importa esplicitamente le sue dipendenze.
- `src/main.js` importa tutti i moduli in ordine e li espone come globali (`window.X`) per compatibilità con gli handler `onclick` inline.
- Usa codice modulare, pulito e commentato in italiano.
- Tutti i dati sensibili degli utenti restano memorizzati localmente sul dispositivo dell'utente (`localStorage`).
- **Importante:** quando inserisci dati utente nell'HTML (innerHTML/attributi), usa SEMPRE `escapeHtml()` per prevenire XSS.
- Quando si aggiungono nuove funzionalità o filtri, assicurarsi che l'interfaccia resti utilizzabile con una mano su schermi smartphone.
