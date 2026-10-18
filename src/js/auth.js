/**
 * Stima - Modulo Autenticazione (login / registrazione)
 * Collega l'app a Supabase Auth per creare account e gestire le sessioni.
 */

import { Supabase } from './supabase.js';
import { Sync } from './sync.js';
import { App } from './app.js';
import { escapeHtml } from './config.js';

export const Auth = {
  _mode: 'login',   // 'login' | 'signup'
  _user: null,

  // Inizializza: ripristina l'eventuale sessione salvata e aggiorna la UI
  async init() {
    if (Supabase.isConfigured()) {
      try {
        this._user = await Supabase.getUser();
      } catch (e) {
        this._user = null;
      }
      if (this._user) {
        await this._syncAfterLogin();
      }
    }
    this.renderAccountUI();
  },

  // Dopo l'accesso: sincronizza i dati dal cloud e aggiorna la dashboard
  async _syncAfterLogin() {
    const res = await Sync.syncOnLogin();
    if (res && res.changed) {
      App.renderDashboard();
    }
  },

  // ───────────────────────────────────────────────────────────────
  // UI stato account (sidebar desktop + header mobile)
  // ───────────────────────────────────────────────────────────────
  renderAccountUI() {
    const email = this._user?.email || '';
    const loggedIn = !!this._user;

    const loggedOutHtml = `
      <button onclick="Auth.openModal()" class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
        <i data-lucide="log-in" class="w-4 h-4"></i>
        <span>Accedi / Registrati</span>
      </button>`;

    const loggedInHtml = `
      <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/40">
        <span class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">${escapeHtml((email[0] || '?').toUpperCase())}</span>
        <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate flex-1" title="${escapeHtml(email)}">${escapeHtml(email)}</span>
        <button onclick="Auth.signOut()" title="Esci" class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>`;

    const desktop = document.getElementById('account-desktop');
    if (desktop) desktop.innerHTML = loggedIn ? loggedInHtml : loggedOutHtml;

    const mobile = document.getElementById('account-mobile');
    if (mobile) {
      mobile.innerHTML = loggedIn
        ? `<button onclick="Auth.signOut()" title="Esci (${escapeHtml(email)})" class="p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><i data-lucide="log-out" class="w-5 h-5"></i></button>`
        : `<button onclick="Auth.openModal()" title="Accedi / Registrati" class="p-2 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><i data-lucide="user-round" class="w-5 h-5"></i></button>`;
    }

    if (window.lucide) lucide.createIcons();
  },

  // ───────────────────────────────────────────────────────────────
  // Apertura / chiusura modale
  // ───────────────────────────────────────────────────────────────
  openModal() {
    if (!Supabase.isConfigured()) {
      App.showToast('Backend non configurato: inserisci le chiavi Supabase in config.js.', 'error');
      return;
    }
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.showMode('login');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // ───────────────────────────────────────────────────────────────
  // Cambio modalità login / registrazione
  // ───────────────────────────────────────────────────────────────
  showMode(mode) {
    this._mode = mode;
    const isLogin = mode === 'login';
    const title = document.getElementById('auth-modal-title');
    const btn = document.getElementById('auth-submit-btn');
    const footer = document.getElementById('auth-footer');
    if (title) title.textContent = isLogin ? 'Accedi' : 'Crea il tuo account';
    if (btn) btn.textContent = isLogin ? 'Accedi' : 'Registrati';
    if (footer) {
      footer.innerHTML = isLogin
        ? `Non hai un account? <a href="#" onclick="Auth.showMode('signup');return false;" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Registrati gratis</a>`
        : `Hai già un account? <a href="#" onclick="Auth.showMode('login');return false;" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Accedi</a>`;
    }
    this.hideMessage();
  },

  // ───────────────────────────────────────────────────────────────
  // Messaggi (errore / info) dentro il modale
  // ───────────────────────────────────────────────────────────────
  showMessage(text, type = 'error') {
    const el = document.getElementById('auth-message');
    if (!el) return;
    const colors = {
      error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60',
      info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60',
      success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60',
    };
    el.className = `text-xs font-medium px-3 py-2.5 rounded-xl ${colors[type] || colors.error}`;
    el.textContent = text;
    el.classList.remove('hidden');
  },

  hideMessage() {
    const el = document.getElementById('auth-message');
    if (el) el.classList.add('hidden');
  },

  // ───────────────────────────────────────────────────────────────
  // Invio form (login o registrazione)
  // ───────────────────────────────────────────────────────────────
  async submit(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return;

    this.setLoading(true);
    this.hideMessage();

    try {
      if (this._mode === 'signup') {
        const { data, error } = await Supabase.signUp(email, password);
        if (error) {
          this.showMessage(this.translateError(error.message));
          return;
        }
        if (data?.session) {
          // Conferma email disabilitata: sessione attiva subito
          this._user = data.user;
          this.renderAccountUI();
          this.closeModal();
          App.showToast('Account creato! Benvenuto 🎉', 'success');
          this._syncAfterLogin();
        } else {
          // Conferma email richiesta
          this.showMessage("Controlla la tua email: ti abbiamo inviato un link per confermare l'account.", 'info');
        }
      } else {
        const { data, error } = await Supabase.signIn(email, password);
        if (error) {
          this.showMessage(this.translateError(error.message));
          return;
        }
        this._user = data.user;
        this.renderAccountUI();
        this.closeModal();
        App.showToast('Bentornato!', 'success');
        this._syncAfterLogin();
      }
    } catch (e) {
      this.showMessage('Errore imprevisto. Riprova tra poco.');
    } finally {
      this.setLoading(false);
    }
  },

  // ───────────────────────────────────────────────────────────────
  // Logout
  // ───────────────────────────────────────────────────────────────
  async signOut() {
    await Supabase.signOut();
    this._user = null;
    this.renderAccountUI();
    App.showToast('Sei uscito dal tuo account.', 'info');
  },

  // ───────────────────────────────────────────────────────────────
  // Password dimenticata
  // ───────────────────────────────────────────────────────────────
  async forgotPassword() {
    const email = document.getElementById('auth-email').value.trim();
    if (!email) {
      App.showToast('Inserisci la tua email prima.', 'error');
      return;
    }
    const client = await Supabase.getClient();
    if (!client) return;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) {
      this.showMessage(this.translateError(error.message));
    } else {
      this.showMessage('Ti abbiamo inviato un link per reimpostare la password.', 'info');
    }
  },

  // ───────────────────────────────────────────────────────────────
  // Utilità
  // ───────────────────────────────────────────────────────────────
  setLoading(on) {
    const btn = document.getElementById('auth-submit-btn');
    if (btn) {
      btn.disabled = on;
      btn.classList.toggle('opacity-60', on);
    }
  },

  // Traduce i messaggi di errore comuni di Supabase Auth in italiano
  translateError(message) {
    const map = {
      'Invalid login credentials': 'Email o password non corretti.',
      'Email not confirmed': 'Email non ancora confermata. Controlla la tua casella di posta.',
      'User already registered': 'Esiste già un account con questa email. Prova ad accedere.',
      'Password should be at least 6 characters': 'La password deve avere almeno 6 caratteri.',
      'Unable to validate email address: invalid format': 'Formato email non valido.',
      'For security purposes, you can only request this after': 'Troppi tentativi. Riprova tra poco.',
    };
    return map[message] || message;
  },
};
