// InmoLawyer - UI Helper Functions
// Shared UI utilities used across modules

// ===== Section Management =====

// Current app visual state — shared across modules
let currentAppState = 'upload';

export function getCurrentAppState() {
    return currentAppState;
}

export function setCurrentAppState(state) {
    currentAppState = state;
}

export function showSection(section) {
    currentAppState = section;
    document.getElementById('uploadSection').style.display = section === 'upload' ? 'flex' : 'none';
    document.getElementById('loadingSection').style.display = section === 'loading' ? 'flex' : 'none';
    document.getElementById('resultsSection').style.display = section === 'results' ? 'block' : 'none';
    const blocked = document.getElementById('blockedSection');
    if (blocked) blocked.style.display = 'none';
}

// ===== Loading Steps =====

export function updateLoadingStep(step, customMessage) {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const defaultMessages = [
        'Enviando documento...',
        'Extrayendo texto del contrato...',
        'Analizando clausulas con IA...',
        'Analisis completado!'
    ];

    steps.forEach((s, i) => {
        const el = document.getElementById(s);
        if (el) {
            el.classList.remove('active', 'completed');
            if (i + 1 < step) {
                el.classList.add('completed');
            } else if (i + 1 === step) {
                el.classList.add('active');
            }
        }
    });

    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) {
        statusEl.textContent = customMessage || defaultMessages[step - 1] || '';
    }
}

// ===== Error Banner =====

export function showErrorBanner(title, message) {
    const banner = document.getElementById('errorBanner');
    const titleEl = document.getElementById('errorBannerTitle');
    const msgEl = document.getElementById('errorBannerMsg');
    if (!banner) return;
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    banner.style.display = 'block';
    // Scroll al banner
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function hideErrorBanner() {
    const banner = document.getElementById('errorBanner');
    if (banner) banner.style.display = 'none';
}

// ===== Toast Notifications =====

export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-times-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== Formatters =====

export function formatCurrency(value) {
    if (!value) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

export function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}
