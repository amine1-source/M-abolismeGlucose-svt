// Configuration globale
const MAX_TIME = 15;
let currentExp = 'respiration';
let time = 0;
let isRunning = false;
let glucoseTime = null;
let interval = null;
let chart = null;

// Modèles de données initiaux
const initialValues = {
    'respiration': { o2: 8.0, co2: 1.0, ethanol: 0, ph: 7.0, lactic: 0 },
    'lactique': { o2: 0, co2: 0, ethanol: 0, ph: 6.8, lactic: 0 },
    'alcoolique': { o2: 0, co2: 1.0, ethanol: 0, ph: 7.0, lactic: 0 }
};

let currentData = { ...initialValues['respiration'] };
let chartData = {
    labels: [0],
    datasets: []
};

// Équations chimiques
const equations = {
    'respiration': 'C₆H₁₂O₆ + 6 O₂ ➔ 6 CO₂ + 6 H₂O + Énergie (38 ATP)',
    'lactique': 'C₆H₁₂O₆ ➔ 2 CH₃-CHOH-COOH + Énergie (2 ATP)',
    'alcoolique': 'C₆H₁₂O₆ ➔ 2 C₂H₅OH + 2 CO₂ + Énergie (2 ATP)'
};

// Initialisation du graphique (Chart.js)
function initChart() {
    const ctx = document.getElementById('exaoChart').getContext('2d');
    
    // Configuration des axes selon l'expérience
    let yAxes = {};
    if (currentExp === 'respiration') {
        yAxes = { y: { type: 'linear', position: 'left', min: 0, max: 15, title: { display: true, text: 'Concentration (mg/L)', color: '#94a3b8' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } };
    } else if (currentExp === 'lactique') {
        yAxes = { 
            yPH: { type: 'linear', position: 'left', min: 4, max: 7.5, title: { display: true, text: 'pH', color: '#ef4444' }, grid: { color: '#334155' }, ticks: { color: '#ef4444' } },
            yLac: { type: 'linear', position: 'right', min: 0, max: 10, title: { display: true, text: 'Acide Lactique (g/L)', color: '#10b981' }, grid: { drawOnChartArea: false }, ticks: { color: '#10b981' } }
        };
    } else if (currentExp === 'alcoolique') {
        yAxes = { 
            yCO2: { type: 'linear', position: 'left', min: 0, max: 15, title: { display: true, text: 'CO₂ (mg/L)', color: '#eab308' }, grid: { color: '#334155' }, ticks: { color: '#eab308' } },
            yEth: { type: 'linear', position: 'right', min: 0, max: 5, title: { display: true, text: 'Éthanol (g/L)', color: '#f472b6' }, grid: { drawOnChartArea: false }, ticks: { color: '#f472b6' } }
        };
    }

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            elements: { point: { radius: 0 }, line: { borderWidth: 3, tension: 0.4 } },
            scales: {
                x: { min: 0, max: MAX_TIME, title: { display: true, text: 'Temps (min)', color: '#94a3b8' }, grid: { display: false }, ticks: { color: '#94a3b8' } },
                ...yAxes
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });

    updateDatasetsConfig();
}

function updateDatasetsConfig() {
    chartData.datasets = [];
    if (currentExp === 'respiration') {
        chartData.datasets.push({ label: 'O₂', data: [currentData.o2], borderColor: '#3b82f6', yAxisID: 'y' });
        chartData.datasets.push({ label: 'CO₂', data: [currentData.co2], borderColor: '#eab308', yAxisID: 'y' });
    } else if (currentExp === 'lactique') {
        chartData.datasets.push({ label: 'pH', data: [currentData.ph], borderColor: '#ef4444', yAxisID: 'yPH' });
        chartData.datasets.push({ label: 'Acide Lactique', data: [currentData.lactic], borderColor: '#10b981', yAxisID: 'yLac' });
    } else if (currentExp === 'alcoolique') {
        chartData.datasets.push({ label: 'CO₂', data: [currentData.co2], borderColor: '#eab308', yAxisID: 'yCO2' });
        chartData.datasets.push({ label: 'Éthanol', data: [currentData.ethanol], borderColor: '#f472b6', yAxisID: 'yEth' });
    }
    chart.update();
}

