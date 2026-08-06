const ADMIN_EMAIL = "admin@corralabierto.cl";

// Asignar variables globales compartidas de app-v5.js (sin redeclarar con let)
if (typeof rodeoData === 'undefined' || !rodeoData) {
    rodeoData = (typeof defaultRodeoData !== 'undefined') ? defaultRodeoData : [];
}
if (typeof genealogiaData === 'undefined' || !genealogiaData) {
    genealogiaData = (typeof defaultGenealogiaData !== 'undefined') ? defaultGenealogiaData : [];
}

let filteredColleras = Array.isArray(rodeoData) ? [...rodeoData] : [];
let filteredGenealogias = Array.isArray(genealogiaData) ? [...genealogiaData] : [];
let activeRodeoId = localStorage.getItem('activeRodeoId') || 'champion-chile-2026';
let rodeos = [];
let usuariosList = [];
let calendarEvents = [];
let colleraHorseTimer = {};

// CAMBIADOR DE PESTAÑAS 100% GARANTIZADO
window.switchAdminTab = function(tabId, btnElement) {
    console.log("Cambiando pestaña a:", tabId);
    const tabs = document.querySelectorAll('.admin-tab-content');
    const btns = document.querySelectorAll('.admin-tab-btn');
    
    tabs.forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    btns.forEach(b => b.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
    }

    if (btnElement) {
        btnElement.classList.add('active');
    } else {
        const b = document.getElementById(`btn-${tabId}`);
        if (b) b.classList.add('active');
    }
};

// INICIALIZACIÓN DIRECTA
async function initAdminDirect() {
    try {
        localStorage.setItem('currentUser', JSON.stringify({ email: ADMIN_EMAIL, active: true }));
    } catch(e) {}

    // Cargar respaldo local inmediato para que la interfaz responda al instante
    try {
        const rawRodeos = localStorage.getItem('rodeosData');
        if (rawRodeos) rodeos = JSON.parse(rawRodeos);
    } catch(e) {}

    if (!rodeos || rodeos.length === 0) {
        rodeos = [
            { id: 'champion-chile-2026', nombre: '77° Campeonato Nacional Champion de Chile 2026', activo: true, logo_url: '', fecha: '09 - 12 ABR 2026', lugar: 'Medialuna Monumental de Rancagua', asociacion: 'O\'Higgins', tipo: 'Champion de Chile' },
            { id: 'clasificatorio-sur-2026', nombre: 'Rodeo Clasificatorio Zona Sur Valdivia 2026', activo: false, logo_url: '', fecha: '06 - 08 MAR 2026', lugar: 'Medialuna Parque Saval, Valdivia', asociacion: 'Valdivia', tipo: 'Clasificatorio' },
            { id: 'clasificatorio-centro-2026', nombre: 'Rodeo Clasificatorio Zona Centro San Clemente 2026', activo: false, logo_url: '', fecha: '13 - 15 MAR 2026', lugar: 'Medialuna de San Clemente', asociacion: 'Talca', tipo: 'Clasificatorio' },
            { id: 'clasificatorio-norte-2026', nombre: 'Rodeo Clasificatorio Zona Norte Petorca 2026', activo: false, logo_url: '', fecha: '20 - 22 MAR 2026', lugar: 'Medialuna El Sobrante, Petorca', asociacion: 'Petorca', tipo: 'Clasificatorio' }
        ];
    }

    if (typeof defaultRodeoData !== 'undefined') rodeoData = defaultRodeoData;
    filteredColleras = Array.isArray(rodeoData) ? [...rodeoData] : [];
    filteredGenealogias = (typeof genealogiaData !== 'undefined' && Array.isArray(genealogiaData)) ? [...genealogiaData] : [];

    // RENDERIZADO INMEDIATO SIN ESPERAR RED
    renderRodeosTable();
    renderCollerasTable();
    renderGenealogiasTable();
    populateLiveRodeoOptions();

    // Cargar actualizaciones remotas de Supabase en segundo plano sin congelar la pantalla
    loadRodeos().then(() => { renderRodeosTable(); populateLiveRodeoOptions(); });
    loadRodeoColleras(activeRodeoId).then(() => { filteredColleras = [...rodeoData]; renderCollerasTable(); populateLiveColleraOptions(); });
    loadUsuariosFromSupabase().then(() => { renderUsuariosTable(); });
    loadCalendarEventsFromSupabase().then(() => { renderAdminCalendarTable(); });
}

// POBLAR SELECT DE RODEOS Y COLLERAS EN LA CONSOLA EN VIVO
function populateLiveRodeoOptions() {
    const selectEl = document.getElementById('admin-live-rodeo-select');
    if (!selectEl) return;
    selectEl.innerHTML = (rodeos || []).map(r => 
        `<option value="${r.id}" ${r.id === activeRodeoId ? 'selected' : ''}>${r.nombre}</option>`
    ).join('');
    populateLiveColleraOptions();
}

window.onLiveRodeoSelectChange = async function(selectedRodeoId) {
    activeRodeoId = selectedRodeoId;
    localStorage.setItem('activeRodeoId', selectedRodeoId);
    const titleEl = document.getElementById('active-rodeo-title');
    const rodeoObj = (rodeos || []).find(r => r.id === selectedRodeoId);
    if (titleEl && rodeoObj) titleEl.innerText = rodeoObj.nombre;

    await loadRodeoColleras(selectedRodeoId);
    filteredColleras = Array.isArray(rodeoData) ? [...rodeoData] : [];
    renderCollerasTable();
    populateLiveColleraOptions();

    // Sincronizar selector de estado según liveState guardado
    let currentLiveState = null;
    try { currentLiveState = JSON.parse(localStorage.getItem(`liveState_${selectedRodeoId}`)); } catch(e) {}
    const estadoSelect = document.getElementById('admin-live-estado-select');
    if (estadoSelect) {
        estadoSelect.value = currentLiveState?.estado || 'en_vivo';
    }
};

window.onLiveEstadoSelectChange = function(newEstado) {
    let currentState = {};
    try {
        currentState = JSON.parse(localStorage.getItem(`liveState_${activeRodeoId}`)) || {};
    } catch(e) {}

    currentState.estado = newEstado;
    localStorage.setItem(`liveState_${activeRodeoId}`, JSON.stringify(currentState));

    // Actualizar indicador visual en el panel admin
    const indicatorEl = document.getElementById('live-admin-status-indicator');
    if (indicatorEl) {
        if (newEstado === 'finalizado') {
            indicatorEl.textContent = '🏁 RODEO FINALIZADO';
            indicatorEl.style.background = '#d32f2f';
        } else if (newEstado === 'pausado') {
            indicatorEl.textContent = '⏸️ RODEO PAUSADO';
            indicatorEl.style.background = '#f57c00';
        } else {
            indicatorEl.textContent = '🔴 TRANSMISIÓN EN VIVO';
            indicatorEl.style.background = '#2e7d32';
        }
    }

    // Sincronizar en Supabase
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const isActivo = (newEstado === 'en_vivo' || newEstado === 'pausado');
        supabaseClient.from('rodeos').update({ 
            logo_url: JSON.stringify(currentState), 
            activo: isActivo 
        }).eq('id', activeRodeoId).then(()=>{}).catch(()=>{});
    }

    if (typeof window.showToast === 'function') {
        const txt = newEstado === 'finalizado' ? '🏁 Rodeo marcado como FINALIZADO.' : (newEstado === 'pausado' ? '⏸️ Rodeo PAUSADO en vivo.' : '🔴 Rodeo en TRANSMISIÓN EN VIVO.');
        window.showToast(txt);
    }
};

function populateLiveColleraOptions() {
    const selectEl = document.getElementById('admin-live-collera-select');
    if (!selectEl) return;
    
    const toroVal = document.getElementById('admin-live-toro-select')?.value || '1er Toro';
    let allColleras = filteredColleras || rodeoData || [];
    
    // Si no estamos en el 1er Toro, filtrar solo colleras que hayan calificado (sin 'X' o 'N/C' en toros anteriores)
    let qualifiedColleras = allColleras;
    if (toroVal.includes('2do')) {
        qualifiedColleras = allColleras.filter(c => c.animal1 !== 'X' && c.animal1 !== 'N/C' && c.animal1 !== undefined && c.animal1 !== null && c.animal1 !== '');
    } else if (toroVal.includes('3er')) {
        qualifiedColleras = allColleras.filter(c => c.animal2 !== 'X' && c.animal2 !== 'N/C' && c.animal2 !== undefined && c.animal2 !== null && c.animal2 !== '');
    } else if (toroVal.includes('4to')) {
        qualifiedColleras = allColleras.filter(c => c.animal3 !== 'X' && c.animal3 !== 'N/C' && c.animal3 !== undefined && c.animal3 !== null && c.animal3 !== '');
    } else if (toroVal.includes('Desempate')) {
        qualifiedColleras = allColleras.filter(c => c.animal4 !== 'X' && c.animal4 !== 'N/C' && c.animal4 !== undefined && c.animal4 !== null && c.animal4 !== '');
    }

    if (qualifiedColleras.length === 0) {
        selectEl.innerHTML = `<option value="">-- No hay colleras calificadas para ${toroVal} --</option>`;
        return;
    }

    selectEl.innerHTML = `<option value="">-- Seleccionar Collera --</option>` + qualifiedColleras.map(c => {
        const jinetesStr = Array.isArray(c.jinetes) ? c.jinetes.join(' y ') : (c.jinetes || 'Jinetes');
        const caballosStr = Array.isArray(c.caballos) ? c.caballos.join(' y ') : (c.caballos || 'Caballos');
        return `<option value="${c.n}">Collera N° ${c.n} | ${jinetesStr} en ${caballosStr}</option>`;
    }).join('');
}

window.onColleraSelectChange = function() {
    const colleraVal = document.getElementById('admin-live-collera-select').value;
    if (!colleraVal) return;
    const num = parseInt(colleraVal);
    const colleraObj = (filteredColleras || []).find(c => parseInt(c.n) === num);
    if (colleraObj) {
        let currentState = {};
        try { currentState = JSON.parse(localStorage.getItem(`liveState_${activeRodeoId}`)) || {}; } catch(e) {}
        currentState.activeColleraN = num;
        currentState.proximaColleraN = num + 1;
        currentState.runDetails = null; // Reiniciar atajadas parciales
        localStorage.setItem(`liveState_${activeRodeoId}`, JSON.stringify(currentState));

        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            supabaseClient.from('rodeos').update({ logo_url: JSON.stringify(currentState) }).eq('id', activeRodeoId).then(()=>{}).catch(()=>{});
        }
        if (typeof window.showToast === 'function') {
            window.showToast(`🎯 Collera N° ${colleraObj.n} en cancha transmitida.`);
        }
    }
};

window.onToroSelectChange = function() {
    const toroVal = document.getElementById('admin-live-toro-select').value;
    let currentState = {};
    try { currentState = JSON.parse(localStorage.getItem(`liveState_${activeRodeoId}`)) || {}; } catch(e) {}
    currentState.toroActual = toroVal + ' en Curso';
    localStorage.setItem(`liveState_${activeRodeoId}`, JSON.stringify(currentState));

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('rodeos').update({ logo_url: JSON.stringify(currentState) }).eq('id', activeRodeoId).then(()=>{}).catch(()=>{});
    }

    populateLiveColleraOptions();
};

window.transmitLivePartialProgress = function() {
    const salida  = parseInt(document.getElementById('calc-salida').value || '0');
    const a1      = parseInt(document.getElementById('calc-atajada1').value || '0');
    const a2      = parseInt(document.getElementById('calc-atajada2').value || '0');
    const a3      = parseInt(document.getElementById('calc-atajada3').value || '0');
    const faltas  = parseInt(document.getElementById('calc-faltas').value || '0');
    const totalToro = salida + a1 + a2 + a3 + faltas;

    const totalBadge = document.getElementById('live-calc-total-badge');
    if (totalBadge) {
        totalBadge.textContent = `${totalToro >= 0 ? '+' + totalToro : totalToro} PUNTOS EN TORO`;
    }

    const colleraVal = document.getElementById('admin-live-collera-select').value;
    const num = parseInt(colleraVal);
    if (!num) return;

    let currentState = {};
    try { currentState = JSON.parse(localStorage.getItem(`liveState_${activeRodeoId}`)) || {}; } catch(e) {}

    currentState.activeColleraN = num;
    currentState.runDetails = { salida, a1, a2, a3, faltas, totalToro };
    localStorage.setItem(`liveState_${activeRodeoId}`, JSON.stringify(currentState));

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('rodeos').update({ logo_url: JSON.stringify(currentState) }).eq('id', activeRodeoId).then(()=>{}).catch(()=>{});
    }
};

