/**
 * Stima - Modulo Gestione Clienti
 * Include diverse modalità di visualizzazione (Griglia, Tabella, Compatta),
 * ordinamento avanzato e Scheda Dettaglio Cliente con storico preventivi completo.
 */

import { DB } from './db.js';
import { App } from './app.js';
import { QuotesModule } from './quotes.js';
import { escapeHtml } from './config.js';

export const ClientsModule = {
  currentFilter: '',
  viewMode: localStorage.getItem('quickcraft_client_view_mode') || 'grid', // 'grid', 'table', 'compact'
  sortBy: localStorage.getItem('quickcraft_client_sort_by') || 'name-asc', // 'name-asc', 'name-desc', 'date-desc', 'quotes-count'
  currentDetailClientId: null,

  setViewMode(mode) {
    this.viewMode = mode;
    localStorage.setItem('quickcraft_client_view_mode', mode);
    this.render();
  },

  setSortBy(sortKey) {
    this.sortBy = sortKey;
    localStorage.setItem('quickcraft_client_sort_by', sortKey);
    this.render();
  },

  render() {
    const container = document.getElementById('clients-view');
    if (!container) return;

    const allQuotes = DB.getQuotes();
    let clients = DB.getClients();

    // 1. Filtraggio per ricerca testo
    if (this.currentFilter) {
      const term = this.currentFilter.toLowerCase();
      clients = clients.filter(c => 
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.company && c.company.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }

    // 2. Ordinamento
    clients.sort((a, b) => {
      if (this.sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (this.sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (this.sortBy === 'date-desc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (this.sortBy === 'date-asc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (this.sortBy === 'quotes-count') {
        const countA = allQuotes.filter(q => q.clientId === a.id).length;
        const countB = allQuotes.filter(q => q.clientId === b.id).length;
        return countB - countA;
      }
      return 0;
    });

    const settings = DB.getSettings();

    container.innerHTML = `
      <!-- Intestazione Rubrica -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rubrica Clienti</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Clicca sul nome di un cliente per aprire la scheda con lo storico completo dei preventivi.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="ImportModule.openModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition active:scale-95">
            <i data-lucide="upload" class="w-5 h-5"></i>
            <span>Importa</span>
          </button>
          <button onclick="ClientsModule.openModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition active:scale-95">
            <i data-lucide="user-plus" class="w-5 h-5"></i>
            <span>Nuovo Cliente</span>
          </button>
        </div>
      </div>

      <!-- Barra Strumenti: Ricerca, Ordinamento e Modalità di Visualizzazione -->
      <div class="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between mb-6 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        
        <!-- Campo di Ricerca -->
        <div class="relative flex-1">
          <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Cerca per nome, azienda, telefono o email..." 
            value="${this.currentFilter}"
            oninput="ClientsModule.handleSearch(this.value)"
            class="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
          
          <!-- Selettore Ordinamento -->
          <div class="flex items-center gap-1.5 text-xs">
            <i data-lucide="arrow-up-down" class="w-4 h-4 text-gray-400"></i>
            <span class="text-gray-500 dark:text-gray-400 hidden sm:inline">Ordina:</span>
            <select 
              onchange="ClientsModule.setSortBy(this.value)"
              class="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 py-1.5 px-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="name-asc" ${this.sortBy === 'name-asc' ? 'selected' : ''}>Nome (A → Z)</option>
              <option value="name-desc" ${this.sortBy === 'name-desc' ? 'selected' : ''}>Nome (Z → A)</option>
              <option value="date-desc" ${this.sortBy === 'date-desc' ? 'selected' : ''}>Più recenti</option>
              <option value="date-asc" ${this.sortBy === 'date-asc' ? 'selected' : ''}>Meno recenti</option>
              <option value="quotes-count" ${this.sortBy === 'quotes-count' ? 'selected' : ''}>Con più preventivi</option>
            </select>
          </div>

          <!-- Pulsanti Cambio Visualizzazione (Griglia, Tabella, Compatta) -->
          <div class="flex items-center bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl gap-1">
            <button 
              onclick="ClientsModule.setViewMode('grid')" 
              title="Vista a Griglia (Schede)"
              class="p-1.5 rounded-lg text-xs transition ${this.viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}"
            >
              <i data-lucide="layout-grid" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="ClientsModule.setViewMode('table')" 
              title="Vista a Tabella Dettagliata"
              class="p-1.5 rounded-lg text-xs transition ${this.viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}"
            >
              <i data-lucide="table" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="ClientsModule.setViewMode('compact')" 
              title="Vista Elenco Compatto"
              class="p-1.5 rounded-lg text-xs transition ${this.viewMode === 'compact' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}"
            >
              <i data-lucide="align-justify" class="w-4 h-4"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- Contenuto Lista Clienti in base alla vista selezionata -->
      ${clients.length === 0 ? `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-8 shadow-sm">
          <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <i data-lucide="users" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nessun cliente trovato</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">Aggiungi il tuo primo cliente o modifica i criteri di ricerca per vederlo apparire qui.</p>
          <button onclick="ClientsModule.openModal()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Aggiungi Cliente Ora
          </button>
        </div>
      ` : this.renderClientsContent(clients, settings, allQuotes)}
    `;

    if (window.lucide) lucide.createIcons();
  },

  renderClientsContent(clients, settings, allQuotes) {
    if (this.viewMode === 'table') {
      return this.renderTableView(clients, settings, allQuotes);
    }
    if (this.viewMode === 'compact') {
      return this.renderCompactView(clients, settings, allQuotes);
    }
    // Default: 'grid'
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${clients.map(c => this.renderClientCard(c, settings, allQuotes)).join('')}
      </div>
    `;
  },

  // Modalità 1: Vista Griglia (Card Classica Dettagliata)
  renderClientCard(client, settings, allQuotes) {
    const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');
    const waText = encodeURIComponent(`Ciao ${client.name}, ti contatto da parte di ${settings.businessName || 'noi'}.`);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}` : '#';
    const mailSubject = encodeURIComponent(`Contatto da ${settings.businessName || 'noi'}`);
    const quotes = allQuotes.filter(q => q.clientId === client.id);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 cursor-pointer group" onclick="ClientsModule.openDetail('${client.id}')">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition">
                ${(client.name || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 class="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">${escapeHtml(client.name)}</h4>
                ${client.company ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${escapeHtml(client.company)}</p>` : ''}
              </div>
            </div>
            
            <div class="flex items-center gap-1">
              <button onclick="ClientsModule.openModal('${client.id}')" title="Modifica" class="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="ClientsModule.deleteClient('${client.id}')" title="Elimina" class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
            ${client.phone ? `
              <div class="flex items-center gap-2">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-gray-400"></i>
                <span>${client.phone}</span>
              </div>
            ` : ''}
            ${client.email ? `
              <div class="flex items-center gap-2 truncate">
                <i data-lucide="mail" class="w-3.5 h-3.5 text-gray-400"></i>
                <a href="mailto:${client.email}?subject=${mailSubject}" class="truncate hover:text-blue-600 hover:underline">${escapeHtml(client.email)}</a>
              </div>
            ` : ''}
            ${client.address ? `
              <div class="flex items-center gap-2 truncate">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i>
                <span class="truncate">${escapeHtml(client.address)}</span>
              </div>
            ` : ''}
            ${client.notes ? `
              <div class="mt-2.5 p-2 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-xs italic text-gray-500 dark:text-gray-400">
                "${escapeHtml(client.notes)}"
              </div>
            ` : ''}
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            ${cleanPhone ? `
              <a href="${waUrl}" target="_blank" rel="noopener" title="Invia WhatsApp" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition">
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                <span>WhatsApp</span>
              </a>
              <a href="tel:${cleanPhone}" title="Chiama subito" class="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <i data-lucide="phone-call" class="w-4 h-4"></i>
              </a>
            ` : ''}
            ${client.email ? `
              <a href="mailto:${client.email}?subject=${mailSubject}" title="Invia Email" class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                <i data-lucide="mail" class="w-4 h-4"></i>
              </a>
            ` : ''}
          </div>

          <div class="flex items-center gap-2">
            <button onclick="ClientsModule.openDetail('${client.id}')" title="Apri scheda e storico" class="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              Storico (${quotes.length})
            </button>
            <button onclick="QuotesModule.openModal(null, '${client.id}')" title="Crea preventivo per questo cliente" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>+ Prev</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // Modalità 2: Vista Tabella Dettagliata (Ideale su Desktop)
  renderTableView(clients, settings, allQuotes) {
    const mailSubject = encodeURIComponent(`Contatto da ${settings.businessName || 'noi'}`);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th class="py-3 px-4">Cliente / Azienda</th>
                <th class="py-3 px-4">Telefono / WhatsApp</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Indirizzo</th>
                <th class="py-3 px-4 text-center">Preventivi</th>
                <th class="py-3 px-4 text-right">Azioni Rapide</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs sm:text-sm">
              ${clients.map(client => {
                const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');
                const waText = encodeURIComponent(`Ciao ${client.name}, ti contatto da parte di ${settings.businessName || 'noi'}.`);
                const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}` : '#';
                const quotes = allQuotes.filter(q => q.clientId === client.id);

                return `
                  <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition">
                    <td class="py-3.5 px-4 cursor-pointer" onclick="ClientsModule.openDetail('${client.id}')">
                      <div class="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">${escapeHtml(client.name)}</div>
                      ${client.company ? `<div class="text-xs text-gray-500 dark:text-gray-400">${escapeHtml(client.company)}</div>` : ''}
                    </td>
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      ${cleanPhone ? `
                        <div class="flex items-center gap-2">
                          <span>${client.phone}</span>
                          <a href="${waUrl}" target="_blank" rel="noopener" title="Apri WhatsApp" class="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                          </a>
                        </div>
                      ` : '<span class="text-gray-400">-</span>'}
                    </td>
                    <td class="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      ${client.email ? `
                        <div class="flex items-center gap-1.5">
                          <a href="mailto:${client.email}?subject=${mailSubject}" class="hover:underline hover:text-blue-600">${client.email}</a>
                          <a href="mailto:${client.email}?subject=${mailSubject}" title="Invia Email" class="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                            <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                          </a>
                        </div>
                      ` : '<span class="text-gray-400">-</span>'}
                    </td>
                    <td class="py-3.5 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      ${client.address || '<span class="text-gray-400">-</span>'}
                    </td>
                    <td class="py-3.5 px-4 text-center cursor-pointer" onclick="ClientsModule.openDetail('${client.id}')">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100">
                        ${quotes.length}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1">
                        <button onclick="QuotesModule.openModal(null, '${client.id}')" title="Nuovo preventivo" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                          <i data-lucide="file-plus" class="w-4 h-4"></i>
                        </button>
                        <button onclick="ClientsModule.openDetail('${client.id}')" title="Apri Scheda Cliente & Storico" class="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">
                          <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="ClientsModule.openModal('${client.id}')" title="Modifica" class="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                          <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="ClientsModule.deleteClient('${client.id}')" title="Elimina" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // Modalità 3: Vista Compatta (Righe snelle ad alta densità per scorrimento rapido)
  renderCompactView(clients, settings, allQuotes) {
    const mailSubject = encodeURIComponent(`Contatto da ${settings.businessName || 'noi'}`);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 divide-y divide-gray-100 dark:divide-gray-700/60 shadow-sm">
        ${clients.map(client => {
          const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');
          const waText = encodeURIComponent(`Ciao ${client.name}, ti contatto da parte di ${settings.businessName || 'noi'}.`);
          const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}` : '#';
          const quotes = allQuotes.filter(q => q.clientId === client.id);

          return `
            <div class="flex items-center justify-between p-3 sm:p-3.5 hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition gap-2">
              <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onclick="ClientsModule.openDetail('${client.id}')">
                <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                  ${(client.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-gray-900 dark:text-white text-sm truncate hover:text-blue-600 transition">${escapeHtml(client.name)}</h4>
                    ${client.company ? `<span class="text-xs text-gray-400 hidden sm:inline">• ${escapeHtml(client.company)}</span>` : ''}
                  </div>
                  <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    ${client.phone ? `<span>${client.phone}</span>` : ''}
                    <span class="text-blue-600 dark:text-blue-400 font-medium">${quotes.length} prev.</span>
                  </div>
                </div>
              </div>

              <!-- Azioni Rapide a destra: WhatsApp, Email, Chiama, + Prev, Edit, Delete -->
              <div class="flex items-center gap-1 shrink-0">
                ${cleanPhone ? `
                  <a href="${waUrl}" target="_blank" rel="noopener" title="WhatsApp" class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition">
                    <i data-lucide="message-circle" class="w-4 h-4"></i>
                  </a>
                  <a href="tel:${cleanPhone}" title="Chiama" class="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                  </a>
                ` : ''}
                ${client.email ? `
                  <a href="mailto:${client.email}?subject=${mailSubject}" title="Invia Email" class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition">
                    <i data-lucide="mail" class="w-4 h-4"></i>
                  </a>
                ` : ''}
                
                <!-- Voce aggiunta preventivo richiesta per la vista elenco -->
                <button onclick="QuotesModule.openModal(null, '${client.id}')" title="Aggiungi Preventivo per questo cliente" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-xs font-semibold transition">
                  <i data-lucide="file-plus" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">+ Prev</span>
                </button>

                <button onclick="ClientsModule.openDetail('${client.id}')" title="Scheda & Storico" class="p-1.5 text-gray-400 hover:text-indigo-600 rounded-xl transition">
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
                <button onclick="ClientsModule.openModal('${client.id}')" title="Modifica" class="p-1.5 text-gray-400 hover:text-blue-600 rounded-xl transition">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="ClientsModule.deleteClient('${client.id}')" title="Elimina" class="p-1.5 text-gray-400 hover:text-red-600 rounded-xl transition">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // SCHEDA DETTAGLIO CLIENTE & DASHBOARD STORICO PREVENTIVI
  openDetail(clientId) {
    const client = DB.getClientById(clientId);
    if (!client) return;
    this.currentDetailClientId = clientId;

    const modal = document.getElementById('client-detail-modal');
    const container = document.getElementById('client-detail-content');
    if (!modal || !container) return;

    const settings = DB.getSettings();
    const quotes = DB.getQuotes().filter(q => q.clientId === clientId);

    // Calcolo KPI Finanziari del singolo cliente
    let totalPaid = 0;
    let totalPending = 0;

    quotes.forEach(q => {
      const tot = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario').grandTotal;
      if (q.status === 'Saldato') totalPaid += tot;
      if (q.status === 'Inviato' || q.status === 'Approvato') totalPending += tot;
    });

    const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');
    const waText = encodeURIComponent(`Ciao ${client.name}, ti contatto da parte di ${settings.businessName || 'noi'}.`);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}` : '#';
    const mailSubject = encodeURIComponent(`Contatto da ${settings.businessName || 'noi'}`);

    // Badges degli stati
    const statusBadges = {
      'Bozza': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'Inviato': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      'Approvato': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      'Saldato': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      'Rifiutato': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    };

    container.innerHTML = `
      <!-- Barra Superiore Scheda Cliente -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            SCHEDA CLIENTE
          </span>
          <span class="text-xs text-gray-400">• Registrato il ${client.createdAt ? client.createdAt.split('T')[0] : 'Di recente'}</span>
        </div>
        <button onclick="ClientsModule.closeDetail()" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Intestazione Profilo Cliente & Azioni Rapide -->
      <div class="bg-gray-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/60 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
              ${(client.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 class="text-2xl font-black text-gray-900 dark:text-white leading-tight">${escapeHtml(client.name)}</h3>
              ${client.company ? `<p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">${escapeHtml(client.company)}</p>` : ''}
              <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                ${client.phone ? `<span class="flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3 text-gray-400"></i> ${client.phone}</span>` : ''}
                ${client.email ? `<span class="flex items-center gap-1"><i data-lucide="mail" class="w-3 h-3 text-gray-400"></i> ${client.email}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Pulsanti di Contatto Rapido -->
          <div class="flex items-center gap-2 flex-wrap">
            ${cleanPhone ? `
              <a href="${waUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition">
                <i data-lucide="message-circle" class="w-4 h-4"></i>
                <span>WhatsApp</span>
              </a>
              <a href="tel:${cleanPhone}" class="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 rounded-xl transition" title="Chiama">
                <i data-lucide="phone-call" class="w-4 h-4"></i>
              </a>
            ` : ''}
            ${client.email ? `
              <a href="mailto:${client.email}?subject=${mailSubject}" class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition" title="Invia Email">
                <i data-lucide="mail" class="w-4 h-4"></i>
                <span>Invia Email</span>
              </a>
            ` : ''}
            <button onclick="QuotesModule.openModal(null, '${client.id}')" class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition">
              <i data-lucide="file-plus" class="w-4 h-4"></i>
              <span>+ Nuovo Preventivo</span>
            </button>
            <button onclick="ClientsModule.openModal('${client.id}')" class="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Modifica dati anagrafici">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Griglia Dati: Anagrafica & Statistiche Finanziarie -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        <!-- Scheda Anagrafica e Note (2 Colonne) -->
        <div class="md:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
          <h4 class="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
            <i data-lucide="map-pin" class="w-4 h-4 text-blue-600"></i>
            Dati di Fatturazione & Recapiti
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-gray-400 font-medium">Indirizzo:</span>
              <p class="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">${client.address || 'Non specificato'}</p>
            </div>
            <div>
              <span class="text-gray-400 font-medium">Partita IVA / Codice Fiscale:</span>
              <p class="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">${client.taxId || 'Non specificato'}</p>
            </div>
            <div>
              <span class="text-gray-400 font-medium">Telefono:</span>
              <p class="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">${client.phone || '-'}</p>
            </div>
            <div>
              <span class="text-gray-400 font-medium">Email:</span>
              <p class="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">${client.email || '-'}</p>
            </div>
          </div>

          ${client.notes ? `
            <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
              <span class="text-gray-400 font-medium">Note sul cliente:</span>
              <p class="text-gray-600 dark:text-gray-300 italic mt-0.5 bg-gray-50 dark:bg-gray-750 p-2.5 rounded-xl">"${escapeHtml(client.notes)}"</p>
            </div>
          ` : ''}
        </div>

        <!-- Scheda Metriche Finanziarie Cliente (1 Colonna) -->
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
          <h4 class="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-600"></i>
            Riepilogo Lavori
          </h4>

          <div class="space-y-3">
            <div>
              <span class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Incassato da questo cliente</span>
              <p class="text-xl font-black text-emerald-600 dark:text-emerald-400">€ ${totalPaid.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <div>
              <span class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">In attesa / Da incassare</span>
              <p class="text-lg font-bold text-amber-600 dark:text-amber-400">€ ${totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span class="text-[11px] text-gray-400">Totale preventivi emessi:</span>
              <span class="font-bold text-gray-900 dark:text-white ml-1">${quotes.length}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- STORICO PREVENTIVI COMPLETO -->
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="font-bold text-gray-900 dark:text-white text-base">Storico Completo Preventivi</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tutti i lavori e preventivi emessi per ${escapeHtml(client.name)}.</p>
          </div>
          <button onclick="QuotesModule.openModal(null, '${client.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold rounded-xl transition">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Nuovo Preventivo</span>
          </button>
        </div>

        ${quotes.length === 0 ? `
          <div class="text-center py-8 bg-gray-50 dark:bg-gray-750 rounded-xl p-4">
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">Nessun preventivo ancora creato per questo cliente.</p>
            <button onclick="QuotesModule.openModal(null, '${client.id}')" class="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              + Crea il primo preventivo ora
            </button>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th class="py-2.5 px-3">Numero</th>
                  <th class="py-2.5 px-3">Data</th>
                  <th class="py-2.5 px-3">Stato</th>
                  <th class="py-2.5 px-3 text-right">Totale</th>
                  <th class="py-2.5 px-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs sm:text-sm">
                ${quotes.map(q => {
                  const totals = DB.calculateQuoteTotals(q, settings.taxRegime === 'forfettario');
                  const badgeClass = statusBadges[q.status] || 'bg-gray-100 text-gray-700';

                  // WhatsApp
                  const waTextQ = encodeURIComponent(
                    `*${settings.businessName || 'Preventivo'}*\n` +
                    `Gentile ${client.name},\n` +
                    `Ecco il riepilogo del preventivo n. *${q.number}* del ${q.date}:\n` +
                    `Totale: *€ ${totals.grandTotal.toFixed(2)}*\n\n` +
                    `Restiamo a disposizione per qualsiasi chiarimento.\n` +
                    `Cordiali saluti, ${settings.ownerName || ''}`
                  );
                  const waUrlQ = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waTextQ}` : '#';

                  return `
                    <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition cursor-pointer group" onclick="PdfModule.preview('${q.id}')">
                      <td class="py-3 px-3 font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition">
                        ${q.number}
                      </td>
                      <td class="py-3 px-3 text-gray-600 dark:text-gray-300">
                        ${q.date}
                      </td>
                      <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">
                          ${q.status}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-right font-extrabold text-gray-900 dark:text-white">
                        € ${totals.grandTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td class="py-3 px-3 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="event.stopPropagation(); QuotesModule.openPaymentModal('${q.id}')" title="Invia link di pagamento" class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg">
                            <i data-lucide="credit-card" class="w-4 h-4"></i>
                          </button>
                          ${cleanPhone ? `
                            <a href="${waUrlQ}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Invia su WhatsApp" class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg">
                              <i data-lucide="message-circle" class="w-4 h-4"></i>
                            </a>
                          ` : ''}
                          ${client.email ? `
                            <button onclick="event.stopPropagation(); QuotesModule.openEmailModal('${q.id}')" title="Invia Preventivo via Email" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                              <i data-lucide="mail" class="w-4 h-4"></i>
                            </button>
                          ` : ''}
                          <button onclick="event.stopPropagation(); PdfModule.preview('${q.id}')" title="Stampa o Scarica PDF" class="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">
                            <i data-lucide="printer" class="w-4 h-4"></i>
                          </button>
                          <button onclick="event.stopPropagation(); QuotesModule.openModal('${q.id}')" title="Modifica" class="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeDetail() {
    const modal = document.getElementById('client-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.currentDetailClientId = null;
  },

  handleSearch(val) {
    this.currentFilter = val;
    this.render();
  },

  openModal(clientId = null) {
    const modal = document.getElementById('client-modal');
    if (!modal) return;

    const client = clientId ? DB.getClientById(clientId) : {
      id: '',
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      customerType: 'privato',
      recipientCode: '',
      pec: '',
      cap: '',
      city: '',
      province: '',
      nation: 'IT',
      notes: ''
    };

    document.getElementById('client-modal-title').textContent = clientId ? 'Modifica Cliente' : 'Nuovo Cliente';
    document.getElementById('client-id').value = client.id || '';
    document.getElementById('client-name').value = client.name || '';
    document.getElementById('client-company').value = client.company || '';
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-email').value = client.email || '';
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-taxid').value = client.taxId || '';
    document.getElementById('client-customer-type').value = client.customerType || 'privato';
    document.getElementById('client-recipient-code').value = client.recipientCode || '';
    document.getElementById('client-pec').value = client.pec || '';
    document.getElementById('client-cap').value = client.cap || '';
    document.getElementById('client-city').value = client.city || '';
    document.getElementById('client-province').value = client.province || '';
    document.getElementById('client-nation').value = client.nation || 'IT';
    document.getElementById('client-notes').value = client.notes || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeModal() {
    const modal = document.getElementById('client-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  saveFromModal(event) {
    event.preventDefault();
    const id = document.getElementById('client-id').value;
    const name = document.getElementById('client-name').value.trim();
    if (!name) {
      App.showToast('Il nome del cliente è obbligatorio', 'error');
      return;
    }

    const client = {
      id: id || undefined,
      name,
      company: document.getElementById('client-company').value.trim(),
      phone: document.getElementById('client-phone').value.trim(),
      email: document.getElementById('client-email').value.trim(),
      address: document.getElementById('client-address').value.trim(),
      taxId: document.getElementById('client-taxid').value.trim(),
      customerType: document.getElementById('client-customer-type').value,
      recipientCode: document.getElementById('client-recipient-code').value.trim().toUpperCase(),
      pec: document.getElementById('client-pec').value.trim(),
      cap: document.getElementById('client-cap').value.trim(),
      city: document.getElementById('client-city').value.trim(),
      province: document.getElementById('client-province').value.trim().toUpperCase(),
      nation: document.getElementById('client-nation').value.trim().toUpperCase(),
      notes: document.getElementById('client-notes').value.trim()
    };

    DB.saveClient(client);
    this.closeModal();
    this.render();

    // Se la scheda dettaglio di questo cliente era aperta, aggiornala
    if (this.currentDetailClientId === client.id) {
      this.openDetail(client.id);
    }

    App.showToast('Cliente salvato con successo!', 'success');
  },

  deleteClient(id) {
    const client = DB.getClientById(id);
    if (!client) return;

    const quoteCount = DB.getQuotes().filter(q => q.clientId === id).length;
    const msg = quoteCount > 0
      ? `Il cliente "${client.name}" ha ${quoteCount} preventivi collegati che verranno eliminati insieme. Continuare?`
      : `Sei sicuro di voler eliminare il cliente "${client.name}"?`;

    if (confirm(msg)) {
      // Elimina anche i preventivi e gli appuntamenti collegati (evita orfani)
      DB.deleteClient(id);
      DB.getQuotes().filter(q => q.clientId === id).forEach(q => DB.deleteQuote(q.id));
      DB.getAppointments().filter(a => a.clientId === id).forEach(a => DB.deleteAppointment(a.id));
      if (this.currentDetailClientId === id) {
        this.closeDetail();
      }
      this.render();
      App.renderDashboard();
      App.showToast('Cliente e dati collegati eliminati', 'info');
    }
  }
};
