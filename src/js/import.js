/**
 * Stima - Modulo Importazione Clienti in Massa
 * Supporta importazione da:
 * 1. File CSV (esportato da Google Contacts, Outlook, Excel)
 * 2. File vCard .vcf (esportato da WhatsApp, Google Contacts, iPhone)
 * 3. Incolla testo tabellare (da Excel / Gmail / WhatsApp)
 * Con rilevamento automatico delle colonne, anteprima e deduplicazione.
 */

import { DB } from './db.js';
import { App } from './app.js';
import { ClientsModule } from './clients.js';

export const ImportModule = {
  parsedClients: [], // clienti pronti per l'import dopo il parsing

  openModal() {
    const modal = document.getElementById('import-modal');
    if (!modal) return;
    this.parsedClients = [];
    this.resetModalContent();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.parsedClients = [];
  },

  resetModalContent() {
    const container = document.getElementById('import-modal-content');
    if (!container) return;

    container.innerHTML = `
      ${this.renderStepIndicator(1)}

      <!-- Step 1: Scelta Sorgente -->
      <p class="text-sm font-bold text-gray-900 dark:text-white mb-1">1. Da dove vuoi importare i contatti?</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Scegli il formato del file o dei dati che hai a disposizione.</p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Incolla testo -->
        <button onclick="ImportModule.showPaste()" class="p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition text-left group">
          <i data-lucide="clipboard-paste" class="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-2"></i>
          <p class="font-bold text-sm text-gray-900 dark:text-white">Incolla Testo</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Copia e incolla elenco contatti da Excel, Gmail o WhatsApp.</p>
        </button>

        <!-- File CSV -->
        <button onclick="ImportModule.showCsvUpload()" class="p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition text-left group">
          <i data-lucide="file-spreadsheet" class="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-2"></i>
          <p class="font-bold text-sm text-gray-900 dark:text-white">File CSV / Excel</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Carica un file CSV esportato da Google Contacts o Outlook.</p>
        </button>

        <!-- File vCard -->
        <button onclick="ImportModule.showVcfUpload()" class="p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition text-left group">
          <i data-lucide="contact" class="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-2"></i>
          <p class="font-bold text-sm text-gray-900 dark:text-white">File vCard (.vcf)</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Il formato usato da WhatsApp e iPhone per esportare i contatti.</p>
        </button>
      </div>

      <!-- Guida Rapida Export -->
      <div class="mt-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
        <p class="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
          <i data-lucide="info" class="w-4 h-4"></i>
          Come esportare i contatti:
        </p>
        <p>• <b>Da WhatsApp:</b> i contatti risiedono nella rubrica del telefono → esportali dal telefono in formato <b>vCard (.vcf)</b> o via Google Contacts.</p>
        <p>• <b>Da Gmail / Google Contacts:</b> contatti.google.com → Esporta → formato <b>Google CSV</b>.</p>
        <p>• <b>Da Outlook:</b> Esporta contatti → formato <b>CSV</b>.</p>
        <p>• <b>Da Excel:</b> salva il foglio come <b>CSV (delimitato da virgole)</b>.</p>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  renderStepIndicator(currentStep) {
    const steps = [
      { n: 1, label: 'Sorgente' },
      { n: 2, label: 'Dati' },
      { n: 3, label: 'Anteprima' },
      { n: 4, label: 'Importa' }
    ];

    return `
      <div class="flex items-center gap-1 mb-5">
        ${steps.map((s, i) => `
          ${i > 0 ? `<div class="flex-1 h-0.5 ${currentStep > i ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'} rounded"></div>` : ''}
          <div class="flex flex-col items-center shrink-0">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === s.n
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 dark:ring-emerald-900'
                : currentStep > s.n
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
            }">${s.n}</div>
            <span class="text-[9px] mt-0.5 font-medium ${
              currentStep === s.n ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-400'
            }">${s.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ============ METODO 1: INCOLLA TESTO ============
  showPaste() {
    const container = document.getElementById('import-modal-content');
    if (!container) return;

    container.innerHTML = `
      <button onclick="ImportModule.resetModalContent()" class="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 flex items-center gap-1 mb-3">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        Torna alla scelta sorgente
      </button>

      ${this.renderStepIndicator(2)}

      <h4 class="font-bold text-gray-900 dark:text-white text-sm mb-1">2. Incolla l'elenco dei contatti</h4>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Scrivi un cliente per riga, separando i dati con <b>virgola</b> o <b>tabulazione</b>, nell'ordine:<br>
        <span class="font-mono text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">Nome, Telefono, Email, Indirizzo, Azienda</span>
      </p>

      <textarea id="import-paste-area" rows="8" placeholder="Nome, Telefono, Email, Indirizzo, Azienda&#10;Luigi Bianchi, 3334445556, luigi@email.it, Corso Italia 10, Bianchi Impianti&#10;..." class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"></textarea>

      <div class="mt-3 flex items-center justify-between">
        <button onclick="ImportModule.fillExample()" class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          Inserisci dati di esempio
        </button>
        <button onclick="ImportModule.parsePaste()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
          Analizza Dati →
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  fillExample() {
    const area = document.getElementById('import-paste-area');
    if (!area) return;
    area.value = `Mario Rossi, 3331234567, mario.rossi@email.it, Via Roma 1, Rossi Termoidraulica
Elena Fontana, 3499876543, elena.fontana@email.it, Corso Italia 88
Condominio Belvedere, 3334567890, amministrazione@studiobianchi.it, Via dei Giardini 12, Studio Bianchi
Bar Dolce Vita, 3281122334, ordini@bardolcevita.com, Piazza Cavour 5`;
    App.showToast('Dati di esempio inseriti! Clicca "Analizza Dati" per vederli.', 'info');
  },

  parsePaste() {
    const area = document.getElementById('import-paste-area');
    if (!area) return;
    const text = area.value.trim();
    if (!text) {
      App.showToast('Incolla prima i dati dei contatti', 'error');
      return;
    }

    // Suddivide in righe, poi in colonne (virgola o tabulazione)
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const rows = lines.map(line => this.splitCsvLine(line));

    this.buildPreview(rows);
  },

  // ============ METODO 2: FILE CSV ============
  showCsvUpload() {
    const container = document.getElementById('import-modal-content');
    if (!container) return;

    container.innerHTML = `
      <button onclick="ImportModule.resetModalContent()" class="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 flex items-center gap-1 mb-3">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        Torna alla scelta sorgente
      </button>

      ${this.renderStepIndicator(2)}

      <h4 class="font-bold text-gray-900 dark:text-white text-sm mb-1">2. Carica un file CSV</h4>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">File esportato da Google Contacts, Outlook o Excel in formato CSV.</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Il file dovrebbe avere una riga di intestazione con colonne come:
        <span class="font-mono text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">Nome, Telefono, Email, Indirizzo</span>
        — le riconosciamo in automatico.
      </p>

      <label class="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition">
        <i data-lucide="file-spreadsheet" class="w-10 h-10 text-emerald-600 dark:text-emerald-400"></i>
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Clicca per selezionare il file CSV</span>
        <span class="text-xs text-gray-400">(.csv, .txt)</span>
        <input type="file" accept=".csv,.txt,text/csv" onchange="ImportModule.handleCsvFile(event)" class="hidden" />
      </label>
    `;
    if (window.lucide) lucide.createIcons();
  },

  handleCsvFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const rows = lines.map(line => this.splitCsvLine(line));
      this.buildPreview(rows);
    };
    reader.readAsText(file, 'UTF-8');
  },

  // ============ METODO 3: FILE VCARD .VCF ============
  showVcfUpload() {
    const container = document.getElementById('import-modal-content');
    if (!container) return;

    container.innerHTML = `
      <button onclick="ImportModule.resetModalContent()" class="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 flex items-center gap-1 mb-3">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        Torna alla scelta sorgente
      </button>

      ${this.renderStepIndicator(2)}

      <h4 class="font-bold text-gray-900 dark:text-white text-sm mb-1">2. Carica un file vCard (.vcf)</h4>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Il formato standard per esportare i contatti da WhatsApp, iPhone o Android.
        Supporta anche più contatti in un unico file.
      </p>

      <label class="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition">
        <i data-lucide="contact" class="w-10 h-10 text-emerald-600 dark:text-emerald-400"></i>
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Clicca per selezionare il file .vcf</span>
        <span class="text-xs text-gray-400">(supporta più contatti in un unico file)</span>
        <input type="file" accept=".vcf,text/vcard" onchange="ImportModule.handleVcfFile(event)" class="hidden" />
      </label>
    `;
    if (window.lucide) lucide.createIcons();
  },

  handleVcfFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const clients = this.parseVcard(e.target.result);
      if (clients.length === 0) {
        App.showToast('Nessun contatto valido trovato nel file vCard', 'error');
        return;
      }
      this.parsedClients = clients;
      this.showPreview();
    };
    reader.readAsText(file, 'UTF-8');
  },

  parseVcard(text) {
    const cards = text.split('BEGIN:VCARD');
    const clients = [];

    cards.forEach(card => {
      if (!card.includes('END:VCARD')) return;

      const get = (prop) => {
        const re = new RegExp(prop + '(?:;[^:]*)?:(.+)', 'i');
        const m = card.match(re);
        return m ? m[1].trim() : '';
      };

      const name = get('FN') || this.composeName(get('N'));
      const phone = this.cleanVcardPhone(get('TEL'));
      const email = get('EMAIL');
      const address = this.composeVcardAddress(card);
      const company = get('ORG');

      if (!name && !phone && !email) return;

      clients.push({
        name: name || (email || phone || 'Contatto'),
        company: company || '',
        phone: phone || '',
        email: email || '',
        address: address || ''
      });
    });

    return clients;
  },

  composeName(nField) {
    // N: Cognome;Nome;Secondo;Prefisso;Suffisso
    const parts = (nField || '').split(';');
    const lastName = parts[0] || '';
    const firstName = parts[1] || '';
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  },

  cleanVcardPhone(tel) {
    // Rimuove prefissi tipo "tel:" e caratteri non numerici, conservando il +
    let clean = (tel || '').replace(/^tel:/i, '').replace(/\s+/g, '');
    if (clean && !clean.startsWith('+') && clean.length >= 9) {
      clean = '+' + clean;
    }
    return clean;
  },

  composeVcardAddress(card) {
    // ADR: PO box;Unità;Via;Città;Provincia;CAP;Nazione
    const m = card.match(/ADR(?:;[^:]*)?:(.+)/i);
    if (!m) return '';
    const parts = m[1].split(';');
    const street = parts[2] || '';
    const city = parts[3] || '';
    const prov = parts[4] || '';
    const cap = parts[5] || '';
    return [street, `${cap} ${city}`.trim(), `(${prov})`].filter(Boolean).join(', ').replace(', ()', '');
  },

  // ============ PARSING CSV e PREVIEW ============
  splitCsvLine(line) {
    // Gestisce correttamente le virgolette nei campi CSV
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === ',' || ch === '\t') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  },

  buildPreview(rows) {
    if (!rows.length) {
      App.showToast('Nessun dato riconosciuto', 'error');
      return;
    }

    // Cerca la riga di intestazione (contiene parole chiave)
    const headerIndex = this.findHeaderRow(rows);
    let header = null;
    let dataRows = rows;

    if (headerIndex >= 0) {
      header = rows[headerIndex].map(h => h.toLowerCase());
      dataRows = rows.slice(headerIndex + 1);
    }

    const clients = [];
    dataRows.forEach(row => {
      if (row.length === 0 || (row.length === 1 && !row[0])) return;

      if (header) {
        // Mappa le colonne usando l'intestazione
        const client = {};
        header.forEach((h, idx) => {
          const val = (row[idx] || '').trim();
          if (!val) return;
          if (this.isNameHeader(h)) client.name = val;
          else if (this.isPhoneHeader(h)) client.phone = this.cleanPhone(val);
          else if (this.isEmailHeader(h)) client.email = val;
          else if (this.isAddressHeader(h)) client.address = val;
          else if (this.isCompanyHeader(h)) client.company = val;
        });
        if (client.name || client.phone || client.email) {
          if (!client.name) client.name = client.email || client.phone || 'Contatto';
          clients.push(client);
        }
      } else {
        // Nessuna intestazione: posizione fissa Nome, Telefono, Email, Indirizzo, Azienda
        const client = {
          name: row[0] || '',
          phone: this.cleanPhone(row[1] || ''),
          email: row[2] || '',
          address: row[3] || '',
          company: row[4] || ''
        };
        if (client.name || client.phone || client.email) {
          if (!client.name) client.name = client.email || client.phone || 'Contatto';
          clients.push(client);
        }
      }
    });

    if (clients.length === 0) {
      App.showToast('Nessun contatto riconosciuto. Controlla il formato dei dati.', 'error');
      return;
    }

    this.parsedClients = clients;
    this.showPreview();
  },

  findHeaderRow(rows) {
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const cells = rows[i].map(c => c.toLowerCase());
      const joined = cells.join(' ');
      const hasHeaderKeyword = (
        joined.includes('nome') || joined.includes('name') || joined.includes('telefono') ||
        joined.includes('phone') || joined.includes('email') || joined.includes('indirizzo') ||
        joined.includes('address') || joined.includes('azienda') || joined.includes('cognome')
      );
      if (!hasHeaderKeyword) continue;

      // Una riga è davvero un'intestazione solo se NON contiene dati reali
      // (email con "@", numeri di telefono con molte cifre, o nomi propri).
      const hasEmailData = cells.some(c => /@/.test(c));
      const hasPhoneData = cells.some(c => (c.replace(/\D/g, '').length >= 6));
      // Keyword esatte che indicano intestazione (non parte di un nome/indirizzo)
      const exactHeaderWords = ['nome', 'cognome', 'name', 'first', 'last', 'telefono', 'phone',
        'email', 'mail', 'indirizzo', 'address', 'azienda', 'company', 'cell'];
      const hasExactHeader = cells.some(c => exactHeaderWords.includes(c));

      if (hasExactHeader && !hasEmailData && !hasPhoneData) {
        return i;
      }
    }
    return -1;
  },

  isNameHeader(h) {
    return h.includes('nome') || h.includes('name') || h.includes('cognome') || h.includes('first') || h.includes('last');
  },
  isPhoneHeader(h) {
    return h.includes('tel') || h.includes('phone') || h.includes('numero') || h.includes('cell');
  },
  isEmailHeader(h) {
    return h.includes('email') || h.includes('mail');
  },
  isAddressHeader(h) {
    return h.includes('indirizzo') || h.includes('address') || h.includes('via');
  },
  isCompanyHeader(h) {
    return h.includes('azienda') || h.includes('societ') || h.includes('company') || h.includes('org');
  },

  cleanPhone(val) {
    let clean = (val || '').replace(/[^\d+]/g, '');
    if (clean && !clean.startsWith('+')) {
      // Cellulari/mobili italiani (9-10 cifre che iniziano con 3) → +39
      // Numeri fissi italiani (iniziano con 0) → li lasciamo come sono (non anteporre +)
      if (/^3\d{8,9}$/.test(clean)) {
        clean = '+39' + clean;
      } else if (/^\d{10,11}$/.test(clean) && clean.startsWith('0')) {
        // fisso italiano con prefisso: lascia invariato
        clean = clean;
      } else if (/^\d{8,}$/.test(clean) && !clean.startsWith('0')) {
        // numero generico senza prefisso internazionale: aggiungi +
        clean = '+' + clean;
      }
    }
    return clean;
  },

  showPreview() {
    const container = document.getElementById('import-modal-content');
    if (!container) return;

    const existing = DB.getClients();
    let duplicates = 0;
    let newCount = 0;

    this.parsedClients.forEach(c => {
      const isDup = existing.some(ex =>
        (c.phone && ex.phone && c.phone === ex.phone) ||
        (c.email && ex.email && c.email.toLowerCase() === (ex.email || '').toLowerCase())
      );
      c._isDuplicate = isDup;
      if (isDup) duplicates++; else newCount++;
    });

    container.innerHTML = `
      <button onclick="ImportModule.resetModalContent()" class="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 flex items-center gap-1 mb-3">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        Torna alla scelta sorgente
      </button>

      ${this.renderStepIndicator(3)}

      <div class="flex items-center justify-between mb-3">
        <div>
          <h4 class="font-bold text-gray-900 dark:text-white text-sm">3. Controlla l'anteprima</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Trovati <b>${this.parsedClients.length}</b> contatti:
            <span class="text-emerald-600 font-semibold">${newCount} nuovi</span>
            ${duplicates > 0 ? `· <span class="text-amber-600 font-semibold">${duplicates} già esistenti (verranno saltati)</span>` : ''}
          </p>
        </div>
      </div>

      <!-- Legenda duplicati -->
      ${duplicates > 0 ? `
        <div class="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
          <i data-lucide="info" class="w-4 h-4"></i>
          I contatti in grigio sono già presenti in rubrica: non verranno importati di nuovo.
        </div>
      ` : ''}

      <!-- Lista Anteprima -->
      <div class="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700/60 mb-4">
        ${this.parsedClients.map((c, i) => `
          <div class="flex items-center gap-3 p-2.5 text-xs ${c._isDuplicate ? 'opacity-40' : ''}">
            <div class="w-8 h-8 rounded-lg ${c._isDuplicate ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'} flex items-center justify-center font-bold shrink-0">
              ${(c.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-gray-900 dark:text-white truncate">${c.name} ${c._isDuplicate ? '<span class="text-[10px] font-normal text-amber-600">(duplicato)</span>' : ''}</p>
              <p class="text-gray-500 dark:text-gray-400 truncate">
                ${c.phone || '—'} ${c.email ? '• ' + c.email : ''}
              </p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Consenso base giuridica dati importati -->
      <label class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40 cursor-pointer mb-3">
        <input type="checkbox" id="import-consent" class="mt-0.5 w-4 h-4 rounded text-emerald-600 cursor-pointer">
        <span class="text-[11px] text-gray-700 dark:text-gray-200 leading-snug">
          Dichiaro di aver <b>acquisito lecitamente</b> questi contatti e di disporre di una base giuridica valida (consenso o rapporto preesistente) per il loro trattamento nel mio CRM.
        </span>
      </label>

      <!-- Pulsanti Azione -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs text-gray-400 hidden sm:inline">4. Conferma per salvare i nuovi clienti</span>
        <div class="flex items-center gap-2">
          <button onclick="ImportModule.resetModalContent()" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">Annulla</button>
          <button onclick="ImportModule.confirmImport()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition active:scale-95">
            Importa ${newCount} Clienti ✓
          </button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  confirmImport() {
    const consent = document.getElementById('import-consent');
    if (!consent || !consent.checked) {
      App.showToast('Spunta la dichiarazione di acquisizione lecita dei contatti.', 'error');
      return;
    }
    let imported = 0;
    this.parsedClients.forEach(c => {
      if (!c._isDuplicate) {
        DB.saveClient({
          name: c.name,
          company: c.company || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          taxId: '',
          notes: ''
        });
        imported++;
      }
    });

    this.closeModal();
    ClientsModule.render();
    App.showToast(`Importati ${imported} nuovi clienti!`, 'success');
  }
};