// Composants HTML de la paillasse (Générés dynamiquement)
function renderPaillasse() {
    const container = document.getElementById('paillasse-container');
    let html = '';

    const limeWaterHTML = (isCloudy) => `
        <div class="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div class="lime-water-beaker">
                <div class="beaker-top"></div>
                <div class="beaker-body">
                    <div class="beaker-liquid ${isCloudy ? 'lime-liquid-cloudy' : 'lime-liquid-clear'}">
                        <div class="liquid-surface ${isCloudy ? 'surface-cloudy' : 'surface-clear'}"></div>
                        <div class="particles ${isCloudy ? 'show' : ''}"></div>
                    </div>
                </div>
            </div>
            <div>
                <div class="text-sm font-bold text-slate-700">Eau de chaux</div>
                <div class="text-xs font-medium ${isCloudy ? 'text-slate-600' : 'text-blue-600'}">${isCloudy ? 'Trouble (Dégagement de CO₂)' : 'Limpide'}</div>
            </div>
        </div>`;

    if (currentExp === 'respiration') {
        html = limeWaterHTML(currentData.co2 > 5);
    } else if (currentExp === 'lactique') {
        const isAcide = currentData.ph < 5.5;
        const clampedPh = Math.max(4, Math.min(7.5, currentData.ph));
        const phPercentage = ((clampedPh - 4) / (7.5 - 4)) * 100;
        
        html = `
            <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-center mb-1">
                    <div class="text-sm font-bold text-slate-700">Mesure du pH</div>
                    <div class="font-mono font-bold text-sm ${isAcide ? 'text-red-600' : 'text-green-600'}">pH = ${currentData.ph.toFixed(1)}</div>
                </div>
                <div class="ph-gauge-container">
                    <div class="ph-gauge">
                        <div class="ph-needle" style="left: calc(${phPercentage}% - 6px)"></div>
                        <div class="ph-line" style="left: ${phPercentage}%"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; margin-top:8px;">
                        <span style="color:#dc2626">Acide (4)</span><span style="color:#15803d">Neutre (7)</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div class="milk-beaker">
                    <div class="beaker-top"></div>
                    <div class="milk-body">
                        <div class="milk-bg"></div>
                        <div class="milk-whey ${isAcide ? 'whey-coagulated' : 'whey-normal'}"></div>
                        <div class="milk-curd ${isAcide ? 'curd-coagulated' : 'curd-normal'}">
                            <div class="curd-texture ${isAcide ? 'show' : ''}">
                                <div class="curd-dots"></div><div class="curd-surface"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="text-sm font-bold text-slate-700">Aspect du Lait</div>
                    <div class="text-xs font-medium ${isAcide ? 'text-amber-700' : 'text-slate-500'}">${isAcide ? 'Coagulé (Caillé)' : 'Liquide normal'}</div>
                </div>
            </div>`;
    } else if (currentExp === 'alcoolique') {
        const hasAlcohol = currentData.ethanol > 0.5;
        html = limeWaterHTML(currentData.co2 > 3) + `
            <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div class="text-sm font-bold text-slate-700">Test d'Odeur</div>
                <div class="text-xs font-medium ${hasAlcohol ? 'text-amber-600' : 'text-slate-500'}">${hasAlcohol ? "Forte odeur d'alcool (Éthanol)" : "Aucune odeur"}</div>
            </div>`;
    }
    
    container.innerHTML = html;
}