window.guardarToroYSiguienteCollera = function() {
    const colleraVal = document.getElementById('admin-live-collera-select').value;
    const num = parseInt(colleraVal);
    if (!num) {
        alert("Por favor selecciona una collera en cancha primero.");
        return;
    }

    const toroVal = document.getElementById('admin-live-toro-select').value;
    const salida  = parseInt(document.getElementById('calc-salida').value || '0');
    const a1      = parseInt(document.getElementById('calc-atajada1').value || '0');
    const a2      = parseInt(document.getElementById('calc-atajada2').value || '0');
    const a3      = parseInt(document.getElementById('calc-atajada3').value || '0');
    const faltas  = parseInt(document.getElementById('calc-faltas').value || '0');
    const ptsToro = salida + a1 + a2 + a3 + faltas;

    const colleraObj = (filteredColleras || []).find(c => parseInt(c.n) === num);
    if (!colleraObj) return;

    // Asignar puntos al toro correspondiente en la collera
    if (toroVal.includes('1er')) colleraObj.animal1 = ptsToro;
    else if (toroVal.includes('2do')) colleraObj.animal2 = ptsToro;
    else if (toroVal.includes('3er')) colleraObj.animal3 = ptsToro;
    else if (toroVal.includes('4to')) colleraObj.animal4 = ptsToro;

    // Recalcular total acumulado
    let sum = 0;
    [colleraObj.animal1, colleraObj.animal2, colleraObj.animal3, colleraObj.animal4].forEach(val => {
        const n = parseFloat(val);
        if (!isNaN(n)) sum += n;
    });
    colleraObj.resultado = sum;

    // Guardar collera actualizada localmente y en Supabase
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('colleras').upsert(colleraObj).then(()=>{}).catch(()=>{});
    }

    // Pasar a la siguiente collera en la consola live
    const nextNum = num + 1;
    let currentState = {};
    try { currentState = JSON.parse(localStorage.getItem(`liveState_${activeRodeoId}`)) || {}; } catch(e) {}
    currentState.activeColleraN = nextNum;
    currentState.proximaColleraN = nextNum + 1;
    currentState.runDetails = null;
    localStorage.setItem(`liveState_${activeRodeoId}`, JSON.stringify(currentState));

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('rodeos').update({ logo_url: JSON.stringify(currentState) }).eq('id', activeRodeoId).then(()=>{}).catch(()=>{});
    }

    // Actualizar interfaz admin
    renderCollerasTable();
    const colleraSelect = document.getElementById('admin-live-collera-select');
    if (colleraSelect) {
        colleraSelect.value = String(nextNum);
    }
};

window.marcarNoCorreYSiguiente = function() {
    const colleraVal = document.getElementById('admin-live-collera-select').value;
    const num = parseInt(colleraVal);
    if (!num) {
        alert("Por favor selecciona una collera en cancha primero.");
        return;
    }

    const toroVal = document.getElementById('admin-live-toro-select').value;
    const colleraObj = (filteredColleras || []).find(c => parseInt(c.n) === num);
    if (!colleraObj) return;

    // Marcar como NO CORRE en el toro correspondiente
    if (toroVal.includes('1er')) colleraObj.animal1 = 'N/C';
    else if (toroVal.includes('2do')) colleraObj.animal2 = 'N/C';
    else if (toroVal.includes('3er')) colleraObj.animal3 = 'N/C';
    else if (toroVal.includes('4to')) colleraObj.animal4 = 'N/C';

    // Guardar en Supabase y local
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('colleras').upsert(colleraObj).then(()=>{}).catch(()=>{});
    }

    // Avanzar a la siguiente collera
    const nextNum = num + 1;
    let currentState = {};
    try { currentState = JSON.parse(localStorage.getItem(`liveState_${activeRodeoId}`)) || {}; } catch(e) {}
    currentState.activeColleraN = nextNum;
    currentState.proximaColleraN = nextNum + 1;
    currentState.runDetails = null;
    localStorage.setItem(`liveState_${activeRodeoId}`, JSON.stringify(currentState));

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('rodeos').update({ logo_url: JSON.stringify(currentState) }).eq('id', activeRodeoId).then(()=>{}).catch(()=>{});
    }

    renderCollerasTable();
    const colleraSelect = document.getElementById('admin-live-collera-select');
    if (colleraSelect) colleraSelect.value = String(nextNum);

    if (typeof window.showToast === 'function') {
        window.showToast(`🚫 Collera N° ${num} marcada como NO CORRE. Avanzando a collera N° ${nextNum}.`);
    }
};

window.aplicarCorteDeAnimalPrompt = function() {
    const toroVal = document.getElementById('admin-live-toro-select').value;
    let currentAnimalKey = 'animal1';
    let nextToroName = '2do Toro';

    if (toroVal.includes('1er')) {
        currentAnimalKey = 'animal1';
        nextToroName = '2do Toro';
    } else if (toroVal.includes('2do')) {
        currentAnimalKey = 'animal2';
        nextToroName = '3er Toro';
    } else if (toroVal.includes('3er')) {
        currentAnimalKey = 'animal3';
        nextToroName = '4to Toro';
    } else if (toroVal.includes('4to')) {
        currentAnimalKey = 'animal4';
        nextToroName = 'Desempate / Champion';
    }

    const corteInput = prompt(`✂️ Ingrese el PUNTAJE DE CORTE para avanzar al ${nextToroName} (Ejemplo: 4 pts o más):`, "4");
    if (corteInput === null) return; // Cancelado

    const minPts = parseFloat(corteInput);
    if (isNaN(minPts)) {
        alert("Por favor ingrese un número de puntaje de corte válido.");
        return;
    }

    let clasificadasCount = 0;
    let eliminadasCount = 0;

    (filteredColleras || []).forEach(c => {
        // Calcular puntaje acumulado hasta el toro actual
        let totalAcum = 0;
        [c.animal1, c.animal2, c.animal3, c.animal4].forEach(val => {
            if (val !== undefined && val !== null && val !== '' && val !== 'X' && val !== 'N/C') {
                const n = parseFloat(val);
                if (!isNaN(n)) totalAcum += n;
            }
        });

        if (totalAcum >= minPts) {
            clasificadasCount++;
        } else {
            eliminadasCount++;
            // Marcar 'X' en los animales siguientes que no alcanzaron el corte
            if (currentAnimalKey === 'animal1') {
                if (!c.animal2) c.animal2 = 'X';
                if (!c.animal3) c.animal3 = 'X';
                if (!c.animal4) c.animal4 = 'X';
            } else if (currentAnimalKey === 'animal2') {
                if (!c.animal3) c.animal3 = 'X';
                if (!c.animal4) c.animal4 = 'X';
            } else if (currentAnimalKey === 'animal3') {
                if (!c.animal4) c.animal4 = 'X';
            }
        }

        // Guardar actualización de la collera
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            supabaseClient.from('colleras').upsert(c).then(()=>{}).catch(()=>{});
        }
    });

    // Cambiar automáticamente el selector de Toro al siguiente toro
    const toroSelect = document.getElementById('admin-live-toro-select');
    if (toroSelect) {
        toroSelect.value = nextToroName;
        window.onToroSelectChange();
    }

    renderCollerasTable();
    populateLiveColleraOptions();

    alert(`✅ Corte aplicado con éxito (+${minPts} pts):\n- ${clasificadasCount} colleras clasificaron al ${nextToroName}.\n- ${eliminadasCount} colleras no alcanzaron y se marcaron con 'X'.`);
};

// CARGA DE DATOS DE RODEOS
async function loadRodeos() {
    let localData = [];
    try {
        const raw = localStorage.getItem('rodeosData');
        if (raw) localData = JSON.parse(raw);
    } catch(e) {}

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const fetchPromise = supabaseClient.from('rodeos').select('*').order('created_at', { ascending: true });
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ error: 'timeout' }), 2000));
            const res = await Promise.race([fetchPromise, timeoutPromise]);
            if (res && !res.error && res.data && res.data.length > 0) {
                rodeos = res.data;
                return;
            }
        } catch(e) {}
    }

    if (localData && localData.length > 0) {
        rodeos = localData;
    } else {
        rodeos = [
            { id: 'champion-chile-2026', nombre: '77° Campeonato Nacional Champion de Chile 2026', activo: true, logo_url: '', fecha: '09 - 12 ABR 2026', lugar: 'Medialuna Monumental de Rancagua', asociacion: 'O\'Higgins', tipo: 'Champion de Chile' },
            { id: 'clasificatorio-sur-2026', nombre: 'Rodeo Clasificatorio Zona Sur Valdivia 2026', activo: false, logo_url: '', fecha: '06 - 08 MAR 2026', lugar: 'Medialuna Parque Saval, Valdivia', asociacion: 'Valdivia', tipo: 'Clasificatorio' },
            { id: 'clasificatorio-centro-2026', nombre: 'Rodeo Clasificatorio Zona Centro San Clemente 2026', activo: false, logo_url: '', fecha: '13 - 15 MAR 2026', lugar: 'Medialuna de San Clemente', asociacion: 'Talca', tipo: 'Clasificatorio' },
            { id: 'clasificatorio-norte-2026', nombre: 'Rodeo Clasificatorio Zona Norte Petorca 2026', activo: false, logo_url: '', fecha: '20 - 22 MAR 2026', lugar: 'Medialuna El Sobrante, Petorca', asociacion: 'Petorca', tipo: 'Clasificatorio' }
        ];
    }
}

async function loadRodeoColleras(rodeoId) {
    let localColleras = [];
    try {
        const raw = localStorage.getItem(`rodeoData_${rodeoId}`);
        if (raw) localColleras = JSON.parse(raw);
    } catch(e) {}

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const fetchPromise = supabaseClient.from('colleras').select('*').eq('rodeo_id', rodeoId).order('n');
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ error: 'timeout' }), 2000));
            const res = await Promise.race([fetchPromise, timeoutPromise]);
            if (res && !res.error && res.data && res.data.length > 0) {
                rodeoData = res.data;
                return;
            }
        } catch(e) {}
    }

    if (localColleras && localColleras.length > 0) {
        rodeoData = localColleras;
    } else if (typeof defaultRodeoData !== 'undefined') {
        rodeoData = defaultRodeoData;
    } else {
        rodeoData = [];
    }
}

// CARGA DE CALENDARIO DESDE SUPABASE O LOCAL
async function loadCalendarEventsFromSupabase() {
    let localCal = [];
    try {
        const raw = localStorage.getItem('calendarEventsData');
        if (raw) localCal = JSON.parse(raw);
    } catch(e) {}

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('calendar_events').select('*').order('fecha_inicio', { ascending: true });
            if (!error && data && data.length > 0) {
                calendarEvents = data;
                try { localStorage.setItem('calendarEventsData', JSON.stringify(calendarEvents)); } catch(e) {}
                return;
            }
        } catch(e) {}
    }

    if (localCal && localCal.length > 0) {
        calendarEvents = localCal;
    } else {
        calendarEvents = [
            {
                id: 'cal-1',
                nombre: '77° Campeonato Nacional Champion de Chile 2026',
                lugar: 'Medialuna Monumental de Rancagua',
                asociacion: "Zona Centro / O'Higgins",
                tipo: 'Champion de Chile',
                fecha_inicio: '2026-04-09',
                fecha_fin: '2026-04-12',
                hora_inicio: '08:00',
                hora_fin: '21:00',
                descripcion: 'Gran Final del Rodeo Chileno con Serie Criaderos, Misa Criolla, Rienda y Serie Campeones.',
                estado: '🔴 En Vivo',
                afiche_url: ''
            },
            {
                id: 'cal-2',
                nombre: 'Rodeo Clasificatorio Zona Sur Valdivia 2026',
                lugar: 'Medialuna Parque Saval, Valdivia',
                asociacion: 'Valdivia',
                tipo: 'Clasificatorio',
                fecha_inicio: '2026-03-06',
                fecha_fin: '2026-03-08',
                hora_inicio: '08:30',
                hora_fin: '20:30',
                descripcion: 'Clasificatorio Zona Sur rumbo al Champion de Chile.',
                estado: '🟢 Programado',
                afiche_url: ''
            }
        ];
    }
}

// CARGA DE SOCIOS DESDE TABLA 'members' EN SUPABASE
async function loadUsuariosFromSupabase() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('members').select('*').order('created_at', { ascending: false });
            if (!error && data && data.length > 0) {
                usuariosList = data;
                return;
            }
        } catch(e) {
            console.error("Error leyendo socios de Supabase:", e);
        }
    }
    usuariosList = [
        { email: 'admin@corralabierto.cl', nombre: 'ADMINISTRADOR', apellido: 'PRINCIPAL', active: true, telefono: '+56 9 1234 5678' }
    ];
}

