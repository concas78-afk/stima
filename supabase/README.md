# 🗄️ Backend QuickCraft CRM — Supabase

Questa cartella contiene tutto il codice server di QuickCraft CRM:
database, sicurezza (RLS) e Edge Functions (fatturazione elettronica + pagamenti).

## Struttura

```
supabase/
├── schema.sql                        # Schema PostgreSQL + RLS + trigger
├── sync_table.sql                    # Tabella user_data (sync cloud)
└── functions/
    ├── send-invoice/index.ts         # Invio fattura elettronica allo SDI
    └── payment-webhook/index.ts      # Attivazione Pro (Paddle / Lemon Squeezy)
```

Frontend collegato:
- `src/js/supabase.js` — client + autenticazione
- `src/js/auth.js` — login / registrazione
- `src/js/sync.js` — sincronizzazione dati (localStorage ↔ cloud)

## Setup rapido (5 minuti)

1. Crea un progetto su <https://supabase.com> (regione **UE** consigliata).
2. Apri **SQL Editor** → incolla ed esegui il contenuto di `schema.sql`.
3. Copia **Project URL** e **anon public key** e incollali in `src/js/config.js`
   (campo `APP_CONFIG.supabase`).
4. Installa il client nel frontend:
   ```bash
   npm install @supabase/supabase-js
   ```
5. (Opzionale) Deploy delle Edge Functions:
   ```bash
   supabase functions deploy send-invoice
   supabase functions deploy payment-webhook
   supabase secrets set FE_BASE_URL=... FE_API_KEY=... FE_API_USERID=...
   ```

## Chiavi e sicurezza

| Chiave | Dove sta | Note |
|---|---|---|
| `anon public key` | frontend (`config.js`) | pubblica, protetta dalle RLS |
| `service_role key` | SOLO Edge Functions (Secret) | mai nel browser |
| `FE_API_KEY` (provider) | Secret Edge Function | mai nel browser |

Per i dettagli completi: `docs/SUPABASE.md`.