// Moteur de simulation
function tick() {
    time = parseFloat((time + 0.2).toFixed(1));
    document.getElementById('time-display').innerText = `T = ${time.toFixed(1)} min`;

    const hasGlucose = glucoseTime !== null && time >= glucoseTime;
    const noise = () => (Math.random() - 0.5) * 0.1;

    if (currentExp === 'respiration') {
        if (hasGlucose) { currentData.o2 = Math.max(0, currentData.o2 - 0.6); currentData.co2 += 0.6; }
        else { currentData.o2 = Math.max(0, currentData.o2 - 0.05); currentData.co2 += 0.05; }
        currentData.o2 = Math.max(0, parseFloat((currentData.o2 + noise()).toFixed(2)));
        currentData.co2 = Math.max(0, parseFloat((currentData.co2 + noise()).toFixed(2)));
    } else if (currentExp === 'lactique') {
        if (hasGlucose) { currentData.ph = Math.max(4.2, currentData.ph - 0.15); currentData.lactic += 0.4; }
        else { currentData.ph = Math.max(4.2, currentData.ph - 0.01); currentData.lactic += 0.01; }
        currentData.ph = parseFloat((currentData.ph + noise()*0.5).toFixed(2));
        currentData.lactic = Math.max(0, parseFloat((currentData.lactic + noise()).toFixed(2)));
    } else if (currentExp === 'alcoolique') {
        if (hasGlucose) { currentData.co2 += 0.4; currentData.ethanol += 0.25; }
        else { currentData.co2 += 0.05; }
        currentData.co2 = Math.max(0, parseFloat((currentData.co2 + noise()).toFixed(2)));
        currentData.ethanol = Math.max(0, parseFloat((currentData.ethanol + noise()).toFixed(2)));
    }

    // Mise à jour du graphique
    chartData.labels.push(time);
    if (currentExp === 'respiration') {
        chartData.datasets[0].data.push(currentData.o2);
        chartData.datasets[1].data.push(currentData.co2);
    } else if (currentExp === 'lactique') {
        chartData.datasets[0].data.push(currentData.ph);
        chartData.datasets[1].data.push(currentData.lactic);
    } else if (currentExp === 'alcoolique') {
        chartData.datasets[0].data.push(currentData.co2);
        chartData.datasets[1].data.push(currentData.ethanol);
    }
    
    chart.update();
    renderPaillasse();

    if (time >= MAX_TIME) stopSimulation();
}

function startSimulation() {
    if (!isRunning && time < MAX_TIME) {
        isRunning = true;
        interval = setInterval(tick, 800);
        updateButtonsState();
    }
}

function stopSimulation() {
    isRunning = false;
    clearInterval(interval);
    updateButtonsState();
}

function resetSimulation() {
    stopSimulation();
    time = 0;
    glucoseTime = null;
    currentData = { ...initialValues[currentExp] };
    chartData.labels = [0];
    updateDatasetsConfig();
    document.getElementById('time-display').innerText = `T = 0.0 min`;
    renderPaillasse();
    updateButtonsState();
}

function injectGlucose() {
    if (glucoseTime === null && isRunning) {
        glucoseTime = time;
        updateButtonsState();
    }
}

// Gestionnaires d'événements UI
function updateButtonsState() {
    document.getElementById('btn-start').disabled = isRunning || time >= MAX_TIME;
    document.getElementById('btn-pause').disabled = !isRunning;
    const btnGlucose = document.getElementById('btn-glucose');
    if (glucoseTime !== null) {
        btnGlucose.disabled = true;
        btnGlucose.classList.add('opacity-50', 'cursor-not-allowed');
    } else if (isRunning) {
        btnGlucose.disabled = false;
        btnGlucose.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btnGlucose.disabled = true;
        btnGlucose.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function switchExp(expName) {
    currentExp = expName;
    document.getElementById('reaction-equation').innerText = equations[expName];
    
    // Mise à jour visuelle des boutons
    document.querySelectorAll('.exp-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('inactive');
        if (btn.classList.contains('border-blue-500')) btn.className = 'exp-btn inactive p-3 rounded-xl border-2 transition-all font-bold text-sm';
    });
    
    const activeBtn = document.getElementById(`btn-${expName}`);
    activeBtn.classList.remove('inactive');
    activeBtn.classList.add('active');
    
    if (expName === 'respiration') activeBtn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
    if (expName === 'lactique') activeBtn.classList.add('border-pink-500', 'bg-pink-50', 'text-pink-700');
    if (expName === 'alcoolique') activeBtn.classList.add('border-amber-500', 'bg-amber-50', 'text-amber-700');

    initChart();
    resetSimulation();
}

// Initialisation
document.getElementById('btn-start').addEventListener('click', startSimulation);
document.getElementById('btn-pause').addEventListener('click', stopSimulation);
document.getElementById('btn-reset').addEventListener('click', resetSimulation);
document.getElementById('btn-glucose').addEventListener('click', injectGlucose);

document.getElementById('btn-respiration').addEventListener('click', () => switchExp('respiration'));
document.getElementById('btn-lactique').addEventListener('click', () => switchExp('lactique'));
document.getElementById('btn-alcoolique').addEventListener('click', () => switchExp('alcoolique'));

// Lancement initial
switchExp('respiration');