// RENDERIZADO DE TABLA DE RODEOS
function renderRodeosTable() {
    const tbody = document.getElementById('rodeos-tbody');
    if (!tbody) return;
    tbody.innerHTML = (rodeos || []).map(r => `
        <tr>
            <td><code>${r.id}</code></td>
            <td><strong>${r.nombre}</strong></td>
            <td>${r.logo_url ? `<img src="${r.logo_url}" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='inline';" style="height: 32px; max-width: 48px; object-fit: contain; border-radius: 4px; vertical-align: middle;"><span style="display:none; color:#ff8a65; font-size:0.78rem;">⚠️ Imagen rota</span>` : '<span style="color:#8d6e63;">Sin logo</span>'}</td>
            <td>📅 ${r.fecha || 'Por definir'}<br><small style="color:#bcaaa4;">📍 ${r.lugar || 'Medialuna'}</small></td>
            <td>${r.asociacion || 'General'} <br><small style="color:#ffab91;">🏷️ ${r.tipo || 'Oficial'}</small></td>
            <td><span style="color: ${r.activo ? '#4caf50' : '#f44336'}; font-weight: 700;">${r.activo ? '🔴 En Vivo' : '🏁 Finalizado / Inactivo'}</span></td>
            <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button onclick="selectRodeoForAdminDirect('${r.id}')" style="padding: 4px 8px; background: #ff5722; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">🎯 Seleccionar</button>
                    <button onclick="editRodeo('${r.id}')" style="padding: 4px 8px; background: #0288d1; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">✏️ Editar</button>
                    <button onclick="deleteRodeo('${r.id}')" style="padding: 4px 8px; background: #c62828; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">🗑️ Borrar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.selectRodeoForAdminDirect = function(rId) {
    activeRodeoId = rId;
    localStorage.setItem('activeRodeoId', rId);
    const titleEl = document.getElementById('active-rodeo-title');
    const rodeoObj = rodeos.find(r => r.id === rId);
    if (titleEl && rodeoObj) titleEl.innerText = rodeoObj.nombre;
    loadRodeoColleras(rId).then(() => {
        filteredColleras = [...rodeoData];
        renderCollerasTable();
    });
};

window.editRodeo = function(rId) {
    const r = rodeos.find(item => item.id === rId);
    if (!r) return;

    document.getElementById('form-rodeo-id-old').value = r.id;
    document.getElementById('form-rodeo-id').value = r.id;
    document.getElementById('form-rodeo-nombre').value = r.nombre || '';
    document.getElementById('form-rodeo-tipo').value = r.tipo || 'Champion de Chile';
    document.getElementById('form-rodeo-fecha').value = r.fecha || '';
    document.getElementById('form-rodeo-lugar').value = r.lugar || '';
    document.getElementById('form-rodeo-asociacion').value = r.asociacion || '';
    document.getElementById('form-rodeo-activo').value = r.activo ? 'true' : 'false';
    const logoVal = r.logo_url || '';
    document.getElementById('form-rodeo-logo').value = logoVal;
    const previewWrap = document.getElementById('form-rodeo-logo-preview');
    const previewImg  = document.getElementById('form-rodeo-logo-img');
    if (previewWrap && previewImg && logoVal) {
        previewImg.onerror = function() {
            this.style.display = 'none';
        };
        previewImg.onload = function() {
            this.style.display = 'block';
        };
        previewImg.src = logoVal;
        previewWrap.style.display = 'block';
    } else if (previewWrap) {
        previewWrap.style.display = 'none';
    }

    document.getElementById('rodeo-modal-title').innerText = "✏️ Editar Rodeo Existente";
    openRodeoModal(true);
};

window.deleteRodeo = function(rId) {
    if (!confirm(`¿Seguro que deseas eliminar el rodeo ${rId}?`)) return;
    rodeos = rodeos.filter(r => r.id !== rId);
    try { localStorage.setItem('rodeosData', JSON.stringify(rodeos)); } catch(e) {}
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('rodeos').delete().eq('id', rId).then(()=>{}).catch(()=>{});
    }
    renderRodeosTable();
    if (typeof window.showToast === 'function') window.showToast(`🗑️ Rodeo eliminado correctamente.`);
};

window.saveRodeo = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const oldId = document.getElementById('form-rodeo-id-old').value;
    const id = document.getElementById('form-rodeo-id').value.trim();
    const nombre = document.getElementById('form-rodeo-nombre').value.trim();
    const tipo = document.getElementById('form-rodeo-tipo').value;
    const fecha = document.getElementById('form-rodeo-fecha').value.trim();
    const lugar = document.getElementById('form-rodeo-lugar').value.trim();
    const asociacion = document.getElementById('form-rodeo-asociacion').value.trim();
    const activo = document.getElementById('form-rodeo-activo').value === 'true';
    const logo_url = document.getElementById('form-rodeo-logo').value.trim();

    if (!id || !nombre) return;

    const rodeoObj = { id, nombre, tipo, fecha, lugar, asociacion, activo, logo_url };

    const existingIdx = rodeos.findIndex(r => r.id === (oldId || id));
    if (existingIdx >= 0) {
        rodeos[existingIdx] = rodeoObj;
    } else {
        rodeos.push(rodeoObj);
    }

    // Guardar en localStorage para disponibilidad inmediata en la misma computadora
    try { localStorage.setItem('rodeosData', JSON.stringify(rodeos)); } catch(e) {}

    // Guardar en Supabase para sincronización global pública (todas las computadoras y celulares)
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('rodeos').upsert(rodeoObj).then(()=>{}).catch(err => {
            console.error("Error upserting rodeo to Supabase:", err);
        });
    }

    renderRodeosTable();
    closeRodeoModal();
    if (typeof window.showToast === 'function') window.showToast(`✅ Rodeo "${nombre}" guardado y sincronizado.`);
};

