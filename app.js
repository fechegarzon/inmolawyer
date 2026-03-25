// InmoLawyer - App Entry Point (Orchestrator)
// ES Module — imports all modules and wires everything together

import { showSection, hideErrorBanner, getCurrentAppState } from './ui-helpers.js';
import { initUpload, setCurrentContractId } from './upload.js';
import { setLastAnalysisData } from './results-renderer.js';
import { generatePDF, initPDFGenerator } from './pdf-generator.js';
import { initChat, resetChat } from './chat.js';
import { updateStudiosCounter, showPricingModal, closePricingModal, initiateWompiCheckout, handleWompiReturn } from './payments.js';
import { toggleAdminPanel, switchAdminTab, loadAdminData, loadUsersRegistry, filterUsers, exportUsersCSV, showUserQuestions, closeUserQuestionsModal, getAdminUsersPage } from './admin.js';

// ===== Initialize App =====
// Called by auth.js when user is authenticated

function initApp() {
    initUpload();
    initChat();
    initCollapsible();
    initNewAnalysis();
    initPDFGenerator();
    handleWompiReturn(); // detectar retorno de pago Wompi
}

// ===== Collapsible Section =====

function initCollapsible() {
    const toggleBtn = document.getElementById('toggleContractText');
    const container = document.getElementById('contractTextContainer');

    if (toggleBtn && container) {
        toggleBtn.addEventListener('click', () => {
            toggleBtn.classList.toggle('active');
            container.style.display = container.style.display === 'none' ? 'block' : 'none';

            const span = toggleBtn.querySelector('span');
            span.textContent = container.style.display === 'none' ?
                'Ver texto del contrato' : 'Ocultar texto del contrato';
        });
    }
}

// ===== New Analysis =====

function initNewAnalysis() {
    const btn = document.getElementById('btnNewAnalysis');
    const fileInput = document.getElementById('fileInput');

    btn.addEventListener('click', () => {
        // Reset state
        setCurrentContractId(null);
        fileInput.value = '';

        // Reset chat
        resetChat();

        showSection('upload');
    });
}

// ===== App Tab Navigation =====

function showAppTab(tab) {
    const uploadSection = document.getElementById('uploadSection');
    const resultsSection = document.getElementById('resultsSection');
    const loadingSection = document.getElementById('loadingSection');
    const currentState = getCurrentAppState();

    document.querySelectorAll('.app-nav-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === tab));
    const isAnalizar = tab === 'analizar';
    uploadSection.style.display  = isAnalizar && currentState === 'upload'   ? 'flex'   : 'none';
    resultsSection.style.display = isAnalizar && currentState === 'results'  ? 'block'  : 'none';
    loadingSection.style.display = 'none';
    const blocked = document.getElementById('blockedSection');
    if (blocked) blocked.style.display = isAnalizar && currentState === 'blocked' ? 'flex' : 'none';
    document.getElementById('historialSection').style.display = isAnalizar ? 'none' : 'block';
    if (!isAnalizar) loadMisContratos();
}

// ===== Mis Contratos: Dashboard de historial =====

async function loadMisContratos() {
    if (!currentUser) return;
    const tbody   = document.getElementById('historialTbody');
    const emptyEl = document.getElementById('historialEmpty');
    const tableEl = document.getElementById('historialTable');
    const countEl = document.getElementById('historialCount');

    tableEl.style.display = 'table';
    emptyEl.style.display = 'none';
    tbody.innerHTML = '<tr><td colspan="6" class="historial-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    const { data, error } = await supabaseClient
        .from('contratos')
        .select('id, created_at, score_riesgo, ciudad, arrendador_nombre, arrendatario_nombre, analisis, alertas, incrementos, fechas_importantes, deudores_solidarios, canon, duracion_meses, fecha_inicio, arrendador_doc, arrendatario_doc, direccion')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error || !data?.length) {
        tableEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        if (countEl) countEl.textContent = '';
        return;
    }

    if (countEl) countEl.textContent = `${data.length} analisis`;

    tbody.innerHTML = data.map(c => {
        const fecha = new Date(c.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        const score = c.score_riesgo ?? '—';
        const scoreClass = typeof score === 'number'
            ? (score >= 70 ? 'score-badge-low' : score >= 40 ? 'score-badge-med' : 'score-badge-high')
            : 'score-badge-med';
        const riesgoLabel = typeof score === 'number'
            ? (score >= 70 ? 'Bajo' : score >= 40 ? 'Medio' : 'Alto')
            : '—';
        return `<tr>
            <td>${fecha}</td>
            <td>${c.arrendatario_nombre || '—'}</td>
            <td>${c.arrendador_nombre || '—'}</td>
            <td>${c.ciudad || '—'}</td>
            <td><span class="score-badge ${scoreClass}">${score} · ${riesgoLabel}</span></td>
            <td><button class="btn-dl-pdf" onclick="downloadHistorialPDF(this)">
                <i class="fas fa-file-pdf"></i> PDF
            </button></td>
        </tr>`;
    }).join('');

    // Guardar datos en dataset para acceso limpio desde el boton
    data.forEach((c, i) => {
        const btn = tbody.querySelectorAll('.btn-dl-pdf')[i];
        if (btn) btn._contractData = c;
    });
}

async function downloadHistorialPDF(btn) {
    const contractData = btn._contractData;
    if (!contractData) return;
    setLastAnalysisData({ ...contractData, ...(contractData.analisis || {}) });
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        await generatePDF();
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ===== Expose functions to window for onclick="" handlers in HTML =====
// auth.js globals (currentUser, currentUserProfile, isAdmin, supabaseClient) remain as global <script> vars

window.initApp = initApp;
window.updateStudiosCounter = updateStudiosCounter;

// Payments / pricing
window.showPricingModal = showPricingModal;
window.closePricingModal = closePricingModal;
window.initiateWompiCheckout = initiateWompiCheckout;

// UI helpers used in HTML onclick
window.hideErrorBanner = hideErrorBanner;

// App navigation
window.showAppTab = showAppTab;

// Admin panel
window.toggleAdminPanel = toggleAdminPanel;
window.switchAdminTab = switchAdminTab;
window.loadAdminData = loadAdminData;
window.loadUsersRegistry = loadUsersRegistry;
window.filterUsers = filterUsers;
window.exportUsersCSV = exportUsersCSV;
window.showUserQuestions = showUserQuestions;
window.closeUserQuestionsModal = closeUserQuestionsModal;

// Historial
window.downloadHistorialPDF = downloadHistorialPDF;

// Expose adminUsersPage for pagination onclick in HTML
Object.defineProperty(window, 'adminUsersPage', {
    get: () => getAdminUsersPage()
});
