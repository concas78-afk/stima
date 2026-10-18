// ═══════════════════════════════════════════════════════════════════
// QuickCraft CRM — Edge Function "send-invoice"
// Invia una fattura elettronica (XML FatturaPA) allo SDI tramite un
// provider accreditato, custodendo la chiave API segreta sul server.
//
// Deployment:  supabase functions deploy send-invoice
// Secrets:     supabase secrets set FE_API_KEY=... FE_API_USERID=...
// ═══════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ───────────────────────────────────────────────────────────────────
// CONFIGURAZIONE PROVIDER FATTURAZIONE ELETTRONICA
// ───────────────────────────────────────────────────────────────────
// Imposta i Secrets in Supabase → Edge Functions → Secrets:
//   FE_PROVIDER        = "invoicetronic" | "openapi" | "custom"
//   FE_BASE_URL        = base URL del provider (senza slash finale)
//   FE_SEND_PATH       = path dell'endpoint di invio (es. "/v1/fattura/invio")
//   FE_API_USERID      = user id del provider (HTTP Basic Auth)
//   FE_API_KEY         = chiave API segreta (HTTP Basic Auth password)
//
// NOTA: gli endpoint esatti variano da provider a provider. Controlla
// la documentazione del provider scelto e aggiorna FE_SEND_PATH.
// ───────────────────────────────────────────────────────────────────

interface InvoicePayload {
  quoteId: string;
  xml: string;
}

interface ProviderResponse {
  ok: boolean;
  providerId?: string;
  message: string;
  raw?: unknown;
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Chiama il provider API accreditato per l'invio della fattura.
async function sendToProvider(xml: string): Promise<ProviderResponse> {
  const baseUrl = (Deno.env.get('FE_BASE_URL') || '').replace(/\/$/, '');
  const sendPath = Deno.env.get('FE_SEND_PATH') || '/v1/fattura/invio';
  const userId = Deno.env.get('FE_API_USERID') || '';
  const apiKey = Deno.env.get('FE_API_KEY') || '';

  if (!baseUrl || !apiKey) {
    return { ok: false, message: 'Provider FE non configurato: mancano FE_BASE_URL o FE_API_KEY.' };
  }

  // HTTP Basic Auth (usato da Invoicetronic, Openapi e molti altri)
  const basic = btoa(`${userId}:${apiKey}`);

  try {
    const res = await fetch(`${baseUrl}${sendPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/xml; charset=UTF-8',
      },
      body: xml,
    });

    const text = await res.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch { /* risposta non-JSON (es. XML) */ }

    if (!res.ok) {
      return {
        ok: false,
        message: `Provider ha risposto ${res.status}: ${text.slice(0, 300)}`,
        raw: parsed,
      };
    }

    return { ok: true, providerId: extractProviderId(parsed), message: 'Fattura inviata al provider', raw: parsed };
  } catch (err) {
    return { ok: false, message: `Errore di rete verso il provider: ${(err as Error).message}` };
  }
}

// Estrae l'identificativo della fattura dalla risposta del provider (best effort).
function extractProviderId(parsed: unknown): string | undefined {
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    return (obj.filename ?? obj.id ?? obj.file_id ?? obj.identificativo ?? obj.fattura_id) as string | undefined;
  }
  return undefined;
}

Deno.serve(async (req) => {
  // Gestione preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 1. Autenticazione: verifica il JWT dell'utente
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Non autenticato' }),
        { status: 401, headers: corsHeaders() },
      );
    }

    // 2. Legge il payload
    const payload: InvoicePayload = await req.json();
    if (!payload.quoteId || !payload.xml) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Dati mancanti (quoteId, xml)' }),
        { status: 400, headers: corsHeaders() },
      );
    }

    // 3. Verifica che il preventivo appartenga all'utente (service role = niente RLS)
    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .select('id, profile_id')
      .eq('id', payload.quoteId)
      .single();
    if (qErr || !quote || quote.profile_id !== user.id) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Preventivo non trovato o non autorizzato' }),
        { status: 403, headers: corsHeaders() },
      );
    }

    // 4. Invio al provider accreditato
    const result = await sendToProvider(payload.xml);

    // 5. Aggiorna lo stato del preventivo nel database
    if (result.ok) {
      await supabase
        .from('quotes')
        .update({ status: 'Saldato', invoiced_at: new Date().toISOString() })
        .eq('id', payload.quoteId);
    }

    return new Response(JSON.stringify(result), { status: result.ok ? 200 : 502, headers: corsHeaders() });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, message: (err as Error).message }),
      { status: 500, headers: corsHeaders() },
    );
  }
});