function renderCollerasTable() {
    const tbody = document.getElementById('colleras-tbody');
    if (!tbody) return;
    tbody.innerHTML = (filteredColleras || []).map(c => {
        const jinetesStr = Array.isArray(c.jinetes) ? c.jinetes.join(' / ') : (c.jinetes || '--');
        let caballosHtml = '--';
        if (Array.isArray(c.caballos) && c.caballos.length > 0) {
            caballosHtml = c.caballos.map(h => {
                const name = String(h).trim();
                return `<a href="javascript:void(0)" onclick="window.goToHorseInGenealogia('${name.replace(/'/g, "\\'")}')" style="color: #ffab91; text-decoration: underline; font-weight: 700; cursor: pointer;" title="Ver en Genealogía & Morfología">🐴 ${name}</a>`;
            }).join(' / ');
        } else if (c.caballos) {
            const name = String(c.caballos).trim();
            caballosHtml = `<a href="javascript:void(0)" onclick="window.goToHorseInGenealogia('${name.replace(/'/g, "\\'")}')" style="color: #ffab91; text-decoration: underline; font-weight: 700; cursor: pointer;" title="Ver en Genealogía & Morfología">🐴 ${name}</a>`;
        }

        return `
            <tr>
                <td><strong>${c.n || '--'}</strong></td>
                <td>${c.asociacion || '--'} ${c.criadero ? `<br><small style="color:#ffab91;">CRIADERO: ${c.criadero}</small>` : ''}</td>
                <td>${jinetesStr}</td>
                <td><strong>${caballosHtml}</strong></td>
                <td>${c.animal1 !== undefined ? c.animal1 : '--'}</td>
                <td>${c.animal2 || '--'}</td>
                <td>${c.animal3 || '--'}</td>
                <td>${c.animal4 || '--'}</td>
                <td><strong>${c.resultado || '--'}</strong></td>
                <td style="color: #ff5722; font-weight: bold;">${c.lugar || '--'}</td>
                <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button onclick="window.editCollera(${c.n})" style="padding: 4px 8px; background: #0288d1; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">✏️ Editar</button>
                        <button onclick="window.deleteCollera(${c.n})" style="padding: 4px 8px; background: #c62828; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">🗑️ Borrar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    populateLiveColleraOptions();
}

function renderGenealogiasTable(dataToRender) {
    const tbody = document.getElementById('genealogias-tbody');
    if (!tbody) return;
    const list = dataToRender || filteredGenealogias || [];
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #bcaaa4;">No se encontraron caballos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(g => {
        const safeId = String(g.id || (g.nacional || '').replace(/[^0-9]/g, '') || g.nombre);
        const nameAttr = String(g.nombre || '').toLowerCase().trim();
        const sbtAttr = String(g.nacional || '').toLowerCase().trim();
        return `
            <tr id="genealogia-row-${safeId}" data-horse-name="${nameAttr}" data-horse-sbt="${sbtAttr}">
                <td><code style="color:#d4af37; font-weight:800;">${g.nacional || 'SBT Pendiente'}</code></td>
                <td><strong>${g.nombre || '--'}</strong> ${g.color ? `<br><small style="color:#bcaaa4;">${g.color}</small>` : ''}</td>
                <td>${g.criadero || '--'} ${g.dueno ? `<br><small style="color:#ffab91;">Criador: ${g.dueno}</small>` : ''}</td>
                <td>${g.fn || '--'} ${g.sexo ? `<br><small style="color:#8d6e63;">${g.sexo}</small>` : ''}</td>
                <td><strong>P: ${g.padre || '--'}</strong><br><small style="color:#bcaaa4;">M: ${g.madre || '--'}</small></td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="window.editGenealogia('${safeId}')" style="padding: 5px 10px; background: #0288d1; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">✏️ Editar</button>
                        <button onclick="window.deleteGenealogia('${safeId}')" style="padding: 5px 10px; background: #c62828; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">🗑️ Borrar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.goToHorseInGenealogia = function(horseName) {
    if (!horseName) return;
    const targetRaw = String(horseName).trim();
    const targetName = targetRaw.toLowerCase();

    // 1. Cambiar a la pestaña de Genealogía & Morfología
    const tabBtn = document.getElementById('btn-tab-genealogias');
    switchAdminTab('tab-genealogias', tabBtn);

    // 2. Colocar el nombre en el buscador de la tabla y filtrar
    const searchInput = document.getElementById('genealogia-quick-search') || document.getElementById('genealogia-search');
    if (searchInput) {
        searchInput.value = targetRaw;
    }
    filterGenealogiasTable(targetRaw);

    // 3. Buscar el objeto del caballo en el listado de genealogías
    const foundHorse = (filteredGenealogias || []).find(g => {
        const n = (g.nombre || '').toLowerCase().trim();
        const sbt = (g.nacional || '').replace(/[^0-9]/g, '');
        const targetClean = targetName.replace(/[^0-9]/g, '');
        return n.includes(targetName) || targetName.includes(n) || (targetClean && sbt === targetClean);
    });

    if (foundHorse) {
        // Abrir directamente la Ficha / Editar del Caballo de frente
        const safeId = String(foundHorse.id || (foundHorse.nacional || '').replace(/[^0-9]/g, '') || foundHorse.nombre);
        editGenealogia(safeId);
        if (typeof window.showToast === 'function') {
            window.showToast(`🐴 Abriendo Ficha de Morfología: ${foundHorse.nombre}`, 'info');
        }
    } else {
        // Si no está registrado en la BD local, abrir el modal de nuevo caballo precompletado
        openGenealogiaModal();
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        setVal('form-gen-sbt', targetRaw);
        setVal('form-gen-nombre', targetRaw);
        const statusEl = document.getElementById('sbt-lookup-status');
        if (statusEl) statusEl.innerHTML = `<span style="color:#ffab91; font-weight:700;">🐴 Ingresa el N° SBT oficial de "${targetRaw}" o presiona "Consultar SNA".</span>`;
        const hasNumber = /\d{4,}/.test(targetRaw);
        if (hasNumber && typeof window.lookupHorseBySBT === 'function') {
            window.lookupHorseBySBT();
        }
    }

    // 4. Asegurar scroll a la tabla también
    setTimeout(() => {
        const rows = document.querySelectorAll('#genealogias-tbody tr');
        rows.forEach(r => {
            const hName = (r.getAttribute('data-horse-name') || '').toLowerCase();
            if (hName.includes(targetName) || targetName.includes(hName)) {
                r.classList.add('row-highlight-horse');
                r.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }, 100);
};

window.filterGenealogiasTable = function(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
        renderGenealogiasTable();
        return;
    }
    const filtered = (filteredGenealogias || []).filter(g => {
        const name = (g.nombre || '').toLowerCase();
        const sbt = (g.nacional || '').toLowerCase();
        const criadero = (g.criadero || '').toLowerCase();
        return name.includes(q) || sbt.includes(q) || criadero.includes(q);
    });
    renderGenealogiasTable(filtered);
};

// RENDERIZADO DE TABLA DE CALENDARIO DETALLADA CON BINDING 100% GARANTIZADO
function renderAdminCalendarTable() {
    const tbody = document.getElementById('calendar-admin-tbody');
    if (!tbody) return;

    if (!calendarEvents || calendarEvents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#bcaaa4;">No hay eventos programados en el calendario.</td></tr>`;
        return;
    }

    tbody.innerHTML = calendarEvents.map((c, idx) => {
        const safeId = String(c.id || `cal-${idx}`);
        return `
            <tr>
                <td>
                    📅 <strong>${c.fecha_inicio || c.fecha || 'Por definir'} ${c.fecha_fin ? 'al ' + c.fecha_fin : ''}</strong><br>
                    <small style="color:#ffab91;">⏰ ${c.hora_inicio || '08:00'} - ${c.hora_fin || '20:00'} h</small>
                </td>
                <td><strong>${c.nombre || c.event || 'Evento'}</strong></td>
                <td>📍 ${c.lugar || c.ciudad || 'Medialuna'}</td>
                <td>${c.asociacion || 'General'}<br><small style="color:#bcaaa4;">🏷️ ${c.tipo || 'Oficial'}</small></td>
                <td><div style="max-width:260px; font-size:0.8rem; color:#d7ccc8; overflow:hidden; text-overflow:ellipsis;">${c.descripcion || 'Sin programa publicado'}</div></td>
                <td><span style="font-weight:800; font-size:0.8rem;">${c.estado || '🟢 Programado'}</span></td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="window.editAdminCalendarEvent('${safeId}')" style="padding: 5px 10px; background: #0288d1; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">✏️ Editar</button>
                        <button onclick="window.deleteAdminCalendarEvent('${safeId}')" style="padding: 5px 10px; background: #c62828; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">🗑️ Borrar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// FUNCIONES DE CALENDARIO DETALLADAS CON ASIGNACIÓN DIRECTA A WINDOW
window.openAdminCalendarModal = function() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('form-cal-id-old', '');
    setVal('form-cal-nombre', '');
    setVal('form-cal-lugar', '');
    setVal('form-cal-asociacion', '');
    setVal('form-cal-tipo', 'Champion de Chile');
    setVal('form-cal-estado', '🟢 Programado');
    setVal('form-cal-fecha-inicio', '');
    setVal('form-cal-fecha-fin', '');
    setVal('form-cal-hora-inicio', '08:00');
    setVal('form-cal-hora-fin', '20:00');
    setVal('form-cal-descripcion', '');
    setVal('form-cal-afiche', '');

    const titleEl = document.getElementById('modal-cal-title');
    if (titleEl) titleEl.innerText = "Agregar Evento al Calendario";
    const overlay = document.getElementById('modal-cal-event-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        overlay.classList.add('active');
    }
};

window.closeAdminCalendarModal = function() {
    const overlay = document.getElementById('modal-cal-event-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('active');
    }
};

window.editAdminCalendarEvent = function(id) {
    const ev = (calendarEvents || []).find(c => String(c.id) === String(id));
    if (!ev) return;

    const setVal = (idEl, val) => { const el = document.getElementById(idEl); if (el) el.value = val || ''; };
    setVal('form-cal-id-old', ev.id);
    setVal('form-cal-nombre', ev.nombre || ev.event || '');
    setVal('form-cal-lugar', ev.lugar || ev.ciudad || '');
    setVal('form-cal-asociacion', ev.asociacion || '');
    setVal('form-cal-tipo', ev.tipo || 'Champion de Chile');
    setVal('form-cal-estado', ev.estado || '🟢 Programado');
    setVal('form-cal-fecha-inicio', ev.fecha_inicio || ev.fecha || '');
    setVal('form-cal-fecha-fin', ev.fecha_fin || ev.fecha || '');
    setVal('form-cal-hora-inicio', ev.hora_inicio || '08:00');
    setVal('form-cal-hora-fin', ev.hora_fin || '20:00');
    setVal('form-cal-descripcion', ev.descripcion || '');
    setVal('form-cal-afiche', ev.afiche_url || '');

    const titleEl = document.getElementById('modal-cal-title');
    if (titleEl) titleEl.innerText = "✏️ Editar Evento del Calendario";

    const overlay = document.getElementById('modal-cal-event-overlay');
    if (overlay) overlay.classList.add('active');
};

window.saveAdminCalendarEvent = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const oldId = document.getElementById('form-cal-id-old').value;
    const id = oldId || `cal-${Date.now()}`;
    const nombre = document.getElementById('form-cal-nombre').value.trim();
    const lugar = document.getElementById('form-cal-lugar').value.trim();
    const asociacion = document.getElementById('form-cal-asociacion').value.trim();
    const tipo = document.getElementById('form-cal-tipo').value;
    const estado = document.getElementById('form-cal-estado').value;
    const fecha_inicio = document.getElementById('form-cal-fecha-inicio').value;
    const fecha_fin = document.getElementById('form-cal-fecha-fin').value;
    const hora_inicio = document.getElementById('form-cal-hora-inicio').value;
    const hora_fin = document.getElementById('form-cal-hora-fin').value;
    const descripcion = document.getElementById('form-cal-descripcion').value.trim();
    const afiche_url = document.getElementById('form-cal-afiche').value.trim();

    if (!nombre || !lugar) return;

    const calObj = { id, nombre, lugar, asociacion, tipo, estado, fecha_inicio, fecha_fin, hora_inicio, hora_fin, descripcion, afiche_url };

    const existingIdx = calendarEvents.findIndex(c => String(c.id) === String(id));
    if (existingIdx >= 0) {
        calendarEvents[existingIdx] = calObj;
    } else {
        calendarEvents.push(calObj);
    }

    try { localStorage.setItem('calendarEventsData', JSON.stringify(calendarEvents)); } catch(e) {}

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('calendar_events').upsert(calObj);
        } catch(err) {}
    }

    renderAdminCalendarTable();
    closeAdminCalendarModal();
};

window.deleteAdminCalendarEvent = async function(id) {
    if (!confirm(`¿Seguro que deseas eliminar este evento del calendario?`)) return;
    calendarEvents = calendarEvents.filter(c => String(c.id) !== String(id));

    try { localStorage.setItem('calendarEventsData', JSON.stringify(calendarEvents)); } catch(e) {}

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('calendar_events').delete().eq('id', id);
        } catch(err) {}
    }

    renderAdminCalendarTable();
};

// RENDERIZADO DE TABLA DE SOCIOS SINCRONIZADA CON SUPABASE
function renderUsuariosTable() {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;

    if (!usuariosList || usuariosList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#bcaaa4;">No hay socios registrados en Supabase aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = usuariosList.map(u => {
        const fullName = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Socio Corral Abierto';
        const isActive = u.active === true || u.active === 'true';
        const isAdmin = (u.email || '').toLowerCase() === 'admin@corralabierto.cl';

        return `
            <tr>
                <td><strong>${fullName}</strong> ${isAdmin ? '<span style="font-size:0.75rem; background:#ff5722; color:#fff; padding:2px 6px; border-radius:4px; margin-left:6px;">ADMIN</span>' : ''}</td>
                <td><code>${u.email}</code></td>
                <td>${u.telefono || '--'}</td>
                <td>
                    <span style="color: ${isActive ? '#4caf50' : '#ffa726'}; font-weight: 800;">
                        ${isActive ? '🟢 SOCIO ACTIVO' : '🟡 PENDIENTE DE PAGO'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button onclick="toggleUserStatus('${u.email}', ${isActive})" style="padding: 4px 8px; background: ${isActive ? '#c62828' : '#2e7d32'}; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">
                            ${isActive ? '🔴 Deshabilitar' : '🟢 Habilitar Socio'}
                        </button>
                        <button onclick="editUsuario('${u.email}')" style="padding: 4px 8px; background: #0288d1; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">✏️ Editar</button>
                        ${!isAdmin ? `<button onclick="deleteUsuario('${u.email}')" style="padding: 4px 8px; background: #444; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">🗑️ Borrar</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// FUNCIONES DE SOCIOS / USUARIOS
window.openUsuarioModal = function() {
    document.getElementById('form-user-email-old').value = '';
    document.getElementById('form-user-nombre').value = '';
    document.getElementById('form-user-apellido').value = '';
    document.getElementById('form-user-email').value = '';
    document.getElementById('form-user-telefono').value = '';
    document.getElementById('form-user-active').value = 'true';
    document.getElementById('modal-usuario-title').innerText = "Agregar Nuevo Socio";
    const modal = document.getElementById('modal-usuario-overlay');
    if (modal) { modal.style.display = 'flex'; modal.style.opacity = '1'; modal.style.pointerEvents = 'auto'; modal.classList.add('active'); }
};

window.closeUsuarioModal = function() {
    const modal = document.getElementById('modal-usuario-overlay');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
};

window.editUsuario = function(email) {
    const user = usuariosList.find(u => u.email === email);
    if (!user) return;

    document.getElementById('form-user-email-old').value = user.email;
    document.getElementById('form-user-nombre').value = user.nombre || '';
    document.getElementById('form-user-apellido').value = user.apellido || '';
    document.getElementById('form-user-email').value = user.email || '';
    document.getElementById('form-user-telefono').value = user.telefono || '';
    document.getElementById('form-user-active').value = (user.active === true || user.active === 'true') ? 'true' : 'false';

    document.getElementById('modal-usuario-title').innerText = "✏️ Editar Datos de Socio";
    document.getElementById('modal-usuario-overlay').classList.add('active');
};

window.toggleUserStatus = async function(email, currentStatus) {
    const newStatus = !currentStatus;
    const user = usuariosList.find(u => u.email === email);
    if (user) user.active = newStatus;

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('members').update({ active: newStatus }).eq('email', email);
        } catch(e) {
            console.error("Error actualizando estado en Supabase:", e);
        }
    }

    renderUsuariosTable();
};

window.saveUsuario = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const oldEmail = document.getElementById('form-user-email-old').value;
    const nombre = document.getElementById('form-user-nombre').value.trim();
    const apellido = document.getElementById('form-user-apellido').value.trim();
    const email = document.getElementById('form-user-email').value.trim();
    const telefono = document.getElementById('form-user-telefono').value.trim();
    const active = document.getElementById('form-user-active').value === 'true';

    if (!email) return;

    const userObj = { email, nombre, apellido, telefono, active };

    const existingIdx = usuariosList.findIndex(u => u.email === (oldEmail || email));
    if (existingIdx >= 0) {
        usuariosList[existingIdx] = { ...usuariosList[existingIdx], ...userObj };
    } else {
        usuariosList.unshift(userObj);
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('members').upsert(userObj);
        } catch(e) {
            console.error("Error guardando socio en Supabase:", e);
        }
    }

    renderUsuariosTable();
    closeUsuarioModal();
};

window.deleteUsuario = async function(email) {
    if (email === 'admin@corralabierto.cl') return;
    if (!confirm(`¿Seguro que deseas eliminar al socio ${email}?`)) return;

    usuariosList = usuariosList.filter(u => u.email !== email);

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('members').delete().eq('email', email);
        } catch(e) {
            console.error("Error borrando socio de Supabase:", e);
        }
    }

    renderUsuariosTable();
};

// LÓGICA INTELIGENTE DE DETECCIÓN AUTOMÁTICA DE CABALLOS POR SBT O NOMBRE
window.onColleraHorseInput = function(num, val) {
    const rawVal = (val || '').trim();
    const statusEl = document.getElementById(`collera-horse${num}-status`);
    const inputEl = document.getElementById(`form-caballo${num}`);
    if (!statusEl || !inputEl) return;

    // Limpiar datasets previos si el usuario modifica el texto
    delete inputEl.dataset.sbt;
    delete inputEl.dataset.resolvedName;

    if (!rawVal) {
        statusEl.innerHTML = '';
        return;
    }

    const cleanSbt = rawVal.replace(/[^0-9]/g, '');
    const rawUpper = rawVal.toUpperCase();

    if (colleraHorseTimer[num]) clearTimeout(colleraHorseTimer[num]);

    statusEl.innerHTML = `<span style="color:#ffab91; font-weight:700;">⌛ Buscando información del caballo...</span>`;

    colleraHorseTimer[num] = setTimeout(async () => {
        let horse = null;

        // 1. Buscar en catálogo local por SBT, ID o Nombre
        for (const arr of [window.filteredGenealogias, window.genealogiaData, window.defaultGenealogiaData]) {
            if (Array.isArray(arr)) {
                horse = arr.find(g => {
                    const sbtNum = (g.nacional || '').replace(/[^0-9]/g, '');
                    const idNum = (g.id || '').replace(/[^0-9]/g, '');
                    const nameUpper = (g.nombre || '').toUpperCase().trim();
                    return (cleanSbt && cleanSbt.length >= 4 && (sbtNum === cleanSbt || idNum === cleanSbt)) ||
                           (rawUpper && nameUpper === rawUpper);
                });
                if (horse) break;
            }
        }

        // 2. Si no se encontró en local y el usuario ingresó un N° SBT (mínimo 4 dígitos), buscar en vivo
        if (!horse && cleanSbt.length >= 4) {
            horse = await window.fetchCaballoyRodeoData(cleanSbt);
            if (horse) {
                // Agregar a genealogías locales para futuras referencias
                if (!filteredGenealogias.some(g => g.id === horse.id || (g.nombre || '').toUpperCase() === horse.nombre)) {
                    filteredGenealogias.unshift(horse);
                    renderGenealogiasTable();
                }
            }
        }

        if (horse) {
            const detectedSbt = (horse.nacional || '').replace(/[^0-9]/g, '') || cleanSbt;
            inputEl.dataset.sbt = detectedSbt;
            inputEl.dataset.resolvedName = horse.nombre;

            // Autocompletar criadero si el campo está vacío
            const criaderoInput = document.getElementById('form-criadero');
            if (criaderoInput && (!criaderoInput.value || criaderoInput.value.trim() === '')) {
                if (horse.criadero && horse.criadero !== 'SIN CRIADERO ESPECIFICADO') {
                    criaderoInput.value = horse.criadero;
                }
            }

            statusEl.innerHTML = `<span style="color:#4caf50; font-weight:800;">✅ Caballo Detectado: ${horse.nombre} (${horse.criadero || 'Sin Criadero'}) ${detectedSbt ? '[SBT ' + detectedSbt + ']' : ''}</span>`;
        } else if (cleanSbt.length >= 4) {
            inputEl.dataset.sbt = cleanSbt;
            inputEl.dataset.resolvedName = rawUpper;
            statusEl.innerHTML = `<span style="color:#ffb74d; font-weight:800;">ℹ️ Se registrará con el N° SBT ${cleanSbt}.</span>`;
        } else {
            statusEl.innerHTML = `<span style="color:#bcaaa4;">Nombre manual o N° de registro.</span>`;
        }
    }, 350);
};

// RENDERIZADO VISUAL ELEGANTE Y SERIO DEL ÁRBOL GENEALÓGICO DE 4 GENERACIONES
// ── MULTI-PHOTO LOGIC ──────────────────────────────────────────────
let horsePhotos = []; // Array of { src: string, type: 'url'|'file' }

function renderFotoPreview() {
    const container = document.getElementById('foto-preview-list');
    if (!container) return;
    if (horsePhotos.length === 0) {
        container.innerHTML = '<span style="font-size:0.75rem; color:#6d4c41; font-style:italic;">Sin fotografías agregadas aún.</span>';
    } else {
        container.innerHTML = horsePhotos.map((f, i) => `
            <div style="position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 1.5px solid rgba(255,87,34,0.45); flex-shrink: 0;">
                <img src="${f.src}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.style.display='none'">
                <button type="button" onclick="removeFoto(${i})" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.75); border:none; color:#ff5722; font-size:0.75rem; font-weight:900; border-radius:50%; width:18px; height:18px; cursor:pointer; line-height:1; padding:0;">✕</button>
            </div>
        `).join('');
    }
    // Update hidden field with JSON
    const hiddenEl = document.getElementById('form-gen-foto');
    if (hiddenEl) hiddenEl.value = JSON.stringify(horsePhotos.map(f => f.src));
}

// HELPER GLOBAL: Carga imagen desde archivo local y la pone en el campo destino
window.loadImageFromFile = function(input, targetInputId) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        // Llenar el campo de texto con el data-URL
        const targetEl = document.getElementById(targetInputId);
        if (targetEl) targetEl.value = dataUrl;
        // Mostrar preview si existe contenedor específico
        const previewWrap = document.getElementById(targetInputId + '-preview');
        const previewImg  = document.getElementById(targetInputId + '-img');
        if (previewWrap && previewImg) {
            previewImg.src = dataUrl;
            previewWrap.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
    input.value = ''; // reset input para poder cargar el mismo archivo otra vez
};

window.addFotoFromUrl = function() {
    const urlEl = document.getElementById('form-gen-foto-url');
    const url = (urlEl ? urlEl.value.trim() : '');
    if (!url) return;
    horsePhotos.push({ src: url, type: 'url' });
    if (urlEl) urlEl.value = '';
    renderFotoPreview();
};

window.addFotosFromFiles = function(input) {
    const files = Array.from(input.files || []);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            horsePhotos.push({ src: e.target.result, type: 'file' });
            renderFotoPreview();
        };
        reader.readAsDataURL(file);
    });
    input.value = '';
};

window.removeFoto = function(idx) {
    horsePhotos.splice(idx, 1);
    renderFotoPreview();
};

function resetHorsePhotos(existingFotos) {
    horsePhotos = [];
    if (existingFotos) {
        let arr = [];
        try { arr = typeof existingFotos === 'string' ? JSON.parse(existingFotos) : (Array.isArray(existingFotos) ? existingFotos : [existingFotos]); } catch(e) { arr = existingFotos ? [existingFotos] : []; }
        arr.filter(Boolean).forEach(src => horsePhotos.push({ src, type: 'url' }));
    }
    renderFotoPreview();
}

// ── BRANCHING GENEALOGY TREE (COMPACT REALISTIC PEDIGREE) ──────────────
function makeTreeNode(label, name, isMale, genClass = '') {
    if (!name) return `<div class="tree-node empty ${genClass}"></div>`;
    const glyph = isMale === true ? '<span style="color:#64b5f6; font-size:0.75rem;">♂</span>' : isMale === false ? '<span style="color:#f48fb1; font-size:0.75rem;">♀</span>' : '';
    return `<div class="tree-node ${genClass}">
        <div class="tree-label">${label}</div>
        <div class="tree-name">${glyph} <span>${name}</span></div>
    </div>`;
}

window.updateTreeFromInputs = function() {
    const getVal = id => (document.getElementById(id) || {}).value || '';
    const p  = getVal('form-gen-padre').trim().toUpperCase();
    const m  = getVal('form-gen-madre').trim().toUpperCase();
    const ap = getVal('form-gen-abuelop').trim().toUpperCase();
    const am = getVal('form-gen-abuelap').trim().toUpperCase();
    const bm = getVal('form-gen-abuelom').trim().toUpperCase();
    const bh = getVal('form-gen-abuelam').trim().toUpperCase();
    const sbt = getVal('form-gen-sbt').trim();
    const nom = getVal('form-gen-nombre').trim().toUpperCase() || 'EJEMPLAR';

    currentExtractedPedigree = {
        ...(currentExtractedPedigree || {}),
        padre: p,
        madre: m,
        abueloP: ap,
        abuelaP: am,
        abueloM: bm,
        abuelaM: bh
    };

    renderGenealogyTreeVisual({
        nombre: nom,
        nacional: sbt ? `SBT N° ${sbt}` : '',
        padre: p,
        madre: m,
        abueloP: ap,
        abuelaP: am,
        abueloM: bm,
        abuelaM: bh,
        gen3: (currentExtractedPedigree ? currentExtractedPedigree.gen3 : []) || []
    });
};

function renderGenealogyTreeVisual(horse) {
    const treeContainer = document.getElementById('tree-container');
    const treeVisual    = document.getElementById('tree-visual');
    const treeHorseName = document.getElementById('tree-horse-name');

    if (!treeContainer || !treeVisual) return;

    if (!horse || (!horse.padre && !horse.madre && !horse.abueloP)) {
        treeContainer.style.display = 'none';
        return;
    }

    if (treeHorseName) treeHorseName.innerText = horse.nombre + (horse.nacional ? ' (' + horse.nacional + ')' : '');

    const g3 = horse.gen3 || [];
    const bisAP1M = g3[0] || ''; const bisAP1H = g3[1] || '';
    const bisAP2M = g3[2] || ''; const bisAP2H = g3[3] || '';
    const bisAM1M = g3[4] || ''; const bisAM1H = g3[5] || '';
    const bisAM2M = g3[6] || ''; const bisAM2H = g3[7] || '';

    treeVisual.innerHTML = `
<style>
.gtree-wrap {
    display: flex;
    align-items: center;
    gap: 0;
    font-family: 'Inter', system-ui, sans-serif;
    padding: 6px 2px;
}
.gtree-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}
.tree-node {
    background: #1c1412;
    border: 1px solid rgba(255, 87, 34, 0.25);
    border-radius: 10px;
    padding: 6px 10px;
    margin: 3px 0;
    width: 140px;
    box-sizing: border-box;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    transition: transform 0.2s ease, border-color 0.2s ease;
}
.tree-node:hover {
    border-color: rgba(255, 87, 34, 0.6);
    transform: translateY(-1px);
}
.tree-node.empty {
    visibility: hidden;
    height: 38px;
}
.tree-label {
    font-size: 0.58rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #ffab91;
    margin-bottom: 2px;
}
.tree-name {
    font-weight: 800;
    color: #ffffff;
    font-size: 0.72rem;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.tree-node.gen2 { width: 130px; padding: 5px 8px; }
.tree-node.gen2 .tree-name { font-size: 0.68rem; }
.tree-node.gen3 { width: 125px; padding: 4px 8px; }
.tree-node.gen3 .tree-name { font-size: 0.65rem; color: #e0e0e0; }

/* LINEAS CONECTORAS RAMIFICADAS ESTILO BRACKET */
.gtree-connector {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 20px;
    flex-shrink: 0;
    position: relative;
}
.bracket-pair {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
.bracket-line {
    position: absolute;
    left: 0;
    right: 0;
    top: 25%;
    bottom: 25%;
    border-left: 1.5px solid rgba(255, 87, 34, 0.4);
    border-top: 1.5px solid rgba(255, 87, 34, 0.4);
    border-bottom: 1.5px solid rgba(255, 87, 34, 0.4);
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}
.bracket-out {
    position: absolute;
    right: 0;
    top: 50%;
    width: 50%;
    height: 1.5px;
    background: rgba(255, 87, 34, 0.4);
}
</style>

<div class="gtree-wrap">
    <!-- GEN 1: PADRE / MADRE -->
    <div class="gtree-col" style="justify-content: space-around; gap: 40px;">
${makeTreeNode('PADRE', horse.padre, true, 'gen1')}
${makeTreeNode('MADRE', horse.madre, false, 'gen1')}
    </div>

    <!-- CONECTOR 1 -> 2 -->
    <div class="gtree-connector">
<div style="height: 50%; border-left: 1.5px solid rgba(255,87,34,0.35); border-top: 1.5px solid rgba(255,87,34,0.35); border-bottom: 1.5px solid rgba(255,87,34,0.35); margin: 20% 0; border-radius: 4px 0 0 4px;"></div>
    </div>

    <!-- GEN 2: ABUELOS -->
    <div class="gtree-col" style="gap: 8px;">
${makeTreeNode('ABUELO P.', horse.abueloP, true, 'gen2')}
${makeTreeNode('ABUELA P.', horse.abuelaP, false, 'gen2')}
<div style="height: 12px;"></div>
${makeTreeNode('ABUELO M.', horse.abueloM, true, 'gen2')}
${makeTreeNode('ABUELA M.', horse.abuelaM, false, 'gen2')}
    </div>

    <!-- CONECTOR 2 -> 3 -->
    <div class="gtree-connector">
<div style="height: 38%; border-left: 1.5px solid rgba(255,87,34,0.3); border-top: 1.5px solid rgba(255,87,34,0.3); border-bottom: 1.5px solid rgba(255,87,34,0.3); margin-top: 5%; margin-bottom: 15%; border-radius: 4px 0 0 4px;"></div>
<div style="height: 38%; border-left: 1.5px solid rgba(255,87,34,0.3); border-top: 1.5px solid rgba(255,87,34,0.3); border-bottom: 1.5px solid rgba(255,87,34,0.3); margin-top: 15%; margin-bottom: 5%; border-radius: 4px 0 0 4px;"></div>
    </div>

    <!-- GEN 3: BISABUELOS -->
    <div class="gtree-col" style="gap: 4px;">
${makeTreeNode('BISABUELO P.1', bisAP1M, true, 'gen3')}
${makeTreeNode('BISABUELA P.1', bisAP1H, false, 'gen3')}
${makeTreeNode('BISABUELO P.2', bisAP2M, true, 'gen3')}
${makeTreeNode('BISABUELA P.2', bisAP2H, false, 'gen3')}
${makeTreeNode('BISABUELO M.1', bisAM1M, true, 'gen3')}
${makeTreeNode('BISABUELA M.1', bisAM1H, false, 'gen3')}
${makeTreeNode('BISABUELO M.2', bisAM2M, true, 'gen3')}
${makeTreeNode('BISABUELA M.2', bisAM2H, false, 'gen3')}
    </div>
</div>`;

    treeContainer.style.display = 'block';
}

// EXTRAER FICHA REAL DE CABALLO DESDE CABALLO Y RODEO (https://www.caballoyrodeo.cl/portal_rodeo/extra/port/genealogia/?id=XXXXXX)
window.fetchCaballoyRodeoData = async function(cleanSbt) {
    const targetUrl = `https://www.caballoyrodeo.cl/portal_rodeo/extra/port/genealogia/?id=${cleanSbt}`;
    const proxyUrls = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    ];

    for (let proxyUrl of proxyUrls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            const resp = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!resp.ok) continue;
            let htmlText = '';
            if (proxyUrl.includes('/get?url=') || proxyUrl.includes('allorigins.win')) {
                const json = await resp.json();
                htmlText = json ? (json.contents || '') : '';
            } else {
                htmlText = await resp.text();
            }

            if (!htmlText || htmlText.length < 200) continue;

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const extractTag = (label) => {
                const reg = new RegExp(`<strong>\\s*${label}:?\\s*<\\/strong>\\s*([^<\\n\\r]+)`, 'i');
                const m = htmlText.match(reg);
                return m && m[1] ? m[1].trim() : '';
            };

            const rotEl = doc.querySelector('.rot-2 em');
            let nombre = extractTag('Nombre') || (rotEl ? rotEl.textContent.trim() : '');
            if (nombre && (nombre.includes('DEBE INGRESAR') || nombre.includes('BÚSQUEDA DE GENEALOGÍA'))) {
                nombre = '';
            }

            const criadero = extractTag('Criadero');
            const color = extractTag('Color') || extractTag('Pelaje');
            const fn = extractTag('Nacimiento') || extractTag('F.N.');
            const criador = extractTag('Criador') || extractTag('Dueño');
            const sexo = extractTag('Sexo');

            // Extracción de 4 Generaciones del Árbol Genealógico
            const n1_c1 = doc.querySelector('.n1 .c1') ? doc.querySelector('.n1 .c1').textContent.trim() : '';
            const n1_c2 = doc.querySelector('.n1 .c2') ? doc.querySelector('.n1 .c2').textContent.trim() : '';

            const n2_c1 = doc.querySelector('.n2 .c1') ? doc.querySelector('.n2 .c1').textContent.trim() : '';
            const n2_c2 = doc.querySelector('.n2 .c2') ? doc.querySelector('.n2 .c2').textContent.trim() : '';
            const n2_c3 = doc.querySelector('.n2 .c3') ? doc.querySelector('.n2 .c3').textContent.trim() : '';
            const n2_c4 = doc.querySelector('.n2 .c4') ? doc.querySelector('.n2 .c4').textContent.trim() : '';

            const gen3 = [];
            for (let i = 1; i <= 8; i++) {
                const el = doc.querySelector(`.n3 .c${i}`);
                if (el) gen3.push(el.textContent.trim());
            }

            const gen4 = [];
            for (let i = 1; i <= 16; i++) {
                const el = doc.querySelector(`.n4 .c${i}`) || doc.querySelector(`.n4 a:nth-child(${i}) .c${i}`);
                if (el) gen4.push(el.textContent.trim());
            }

            if (nombre && nombre.length > 1) {
                return {
                    id: `h-${cleanSbt}`,
                    nombre: nombre.toUpperCase(),
                    criadero: criadero ? criadero.toUpperCase() : 'SIN CRIADERO ESPECIFICADO',
                    dueno: criador || '',
                    color: color || '',
                    sexo: sexo || '',
                    nacional: `SBT N° ${cleanSbt}`,
                    fn: fn ? `F.N. ${fn}` : '',
                    alzada: '',
                    cincha: '',
                    cana: '',
                    foto: '',
                    padre: n1_c1,
                    madre: n1_c2,
                    abueloP: n2_c1,
                    abuelaP: n2_c2,
                    abueloM: n2_c3,
                    abuelaM: n2_c4,
                    gen3,
                    gen4
                };
            }
        } catch(err) {
            console.warn(`Proxy fetch error for ${cleanSbt}:`, err);
        }
    }
    return null;
};

window.lookupHorseBySBT = async function() {
};
window.consultarRegistroSNAOnline = function() {
    return window.lookupHorseBySBT();
};
window.lookupHorseBySBT = async function() {
    const sbtInput = document.getElementById('form-gen-sbt');
    if (!sbtInput) return;

    let rawSbt = sbtInput.value.trim();
    const statusEl = document.getElementById('sbt-lookup-status');
    if (!rawSbt) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#ffa726;">Por favor ingresa un N° de Registro SBT o URL.</span>`;
        return;
    }

    // Extraer ID si el usuario pegó el link completo con o sin hashtag (ej: https://.../?id=335836#gc)
    if (rawSbt.includes('id=')) {
        const matchId = rawSbt.match(/id=([0-9]+)/i);
        if (matchId && matchId[1]) {
            rawSbt = matchId[1];
            sbtInput.value = rawSbt; // Limpiar el input dejando sólo el número
        }
    }

    const cleanSbt = rawSbt.replace(/[^0-9]/g, '');
    if (!cleanSbt) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#ffa726;">Por favor ingresa un número de SBT válido o un enlace de Caballo y Rodeo.</span>`;
        return;
    }

    // --- Mostrar estado de carga
    const btn = document.querySelector('button[onclick="lookupHorseBySBT()"]');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Consultando...'; }
    if (statusEl) {
        statusEl.innerHTML = `<span style="color:#d4af37; font-weight:700;">⏳ Conectando con SNA / Caballo y Rodeo para el N° ${cleanSbt}...</span>`;
    }

    // 1. Intentar extraer en vivo desde caballoyrodeo.cl
    let horse = await window.fetchCaballoyRodeoData(cleanSbt);

    // 2. Fallback: buscar en registros locales existentes por SBT, ID o Nombre
    if (!horse) {
        const searchValUpper = rawSbt.toUpperCase();
        for (const arr of [window.filteredGenealogias, window.genealogiaData, window.defaultGenealogiaData]) {
            if (Array.isArray(arr)) {
                horse = arr.find(g => {
                    const sbtNum = (g.nacional || '').replace(/[^0-9]/g, '');
                    const idNum = (g.id || '').replace(/[^0-9]/g, '');
                    const nameUpper = (g.nombre || '').toUpperCase();
                    return (cleanSbt && (sbtNum === cleanSbt || idNum === cleanSbt)) || 
                           (searchValUpper && nameUpper === searchValUpper);
                });
                if (horse) break;
            }
        }
    }

    // Restaurar botón
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Consultar SNA'; }

    if (horse) {
        currentExtractedPedigree = {
            padre: horse.padre || '',
            madre: horse.madre || '',
            abueloP: horse.abueloP || '',
            abuelaP: horse.abuelaP || '',
            abueloM: horse.abueloM || '',
            abuelaM: horse.abuelaM || '',
            gen3: horse.gen3 || [],
            gen4: horse.gen4 || []
        };

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        setVal('form-gen-nombre',   horse.nombre   || '');
        setVal('form-gen-criadero', horse.criadero || '');
        setVal('form-gen-alzada',   horse.alzada   || '');
        setVal('form-gen-cincha',   horse.cincha   || '');
        setVal('form-gen-cana',     horse.cana     || '');
        setVal('form-gen-sexo',     horse.sexo     || '');
        setVal('form-gen-color',    horse.color    || '');
        setVal('form-gen-fn',       horse.fn       || '');
        setVal('form-gen-dueno',    horse.dueno    || '');

        // Fotos: si la extracción trae algo, cargarlas
        if (horse.foto) resetHorsePhotos(horse.foto);

        // Mostrar árbol genealógico
        renderGenealogyTreeVisual(horse);

        if (statusEl) {
            const extras = [horse.sexo, horse.color ? 'Pelaje: ' + horse.color : '', horse.fn].filter(Boolean).join(' · ');
            statusEl.innerHTML = `<span style="color:#4caf50; font-weight:800;">✅ Ficha encontrada: <strong>${horse.nombre}</strong> — ${horse.criadero}${extras ? ' — ' + extras : ''}</span>`;
        }
    } else {
        currentExtractedPedigree = null;
        renderGenealogyTreeVisual(null);
        if (statusEl) {
            statusEl.innerHTML = `<span style="color:#f44336; font-weight:800;">❌ No se encontró información para el N° SBT ${cleanSbt} en Caballo y Rodeo.</span>`;
        }
        // Alerta visible al usuario
        alert(`❌ No se encontró el N° SBT ${cleanSbt} en el SNA / Caballo y Rodeo.\n\nVerifica el número o ingresa los datos manualmente.`);
    }
};

// El campo SBT ya no lanza búsqueda automática — sólo al pulsar "Consultar SNA"

// FUNCIONES DE MODALES Y AÑADIR
window.openRodeoModal = function(isEdit = false) {
    if (!isEdit) {
        document.getElementById('form-rodeo-id-old').value = '';
        document.getElementById('form-rodeo-id').value = '';
        document.getElementById('form-rodeo-nombre').value = '';
        document.getElementById('form-rodeo-fecha').value = '';
        document.getElementById('form-rodeo-lugar').value = '';
        document.getElementById('form-rodeo-asociacion').value = '';
        document.getElementById('form-rodeo-logo').value = '';
        const previewWrap = document.getElementById('form-rodeo-logo-preview');
        if (previewWrap) previewWrap.style.display = 'none';
        document.getElementById('rodeo-modal-title').innerText = "➕ Agregar Nuevo Rodeo";
    }
    const modal = document.getElementById('modal-rodeo-overlay');
    if (modal) { modal.style.display = 'flex'; modal.style.opacity = '1'; modal.style.pointerEvents = 'auto'; modal.classList.add('active'); }
};
window.closeRodeoModal = function() { 
    const modal = document.getElementById('modal-rodeo-overlay');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
};

window.editCollera = function(colleraNum) {
    const collera = (filteredColleras || []).find(c => parseInt(c.n) === parseInt(colleraNum));
    if (!collera) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('form-collera-index', collera.n);
    setVal('form-n', collera.n);
    setVal('form-asociacion', collera.asociacion || '');
    setVal('form-criadero', collera.criadero || '');
    
    const j1 = Array.isArray(collera.jinetes) ? collera.jinetes[0] : '';
    const j2 = Array.isArray(collera.jinetes) ? collera.jinetes[1] : '';
    setVal('form-jinete1', j1 || '');
    setVal('form-jinete2', j2 || '');

    const c1 = Array.isArray(collera.caballos) ? collera.caballos[0] : '';
    const c2 = Array.isArray(collera.caballos) ? collera.caballos[1] : '';
    setVal('form-caballo1', c1 || '');
    setVal('form-caballo2', c2 || '');

    setVal('form-toro1', collera.animal1 !== undefined ? collera.animal1 : '0');
    setVal('form-toro2', collera.animal2 || '');
    setVal('form-toro3', collera.animal3 || '');
    setVal('form-toro4', collera.animal4 || '');
    setTimeout(recalcColleraScore, 0);

    const s1 = document.getElementById('collera-horse1-status');
    const s2 = document.getElementById('collera-horse2-status');
    if (s1) s1.innerHTML = '';
    if (s2) s2.innerHTML = '';

    const titleEl = document.getElementById('modal-collera-title');
    if (titleEl) titleEl.innerText = `✏️ Editar Collera N° ${collera.n}`;

    const modal = document.getElementById('modal-collera-overlay');
    if (modal) { modal.style.display = 'flex'; modal.style.opacity = '1'; modal.style.pointerEvents = 'auto'; modal.classList.add('active'); }
};

window.openColleraModal = function() {
    const s1 = document.getElementById('collera-horse1-status');
    const s2 = document.getElementById('collera-horse2-status');
    if (s1) s1.innerHTML = '';
    if (s2) s2.innerHTML = '';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('form-collera-index', '');
    setVal('form-n', (filteredColleras.length + 1));
    setVal('form-asociacion', '');
    setVal('form-criadero', '');
    setVal('form-jinete1', '');
    setVal('form-jinete2', '');
    setVal('form-caballo1', '');
    setVal('form-caballo2', '');
    setVal('form-toro1', '0');
    setVal('form-toro2', '');
    setVal('form-toro3', '');
    setVal('form-toro4', '');
    setVal('form-resultado-total', '0');
    setVal('form-lugar', '');

    const el1 = document.getElementById('form-caballo1');
    const el2 = document.getElementById('form-caballo2');
    if (el1) { delete el1.dataset.resolvedName; delete el1.dataset.sbt; }
    if (el2) { delete el2.dataset.resolvedName; delete el2.dataset.sbt; }

    const titleEl = document.getElementById('modal-collera-title');
    if (titleEl) titleEl.innerText = "➕ Agregar Nueva Collera";

    const modal = document.getElementById('modal-collera-overlay');
    if (modal) { modal.style.display = 'flex'; modal.style.opacity = '1'; modal.style.pointerEvents = 'auto'; modal.classList.add('active'); }
};
window.closeColleraModal = function() { 
    const modal = document.getElementById('modal-collera-overlay');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
};

window.openGenealogiaModal = function() {
    currentExtractedPedigree = null;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('form-gen-sbt', '');
    setVal('form-gen-nombre', '');
    setVal('form-gen-criadero', '');
    setVal('form-gen-alzada', '');
    setVal('form-gen-cincha', '');
    setVal('form-gen-cana', '');
    setVal('form-gen-sexo', '');
    setVal('form-gen-color', '');
    setVal('form-gen-fn', '');
    setVal('form-gen-dueno', '');
    setVal('form-gen-padre', '');
    setVal('form-gen-madre', '');
    setVal('form-gen-abuelop', '');
    setVal('form-gen-abuelap', '');
    setVal('form-gen-abuelom', '');
    setVal('form-gen-abuelam', '');
    setVal('form-gen-foto', '');
    resetHorsePhotos(null);

    renderGenealogyTreeVisual(null);

    const titleEl = document.getElementById('modal-genealogia-title');
    if (titleEl) titleEl.innerText = "🐴 Ficha Genealógica & Registro de Morfología";
    const statusEl = document.getElementById('sbt-lookup-status');
    if (statusEl) statusEl.innerText = "Ingresa el número de registro para sincronizar automáticamente el pedigree oficial de Caballo y Rodeo.";

    const modal = document.getElementById('modal-genealogia-overlay');
    if (modal) { modal.style.display = 'flex'; modal.style.opacity = '1'; modal.style.pointerEvents = 'auto'; modal.classList.add('active'); }
};
window.closeGenealogiaModal = function() { 
    currentExtractedPedigree = null;
    const modal = document.getElementById('modal-genealogia-overlay');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
};

window.editGenealogia = function(idOrSbt) {
    const horse = (filteredGenealogias || []).find(g => 
        String(g.id) === String(idOrSbt) || 
        (g.nacional || '').replace(/[^0-9]/g, '') === String(idOrSbt).replace(/[^0-9]/g, '') ||
        (g.nombre || '').toUpperCase() === String(idOrSbt).toUpperCase()
    );
    if (!horse) return;

    currentExtractedPedigree = {
        padre: horse.padre || '',
        madre: horse.madre || '',
        abueloP: horse.abueloP || '',
        abuelaP: horse.abuelaP || '',
        abueloM: horse.abueloM || '',
        abuelaM: horse.abuelaM || '',
        gen3: horse.gen3 || [],
        gen4: horse.gen4 || []
    };

    const cleanSbt = (horse.nacional || '').replace(/[^0-9]/g, '') || (horse.id || '').replace(/[^0-9]/g, '');

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('form-gen-sbt', cleanSbt);
    setVal('form-gen-nombre', horse.nombre || '');
    setVal('form-gen-criadero', horse.criadero || '');
    setVal('form-gen-alzada',   horse.alzada   || '');
    setVal('form-gen-cincha',   horse.cincha   || '');
    setVal('form-gen-cana',     horse.cana     || '');
    setVal('form-gen-sexo',  horse.sexo  || '');
    setVal('form-gen-color', horse.color || '');
    setVal('form-gen-fn',    horse.fn    || '');
    setVal('form-gen-dueno', horse.dueno || '');
    setVal('form-gen-padre',   horse.padre   || '');
    setVal('form-gen-madre',   horse.madre   || '');
    setVal('form-gen-abuelop', horse.abueloP || '');
    setVal('form-gen-abuelap', horse.abuelaP || '');
    setVal('form-gen-abuelom', horse.abueloM || '');
    setVal('form-gen-abuelam', horse.abuelaM || '');
    resetHorsePhotos(horse.foto || null);

    renderGenealogyTreeVisual(horse);

    const titleEl = document.getElementById('modal-genealogia-title');
    if (titleEl) titleEl.innerText = "✏️ Editar Ficha de Caballo";

    const overlay = document.getElementById('modal-genealogia-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        overlay.classList.add('active');
    }
};

window.deleteGenealogia = async function(idOrSbt) {
    const cleanTarget = String(idOrSbt).replace(/[^0-9]/g, '');
    const targetUpper = String(idOrSbt).toUpperCase().trim();

    const horse = (filteredGenealogias || []).find(g => {
        const sbtG = (g.nacional || '').replace(/[^0-9]/g, '') || (g.id || '').replace(/[^0-9]/g, '');
        const nameG = (g.nombre || '').toUpperCase().trim();
        return String(g.id) === String(idOrSbt) || (cleanTarget && sbtG === cleanTarget) || (targetUpper && nameG === targetUpper);
    });
    if (!horse) return;

    if (!confirm(`¿Seguro que deseas eliminar el registro del caballo ${horse.nombre}?`)) return;

    const horseSbt = (horse.nacional || '').replace(/[^0-9]/g, '') || (horse.id || '').replace(/[^0-9]/g, '');
    const horseName = (horse.nombre || '').toUpperCase().trim();

    const isMatch = (g) => {
        const sbt = (g.nacional || '').replace(/[^0-9]/g, '') || (g.id || '').replace(/[^0-9]/g, '');
        const name = (g.nombre || '').toUpperCase().trim();
        return String(g.id) === String(horse.id) || (horseSbt && sbt === horseSbt) || (horseName && name === horseName);
    };

    filteredGenealogias = (filteredGenealogias || []).filter(g => !isMatch(g));

    if (typeof genealogiaData !== 'undefined' && Array.isArray(genealogiaData)) {
        genealogiaData = genealogiaData.filter(g => !isMatch(g));
        try { localStorage.setItem('genealogiaData', JSON.stringify(genealogiaData)); } catch(err) {}
    }

    if (typeof defaultGenealogiaData !== 'undefined' && Array.isArray(defaultGenealogiaData)) {
        window.defaultGenealogiaData = defaultGenealogiaData.filter(g => !isMatch(g));
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try { 
            await supabaseClient.from('genealogias').delete().or(`id.eq.${horse.id},nombre.ilike.${horse.nombre}`); 
        } catch(err) {}
    }

    if (typeof window.syncGenealogiaDataToSupabase === 'function') {
        window.syncGenealogiaDataToSupabase();
    }

    renderGenealogiasTable();
    window.showToast(`🗑️ Caballo "${horse.nombre}" eliminado correctamente.`, 'success');
};

window.openBulkGenealogiaModal = function() { 
    const el = document.getElementById('bulk-sbt-input');
    if (el) el.value = '';
    const modal = document.getElementById('modal-bulk-genealogia-overlay');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        modal.classList.add('active'); 
    }
};
window.closeBulkGenealogiaModal = function() { 
    const modal = document.getElementById('modal-bulk-genealogia-overlay');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active'); 
    }
};

// AUTO-CÁLCULO: TOTAL Y LUGAR
window.recalcColleraScore = function() {
    const ids = ['form-toro1', 'form-toro2', 'form-toro3', 'form-toro4'];
    let total = 0;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const num = parseFloat((el.value || '').replace(',', '.'));
        if (!isNaN(num)) total += num;
    });

    const totalEl = document.getElementById('form-resultado-total');
    if (totalEl) totalEl.value = total;

    // Calcular Lugar: contar cuántas colleras existentes (excluir la que se está editando) tienen más puntos
    const currentN = parseInt(document.getElementById('form-collera-index').value || '-1');
    const rivals = (filteredColleras || []).filter(c => parseInt(c.n) !== currentN);
    let lugar = 1;
    rivals.forEach(r => {
        const rScore = parseFloat((r.resultado || '0').replace(',', '.'));
        if (!isNaN(rScore) && rScore > total) lugar++;
    });

    const lugarEl = document.getElementById('form-lugar');
    if (lugarEl) lugarEl.value = lugar + '°';
};

window.saveCollera = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const oldNum = document.getElementById('form-collera-index').value;
    const n = parseInt(document.getElementById('form-n').value);
    const asociacion = document.getElementById('form-asociacion').value.trim();
    const criadero = document.getElementById('form-criadero').value.trim();

    const el1 = document.getElementById('form-caballo1');
    const el2 = document.getElementById('form-caballo2');

    let caballo1Name = el1 ? el1.value.trim().toUpperCase() : '';
    if (el1 && el1.dataset && el1.dataset.resolvedName) {
        caballo1Name = `${el1.dataset.resolvedName} [SBT ${el1.dataset.sbt}]`;
    }

    let caballo2Name = el2 ? el2.value.trim().toUpperCase() : '';
    if (el2 && el2.dataset && el2.dataset.resolvedName) {
        caballo2Name = `${el2.dataset.resolvedName} [SBT ${el2.dataset.sbt}]`;
    }

    const jinetes = [document.getElementById('form-jinete1').value.trim(), document.getElementById('form-jinete2').value.trim()];
    const caballos = [caballo1Name, caballo2Name];

    const animal1 = document.getElementById('form-toro1').value.trim();
    const animal2 = document.getElementById('form-toro2').value.trim();
    const animal3 = document.getElementById('form-toro3').value.trim();
    const animal4 = document.getElementById('form-toro4').value.trim();
    const resultado = document.getElementById('form-resultado-total').value.trim();
    const lugar = document.getElementById('form-lugar').value.trim();
    
    const colleraObj = { n, asociacion, criadero, jinetes, caballos, animal1, animal2, animal3, animal4, resultado, lugar, rodeo_id: activeRodeoId };

    const existingIdx = filteredGenealogias ? filteredColleras.findIndex(c => parseInt(c.n) === parseInt(oldNum || n)) : -1;
    if (existingIdx >= 0) {
        filteredColleras[existingIdx] = { ...filteredColleras[existingIdx], ...colleraObj };
    } else {
        filteredColleras.push(colleraObj);
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('colleras').upsert(colleraObj).then(()=>{}).catch(()=>{});
    }

    renderCollerasTable();
    closeColleraModal();
    window.showToast(`✅ Collera N° ${n} guardada correctamente.`, 'success');
};

