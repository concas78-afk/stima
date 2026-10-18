/**
 * Stima - Controller Principale e Router SPA
 */

import { DB } from './db.js';
import { QuotesModule } from './quotes.js';
import { ClientsModule } from './clients.js';
import { CampaignsModule } from './campaigns.js';
import { SettingsModule } from './settings.js';
import { PricebookModule } from './pricebook.js';
import { AgendaModule } from './agenda.js';
import { APP_CONFIG } from './config.js';
import { Auth } from './auth.js';
import { InvoicesModule } from './invoices.js';

export const App = {
  currentTab: 'dashboard',

  init() {
    this.initTheme();
    this.setupNavigation();
    this.switchTab('dashboard');
    Auth.init();

    // Registra Service Worker se supportato (per PWA offline)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Gate di consenso privacy (Privacy Policy + DPA) al primo accesso
    if (!localStorage.getItem('quickcraft_consent')) {
      this.showConsentModal();
    }

    // Mostra un avviso di benvenuto sulla prova gratuita (solo al primo avvio)
    if (!localStorage.getItem('quickcraft_welcome_shown')) {
      localStorage.setItem('quickcraft_welcome_shown', 'true');
      const days = DB.trialDaysLeft();
      if (days > 0) {
        setTimeout(() => {
          this.showToast(`🎁 Benvenuto! Hai ${Math.ceil(days / 30)} mesi di prova Pro gratuita.`, 'success');
        }, 800);
      }
    }
  },

  // ============ CONSENSO PRIVACY ============

  showConsentModal() {
    const modal = document.getElementById('consent-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const privacy = document.getElementById('consent-privacy');
    const dpa = document.getElementById('consent-dpa');
    const terms = document.getElementById('consent-terms');
    const btn = document.getElementById('consent-accept-btn');
    if (!privacy || !dpa || !terms || !btn) return;

    const updateBtn = () => {
      const ok = privacy.checked && dpa.checked && terms.checked;
      btn.disabled = !ok;
      btn.classList.toggle('opacity-50', !ok);
      btn.classList.toggle('cursor-not-allowed', !ok);
    };
    privacy.onchange = updateBtn;
    dpa.onchange = updateBtn;
    terms.onchange = updateBtn;
    updateBtn();

    if (window.lucide) lucide.createIcons();
  },

  acceptConsent() {
    localStorage.setItem('quickcraft_consent', 'true');
    const modal = document.getElementById('consent-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.showToast('Consensi registrati. Buon lavoro!', 'success');
  },

  // Indica se l'utente ha accettato i consensi (privacy + DPA)
  hasConsented() {
    return localStorage.getItem('quickcraft_consent') === 'true';
  },

  // ============ GESTIONE PIANO & UPGRADE ============

  // Verifica se l'utente è Pro; se non lo è mostra il modale di upgrade
  requirePro(featureName) {
    if (DB.isPro()) return true;
    this.openUpgradeModal(featureName);
    return false;
  },

  openUpgradeModal(featureName) {
    const modal = document.getElementById('upgrade-modal');
    if (!modal) return;
    document.getElementById('upgrade-feature-name').textContent = featureName || 'questa funzione';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeUpgradeModal() {
    const modal = document.getElementById('upgrade-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // Reindirizza alla landing page di vendita (o al checkout se configurato)
  goToLanding() {
    if (APP_CONFIG.checkoutUrl) {
      window.open(APP_CONFIG.checkoutUrl, '_blank');
    } else {
      window.open('landing.html', '_blank');
    }
  },

  initTheme() {
    const isDark = localStorage.getItem('quickcraft_dark') === 'true' || 
      (!('quickcraft_dark' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('quickcraft_dark', isDark);
    if (window.lucide) lucide.createIcons();
  },

  setupNavigation() {
    // Gestione click su nav-link desktop e mobile
    document.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = el.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Nascondi tutte le sezioni di vista
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));

    // Rimuovi classe attiva da tutti i link di navigazione
    document.querySelectorAll('[data-tab]').forEach(el => {
      const isTarget = el.getAttribute('data-tab') === tabId;
      if (isTarget) {
        el.classList.add('text-blue-600', 'dark:text-blue-400', 'font-bold');
        el.classList.remove('text-gray-500', 'dark:text-gray-400', 'font-medium');
      } else {
        el.classList.remove('text-blue-600', 'dark:text-blue-400', 'font-bold');
        el.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
      }
    });

    // Mostra vista attiva ed esegui render corrispondente
    const activeView = document.getElementById(`${tabId}-view`);
    if (activeView) {
      activeView.classList.remove('hidden');
      if (tabId === 'dashboard') this.renderDashboard();
      if (tabId === 'quotes') QuotesModule.render();
      if (tabId === 'invoices') InvoicesModule.render();
      if (tabId === 'clients') ClientsModule.render();
      if (tabId === 'pricebook') PricebookModule.render();
      if (tabId === 'agenda') AgendaModule.render();
      if (tabId === 'campaigns') CampaignsModule.render();
      if (tabId === 'settings') SettingsModule.render();
    }

    if (window.lucide) lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderDashboard() {
    const container = document.getElementById('dashboard-view');
    if (!container) return;

    const quotes = DB.getQuotes();
    const clients = DB.getClients();
    const settings = DB.getSettings();

    // Calcolo KPI Finanziari
    let incassato = 0;
    let inAttesa = 0;
    let approvati = 0;

    quotes.forEach(q => {
      const tot = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario').grandTotal;
      if (q.status === 'Saldato') incassato += tot;
      if (q.status === 'Inviato') inAttesa += tot;
      if (q.status === 'Approvato') approvati += tot;
    });

    const conversionRate = quotes.length > 0 
      ? Math.round(((quotes.filter(q => q.status === 'Approvato' || q.status === 'Saldato').length) / quotes.length) * 100) 
      : 0;

    // Riepilogo Fatture & Incassi (solo preventivi già fatturati)
    const invoices = quotes.filter(q => q.invoiceNumber);
    let fatturato = 0;
    let incassatoFatture = 0;
    invoices.forEach(q => {
      const tot = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario').grandTotal;
      fatturato += tot;
      if (q.status === 'Saldato') incassatoFatture += tot;
    });
    const daIncassare = Math.max(0, fatturato - incassatoFatture);

    // Promemoria / azioni da fare (personalizzabili nelle Impostazioni)
    const promemoria = [];
    const daFatturareProm = quotes.filter(q => !q.invoiceNumber && q.status === 'Eseguito');
    if (daFatturareProm.length) promemoria.push({ label: `${daFatturareProm.length} preventivo/i da fatturare`, tab: 'invoices', icon: 'file-plus-2', cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' });

    const fattureNonInviate = quotes.filter(q => q.invoiceNumber && (!q.sentToAccountantAt || !q.sentToSdiAt));
    if (settings.remindUnsent !== false && fattureNonInviate.length) promemoria.push({ label: `${fattureNonInviate.length} fattura/e da inviare (SDI/commercialista)`, tab: 'invoices', icon: 'send', cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' });

    const fattureDaIncassare = quotes.filter(q => q.invoiceNumber && q.status !== 'Saldato');
    if (settings.remindUnpaid !== false && fattureDaIncassare.length) promemoria.push({ label: `${fattureDaIncassare.length} fattura/e da incassare`, tab: 'invoices', icon: 'wallet', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' });

    const remindDays = settings.remindQuoteDays === undefined ? 7 : (Number(settings.remindQuoteDays) || 0);
    if (remindDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - remindDays);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      const inAttesa = quotes.filter(q => q.status === 'Inviato' && q.date && q.date < cutoffStr);
      if (inAttesa.length) promemoria.push({ label: `${inAttesa.length} preventivo/i in attesa di risposta da ${remindDays}+ giorni`, tab: 'quotes', icon: 'clock', cls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' });
    }

    const recentQuotes = [...quotes].slice(0, 4);

    // Prossimi appuntamenti (futuri o di oggi, non annullati)
    const todayStr = DB.localDate(0);
    const upcomingAppts = DB.getAppointments()
      .filter(a => a.status !== 'Annullato' && a.date && a.date >= todayStr)
      .sort((a, b) => `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`))
      .slice(0, 4);

    container.innerHTML = `
      <!-- Intestazione Dashboard -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pannello di Controllo</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-0.5">
            Bentornato, ${settings.ownerName || 'Professionista'}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">${settings.businessName || 'La tua attività'}</p>
        </div>
        
        <div class="flex items-center gap-2">
          <button onclick="QuotesModule.openModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition active:scale-95">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Nuovo Preventivo</span>
          </button>
        </div>
      </div>

      <!-- Schede Metriche / KPI -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Incassato (Saldati)</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">€ ${incassato.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Pagamenti ricevuti</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">In Attesa / Trattativa</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <i data-lucide="clock" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">€ ${inAttesa.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p class="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">Preventivi inviati</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Approvati (Da Eseguire)</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">€ ${approvati.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p class="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">Lavori confermati</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Tasso di Chiusura</span>
            <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
              <i data-lucide="trending-up" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">${conversionRate}%</p>
          <p class="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">${quotes.length} preventivi totali</p>
        </div>

      </div>

      <!-- Riepilogo Fatture & Incassi -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 shadow-sm mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <i data-lucide="receipt" class="w-5 h-5 text-indigo-600"></i>
            Fatture & Incassi
          </h3>
          <button onclick="App.switchTab('invoices')" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Vedi tutte →</button>
        </div>

        ${invoices.length === 0 ? `
          <p class="text-xs text-gray-500 dark:text-gray-400">Non hai ancora emesso fatture. Genera l'XML FatturaPA da un preventivo per iniziare a monitorare gli incassi.</p>
        ` : `
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fatturato</p>
              <p class="text-lg sm:text-xl font-black text-gray-900 dark:text-white">€ ${fatturato.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Incassato</p>
              <p class="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">€ ${incassatoFatture.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Da incassare</p>
              <p class="text-lg sm:text-xl font-black ${daIncassare > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}">€ ${daIncassare.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        `}
      </div>

      <!-- Promemoria / Azioni da fare -->
      ${promemoria.length > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 shadow-sm mb-8">
          <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <i data-lucide="bell" class="w-5 h-5 text-amber-500"></i>
            Promemoria
          </h3>
          <div class="space-y-1.5">
            ${promemoria.map(p => `
              <button onclick="App.switchTab('${p.tab}')" class="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.cls}">
                  <i data-lucide="${p.icon}" class="w-4 h-4"></i>
                </span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200">${p.label}</span>
                <i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-gray-300 dark:text-gray-600"></i>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Sezione Azioni Rapide & Ultimi Preventivi -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Ultimi Preventivi (2 Colonne) -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white text-lg">Preventivi Recenti</h3>
            <button onclick="App.switchTab('quotes')" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Vedi tutti →
            </button>
          </div>

          <div class="space-y-3">
            ${recentQuotes.map(q => {
              const client = DB.getClientById(q.clientId) || { name: 'Cliente' };
              const totals = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario');
              return `
                <div class="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/60 transition cursor-pointer group" onclick="PdfModule.preview('${q.id}')">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 transition">${q.number}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">• ${client.name}</span>
                    </div>
                    <span class="text-[11px] text-gray-400">${q.date}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-extrabold text-sm text-gray-900 dark:text-white">€ ${totals.grandTotal.toFixed(2)}</span>
                    <button onclick="event.stopPropagation(); PdfModule.preview('${q.id}')" title="Anteprima PDF" class="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition">
                      <i data-lucide="printer" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Scorciatoie & Clienti Recenti (1 Colonna) -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white text-lg mb-2">Azioni Rapide</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Operazioni frequenti ad accesso rapido.</p>
            
            <div class="space-y-2.5">
              <button onclick="ClientsModule.openModal()" class="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold hover:bg-blue-100 transition">
                <i data-lucide="user-plus" class="w-4 h-4"></i>
                <span>Aggiungi Nuovo Cliente</span>
              </button>
              
              <button onclick="QuotesModule.openModal()" class="w-full flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition">
                <i data-lucide="file-plus" class="w-4 h-4"></i>
                <span>Crea Nuovo Preventivo</span>
              </button>

              <button onclick="App.switchTab('agenda')" class="w-full flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-100 transition">
                <i data-lucide="calendar" class="w-4 h-4"></i>
                <span>Agenda Sopralluoghi</span>
              </button>

              <button onclick="App.switchTab('pricebook')" class="w-full flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition">
                <i data-lucide="book-open" class="w-4 h-4"></i>
                <span>Listino Voci & Materiali</span>
              </button>

              <button onclick="App.switchTab('clients')" class="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 transition">
                <i data-lucide="message-circle" class="w-4 h-4"></i>
                <span>Apri Rubrica WhatsApp (${clients.length} clienti)</span>
              </button>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/60 text-center">
            <span class="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Dati salvati in locale sul dispositivo
            </span>
          </div>
        </div>

      </div>

      <!-- Prossimi Appuntamenti -->
      <div class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <i data-lucide="calendar-clock" class="w-5 h-5 text-amber-500"></i>
            Prossimi Appuntamenti
          </h3>
          <button onclick="App.switchTab('agenda')" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Apri Agenda →
          </button>
        </div>

        ${upcomingAppts.length === 0 ? `
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Nessun appuntamento in programma.</p>
            <button onclick="App.switchTab('agenda')" class="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">Pianifica il primo sopralluogo →</button>
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${upcomingAppts.map(a => {
              const client = DB.getClientById(a.clientId) || { name: 'Cliente' };
              const isToday = a.date === todayStr;
              const dateLabel = isToday ? 'Oggi' : a.date.split('-').reverse().join('/');
              return `
                <button onclick="App.switchTab('agenda')" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 text-left shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700/50 transition">
                  <div class="flex items-center justify-between mb-2">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isToday ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}">
                      ${isToday ? '' : '<i data-lucide="calendar" class="w-3 h-3"></i>'} ${escapeHtml(dateLabel)}
                    </span>
                    <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400">${escapeHtml(a.time || '--:--')}</span>
                  </div>
                  <p class="font-bold text-gray-900 dark:text-white text-sm truncate">${escapeHtml(a.title)}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">${escapeHtml(client.name)}</p>
                </button>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
    };

    toast.className = `fixed bottom-20 sm:bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all transform translate-y-2 opacity-0 flex items-center gap-2 ${colors[type] || colors.info}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }
};

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
