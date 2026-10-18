/**
 * Stima - Entry point Vite
 * Importa tutti i moduli nell'ordine corretto e li espone come globali
 * (necessario per gli handler onclick inline presenti nell'HTML).
 */

import './styles/app.css';

import { APP_CONFIG, escapeHtml } from './js/config.js';
import { DB } from './js/db.js';
import { ClientsModule } from './js/clients.js';
import { ImportModule } from './js/import.js';
import { FatturaPAModule } from './js/fatturapa.js';
import { PricebookModule } from './js/pricebook.js';
import { AgendaModule } from './js/agenda.js';
import { QuotesModule } from './js/quotes.js';
import { InvoicesModule } from './js/invoices.js';
import { PdfModule } from './js/pdf.js';
import { CampaignsModule } from './js/campaigns.js';
import { SettingsModule } from './js/settings.js';
import { Supabase } from './js/supabase.js';
import { Sync } from './js/sync.js';
import { Auth } from './js/auth.js';
import { App } from './js/app.js';

// Espone i moduli come globali (per retro-compatibilità con gli onclick inline)
Object.assign(window, {
  APP_CONFIG,
  escapeHtml,
  DB,
  ClientsModule,
  ImportModule,
  FatturaPAModule,
  PricebookModule,
  AgendaModule,
  QuotesModule,
  InvoicesModule,
  PdfModule,
  CampaignsModule,
  SettingsModule,
  Supabase,
  Sync,
  Auth,
  App
});

// Inizializza l'app quando il DOM è pronto (già gestito da App.init via listener)
export { App, DB, ClientsModule, QuotesModule, PdfModule, SettingsModule };