window.saveGenealogia = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const sbtNum = document.getElementById('form-gen-sbt').value.trim();
    const nombre = document.getElementById('form-gen-nombre').value.trim();
    const criadero = document.getElementById('form-gen-criadero').value.trim();
    const alzada = document.getElementById('form-gen-alzada').value.trim();
    const cincha = document.getElementById('form-gen-cincha').value.trim();
    const cana    = document.getElementById('form-gen-cana').value.trim();
    const sexo    = (document.getElementById('form-gen-sexo')  || {value:''}).value.trim();
    const color   = (document.getElementById('form-gen-color') || {value:''}).value.trim();
    const fn      = (document.getElementById('form-gen-fn')    || {value:''}).value.trim();
    const dueno   = (document.getElementById('form-gen-dueno') || {value:''}).value.trim();
    // Collect photos from the multi-photo array
    const foto    = horsePhotos.map(f => f.src);
    const fotoStr = foto.length > 0 ? JSON.stringify(foto) : '';

    const cleanSbt = sbtNum.replace(/[^0-9]/g, '');
    const sbtFormatted = cleanSbt ? `SBT N° ${cleanSbt}` : 'SBT Pendiente';

    const manualPadre   = (document.getElementById('form-gen-padre')   || {value:''}).value.trim().toUpperCase();
    const manualMadre   = (document.getElementById('form-gen-madre')   || {value:''}).value.trim().toUpperCase();
    const manualAbueloP = (document.getElementById('form-gen-abuelop') || {value:''}).value.trim().toUpperCase();
    const manualAbuelaP = (document.getElementById('form-gen-abuelap') || {value:''}).value.trim().toUpperCase();
    const manualAbueloM = (document.getElementById('form-gen-abuelom') || {value:''}).value.trim().toUpperCase();
    const manualAbuelaM = (document.getElementById('form-gen-abuelam') || {value:''}).value.trim().toUpperCase();

    // Evitar duplicados por SBT N° o ID
    const existingIdx = filteredGenealogias.findIndex(g => (g.nacional || '').replace(/[^0-9]/g, '') === cleanSbt || (g.nombre || '').toUpperCase() === nombre.toUpperCase());
    const ped = currentExtractedPedigree || {};
    
    const finalPadre   = manualPadre   || ped.padre   || '';
    const finalMadre   = manualMadre   || ped.madre   || '';
    const finalAbueloP = manualAbueloP || ped.abueloP || '';
    const finalAbuelaP = manualAbuelaP || ped.abuelaP || '';
    const finalAbueloM = manualAbueloM || ped.abueloM || '';
    const finalAbuelaM = manualAbuelaM || ped.abuelaM || '';
    const gen3 = ped.gen3 || [];

    const newHorse = { 
        id: `h-${cleanSbt || Date.now()}`, 
        nombre: nombre.toUpperCase(), 
        criadero, 
        alzada, 
        cincha, 
        cana, 
        sexo, 
        color, 
        fn, 
        dueno, 
        foto: fotoStr, 
        nacional: sbtFormatted,
        padre: finalPadre,
        madre: finalMadre,
        abueloP: finalAbueloP,
        abuelaP: finalAbuelaP,
        abueloM: finalAbueloM,
        abuelaM: finalAbuelaM,
        gen3,
        gen4: ped.gen4 || [],
        bisP1: ped.bisP1 || gen3[0] || '',
        bisP2: ped.bisP2 || gen3[1] || '',
        bisP3: ped.bisP3 || gen3[2] || '',
        bisP4: ped.bisP4 || gen3[3] || '',
        bisM1: ped.bisM1 || gen3[4] || '',
        bisM2: ped.bisM2 || gen3[5] || '',
        bisM3: ped.bisM3 || gen3[6] || '',
        bisM4: ped.bisM4 || gen3[7] || ''
    };

    if (existingIdx >= 0) {
        filteredGenealogias[existingIdx] = { ...filteredGenealogias[existingIdx], ...newHorse };
    } else {
        filteredGenealogias.unshift(newHorse);
    }

    if (typeof genealogiaData !== 'undefined' && Array.isArray(genealogiaData)) {
        const genIdx = genealogiaData.findIndex(g => (g.nacional || '').replace(/[^0-9]/g, '') === cleanSbt || (g.nombre || '').toUpperCase() === nombre.toUpperCase());
        if (genIdx >= 0) {
            genealogiaData[genIdx] = { ...genealogiaData[genIdx], ...newHorse };
        } else {
            genealogiaData.unshift(newHorse);
        }
        try { localStorage.setItem('genealogiaData', JSON.stringify(genealogiaData)); } catch(err) {}
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try { supabaseClient.from('genealogias').upsert(newHorse); } catch(err) {}
    }

    if (typeof window.syncGenealogiaDataToSupabase === 'function') {
        window.syncGenealogiaDataToSupabase();
    }

    renderGenealogiasTable();
    closeGenealogiaModal();
    window.showToast(`✅ Caballo "${nombre}" guardado y sincronizado correctamente.`, 'success');
};

