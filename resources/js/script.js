/* ═══════════════════════════════════════════════════════
   ATLAS VALLEY — Lön & Schema 2026
   Core Logic Engine & LocalStorage Manager
   ═══════════════════════════════════════════════════════ */

// Costanti Internazionali
const MONTHS_SV = ['JANUARI','FEBRUARI','MARS','APRIL','MAJ','JUNI','JULI','AUGUSTI','SEPTEMBER','OKTOBER','NOVEMBER','DECEMBER'];
const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const DAYS_IT = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

// Stato Globale dell'App
let employees = [];
let shiftData = {};
let currentEmployeeIdx = 0;
let currentMonth = new Date().getMonth();
let isLight = false;
let userRole = 'employee'; // 'admin' o 'employee'

// ── DATA SEEDER INIZIALE (Se LocalStorage è vuoto) ──
function seedInitialData() {
  if (!localStorage.getItem('av_employees')) {
    const initialStaff = ["pantheraleo"];
    localStorage.setItem('av_employees', JSON.stringify(initialStaff));
  }
  
  if (!localStorage.getItem('av_shiftdata')) {
    const initialShifts = {
      // Maggio 2026 (Mese index 4) - Giorno 30
      '0_2026_4_30': {inizio:'07:00', fine:'12:00', pausa:'0', paga:'7', acconto:'20', note:'oussama/moad -20 varsin'},
      
      // Giugno 2026 (Mese index 5)
      '0_2026_5_1':  {inizio:'13:30', fine:'17:30', pausa:'',  paga:'7', acconto:'0',   note:''},
      '0_2026_5_2':  {inizio:'08:30', fine:'10:30', pausa:'',  paga:'7', acconto:'10',  note:'oussama/moad -10'},
      '0_2026_5_3':  {inizio:'10:00', fine:'16:30', pausa:'1', paga:'7', acconto:'0',   note:''},
      '0_2026_5_4':  {inizio:'08:00', fine:'17:00', pausa:'1', paga:'7', acconto:'10',  note:'oussama/moad -10'},
      '0_2026_5_5':  {inizio:'07:30', fine:'13:00', pausa:'',  paga:'7', acconto:'40',  note:'vänster bakljus / oussama -40'},
      '0_2026_5_8':  {inizio:'08:30', fine:'18:30', pausa:'3.5', paga:'7', acconto:'10', note:'oussama -10'},
      '0_2026_5_9':  {inizio:'08:00', fine:'16:00', pausa:'',  paga:'7', acconto:'50',  note:'oussama -50'},
      '0_2026_5_13': {inizio:'00:00', fine:'01:00', pausa:'1', paga:'7', acconto:'50',  note:'moad -110'},
      '0_2026_5_14': {inizio:'08:00', fine:'16:00', pausa:'1', paga:'7', acconto:'0',   note:'abbas'},
      '0_2026_5_15': {inizio:'08:00', fine:'19:00', pausa:'11', paga:'7', acconto:'0',  note:'aina'},
      '0_2026_5_16': {inizio:'08:00', fine:'16:00', pausa:'1', paga:'7', acconto:'10',  note:'10 oussama 20 soufiane'},
      '0_2026_5_17': {inizio:'08:00', fine:'16:00', pausa:'1', paga:'7', acconto:'0',   note:''},
      '0_2026_5_18': {inizio:'08:00', fine:'17:00', pausa:'1', paga:'7', acconto:'0',   note:'sista dagen'},
      // Il famoso 25 Giugno con acconto da 240 euro richiesto
      '0_2026_5_25': {inizio:'',      fine:'',      pausa:'',  paga:'7', acconto:'240', note:''}
    };
    localStorage.setItem('av_shiftdata', JSON.stringify(initialShifts));
  }
}

// Inizializza Caricamento Dati
function loadStorage() {
  seedInitialData();
  employees = JSON.parse(localStorage.getItem('av_employees'));
  shiftData = JSON.parse(localStorage.getItem('av_shiftdata'));
}

function saveStorage() {
  localStorage.setItem('av_employees', JSON.stringify(employees));
  localStorage.setItem('av_shiftdata', JSON.stringify(shiftData));
}

