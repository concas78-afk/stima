/**
 * Stima - Modulo Campagne Email di Massa & Promozioni
 * Permette agli artigiani e freelance di inviare offerte e promozioni
 * a tutti i clienti con rispetto del GDPR (invio in CCN / Blind Copy).
 */

import { DB } from './db.js';
import { App } from './app.js';

export const CampaignsModule = {
  selectedClientIds: new Set(),
  hasInteracted: false,
  activeTemplate: 'stagionale',

  templates: {
    stagionale: {
      title: 'Manutenzione Stagionale (Sconto 15%)',
      subject: 'Promozione Stagionale: 15% di sconto sulla revisione dell\'impianto',
      body: (businessName, ownerName) => 
`Gentile cliente,

con l'arrivo della nuova stagione, Le ricordiamo l'importanza di effettuare un controllo periodico e la pulizia dei filtri del Suo impianto per garantirne la massima efficienza e sicurezza.

Per tutti i nostri clienti fidelizzati, offriamo uno SCONTO DEL 15% su tutti gli interventi di revisione e manutenzione prenotati entro la fine di questo mese.

Per concordare un appuntamento o ricevere un preventivo gratuito e senza impegno, può rispondere direttamente a questa email oppure contattarci via WhatsApp al nostro numero.

Cordiali saluti,
${ownerName || ''}
${businessName || 'La nostra Ditta'}`
    },

    checkup: {
      title: 'Check-Up Gratuito Impianto',
      subject: 'Offerta Riservata: Check-up gratuito dell\'impianto per i nostri clienti',
      body: (businessName, ownerName) => 
`Gentile cliente,

La ringraziamo per aver scelto i nostri servizi nei mesi scorsi.

Per garantire la perfetta sicurezza e il risparmio energetico della Sua abitazione o attività, abbiamo riservato per Lei un CHECK-UP GRATUITO dello stato dell'impianto.

Durante il sopralluogo verificheremo il corretto funzionamento generale e Le forniremo consigli utili per ottimizzare i consumi.

I posti disponibili per questa iniziativa sono limitati. Per prenotare la Sua verifica gratuita, risponda a questo messaggio indicando la Sua disponibilità.

Un cordiale saluto,
${ownerName || ''}
${businessName || 'La nostra Ditta'}`
    },

    detrazioni: {
      title: 'Promemoria Detrazioni Fiscali (50%)',
      subject: 'Novità Lavori & Detrazioni Fiscali: approfitta degli sgravi con noi',
      body: (businessName, ownerName) => 
`Gentile cliente,

Le ricordiamo che sono ancora attive le agevolazioni e le detrazioni fiscali al 50% per gli interventi di ristrutturazione, efficientamento energetico e sostituzione impianti.

Se sta valutando di rinnovare il Suo bagno, rifare l'impianto o sostituire la caldaia/condizionatore, questo è il momento più conveniente dell'anno per farlo recuperando metà della spesa!

Siamo a Sua completa disposizione per preparare un preventivo dettagliato e guidarLa passo dopo passo nella documentazione necessaria.

Ci risponda per fissare un sopralluogo gratuito.

A presto,
${ownerName || ''}
${businessName || 'La nostra Ditta'}`
    }
  },

  render() {
    const container = document.getElementById('campaigns-view');
    if (!container) return;

    const allClients = DB.getClients();
    const clientsWithEmail = allClients.filter(c => c.email && c.email.trim().length > 0);
    const settings = DB.getSettings();

    // NESSUN auto-selezionamento: l'utente deve scegliere esplicitamente i destinatari
    // (il preselezionamento automatico violerebbe il consenso ex art. 130 Cod. Privacy)

    const tpl = this.templates[this.activeTemplate] || this.templates.stagionale;
    const defaultBody = tpl.body(settings.businessName, settings.ownerName);

    container.innerHTML = `
      <!-- Intestazione Modulo Campagne -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Marketing & Promozioni</span>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">Campagne Email di Massa</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Invia offerte, sconti e comunicazioni a tutti i tuoi clienti in un click, nel pieno rispetto del GDPR.</p>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold">
            <i data-lucide="mail-check" class="w-4 h-4"></i>
            <span>${clientsWithEmail.length} contatti con email</span>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Colonna Sinistra: Modello Offerta & Editor (2 Colonne) -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Scelta Template Offerta Rapida -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              1. Scegli un Modello di Offerta per Artigiani
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              ${Object.entries(this.templates).map(([key, t]) => `
                <button 
                  onclick="CampaignsModule.selectTemplate('${key}')"
                  class="p-3 text-left rounded-xl border text-xs font-medium transition ${this.activeTemplate === key ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 shadow-sm ring-1 ring-purple-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'}"
                >
                  <p class="font-bold text-sm leading-snug">${t.title}</p>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Editor Messaggio -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              2. Personalizza Oggetto e Testo
            </label>
            
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Oggetto dell'Email</label>
              <input 
                type="text" 
                id="campaign-subject" 
                value="${tpl.subject}" 
                class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Corpo del Messaggio</label>
              <textarea 
                id="campaign-body" 
                rows="10" 
                class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs sm:text-sm font-mono leading-relaxed text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              >${defaultBody}</textarea>
            </div>

            <!-- Pulsanti di Invio Massivo -->
            <div class="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2.5">
              <div class="flex flex-col sm:flex-row gap-2">
                <button 
                  onclick="CampaignsModule.sendGmailWeb()" 
                  class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition active:scale-95"
                >
                  <i data-lucide="external-link" class="w-4 h-4"></i>
                  <span>Invia con Gmail Web (${this.selectedClientIds.size} destinatari in CCN)</span>
                </button>

                <button 
                  onclick="CampaignsModule.sendMailto()" 
                  class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition active:scale-95"
                >
                  <i data-lucide="mail" class="w-4 h-4"></i>
                  <span>Invia con App Posta (Outlook / Mail)</span>
                </button>
              </div>

              <!-- Consenso marketing (obbligatorio prima dell'invio) -->
              <label class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40 cursor-pointer">
                <input type="checkbox" id="campaign-consent" class="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer">
                <span class="text-[11px] text-gray-700 dark:text-gray-200 leading-snug">
                  Dichiaro di aver raccolto il <b>consenso</b> dei destinatari (o di avere altra base giuridica valida ex art. 6 GDPR) per l'invio di comunicazioni commerciali, e di rispettare l'obbligo di <b>opt-out</b> (disiscrizione).
                </span>
              </label>

              <div class="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                  I destinatari vengono inseriti in CCN nascosto
                </span>
                <button onclick="CampaignsModule.copyAllEmails()" class="text-blue-600 hover:underline font-semibold">
                  Copia solo lista email
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Colonna Destra: Selezione Destinatari (1 Colonna) -->
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                3. Destinatari (${this.selectedClientIds.size} di ${clientsWithEmail.length})
              </label>
              
              <button onclick="CampaignsModule.toggleSelectAll()" class="text-xs font-semibold text-purple-600 hover:underline">
                ${this.selectedClientIds.size === clientsWithEmail.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
              </button>
            </div>

            ${clientsWithEmail.length === 0 ? `
              <div class="text-center py-8 text-gray-400 text-xs">
                Nessun cliente in rubrica ha una mail valida inserita.
              </div>
            ` : `
              <div class="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                ${clientsWithEmail.map(client => {
                  const isChecked = this.selectedClientIds.has(client.id);
                  return `
                    <label class="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer">
                      <input 
                        type="checkbox" 
                        ${isChecked ? 'checked' : ''}
                        onchange="CampaignsModule.toggleClient('${client.id}')"
                        class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div class="min-w-0 flex-1">
                        <p class="font-bold text-xs text-gray-900 dark:text-white truncate">${client.name}</p>
                        <p class="text-[11px] text-gray-400 truncate">${client.email}</p>
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
            <p class="text-[11px] text-gray-400">
              Vuoi aggiungere altri clienti alla lista? Aggiungili dalla scheda <button onclick="App.switchTab('clients')" class="text-blue-600 underline font-semibold">Clienti</button>.
            </p>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  selectTemplate(key) {
    this.activeTemplate = key;
    this.render();
  },

  toggleClient(id) {
    this.hasInteracted = true;
    if (this.selectedClientIds.has(id)) {
      this.selectedClientIds.delete(id);
    } else {
      this.selectedClientIds.add(id);
    }
    this.render();
  },

  toggleSelectAll() {
    this.hasInteracted = true;
    const clientsWithEmail = DB.getClients().filter(c => c.email && c.email.trim().length > 0);
    if (this.selectedClientIds.size === clientsWithEmail.length) {
      this.selectedClientIds.clear();
    } else {
      clientsWithEmail.forEach(c => this.selectedClientIds.add(c.id));
    }
    this.render();
  },

  getSelectedEmails() {
    const clients = DB.getClients();
    return clients
      .filter(c => this.selectedClientIds.has(c.id) && c.email)
      .map(c => c.email.trim());
  },

  // Verifica il consenso marketing (checkbox obbligatoria)
  checkConsent() {
    const consent = document.getElementById('campaign-consent');
    if (!consent || !consent.checked) {
      App.showToast('Devi spuntare la dichiarazione di consenso prima di inviare.', 'error');
      return false;
    }
    return true;
  },

  sendGmailWeb() {
    if (!App.requirePro('Le campagne email di massa')) return;
    if (!this.checkConsent()) return;
    const emails = this.getSelectedEmails();
    if (emails.length === 0) {
      App.showToast('Seleziona almeno un cliente con email!', 'error');
      return;
    }
    const subject = encodeURIComponent(document.getElementById('campaign-subject').value.trim());
    const body = encodeURIComponent(document.getElementById('campaign-body').value.trim());
    const bcc = encodeURIComponent(emails.join(','));

    // Apre Gmail Web con i destinatari in CCN (BCC)
    const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${bcc}&su=${subject}&body=${body}`;
    window.open(url, '_blank');
  },

  sendMailto() {
    if (!App.requirePro('Le campagne email di massa')) return;
    if (!this.checkConsent()) return;
    const emails = this.getSelectedEmails();
    if (emails.length === 0) {
      App.showToast('Seleziona almeno un cliente con email!', 'error');
      return;
    }
    const subject = encodeURIComponent(document.getElementById('campaign-subject').value.trim());
    const body = encodeURIComponent(document.getElementById('campaign-body').value.trim());
    const bcc = encodeURIComponent(emails.join(','));

    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
  },

  copyAllEmails() {
    const emails = this.getSelectedEmails();
    if (emails.length === 0) {
      App.showToast('Nessuna email selezionata', 'error');
      return;
    }
    navigator.clipboard.writeText(emails.join(', ')).then(() => {
      App.showToast(`${emails.length} indirizzi email copiati negli appunti!`, 'success');
    }).catch(() => {
      App.showToast('Impossibile copiare negli appunti', 'error');
    });
  }
};