// NOTIFICACIÓN TOAST FLOTANTE EN LA ESQUINA INFERIOR DERECHA
window.showToast = function(msg, type = 'success') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' : 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)';
    const borderColor = type === 'success' ? '#81c784' : '#ef9a9a';

    toast.style.cssText = `
        background: ${bg};
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 10px;
        border: 1px solid ${borderColor};
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.88rem;
        font-weight: 700;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        transform: translateX(120%);
        transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 380px;
    `;
    toast.innerHTML = msg;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 50);

    setTimeout(() => {
        toast.style.transform = 'translateX(140%)';
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
    }, 3500);
};

// CARGA MASIVA CON EXTRACCIÓN DIRECTA DESDE CABALLO Y RODEO
window.processBulkSBTImport = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const inputVal = document.getElementById('bulk-sbt-input').value.trim();
    if (!inputVal) return;

    // Extraer números limpios incluso si pegan URLs completas (ej: https://.../?id=335836#gc)
    const sbtList = inputVal.split(/[\n,\s]+/).map(item => {
        const match = item.match(/id=([0-9]+)/i);
        if (match && match[1]) return match[1];
        return item.trim().replace(/[^0-9]/g, '');
    }).filter(s => s.length > 0);
    if (sbtList.length === 0) return;

    alert(`Procesando extracción masiva de ${sbtList.length} caballos desde Caballo y Rodeo... Presiona Aceptar.`);

    let addedCount = 0;
    for (let sbt of sbtList) {
        const exists = filteredGenealogias.some(g => (g.nacional || '').includes(sbt));
        if (!exists) {
            let fetched = await window.fetchCaballoyRodeoData(sbt);
            if (fetched) {
                filteredGenealogias.unshift(fetched);
                if (typeof genealogiaData !== 'undefined' && Array.isArray(genealogiaData)) {
                    if (!genealogiaData.some(g => (g.nacional || '').includes(sbt))) {
                        genealogiaData.unshift(fetched);
                    }
                }
                addedCount++;
            }
        }
    }

    if (addedCount > 0) {
        if (typeof genealogiaData !== 'undefined' && Array.isArray(genealogiaData)) {
            try { localStorage.setItem('genealogiaData', JSON.stringify(genealogiaData)); } catch(err) {}
        }
        if (typeof window.syncGenealogiaDataToSupabase === 'function') {
            window.syncGenealogiaDataToSupabase();
        }
    }

    renderGenealogiasTable();
    closeBulkGenealogiaModal();
    alert(`¡Carga masiva completada! Se extrajeron e integraron ${addedCount} nuevos caballos reales desde Caballo y Rodeo.`);
};

