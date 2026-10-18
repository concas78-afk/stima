/**
 * Stima - Modulo Impostazioni & Profilo Fiscale
 */

import { DB } from './db.js';
import { App } from './app.js';
import { Sync } from './sync.js';
import { escapeHtml } from './config.js';

export const SettingsModule = {
  _tempLogo: null,

  handleLogoUpload(event) {
    if (!App.requirePro('Il logo personalizzato')) return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 400;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        this._tempLogo = dataUrl;

        // Aggiorna anteprima senza ricaricare tutto il form
        const preview = document.getElementById('logo-preview');
        if (preview) {
          preview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-contain" alt="Logo aziendale" />`;
        }
        App.showToast('Logo caricato! Clicca "Salva Modifiche" per confermare.', 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  removeLogo() {
    this._tempLogo = '';
    const preview = document.getElementById('logo-preview');
    if (preview) {
      preview.innerHTML = `
        <div class="text-center text-gray-300 dark:text-gray-600">
          <i data-lucide="building-2" class="w-8 h-8 mx-auto"></i>
          <span class="text-[10px]">Nessun logo</span>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
    App.showToast('Logo rimosso! Clicca "Salva Modifiche" per confermare.', 'info');
  },

  render() {
    const container = document.getElementById('settings-view');
    if (!container) return;

    const settings = DB.getSettings();

    container.innerHTML = `
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Impostazioni & Profilo</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Configura i dati della tua attività che appariranno sui preventivi e gestisci i backup.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Form Dati Attività (2 Colonne su Desktop) -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i data-lucide="briefcase" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
            Dati Attività & Intestazione
          </h3>

          <form onsubmit="SettingsModule.save(event)" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome Ditta / Attività *</label>
                <input 
                  type="text" 
                  id="set-business-name" 
                  required 
                  value="${escapeHtml(settings.businessName || '')}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Titolare / Professionista</label>
                <input 
                  type="text" 
                  id="set-owner-name" 
                  value="${escapeHtml(settings.ownerName || '')}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Partita IVA</label>
                <input 
                  type="text" 
                  id="set-vat-number" 
                  value="${escapeHtml(settings.vatNumber || '')}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Codice Fiscale</label>
                <input 
                  type="text" 
                  id="set-tax-id" 
                  value="${escapeHtml(settings.taxId || '')}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Logo Aziendale -->
            <div class="p-3.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <i data-lucide="image" class="w-4 h-4 text-blue-600"></i>
                Logo Aziendale (apparirà sui preventivi e nei PDF)
              </label>
              <div class="flex items-center gap-4">
                <div id="logo-preview" class="w-20 h-20 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                  ${settings.logo ? `
                    <img src="${settings.logo}" class="w-full h-full object-contain" alt="Logo aziendale" />
                  ` : `
                    <div class="text-center text-gray-300 dark:text-gray-600">
                      <i data-lucide="building-2" class="w-8 h-8 mx-auto"></i>
                      <span class="text-[10px]">Nessun logo</span>
                    </div>
                  `}
                </div>
                <div class="space-y-2 flex-1">
                  <label class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                    <span>Carica Logo</span>
                    <input type="file" accept="image/*" onchange="SettingsModule.handleLogoUpload(event)" class="hidden" />
                  </label>
                  ${settings.logo ? `
                    <button type="button" onclick="SettingsModule.removeLogo()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      <span>Rimuovi Logo</span>
                    </button>
                  ` : ''}
                  <p class="text-[11px] text-gray-400">PNG o JPG. Verrà ridimensionato automaticamente.</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Telefono / WhatsApp</label>
                <input 
                  type="text" 
                  id="set-phone" 
                  value="${escapeHtml(settings.phone || '')}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  id="set-email" 
                  value="${escapeHtml(settings.email || '')}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Indirizzo Sede Legale / Operativa</label>
              <input 
                type="text" 
                id="set-address" 
                value="${escapeHtml(settings.address || '')}" 
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">CAP</label>
                <input type="text" id="set-cap" value="${escapeHtml(settings.cap || '')}" placeholder="00100" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div class="col-span-1">
                <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Città</label>
                <input type="text" id="set-city" value="${escapeHtml(settings.city || '')}" placeholder="Roma" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Provincia</label>
                <input type="text" id="set-province" value="${escapeHtml(settings.province || '')}" placeholder="RM" maxlength="2" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Nazione</label>
                <input type="text" id="set-nation" value="${escapeHtml(settings.nation || 'IT')}" placeholder="IT" maxlength="2" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">PEC (per ricezione notifiche SDI)</label>
                <input 
                  type="text" 
                  id="set-pec" 
                  value="${escapeHtml(settings.pec || '')}" 
                  placeholder="nome@pec.it" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ritenuta d'Acconto % (solo professionisti)</label>
                <input 
                  type="number" 
                  id="set-withholding-tax" 
                  min="0" max="30" step="0.5"
                  value="${escapeHtml(settings.withholdingTax || 0)}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Commercialista (per invio XML fatture)</label>
              <input 
                type="email" 
                id="set-accountant-email" 
                value="${escapeHtml(settings.accountantEmail || '')}" 
                placeholder="commercialista@email.it" 
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p class="text-[11px] text-gray-400 mt-1">Riceverà una copia delle fatture elettroniche (XML) generate dall'app.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">IBAN per i Pagamenti</label>
                <input 
                  type="text" 
                  id="set-iban" 
                  value="${escapeHtml(settings.iban || '')}" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Regime Fiscale</label>
                <select 
                  id="set-tax-regime" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="forfettario" ${settings.taxRegime === 'forfettario' ? 'selected' : ''}>Forfettario (RF19, Natura N2.2)</option>
                  <option value="ordinario" ${settings.taxRegime === 'ordinario' ? 'selected' : ''}>Ordinario (RF01, IVA 22%)</option>
                </select>
              </div>
            </div>

            <!-- Metodi di Pagamento Online -->
            <div class="p-3.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <i data-lucide="credit-card" class="w-4 h-4 text-emerald-600"></i>
                Link di Pagamento Online (opzionale)
              </label>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Nome del metodo (es. Satispay, PayPal, SumUp)</label>
                  <input 
                    type="text" 
                    id="set-payment-label" 
                    placeholder="Es. Satispay"
                    value="${escapeHtml(settings.paymentLinkLabel || '')}" 
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Link di pagamento</label>
                  <input 
                    type="text" 
                    id="set-payment-link" 
                    placeholder="https://..."
                    value="${escapeHtml(settings.paymentLink || '')}" 
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div class="text-[11px] text-gray-400 space-y-1">
                <p>• Se il tuo provider supporta l'importo nel link, usa <span class="font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded">{importo}</span> come segnaposto. Esempio PayPal.Me: <span class="font-mono">https://paypal.me/tuonome/{importo}</span></p>
                <p>• Se non inserisci alcun link, il preventivo mostrerà solo il pagamento tramite <b>bonifico (IBAN)</b>.</p>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Note Predefinite per i Preventivi</label>
              <textarea 
                id="set-default-notes" 
                rows="3" 
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >${settings.defaultNotes || ''}</textarea>
            </div>

            <div class="pt-2 flex justify-end">
              <button type="submit" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition active:scale-95">
                Salva Modifiche
              </button>
            </div>
          </form>
        </div>

        <!-- Gestione Dati e Backup (1 Colonna) -->
        <div class="space-y-6">
          <!-- Piano & Abbonamento -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <i data-lucide="crown" class="w-5 h-5 text-amber-500"></i>
              Piano & Abbonamento
            </h3>

            ${this.renderPlanCard()}

            <!-- Codice Invito (Referral) -->
            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p class="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                <i data-lucide="gift" class="w-4 h-4 text-purple-600"></i>
                Guadagna 2 mesi gratis
              </p>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                Condividi il tuo codice: quando chi lo usa <b>inizia a pagare</b>, ricevi <b class="text-purple-600">2 mesi di Pro gratis</b>.
              </p>

              <button onclick="SettingsModule.openShareModal()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-sm transition active:scale-95 mb-3">
                <i data-lucide="share-2" class="w-4 h-4"></i>
                <span>Condividi e guadagna 2 mesi</span>
              </button>

              <div class="flex items-center gap-2 mb-2.5">
                <span id="plan-referral-code" class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono font-bold text-center text-purple-700 dark:text-purple-300 tracking-wider">${DB.getPlan().referralCode}</span>
                <button onclick="SettingsModule.shareReferral('copy')" title="Copia codice" class="p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
              </div>

              <!-- Inserisci codice invito -->
              <div class="flex items-center gap-2">
                <input type="text" id="redeem-code-input" placeholder="Inserisci codice invito..." class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500">
                <button onclick="SettingsModule.redeemReferral()" class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition">
                  Riscatta
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <i data-lucide="shield-check" class="w-5 h-5 text-emerald-600 dark:text-emerald-400"></i>
              Privacy & Backup
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
              I tuoi dati sono salvati solo sul tuo dispositivo. Esporta un file di backup periodico per non perderli.
            </p>

            <div class="space-y-3">
              <button onclick="SettingsModule.exportBackup()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl transition">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Esporta Backup (JSON)</span>
              </button>

              <label class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl transition cursor-pointer">
                <i data-lucide="upload" class="w-4 h-4"></i>
                <span>Ripristina Backup</span>
                <input type="file" accept=".json" onchange="SettingsModule.importBackup(event)" class="hidden" />
              </label>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <i data-lucide="cloud" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
              Cloud & Sincronizzazione
            </h3>
            <p id="sync-status" class="text-xs text-gray-500 dark:text-gray-400 mb-4">Verifica dello stato…</p>
            <button onclick="Sync.manualSync()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              <span>Sincronizza ora</span>
            </button>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <i data-lucide="bell" class="w-5 h-5 text-amber-500"></i>
              Promemoria & Automazione
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Configura i promemoria automatici che compaiono nella Dashboard.</p>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Avvisami dei preventivi in attesa di risposta da più di N giorni</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="set-remind-quote-days" min="0" max="90" value="${settings.remindQuoteDays ?? 7}" class="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500">
                  <span class="text-xs text-gray-400">giorni (0 = disattiva)</span>
                </div>
              </div>

              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Avvisami delle fatture non inviate (SDI / commercialista)</span>
                <input type="checkbox" id="set-remind-unsent" ${settings.remindUnsent !== false ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600">
              </label>

              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Avvisami dei pagamenti non ancora ricevuti</span>
                <input type="checkbox" id="set-remind-unpaid" ${settings.remindUnpaid !== false ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600">
              </label>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-2 text-red-600 flex items-center gap-2">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
              Dati Demo
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Vuoi ricaricare i clienti e i preventivi di esempio?
            </p>
            <button onclick="SettingsModule.resetDemo()" class="w-full px-4 py-2 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold rounded-xl transition">
              Ripristina Dati Dimostrativi
            </button>
          </div>
        </div>

      </div>
    `;

    Sync.renderStatus();
    if (window.lucide) lucide.createIcons();
  },

  save(event) {
    event.preventDefault();

    // Gestione logo: se è stato caricato/rimosso in questa sessione, usa il valore temporaneo
    let logoValue = DB.getSettings().logo || '';
    if (this._tempLogo !== null) {
      logoValue = this._tempLogo;
    }

    const updated = {
      businessName: document.getElementById('set-business-name').value.trim(),
      ownerName: document.getElementById('set-owner-name').value.trim(),
      vatNumber: document.getElementById('set-vat-number').value.trim(),
      taxId: document.getElementById('set-tax-id').value.trim(),
      phone: document.getElementById('set-phone').value.trim(),
      email: document.getElementById('set-email').value.trim(),
      address: document.getElementById('set-address').value.trim(),
      cap: document.getElementById('set-cap').value.trim(),
      city: document.getElementById('set-city').value.trim(),
      province: document.getElementById('set-province').value.trim().toUpperCase(),
      nation: document.getElementById('set-nation').value.trim().toUpperCase() || 'IT',
      pec: document.getElementById('set-pec').value.trim(),
      accountantEmail: document.getElementById('set-accountant-email').value.trim(),
      iban: document.getElementById('set-iban').value.trim(),
      paymentLinkLabel: document.getElementById('set-payment-label').value.trim(),
      paymentLink: document.getElementById('set-payment-link').value.trim(),
      taxRegime: document.getElementById('set-tax-regime').value,
      withholdingTax: Number(document.getElementById('set-withholding-tax').value) || 0,
      defaultNotes: document.getElementById('set-default-notes').value.trim(),
      remindQuoteDays: Number(document.getElementById('set-remind-quote-days').value) || 0,
      remindUnsent: document.getElementById('set-remind-unsent').checked,
      remindUnpaid: document.getElementById('set-remind-unpaid').checked,
      logo: logoValue
    };

    DB.saveSettings(updated);
    this._tempLogo = null;
    App.showToast('Impostazioni salvate con successo!', 'success');
  },

  exportBackup() {
    if (!App.requirePro('Il backup dei dati')) return;
    const json = DB.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickcraft_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.showToast('Backup scaricato correttamente', 'success');
  },

  importBackup(event) {
    if (!App.requirePro('Il ripristino dei dati')) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = DB.importBackup(e.target.result);
      if (result && result.ok) {
        App.showToast('Backup ripristinato con successo!', 'success');
        this.render();
        App.renderDashboard();
      } else {
        App.showToast(result && result.message ? result.message : 'File di backup non valido', 'error');
      }
    };
    reader.readAsText(file);
  },

  resetDemo() {
    if (confirm('Sei sicuro di voler ricaricare i dati di esempio? I dati attuali verranno sostituiti.')) {
      DB.resetDemo();
      this.render();
      App.renderDashboard();
      App.showToast('Dati demo ricaricati', 'info');
    }
  },

  // ============ PIANO & REFERRAL ============

  renderPlanCard() {
    const isFreeMode = DB.isFreeMode();
    const isPro = DB.isPro();
    const trialDays = DB.trialDaysLeft();
    const proDays = DB.proDaysLeft();

    if (isFreeMode) {
      return `
        <div class="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <i data-lucide="gift" class="w-5 h-5"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">Attualmente gratuita 🎉</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tutte le funzioni sono sbloccate in questa fase di lancio. La monetizzazione verrà attivata in seguito.</p>
          </div>
        </div>
      `;
    }

    if (isPro) {
      const label = proDays > 0
        ? `Piano Pro attivo · ${proDays} giorni rimanenti`
        : `Prova Pro gratuita · ${Math.ceil(trialDays / 30)} mesi rimanenti`;
      return `
        <div class="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0">
            <i data-lucide="crown" class="w-5 h-5"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">${label}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tutte le funzionalità Pro sono attive.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center shrink-0">
            <i data-lucide="user" class="w-5 h-5"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">Piano Gratis</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Fino a 3 clienti e 3 preventivi.</p>
          </div>
        </div>
        <button onclick="App.goToLanding()" class="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold rounded-xl shadow-sm transition active:scale-95">
          Passa a Pro · 7,99 €/mese
        </button>
      </div>
    `;
  },

  getReferralShareText() {
    const code = DB.getPlan().referralCode;
    return `Ti consiglio Stima, l'app per creare preventivi e gestire i clienti in pochi minuti! Iscriviti con il mio codice *${code}* e ricevi 2 mesi di Pro gratis.`;
  },

  getReferralWaUrl() {
    const text = this.getReferralShareText() + '\n' + 'landing.html';
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  },

  shareReferral(mode) {
    const text = this.getReferralShareText();
    const url = 'landing.html';

    if (mode === 'copy') {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        App.showToast('Codice e messaggio copiati negli appunti!', 'success');
      }).catch(() => {
        App.showToast('Impossibile copiare', 'error');
      });
    } else if (mode === 'whatsapp') {
      window.location.href = this.getReferralWaUrl();
    }
  },

  // Apre il popup di condivisione
  openShareModal() {
    const modal = document.getElementById('share-modal');
    if (!modal) return;
    const codeEl = document.getElementById('share-referral-code');
    if (codeEl) codeEl.textContent = DB.getPlan().referralCode;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  },

  shareWhatsApp() {
    window.open(this.getReferralWaUrl(), '_blank');
  },

  copyShareCode() {
    navigator.clipboard.writeText(DB.getPlan().referralCode).then(() => {
      App.showToast('Codice copiato!', 'success');
    }).catch(() => App.showToast('Impossibile copiare', 'error'));
  },

  copyShareMessage() {
    const text = this.getReferralShareText() + '\n' + 'landing.html';
    navigator.clipboard.writeText(text).then(() => {
      App.showToast('Messaggio e codice copiati!', 'success');
    }).catch(() => App.showToast('Impossibile copiare', 'error'));
  },

  redeemReferral() {
    const input = document.getElementById('redeem-code-input');
    if (!input) return;
    const code = input.value.trim();
    if (!code) {
      App.showToast('Inserisci un codice invito', 'error');
      return;
    }
    const result = DB.redeemReferralCode(code);
    if (result.ok) {
      input.value = '';
      this.render();
      App.renderDashboard();
    }
    App.showToast(result.message, result.ok ? 'success' : 'error');
  }
};
