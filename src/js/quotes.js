/**
 * Stima - Modulo Gestione Preventivi Completo
 * Include: IVA personalizzabile per voce, inserimento rapido da Listino (Pricebook),
 * calcolo Acconto/Caparra, allegato Foto Sopralluogo e Firma Digitale su schermo.
 */

import { DB } from './db.js';
import { App } from './app.js';
import { ClientsModule } from './clients.js';
import { PdfModule } from './pdf.js';
import { FatturaPAModule } from './fatturapa.js';
import { escapeHtml } from './config.js';

export const QuotesModule = {
  currentFilter: 'all', // 'all', 'Bozza', 'Inviato', 'Approvato', 'Saldato', 'Rifiutato'
  searchQuery: '',
  editingQuote: null,
  signingQuoteId: null,
  isDrawing: false,

  render() {
    const container = document.getElementById('quotes-view');
    if (!container) return;

    const quotes = DB.getQuotes();
    const settings = DB.getSettings();

    const filtered = quotes.filter(q => {
      if (this.currentFilter !== 'all' && q.status !== this.currentFilter) {
        return false;
      }
      if (this.searchQuery) {
        const term = this.searchQuery.toLowerCase();
        const client = DB.getClientById(q.clientId);
        const clientName = client ? client.name.toLowerCase() : '';
        const num = (q.number || '').toLowerCase();
        return num.includes(term) || clientName.includes(term);
      }
      return true;
    });

    const statusCounts = {
      all: quotes.length,
      Inviato: quotes.filter(q => q.status === 'Inviato').length,
      Approvato: quotes.filter(q => q.status === 'Approvato').length,
      Eseguito: quotes.filter(q => q.status === 'Eseguito').length,
      Saldato: quotes.filter(q => q.status === 'Saldato').length,
      Bozza: quotes.filter(q => q.status === 'Bozza').length
    };

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Preventivi & Ricevute</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Crea preventivi dal listino, allega foto del sopralluogo e raccogli la firma digitale del cliente.</p>
        </div>
        <button onclick="QuotesModule.openModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition active:scale-95">
          <i data-lucide="file-plus-2" class="w-5 h-5"></i>
          <span>Nuovo Preventivo</span>
        </button>
      </div>

      <!-- Barra Filtri e Ricerca -->
      <div class="flex flex-col md:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <i data-lucide="search" class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Cerca per numero preventivo o cliente..." 
            value="${this.searchQuery}"
            oninput="QuotesModule.handleSearch(this.value)"
            class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button onclick="QuotesModule.setFilter('all')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.currentFilter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}">
            Tutti (${statusCounts.all})
          </button>
          <button onclick="QuotesModule.setFilter('Inviato')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.currentFilter === 'Inviato' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100'}">
            Inviati (${statusCounts.Inviato})
          </button>
          <button onclick="QuotesModule.setFilter('Approvato')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.currentFilter === 'Approvato' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100'}">
            Approvati (${statusCounts.Approvato})
          </button>
          <button onclick="QuotesModule.setFilter('Eseguito')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.currentFilter === 'Eseguito' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100'}">
            Eseguiti (${statusCounts.Eseguito})
          </button>
          <button onclick="QuotesModule.setFilter('Saldato')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.currentFilter === 'Saldato' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'}">
            Saldati (${statusCounts.Saldato})
          </button>
          <button onclick="QuotesModule.setFilter('Bozza')" class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.currentFilter === 'Bozza' ? 'bg-gray-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}">
            Bozze (${statusCounts.Bozza})
          </button>
        </div>
      </div>

      <!-- Lista Preventivi -->
      ${filtered.length === 0 ? `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-8 shadow-sm">
          <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <i data-lucide="file-text" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nessun preventivo trovato</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">Crea un nuovo preventivo per un cliente per vederlo apparire in questa lista.</p>
          <button onclick="QuotesModule.openModal()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Crea Preventivo Ora
          </button>
        </div>
      ` : `
        <div class="space-y-3">
          ${filtered.map(q => this.renderQuoteCard(q, settings)).join('')}
        </div>
      `}
    `;

    if (window.lucide) lucide.createIcons();
  },

  renderQuoteCard(quote, settings) {
    const client = DB.getClientById(quote.clientId) || { name: 'Cliente Sconosciuto', phone: '' };
    const totals = DB.calculateQuoteTotals(quote, settings.taxRegime === 'forfettario');
    
    const statusBadges = {
      'Bozza': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'Inviato': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      'Approvato': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      'Eseguito': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
      'Saldato': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      'Rifiutato': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    };

    const badgeClass = statusBadges[quote.status] || 'bg-gray-100 text-gray-700';

    const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');
    const depositTxt = totals.depositAmount > 0
      ? `• Acconto richiesto: *€ ${totals.depositAmount.toFixed(2)}*${this.formatDepositPct(totals)}\n`
      : '';
    const waText = encodeURIComponent(
      `*${settings.businessName || 'Preventivo'}*\n` +
      `Gentile ${client.name},\n` +
      `Ecco il riepilogo del preventivo n. *${quote.number}* del ${quote.date}:\n` +
      `• Totale: *€ ${totals.grandTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n` +
      depositTxt +
      `\nResto a disposizione per qualsiasi chiarimento o per confermare l'inizio dei lavori.\n` +
      `Cordiali saluti, ${settings.ownerName || ''}`
    );
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}` : '#';

    const hasSignature = !!quote.signatureData;
    const photosCount = (quote.photos || []).length;

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <!-- Info Principali (cliccabile per aprire l'anteprima) -->
          <div class="flex items-start gap-3.5 cursor-pointer group" onclick="PdfModule.preview('${quote.id}')">
            <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <i data-lucide="file-check" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-gray-900 dark:text-white text-base">${quote.number}</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">
                  ${quote.status}
                </span>
                ${hasSignature ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    <i data-lucide="pen-tool" class="w-3 h-3"></i> Firmato
                  </span>
                ` : ''}
                ${photosCount > 0 ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    <i data-lucide="camera" class="w-3 h-3"></i> ${photosCount} foto
                  </span>
                ` : ''}
              </div>
              <p class="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-0.5" onclick="event.stopPropagation(); ClientsModule.openDetail('${client.id}')">${escapeHtml(client.name)}</p>
              <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1 flex-wrap">
                <span>Emesso: ${quote.date}</span>
                ${totals.depositAmount > 0 ? `<span class="text-amber-600 dark:text-amber-400 font-medium">• Acconto € ${totals.depositAmount.toFixed(2)}${this.formatDepositPct(totals)}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Totale e Azioni -->
          <div class="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
            <div class="text-left sm:text-right">
              <p class="text-xs text-gray-400">Totale (IVA incl.)</p>
              <p class="text-xl font-extrabold text-gray-900 dark:text-white">
                € ${totals.grandTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <!-- Pulsanti di azione -->
            <div class="flex items-center gap-1">
              <button onclick="QuotesModule.openPaymentModal('${quote.id}')" title="Invia link di pagamento" class="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition">
                <i data-lucide="credit-card" class="w-4 h-4"></i>
              </button>
              ${cleanPhone ? `
                <a href="${waUrl}" target="_blank" rel="noopener" title="Invia su WhatsApp" class="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                </a>
              ` : ''}
              ${client.email ? `
                <button onclick="QuotesModule.openEmailModal('${quote.id}')" title="Invia Preventivo via Email" class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition">
                  <i data-lucide="mail" class="w-4 h-4"></i>
                </button>
              ` : ''}
              <button onclick="QuotesModule.openSignatureModal('${quote.id}')" title="Fai Firmare sullo Schermo" class="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition">
                <i data-lucide="pen-tool" class="w-4 h-4"></i>
              </button>
              <button onclick="PdfModule.preview('${quote.id}')" title="Stampa o Scarica PDF" class="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
              <button onclick="QuotesModule.openModal('${quote.id}')" title="Modifica" class="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="QuotesModule.deleteQuote('${quote.id}')" title="Elimina" class="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  setFilter(status) {
    this.currentFilter = status;
    this.render();
  },

  handleSearch(query) {
    this.searchQuery = query;
    this.render();
  },

  openModal(quoteId = null, preselectedClientId = null) {
    const modal = document.getElementById('quote-modal');
    if (!modal) return;

    const settings = DB.getSettings();

    let quote = quoteId ? DB.getQuoteById(quoteId) : null;
    if (!quote) {
      quote = {
        id: '',
        number: DB.getNextQuoteNumber(),
        clientId: preselectedClientId || '',
        date: DB.localDate(0),
        dueDate: DB.localDate(30),
        status: 'Bozza',
        items: [
          { description: '', quantity: 1, price: 0, vat: 22 }
        ],
        discount: 0,
        depositPercent: 30,
        signatureData: null,
        photos: [],
        notes: settings.defaultNotes || '',
        paymentMethod: 'Bonifico Bancario'
      };
    }

    this.editingQuote = JSON.parse(JSON.stringify(quote));
    if (!this.editingQuote.photos) this.editingQuote.photos = [];

    // Popola campi testata
    document.getElementById('quote-modal-title').textContent = quoteId ? 'Modifica Preventivo' : 'Nuovo Preventivo';
    document.getElementById('quote-id').value = quote.id || '';
    document.getElementById('quote-number').value = quote.number || '';
    document.getElementById('quote-date').value = quote.date || '';
    document.getElementById('quote-due-date').value = quote.dueDate || '';
    document.getElementById('quote-status').value = quote.status || 'Inviato';
    document.getElementById('quote-discount').value = quote.discount || 0;
    const depositEl = document.getElementById('quote-deposit-percent');
    if (depositEl) depositEl.value = quote.depositPercent !== undefined ? quote.depositPercent : 30;
    const depositAmtEl = document.getElementById('quote-deposit-amount');
    if (depositAmtEl) {
      // Se esiste una cifra fissa salvata, la mostriamo; altrimenti il campo parte vuoto
      depositAmtEl.value = quote.depositAmount !== undefined && quote.depositAmount > 0 ? quote.depositAmount : '';
    }
    document.getElementById('quote-notes').value = quote.notes || '';

    // Imposta il cliente selezionato nella casella di ricerca
    const selectedClient = quote.clientId ? DB.getClientById(quote.clientId) : null;
    document.getElementById('quote-client-id').value = quote.clientId || '';
    document.getElementById('quote-client-search').value = selectedClient ? selectedClient.name : '';
    document.getElementById('quote-client-list').classList.add('hidden');

    // Popola dropdown inserimento rapido da Listino (Pricebook)
    const pbSelect = document.getElementById('quote-pricebook-select');
    if (pbSelect) {
      const pbItems = DB.getPricebook();
      pbSelect.innerHTML = `
        <option value="">+ Inserisci voce dal tuo Listino Prezzi...</option>
        ${pbItems.map(item => `
          <option value="${item.id}">[${item.category}] ${item.description} — € ${Number(item.price).toFixed(2)} (IVA ${item.vat}%)</option>
        `).join('')}
      `;
    }

    this.renderModalItems();
    this.renderModalPhotos();
    this.recalculateModalTotals();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  addItemFromPricebook(pbId) {
    if (!App.requirePro('Il listino voci e materiali')) return;
    if (!pbId || !this.editingQuote) return;
    const pbItem = DB.getPricebookItemById(pbId);
    if (!pbItem) return;

    // Se la prima riga era vuota (di default non toccata), la sostituisce, altrimenti aggiunge in coda
    if (
      this.editingQuote.items.length === 1 &&
      (this.editingQuote.items[0].description === '' || this.editingQuote.items[0].description === 'Prestazione / Servizio') &&
      Number(this.editingQuote.items[0].price) === 0
    ) {
      this.editingQuote.items[0] = {
        description: pbItem.description,
        quantity: 1,
        price: Number(pbItem.price) || 0,
        vat: pbItem.vat !== undefined ? Number(pbItem.vat) : 22
      };
    } else {
      this.editingQuote.items.push({
        description: pbItem.description,
        quantity: 1,
        price: Number(pbItem.price) || 0,
        vat: pbItem.vat !== undefined ? Number(pbItem.vat) : 22
      });
    }

    const pbSelect = document.getElementById('quote-pricebook-select');
    if (pbSelect) pbSelect.value = '';

    this.renderModalItems();
    this.recalculateModalTotals();
    App.showToast('Voce aggiunta dal listino!', 'success');
  },

  renderModalItems() {
    const container = document.getElementById('quote-items-container');
    if (!container || !this.editingQuote) return;

    container.innerHTML = this.editingQuote.items.map((item, index) => {
      const currentVat = item.vat !== undefined ? Number(item.vat) : 22;
      return `
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
          <div class="sm:w-[34%]">
            <input 
              type="text" 
              placeholder="Descrizione lavoro o materiale..." 
              value="${escapeHtml(item.description || '')}"
              oninput="QuotesModule.updateItem(${index}, 'description', this.value)"
              class="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="sm:w-[8%]">
            <input 
              type="number" 
              min="1" 
              step="1"
              placeholder="Qtà" 
              value="${item.quantity || 1}"
              oninput="QuotesModule.updateItem(${index}, 'quantity', this.value)"
              class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white text-center outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="sm:w-[16%]">
            <div class="relative">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                placeholder="Prezzo" 
                value="${item.price || 0}"
                oninput="QuotesModule.updateItem(${index}, 'price', this.value)"
                class="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div class="sm:w-[12%]">
            <select 
              onchange="QuotesModule.updateItem(${index}, 'vat', this.value)"
              class="w-full px-1 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              title="Aliquota IVA"
            >
              <option value="22" ${currentVat === 22 ? 'selected' : ''}>22%</option>
              <option value="10" ${currentVat === 10 ? 'selected' : ''}>10%</option>
              <option value="4" ${currentVat === 4 ? 'selected' : ''}>4%</option>
              <option value="0" ${currentVat === 0 ? 'selected' : ''}>0%</option>
            </select>
          </div>
          <div class="sm:w-[20%]">
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                placeholder="Sconto voce"
                title="Sconto applicato solo a questa voce"
                value="${item.discount || 0}"
                oninput="QuotesModule.updateItem(${index}, 'discount', this.value)"
                class="w-full pl-5 pr-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div class="sm:w-[6%] flex sm:justify-end">
            <button type="button" onclick="QuotesModule.removeItem(${index})" title="Rimuovi riga" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition self-end sm:self-center">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  addItem() {
    if (!this.editingQuote) return;
    this.editingQuote.items.push({
      description: '',
      quantity: 1,
      price: 0,
      vat: 22,
      discount: 0
    });
    this.renderModalItems();
    this.recalculateModalTotals();
  },

  removeItem(index) {
    if (!this.editingQuote || this.editingQuote.items.length <= 1) {
      App.showToast('Il preventivo deve contenere almeno una riga', 'info');
      return;
    }
    this.editingQuote.items.splice(index, 1);
    this.renderModalItems();
    this.recalculateModalTotals();
  },

  updateItem(index, field, value) {
    if (!this.editingQuote || !this.editingQuote.items[index]) return;
    this.editingQuote.items[index][field] = field === 'description' ? value : Number(value) || 0;
    this.recalculateModalTotals();
  },

  // Gestione Allegato Foto Sopralluogo (con compressione Canvas per localStorage)
  handlePhotoUpload(event) {
    if (!App.requirePro('Le foto allegate ai preventivi')) return;
    const files = Array.from(event.target.files || []);
    if (!files.length || !this.editingQuote) return;

    if (!this.editingQuote.photos) this.editingQuote.photos = [];
    if (this.editingQuote.photos.length + files.length > 4) {
      App.showToast('Puoi allegare al massimo 4 foto per preventivo', 'error');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Guardia: se il modale è stato chiuso durante il caricamento, interrompi
          if (!this.editingQuote) return;
          if (!this.editingQuote.photos) this.editingQuote.photos = [];
          if (this.editingQuote.photos.length >= 4) return;

          const canvas = document.createElement('canvas');
          const maxW = 700;
          const scale = img.width > maxW ? maxW / img.width : 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
          this.editingQuote.photos.push({
            name: file.name,
            dataUrl: compressedDataUrl
          });
          this.renderModalPhotos();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  removePhoto(idx) {
    if (!this.editingQuote || !this.editingQuote.photos) return;
    this.editingQuote.photos.splice(idx, 1);
    this.renderModalPhotos();
  },

  renderModalPhotos() {
    const container = document.getElementById('quote-photos-preview');
    if (!container || !this.editingQuote) return;
    const photos = this.editingQuote.photos || [];

    if (photos.length === 0) {
      container.innerHTML = `<p class="text-xs text-gray-400 italic">Nessuna foto allegata.</p>`;
      return;
    }

    container.innerHTML = photos.map((p, idx) => `
      <div class="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
        <img src="${p.dataUrl}" class="w-full h-full object-cover" alt="Foto sopralluogo" />
        <button type="button" onclick="QuotesModule.removePhoto(${idx})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100">
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  },

  recalculateModalTotals() {
    if (!this.editingQuote) return;
    const discount = Number(document.getElementById('quote-discount').value) || 0;
    const depositEl = document.getElementById('quote-deposit-percent');
    const depositPercent = depositEl ? Number(depositEl.value) || 0 : 0;
    const depositAmtEl = document.getElementById('quote-deposit-amount');
    const depositAmount = depositAmtEl ? Number(depositAmtEl.value) || 0 : 0;

    this.editingQuote.discount = discount;
    this.editingQuote.depositPercent = depositPercent;
    this.editingQuote.depositAmount = depositAmount;

    const settings = DB.getSettings();
    const totals = DB.calculateQuoteTotals(this.editingQuote, settings.taxRegime === 'forfettario');

    // Se è stato scelto un acconto percentuale, sincronizza il campo cifra (solo lettura informativa)
    if (depositAmtEl && depositAmount === 0 && depositPercent > 0) {
      depositAmtEl.value = totals.depositAmount.toFixed(2);
    }

    document.getElementById('modal-subtotal').textContent = `€ ${totals.subtotal.toFixed(2)}`;
    const taxEl = document.getElementById('modal-tax-total');
    if (taxEl) taxEl.textContent = `€ ${totals.taxTotal.toFixed(2)}`;
    document.getElementById('modal-grand-total').textContent = `€ ${totals.grandTotal.toFixed(2)}`;

    const depSummaryEl = document.getElementById('modal-deposit-summary');
    if (depSummaryEl) {
      if (totals.depositAmount > 0) {
        const pctTxt = this.formatDepositPct(totals);
        depSummaryEl.textContent = `Acconto${pctTxt}: € ${totals.depositAmount.toFixed(2)} • Saldo: € ${totals.remainingBalance.toFixed(2)}`;
        depSummaryEl.classList.remove('hidden');
      } else {
        depSummaryEl.classList.add('hidden');
      }
    }
  },

  // Quando l'utente digita una cifra libera di acconto
  updateDepositFromAmount(value) {
    if (!this.editingQuote) return;
    const amount = Number(value) || 0;
    const percentEl = document.getElementById('quote-deposit-percent');
    if (percentEl) {
      // Se viene digitata una cifra, azzera il selettore percentuale
      if (amount > 0) {
        percentEl.value = '0';
      }
    }
    this.editingQuote.depositAmount = amount;
    this.recalculateModalTotals();
  },

  // Formatta l'eventuale percentuale dell'acconto (es. " (30%)" oppure "" se cifra libera)
  formatDepositPct(totals) {
    const pct = Number(totals.depositPercent) || 0;
    const isCleanPercent = [20, 30, 40, 50].includes(Math.round(pct));
    return isCleanPercent ? ` (${Math.round(pct)}%)` : '';
  },

  closeModal() {
    const modal = document.getElementById('quote-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.editingQuote = null;
  },

  // Filtra i clienti in base alla ricerca (e mostra "nuovo cliente")
  onQuoteClientSearch(query) {
    const list = document.getElementById('quote-client-list');
    if (!list) return;
    const q = (query || '').trim().toLowerCase();
    const clients = DB.getClients().filter(c =>
      !q || (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q)
    );

    let html = '';
    if (q) {
      html += `<button type="button" onclick="QuotesModule.pickQuoteNewClient()" class="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
        <i data-lucide="user-plus" class="w-4 h-4 shrink-0"></i>
        <span class="truncate">Nuovo cliente: ${escapeHtml(query)}</span>
      </button>`;
    }
    html += clients.slice(0, 60).map(c => `
      <button type="button" onclick="QuotesModule.pickQuoteClient('${c.id}')" class="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <span class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] font-bold shrink-0">${escapeHtml(((c.name || '?')[0] || '?').toUpperCase())}</span>
        <span class="truncate">${escapeHtml(c.name)}${c.company ? ` <span class="text-gray-400 dark:text-gray-500">(${escapeHtml(c.company)})</span>` : ''}</span>
      </button>
    `).join('');

    if (html === '') html = `<p class="px-3 py-2.5 text-xs text-gray-400">Nessun cliente in rubrica. Digita il nome per crearne uno.</p>`;

    list.innerHTML = html;
    list.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  // Seleziona un cliente esistente
  pickQuoteClient(id) {
    const client = DB.getClientById(id);
    if (!client) return;
    document.getElementById('quote-client-id').value = id;
    document.getElementById('quote-client-search').value = client.name || '';
    document.getElementById('quote-client-list').classList.add('hidden');
  },

  // Modalità "nuovo cliente"
  pickQuoteNewClient() {
    document.getElementById('quote-client-id').value = '';
    document.getElementById('quote-client-list').classList.add('hidden');
  },

  // Determina l'id cliente (esistente o nuovo creato al volo)
  resolveQuoteClientId() {
    let clientId = document.getElementById('quote-client-id').value;
    if (!clientId) {
      const name = document.getElementById('quote-client-search').value.trim();
      if (name) {
        const newClient = DB.saveClient({ name });
        clientId = newClient.id;
      }
    }
    return clientId || '';
  },

  saveFromModal(event) {
    event.preventDefault();
    if (!this.editingQuote) return;

    const id = document.getElementById('quote-id').value;
    const number = document.getElementById('quote-number').value.trim();
    if (!number) {
      App.showToast('Il numero preventivo è obbligatorio', 'error');
      return;
    }

    const depositEl = document.getElementById('quote-deposit-percent');
    const depositAmtEl = document.getElementById('quote-deposit-amount');

    const quoteToSave = {
      id: id || undefined,
      number,
      clientId: this.resolveQuoteClientId(),
      date: document.getElementById('quote-date').value,
      dueDate: document.getElementById('quote-due-date').value,
      status: document.getElementById('quote-status').value,
      items: this.editingQuote.items,
      discount: Number(document.getElementById('quote-discount').value) || 0,
      depositPercent: depositEl ? Number(depositEl.value) || 0 : 0,
      depositAmount: depositAmtEl ? Number(depositAmtEl.value) || 0 : 0,
      signatureData: this.editingQuote.signatureData || null,
      photos: this.editingQuote.photos || [],
      notes: document.getElementById('quote-notes').value.trim(),
      paymentMethod: 'Bonifico Bancario'
    };

    DB.saveQuote(quoteToSave);
    this.closeModal();
    this.render();
    App.renderDashboard();
    App.showToast('Preventivo salvato con successo!', 'success');
  },

  deleteQuote(id) {
    const quote = DB.getQuoteById(id);
    if (!quote) return;

    if (confirm(`Sei sicuro di voler eliminare il preventivo "${quote.number}"?`)) {
      DB.deleteQuote(id);
      this.render();
      App.renderDashboard();
      App.showToast('Preventivo eliminato', 'info');
    }
  },

  // MODALE FIRMA DIGITALE SULLO SCHERMO (HTML5 Canvas)
  openSignatureModal(quoteId) {
    if (!App.requirePro('La firma digitale')) return;
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;
    this.signingQuoteId = quoteId;

    const modal = document.getElementById('signature-modal');
    if (!modal) return;

    const client = DB.getClientById(quote.clientId) || { name: 'Cliente' };
    document.getElementById('sig-modal-subtitle').textContent = `Preventivo ${quote.number} — ${client.name}`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();

    setTimeout(() => this.initSignatureCanvas(quote.signatureData), 60);
  },

  initSignatureCanvas(existingDataUrl = null) {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Adatta dimensioni reali del canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 460;
    canvas.height = rect.height || 200;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (existingDataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = existingDataUrl;
    }

    let drawing = false;
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - r.left, y: clientY - r.top };
    };

    const start = (e) => {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const move = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const end = () => {
      drawing = false;
    };

    canvas.onmousedown = start;
    canvas.onmousemove = move;
    canvas.onmouseup = end;
    canvas.onmouseleave = end;

    canvas.ontouchstart = start;
    canvas.ontouchmove = move;
    canvas.ontouchend = end;
  },

  clearSignature() {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  },

  saveSignature() {
    if (!this.signingQuoteId) return;
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;

    // Controllo: la firma non deve essere vuota (canvas completamente bianco)
    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasInk = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) { hasInk = true; break; } // canale alpha > 0 = c'è tratto
    }
    if (!hasInk) {
      App.showToast('La firma è vuota: firma nello spazio prima di confermare.', 'error');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const quote = DB.getQuoteById(this.signingQuoteId);
    if (quote) {
      quote.signatureData = dataUrl;
      if (quote.status === 'Inviato' || quote.status === 'Bozza') {
        quote.status = 'Approvato';
      }
      DB.saveQuote(quote);
      this.closeSignatureModal();
      this.render();
      App.renderDashboard();
      App.showToast('Firma digitale salvata e preventivo Approvato!', 'success');
    }
  },

  closeSignatureModal() {
    const modal = document.getElementById('signature-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.signingQuoteId = null;
  },

  sendEmail(quoteId) {
    this.openEmailModal(quoteId);
  },

  openEmailModal(quoteId) {
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;
    const client = DB.getClientById(quote.clientId);
    if (!client || !client.email) {
      App.showToast('Questo cliente non ha un indirizzo email registrato. Modifica la scheda cliente per aggiungerlo!', 'error');
      return;
    }
    const settings = DB.getSettings();
    const totals = DB.calculateQuoteTotals(quote, settings.taxRegime === 'forfettario');

    const subjectText = `Preventivo ${quote.number} - ${settings.businessName || ''}`;
    const bodyText = 
`Gentile ${client.name},

in riferimento alla Sua richiesta, Le trasmettiamo i dettagli del preventivo n. ${quote.number} del ${quote.date}:

• Imponibile: € ${totals.subtotal.toFixed(2)}
• IVA applicata: € ${totals.taxTotal.toFixed(2)}
• TOTALE DOVUTO: € ${totals.grandTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${totals.depositAmount > 0 ? `• Acconto alla conferma${this.formatDepositPct(totals)}: € ${totals.depositAmount.toFixed(2)} (Saldo: € ${totals.remainingBalance.toFixed(2)})\n` : ''}${quote.dueDate ? `• Validità offerta fino al: ${quote.dueDate}\n` : ''}${settings.iban ? `• Coordinate per il pagamento (IBAN): ${settings.iban}\n` : ''}
Restiamo a Sua completa disposizione per qualsiasi chiarimento o per confermare l'inizio dei lavori.

Cordiali saluti,
${settings.ownerName || ''}
${settings.businessName || ''}
${settings.phone ? `Tel. ${settings.phone}` : ''}`;

    const modal = document.getElementById('email-quote-modal');
    if (!modal) return;

    document.getElementById('email-modal-to').value = client.email;
    document.getElementById('email-modal-subject').value = subjectText;
    document.getElementById('email-modal-body').value = bodyText;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
    const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;

    document.getElementById('email-modal-gmail-btn').onclick = () => {
      window.open(gmailUrl, '_blank');
    };
    document.getElementById('email-modal-mailto-btn').onclick = () => {
      window.location.href = mailtoUrl;
    };

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeEmailModal() {
    const modal = document.getElementById('email-quote-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  copyEmailField(elementId, successMsg) {
    const el = document.getElementById(elementId);
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
      App.showToast(successMsg, 'success');
    }).catch(() => {
      App.showToast('Impossibile copiare negli appunti', 'error');
    });
  },

  // ============ PAGAMENTI ONLINE ============

  // Sostituisce {importo} nel link di pagamento con l'importo del preventivo
  buildPaymentLink(quote) {
    const settings = DB.getSettings();
    const totals = DB.calculateQuoteTotals(quote, settings.taxRegime === 'forfettario');
    const amt = totals.grandTotal;
    // PayPal.Me e simili preferiscono un numero pulito: intero se possibile, altrimenti 2 decimali
    const amtStr = Number.isInteger(amt) ? String(amt) : amt.toFixed(2);
    const link = (settings.paymentLink || '').replace(/\{importo\}/gi, amtStr);
    return { link, amount: amt, amountStr: amtStr };
  },

  // Genera il testo completo delle modalità di pagamento (bonifico + link)
  buildPaymentText(quote) {
    const settings = DB.getSettings();
    const totals = DB.calculateQuoteTotals(quote, settings.taxRegime === 'forfettario');
    const amt = totals.grandTotal.toFixed(2);
    const { link } = this.buildPaymentLink(quote);

    const lines = [];
    lines.push(`Totale da pagare: € ${amt}`);
    lines.push(`Riferimento causale: ${quote.number}`);

    if (settings.iban) {
      lines.push(`• Bonifico bancario - IBAN: ${settings.iban}`);
    }
    if (link && settings.paymentLink) {
      const label = settings.paymentLinkLabel || 'Pagamento online';
      lines.push(`• ${label}: ${link}`);
    }
    lines.push('');
    lines.push('Grazie e buona giornata!');
    return lines.join('\n');
  },

  openPaymentModal(quoteId) {
    if (!App.requirePro('Il link di pagamento online')) return;
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;
    const client = DB.getClientById(quote.clientId) || { name: 'Cliente', phone: '', email: '' };
    const settings = DB.getSettings();

    // Se non c'è né IBAN né link di pagamento, avvisa l'utente
    if (!settings.iban && !settings.paymentLink) {
      App.showToast('Non hai ancora configurato un metodo di pagamento. Vai in Impostazioni!', 'error');
      return;
    }

    const text = this.buildPaymentText(quote);
    const { link } = this.buildPaymentLink(quote);
    const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');

    const modal = document.getElementById('payment-modal');
    if (!modal) return;

    document.getElementById('payment-modal-title').textContent = `Pagamento - Preventivo ${quote.number}`;
    document.getElementById('payment-modal-text').textContent = text;

    // WhatsApp (con causale di riferimento per il tracciamento)
    const waText = encodeURIComponent(
      `*${settings.businessName || 'Pagamento'}*\n` +
      `Gentile ${client.name},\n` +
      `per il preventivo n. *${quote.number}* il totale da pagare è *€ ${DB.calculateQuoteTotals(quote, settings.taxRegime === 'forfettario').grandTotal.toFixed(2)}*.\n\n` +
      `Puoi effettuare il pagamento in uno di questi modi:\n` +
      (settings.iban ? `• Bonifico - IBAN: ${settings.iban}\n` : '') +
      (link && settings.paymentLink ? `• ${settings.paymentLinkLabel || 'Pagamento online'}: ${link}\n` : '') +
      `\n⚠️ Ricorda di indicare come causale: *${quote.number}*\n` +
      `Grazie!`
    );
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}` : '#';

    const waBtn = document.getElementById('payment-modal-wa-btn');
    if (waBtn) {
      if (cleanPhone) {
        waBtn.href = waUrl;
        waBtn.removeAttribute('aria-disabled');
      } else {
        waBtn.href = '#';
        waBtn.onclick = (e) => { e.preventDefault(); App.showToast('Il cliente non ha un numero di telefono', 'error'); };
      }
    }

    // Email
    document.getElementById('payment-modal-mail-btn').onclick = () => {
      if (!client.email) { App.showToast('Il cliente non ha un indirizzo email', 'error'); return; }
      const subject = encodeURIComponent(`Pagamento preventivo ${quote.number} - ${settings.businessName || ''}`);
      const body = encodeURIComponent(
        `Gentile ${client.name},\n\n` +
        `di seguito le modalità per il pagamento del preventivo n. ${quote.number}:\n\n` +
        text + `\n\nCordiali saluti,\n${settings.ownerName || ''}\n${settings.businessName || ''}`
      );
      window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
    };

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  copyPaymentText() {
    const el = document.getElementById('payment-modal-text');
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => {
      App.showToast('Testo pagamento copiato negli appunti!', 'success');
    }).catch(() => {
      App.showToast('Impossibile copiare negli appunti', 'error');
    });
  }
};