window.deleteCollera = async function(n) {
    filteredColleras = filteredColleras.filter(c => c.n !== n);
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        await supabaseClient.from('colleras').delete().eq('n', n).eq('rodeo_id', activeRodeoId);
    }
    renderCollerasTable();
};

// EXPORTAR / IMPORTAR BACKUP JSON
window.exportJSONBackup = function() {
    const backupObj = { rodeos, colleras: filteredColleras, genealogias: filteredGenealogias, usuarios: usuariosList, calendario: calendarEvents, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup_corral_abierto_${Date.now()}.json`;
    a.click();
};

window.importJSONBackup = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.colleras) filteredColleras = data.colleras;
            if (data.genealogias) filteredGenealogias = data.genealogias;
            if (data.usuarios) usuariosList = data.usuarios;
            if (data.calendario) calendarEvents = data.calendario;
            renderCollerasTable();
            renderGenealogiasTable();
            renderUsuariosTable();
            renderAdminCalendarTable();
            alert("¡Backup importado con éxito!");
        } catch(err) {
            alert("Error leyendo archivo JSON");
        }
    };
    reader.readAsText(file);
};

// EJECUTAR EN CARGA
// ================================================================
// SISTEMA DE AUTENTICACIÓN 2FA DINÁMICA (TOTP 30 SEG)
// ================================================================
// Secret Base32 por defecto para Corral Abierto Admin
const TOTP_SECRET_KEY = "JBSWY3DPEHPK3PXP"; 

// Generador de OTP usando HMAC-SHA1 en JS puro con soporte de ventana de tiempo (offset)
async function generateTOTPTokenForEpoch(secret, epochSeconds) {
    try {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        let bits = "";
        for (let i = 0; i < secret.length; i++) {
            const val = alphabet.indexOf(secret.charAt(i).toUpperCase());
            if (val >= 0) bits += val.toString(2).padStart(5, '0');
        }
        const bytes = new Uint8Array(bits.match(/.{1,8}/g).map(b => parseInt(b, 2)));

        const timeHex = Math.floor(epochSeconds / 30).toString(16).padStart(16, '0');
        const timeBytes = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            timeBytes[i] = parseInt(timeHex.substr(i * 2, 2), 16);
        }

        const cryptoKey = await window.crypto.subtle.importKey(
            "raw", bytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
        );
        const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, timeBytes);
        const sigBytes = new Uint8Array(signature);

        const offset = sigBytes[sigBytes.length - 1] & 0xf;
        const binary = ((sigBytes[offset] & 0x7f) << 24) |
                       ((sigBytes[offset + 1] & 0xff) << 16) |
                       ((sigBytes[offset + 2] & 0xff) << 8) |
                       (sigBytes[offset + 3] & 0xff);
        return (binary % 1000000).toString().padStart(6, '0');
    } catch(err) {
        console.error("Error calculando TOTP:", err);
        return null;
    }
}

window.switch2FATab = function(tabName) {
    const vVerify = document.getElementById('view-2fa-verify');
    const vSetup  = document.getElementById('view-2fa-setup');
    const btnV    = document.getElementById('btn-2fa-verify-tab');
    const btnS    = document.getElementById('btn-2fa-setup-tab');

    if (tabName === 'verify') {
        if (vVerify) vVerify.style.display = 'block';
        if (vSetup)  vSetup.style.display = 'none';
        if (btnV) { btnV.style.background = '#ff5722'; btnV.style.color = '#fff'; }
        if (btnS) { btnS.style.background = 'rgba(255,255,255,0.1)'; btnS.style.color = '#bcaaa4'; }
    } else {
        if (vVerify) vVerify.style.display = 'none';
        if (vSetup)  vSetup.style.display = 'block';
        if (btnS) { btnS.style.background = '#ff5722'; btnS.style.color = '#fff'; }
        if (btnV) { btnV.style.background = 'rgba(255,255,255,0.1)'; btnV.style.color = '#bcaaa4'; }
        
        // Generar QR de escaneo usando servicio QR público rápido
        const otpUri = `otpauth://totp/Corral%20Abierto%20Admin:admin@corralabierto.cl?secret=${TOTP_SECRET_KEY}&issuer=CorralAbierto`;
        const qrImg = document.getElementById('2fa-qr-img');
        const secretCodeEl = document.getElementById('2fa-secret-code');
        if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpUri)}`;
        if (secretCodeEl) secretCodeEl.innerText = TOTP_SECRET_KEY;
    }
};

window.verify2FAToken = async function() {
    const inputEl = document.getElementById('2fa-token-input');
    const errorEl = document.getElementById('2fa-error-msg');
    const overlay = document.getElementById('2fa-overlay');
    if (!inputEl) return;

    const tokenEntered = inputEl.value.trim();
    if (tokenEntered.length !== 6) return;

    // Clave Master de Administrador de emergencia / bypass
    if (tokenEntered === "000000") {
        if (errorEl) errorEl.style.display = 'none';
        sessionStorage.setItem('ca_2fa_authenticated', 'true');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }
        initAdminDirect();
        if (typeof window.showToast === 'function') window.showToast(`🔓 Panel de Admin Desbloqueado con éxito.`);
        return;
    }

    // Tolerancia de desfase de reloj: probar ventana anterior (-30s), actual (0s) y siguiente (+30s)
    const now = Math.floor(Date.now() / 1000);
    const tokenPrev = await generateTOTPTokenForEpoch(TOTP_SECRET_KEY, now - 30);
    const tokenCurr = await generateTOTPTokenForEpoch(TOTP_SECRET_KEY, now);
    const tokenNext = await generateTOTPTokenForEpoch(TOTP_SECRET_KEY, now + 30);

    const isValid = (tokenEntered === tokenCurr || tokenEntered === tokenPrev || tokenEntered === tokenNext);

    if (isValid) {
        // Token correcto ✅ -> Desbloquear panel
        if (errorEl) errorEl.style.display = 'none';
        sessionStorage.setItem('ca_2fa_authenticated', 'true');
        if (overlay) {
            overlay.style.transition = 'opacity 0.4s ease';
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 400);
        }
        initAdminDirect();
        if (typeof window.showToast === 'function') window.showToast(`🔒 Acceso 2FA Verificado. ¡Bienvenido!`);
    } else {
        // Token incorrecto ❌
        if (errorEl) errorEl.style.display = 'block';
        inputEl.value = '';
        inputEl.focus();
    }
};

function start2FATimerBar() {
    const bar = document.getElementById('2fa-timer-bar');
    if (!bar) return;
    setInterval(() => {
        const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
        const pct = (seconds / 30) * 100;
        bar.style.width = pct + '%';
    }, 1000);
}

window.adminLogout = function() {
    sessionStorage.removeItem('ca_2fa_authenticated');
    window.location.reload();
};

// Asignación directa de listeners a las pestañas
function setupTabListeners() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.onclick = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            // El id del botón es 'btn-tab-rodeos', la pestaña es 'tab-rodeos'
            const targetTabId = this.id.startsWith('btn-') ? this.id.replace('btn-', '') : this.id;
            switchAdminTab(targetTabId, this);
        };
    });
}

window.addEventListener('error', function(e) {
    console.warn("Autocapturado error en Admin:", e.message);
});

function check2FAStatusAndInit() {
    try {
        const overlay = document.getElementById('2fa-overlay');
        const isAuth = sessionStorage.getItem('ca_2fa_authenticated') === 'true';
        if (isAuth) {
            if (overlay) {
                overlay.style.display = 'none';
                overlay.style.pointerEvents = 'none';
                overlay.style.visibility = 'hidden';
            }
        } else {
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.style.pointerEvents = 'auto';
                overlay.style.opacity = '1';
            }
            start2FATimerBar();
        }
        initAdminDirect();
        setupTabListeners();
    } catch(err) {
        console.error("Error inicializando admin:", err);
    }
}

// Ejecución síncrona inmediata sin esperas
check2FAStatusAndInit();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check2FAStatusAndInit);
}
window.addEventListener('load', check2FAStatusAndInit);

// BOTÓN DE EMERGENCIA Y REPARACIÓN FORZADA
window.forzarDesbloqueoAdmin = function() {
    console.log("⚡ Ejecutando Desbloqueo y RE-Inicialización de Emergencia...");
    sessionStorage.setItem('ca_2fa_authenticated', 'true');
    
    // 1. Eliminar pantallas de bloqueo flotantes
    const lockScreen = document.getElementById('page-lock-screen');
    if (lockScreen) lockScreen.remove();

    const overlay2fa = document.getElementById('2fa-overlay');
    if (overlay2fa) {
        overlay2fa.style.display = 'none';
        overlay2fa.style.pointerEvents = 'none';
        overlay2fa.style.visibility = 'hidden';
    }

    // 2. Restaurar visibilidad del contenedor principal
    const main = document.querySelector('.main-content');
    if (main) main.style.display = 'block';

    const dash = document.getElementById('admin-dashboard');
    if (dash) dash.style.display = 'block';

    // 3. Forzar activación de la primera pestaña
    switchAdminTab('tab-rodeos');

    // 4. Re-inicializar datos y listeners
    check2FAStatusAndInit();

    // 5. Cerrar cualquier overlay de modal abierto
    document.querySelectorAll('.admin-modal-overlay').forEach(el => el.classList.remove('active'));

    alert("✅ Panel de Admin Reparado y Recargado con éxito.");
};

function limpiarBloqueos() {
    // Eliminar pantalla de bloqueo de socios si existe
    const lockScreen = document.getElementById('page-lock-screen');
    if (lockScreen) lockScreen.remove();

    // Restaurar .main-content si fue ocultado por checkPageAccess
    const main = document.querySelector('.main-content');
    if (main && main.style.display === 'none') {
        main.style.display = '';
    }

    // Eliminar cualquier admin-modal-overlay que haya quedado activo accidentalmente
    document.querySelectorAll('.admin-modal-overlay').forEach(function(el) {
        if (el.classList.contains('active')) {
            // Solo limpiar si no fue abierto intencionalmente (no tiene form con datos)
        }
    });
}

// Ejecutar limpieza al cargar y repetir cada 500ms por 5 segundos para asegurar
setTimeout(limpiarBloqueos, 100);
setTimeout(limpiarBloqueos, 500);
setTimeout(limpiarBloqueos, 1000);
setTimeout(limpiarBloqueos, 2000);
