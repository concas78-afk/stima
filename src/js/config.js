/**
 * Stima - Configurazione Globale
 * ⚠️ MODIFICA QUESTO FILE per collegare il tuo sistema di pagamento.
 */

export const APP_CONFIG = {
  // ═══════════════════════════════════════════════════════════════
  // MODALITÀ GRATUITA (free mode)
  // Quando "freeMode: true" TUTTE le funzioni Pro sono sbloccate
  // gratuitamente (utile per la fase di lancio/fidelizzazione).
  // Quando vorrai monetizzare, imposta "freeMode: false".
  // ═══════════════════════════════════════════════════════════════
  freeMode: true,

  // Link di checkout per l'abbonamento Pro.
  // Dopo aver creato il tuo account Paddle / Lemon Squeezy / Stripe,
  // incolla qui l'URL del prodotto di abbonamento (mensile o annuale).
  // Esempio Lemon Squeezy: "https://quickcraft.lemonsqueezy.com/buy/xxxxx"
  // Esempio Paddle:        "https://buy.paddle.com/product/xxxxx"
  checkoutUrl: '',

  // ═══════════════════════════════════════════════════════════════
  // BACKEND SUPABASE (facoltativo)
  // Lascia vuoto per usare l'app in modalità locale (localStorage).
  // Dopo aver creato il progetto su https://supabase.com, incolla qui
  // il Project URL e la "anon public key" per attivare login e cloud.
  // La service_role key NON va mai messa qui: sta solo nelle Edge Functions.
  // ═══════════════════════════════════════════════════════════════
  supabase: {
    url: 'https://cfhnmhgvwhzllyuszqgt.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaG5taGd2d2h6bGx5dXN6cWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTU3NTgsImV4cCI6MjEwNzY5MTc1OH0.IsgX_viBdcz2y3kIJ1O7rrVFZDOi1v-10IAv2h-h1PQ',
  },
};

/**
 * Funzione globale di escape HTML/XSS.
 * Usala per ogni dato utente inserito in innerHTML o in attributi HTML.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Espone anche come globali (per retro-compatibilità con gli handler inline)
window.escapeHtml = escapeHtml;
window.APP_CONFIG = APP_CONFIG;
