# 🗄️ Guida Tecnica Backend — Supabase

Questa guida trasforma QuickCraft CRM da app **locale (localStorage)** a **vero SaaS multi-utente**,
aggiungendo database, autenticazione e funzioni server (per la fatturazione elettronica e i pagamenti).

> Supabase = PostgreSQL + Auth + Edge Functions + Storage, con piano gratuito per iniziare.

## ✅ Codice già pronto nel progetto

Il backend è **già implementato** in questi file — non devi riscriverlo:

| File | Cosa fa |
|---|---|
| `supabase/schema.sql` | Schema database + RLS + trigger creazione profilo |
| `supabase/functions/send-invoice/index.ts` | Invio fattura elettronica allo SDI (Edge Function) |
| `supabase/functions/payment-webhook/index.ts` | Attivazione Pro via Paddle / Lemon Squeezy |
| `src/js/supabase.js` | Client frontend (login, cloud, invio fatture) |
| `src/js/config.js` → `APP_CONFIG.supabase` | Dove incollare URL e anon key |

Ti basta **creare il progetto Supabase** e **incollare le chiavi** (vedi sezione 3).
Fino ad allora, l'app continua a funzionare in locale (localStorage) senza alcun cambiamento.

---

## 1. Perché serve il backend

| Esigenza | Senza backend (oggi) | Con Supabase (domani) |
|---|---|---|
| Dati su più dispositivi | ❌ solo sul browser | ✅ sincronizzati |
| Invio fatture allo SDI | ❌ impossibile (chiave API segreta) | ✅ via Edge Functions |
| Login utenti | ❌ assente | ✅ Auth |
| Referral tra dispositivi | ❌ locale | ✅ reale |
| Webhook pagamenti | ❌ | ✅ attivazione Pro automatica |

---

## 2. Architettura

```
┌─────────────────────────────┐
│   Frontend (index.html)      │  ← supabase-js (anon key, pubblica)
│   React/Vanilla + Tailwind   │
└──────────────┬──────────────┘
               │ HTTPS
┌──────────────▼──────────────┐
│        SUPABASE              │
│  • PostgreSQL (dati)         │
│  • Auth (login)              │
│  • Edge Functions (server)   │
│  • Storage (foto/logo)       │
└──────┬───────────────┬───────┘
       │               │
  (service_role key)   │  (webhook)
       │               │
┌──────▼──────┐  ┌─────▼──────────────┐
│ Provider FE │  │ Paddle / Lemon     │
│ (Openapi…)  │  │ Squeezy (pagamenti)│
└─────────────┘  └────────────────────┘
```

**Regola d'oro:**
- La **anon key** può stare nel frontend (è pubblica, protetta dalle RLS).
- La **service_role key** sta SOLO dentro le Edge Functions (mai nel browser).

---

## 3. Setup iniziale (fatto il 90%)

1. Vai su <https://supabase.com> → crea un progetto (regione UE consigliata: `eu-west` / `eu-central`).
2. Apri **SQL Editor** → incolla ed esegui il contenuto di `supabase/schema.sql`.
3. Copia **Project URL** (es. `https://xyz.supabase.co`) e **anon public key**
   e incollali in `src/js/config.js` nel campo `APP_CONFIG.supabase`:
   ```js
   supabase: {
     url: 'https://xyz.supabase.co',
     anonKey: 'eyJhbGciOi...',   // anon public key
   },
   ```
4. Il client `@supabase/supabase-js` è **già installato** (`npm install` già eseguito).
5. La **service_role key** NON va nel frontend: la trovi in Settings → API,
   e serve solo per il deploy delle Edge Functions (sezione 7).

---

## 4. Schema del database (SQL)

Esegui questo SQL nell'SQL Editor di Supabase:

```sql
-- Estensione per gli UUID
create extension if not exists "pgcrypto";

-- Profili degli utenti (artigiani)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  business_name text,
  owner_name text,
  vat_number text,
  tax_id text,
  address text,
  cap text,
  city text,
  province text,
  nation text default 'IT',
  pec text,
  iban text,
  tax_regime text default 'ordinario',     -- 'ordinario' | 'forfettario'
  withholding_tax numeric default 0,
  payment_link text,
  payment_link_label text,
  logo text,                               -- base64 o URL Storage
  default_notes text,
  created_at timestamptz default now()
);

-- Clienti
create table clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  company text,
  phone text,
  email text,
  address text,
  cap text,
  city text,
  province text,
  nation text default 'IT',
  tax_id text,
  customer_type text default 'privato',   -- 'privato' | 'azienda' | 'pa'
  recipient_code text,                     -- codice destinatario 7 char
  pec text,
  notes text,
  created_at timestamptz default now()
);

-- Preventivi / Fatture
create table quotes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  number text,
  date date,
  due_date date,
  status text default 'Bozza',            -- Bozza/Inviato/Approvato/Saldato/Rifiutato
  items jsonb default '[]',               -- righe con descrizione, qty, prezzo, vat, sconto
  discount numeric default 0,
  deposit_percent numeric default 0,
  deposit_amount numeric default 0,
  signature_data text,                    -- base64 firma
  photos jsonb default '[]',
  notes text,
  invoice_number text,                    -- es. "1/2026"
  invoiced_at timestamptz,
  created_at timestamptz default now()
);

-- Listino voci
create table pricebook (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  category text,
  description text not null,
  price numeric default 0,
  vat numeric default 22
);

-- Agenda appuntamenti
create table appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  title text,
  date date,
  time time,
  location text,
  status text default 'Programmato',
  notes text
);

-- Piano / abbonamento
create table subscriptions (
  profile_id uuid primary key references profiles(id) on delete cascade,
  tier text default 'free',               -- 'free' | 'pro'
  trial_ends_at timestamptz,
  pro_until timestamptz,
  referral_code text,
  referral_used boolean default false,
  checkout_customer_id text,              -- id cliente Paddle/Lemon
  updated_at timestamptz default now()
);
```

---

## 5. Row Level Security (RLS)

Abilita la RLS e crea policy per ogni tabella, così ogni utente vede **solo i propri dati**:

```sql
alter table profiles enable row level security;
alter table clients enable row level security;
alter table quotes enable row level security;
alter table pricebook enable row level security;
alter table appointments enable row level security;
alter table subscriptions enable row level security;

-- profiles: l'utente vede/modifica solo il proprio profilo
create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- clients
create policy "own clients" on clients
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- quotes
create policy "own quotes" on quotes
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- pricebook
create policy "own pricebook" on pricebook
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- appointments
create policy "own appointments" on appointments
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- subscriptions
create policy "own subscription" on subscriptions
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
```

> Queste policy rendono l'app **multi-tenant sicura**: nessun utente può leggere i dati degli altri.

---

## 6. Autenticazione

1. In Supabase → **Authentication → Providers** → abilita **Email**.
2. Nel frontend sostituisci la logica di login:
   ```js
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(
     'https://xyz.supabase.co',
     'YOUR_ANON_KEY'
   );

   // Registrazione
   await supabase.auth.signUp({ email, password });

   // Login
   await supabase.auth.signInWithPassword({ email, password });

   // Utente corrente
   const { data: { user } } = await supabase.auth.getUser();
   ```

3. Creazione automatica del profilo al primo accesso (via **trigger**):
   ```sql
   create or replace function public.handle_new_user()
   returns trigger as $$
   begin
     insert into public.profiles (id, email) values (new.id, new.email);
     insert into public.subscriptions (profile_id, referral_code)
       values (new.id, 'QUICK-' || upper(substr(md5(random()::text), 1, 6)));
     return new;
   end;
   $$ language plpgsql security definer;

   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute procedure public.handle_new_user();
   ```

---

## 7. Edge Functions (il "server")

Le Edge Functions sono funzioni TypeScript/Deno che girano sui server Supabase e possono usare la `service_role` key.

### 7.1 Invio fattura elettronica (collegamento provider accreditato)

