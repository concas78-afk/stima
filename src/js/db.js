/**
 * Stima - Modulo Database Locale (localStorage)
 * Gestisce l'archiviazione locale per clienti, preventivi, listino voci,
 * agenda appuntamenti e impostazioni.
 */

import { APP_CONFIG } from './config.js';

const DB_KEYS = {
  CLIENTS: 'quickcraft_clients',
  QUOTES: 'quickcraft_quotes',
  PRICEBOOK: 'quickcraft_pricebook',
  APPOINTMENTS: 'quickcraft_appointments',
  SETTINGS: 'quickcraft_settings',
  PLAN: 'quickcraft_plan',
  INIT: 'quickcraft_initialized'
};

// Dati dimostrativi iniziali (settore artigiano / freelance tipico italiano)
const DEMO_SETTINGS = {
  businessName: 'Rossi Impianti & Servizi',
  ownerName: 'Marco Rossi',
  taxId: 'RSSMRC80A01H501U',
  vatNumber: 'IT01234567890',
  phone: '+39 340 123 4567',
  email: 'info@rossiimpianti.it',
  address: 'Via Roma 45',
  cap: '00100',
  city: 'Roma',
  province: 'RM',
  nation: 'IT',
  pec: 'rossiimpianti@pec.it',
  accountantEmail: '',
  iban: 'IT60X0542811101000000123456',
  taxRegime: 'ordinario', // 'ordinario' (con IVA standard 22%) oppure 'forfettario' (esente)
  withholdingTax: 0, // % ritenuta d'acconto (es. 20 per professionisti)
  defaultNotes: 'Validità preventivo: 30 giorni. Pagamento all\'accettazione e saldo a fine lavori tramite bonifico bancario.',
  remindQuoteDays: 7,
  remindUnsent: true,
  remindUnpaid: true
};

