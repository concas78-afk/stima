// ═══════════════════════════════════════════════════════════════════
// QuickCraft CRM — Edge Function "payment-webhook"
// Riceve gli eventi di pagamento da Paddle o Lemon Squeezy e attiva
// il piano Pro sull'abbonamento dell'utente.
//
// Deployment:  supabase functions deploy payment-webhook
// Secrets:     supabase secrets set PADDLE_WEBHOOK_SECRET=...
//              supabase secrets set LEMON_WEBHOOK_SECRET=...
//
// L'utente finale va passato al provider come "custom_data":
//   Paddle:       { profile_id: "<uuid>" }
//   Lemon Squeezy: { profile_id: "<uuid>" }
// ═══════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Verifica la firma HMAC-SHA256 di un webhook.
async function verifyHmac(secret: string, rawBody: string, signature: string): Promise<boolean> {
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // Confronto in tempo costante (anti timing-attack)
  const a = hex.toLowerCase();
  const b = signature.toLowerCase();
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

interface ParsedEvent {
  provider: 'paddle' | 'lemon';
  eventName: string;
  profileId: string;
}

// Estrae (provider, nome evento, profile_id) dal payload del webhook.
function parseEvent(rawBody: string, paddleSig: string | null, lemonSig: string | null): ParsedEvent | null {
  const body = JSON.parse(rawBody);

  // ── Paddle ─────────────────────────────────────────────────────
  if (paddleSig) {
    const eventName = body?.event_type;
    const profileId = body?.data?.custom_data?.profile_id;
    if (!eventName || !profileId) return null;
    return { provider: 'paddle', eventName, profileId };
  }

  // ── Lemon Squeezy ──────────────────────────────────────────────
  if (lemonSig) {
    const eventName = body?.meta?.event_name;
    const profileId = body?.meta?.custom_data?.profile_id;
    if (!eventName || !profileId) return null;
    return { provider: 'lemon', eventName, profileId };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: corsHeaders() });
  }

  try {
    // Legge il corpo GREZZO (necessario per la verifica HMAC)
    const rawBody = await req.text();
    const paddleSig = req.headers.get('Paddle-Signature');
    const lemonSig = req.headers.get('X-Signature');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // 1. Verifica firma
    let secret = '';
    if (paddleSig) secret = Deno.env.get('PADDLE_WEBHOOK_SECRET') || '';
    if (lemonSig) secret = Deno.env.get('LEMON_WEBHOOK_SECRET') || '';
    const signature = paddleSig || lemonSig || '';
    if (!(await verifyHmac(secret, rawBody, signature))) {
      return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 401, headers: corsHeaders() });
    }

    // 2. Estrai i dati dell'evento
    const event = parseEvent(rawBody, paddleSig, lemonSig);
    if (!event) {
      // Evento senza profile_id (es. "subscription.created" senza custom_data): ignora
      return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200, headers: corsHeaders() });
    }

    // 3. Attiva il piano Pro in base all'evento
    const activating = /(activated|created|updated|renewed)/i.test(event.eventName);
    const canceling = /(cancelled|expired|paused)/i.test(event.eventName);

    if (activating) {
      const proUntil = new Date();
      proUntil.setMonth(proUntil.getMonth() + 1); // +1 mese (mensile)
      await supabase
        .from('subscriptions')
        .update({ tier: 'pro', pro_until: proUntil.toISOString(), trial_ends_at: null })
        .eq('profile_id', event.profileId);
    } else if (canceling) {
      await supabase
        .from('subscriptions')
        .update({ tier: 'free', pro_until: null })
        .eq('profile_id', event.profileId);
    }

    return new Response(JSON.stringify({ ok: true, event: event.eventName, provider: event.provider }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders() });
  }
});