```ts
// supabase/functions/send-invoice/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { invoice } = await req.json();

  // 1. Chiamata al provider API accreditato (es. Openapi / Invoicetronic)
  const providerRes = await fetch('https://api.provider.it/v1/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('FE_API_KEY')}`, // chiave segreta!
      'Content-Type': 'application/xml',
    },
    body: invoice.xml,
  });

  const result = await providerRes.json();

  // 2. Aggiorna lo stato nel database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  await supabase
    .from('quotes')
    .update({ status: 'Saldato', invoiced_at: new Date().toISOString() })
    .eq('id', invoice.id);

  return new Response(JSON.stringify(result), { status: 200 });
});
```

> La `FE_API_KEY` (chiave del provider) è salvata in Supabase → **Edge Functions → Secrets**, mai nel frontend.

### 7.2 Webhook pagamenti (Paddle / Lemon Squeezy)

Quando un artigiano paga, il provider chiama questa funzione per attivare il piano Pro:

```ts
// supabase/functions/payment-webhook/index.ts
Deno.serve(async (req) => {
  const payload = await req.json(); // evento "subscription.activated"

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verifica firma del webhook (Paddle/Lemon forniscono una signature)
  // ... verifica firma ...

  const email = payload.email;
  const proUntil = new Date();
  proUntil.setMonth(proUntil.getMonth() + 1); // +1 mese

  await supabase
    .from('subscriptions')
    .update({ tier: 'pro', pro_until: proUntil.toISOString(), trial_ends_at: null })
    .eq('profile_id', payload.profile_id);

  return new Response('ok', { status: 200 });
});
```

---

## 8. Migrazione da localStorage a Supabase

1. Nell'app attuale, vai su **Impostazioni → Esporta Backup (JSON)**.
2. Crea un piccolo script di import (o una Edge Function) che:
   - legge il JSON esportato
   - inserisce clienti, preventivi, listino e agenda nel database, collegandoli all'`profile_id` dell'utente
3. Rimuovi la dipendenza da `localStorage` e usa `supabase.from(...)` per tutte le operazioni CRUD.

---

## 9. Modifiche al frontend

Il file `js/db.js` andrà riscritto per usare Supabase al posto di `localStorage`:

```js
// db.js (nuova versione)
const DB = {
  async getClients() {
    const { data } = await supabase.from('clients').select('*').order('created_at');
    return data;
  },
  async saveClient(client) {
    if (client.id) {
      await supabase.from('clients').update(client).eq('id', client.id);
    } else {
      await supabase.from('clients').insert(client);
    }
  },
  // ... e così via per quotes, pricebook, appointments, subscriptions
};
```

> I moduli `clients.js`, `quotes.js`, `pricebook.js`, `agenda.js` continueranno a funzionare
> perché chiamano `DB.getClients()`, `DB.saveClient()` ecc.: basterà rendere `DB` asincrono.

---

## 10. Checklist di sicurezza

- [ ] RLS abilitata su **tutte** le tabelle
- [ ] `service_role` key **mai** nel frontend (solo Edge Functions)
- [ ] Chiavi del provider FE salvate come **Secrets** delle Edge Functions
- [ ] Webhook con **verifica firma**
- [ ] Regione dati **UE** (per il GDPR)
- [ ] Backup abilitati (PITR)
- [ ] Email di conferma/recupero password configurate

---

## 11. Roadmap di implementazione (in ordine)

1. Creare il progetto Supabase + schema SQL + RLS.
2. Aggiungere `supabase-js` e l'autenticazione.
3. Migrare `db.js` da localStorage a Supabase (tabella per tabella).
4. Scegliere il provider FE e scrivere l'Edge Function `send-invoice`.
5. Collegare i webhook pagamenti (Paddle/Lemon) → attivazione Pro.
6. Testare end-to-end con un account reale.

---

### Riferimenti utili
- Supabase Docs: <https://supabase.com/docs>
- Edge Functions: <https://supabase.com/docs/guides/functions>
- RLS: <https://supabase.com/docs/guides/auth/row-level-security>
