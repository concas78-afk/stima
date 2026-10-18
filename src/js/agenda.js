/**
 * Stima - Modulo Agenda Appuntamenti & Sopralluoghi
 * Viste: Giorno (timeline grafica), Settimana, Mese, Elenco.
 */

import { DB } from './db.js';
import { App } from './app.js';
import { ClientsModule } from './clients.js';
import { escapeHtml } from './config.js';

export const AgendaModule = {
  filterStatus: 'all',
  viewMode: localStorage.getItem('quickcraft_agenda_view') || 'day', // 'day' | 'week' | 'month' | 'list'
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(), // 0-11
  selectedDate: null, // 'YYYY-MM-DD'
  _pendingQuoteId: null, // preventivo selezionato da allegare
  _recognition: null,   // istanza SpeechRecognition

  // ============ HELPER DATE ============
  toDateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },

  todayStr() {
    const d = new Date();
    return this.toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
  },

  parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  },

  formatDateIt(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    const mesi = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
    const giorni = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
    return `${giorni[date.getDay()]} ${date.getDate()} ${mesi[date.getMonth()]}`;
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    const mesi = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
    return `${date.getDate()} ${mesi[date.getMonth()]}`;
  },

  // Ora di fine in base a ora di inizio + durata (minuti)
  endTime(time, durationMin) {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + (Number(durationMin) || 60);
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  },

  // Formatta la durata in forma leggibile
  formatDuration(min) {
    min = Number(min) || 0;
    if (!min) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}min`;
  },

  monthLabel() {
    const mesi = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    return `${mesi[this.currentMonth]} ${this.currentYear}`;
  },

  // Sposta una data di N giorni (in giorni, positivo/negativo)
  shiftDate(dateStr, days) {
    const d = this.parseDate(dateStr);
    d.setDate(d.getDate() + days);
    return this.toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
  },

  // 7 giorni della settimana (da lunedì) che contiene dateStr
  getWeekDays(dateStr) {
    const d = this.parseDate(dateStr);
    const dayOfWeek = (d.getDay() + 6) % 7; // lunedì=0
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      days.push(this.toDateStr(dd.getFullYear(), dd.getMonth(), dd.getDate()));
    }
    return days;
  },

  groupByDate(appointments) {
    const map = {};
    appointments.forEach(a => {
      if (!a.date) return;
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    });
    return map;
  },

  // ============ RENDER ============
  render() {
    const container = document.getElementById('agenda-view');
    if (!container) return;
    const appointments = DB.getAppointments();
    const settings = DB.getSettings();
    if (!this.selectedDate) this.selectedDate = this.todayStr();

    const filtered = appointments.filter(a => {
      if (this.filterStatus !== 'all' && a.status !== this.filterStatus) return false;
      return true;
    });

    const counts = {
      all: appointments.length,
      Programmato: appointments.filter(a => a.status === 'Programmato').length,
      Completato: appointments.filter(a => a.status === 'Completato').length
    };

    container.innerHTML = `
      <!-- Intestazione -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pianificazione Lavori</span>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">Agenda & Sopralluoghi</h2>
        </div>
        <button onclick="AgendaModule.openModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl shadow-sm transition active:scale-95">
          <i data-lucide="calendar-plus" class="w-5 h-5"></i>
          <span>Nuovo Appuntamento</span>
        </button>
      </div>

      <!-- Selettore vista + filtri -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1 overflow-x-auto">
          <button onclick="AgendaModule.setViewMode('day')" class="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${this.viewMode === 'day' ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
            <i data-lucide="sun" class="w-4 h-4 inline mr-1"></i>Giorno
          </button>
          <button onclick="AgendaModule.setViewMode('week')" class="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${this.viewMode === 'week' ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
            <i data-lucide="columns-3" class="w-4 h-4 inline mr-1"></i>Settimana
          </button>
          <button onclick="AgendaModule.setViewMode('month')" class="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${this.viewMode === 'month' ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
            <i data-lucide="calendar-days" class="w-4 h-4 inline mr-1"></i>Mese
          </button>
          <button onclick="AgendaModule.setViewMode('list')" class="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${this.viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
            <i data-lucide="list" class="w-4 h-4 inline mr-1"></i>Elenco
          </button>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button onclick="AgendaModule.setFilter('all')" class="px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${this.filterStatus === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}">
            Tutti (${counts.all})
          </button>
          <button onclick="AgendaModule.setFilter('Programmato')" class="px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${this.filterStatus === 'Programmato' ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}">
            In Programma (${counts.Programmato})
          </button>
          <button onclick="AgendaModule.setFilter('Completato')" class="px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${this.filterStatus === 'Completato' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}">
            Completati (${counts.Completato})
          </button>
        </div>
      </div>

      ${this.renderActiveView(filtered, settings)}
    `;

    if (window.lucide) lucide.createIcons();
  },

  renderActiveView(appointments, settings) {
    switch (this.viewMode) {
      case 'week': return this.renderWeekView(appointments, settings);
      case 'month': return this.renderMonthView(appointments, settings);
      case 'list': return this.renderListView(appointments, settings);
      default: return this.renderDayView(appointments, settings);
    }
  },

  // ============ VISTA GIORNO (timeline grafica) ============
  renderDayView(appointments, settings) {
    const grouped = this.groupByDate(appointments);
    const today = this.todayStr();
    const selected = this.selectedDate;
    const dayAppts = grouped[selected] || [];

    // Ore da mostrare (07:00 - 20:00)
    const hours = [];
    for (let h = 7; h <= 20; h++) hours.push(h);

    // Suddivide gli appuntamenti per ora
    const byHour = {};
    const withoutTime = [];
    hours.forEach(h => byHour[h] = []);
    dayAppts.forEach(a => {
      const hour = a.time ? parseInt(a.time.split(':')[0], 10) : null;
      if (hour !== null && hour >= 7 && hour <= 20) {
        byHour[hour].push(a);
      } else {
        withoutTime.push(a);
      }
    });

    return `
      <!-- Navigazione giorno -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <button onclick="AgendaModule.shiftDay(-1)" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
          <div class="text-center min-w-[180px]">
            <p class="font-bold text-gray-900 dark:text-white capitalize">${escapeHtml(this.formatDateIt(selected))}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${dayAppts.length} appuntamento${dayAppts.length === 1 ? '' : 'i'}</p>
          </div>
          <button onclick="AgendaModule.shiftDay(1)" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
        </div>
        <div class="flex items-center gap-2">
          ${selected !== today ? `<button onclick="AgendaModule.goToday()" class="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg">Oggi</button>` : ''}
          <button onclick="AgendaModule.openModal(null, null, '${selected}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-lg hover:bg-amber-100 transition">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i><span>Aggiungi</span>
          </button>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm divide-y divide-gray-50 dark:divide-gray-800">
        ${hours.map(h => {
          const hourAppts = byHour[h] || [];
          return `
            <div class="flex gap-3 p-2.5 sm:p-3 ${h === new Date().getHours() && selected === today ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}">
              <div class="w-12 shrink-0 text-right text-[11px] font-bold text-gray-400 dark:text-gray-500 pt-0.5">${String(h).padStart(2, '0')}:00</div>
              <div class="flex-1 space-y-1.5">
                ${hourAppts.length === 0 ? `
                  <div class="h-8 rounded-lg border border-dashed border-gray-100 dark:border-gray-800"></div>
                ` : hourAppts.map(a => this.renderTimelineBlock(a, settings)).join('')}
              </div>
            </div>
          `;
        }).join('')}

        ${withoutTime.length > 0 ? `
          <div class="flex gap-3 p-3 bg-gray-50/60 dark:bg-gray-900/30">
            <div class="w-12 shrink-0 text-right text-[11px] font-bold text-gray-400 dark:text-gray-500 pt-0.5">--:--</div>
            <div class="flex-1 space-y-1.5">
              <p class="text-[10px] uppercase tracking-wider font-bold text-gray-400">Senza orario</p>
              ${withoutTime.map(a => this.renderTimelineBlock(a, settings)).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      ${dayAppts.length === 0 ? `
        <div class="text-center py-10 mt-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60">
          <i data-lucide="sun" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2"></i>
          <p class="text-sm text-gray-500 dark:text-gray-400">Nessun appuntamento in questo giorno.</p>
        </div>
      ` : ''}
    `;
  },

  renderTimelineBlock(a, settings) {
    const client = DB.getClientById(a.clientId) || { name: 'Cliente' };
    const statusColor = a.status === 'Completato'
      ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
      : a.status === 'Annullato'
      ? 'border-l-gray-400 bg-gray-50 dark:bg-gray-800 opacity-60'
      : 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20';

    const timeLabel = a.time ? `${a.time} – ${this.endTime(a.time, a.duration || 60)}` : '';
    const durationMin = Number(a.duration) || 60;
    const minH = Math.min(72, Math.max(30, (durationMin / 60) * 40));

    return `
      <button onclick="AgendaModule.openModal('${a.id}')" style="min-height:${minH}px" class="w-full text-left border-l-4 ${statusColor} rounded-lg p-2.5 hover:shadow-sm transition">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-gray-900 dark:text-white truncate">${escapeHtml(a.title)}</span>
          ${timeLabel ? `<span class="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">${escapeHtml(timeLabel)}</span>` : ''}
        </div>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">${escapeHtml(client.name)}${this.formatDuration(a.duration) ? ' · ' + escapeHtml(this.formatDuration(a.duration)) : ''}</p>
      </button>
    `;
  },

  // ============ VISTA SETTIMANA ============
  renderWeekView(appointments, settings) {
    const grouped = this.groupByDate(appointments);
    const today = this.todayStr();
    const weekDays = this.getWeekDays(this.selectedDate);
    const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    return `
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <button onclick="AgendaModule.shiftWeek(-1)" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
          <span class="font-bold text-gray-900 dark:text-white text-sm min-w-[130px] text-center">${this.formatDateShort(weekDays[0])} – ${this.formatDateShort(weekDays[6])}</span>
          <button onclick="AgendaModule.shiftWeek(1)" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
        </div>
        <button onclick="AgendaModule.goToday()" class="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg">Oggi</button>
      </div>

      <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
        ${weekDays.map((dateStr, i) => {
          const dayAppts = grouped[dateStr] || [];
          const isToday = dateStr === today;
          const isSelected = dateStr === this.selectedDate;
          const dayNum = this.parseDate(dateStr).getDate();

          return `
            <button onclick="AgendaModule.goDay('${dateStr}')" class="min-h-[140px] rounded-xl border p-1.5 text-left transition ${isSelected ? 'border-amber-400 ring-2 ring-amber-200 dark:ring-amber-800' : 'border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/30'} bg-white dark:bg-gray-800 flex flex-col">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">${dayNames[i]}</span>
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isToday ? 'bg-amber-600 text-white' : 'text-gray-700 dark:text-gray-300'}">${dayNum}</span>
              </div>
              <div class="space-y-1 flex-1">
                ${dayAppts.slice(0, 4).map(a => {
                  const dot = a.status === 'Completato' ? 'bg-emerald-500' : a.status === 'Annullato' ? 'bg-gray-400' : 'bg-amber-500';
                  return `
                    <div class="flex items-center gap-1 min-w-0">
                      <span class="w-1.5 h-1.5 rounded-full ${dot} shrink-0"></span>
                      <span class="text-[10px] text-gray-600 dark:text-gray-300 truncate leading-tight">${a.time ? `<b>${escapeHtml(a.time.slice(0,5))}</b> ` : ''}${escapeHtml(a.title)}</span>
                    </div>
                  `;
                }).join('')}
                ${dayAppts.length > 4 ? `<div class="text-[10px] font-semibold text-amber-600">+${dayAppts.length - 4}</div>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  },

  // ============ VISTA MESE ============
  renderMonthView(appointments, settings) {
    const grouped = this.groupByDate(appointments);
    const today = this.todayStr();
    const selected = this.selectedDate;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, date: this.toDateStr(this.currentYear, this.currentMonth, d) });
    }
    const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
          <div class="flex items-center gap-2">
            <button onclick="AgendaModule.shiftMonth(-1)" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
            <span class="font-bold text-gray-900 dark:text-white text-base min-w-[150px] text-center">${this.monthLabel()}</span>
            <button onclick="AgendaModule.shiftMonth(1)" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
          </div>
          <button onclick="AgendaModule.goToday()" class="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg">Oggi</button>
        </div>

        <div class="grid grid-cols-7">
          ${weekdays.map(w => `<div class="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700/60">${w}</div>`).join('')}

          ${cells.map(cell => {
            if (!cell) return `<div class="min-h-[76px] sm:min-h-[90px] bg-gray-50/50 dark:bg-gray-900/30 border-b border-r border-gray-50 dark:border-gray-800"></div>`;
            const dayAppts = grouped[cell.date] || [];
            const isToday = cell.date === today;
            const isSelected = cell.date === selected;
            const dots = dayAppts.slice(0, 3);

            return `
              <button onclick="AgendaModule.goDay('${cell.date}')" class="min-h-[76px] sm:min-h-[90px] p-1.5 text-left border-b border-r border-gray-50 dark:border-gray-800 transition flex flex-col ${isSelected ? 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-inset ring-amber-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}">
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${isToday ? 'bg-amber-600 text-white' : 'text-gray-700 dark:text-gray-300'}">${cell.day}</span>
                  ${dayAppts.length > 0 ? `<span class="text-[10px] font-bold text-gray-500 dark:text-gray-400">${dayAppts.length}</span>` : ''}
                </div>
                <div class="mt-1 space-y-1">
                  ${dots.map(a => {
                    const dotColor = a.status === 'Completato' ? 'bg-emerald-500' : a.status === 'Annullato' ? 'bg-gray-400' : 'bg-amber-500';
                    return `<div class="flex items-center gap-1 min-w-0">
                      <span class="w-1.5 h-1.5 rounded-full ${dotColor} shrink-0"></span>
                      <span class="text-[10px] text-gray-600 dark:text-gray-300 truncate leading-tight">${escapeHtml(a.title)}</span>
                    </div>`;
                  }).join('')}
                  ${dayAppts.length > 3 ? `<div class="text-[10px] font-semibold text-amber-600 dark:text-amber-400">+${dayAppts.length - 3} altri</div>` : ''}
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ============ VISTA ELENCO ============
  renderListView(filtered, settings) {
    if (filtered.length === 0) {
      return `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-8 shadow-sm">
          <div class="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <i data-lucide="calendar" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nessun appuntamento</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">Pianifica un sopralluogo o un intervento.</p>
        </div>
      `;
    }
    return `<div class="space-y-3">${filtered.map(apt => this.renderAppointmentCard(apt, settings)).join('')}</div>`;
  },

  renderAppointmentCard(apt, settings) {
    const client = DB.getClientById(apt.clientId) || { name: 'Cliente', phone: '', address: '' };
    const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');
    const addressToMap = apt.location || client.address || '';
    const mapsUrl = addressToMap ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressToMap)}` : '#';
    const timeLabel = apt.time ? `${apt.time} – ${this.endTime(apt.time, apt.duration || 60)}` : '';
    const durationLabel = this.formatDuration(apt.duration);
    const linkedQuote = apt.quoteId ? DB.getQuoteById(apt.quoteId) : null;

    const waText = encodeURIComponent(
      `Gentile ${client.name},\nLe ricordiamo il nostro appuntamento per *${apt.title}* fissato per il giorno *${apt.date}* alle ore *${apt.time}*` +
      (addressToMap ? ` presso ${addressToMap}` : '') + `.\n\nA presto,\n${settings.ownerName || ''} - ${settings.businessName || ''}`
    );
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}` : '#';

    const statusBadge = apt.status === 'Completato'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      : apt.status === 'Annullato'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40 flex flex-col items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
            <span class="text-xs font-bold">${apt.time || '09:00'}</span>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">${(apt.date || '').slice(5)}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadge}">${apt.status || 'Programmato'}</span>
              <span class="text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onclick="ClientsModule.openDetail('${client.id}')">${escapeHtml(client.name)}</span>
            </div>
            <h4 class="font-bold text-gray-900 dark:text-white text-base mt-1">${escapeHtml(apt.title)}</h4>
            ${timeLabel ? `<div class="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold mt-0.5"><i data-lucide="clock" class="w-3.5 h-3.5"></i><span>${escapeHtml(timeLabel)}${durationLabel ? ' (' + escapeHtml(durationLabel) + ')' : ''}</span></div>` : ''}
            ${addressToMap ? `<div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i><span>${escapeHtml(addressToMap)}</span></div>` : ''}
            ${linkedQuote ? `<div class="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 font-semibold"><i data-lucide="file-text" class="w-3.5 h-3.5"></i><span>Preventivo: ${escapeHtml(linkedQuote.number)}</span></div>` : ''}
            ${apt.notes ? `<p class="text-xs italic text-gray-500 dark:text-gray-400 mt-1.5 bg-gray-50 dark:bg-gray-700/40 px-2.5 py-1.5 rounded-lg">"${escapeHtml(apt.notes)}"</p>` : ''}
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 shrink-0">
          ${cleanPhone ? `<a href="${waUrl}" target="_blank" rel="noopener" title="Promemoria WhatsApp" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i><span>Promemoria WA</span></a>` : ''}
          ${addressToMap ? `<a href="${mapsUrl}" target="_blank" rel="noopener" title="Navigatore" class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition"><i data-lucide="navigation" class="w-4 h-4"></i></a>` : ''}
          ${apt.status !== 'Completato' ? `<button onclick="AgendaModule.markComplete('${apt.id}')" title="Completato" class="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition"><i data-lucide="check-circle-2" class="w-4 h-4"></i></button>` : ''}
          <button onclick="AgendaModule.openModal('${apt.id}')" title="Modifica" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
          <button onclick="AgendaModule.deleteAppointment('${apt.id}')" title="Elimina" class="p-2 text-gray-400 hover:text-red-600 rounded-xl transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
      </div>
    `;
  },

  // ============ AZIONI ============
  setViewMode(mode) {
    this.viewMode = mode;
    localStorage.setItem('quickcraft_agenda_view', mode);
    this.render();
  },
  setFilter(status) { this.filterStatus = status; this.render(); },
  goDay(dateStr) {
    this.selectedDate = dateStr;
    this.currentYear = this.parseDate(dateStr).getFullYear();
    this.currentMonth = this.parseDate(dateStr).getMonth();
    if (this.viewMode === 'month') this.viewMode = 'day';
    this.render();
  },
  shiftDay(days) { this.selectedDate = this.shiftDate(this.selectedDate, days); this.render(); },
  shiftWeek(weeks) { this.selectedDate = this.shiftDate(this.selectedDate, weeks * 7); this.render(); },
  shiftMonth(months) {
    this.currentMonth += months;
    if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
    else if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
    this.render();
  },
  goToday() {
    const d = new Date();
    this.currentYear = d.getFullYear();
    this.currentMonth = d.getMonth();
    this.selectedDate = this.todayStr();
    this.render();
  },
  markComplete(id) {
    const apt = DB.getAppointmentById(id);
    if (!apt) return;
    apt.status = 'Completato';
    DB.saveAppointment(apt);
    this.render();
    App.showToast('Appuntamento segnato come completato!', 'success');
  },

  // ============ MODALE ============
  openModal(aptId = null, preselectedClientId = null, preselectedDate = null) {
    if (!App.requirePro('L\'agenda appuntamenti e sopralluoghi')) return;
    const modal = document.getElementById('agenda-modal');
    if (!modal) return;
    const apt = aptId ? DB.getAppointmentById(aptId) : {
      id: '', clientId: preselectedClientId || '', title: '',
      date: preselectedDate || this.todayStr(), time: '09:30', duration: 60,
      location: '', status: 'Programmato', notes: '', quoteId: null
    };
    this._pendingQuoteId = apt.quoteId || null;

    document.getElementById('apt-modal-title').textContent = aptId ? 'Modifica Appuntamento' : 'Nuovo Appuntamento / Sopralluogo';
    document.getElementById('apt-id').value = apt.id || '';
    document.getElementById('apt-title').value = apt.title || '';
    document.getElementById('apt-date').value = apt.date || '';
    document.getElementById('apt-time').value = apt.time || '09:30';
    document.getElementById('apt-duration').value = String(apt.duration || 60);
    document.getElementById('apt-location').value = apt.location || '';
    document.getElementById('apt-status').value = apt.status || 'Programmato';
    document.getElementById('apt-notes').value = apt.notes || '';

    // Imposta il cliente selezionato nella casella di ricerca
    const selectedClient = apt.clientId ? DB.getClientById(apt.clientId) : null;
    document.getElementById('apt-client-id').value = apt.clientId || '';
    document.getElementById('apt-client-search').value = selectedClient ? selectedClient.name : '';
    document.getElementById('apt-client-list').classList.add('hidden');
    this.renderQuoteBox();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  // Filtra i clienti in base alla ricerca (e mostra "nuovo cliente")
  onClientSearch(query) {
    const list = document.getElementById('apt-client-list');
    if (!list) return;
    const q = (query || '').trim().toLowerCase();
    const clients = DB.getClients().filter(c =>
      !q || (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q)
    );

    let html = '';
    if (q) {
      html += `<button type="button" onclick="AgendaModule.pickNewClient()" class="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
        <i data-lucide="user-plus" class="w-4 h-4 shrink-0"></i>
        <span class="truncate">Nuovo cliente: ${escapeHtml(query)}</span>
      </button>`;
    }
    html += clients.slice(0, 60).map(c => `
      <button type="button" onclick="AgendaModule.pickClient('${c.id}')" class="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
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
  pickClient(id) {
    const client = DB.getClientById(id);
    if (!client) return;
    document.getElementById('apt-client-id').value = id;
    document.getElementById('apt-client-search').value = client.name || '';
    document.getElementById('apt-client-list').classList.add('hidden');
  },

  // Modalità "nuovo cliente" (il nome resta nella casella di ricerca)
  pickNewClient() {
    document.getElementById('apt-client-id').value = '';
    document.getElementById('apt-client-list').classList.add('hidden');
  },

  // Mostra il preventivo allegato (o il pulsante "Allega preventivo")
  renderQuoteBox() {
    const box = document.getElementById('apt-quote-box');
    if (!box) return;
    if (this._pendingQuoteId) {
      const quote = DB.getQuoteById(this._pendingQuoteId);
      if (quote) {
        const client = DB.getClientById(quote.clientId) || { name: '' };
        box.innerHTML = `
          <span class="flex-1 inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold truncate">
            <i data-lucide="file-text" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">${escapeHtml(quote.number)}${client.name ? ' · ' + escapeHtml(client.name) : ''}</span>
          </span>
          <button type="button" onclick="AgendaModule.removeQuote()" class="p-2 text-gray-400 hover:text-red-600 rounded-lg shrink-0" title="Rimuovi preventivo">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        `;
      } else {
        box.innerHTML = '';
      }
    } else {
      box.innerHTML = `
        <button type="button" onclick="AgendaModule.openQuotePicker()" class="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-semibold rounded-xl transition">
          <i data-lucide="paperclip" class="w-4 h-4"></i>
          <span>Allega preventivo</span>
        </button>
      `;
    }
    if (window.lucide) lucide.createIcons();
  },

  // Apre il selettore preventivi
  openQuotePicker() {
    const modal = document.getElementById('quote-picker-modal');
    const content = document.getElementById('quote-picker-content');
    if (!modal || !content) return;
    const quotes = DB.getQuotes();
    if (quotes.length === 0) {
      content.innerHTML = `<p class="text-xs text-gray-500 dark:text-gray-400 text-center py-6">Nessun preventivo presente. Creane uno dalla sezione Preventivi.</p>`;
    } else {
      content.innerHTML = quotes.map(q => {
        const client = DB.getClientById(q.clientId) || { name: '' };
        const tot = DB.calculateQuoteTotals(q, DB.getSettings().taxRegime === 'forfettario').grandTotal;
        return `
          <button onclick="AgendaModule.attachQuote('${q.id}')" class="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-left">
            <div class="min-w-0">
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${escapeHtml(q.number)}</p>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">${escapeHtml(client.name || 'Cliente')} · ${escapeHtml(q.date || '')}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-sm font-extrabold text-gray-900 dark:text-white">€ ${tot.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg">Aggiungi</span>
            </div>
          </button>
        `;
      }).join('');
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeQuotePicker() {
    const modal = document.getElementById('quote-picker-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  },

  attachQuote(quoteId) {
    this._pendingQuoteId = quoteId;
    this.closeQuotePicker();
    this.renderQuoteBox();
    App.showToast('Preventivo allegato all\'appuntamento', 'success');
  },

  removeQuote() {
    this._pendingQuoteId = null;
    this.renderQuoteBox();
  },

  // Dettatura vocale (Web Speech API)
  toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      App.showToast('Riconoscimento vocale non supportato su questo browser (usa Chrome/Edge).', 'error');
      return;
    }
    if (this._recognition) {
      this._recognition.stop();
      this._recognition = null;
      return;
    }
    const rec = new SR();
    rec.lang = 'it-IT';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      this.applyVoiceText(text);
    };
    rec.onerror = () => { this._recognition = null; };
    rec.onend = () => { this._recognition = null; };
    this._recognition = rec;
    rec.start();
    App.showToast('Parla ora...', 'info');
  },

  // Interpreta il testo dettato e riempie i campi
  applyVoiceText(text) {
    const t = text.toLowerCase();
    const titleEl = document.getElementById('apt-title');
    if (titleEl) titleEl.value = text.trim();

    const dateEl = document.getElementById('apt-date');
    if (dateEl) {
      if (t.includes('dopodomani')) dateEl.value = this.shiftDate(this.todayStr(), 2);
      else if (t.includes('domani')) dateEl.value = this.shiftDate(this.todayStr(), 1);
      else if (t.includes('oggi')) dateEl.value = this.todayStr();
    }
    const timeMatch = text.match(/alle\s+(\d{1,2})(?::(\d{2}))?/i);
    if (timeMatch) {
      const h = String(timeMatch[1]).padStart(2, '0');
      const m = timeMatch[2] || '00';
      const timeEl = document.getElementById('apt-time');
      if (timeEl) timeEl.value = `${h}:${m}`;
    }
    App.showToast('Riconosciuto: "' + text.trim() + '"', 'success');
  },
  closeModal() {
    const modal = document.getElementById('agenda-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  },
  saveFromModal(event) {
    event.preventDefault();
    const id = document.getElementById('apt-id').value;
    const title = document.getElementById('apt-title').value.trim();
    if (!title) { App.showToast('Inserisci il motivo dell\'appuntamento', 'error'); return; }

    // Determina il cliente (esistente o nuovo creato al volo dalla ricerca)
    let clientId = document.getElementById('apt-client-id').value;
    if (!clientId) {
      const name = document.getElementById('apt-client-search').value.trim();
      if (name) {
        const newClient = DB.saveClient({ name });
        clientId = newClient.id;
      }
    }
    const client = clientId ? DB.getClientById(clientId) : null;

    let location = document.getElementById('apt-location').value.trim();
    if (!location && client && client.address) location = client.address;

    const apt = {
      id: id || undefined,
      clientId: clientId || '',
      title,
      date: document.getElementById('apt-date').value,
      time: document.getElementById('apt-time').value,
      duration: Number(document.getElementById('apt-duration').value) || 60,
      location,
      status: document.getElementById('apt-status').value,
      notes: document.getElementById('apt-notes').value.trim(),
      quoteId: this._pendingQuoteId || null
    };
    DB.saveAppointment(apt);
    this.closeModal();
    this._pendingQuoteId = null;
    this.selectedDate = apt.date;
    this.currentYear = this.parseDate(apt.date).getFullYear();
    this.currentMonth = this.parseDate(apt.date).getMonth();
    this.render();
    App.showToast('Appuntamento salvato in agenda!', 'success');
  },
  deleteAppointment(id) {
    if (confirm('Vuoi eliminare questo appuntamento dall\'agenda?')) {
      DB.deleteAppointment(id);
      this.render();
      App.showToast('Appuntamento eliminato', 'info');
    }
  }
};