// ── SISTEMA DI AUTENTICAZIONE ED INTERFACCE ──
function populateLoginUsers() {
  const select = document.getElementById('loginUser');
  select.innerHTML = `<option value="admin">➔ ADMIN (pantheraleo)</option>`;
  employees.forEach((emp, index) => {
    select.innerHTML += `<option value="${index}">Personal: ${emp}</option>`;
  });
}

function handleLogin() {
  const userVal = document.getElementById('loginUser').value;
  const passVal = document.getElementById('loginPass').value;

  if (userVal === 'admin') {
    if (passVal === 'admin') {
      userRole = 'admin';
      currentEmployeeIdx = 0; 
    } else {
      alert("Password Amministratore Errata! /pantheraleo.");
      return;
    }
  } else {
    // Dipendente logga con qualsiasi password o 'user' per semplicità ergonomica
    userRole = 'employee';
    currentEmployeeIdx = parseInt(userVal);
  }

  // Configura visibilità UI a seconda del ruolo
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'flex';
  
  applyRoleUI();
  populateDropdowns();
  render();
}

function handleLogout() {
  document.getElementById('loginPass').value = '';
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  populateLoginUsers();
}

function applyRoleUI() {
  const adminElements = document.querySelectorAll('.admin-only');
  const empElements = document.querySelectorAll('.employee-only');
  const badge = document.getElementById('roleBadge');

  if (userRole === 'admin') {
    adminElements.forEach(el => el.style.display = 'flex');
    empElements.forEach(el => el.style.display = 'none');
    badge.textContent = "ADMIN CONTROLLER";
    badge.style.color = "var(--cyan)";
  } else {
    adminElements.forEach(el => el.style.display = 'none');
    empElements.forEach(el => el.style.display = 'flex');
    document.getElementById('empStaticName').textContent = employees[currentEmployeeIdx];
    badge.textContent = "CEDOLINO PROTETTO (READ-ONLY)";
    badge.style.color = "var(--amber)";
  }
}

function populateDropdowns() {
  const empSelect = document.getElementById('empSelect');
  empSelect.innerHTML = '';
  employees.forEach((emp, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = emp;
    opt.selected = (index === currentEmployeeIdx);
    empSelect.appendChild(opt);
  });
}

function changeActiveEmployee() {
  currentEmployeeIdx = parseInt(document.getElementById('empSelect').value);
  render();
}

// ── UTILITY MATEMATICHE E DATA MANAGING ──
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getDow(y, m, d) { return (new Date(y, m, d).getDay() + 6) % 7; }

function calcOre(inizio, fine, pausa) {
  if (!inizio || !fine) return null;
  const [h1, m1] = inizio.split(':').map(Number);
  const [h2, m2] = fine.split(':').map(Number);
  let ore = (h2 * 60 + m2 - h1 * 60 - m1) / 60;
  if (ore < 0) ore += 24; // Gestione Turno Notte Cavalcato
  ore -= (parseFloat(pausa) || 0);
  return Math.max(0, Math.round(ore * 100) / 100);
}

function makeKey(empIdx, y, m, d) { return `${empIdx}_${y}_${m}_${d}`; }

function getVal(k, field) {
  return (shiftData[k] && shiftData[k][field] !== undefined) ? shiftData[k][field] : '';
}

function setVal(k, field, val) {
  if (userRole !== 'admin') return; // Blocco di sicurezza statico totale
  if (!shiftData[k]) shiftData[k] = {};
  shiftData[k][field] = val;
  saveStorage();
  refreshTotals();
}

// ── ENGINE DI RENDERING DELLE VISTE ──
function toggleTheme() {
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  document.getElementById('themeLabel').textContent = isLight ? 'CHIARO' : 'SCURO';
}

function renderTabs() {
  const bar = document.getElementById('tabBar');
  const view = document.getElementById('viewSel').value;
  if (view === 'summary' || view === 'paycheck') { bar.innerHTML = ''; return; }
  
  bar.innerHTML = MONTHS_SV.map((mn, i) =>
    `<div class="tab ${i === currentMonth ? 'active' : ''}" onclick="currentMonth=${i};renderTabs();renderMain()">${mn.substring(0,3)}</div>`
  ).join('');
}