const DEMO_CLIENTS = [
  {
    id: 'cli_1',
    name: 'Condominio Belvedere',
    company: 'Studio Amm. Bianchi',
    phone: '+39 333 456 7890',
    email: 'amministrazione@studiobianchi.it',
    taxId: '97854612301',
    address: 'Via dei Giardini 12',
    cap: '00100',
    city: 'Roma',
    province: 'RM',
    nation: 'IT',
    customerType: 'azienda',
    recipientCode: 'ABC1234',
    pec: '',
    notes: 'Contattare il portiere Sig. Luigi per accesso contatori.',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'cli_2',
    name: 'Elena Fontana',
    company: '',
    phone: '+39 349 987 6543',
    email: 'elena.fontana@email.it',
    taxId: 'FNTLNE88M50H501Z',
    address: 'Corso Italia 88',
    cap: '00100',
    city: 'Roma',
    province: 'RM',
    nation: 'IT',
    customerType: 'privato',
    recipientCode: '',
    pec: '',
    notes: 'Ristrutturazione bagno appartamento secondo piano.',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'cli_3',
    name: 'Bar Pasticceria Dolce Vita',
    company: 'Dolce Vita Srl',
    phone: '+39 328 112 2334',
    email: 'ordini@bardolcevita.com',
    taxId: 'IT09876543210',
    address: 'Piazza Cavour 5',
    cap: '00100',
    city: 'Roma',
    province: 'RM',
    nation: 'IT',
    customerType: 'azienda',
    recipientCode: 'XYZ9876',
    pec: '',
    notes: 'Intervento urgente condizionatore bancone frigo.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

const DEMO_PRICEBOOK = [
  { id: 'pb_1', category: 'Manodopera', description: 'Manodopera specializzata (tariffa oraria)', price: 45, vat: 22 },
  { id: 'pb_2', category: 'Manodopera', description: 'Diritto fisso di chiamata e sopralluogo tecnico', price: 50, vat: 22 },
  { id: 'pb_3', category: 'Idraulica', description: 'Fornitura e posa punto acqua completo (carico + scarico)', price: 220, vat: 10 },
  { id: 'pb_4', category: 'Idraulica', description: 'Montaggio sanitari sospesi e rubinetteria (cad.)', price: 140, vat: 10 },
  { id: 'pb_5', category: 'Climatizzazione', description: 'Ricarica gas refrigerante R32 e igienizzazione filtri', price: 180, vat: 22 },
  { id: 'pb_6', category: 'Climatizzazione', description: 'Installazione climatizzatore monosplit 12000 BTU predisposto', price: 320, vat: 10 },
  { id: 'pb_7', category: 'Elettricità', description: 'Realizzazione punto luce / presa elettrica completo', price: 55, vat: 10 },
  { id: 'pb_8', category: 'Certificazioni', description: 'Rilascio Dichiarazione di Conformità Impianto (DM 37/08)', price: 150, vat: 22 }
];

const DEMO_APPOINTMENTS = [
  {
    id: 'apt_1',
    clientId: 'cli_2',
    title: 'Sopralluogo scelta piastrelle e misure doccia',
    date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    time: '10:30',
    location: 'Corso Italia 88, Roma',
    status: 'Programmato', // 'Programmato', 'Completato', 'Annullato'
    notes: 'Portare catalogo rubinetteria e metro laser.'
  },
  {
    id: 'apt_2',
    clientId: 'cli_3',
    title: 'Intervento sostituzione scheda relè e ricarica gas',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    time: '08:00',
    location: 'Piazza Cavour 5, Roma',
    status: 'Programmato',
    notes: 'Arrivare prima dell\'apertura di punta del bar.'
  },
  {
    id: 'apt_3',
    clientId: 'cli_1',
    title: 'Controllo pressione impianto centrale termica',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    time: '15:00',
    location: 'Via dei Giardini 12, Roma',
    status: 'Completato',
    notes: 'Chiamato portiere Sig. Luigi. Tutto regolare.'
  }
];

const DEMO_QUOTES = [
  {
    id: 'qte_1',
    number: 'PREV-2026-001',
    clientId: 'cli_1',
    date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    status: 'Saldato', // 'Bozza', 'Inviato', 'Approvato', 'Saldato', 'Rifiutato'
    items: [
      { description: 'Sostituzione pompa di ricircolo caldaia centrale', quantity: 1, price: 650, vat: 22 },
      { description: 'Manodopera specializzata e collaudo (ore)', quantity: 4, price: 45, vat: 22 }
    ],
    discount: 30,
    depositPercent: 30,
    signatureData: null,
    photos: [],
    notes: 'Lavoro completato e saldato con bonifico.',
    paymentMethod: 'Bonifico Bancario',
    invoiceNumber: '1/2026',
    invoicedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
    sentToClientAt: new Date(Date.now() - 11 * 86400000).toISOString(),
    sentToAccountantAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    sentToSdiAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: 'qte_2',
    number: 'PREV-2026-002',
    clientId: 'cli_2',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    status: 'Inviato',
    items: [
      { description: 'Rifacimento tubature scarico e adduzione acqua bagno', quantity: 1, price: 1200, vat: 10 },
      { description: 'Fornitura e montaggio sanitari sospesi e miscelatori', quantity: 1, price: 850, vat: 22 },
      { description: 'Montaggio piatto doccia filo pavimento 120x80', quantity: 1, price: 350, vat: 10 }
    ],
    discount: 100,
    depositPercent: 50,
    signatureData: null,
    photos: [],
    notes: 'In attesa di approvazione preventivo dalla cliente.',
    paymentMethod: 'Bonifico Bancario',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'qte_3',
    number: 'PREV-2026-003',
    clientId: 'cli_3',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 29 * 86400000).toISOString().split('T')[0],
    status: 'Approvato',
    items: [
      { description: 'Ricarica gas refrigerante R32 e pulizia filtri evaporatore', quantity: 2, price: 180, vat: 22 },
      { description: 'Sostituzione scheda relè ventilatore', quantity: 1, price: 140, vat: 22 }
    ],
    discount: 0,
    depositPercent: 30,
    signatureData: null,
    photos: [],
    notes: 'Inizio lavori previsto per mercoledì mattina.',
    paymentMethod: 'Bonifico Bancario',
    invoiceNumber: '2/2026',
    invoicedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    sentToClientAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const DB = {
  init() {
    if (!localStorage.getItem(DB_KEYS.INIT)) {
      this.resetDemo();
    } else {
      // Se già inizializzato da versione precedente, assicura che listino e agenda esistano
      if (!localStorage.getItem(DB_KEYS.PRICEBOOK)) {
        this._setItem(DB_KEYS.PRICEBOOK, JSON.stringify(DEMO_PRICEBOOK));
      }
      if (!localStorage.getItem(DB_KEYS.APPOINTMENTS)) {
        this._setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(DEMO_APPOINTMENTS));
      }
    }
  },

  // Scrittura sicura su localStorage (gestisce la quota piena senza crash)
  _setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      // Notifica il modulo Sync (se attivo) dopo una modifica ai dati utente
      if (this._isSyncKey(key)) this._notifySync();
      return true;
    } catch (e) {
      console.error('Salvataggio localStorage non riuscito:', e);
      if (window.App && window.App.showToast) {
        window.App.showToast('Spazio di archiviazione pieno! Elimina foto/logo o esporta un backup.', 'error');
      }
      return false;
    }
  },

  // Indica se una chiave contiene dati utente da sincronizzare nel cloud
  _isSyncKey(key) {
    return [DB_KEYS.CLIENTS, DB_KEYS.QUOTES, DB_KEYS.PRICEBOOK, DB_KEYS.APPOINTMENTS, DB_KEYS.SETTINGS].includes(key);
  },

  // Notifica il modulo Sync (se presente) che i dati locali sono cambiati
  _notifySync() {
    if (window.Sync && typeof window.Sync.schedulePush === 'function') {
      window.Sync.schedulePush();
    }
  },

  resetDemo() {
    this._setItem(DB_KEYS.SETTINGS, JSON.stringify(DEMO_SETTINGS));
    this._setItem(DB_KEYS.CLIENTS, JSON.stringify(DEMO_CLIENTS));
    this._setItem(DB_KEYS.QUOTES, JSON.stringify(DEMO_QUOTES));
    this._setItem(DB_KEYS.PRICEBOOK, JSON.stringify(DEMO_PRICEBOOK));
    this._setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(DEMO_APPOINTMENTS));
    this._setItem(DB_KEYS.INIT, 'true');
  },

  // ============ PIANO & ABBONAMENTO (Freemium + Prova Gratis + Referral) ============

  generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'STIMA-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  getDefaultPlan() {
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 120 * 86400000).toISOString(); // 4 mesi di prova gratuita
    return {
      trialEndsAt,
      proUntil: null,
      referralCode: this.generateReferralCode(),
      referralUsed: false,
      referralsGranted: 0
    };
  },

  getPlan() {
    try {
      const data = localStorage.getItem(DB_KEYS.PLAN);
      if (data) {
        const plan = JSON.parse(data);
        // Assicura la presenza di un codice referral
        if (!plan.referralCode) plan.referralCode = this.generateReferralCode();
        return plan;
      }
    } catch (e) { /* ignore */ }
    const plan = this.getDefaultPlan();
    this.savePlan(plan);
    return plan;
  },

  savePlan(plan) {
    this._setItem(DB_KEYS.PLAN, JSON.stringify(plan));
    return plan;
  },

  // L'utente è Pro se è in prova gratuita oppure ha un abbonamento attivo.
  // In "free mode" (APP_CONFIG.freeMode) tutto è sbloccato gratuitamente.
  isPro() {
    if (APP_CONFIG.freeMode) return true;
    const plan = this.getPlan();
    const now = new Date().getTime();
    if (plan.trialEndsAt && new Date(plan.trialEndsAt).getTime() > now) return true;
    if (plan.proUntil && new Date(plan.proUntil).getTime() > now) return true;
    return false;
  },

  // Indica se l'app è in modalità gratuita (tutte le funzioni sbloccate)
  isFreeMode() {
    return !!APP_CONFIG.freeMode;
  },

  // Giorni rimanenti di prova gratuita (0 se terminata o non presente)
  trialDaysLeft() {
    const plan = this.getPlan();
    if (!plan.trialEndsAt) return 0;
    const diff = new Date(plan.trialEndsAt).getTime() - new Date().getTime();
    return diff > 0 ? Math.ceil(diff / 86400000) : 0;
  },

  // Giorni rimanenti di abbonamento Pro (0 se nessuno attivo)
  proDaysLeft() {
    const plan = this.getPlan();
    if (!plan.proUntil) return 0;
    const diff = new Date(plan.proUntil).getTime() - new Date().getTime();
    return diff > 0 ? Math.ceil(diff / 86400000) : 0;
  },

  // Attiva/estende il piano Pro di N mesi
  grantProMonths(months) {
    const plan = this.getPlan();
    const now = new Date();
    const base = (plan.proUntil && new Date(plan.proUntil) > now) ? new Date(plan.proUntil) : now;
    plan.proUntil = new Date(base.getTime() + months * 30 * 86400000).toISOString();
    plan.trialEndsAt = null; // il periodo di prova è stato superato dall'abbonamento
    this.savePlan(plan);
    return plan;
  },

  // Riscatta un codice referral: +1 mese Pro per chi lo inserisce
  redeemReferralCode(code) {
    const plan = this.getPlan();
    if (plan.referralUsed) {
      return { ok: false, message: 'Hai già riscattato un codice invito in passato.' };
    }
    const cleanCode = (code || '').trim().toUpperCase();
    if ((!cleanCode.startsWith('STIMA-') && !cleanCode.startsWith('QUICK-')) || cleanCode.length < 8) {
      return { ok: false, message: 'Codice non valido. Controlla il formato (es. STIMA-ABC123).' };
    }
    if (cleanCode === plan.referralCode) {
      return { ok: false, message: 'Non puoi usare il tuo stesso codice invito.' };
    }
    plan.referralUsed = true;
    this.savePlan(plan);
    this.grantProMonths(2);
    return { ok: true, message: 'Codice valido! Hai ricevuto 2 mesi di Pro gratuiti.' };
  },

  // Impostazioni
  getSettings() {
    try {
      const data = localStorage.getItem(DB_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { ...DEMO_SETTINGS };
    } catch (e) {
      return { ...DEMO_SETTINGS };
    }
  },

  saveSettings(settings) {
    this._setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  // Clienti
  getClients() {
    try {
      const data = localStorage.getItem(DB_KEYS.CLIENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getClientById(id) {
    return this.getClients().find(c => c.id === id) || null;
  },

  saveClient(client) {
    const clients = this.getClients();
    if (!client.id) {
      client.id = 'cli_' + Date.now();
      client.createdAt = new Date().toISOString();
      clients.unshift(client);
    } else {
      const idx = clients.findIndex(c => c.id === client.id);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], ...client };
      } else {
        clients.unshift(client);
      }
    }
    this._setItem(DB_KEYS.CLIENTS, JSON.stringify(clients));
    return client;
  },

  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id !== id);
    this._setItem(DB_KEYS.CLIENTS, JSON.stringify(clients));
  },

  // Listino Voci & Materiali (Pricebook)
  getPricebook() {
    try {
      const data = localStorage.getItem(DB_KEYS.PRICEBOOK);
      return data ? JSON.parse(data) : [...DEMO_PRICEBOOK];
    } catch (e) {
      return [...DEMO_PRICEBOOK];
    }
  },

  getPricebookItemById(id) {
    return this.getPricebook().find(p => p.id === id) || null;
  },

  savePricebookItem(item) {
    const items = this.getPricebook();
    if (!item.id) {
      item.id = 'pb_' + Date.now();
      items.unshift(item);
    } else {
      const idx = items.findIndex(p => p.id === item.id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...item };
      } else {
        items.unshift(item);
      }
    }
    this._setItem(DB_KEYS.PRICEBOOK, JSON.stringify(items));
    return item;
  },

  deletePricebookItem(id) {
    const items = this.getPricebook().filter(p => p.id !== id);
    this._setItem(DB_KEYS.PRICEBOOK, JSON.stringify(items));
  },

  // Agenda Appuntamenti & Sopralluoghi
  getAppointments() {
    try {
      const data = localStorage.getItem(DB_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : [...DEMO_APPOINTMENTS];
    } catch (e) {
      return [...DEMO_APPOINTMENTS];
    }
  },

  getAppointmentById(id) {
    return this.getAppointments().find(a => a.id === id) || null;
  },

  saveAppointment(apt) {
    const list = this.getAppointments();
    if (!apt.id) {
      apt.id = 'apt_' + Date.now();
      list.unshift(apt);
    } else {
      const idx = list.findIndex(a => a.id === apt.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...apt };
      } else {
        list.unshift(apt);
      }
    }
    this._setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(list));
    return apt;
  },

  deleteAppointment(id) {
    const list = this.getAppointments().filter(a => a.id !== id);
    this._setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(list));
  },

  // Preventivi
  getQuotes() {
    try {
      const data = localStorage.getItem(DB_KEYS.QUOTES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getQuoteById(id) {
    return this.getQuotes().find(q => q.id === id) || null;
  },

  saveQuote(quote) {
    const quotes = this.getQuotes();
    if (!quote.id) {
      quote.id = 'qte_' + Date.now();
      quote.createdAt = new Date().toISOString();
      quotes.unshift(quote);
    } else {
      const idx = quotes.findIndex(q => q.id === quote.id);
      if (idx !== -1) {
        quotes[idx] = { ...quotes[idx], ...quote };
      } else {
        quotes.unshift(quote);
      }
    }
    this._setItem(DB_KEYS.QUOTES, JSON.stringify(quotes));
    return quote;
  },

  deleteQuote(id) {
    const quotes = this.getQuotes().filter(q => q.id !== id);
    this._setItem(DB_KEYS.QUOTES, JSON.stringify(quotes));
  },

  // Calcolo totali preventivo con supporto IVA per riga, sconto per singola voce e calcolo Acconto / Saldo
  calculateQuoteTotals(quote, isForfettario = false) {
    let subtotal = 0;
    let taxTotal = 0;
    let itemsDiscountTotal = 0;
    const lineData = [];

    (quote.items || []).forEach(item => {
      // Clamp su quantità e prezzo (mai negativi)
      const qty = Math.max(0, Number(item.quantity) || 0);
      const price = Math.max(0, Number(item.price) || 0);
      const rowTotal = qty * price;

      // Sconto voce: clampato tra 0 e il totale della riga (mai negativo)
      const itemDiscount = Math.min(Math.max(0, Number(item.discount) || 0), rowTotal);
      const lineTotal = Math.max(0, rowTotal - itemDiscount);
      itemsDiscountTotal += itemDiscount;

      subtotal += lineTotal;

      // Regime forfettario = nessuna IVA (natura N2.2); altrimenti IVA per riga
      const vatRate = isForfettario ? 0 : (item.vat !== undefined ? Math.max(0, Number(item.vat) || 0) : 22);
      lineData.push({ lineTotal, vatRate });
    });

    // Sconto complessivo: clampato tra 0 e l'imponibile (mai negativo, mai oltre)
    const discount = Math.min(Math.max(0, Number(quote.discount) || 0), subtotal);
    const finalSubtotal = Math.max(0, subtotal - discount);

    // L'IVA va calcolata sull'imponibile scontato: si ripartisce lo sconto
    // complessivo in proporzione su ogni riga, così l'IVA riflette lo sconto.
    const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
    lineData.forEach(l => {
      const discountedLine = l.lineTotal * ratio;
      if (l.vatRate > 0) {
        taxTotal += (discountedLine * l.vatRate) / 100;
      }
    });

    const grandTotal = finalSubtotal + taxTotal;

    // L'acconto può essere espresso come percentuale OPPURE come cifra fissa.
    // La cifra fissa (depositAmount) ha priorità quando presente.
    let depositPercent = Number(quote.depositPercent) || 0;
    let depositAmount = Number(quote.depositAmount) || 0;

    if (depositAmount > 0) {
      // Se è stata digitata una cifra, la usiamo direttamente e deriviamo la % effettiva
      depositPercent = grandTotal > 0 ? (depositAmount / grandTotal) * 100 : 0;
    } else if (depositPercent > 0) {
      depositAmount = (grandTotal * depositPercent) / 100;
    }

    depositAmount = Math.max(0, Math.min(depositAmount, grandTotal));
    const remainingBalance = Math.max(0, grandTotal - depositAmount);

    return {
      subtotal,
      discount,
      itemsDiscountTotal,
      finalSubtotal,
      taxTotal,
      grandTotal,
      depositPercent,
      depositAmount,
      remainingBalance
    };
  },

  // Genera prossimo numero preventivo sequenziale (usando la data locale, non UTC)
  getNextQuoteNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const quotes = this.getQuotes();
    const prefix = `PREV-${year}-`;
    const yearQuotes = quotes.filter(q => q.number && q.number.startsWith(prefix));
    const nextNum = yearQuotes.length + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  },

  // Data locale in formato YYYY-MM-DD (evita lo slittamento UTC di toISOString)
  localDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + (offsetDays || 0));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // Esportazione e Importazione Dati (Backup)
  exportBackup() {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      clients: this.getClients(),
      quotes: this.getQuotes(),
      pricebook: this.getPricebook(),
      appointments: this.getAppointments()
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // Validazione della struttura: deve essere un oggetto con array nei campi previsti
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { ok: false, message: 'File non valido: non è un backup Stima.' };
      }
      const checks = ['clients', 'quotes', 'pricebook', 'appointments'];
      const hasValidArrays = checks.some(k => Array.isArray(data[k]));
      if (!hasValidArrays && !data.settings) {
        return { ok: false, message: 'File non valido: struttura backup non riconosciuta.' };
      }

      // Validazione tipi: i campi presenti devono essere array (o oggetto per settings)
      if (data.clients !== undefined && !Array.isArray(data.clients)) {
        return { ok: false, message: 'File non valido: campo "clients" non è un elenco.' };
      }
      if (data.quotes !== undefined && !Array.isArray(data.quotes)) {
        return { ok: false, message: 'File non valido: campo "quotes" non è un elenco.' };
      }

      if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
        this._setItem(DB_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      if (Array.isArray(data.clients)) this._setItem(DB_KEYS.CLIENTS, JSON.stringify(data.clients));
      if (Array.isArray(data.quotes)) this._setItem(DB_KEYS.QUOTES, JSON.stringify(data.quotes));
      if (Array.isArray(data.pricebook)) this._setItem(DB_KEYS.PRICEBOOK, JSON.stringify(data.pricebook));
      if (Array.isArray(data.appointments)) this._setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(data.appointments));

      return { ok: true };
    } catch (e) {
      console.error('Errore importazione backup:', e);
      return { ok: false, message: 'Errore nella lettura del file JSON.' };
    }
  }
};

// Inizializza il database
DB.init();
