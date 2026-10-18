/**
 * Stima - Client Supabase (backend cloud)
 * Collega l'app al backend Supabase per: login, sincronizzazione cloud,
 * invio fatture elettroniche e attivazione Pro automatica.
 *
 * L'app continua a funzionare in modalità locale (localStorage) se le chiavi
 * non sono configurate in APP_CONFIG.supabase. Non serve installare nulla
 * finché non attivi il backend.
 */

import { APP_CONFIG } from './config.js';

let _client = null;
let _initError = null;

export const Supabase = {
  // ───────────────────────────────────────────────────────────────
  // Indica se il backend è configurato (URL + anon key presenti)
  // ───────────────────────────────────────────────────────────────
  isConfigured() {
    return !!(APP_CONFIG.supabase?.url && APP_CONFIG.supabase?.anonKey);
  },

  // ───────────────────────────────────────────────────────────────
  // Crea (una sola volta) il client Supabase.
  // Ritorna null se non configurato o se il pacchetto non è installato.
  // ───────────────────────────────────────────────────────────────
  async getClient() {
    if (!this.isConfigured()) return null;
    if (_client) return _client;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      _client = createClient(APP_CONFIG.supabase.url, APP_CONFIG.supabase.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    } catch (e) {
      _initError = e;
      console.warn('Supabase: pacchetto non installato. Esegui "npm install @supabase/supabase-js".', e);
      return null;
    }
    return _client;
  },

  // ───────────────────────────────────────────────────────────────
  // Autenticazione
  // ───────────────────────────────────────────────────────────────
  async signUp(email, password) {
    const client = await this.getClient();
    if (!client) return { error: new Error('Backend non configurato') };
    return client.auth.signUp({ email, password });
  },

  async signIn(email, password) {
    const client = await this.getClient();
    if (!client) return { error: new Error('Backend non configurato') };
    return client.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    const client = await this.getClient();
    if (!client) return;
    await client.auth.signOut();
  },

  async getUser() {
    const client = await this.getClient();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data?.user || null;
  },

  // ───────────────────────────────────────────────────────────────
  // Invio fattura elettronica allo SDI (tramite Edge Function).
  // La Edge Function custodisce la chiave segreta del provider FE.
  // ───────────────────────────────────────────────────────────────
  async sendInvoice(quoteId, xml) {
    const client = await this.getClient();
    if (!client) return { ok: false, message: 'Backend non configurato' };
    const { data, error } = await client.functions.invoke('send-invoice', {
      body: { quoteId, xml },
    });
    if (error) return { ok: false, message: error.message };
    return data || { ok: false, message: 'Nessuna risposta dal server' };
  },

  // ───────────────────────────────────────────────────────────────
  // Stato del piano (Pro / free) dell'utente corrente
  // ───────────────────────────────────────────────────────────────
  async getSubscription() {
    const client = await this.getClient();
    if (!client) return null;
    const user = (await client.auth.getUser()).data.user;
    if (!user) return null;
    const { data } = await client
      .from('subscriptions')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    return data;
  },
};

// Espone come globale per compatibilità con gli handler inline
window.Supabase = Supabase;