function refreshTotals() {
  const defPaga = parseFloat(document.getElementById('defPaga').value) || 7;
  const m = currentMonth;
  const days = getDaysInMonth(2026, m);
  let totOre = 0, totDov = 0;

  for (let d = 1; d <= days; d++) {
    const k = makeKey(currentEmployeeIdx, 2026, m, d);
    const inizio = getVal(k, 'inizio'), fine = getVal(k, 'fine'), pausa = getVal(k, 'pausa');
    const paga = parseFloat(getVal(k, 'paga')) || defPaga;
    const acc = parseFloat(getVal(k, 'acconto')) || 0;
    const ore = calcOre(inizio, fine, pausa);

    const oreEl = document.getElementById(`ore_${m}_${d}`);
    const totEl = document.getElementById(`tot_${m}_${d}`);

    if (ore !== null) {
      const tot = Math.round((ore * paga - acc) * 100) / 100;
      if (oreEl) oreEl.textContent = ore.toFixed(2);
      if (totEl) totEl.textContent = '€' + tot.toFixed(2);
      totOre += ore; totDov += tot;
    } else {
      if (acc > 0) {
        if (oreEl) oreEl.textContent = '—';
        if (totEl) totEl.textContent = '€' + (-acc).toFixed(2);
        totDov -= acc;
      } else {
        if (oreEl) oreEl.textContent = '—';
        if (totEl) totEl.textContent = '—';
      }
    }
  }

  const sfOre = document.getElementById(`sf_ore_${m}`);
  const sfTot = document.getElementById(`sf_tot_${m}`);
  if (sfOre) sfOre.textContent = totOre.toFixed(2) + 'h';
  if (sfTot) sfTot.textContent = '€' + totDov.toFixed(2);

  const msOre = document.getElementById(`ms_ore_${m}`);
  const msTot = document.getElementById(`ms_tot_${m}`);
  if (msOre) msOre.innerHTML = '<span>' + totOre.toFixed(1) + 'h</span>';
  if (msTot) msTot.innerHTML = '<span>€' + totDov.toFixed(2) + '</span>';
}

