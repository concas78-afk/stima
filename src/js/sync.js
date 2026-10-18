/**
 * Stima - Modulo Sincronizzazione Cloud
 * Sincronizza i dati locali (localStorage) con Supabase, per usarli su più
 * dispositivi. Usa un singolo blob JSON per utente (semplice e robusto).
 */

import { Supabase } from './supabase.js';
import { DB } from './db.js';
import { escapeHtml } from './config.js';

let _pushTimer = null;

export const Sync = {
  // True se c'è un utente autenticato
  async isLoggedIn() {
    return !!(await Supabase.getUser());
  },

  // ───────────────────────────────────────────────────────────────
  // PUSH: salva i dati locali nel cloud (sovrascrive)
  // ───────────────────────────────────────────────────────────────
  async pushAll() {
    const client = await Supabase.getClient();
    if (!client) return { ok: false, message: 'Backend non configurato' };
    const user = await Supabase.getUser();
    if (!user) return { ok: false, message: 'Non autenticato' };

    const backup = DB.exportBackup();
    const { error } = await client
      .from('user_data')
      .upsert({
        profile_id: user.id,
        data: JSON.parse(backup),
        updated_at: new Date().toISOString(),
      });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  // ───────────────────────────────────────────────────────────────
  // PULL: scarica i dati dal cloud e li importa in locale
  // ───────────────────────────────────────────────────────────────
  async pullAll() {
    const client = await Supabase.getClient();
    if (!client) return { ok: false, message: 'Backend non configurato' };
    const user = await Supabase.getUser();
    if (!user) return { ok: false, message: 'Non autenticato' };

    const { data, error } = await client
      .from('user_data')
      .select('data')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (error) return { ok: false, message: error.message };
    if (!data || !data.data) return { ok: false, message: 'Nessun dato nel cloud' };

    return DB.importBackup(JSON.stringify(data.data));
  },

  // ───────────────────────────────────────────────────────────────
  // Sincronizzazione all'accesso: scarica dal cloud; se il cloud è
  // vuoto (nuovo account), carica i dati locali.
  // Ritorna { changed } per sapere se i dati locali sono cambiati.
  // ───────────────────────────────────────────────────────────────
  async syncOnLogin() {
    const pulled = await this.pullAll();
    if (pulled.ok) return { changed: true, source: 'cloud' };
    const pushed = await this.pushAll();
    return { changed: false, source: pushed.ok ? 'local' : 'none' };
  },

  // ───────────────────────────────────────────────────────────────
  // Push ritardato (debounce): chiamato dopo ogni modifica locale
  // ───────────────────────────────────────────────────────────────
  schedulePush(delay = 1500) {
    if (_pushTimer) clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => { this.pushAll(); }, delay);
  },

  // ───────────────────────────────────────────────────────────────
  // Sincronizzazione manuale (dal pulsante nelle Impostazioni)
  // ───────────────────────────────────────────────────────────────
  async manualSync() {
    const user = await Supabase.getUser();
    if (!user) {
      if (window.App) window.App.showToast('Accedi prima per sincronizzare sul cloud.', 'error');
      return;
    }
    const res = await this.pushAll();
    if (window.App) {
      window.App.showToast(
        res.ok ? 'Dati sincronizzati nel cloud ✓' : 'Errore: ' + res.message,
        res.ok ? 'success' : 'error'
      );
    }
    this.renderStatus();
  },

  // ───────────────────────────────────────────────────────────────
  // Aggiorna l'indicatore di stato cloud nella pagina Impostazioni
  // ───────────────────────────────────────────────────────────────
  async renderStatus() {
    const el = document.getElementById('sync-status');
    if (!el) return;
    const user = await Supabase.getUser();
    if (user) {
      el.innerHTML = `Account connesso: <b>${escapeHtml(user.email)}</b>. Le modifiche si salvano automaticamente nel cloud.`;
    } else {
      el.innerHTML = `Non hai ancora effettuato l'accesso. <a href="#" onclick="Auth.openModal();return false;" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Accedi</a> per attivare il cloud.`;
    }
  },
};

window.Sync = Sync;
