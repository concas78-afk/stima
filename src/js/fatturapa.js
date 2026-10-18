/**
 * Stima - Generatore XML FatturaPA (Fatturazione Elettronica SDI)
 * Produce un file XML nel tracciato FatturaPA (FPR12) a partire da un preventivo.
 *
 * ⚠️ NOTA: questo generatore produce un XML "best effort" da scaricare/anteprima.
 * Per l'invio reale allo SDI serve collegare un provider API accreditato (vedi
 * INTEGRAZIONE_PAGAMENTI.md), che effettua la validazione e la firma digitale.
 */

import { DB } from './db.js';
import { App } from './app.js';

export const FatturaPAModule = {
  // Codici RegimeFiscale
  regimeCode(taxRegime) {
    return taxRegime === 'forfettario' ? 'RF19' : 'RF01';
  },

  // Natura IVA di una riga: N2.2 per forfettari, N4 per esenti, null se IVA ordinaria
  naturaForItem(vat, taxRegime) {
    const rate = Number(vat) || 0;
    if (rate === 0) {
      return taxRegime === 'forfettario' ? 'N2.2' : 'N4';
    }
    return null;
  },

  esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  // Numero fattura progressivo in formato "N/AAAA"
  getInvoiceNumber(quote) {
    if (quote.invoiceNumber) return quote.invoiceNumber;
    const year = new Date().getFullYear();
    const invoices = DB.getQuotes().filter(q => q.invoiceNumber && q.invoiceNumber.includes('/' + year));
    return `${invoices.length + 1}/${year}`;
  },

  // Determina se un codice fiscale è una P.IVA (11 cifre) o un CF (16 caratteri)
  isVatNumber(taxId) {
    const clean = (taxId || '').replace(/^IT/i, '').trim();
    return /^\d{11}$/.test(clean);
  },

  // Genera il blocco fiscale del cessionario (IdFiscaleIVA per P.IVA, CodiceFiscale per CF)
  renderCessionarioFiscale(client) {
    const taxId = (client.taxId || '').replace(/^IT/i, '').trim();
    if (!taxId) return '';
    if (this.isVatNumber(taxId)) {
      return `<IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${this.esc(taxId)}</IdCodice>
        </IdFiscaleIVA>`;
    }
    return `<CodiceFiscale>${this.esc(taxId)}</CodiceFiscale>`;
  },

  // Determina il CodiceDestinatario (7 char) e PEC per il cliente
  resolveRecipient(client) {
    let code = (client.recipientCode || '').trim().toUpperCase();
    const pec = (client.pec || '').trim();
    const isPA = (client.customerType === 'pa');
    const isEstero = (client.nation || 'IT') !== 'IT';

    if (isPA) {
      // Per la PA il codice è l'IPA (6 char), qui lasciamo che il provider lo gestisca
      code = code || '0000000';
    } else if (isEstero) {
      code = 'XXXXXXX';
    } else if (!code) {
      code = pec ? '0000000' : '0000000';
    }
    return { code, pec };
  },

  // Costruisce l'XML completo
  generate(quoteId) {
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return { ok: false, message: 'Preventivo non trovato' };

    const settings = DB.getSettings();
    const client = DB.getClientById(quote.clientId) || {};
    const totals = DB.calculateQuoteTotals(quote, settings.taxRegime === 'forfettario');
    const taxRegime = settings.taxRegime || 'ordinario';
    const regime = this.regimeCode(taxRegime);

    const invoiceNumber = this.getInvoiceNumber(quote);
    const today = new Date().toISOString().split('T')[0];
    const { code: codiceDest, pec } = this.resolveRecipient(client);
    const formato = client.customerType === 'pa' ? 'FPA12' : 'FPR12';

    // Identificativi emittente
    const vatClean = (settings.vatNumber || '').replace(/^IT/i, '');
    const taxIdClean = (settings.taxId || '').replace(/^IT/i, '');
    const isCompany = /(srl|s\.r\.l|spa|snc|sas|società|ditta)/i.test(settings.businessName || '');

    // Righe dettaglio
    let dettaglioLinee = '';
    let riepilogo = '';
    let imponibileTot = 0;
    let impostaTot = 0;

    // Riepilogo per aliquota (mappa)
    const riepMap = {};

    (quote.items || []).forEach((item, i) => {
      const qty = Math.max(0, Number(item.quantity) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      const itemDiscount = Math.min(Math.max(0, Number(item.discount) || 0), qty * price);
      const lineTotal = Math.max(0, (qty * price) - itemDiscount);
      // Regime forfettario = IVA 0 + natura N2.2; altrimenti IVA della riga
      const vat = taxRegime === 'forfettario' ? 0 : (Number(item.vat) || 0);
      const natura = this.naturaForItem(vat, taxRegime);
      const imposta = vat > 0 ? (lineTotal * vat) / 100 : 0;

      imponibileTot += lineTotal;
      impostaTot += imposta;

      dettaglioLinee += `
        <DettaglioLinee>
          <NumeroLinea>${i + 1}</NumeroLinea>
          <Descrizione>${this.esc(item.description || 'Prestazione')}</Descrizione>
          <Quantita>${qty.toFixed(2)}</Quantita>
          <PrezzoUnitario>${price.toFixed(2)}</PrezzoUnitario>
          <PrezzoTotale>${lineTotal.toFixed(2)}</PrezzoTotale>
          <AliquotaIVA>${vat.toFixed(2)}</AliquotaIVA>${natura ? `\n          <Natura>${natura}</Natura>` : ''}
        </DettaglioLinee>`;

      const key = `${vat.toFixed(2)}_${natura || ''}`;
      if (!riepMap[key]) {
        riepMap[key] = { vat, natura, imponibile: 0, imposta: 0 };
      }
      riepMap[key].imponibile += lineTotal;
      riepMap[key].imposta += imposta;
    });

    Object.values(riepMap).forEach(r => {
      riepilogo += `
        <DatiRiepilogo>
          <AliquotaIVA>${r.vat.toFixed(2)}</AliquotaIVA>${r.natura ? `\n          <Natura>${r.natura}</Natura>` : ''}
          <ImponibileImporto>${r.imponibile.toFixed(2)}</ImponibileImporto>
          <Imposta>${r.imposta.toFixed(2)}</Imposta>
          <EsigibilitaIVA>I</EsigibilitaIVA>
        </DatiRiepilogo>`;
    });

    // Bollo virtuale per forfettari con imponibile > 77,47
    const bollo = (taxRegime === 'forfettario' && totals.grandTotal > 77.47) ? 2.00 : 0;

    // Ritenuta d'acconto
    const ritenutaPct = Number(settings.withholdingTax) || 0;
    const importoRitenuta = ritenutaPct > 0 ? (totals.grandTotal * ritenutaPct) / 100 : 0;
    const nettoPagamento = totals.grandTotal - importoRitenuta + bollo;

    // Causale forfettario
    const causale = taxRegime === 'forfettario'
      ? "Operazione senza applicazione dell'IVA ai sensi dell'art. 1, commi 54-89, L. 190/2014"
      : '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${this.esc(vatClean || taxIdClean)}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${this.esc(invoiceNumber.split('/')[0].padStart(5, '0'))}</ProgressivoInvio>
      <FormatoTrasmissione>${formato}</FormatoTrasmissione>
      <CodiceDestinatario>${this.esc(codiceDest)}</CodiceDestinatario>${pec && codiceDest === '0000000' ? `
      <PECDestinatario>${this.esc(pec)}</PECDestinatario>` : ''}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${this.esc(vatClean)}</IdCodice>
        </IdFiscaleIVA>${taxIdClean && taxIdClean !== vatClean ? `
        <CodiceFiscale>${this.esc(taxIdClean)}</CodiceFiscale>` : ''}
        <Anagrafica>${isCompany
          ? `<Denominazione>${this.esc(settings.businessName)}</Denominazione>`
          : `<Nome>${this.esc(settings.ownerName || settings.businessName)}</Nome>`}
        </Anagrafica>
        <RegimeFiscale>${regime}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${this.esc(settings.address || '')}</Indirizzo>
        <CAP>${this.esc(settings.cap || '')}</CAP>
        <Comune>${this.esc(settings.city || '')}</Comune>
        <Provincia>${this.esc(settings.province || '')}</Provincia>
        <Nazione>${this.esc(settings.nation || 'IT')}</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${this.renderCessionarioFiscale(client)}
        <Anagrafica>
          <Denominazione>${this.esc(client.name || '')}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${this.esc(client.address || '')}</Indirizzo>
        <CAP>${this.esc(client.cap || '')}</CAP>
        <Comune>${this.esc(client.city || '')}</Comune>
        <Provincia>${this.esc(client.province || '')}</Provincia>
        <Nazione>${this.esc(client.nation || 'IT')}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${today}</Data>
        <Numero>${this.esc(invoiceNumber)}</Numero>${bollo > 0 ? `
        <DatiBollo>
          <BolloVirtuale>SI</BolloVirtuale>
          <ImportoBollo>${bollo.toFixed(2)}</ImportoBollo>
        </DatiBollo>` : ''}
        <ImportoTotaleDocumento>${(totals.grandTotal + bollo).toFixed(2)}</ImportoTotaleDocumento>${causale ? `
        <Causale>${this.esc(causale)}</Causale>` : ''}
      </DatiGeneraliDocumento>${ritenutaPct > 0 ? `
      <DatiRitenuta>
        <TipoRitenuta>RT01</TipoRitenuta>
        <ImportoRitenuta>${importoRitenuta.toFixed(2)}</ImportoRitenuta>
        <AliquotaRitenuta>${ritenutaPct.toFixed(2)}</AliquotaRitenuta>
        <CausalePagamento>A</CausalePagamento>
      </DatiRitenuta>` : ''}
    </DatiGenerali>
    <DatiBeniServizi>${dettaglioLinee}${riepilogo}
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>MP05</ModalitaPagamento>
        <ImportoPagamento>${nettoPagamento.toFixed(2)}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</FatturaElettronica>`;

    return { ok: true, xml, invoiceNumber, fileName: `IT${vatClean}_${invoiceNumber.split('/')[0]}.xml` };
  },

  // Scarica il file XML e registra il numero fattura sul preventivo
  // Gate di onboarding/consenso per la fatturazione elettronica
  requireFeConsent() {
    if (localStorage.getItem('quickcraft_fe_consent') === 'true') return true;
    const modal = document.getElementById('fe-consent-modal');
    if (!modal) return true;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
    return false;
  },

  acceptFeConsent() {
    const chk = document.getElementById('fe-consent-check');
    if (!chk || !chk.checked) {
      App.showToast('Devi spuntare la dichiarazione per continuare.', 'error');
      return;
    }
    localStorage.setItem('quickcraft_fe_consent', 'true');
    const modal = document.getElementById('fe-consent-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    App.showToast('Consenso registrato. Ora puoi generare le fatture elettroniche.', 'success');
  },

  closeFeConsent() {
    const modal = document.getElementById('fe-consent-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  download(quoteId) {
    if (!App.requirePro('La fatturazione elettronica')) return;
    if (!this.requireFeConsent()) return;
    const result = this.generate(quoteId);
    if (!result.ok) {
      App.showToast(result.message, 'error');
      return;
    }

    // Salva il numero fattura sul preventivo
    const quote = DB.getQuoteById(quoteId);
    if (quote && !quote.invoiceNumber) {
      quote.invoiceNumber = result.invoiceNumber;
      quote.invoicedAt = new Date().toISOString();
      DB.saveQuote(quote);
    }

    const blob = new Blob([result.xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    App.showToast(`XML FatturaPA generato: ${result.invoiceNumber}`, 'success');
  },

  // Invia una copia della fattura XML al commercialista (configurato nelle Impostazioni)
  sendToAccountant(quoteId) {
    if (!App.requirePro('La fatturazione elettronica')) return;
    if (!this.requireFeConsent()) return;

    const settings = DB.getSettings();
    const accountantEmail = (settings.accountantEmail || '').trim();
    if (!accountantEmail) {
      App.showToast("Configura prima l'email del commercialista nelle Impostazioni.", 'error');
      return;
    }

    const result = this.generate(quoteId);
    if (!result.ok) {
      App.showToast(result.message, 'error');
      return;
    }

    // Salva il numero fattura e segna l'invio al commercialista
    const quote = DB.getQuoteById(quoteId);
    if (quote) {
      if (!quote.invoiceNumber) {
        quote.invoiceNumber = result.invoiceNumber;
        quote.invoicedAt = new Date().toISOString();
      }
      quote.sentToAccountantAt = new Date().toISOString();
      DB.saveQuote(quote);
    }

    // Scarica il file XML (da allegare alla email)
    const blob = new Blob([result.xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Prepara la bozza email per il commercialista
    const client = DB.getClientById(quote.clientId) || {};
    const subject = `Fattura XML ${result.invoiceNumber} - ${client.name || 'cliente'}`;
    const body = [
      'Gentile Commercialista,',
      '',
      `in allegato il file XML della fattura elettronica n. ${result.invoiceNumber}` +
        (client.name ? ` relativa a ${client.name}` : '') + '.',
      '',
      'Cordiali saluti,',
      settings.ownerName || settings.businessName || ''
    ].filter(Boolean).join('\n');

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(accountantEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const mailtoUrl = `mailto:${accountantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (accountantEmail.toLowerCase().includes('@gmail.com')) {
      window.open(gmailUrl, '_blank');
    } else {
      window.location.href = mailtoUrl;
    }

    App.showToast('Allega il file XML appena scaricato alla email per il commercialista.', 'success');
  }
};