function renderMain() {
  const view = document.getElementById('viewSel').value;
  const content = document.getElementById('mainContent');
  const defPaga = parseFloat(document.getElementById('defPaga').value) || 7;
  const activeName = employees[currentEmployeeIdx];

  if (view === 'summary') { renderAnnualSummary(content, defPaga); return; }
  if (view === 'paycheck') { renderPaycheckStatic(content, defPaga); return; }

  const m = currentMonth;
  const days = getDaysInMonth(2026, m);
  let rows = '';

  for (let d = 1; d <= days; d++) {
    const dow = getDow(2026, m, d);
    const k = makeKey(currentEmployeeIdx, 2026, m, d);
    const isWe = dow >= 5;
    const isToday = (new Date().getFullYear() === 2026 && new Date().getMonth() === m && new Date().getDate() === d);
    
    const inizio = getVal(k, 'inizio'), fine = getVal(k, 'fine'), pausa = getVal(k, 'pausa');
    const paga = getVal(k, 'paga') || defPaga;
    const acc = getVal(k, 'acconto') || '0';
    const note = getVal(k, 'note') || '';
    const ore = calcOre(inizio, fine, pausa);
    
    let tot = '—';
    if (ore !== null) {
      tot = '€' + (ore * parseFloat(paga) - parseFloat(acc)).toFixed(2);
    } else if (parseFloat(acc) > 0) {
      tot = '€' + (-parseFloat(acc)).toFixed(2);
    }

    // Costruisci riga basandoti sui permessi di modifica (Admin scrive, Employee legge testo statico)
    let cellInizio = `<input type="time" value="${inizio}" onchange="setVal('${k}','inizio',this.value)">`;
    let cellFine = `<input type="time" value="${fine}" onchange="setVal('${k}','fine',this.value)">`;
    let cellPausa = `<input type="number" value="${pausa}" placeholder="0" min="0" step="0.25" style="width:55px" onchange="setVal('${k}','pausa',this.value)">`;
    let cellPaga = `<input type="number" class="paga-in" value="${paga}" min="0" step="0.5" style="width:60px" onchange="setVal('${k}','paga',this.value)">`;
    let cellAcc = `<input type="number" class="acc-in" value="${acc}" placeholder="0" min="0" step="1" style="width:60px" onchange="setVal('${k}','acconto',this.value)">`;
    let cellNote = `<input type="text" value="${note}" placeholder="..." style="text-align:left;" onchange="setVal('${k}','note',this.value)">`;

    if (userRole !== 'admin') {
      cellInizio = `<span class="static-cell">${inizio || '—'}</span>`;
      cellFine = `<span class="static-cell">${fine || '—'}</span>`;
      cellPausa = `<span class="static-cell">${pausa ? pausa+'h' : '—'}</span>`;
      cellPaga = `<span class="static-cell paga">€${paga}</span>`;
      cellAcc = `<span class="static-cell acconto">${parseFloat(acc) > 0 ? '€'+acc : '—'}</span>`;
      cellNote = `<span class="static-cell" style="text-align:left; color:var(--text-muted);">${note || '—'}</span>`;
    }

    rows += `
      <tr class="${isWe ? 'weekend' : ''} ${isToday ? 'today' : ''}">
        <td class="day-num">${d.toString().padStart(2, '0')}</td>
        <td class="day-name">${DAYS_IT[dow]}</td>
        <td>${cellInizio}</td>
        <td>${cellFine}</td>
        <td>${cellPausa}</td>
        <td class="computed-ore" id="ore_${m}_${d}">${ore !== null ? ore.toFixed(2) : '—'}</td>
        <td>${cellPaga}</td>
        <td>${cellAcc}</td>
        <td class="computed-tot" id="tot_${m}_${d}">${tot}</td>
        <td>${cellNote}</td>
      </tr>`;
  }

  content.innerHTML = `
    <div class="month-block">
      <div class="month-header">
        <div class="month-title">${MONTHS_SV[m]} 2026 — ${activeName}</div>
        <div class="month-stats">
          <div class="mstat">Ore Accumulate: <span id="ms_ore_${m}">0.0h</span></div>
          <div class="mstat">Salto Netto Mese: <span id="ms_tot_${m}">€0.00</span></div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40px">#</th>
            <th style="text-align:left; width:100px;">Giorno</th>
            <th>Inizio</th><th>Fine</th><th>Pausa</th>
            <th>Ore Effettive</th><th>Paga/h</th><th>Acconti Ricevuti</th>
            <th>Spettanza Riga</th><th style="text-align:left">Note Libere</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="tfoot-row">
            <td colspan="5" style="text-align:right; color:var(--text-muted); font-size:10px;">CONSUNTIVO ${MONTHS_SV[m]}</td>
            <td class="sum-ore" id="sf_ore_${m}">0.00h</td>
            <td></td><td></td>
            <td class="sum-tot" id="sf_tot_${m}">€0.00</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>`;
    
  refreshTotals();
}

