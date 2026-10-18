/**
 * Stima - Modulo Fatture & Incassi
 * Dashboard per monitorare lo stato delle fatture (inviate a cliente,
 * commercialista, SDI) e i conteggi di quanto resta da incassare.
 * Include filtri per stato e periodo di riferimento.
 */

import { DB } from './db.js';
import { FatturaPAModule } from './fatturapa.js';
import { App } from './app.js';
import { ClientsModule } from './clients.js';
import { escapeHtml } from './config.js';

const SENT_TYPES = [
  { key: 'client', field: 'sentToClientAt', label: 'Cliente' },
  { key: 'accountant', field: 'sentToAccountantAt', label: 'Commercialista' },
  { key: 'sdi', field: 'sentToSdiAt', label: 'SDI' },
];

export const InvoicesModule = {
  filterStatus: 'all', // 'all' | 'da_incassare' | 'incassato'
  period: 'all',       // 'all' | 'this_month' | '30days' | '90days' | 'this_year'

  // Verifica se una fattura rientra nel periodo selezionato
  _inPeriod(q) {
    if (this.period === 'all') return true;
    const dateStr = (q.invoicedAt || q.date || '').split('T')[0];
    if (!dateStr) return true;
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();

    if (this.period === 'this_month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (this.period === 'this_year') {
      return d.getFullYear() === now.getFullYear();
    }
    const days = this.period === '30days' ? 30 : 90;
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
    return d >= cutoff;
  },

  render() {
    const container = document.getElementById('invoices-view');
    if (!container) return;

    const quotes = DB.getQuotes();
    const settings = DB.getSettings();
    const invoices = quotes.filter(q => q.invoiceNumber);
    const daFatturare = quotes.filter(q => !q.invoiceNumber && q.status === 'Eseguito');

    // Fatture nel periodo selezionato
    const periodInvoices = invoices.filter(q => this._inPeriod(q));

    // Lista filtrata anche per stato
    const filtered = periodInvoices.filter(q => {
      if (this.filterStatus === 'da_incassare' && q.status === 'Saldato') return false;
      if (this.filterStatus === 'incassato' && q.status !== 'Saldato') return false;
      return true;
    });

    // Totali finanziari (sul periodo selezionato)
    let fatturato = 0, incassato = 0;
    periodInvoices.forEach(q => {
      const tot = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario').grandTotal;
      fatturato += tot;
      if (q.status === 'Saldato') incassato += tot;
    });
    const daIncassare = Math.max(0, fatturato - incassato);

    // Conteggi stato invio (sul periodo selezionato)
    const sentClient = periodInvoices.filter(q => q.sentToClientAt).length;
    const sentAccountant = periodInvoices.filter(q => q.sentToAccountantAt).length;
    const sentSdi = periodInvoices.filter(q => q.sentToSdiAt).length;

    const fmt = (n) => `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    container.innerHTML = `
      <div class="mb-5">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Fatture & Incassi</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Monitora lo stato delle fatture e i pagamenti da incassare.</p>
      </div>

      <!-- Filtri periodo + stato -->
      <div class="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <i data-lucide="calendar-range" class="w-4 h-4"></i> Periodo:
          </label>
          <select onchange="InvoicesModule.setPeriod(this.value)" class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all" ${this.period === 'all' ? 'selected' : ''}>Tutte le date</option>
            <option value="this_month" ${this.period === 'this_month' ? 'selected' : ''}>Questo mese</option>
            <option value="30days" ${this.period === '30days' ? 'selected' : ''}>Ultimi 30 giorni</option>
            <option value="90days" ${this.period === '90days' ? 'selected' : ''}>Ultimi 3 mesi</option>
            <option value="this_year" ${this.period === 'this_year' ? 'selected' : ''}>Quest'anno</option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button onclick="InvoicesModule.setFilter('all')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.filterStatus === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}">
            Tutte (${periodInvoices.length})
          </button>
          <button onclick="InvoicesModule.setFilter('da_incassare')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.filterStatus === 'da_incassare' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100'}">
            Da incassare
          </button>
          <button onclick="InvoicesModule.setFilter('incassato')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.filterStatus === 'incassato' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'}">
            Incassate
          </button>
        </div>
      </div>

      <!-- Da fatturare (lavori eseguiti senza fattura) -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <i data-lucide="file-plus-2" class="w-5 h-5 text-amber-500"></i>
            Da fatturare (${daFatturare.length})
          </h3>
        </div>
        ${daFatturare.length === 0 ? `
          <p class="text-xs text-gray-500 dark:text-gray-400">Nessun lavoro completato in attesa di fattura. Quando un preventivo passa allo stato <b>Eseguito</b>, apparirà qui.</p>
        ` : `
          <div class="space-y-2">
            ${daFatturare.map(q => {
              const client = DB.getClientById(q.clientId) || { name: 'Cliente' };
              const tot = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario').grandTotal;
              return `
                <div class="flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${escapeHtml(client.name)}</p>
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">${escapeHtml(q.number)} · € ${tot.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <button onclick="InvoicesModule.generateInvoice('${q.id}')" class="shrink-0 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition active:scale-95">Genera fattura</button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- KPI Finanziari -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${this.kpiCard('Fatturato', fmt(fatturato), 'file-text', 'blue')}
        ${this.kpiCard('Incassato', fmt(incassato), 'wallet', 'emerald')}
        ${this.kpiCard('Da incassare', fmt(daIncassare), 'clock', 'amber')}
        ${this.kpiCard('Fatture emesse', String(periodInvoices.length), 'receipt', 'purple')}
      </div>

      <!-- Riepilogo stato invio -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 mb-6 shadow-sm flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <span class="text-gray-500 dark:text-gray-400 font-semibold">Stato invio:</span>
        <span class="font-semibold ${sentClient ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}">Cliente: ${sentClient}/${periodInvoices.length}</span>
        <span class="font-semibold ${sentAccountant ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}">Commercialista: ${sentAccountant}/${periodInvoices.length}</span>
        <span class="font-semibold ${sentSdi ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}">SDI: ${sentSdi}/${periodInvoices.length}</span>
      </div>

      <!-- Lista fatture -->
      ${filtered.length === 0 ? this.emptyState() : `
        <div class="space-y-3">
          ${filtered.map(q => this.invoiceCard(q, settings)).join('')}
        </div>
      `}
    `;

    if (window.lucide) lucide.createIcons();
  },

  setFilter(status) {
    this.filterStatus = status;
    this.render();
  },

  setPeriod(period) {
    this.period = period;
    this.render();
  },

  kpiCard(label, value, icon, color) {
    const palette = {
      blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    };
    return `
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">${label}</span>
          <div class="w-8 h-8 rounded-lg ${palette[color]} flex items-center justify-center">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
          </div>
        </div>
        <p class="text-2xl font-black text-gray-900 dark:text-white">${value}</p>
      </div>
    `;
  },

  emptyState() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-10 text-center">
        <i data-lucide="receipt" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600"></i>
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-3">Nessuna fattura</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Nessuna fattura corrisponde ai filtri selezionati.</p>
      </div>
    `;
  },

  formatDate(iso) {
    const s = (iso || '').split('T')[0];
    return s ? s.split('-').reverse().join('/') : '';
  },

  invoiceCard(q, settings) {
    const client = DB.getClientById(q.clientId) || { name: 'Cliente' };
    const totals = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario');
    const paid = q.status === 'Saldato';

    const clientLabel = client.id
      ? `<button onclick="ClientsModule.openDetail('${client.id}')" class="font-bold text-gray-900 dark:text-white text-sm mt-1.5 truncate text-left hover:text-blue-600 dark:hover:text-blue-400 hover:underline">${escapeHtml(client.name)}</button>`
      : `<p class="font-bold text-gray-900 dark:text-white text-sm mt-1.5 truncate">${escapeHtml(client.name)}</p>`;

    const sentBtns = SENT_TYPES.map(t => {
      const isSent = !!q[t.field];
      return `
        <button onclick="InvoicesModule.toggleSent('${q.id}', '${t.key}')" title="${isSent ? 'Segna come NON inviata' : 'Segna come inviata'}"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${isSent
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}">
          <i data-lucide="${isSent ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i>
          ${t.label}
        </button>`;
    }).join('');

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">FATTURA ${escapeHtml(q.invoiceNumber)}</span>
              <span class="text-[11px] text-gray-400">Prev. ${escapeHtml(q.number)}</span>
            </div>
            ${clientLabel}
            <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${escapeHtml(this.formatDate(q.invoicedAt || q.date))}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-lg font-black text-gray-900 dark:text-white">€ ${totals.grandTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${paid
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}">
              ${paid ? 'Incassato' : 'Da incassare'}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 mt-3">
          <span class="text-[11px] text-gray-400 mr-1">Inviata a:</span>
          ${sentBtns}
        </div>

        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span class="text-[11px] text-gray-500 dark:text-gray-400">${paid ? (q.paidAt ? 'Incassato il ' + escapeHtml(this.formatDate(q.paidAt)) : 'Incassato') : 'Pagamento non ancora ricevuto'}</span>
          <button onclick="InvoicesModule.togglePaid('${q.id}')" class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${paid
            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'}">
            ${paid ? 'Segna non incassato' : 'Segna incassato'}
          </button>
        </div>
      </div>
    `;
  },

  // Attiva/disattiva il flag "inviata a" (cliente / commercialista / SDI)
  toggleSent(quoteId, type) {
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;
    const t = SENT_TYPES.find(s => s.key === type);
    if (!t) return;
    quote[t.field] = quote[t.field] ? null : new Date().toISOString();
    DB.saveQuote(quote);
    this.render();
  },

  // Attiva/disattiva lo stato "incassato"
  togglePaid(quoteId) {
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;
    if (quote.status === 'Saldato') {
      quote.status = 'Approvato';
      quote.paidAt = null;
    } else {
      quote.status = 'Saldato';
      quote.paidAt = new Date().toISOString();
    }
    DB.saveQuote(quote);
    this.render();
  },

  // Genera la fattura elettronica per un preventivo eseguito
  generateInvoice(quoteId) {
    if (!App.requirePro('La fatturazione elettronica')) return;
    if (!FatturaPAModule.requireFeConsent()) return;
    const result = FatturaPAModule.generate(quoteId);
    if (!result.ok) {
      App.showToast(result.message, 'error');
      return;
    }
    const quote = DB.getQuoteById(quoteId);
    if (quote && !quote.invoiceNumber) {
      quote.invoiceNumber = result.invoiceNumber;
      quote.invoicedAt = new Date().toISOString();
      DB.saveQuote(quote);
    }
    App.showToast(`Fattura ${result.invoiceNumber} generata! Ora è nelle "Fatture emesse".`, 'success');
    this.render();
  },
};
