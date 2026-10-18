/**
 * Stima - Modulo Listino Voci & Materiali (Pricebook)
 * Permette di salvare prestazioni, tariffe di manodopera e materiali
 * ricorrenti per inserirli nei preventivi con 1 click.
 */

import { DB } from './db.js';
import { App } from './app.js';
import { escapeHtml } from './config.js';

export const PricebookModule = {
  searchQuery: '',
  categoryFilter: 'all',

  render() {
    const container = document.getElementById('pricebook-view');
    if (!container) return;

    const items = DB.getPricebook();
    const categories = ['all', ...new Set(items.map(i => i.category || 'Generale'))];

    const filtered = items.filter(item => {
      if (this.categoryFilter !== 'all' && (item.category || 'Generale') !== this.categoryFilter) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return (
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
        );
      }
      return true;
    });

    container.innerHTML = `
      <!-- Intestazione Listino -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Catalogo Prezzi Rapido</span>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">Listino Voci & Materiali</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Salva qui le tue tariffe orarie, interventi e materiali ricorrenti per aggiungerli ai preventivi in 1 secondo.</p>
        </div>
        <button onclick="PricebookModule.openModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition active:scale-95">
          <i data-lucide="plus-circle" class="w-5 h-5"></i>
          <span>Nuova Voce Listino</span>
        </button>
      </div>

      <!-- Barra Ricerca e Filtri Categoria -->
      <div class="flex flex-col md:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Cerca voce, tariffa o materiale..." 
            value="${this.searchQuery}"
            oninput="PricebookModule.handleSearch(this.value)"
            class="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          ${categories.map(cat => `
            <button 
              onclick="PricebookModule.setCategory('${cat}')"
              class="px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${this.categoryFilter === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}"
            >
              ${cat === 'all' ? `Tutte (${items.length})` : cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Tabella Voci Listino -->
      ${filtered.length === 0 ? `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-8 shadow-sm">
          <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <i data-lucide="book-open" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nessuna voce nel listino</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">Salva i tuoi prezzi standard per velocizzare la creazione dei preventivi.</p>
        </div>
      ` : `
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/80 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th class="py-3 px-4">Categoria</th>
                  <th class="py-3 px-4">Descrizione Prestazione / Materiale</th>
                  <th class="py-3 px-4 text-right">Prezzo Base</th>
                  <th class="py-3 px-4 text-center">IVA Default</th>
                  <th class="py-3 px-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs sm:text-sm">
                ${filtered.map(item => `
                  <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition">
                    <td class="py-3.5 px-4 whitespace-nowrap">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        ${escapeHtml(item.category || 'Generale')}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      ${escapeHtml(item.description)}
                    </td>
                    <td class="py-3.5 px-4 text-right font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                      € ${(Number(item.price) || 0).toFixed(2)}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">${item.vat !== undefined ? item.vat : 22}%</span>
                    </td>
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1">
                        <button onclick="PricebookModule.openModal('${item.id}')" title="Modifica voce" class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                          <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="PricebookModule.deleteItem('${item.id}')" title="Elimina" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    `;

    if (window.lucide) lucide.createIcons();
  },

  handleSearch(q) {
    this.searchQuery = q;
    this.render();
  },

  setCategory(cat) {
    this.categoryFilter = cat;
    this.render();
  },

  openModal(itemId = null) {
    if (!App.requirePro('Il listino voci e materiali')) return;
    const modal = document.getElementById('pricebook-modal');
    if (!modal) return;

    const item = itemId ? DB.getPricebookItemById(itemId) : {
      id: '',
      category: 'Manodopera',
      description: '',
      price: 50,
      vat: 22
    };

    document.getElementById('pb-modal-title').textContent = itemId ? 'Modifica Voce Listino' : 'Nuova Voce Listino';
    document.getElementById('pb-id').value = item.id || '';
    document.getElementById('pb-description').value = item.description || '';
    document.getElementById('pb-price').value = item.price || 0;
    document.getElementById('pb-vat').value = item.vat !== undefined ? item.vat : 22;

    // Popola il menu a discesa delle categorie (dalle voci esistenti)
    const selectedCat = (item.category || 'Manodopera').trim();
    const existing = [...new Set(DB.getPricebook().map(i => (i.category || 'Generale').trim()).filter(Boolean))];
    const allCats = [...new Set([...existing, selectedCat].filter(Boolean))];
    const select = document.getElementById('pb-category-select');
    select.innerHTML = `<option value="">Seleziona categoria...</option>` +
      allCats.map(c => `<option value="${escapeHtml(c)}" ${c === selectedCat ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('') +
      `<option value="__new__">➕ Nuova categoria...</option>`;

    const newInput = document.getElementById('pb-category-new');
    newInput.value = '';
    newInput.classList.add('hidden');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  // Mostra/nasconde il campo per la nuova categoria
  toggleNewCategory() {
    const select = document.getElementById('pb-category-select');
    const newInput = document.getElementById('pb-category-new');
    if (select.value === '__new__') {
      newInput.classList.remove('hidden');
      newInput.focus();
    } else {
      newInput.classList.add('hidden');
    }
  },

  closeModal() {
    const modal = document.getElementById('pricebook-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  saveFromModal(event) {
    event.preventDefault();
    const id = document.getElementById('pb-id').value;
    const description = document.getElementById('pb-description').value.trim();
    if (!description) {
      App.showToast('Inserisci una descrizione per la voce', 'error');
      return;
    }

    // Categoria: dal menu a discesa oppure dalla nuova categoria inserita
    const select = document.getElementById('pb-category-select');
    let category = '';
    if (select.value === '__new__') {
      category = document.getElementById('pb-category-new').value.trim();
    } else {
      category = select.value.trim();
    }
    if (!category) {
      App.showToast('Seleziona o inserisci una categoria', 'error');
      return;
    }

    const item = {
      id: id || undefined,
      category: category || 'Generale',
      description,
      price: Number(document.getElementById('pb-price').value) || 0,
      vat: Number(document.getElementById('pb-vat').value)
    };

    DB.savePricebookItem(item);
    this.closeModal();
    this.render();
    App.showToast('Voce salvata nel listino!', 'success');
  },

  deleteItem(id) {
    if (confirm('Vuoi rimuovere questa voce dal listino?')) {
      DB.deletePricebookItem(id);
      this.render();
      App.showToast('Voce rimossa dal listino', 'info');
    }
  }
};