function renderAnnualSummary(content, defPaga) {
  let grandOre = 0, grandAcc = 0, grandDov = 0;
  let rowsHtml = '';
  const activeName = employees[currentEmployeeIdx];

  for (let m = 0; m < 12; m++) {
    let mOre = 0, mAcc = 0, mDov = 0;
    const days = getDaysInMonth(2026, m);

    for (let d = 1; d <= days; d++) {
      const k = makeKey(currentEmployeeIdx, 2026, m, d);
      const inizio = getVal(k, 'inizio'), fine = getVal(k, 'fine'), pausa = getVal(k, 'pausa');
      const paga = parseFloat(getVal(k, 'paga')) || defPaga;
      const acc = parseFloat(getVal(k, 'acconto')) || 0;
      const ore = calcOre(inizio, fine, pausa);

      if (ore !== null) { mOre += ore; mAcc += acc; mDov += (ore * paga - acc); }
      else if (acc > 0) { mAcc += acc; mDov -= acc; }
    }

    grandOre += mOre; grandAcc += mAcc; grandDov += mDov;

    if (mOre > 0 || mAcc > 0) {
      rowsHtml += `
        <div class="paycheck-row">
          <span class="p-label">${MONTHS_IT[m]} 2026</span>
          <span class="p-val cyan-v">${mOre.toFixed(1)}h lavorate  ·  Netto: €${mDov.toFixed(2)}</span>
        </div>`;
    }
  }

  if (!rowsHtml) rowsHtml = `<div class="paycheck-row"><span class="p-label">Nessuna attività registrata nel 2026</span></div>`;

  content.innerHTML = `
    <div class="summary-panel">
      <h3 class="paycheck-title">PROSPETTO ANNUALE GENERALE</h3>
      <div class="paycheck-meta">
        <div class="meta-item">Dipendente: <strong>${activeName}</strong></div>
        <div class="meta-item">Anno Fiscale: <strong>2026</strong></div>
      </div>
      ${rowsHtml}
      <div class="paycheck-row total-final" style="margin-top:20px;">
        <span class="p-label">Ore Totali Annuali</span>
        <span class="p-val">${grandOre.toFixed(1)} Ore</span>
      </div>
      <div class="paycheck-row total-final">
        <span class="p-label">Totale Acconti Prelevati</span>
        <span class="p-val amber-v">€${grandAcc.toFixed(2)}</span>
      </div>
      <div class="paycheck-row total-final" style="border-top: 1px solid var(--border);">
        <span class="p-label">SALDO DOVUTO FINALE</span>
        <span class="p-val cyan-v">€${grandDov.toFixed(2)}</span>
      </div>
    </div>`;
}

// Vista Cedolino Statica Specifica chiesta per la stampa PDF pulita
function renderPaycheckStatic(content, defPaga) {
  const m = currentMonth;
  const activeName = employees[currentEmployeeIdx];
  const days = getDaysInMonth(2026, m);
  
  let lordoMese = 0;
  let accontiMese = 0;
  let oreMese = 0;

  for (let d = 1; d <= days; d++) {
    const k = makeKey(currentEmployeeIdx, 2026, m, d);
    const inizio = getVal(k, 'inizio'), fine = getVal(k, 'fine'), pausa = getVal(k, 'pausa');
    const paga = parseFloat(getVal(k, 'paga')) || defPaga;
    const acc = parseFloat(getVal(k, 'acconto')) || 0;
    const ore = calcOre(inizio, fine, pausa);

    if (ore !== null) {
      oreMese += ore;
      lordoMese += (ore * paga);
      accontiMese += acc;
    } else if (acc > 0) {
      accontiMese += acc;
    }
  }

  const saldoNetto = lordoMese - accontiMese;

  content.innerHTML = `
    <div class="paycheck-panel">
      <h2 class="paycheck-title">COMPETENZE E SCHEDULAZIONE LÖN</h2>
      <p style="text-align:center; font-size:11px; color:var(--text-muted); margin-top:-15px; margin-bottom:25px; font-family:'Orbitron'">ATLAS VALLEY MANAGEMENT SYSTEM</p>
      
      <div class="paycheck-meta">
        <div class="meta-item">RISORSA: <strong>${activeName}</strong></div>
        <div class="meta-item">COMPETENZA: <strong>${MONTHS_IT[m].toUpperCase()} 2026</strong></div>
      </div>

      <div class="paycheck-row">
        <span class="p-label">Ore Totali Prestate nel Mese</span>
        <span class="p-val">${oreMese.toFixed(2)} h</span>
      </div>
      <div class="paycheck-row">
        <span class="p-label">Compenso Lordo Maturato</span>
        <span class="p-val cyan-v">€${lordoMese.toFixed(2)}</span>
      </div>
      <div class="paycheck-row">
        <span class="p-label">Trattenute per Acconti Ricevuti</span>
        <span class="p-val amber-v">- €${accontiMese.toFixed(2)}</span>
      </div>
      
      <div class="paycheck-row total-final">
        <span class="p-label">COMPETENZA NETTA DA LIQUIDARE</span>
        <span class="p-val cyan-v" style="font-size:20px;">€${saldoNetto.toFixed(2)}</span>
      </div>
      
      <div style="margin-top:40px; border-top:1px dashed var(--border); padding-top:20px; font-size:10px; color:var(--text-muted); text-align:center; line-height:1.6;">
        Il presente documento costituisce estratto cronologico statico delle ore convalidate nel server Atlas Valley.<br>
        Generato il ${new Date().toLocaleDateString('it-IT')} alle ore ${new Date().toLocaleTimeString('it-IT')}.
      </div>
    </div>`;
}

