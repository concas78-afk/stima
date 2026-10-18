/**
 * Stima - Modulo Generazione PDF / Anteprima di Stampa A4
 * Include: Colonna IVA, calcolo Acconto/Saldo, Foto Sopralluogo e Firma Digitale.
 */

import { DB } from './db.js';
import { QuotesModule } from './quotes.js';
import { FatturaPAModule } from './fatturapa.js';
import { escapeHtml } from './config.js';

export const PdfModule = {
  currentQuoteId: null,

  preview(quoteId) {
    this.currentQuoteId = quoteId;
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;

    const client = DB.getClientById(quote.clientId) || { name: 'Cliente', company: '', address: '', taxId: '' };
    const settings = DB.getSettings();
    const totals = DB.calculateQuoteTotals(quote, settings.taxRegime === 'forfettario');
    const photos = quote.photos || [];

    const modal = document.getElementById('pdf-modal');
    const container = document.getElementById('printable-quote-area');
    if (!modal || !container) return;

    container.innerHTML = `
      <!-- Intestazione Documento -->
      <div class="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-6 gap-4">
        <div class="flex items-start gap-3">
          ${settings.logo ? `
            <img src="${settings.logo}" class="w-16 h-16 object-contain shrink-0" alt="Logo" />
          ` : ''}
          <div>
            <h1 class="text-2xl font-black text-gray-900 uppercase tracking-tight">${escapeHtml(settings.businessName || 'Ditta / Professionista')}</h1>
            <p class="text-sm font-semibold text-gray-700">${escapeHtml(settings.ownerName || '')}</p>
            <div class="text-xs text-gray-600 mt-1 space-y-0.5">
              ${settings.address ? `<p>${escapeHtml(settings.address)}</p>` : ''}
              ${settings.vatNumber ? `<p>P.IVA: ${settings.vatNumber}</p>` : ''}
              ${settings.taxId ? `<p>C.F.: ${settings.taxId}</p>` : ''}
              <p>${settings.phone ? `Tel: ${settings.phone}` : ''} ${settings.email ? `• Email: ${settings.email}` : ''}</p>
            </div>
          </div>
        </div>

        <div class="text-right">
          <div class="inline-block bg-gray-900 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest mb-2">
            PREVENTIVO
          </div>
          <p class="text-lg font-bold text-gray-900">${quote.number}</p>
          <div class="text-xs text-gray-600 mt-1">
            <p>Data: <span class="font-medium text-gray-900">${quote.date}</span></p>
            ${quote.dueDate ? `<p>Validità: <span class="font-medium text-gray-900">${quote.dueDate}</span></p>` : ''}
          </div>
        </div>
      </div>

      <!-- Dati Destinatario (Cliente) -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Destinatario:</p>
        <p class="text-base font-bold text-gray-900">${escapeHtml(client.name)}</p>
        ${client.company ? `<p class="text-xs font-medium text-gray-700">${client.company}</p>` : ''}
        ${client.address ? `<p class="text-xs text-gray-600 mt-0.5">${client.address}</p>` : ''}
        ${client.taxId ? `<p class="text-xs text-gray-600">P.IVA / C.F.: ${client.taxId}</p>` : ''}
      </div>

      <!-- Tabella Dettagli Lavori / Servizi -->
      <table class="w-full text-left border-collapse mb-6">
        <thead>
          <tr class="border-b-2 border-gray-300 text-xs font-bold text-gray-700 uppercase">
            <th class="py-2.5 pr-4">Descrizione Prestazione / Materiale</th>
            <th class="py-2.5 px-2 text-center w-14">Qtà</th>
            <th class="py-2.5 px-2 text-right w-24">Prezzo</th>
            <th class="py-2.5 px-2 text-center w-16">IVA</th>
            <th class="py-2.5 pl-2 text-right w-24">Importo</th>
          </tr>
        </thead>
        <tbody class="text-xs divide-y divide-gray-100">
          ${(quote.items || []).map(item => {
            const rowTot = (Number(item.quantity) || 0) * (Number(item.price) || 0);
            const itemDiscount = Math.min(Number(item.discount) || 0, rowTot);
            const lineTot = Math.max(0, rowTot - itemDiscount);
            const vatRate = item.vat !== undefined ? item.vat : 22;
            return `
              <tr>
                <td class="py-3 pr-4 font-medium text-gray-900">
                  ${escapeHtml(item.description || '-')}
                  ${itemDiscount > 0 ? `<span class="block text-[10px] text-emerald-700 font-medium mt-0.5">Sconto voce: - € ${itemDiscount.toFixed(2)}</span>` : ''}
                </td>
                <td class="py-3 px-2 text-center text-gray-700">${item.quantity || 1}</td>
                <td class="py-3 px-2 text-right text-gray-700">€ ${(Number(item.price) || 0).toFixed(2)}</td>
                <td class="py-3 px-2 text-center text-gray-700 font-medium">${vatRate}%</td>
                <td class="py-3 pl-2 text-right font-semibold text-gray-900">€ ${lineTot.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Riepilogo Totali & Piano Acconto/Saldo -->
      <div class="flex justify-end mb-8">
        <div class="w-80 space-y-2 text-xs">
          <div class="flex justify-between text-gray-600">
            <span>Imponibile:</span>
            <span class="font-medium text-gray-900">€ ${totals.subtotal.toFixed(2)}</span>
          </div>

          ${totals.itemsDiscountTotal > 0 ? `
            <div class="flex justify-between text-emerald-700 font-medium">
              <span>Di cui sconti sulle voci:</span>
              <span>- € ${totals.itemsDiscountTotal.toFixed(2)}</span>
            </div>
          ` : ''}

          ${totals.discount > 0 ? `
            <div class="flex justify-between text-emerald-700 font-medium">
              <span>Sconto complessivo:</span>
              <span>- € ${totals.discount.toFixed(2)}</span>
            </div>
          ` : ''}

          ${totals.taxTotal > 0 ? `
            <div class="flex justify-between text-gray-600">
              <span>Totale IVA:</span>
              <span class="font-medium text-gray-900">€ ${totals.taxTotal.toFixed(2)}</span>
            </div>
          ` : (settings.taxRegime === 'forfettario' ? `
            <div class="text-[10px] text-gray-500 italic border-t border-b border-gray-200 py-1 my-1">
              Operazione in regime forfettario. Non soggetta ad IVA ai sensi dell'art. 1, commi 54-89, L. 190/2014.
            </div>
          ` : '')}

          <div class="flex justify-between text-base font-black text-gray-900 border-t-2 border-gray-900 pt-2">
            <span>TOTALE DOVUTO:</span>
            <span>€ ${totals.grandTotal.toFixed(2)}</span>
          </div>

          ${totals.depositAmount > 0 ? `
            <div class="mt-2 pt-2 border-t border-dashed border-gray-300 bg-gray-50 p-2.5 rounded-lg space-y-1">
              <div class="flex justify-between font-bold text-gray-900">
                <span>Acconto alla conferma${QuotesModule.formatDepositPct(totals)}:</span>
                <span>€ ${totals.depositAmount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Saldo a fine lavori:</span>
                <span class="font-semibold">€ ${totals.remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Foto Sopralluogo / Allegati Tecnici -->
      ${photos.length > 0 ? `
        <div class="mb-8 pt-4 border-t border-gray-200">
          <p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Documentazione Fotografica Sopralluogo / Lavori:</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${photos.map((p, i) => `
              <div class="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-1">
                <img src="${p.dataUrl}" class="w-full h-28 object-cover rounded" alt="Foto ${i+1}" />
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Note, Coordinate e Firma Digitale / Cartacea -->
      <div class="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200 text-xs">
        <div>
          ${settings.iban ? `
            <div class="mb-3">
              <p class="font-bold text-gray-800">Coordinate per il pagamento:</p>
              <p class="text-gray-600 font-mono text-[11px] mt-0.5">IBAN: ${settings.iban}</p>
              ${settings.paymentLink ? `
                <p class="text-gray-600 text-[11px] mt-1">${settings.paymentLinkLabel || 'Pagamento online'}: <span class="text-blue-700 break-all">${QuotesModule.buildPaymentLink(quote).link}</span></p>
              ` : ''}
            </div>
          ` : (settings.paymentLink ? `
            <div class="mb-3">
              <p class="font-bold text-gray-800">Pagamento online:</p>
              <p class="text-blue-700 text-[11px] mt-0.5 break-all">${settings.paymentLinkLabel || 'Link'}: ${QuotesModule.buildPaymentLink(quote).link}</p>
            </div>
          ` : '')}

          ${quote.notes ? `
            <div>
              <p class="font-bold text-gray-800">Note & Condizioni:</p>
              <p class="text-gray-600 text-[11px] mt-0.5 whitespace-pre-line">${escapeHtml(quote.notes)}</p>
            </div>
          ` : ''}
        </div>

        <div class="flex flex-col justify-end text-center">
          <div class="border-b border-gray-400 pb-1 mb-1 mx-6 h-16 flex items-center justify-center">
            ${quote.signatureData ? `
              <img src="${quote.signatureData}" class="max-h-14 object-contain" alt="Firma Cliente" />
            ` : ''}
          </div>
          <p class="text-[10px] text-gray-500 font-medium">
            ${quote.signatureData ? 'Firmato digitalmente per accettazione dal Committente' : 'Firma per accettazione del Committente'}
          </p>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  print() {
    window.print();
  },

   openSignatureFromPreview() {
    if (this.currentQuoteId) {
      this.closeModal();
      QuotesModule.openSignatureModal(this.currentQuoteId);
    }
  },

  sendEmail() {
    if (this.currentQuoteId) {
      QuotesModule.openEmailModal(this.currentQuoteId);
    }
  },

  downloadFatturaPA() {
    if (this.currentQuoteId) {
      FatturaPAModule.download(this.currentQuoteId);
    }
  },

  sendToAccountant() {
    if (this.currentQuoteId) {
      FatturaPAModule.sendToAccountant(this.currentQuoteId);
    }
  },

  closeModal() {
    const modal = document.getElementById('pdf-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
};