function render() {
  renderTabs();
  renderMain();
}

// ── EXPORTING UTILITIES ──
function exportCSV() {
  const defPaga = parseFloat(document.getElementById('defPaga').value) || 7;
  const activeName = employees[currentEmployeeIdx];
  let csv = 'Data,Giorno,Inizio,Fine,Pausa,Ore,Paga,Acconto,Totale,Note\n';

  for (let m = 0; m < 12; m++) {
    const days = getDaysInMonth(2026, m);
    for (let d = 1; d <= days; d++) {
      const k = makeKey(currentEmployeeIdx, 2026, m, d);
      const inizio = getVal(k, 'inizio'), fine = getVal(k, 'fine');
      const acc = parseFloat(getVal(k, 'acconto')) || 0;
      
      if (!inizio && !fine && acc === 0) continue;

      const pausa = getVal(k, 'pausa') || '0';
      const paga = parseFloat(getVal(k, 'paga')) || defPaga;
      const ore = calcOre(inizio, fine, pausa) || 0;
      const tot = (ore * paga - acc).toFixed(2);
      const dow = getDow(2026, m, d);
      const note = getVal(k, 'note') || '';

      csv += `${d.toString().padStart(2,'0')}/${(m+1).toString().padStart(2,'0')}/2026,${DAYS_IT[dow]},${inizio},${fine},${pausa},${ore.toFixed(2)},${paga},${acc},${tot},"${note}"\n`;
    }
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `AtlasValley_${activeName}_Calendario2026.csv`;
  a.click();
}

function printPaycheck() {
  // Passa temporaneamente a vista paycheck se si preme stampa mentre si è altrove
  const prevView = document.getElementById('viewSel').value;
  if (prevView !== 'paycheck' && prevView !== 'month' && prevView !== 'summary') {
    document.getElementById('viewSel').value = 'paycheck';
    render();
  }
  window.print();
}

// ── GESTIONE MODALE ORGANICO (ADMIN ONLY) ──
function openStaffModal() {
  if (userRole !== 'admin') return;
  document.getElementById('staffModal').style.display = 'flex';
  updateModalStaffList();
}

function closeStaffModal() {
  document.getElementById('staffModal').style.display = 'none';
}

function updateModalStaffList() {
  const list = document.getElementById('staffList');
  list.innerHTML = '';
  employees.forEach((emp, index) => {
    list.innerHTML += `
      <li class="staff-item">
        <span>⬡ ${emp}</span>
        <button class="del-staff-btn" onclick="deleteEmployee(${index})">Elimina</button>
      </li>`;
  });
}

function addNewEmployee() {
  const nameInput = document.getElementById('newWorkerName');
  const name = nameInput.value.trim().toUpperCase();
  if (!name) return;
  if (employees.includes(name)) { alert("Nome già esistente!"); return; }
  
  employees.push(name);
  nameInput.value = '';
  saveStorage();
  updateModalStaffList();
  populateDropdowns();
}

function deleteEmployee(index) {
  if (employees.length <= 1) { alert("Impossibile eliminare tutti i dipendenti. Lasciarne almeno uno."); return; }
  if (confirm(`Sei sicuro di voler eliminare permanentemente ${employees[index]}? Tutti i suoi turni rimarranno salvati ma l'indice cambierà.`)) {
    employees.splice(index, 1);
    currentEmployeeIdx = 0;
    saveStorage();
    updateModalStaffList();
    populateDropdowns();
    render();
  }
}

// ── BOOTSTRAP INIZIALE DELL'APPLICAZIONE ──
window.onload = function() {
  loadStorage();
  populateLoginUsers();
};
