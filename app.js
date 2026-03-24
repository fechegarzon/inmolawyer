// InmoLawyer - Frontend App v4.1
// Arquitectura Asíncrona - Polling por Job ID

// ===== LAZY-LOAD HELPERS =====

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load: ' + src));
        document.head.appendChild(s);
    });
}

async function loadPDFLibraries() {
    if (window.jspdf) return; // ya cargado
    // Cargar secuencialmente: autoTable es plugin de jsPDF y necesita que jsPDF exista primero
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
}

async function loadMammoth() {
    if (window.mammoth) return; // ya cargado
    await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
}

const CONFIG = {
    N8N_BASE_URL: 'https://oqipslfzbeioakfllohm.supabase.co/functions/v1',
    ENDPOINTS: {
        ANALYZE: '/analizar-contrato',
        STATUS: '/status',
        CHAT: '/consulta-contrato'
    },
    TIMEOUT: 30000,       // 30s para el submit inicial (solo obtener job_id)
    POLL_INTERVAL: 4000,  // 4s entre cada poll
    POLL_MAX_ATTEMPTS: 90 // máximo 6 minutos de polling
};

// ===== WOMPI: Configuración de pagos =====
const CONFIG_WOMPI = {
    publicKey: 'pub_prod_uohbfwCKYyrQ0LN3EuKK18cNE6gv5yL5',
    checkoutUrl: 'https://checkout.wompi.co/p/',
    redirectUrl: 'https://inmo.tools/inmolawyer/app',
    currency: 'COP',
    // Endpoint N8N que genera el integrity hash (secreto de integridad nunca va al frontend)
    integrityEndpoint: 'https://oqipslfzbeioakfllohm.supabase.co/functions/v1/wompi-integrity',
    plans: [
        {
            id: 'single',
            name: 'Estudio Único',
            description: '1 análisis de contrato completo',
            price: 4990000, // centavos COP = $49,900
            priceFormatted: '$49.900',
            credits: 1,
            icon: 'fas fa-file-contract',
            badge: null,
            savings: null,
            pricePerUnit: null,
            features: [
                '1 análisis de contrato',
                'Score de riesgo (0–100)',
                'Detección de cláusulas abusivas',
                'Chat legal incluido',
                'Descarga PDF del reporte'
            ]
        },
        {
            id: 'pack5',
            name: 'Pack 5 Estudios',
            description: '5 análisis para ti o tus clientes',
            price: 19990000, // $199,900
            priceFormatted: '$199.900',
            credits: 5,
            icon: 'fas fa-layer-group',
            badge: 'Más popular',
            savings: '20% dcto',
            pricePerUnit: '$39.980/estudio',
            features: [
                '5 análisis de contratos',
                'Score de riesgo (0–100)',
                'Detección de cláusulas abusivas',
                'Chat legal incluido',
                'Descarga PDF de cada análisis'
            ]
        },
        {
            id: 'pack10',
            name: 'Pack 10 Estudios',
            description: '10 análisis al mejor precio',
            price: 34990000, // $349,900
            priceFormatted: '$349.900',
            credits: 10,
            icon: 'fas fa-boxes',
            badge: 'Mayor ahorro',
            savings: '30% dcto',
            pricePerUnit: '$34.990/estudio',
            features: [
                '10 análisis de contratos',
                'Score de riesgo (0–100)',
                'Detección de cláusulas abusivas',
                'Chat legal incluido',
                'Descarga PDF de cada análisis',
                'Atención prioritaria por WhatsApp'
            ]
        }
    ]
};

const WOMPI_PENDING_PURCHASE_KEY = 'inmolawyer.pendingPurchase';

// State
let currentContractId = null;

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function normalizeAlertType(value) {
    const normalized = String(value || 'info').toLowerCase();
    return ['danger', 'critica', 'warning', 'advertencia', 'info', 'success'].includes(normalized)
        ? normalized
        : 'info';
}

function getChatResponseText(payload) {
    if (!payload || typeof payload !== 'object') return '';
    return payload.respuesta
        || payload.response
        || payload.text
        || payload.mensaje
        || payload.result?.respuesta
        || payload.result?.response
        || payload.result?.text
        || payload.result?.mensaje
        || '';
}

function persistPendingPurchase(purchase) {
    try {
        window.sessionStorage.setItem(WOMPI_PENDING_PURCHASE_KEY, JSON.stringify(purchase));
    } catch (_) {
        // Ignore storage failures; user can still refresh manually.
    }
}

function readPendingPurchase() {
    try {
        const raw = window.sessionStorage.getItem(WOMPI_PENDING_PURCHASE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function clearPendingPurchase() {
    try {
        window.sessionStorage.removeItem(WOMPI_PENDING_PURCHASE_KEY);
    } catch (_) {
        // Ignore storage failures.
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function confirmPendingPurchaseCredits(pendingPurchase) {
    const previousCredits = Number(pendingPurchase?.previousCredits);
    const expectedCredits = Number(pendingPurchase?.expectedCredits);
    const hasPreviousCredits = Number.isFinite(previousCredits);
    const hasExpectedCredits = Number.isFinite(expectedCredits) && expectedCredits > 0;

    for (let attempt = 0; attempt < 4; attempt++) {
        if (typeof loadCurrentUserProfile === 'function') {
            await loadCurrentUserProfile();
        }

        const currentCredits = Number(currentUserProfile?.estudios_restantes);
        if (Number.isFinite(currentCredits)) {
            if (hasPreviousCredits && hasExpectedCredits && currentCredits >= previousCredits + expectedCredits) {
                return true;
            }
            if (hasPreviousCredits && currentCredits > previousCredits) {
                return true;
            }
        }

        if (attempt < 3) await wait(2000);
    }

    return false;
}

// ===== FREEMIUM: control de estudios y chat =====
const chatQuestionsUsed = {}; // { [contractId]: true } — 1 pregunta por contrato

function updateStudiosCounter() {
    const el = document.getElementById('estudiosCounter');
    if (!el) return;

    // Admin no ve el contador
    if (isAdmin()) {
        el.style.display = 'none';
        return;
    }

    const profile = (typeof currentUserProfile !== 'undefined') ? currentUserProfile : null;
    if (!profile) { el.style.display = 'none'; return; }

    const restantes = profile.estudios_restantes ?? 5;
    const plan = profile.plan ?? 'freemium';

    if (plan === 'freemium') {
        el.style.display = 'inline-flex';
        el.className = 'estudios-counter' + (restantes <= 1 ? ' counter-low' : '');
        el.innerHTML = `<i class="fas fa-file-alt"></i> ${restantes} de 5 estudios gratuitos`;
    } else {
        el.style.display = 'inline-flex';
        el.className = 'estudios-counter counter-paid';
        el.innerHTML = `<i class="fas fa-file-alt"></i> ${restantes} estudios restantes`;
    }
}

async function decrementEstudios() {
    if (isAdmin()) return;
    const profile = (typeof currentUserProfile !== 'undefined') ? currentUserProfile : null;
    if (!profile) return;

    const nuevos = Math.max(0, (profile.estudios_restantes ?? 0) - 1);
    profile.estudios_restantes = nuevos; // actualizar local inmediatamente

    await supabaseClient
        .from('user_profiles')
        .update({ estudios_restantes: nuevos })
        .eq('id', currentUser.id);

    updateStudiosCounter();
}

function hasEstudiosDisponibles() {
    if (isAdmin()) return true;
    const profile = (typeof currentUserProfile !== 'undefined') ? currentUserProfile : null;
    if (!profile) return false;
    return (profile.estudios_restantes ?? 0) > 0;
}

function showSectionBlocked() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('blockedSection').style.display = 'flex';
}

// ===== WOMPI: Integración de pagos =====

function showPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (!modal) return;

    // Si la llave pública no está configurada, redirigir a WhatsApp
    if (CONFIG_WOMPI.publicKey.includes('REPLACE')) {
        showToast('Sistema de pagos en configuración. Te contactamos por WhatsApp.', 'info');
        window.open('https://wa.me/573337124882?text=Hola%2C%20quiero%20comprar%20estudios%20en%20InmoLawyer', '_blank');
        return;
    }

    renderPricingPlans();
    modal.style.display = 'flex';
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) modal.style.display = 'none';
}

function renderPricingPlans() {
    const container = document.getElementById('pricingPlansContainer');
    if (!container) return;

    const userId = (typeof currentUser !== 'undefined' && currentUser)
        ? currentUser.id.replace(/-/g, '').substring(0, 8)
        : 'anon';

    container.innerHTML = CONFIG_WOMPI.plans.map(plan => {
        // Referencia única por transacción
        const reference = `INMO-${userId}-${plan.id}-${Date.now()}`;
        const featuresHtml = plan.features
            .map(f => `<li><i class="fas fa-check"></i> ${f}</li>`)
            .join('');
        const badgeHtml = plan.badge
            ? `<span class="plan-badge">${plan.badge}</span>` : '';
        const savingsHtml = plan.savings
            ? `<span class="plan-savings">${plan.savings}</span>` : '';
        const perUnitHtml = plan.pricePerUnit
            ? `<p class="plan-per-unit">${plan.pricePerUnit}</p>` : '';

        return `
        <div class="plan-card${plan.badge === 'Más popular' ? ' plan-featured' : ''}">
            ${badgeHtml}
            <div class="plan-icon"><i class="${plan.icon}"></i></div>
            <h3 class="plan-name">${plan.name}</h3>
            <p class="plan-desc">${plan.description}</p>
            <div class="plan-price-block">
                <span class="plan-price-amount">${plan.priceFormatted}</span>
                <span class="plan-price-currency">COP</span>
                ${savingsHtml}
            </div>
            ${perUnitHtml}
            <ul class="plan-features">${featuresHtml}</ul>
            <div class="wompi-form">
                <button type="button" class="btn-comprar"
                    onclick="initiateWompiCheckout(this, '${reference}', ${plan.price})">
                    <i class="fas fa-shopping-cart"></i> Comprar ahora
                </button>
            </div>
        </div>`;
    }).join('');
}

async function initiateWompiCheckout(btn, reference, amountInCents) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const selectedPlan = CONFIG_WOMPI.plans.find(plan => plan.price === amountInCents) || null;
        persistPendingPurchase({
            reference,
            amountInCents,
            expectedCredits: selectedPlan?.credits ?? null,
            previousCredits: (typeof currentUserProfile !== 'undefined' && currentUserProfile)
                ? currentUserProfile.estudios_restantes ?? null
                : null,
            userId: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : null,
            createdAt: Date.now()
        });

        // Obtener integrity hash desde N8N (el secreto nunca sale del servidor)
        const resp = await fetch(CONFIG_WOMPI.integrityEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reference,
                amountInCents,
                currency: CONFIG_WOMPI.currency
            })
        });

        if (!resp.ok) throw new Error(`N8N responded ${resp.status}`);

        const { integrity } = await resp.json();
        if (!integrity) throw new Error('Missing integrity hash in response');

        // Construir URL de checkout con todos los campos requeridos
        const params = new URLSearchParams({
            'public-key': CONFIG_WOMPI.publicKey,
            'currency': CONFIG_WOMPI.currency,
            'amount-in-cents': amountInCents,
            'reference': reference,
            'redirect-url': CONFIG_WOMPI.redirectUrl,
            'signature:integrity': integrity
        });

        window.location.href = `${CONFIG_WOMPI.checkoutUrl}?${params.toString()}`;

    } catch (err) {
        console.error('Wompi checkout error:', err);
        clearPendingPurchase();
        showToast('Error iniciando el pago. Intenta de nuevo.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Comprar ahora';
    }
}

async function handleWompiReturn() {
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('id');
    if (!transactionId) return;
    const pendingPurchase = readPendingPurchase();

    // Limpiar parámetros de la URL sin recargar
    window.history.replaceState({}, document.title, window.location.pathname);

    if (!currentUser || !pendingPurchase || (pendingPurchase.userId && pendingPurchase.userId !== currentUser.id)) {
        showToast('Recibimos el retorno del pago. Validaremos tus créditos antes de confirmarlo.', 'info');
        return;
    }

    showToast('Validando pago y actualización de créditos...', 'info');
    const creditsApplied = await confirmPendingPurchaseCredits(pendingPurchase);
    clearPendingPurchase();

    if (creditsApplied) {
        if (typeof updateStudiosCounter === 'function') updateStudiosCounter();
        showToast('Pago verificado. Tus créditos ya están disponibles.', 'success');
        return;
    }

    showToast('Recibimos el retorno del pago, pero aún no vemos los créditos aplicados. Recarga en unos segundos o escríbenos si persiste.', 'warning');
}

// DOM Elements
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

// State - PDF data
let lastAnalysisData = null;

// Initialize - llamado por auth.js cuando el usuario está autenticado
function initApp() {
    initUpload();
    initChat();
    initCollapsible();
    initNewAnalysis();
    initDownloadPdf();
    handleWompiReturn(); // detectar retorno de pago Wompi
}

// ===== Upload Functionality =====
function initUpload() {
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

async function processFile(file) {
    // Verificar estudios disponibles antes de procesar
    if (!hasEstudiosDisponibles()) {
        showSectionBlocked();
        return;
    }

    const validTypes = ['application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExt)) {
        showErrorBanner(
            'Formato no soportado',
            'Por favor sube el contrato en formato PDF, DOCX o TXT.'
        );
        return;
    }

    const MAX_FILE_SIZE_MB = 10;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showErrorBanner(
            'Archivo muy grande',
            `El archivo supera los ${MAX_FILE_SIZE_MB} MB permitidos. Reduce el tamaño o convierte a TXT.`
        );
        return;
    }

    hideErrorBanner();
    showSection('loading');
    updateLoadingStep(1, 'Enviando documento...');

    // Convertir DOCX/DOC a texto plano en el browser antes de enviar
    const isDocx = fileExt === '.docx' || fileExt === '.doc' ||
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   file.type === 'application/msword';
    if (isDocx) {
        try {
            updateLoadingStep(1, 'Leyendo documento Word...');
            await loadMammoth(); // lazy-load: solo si es .docx
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            const textoExtraido = result.value ? result.value.trim() : '';
            if (!textoExtraido || textoExtraido.length < 50) {
                showSection('upload');
                showErrorBanner('No se pudo leer el documento',
                    'El archivo Word no contiene texto extraíble. Intentá exportarlo como PDF.');
                return;
            }
            // Reemplazar file por un .txt con el texto extraído
            const textBlob = new Blob([textoExtraido], { type: 'text/plain' });
            file = new File([textBlob],
                file.name.replace(/\.docx?$/i, '.txt'),
                { type: 'text/plain' });
        } catch (err) {
            showSection('upload');
            showErrorBanner('Error leyendo DOCX', 'No se pudo procesar el archivo Word: ' + err.message);
            return;
        }
    }

    try {
        updateLoadingStep(2, 'Extrayendo texto del contrato...');
        await new Promise(r => setTimeout(r, 500));

        updateLoadingStep(3, 'Analizando cláusulas con IA...');

        const response = await submitContract(file);
        console.log('Respuesta del servidor:', response);

        // --- Async: servidor devolvió job_id → hacer polling ---
        let finalResult;
        if (response.job_id) {
            finalResult = await pollJobStatus(response.job_id);
        } else {
            // Respuesta síncrona (fallback, contratos pequeños que respondieron directo)
            finalResult = response;
        }

        // Si el LLM detectó que no es un contrato de arrendamiento de vivienda urbana
        if (finalResult.error === true) {
            showSection('upload');
            showErrorBanner(
                'Documento no compatible con Ley 820',
                finalResult.motivo || 'El documento no es un contrato de arrendamiento de vivienda urbana válido.'
            );
            return;
        }

        if (!finalResult.success) {
            throw new Error(finalResult.error || 'Error al analizar el contrato');
        }

        updateLoadingStep(4, 'Análisis completado!');
        await new Promise(r => setTimeout(r, 500));

        lastAnalysisData = finalResult;
        displayResults(finalResult);
        showSection('results');

        await decrementEstudios();

    } catch (error) {
        console.error('Error processing file:', error);

        let errorMsg = error.message;
        if (error.name === 'AbortError') {
            errorMsg = 'El análisis tardó demasiado. Por favor intenta de nuevo.';
        }

        showSection('upload');
        showErrorBanner('Error al analizar el documento', errorMsg);
    }
}

async function submitContract(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Incluir user_id para almacenar en Supabase
    if (typeof currentUser !== 'undefined' && currentUser) {
        formData.append('user_id', currentUser.id);
        formData.append('user_email', currentUser.email);
    }

    // Crear controlador para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    try {
        const response = await fetch(CONFIG.N8N_BASE_URL + CONFIG.ENDPOINTS.ANALYZE, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 502 || response.status === 504) {
                throw new Error('El análisis tardó demasiado tiempo (contrato escaneado muy largo). Por favor intenta de nuevo — el servidor puede tardar hasta 4 minutos en procesar contratos escaneados.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
            throw new Error('El servidor no devolvió una respuesta. Por favor intenta de nuevo en unos minutos.');
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Error interno del servidor al procesar la respuesta. Por favor intenta de nuevo.');
        }
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ===== Polling de Job Status (consulta Supabase directamente) =====
async function pollJobStatus(jobId) {
    for (let attempt = 0; attempt < CONFIG.POLL_MAX_ATTEMPTS; attempt++) {
        await new Promise(r => setTimeout(r, CONFIG.POLL_INTERVAL));

        // Mensajes de carga progresivos
        if (attempt === 8)  updateLoadingStep(3, 'Procesando con OCR (contrato escaneado)...');
        if (attempt === 20) updateLoadingStep(3, 'Analizando cláusulas (puede tardar 2-3 min)...');
        if (attempt === 40) updateLoadingStep(3, 'Casi listo, finalizando análisis...');

        console.log(`Poll #${attempt + 1} — job: ${jobId}`);

        try {
            const { data: job, error: jobErr } = await supabaseClient
                .from('job_queue')
                .select('job_id, status, contrato_id')
                .eq('job_id', jobId)
                .single();

            if (jobErr || !job) {
                console.warn(`Poll #${attempt + 1} — job no encontrado aún`);
                continue;
            }

            console.log(`Poll #${attempt + 1} — status: ${job.status}`);

            if (job.status === 'error') {
                throw new Error('Error al procesar el contrato en el servidor');
            }

            if (job.status === 'completed' && job.contrato_id) {
                const { data: contrato, error: cErr } = await supabaseClient
                    .from('contratos')
                    .select('*')
                    .eq('id', job.contrato_id)
                    .single();

                if (!cErr && contrato) {
                    // Merge resultado_json (full analysis data) into top-level
                    // so alertas, incrementos, fechas_importantes, analisis, canon, direccion are accessible
                    const rj = contrato.resultado_json || {};
                    return { ...contrato, ...rj, success: true, contratoId: contrato.id };
                }
            }

        } catch (err) {
            if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
                throw err;
            }
            console.warn(`Poll #${attempt + 1} error red:`, err.message);
        }
    }

    throw new Error('El análisis tardó demasiado tiempo. Por favor intenta de nuevo.');
}

// ===== Display Results =====
function displayResults(data) {
    if (!data) {
        showToast('No se recibieron datos del análisis', 'error');
        return;
    }

    console.log('Display results data:', data);

    // Guardar ID para el chat
    currentContractId = data.contratoId || data.contrato_id || data.id;

    // Score de Riesgo
    const score = data.score_riesgo || data.analisis?.score_riesgo || 0;
    displayRiskScore(score);

    // Datos del contrato
    const displayData = {
        arrendador_nombre: data.arrendador_nombre || 'No especificado',
        arrendador_doc: data.arrendador_doc || '',
        arrendatario_nombre: data.arrendatario_nombre || 'No especificado',
        arrendatario_doc: data.arrendatario_doc || '',
        canon: data.canon || 0,
        direccion: data.direccion || 'No especificada',
        ciudad: data.ciudad || 'No especificada',
        fecha_inicio: data.fecha_inicio || '',
        duracion_meses: data.duracion_meses || 12
    };
    displayContractData(displayData);

    // Deudores Solidarios
    const deudores = data.deudores_solidarios || [];
    displayDeudores(deudores);

    // Alertas
    const alertas = data.alertas || data.analisis?.alertas || [];
    displayAlerts(alertas);

    // Incrementos IPC
    const incrementos = data.incrementos || [];
    displayIncrements(incrementos);

    // Fechas importantes
    displayDates(data.fechas_importantes || {});

    // Resumen del análisis
    const resumen = data.analisis?.resumen || '';
    if (resumen) {
        const resumenEl = document.getElementById('analisisResumen');
        if (resumenEl) {
            resumenEl.textContent = resumen;
        }
    }
}

function displayRiskScore(score) {
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreValue = document.getElementById('scoreValue');
    const scoreTitle = document.getElementById('scoreTitle');
    const scoreDescription = document.getElementById('scoreDescription');

    scoreValue.textContent = score;
    scoreCircle.classList.remove('low', 'medium', 'high');

    if (score >= 76) {
        scoreCircle.classList.add('high');
        scoreTitle.textContent = 'Riesgo Muy Alto — Múltiples Violaciones Críticas';
        scoreDescription.textContent = 'El contrato contiene varias cláusulas ilegales según la Ley 820 de 2003. Se recomienda no firmar sin antes negociar las cláusulas señaladas o consultar un abogado.';
    } else if (score >= 51) {
        scoreCircle.classList.add('high');
        scoreTitle.textContent = 'Riesgo Alto — Cláusulas Ilegales Detectadas';
        scoreDescription.textContent = 'Este contrato contiene cláusulas que violan la Ley 820 de 2003. Revisa las alertas críticas y exige modificarlas antes de firmar.';
    } else if (score >= 26) {
        scoreCircle.classList.add('medium');
        scoreTitle.textContent = 'Riesgo Medio — Revisar Algunas Cláusulas';
        scoreDescription.textContent = 'El contrato tiene cláusulas cuestionables. No son necesariamente ilegales, pero te recomendamos revisarlas con atención antes de firmar.';
    } else {
        scoreCircle.classList.add('low');
        scoreTitle.textContent = 'Riesgo Bajo — Contrato Conforme a Ley 820';
        scoreDescription.textContent = 'El contrato cumple con los requisitos principales de la Ley 820 de 2003. Revisa las observaciones informativas si las hay.';
    }
}

function displayContractData(data) {
    document.getElementById('arrendadorNombre').textContent =
        data.arrendador_nombre || 'No especificado';
    document.getElementById('arrendadorDoc').textContent =
        data.arrendador_doc ? `Doc: ${data.arrendador_doc}` : '';

    document.getElementById('arrendatarioNombre').textContent =
        data.arrendatario_nombre || 'No especificado';
    document.getElementById('arrendatarioDoc').textContent =
        data.arrendatario_doc ? `Doc: ${data.arrendatario_doc}` : '';

    document.getElementById('direccion').textContent =
        data.direccion || 'No especificada';
    document.getElementById('ciudad').textContent =
        data.ciudad || 'No especificada';

    document.getElementById('canon').textContent =
        data.canon ? formatCurrency(data.canon) : '-';
    document.getElementById('fechaInicio').textContent =
        data.fecha_inicio ? formatDate(data.fecha_inicio) : '-';
    document.getElementById('duracion').textContent =
        data.duracion_meses ? `${data.duracion_meses} meses` : '-';

    if (data.fecha_inicio && data.duracion_meses) {
        const inicio = new Date(data.fecha_inicio);
        const vencimiento = new Date(inicio);
        vencimiento.setMonth(vencimiento.getMonth() + parseInt(data.duracion_meses));
        document.getElementById('vencimiento').textContent = formatDate(vencimiento);
    }
}

function displayDeudores(deudores) {
    const card = document.getElementById('deudoresCard');
    const container = document.getElementById('deudoresContainer');
    if (!card || !container) return;

    if (!deudores || deudores.length === 0) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    container.innerHTML = deudores.map(d => {
        const tipoLabel = String(d.tipo || 'Deudor Solidario');
        const tipoCapital = tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1);
        return `
            <div class="party deudor">
                <div class="party-icon"><i class="fas fa-user-shield"></i></div>
                <div class="party-info">
                    <label>${escapeHTML(tipoCapital)}</label>
                    <span>${escapeHTML(d.nombre || 'No especificado')}</span>
                    <small>${d.documento ? 'Doc: ' + escapeHTML(d.documento) : ''}</small>
                </div>
            </div>
        `;
    }).join('');
}

function displayAlerts(alertas) {
    const container = document.getElementById('alertsContainer');

    if (!alertas || alertas.length === 0) {
        container.innerHTML = `
            <div class="alert success">
                <i class="fas fa-check-circle"></i>
                <div class="alert-content">
                    <h4>Sin alertas críticas</h4>
                    <p>No se detectaron cláusulas abusivas o ilegales en el contrato.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = alertas.map(alert => {
        const tipo = normalizeAlertType(alert.tipo || alert.type || 'info');
        const icon = getAlertIcon(tipo);
        const titulo = escapeHTML(alert.titulo || alert.title || 'Alerta');
        const descripcion = escapeHTML(alert.descripcion || alert.description || '');
        const referenciaLegal = alert.referencia_legal ? escapeHTML(alert.referencia_legal) : '';
        const recomendacion = alert.recomendacion ? escapeHTML(alert.recomendacion) : '';

        return `
            <div class="alert ${tipo}">
                <i class="fas ${icon}"></i>
                <div class="alert-content">
                    <h4>${titulo}</h4>
                    <p>${descripcion}</p>
                    ${referenciaLegal ? `<span class="legal-ref">${referenciaLegal}</span>` : ''}
                    ${recomendacion ? `<p class="recomendacion"><strong>Recomendación:</strong> ${recomendacion}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getAlertIcon(tipo) {
    const icons = {
        danger: 'fa-exclamation-circle',
        critica: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        advertencia: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
        success: 'fa-check-circle'
    };
    return icons[tipo] || icons.info;
}

function displayIncrements(incrementos) {
    const tbody = document.getElementById('incrementsBody');
    const proximoSpan = document.getElementById('proximoIncremento');

    if (!incrementos || incrementos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light);">No hay datos de incrementos</td></tr>';
        return;
    }

    tbody.innerHTML = incrementos.map(inc => `
        <tr>
            <td>${inc.anio || inc.ano || inc.year}</td>
            <td><span class="ipc-badge">${inc.ipc_estimado || inc.ipc_aplicado || inc.ipc || 0}%</span></td>
            <td>${formatCurrency(inc.canon_anterior || inc.canonAnterior || 0)}</td>
            <td>${formatCurrency(inc.incremento || inc.canon_proyectado || 0)}</td>
            <td><strong>${formatCurrency(inc.canon_nuevo || inc.canonNuevo || inc.canon_proyectado || 0)}</strong></td>
        </tr>
    `).join('');

    const lastInc = incrementos[incrementos.length - 1];
    if (lastInc) {
        proximoSpan.textContent = formatCurrency(lastInc.canon_nuevo || lastInc.canonNuevo || lastInc.canon_proyectado || 0);
    }
}

function displayDates(fechas) {
    const noDataMsg = 'No disponible';

    // Si no hay fechas o el objeto está vacío, mostrar mensaje
    const hasFechas = fechas && Object.keys(fechas).length > 0;

    if (hasFechas && fechas.notificacion_incremento) {
        document.getElementById('fechaNotifIncremento').textContent =
            formatDate(fechas.notificacion_incremento);
    } else {
        document.getElementById('fechaNotifIncremento').textContent = noDataMsg;
    }

    if (hasFechas && fechas.notificacion_desocupacion) {
        document.getElementById('fechaNotifTerminacion').textContent =
            formatDate(fechas.notificacion_desocupacion);
    } else {
        document.getElementById('fechaNotifTerminacion').textContent = noDataMsg;
    }

    if (hasFechas && fechas.proximo_incremento?.fecha) {
        document.getElementById('fechaProximoIncremento').textContent =
            formatDate(fechas.proximo_incremento.fecha);
    } else {
        document.getElementById('fechaProximoIncremento').textContent = noDataMsg;
    }

    if (hasFechas && fechas.dias_para_vencimiento !== undefined) {
        const diasVenc = document.getElementById('diasVencimiento');
        if (diasVenc) {
            diasVenc.textContent = `${fechas.dias_para_vencimiento} días`;
        }
    }
}

// ===== Chat Functionality =====
function initChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    sendBtn.addEventListener('click', () => sendChatMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

const chatRateLimit = { lastSent: 0, minInterval: 3000 }; // 3s entre mensajes

async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendBtn');

    const message = chatInput.value.trim();
    if (!message) return;

    if (!currentContractId) {
        showToast('Primero debes analizar un contrato', 'warning');
        return;
    }

    const now = Date.now();
    if (now - chatRateLimit.lastSent < chatRateLimit.minInterval) {
        showToast('Espera un momento antes de enviar otro mensaje.', 'info');
        return;
    }
    chatRateLimit.lastSent = now;

    // Límite freemium: 1 pregunta por contrato
    if (!isAdmin() && currentContractId && chatQuestionsUsed[currentContractId]) {
        const profile = (typeof currentUserProfile !== 'undefined') ? currentUserProfile : null;
        const plan = profile?.plan ?? 'freemium';
        if (plan === 'freemium') {
            showToast('En el plan gratuito solo puedes hacer 1 pregunta por contrato.', 'warning');
            return;
        }
    }

    addChatMessage(message, 'user');
    chatInput.value = '';
    sendBtn.disabled = true;

    const typingId = addTypingIndicator();

    try {
        const response = await fetch(CONFIG.N8N_BASE_URL + CONFIG.ENDPOINTS.CHAT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contratoId: currentContractId,
                pregunta: message,
                user_id: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : null
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        removeTypingIndicator(typingId);

        const reply = getChatResponseText(data);
        if (!reply) {
            throw new Error('El servidor no devolvió una respuesta válida.');
        }

        addChatMessage(reply, 'assistant');

        // Marcar pregunta como usada solo cuando hubo respuesta útil
        if (currentContractId) chatQuestionsUsed[currentContractId] = true;

    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        showToast(error.message || 'No se recibió una respuesta válida del asistente.', 'error');
        addChatMessage('Error al procesar la consulta. Por favor intenta de nuevo.', 'assistant');
    }

    sendBtn.disabled = false;
    chatInput.focus();
}

function addChatMessage(content, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const icon = type === 'assistant' ? 'fa-balance-scale' : 'fa-user';
    let htmlContent = sanitizeHTML(content);
    if (type === 'assistant') {
        htmlContent = formatChatResponse(content);
    }

    messageDiv.innerHTML = `
        <div class="avatar"><i class="fas ${icon}"></i></div>
        <div class="content">${htmlContent}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sanitizeHTML(str) {
    return escapeHTML(str);
}

function formatChatResponse(text) {
    // Sanear primero para prevenir XSS, luego aplicar solo los patrones de markdown conocidos
    let safe = sanitizeHTML(text);

    safe = safe.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    safe = safe.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/^- (.*?)$/gm, '<li>$1</li>');
    safe = safe.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    safe = safe.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    safe = safe.replace(/---\n([\s\S]*?)---/g, '<pre>$1</pre>');

    safe = safe.split('\n\n').map(p => {
        if (p.startsWith('<') || p.trim() === '') return p;
        return `<p>${p}</p>`;
    }).join('');

    safe = safe.replace(/<p><\/p>/g, '');
    safe = safe.replace(/\n/g, ' ');

    return safe;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = id;
    typingDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-balance-scale"></i></div>
        <div class="content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
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
    btn.addEventListener('click', () => {
        // Reset state
        currentContractId = null;
        fileInput.value = '';

        // Reset chat
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="message assistant">
                <div class="avatar"><i class="fas fa-balance-scale"></i></div>
                <div class="content">
                    <p>Soy tu abogado virtual especializado en arrendamientos. Ya analicé tu contrato. Puedes preguntarme:</p>
                    <ul>
                        <li>"¿Es legal el depósito que me piden?"</li>
                        <li>"¿Cómo notifico que quiero terminar el contrato?"</li>
                        <li>"¿Pueden subirme el arriendo más del IPC?"</li>
                        <li>"¿Qué cláusulas son abusivas?"</li>
                    </ul>
                </div>
            </div>
        `;

        showSection('upload');
    });
}

// ===== UI Helpers =====
let currentAppState = 'upload';

function showSection(section) {
    currentAppState = section;
    uploadSection.style.display = section === 'upload' ? 'flex' : 'none';
    loadingSection.style.display = section === 'loading' ? 'flex' : 'none';
    resultsSection.style.display = section === 'results' ? 'block' : 'none';
    const blocked = document.getElementById('blockedSection');
    if (blocked) blocked.style.display = 'none';
}

function updateLoadingStep(step, customMessage) {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const defaultMessages = [
        'Enviando documento...',
        'Extrayendo texto del contrato...',
        'Analizando cláusulas con IA...',
        'Análisis completado!'
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

function showErrorBanner(title, message) {
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

function hideErrorBanner() {
    const banner = document.getElementById('errorBanner');
    if (banner) banner.style.display = 'none';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const normalizedType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    toast.className = `toast ${normalizedType}`;

    const icon = normalizedType === 'success' ? 'fa-check-circle' :
                 normalizedType === 'error' ? 'fa-times-circle' :
                 normalizedType === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

    const iconEl = document.createElement('i');
    iconEl.className = `fas ${icon}`;
    const textEl = document.createElement('span');
    textEl.textContent = message;
    toast.appendChild(iconEl);
    toast.appendChild(textEl);
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== Formatters =====
function formatCurrency(value) {
    if (!value) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// ===== PDF Download =====
function initDownloadPdf() {
    const btn = document.getElementById('btnDownloadPdf');
    if (btn) {
        btn.addEventListener('click', generatePDF);
    }
}

async function generatePDF() {
    if (!lastAnalysisData) {
        showToast('No hay análisis disponible para descargar', 'warning');
        return;
    }

    try {
    await loadPDFLibraries(); // lazy-load: solo cuando el usuario pide el PDF

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const data = lastAnalysisData;
    const score = data.score_riesgo || data.analisis?.score_riesgo || 0;
    const alertas = data.alertas || [];
    const incrementos = data.incrementos || [];
    const fechas = data.fechas_importantes || {};
    const resumen = data.analisis?.resumen || '';
    const deudoresSolidarios = data.deudores_solidarios || [];

    // Colores institucionales
    const COLOR_HEADER  = [30, 58, 138];   // azul oscuro
    const COLOR_ALTO    = [185, 28, 28];   // rojo
    const COLOR_MEDIO   = [161, 98, 7];    // naranja
    const COLOR_BAJO    = [21, 128, 61];   // verde
    const COLOR_GRIS    = [107, 114, 128];
    const COLOR_LINEA   = [229, 231, 235];
    const COLOR_FONDO   = [249, 250, 251];

    const scoreColor = score >= 51 ? COLOR_ALTO : score >= 26 ? COLOR_MEDIO : COLOR_BAJO;
    const scoreLabel = score >= 76 ? 'RIESGO MUY ALTO' : score >= 51 ? 'RIESGO ALTO' : score >= 26 ? 'RIESGO MEDIO' : 'RIESGO BAJO';

    const PAGE_W = 210;
    const MARGIN = 14;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    let y = 0;

    // ── Función auxiliar: nueva página si es necesario ──
    function checkPage(needed = 20) {
        if (y + needed > 272) {
            doc.addPage();
            y = 14;
            drawFooter();
        }
    }

    // ── Footer ──
    function drawFooter() {
        const pageNum = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(...COLOR_GRIS);
        doc.text('InmoLawyer — Análisis basado en Ley 820 de 2003 (Colombia)', MARGIN, 290);
        doc.text(`Pág. ${pageNum}`, PAGE_W - MARGIN, 290, { align: 'right' });
        doc.text('Este documento es informativo y no constituye asesoría legal profesional.', MARGIN, 294);
    }

    // ════════════════════════════════════
    //  ENCABEZADO
    // ════════════════════════════════════
    doc.setFillColor(...COLOR_HEADER);
    doc.rect(0, 0, PAGE_W, 36, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('InmoLawyer', MARGIN, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Análisis de Contrato de Arrendamiento — Ley 820 de 2003', MARGIN, 21);

    const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.setFontSize(8);
    doc.text(`Generado: ${hoy}`, PAGE_W - MARGIN, 21, { align: 'right' });

    y = 44;

    // ════════════════════════════════════
    //  SCORE DE RIESGO
    // ════════════════════════════════════
    // Círculo del score
    doc.setFillColor(...scoreColor);
    doc.circle(MARGIN + 14, y + 10, 13, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(String(score), MARGIN + 14, y + 12, { align: 'center' });

    // Texto del score
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...scoreColor);
    doc.text(scoreLabel, MARGIN + 32, y + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    const scoreDesc = score >= 76
        ? 'Contiene múltiples cláusulas ilegales. No firmar sin negociar o consultar un abogado.'
        : score >= 51
        ? 'Cláusulas que violan la Ley 820 detectadas. Exige modificarlas antes de firmar.'
        : score >= 26
        ? 'Cláusulas cuestionables. Revísalas con atención antes de firmar.'
        : 'El contrato cumple con los requisitos principales de la Ley 820 de 2003.';
    const descLines = doc.splitTextToSize(scoreDesc, CONTENT_W - 36);
    doc.text(descLines, MARGIN + 32, y + 14);

    y += 30;

    // Línea separadora
    doc.setDrawColor(...COLOR_LINEA);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 7;

    // ════════════════════════════════════
    //  RESUMEN EJECUTIVO
    // ════════════════════════════════════
    if (resumen) {
        checkPage(20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_HEADER);
        doc.text('RESUMEN EJECUTIVO', MARGIN, y);
        y += 5;

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const resLines = doc.splitTextToSize(resumen, CONTENT_W);
        doc.text(resLines, MARGIN, y);
        y += resLines.length * 4.5 + 6;

        doc.setDrawColor(...COLOR_LINEA);
        doc.line(MARGIN, y, PAGE_W - MARGIN, y);
        y += 7;
    }

    // ════════════════════════════════════
    //  DATOS DEL CONTRATO
    // ════════════════════════════════════
    checkPage(50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_HEADER);
    doc.text('DATOS DEL CONTRATO', MARGIN, y);
    y += 6;

    // Helper: fila de dato
    function drawDataRow(label, value, x, rowY, colW) {
        doc.setFillColor(...COLOR_FONDO);
        doc.rect(x, rowY - 4, colW, 8, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_GRIS);
        doc.text(label.toUpperCase(), x + 2, rowY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(8.5);
        const valLines = doc.splitTextToSize(value || '—', colW - 4);
        doc.text(valLines[0], x + 2, rowY + 4);
        return rowY + 10;
    }

    const halfW = (CONTENT_W - 4) / 2;

    // Fila 1: Arrendador / Arrendatario
    drawDataRow('Arrendador', data.arrendador_nombre || '—', MARGIN, y, halfW);
    drawDataRow('Arrendatario', data.arrendatario_nombre || '—', MARGIN + halfW + 4, y, halfW);
    y += 12;

    // Fila 2b: Documentos
    drawDataRow('Cédula Arrendador', data.arrendador_doc || '—', MARGIN, y, halfW);
    drawDataRow('Cédula Arrendatario', data.arrendatario_doc || '—', MARGIN + halfW + 4, y, halfW);
    y += 12;

    // Fila 2c: Deudores Solidarios (si existen)
    if (deudoresSolidarios.length > 0) {
        checkPage(10 + deudoresSolidarios.length * 12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_HEADER);
        doc.text('DEUDORES SOLIDARIOS / FIADORES', MARGIN, y + 3);
        y += 8;

        deudoresSolidarios.forEach((d, idx) => {
            const dLabel = (d.tipo || 'Deudor Solidario').charAt(0).toUpperCase() + (d.tipo || 'Deudor Solidario').slice(1);
            const dValue = d.nombre + (d.documento ? `  —  Doc: ${d.documento}` : '');
            drawDataRow(`${dLabel} ${idx + 1}`, dValue, MARGIN, y, CONTENT_W);
            y += 12;
        });
    }

    // Fila 3: Inmueble / Ciudad
    drawDataRow('Dirección', data.direccion || '—', MARGIN, y, halfW);
    drawDataRow('Ciudad', data.ciudad || '—', MARGIN + halfW + 4, y, halfW);
    y += 12;

    // Fila 3: Canon / Fecha Inicio / Duración / Depósito
    const quarterW = (CONTENT_W - 6) / 4;
    const inicio = data.fecha_inicio ? formatDate(data.fecha_inicio) : '—';
    const vencStr = (() => {
        if (data.fecha_inicio && data.duracion_meses) {
            const d = new Date(data.fecha_inicio);
            d.setMonth(d.getMonth() + parseInt(data.duracion_meses));
            return formatDate(d);
        }
        return '—';
    })();

    drawDataRow('Canon mensual', data.canon ? formatCurrency(data.canon) : '—', MARGIN, y, quarterW);
    drawDataRow('Fecha inicio', inicio, MARGIN + quarterW + 2, y, quarterW);
    drawDataRow('Duración', data.duracion_meses ? `${data.duracion_meses} meses` : '—', MARGIN + (quarterW + 2) * 2, y, quarterW);
    drawDataRow('Vencimiento', vencStr, MARGIN + (quarterW + 2) * 3, y, quarterW);
    y += 14;

    doc.setDrawColor(...COLOR_LINEA);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 7;

    // ════════════════════════════════════
    //  ALERTAS LEGALES
    // ════════════════════════════════════
    checkPage(20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_HEADER);
    doc.text(`ALERTAS LEGALES (${alertas.length})`, MARGIN, y);
    y += 6;

    if (alertas.length === 0) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(21, 128, 61);
        doc.text('✓ No se detectaron cláusulas abusivas o ilegales.', MARGIN, y);
        y += 8;
    } else {
        alertas.forEach((alerta, idx) => {
            const tipo = (alerta.tipo || 'info').toLowerCase();
            const alertColor = tipo === 'critica' || tipo === 'danger' ? COLOR_ALTO
                             : tipo === 'advertencia' || tipo === 'warning' ? COLOR_MEDIO
                             : [37, 99, 235];

            checkPage(28);

            // Barra de color lateral
            doc.setFillColor(...alertColor);
            doc.rect(MARGIN, y - 1, 2.5, 22, 'F');

            // Fondo claro
            doc.setFillColor(248, 250, 252);
            doc.rect(MARGIN + 2.5, y - 1, CONTENT_W - 2.5, 22, 'F');

            // Número
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...alertColor);
            doc.text(`${String(idx + 1).padStart(2, '0')}`, MARGIN + 5, y + 4);

            // Título
            doc.setFontSize(9);
            doc.setTextColor(17, 24, 39);
            doc.text(alerta.titulo || 'Alerta', MARGIN + 14, y + 4);

            // Tipo badge
            const tipoLabel = tipo === 'critica' ? 'CRÍTICA' : tipo === 'advertencia' ? 'ADVERTENCIA' : 'INFO';
            doc.setFontSize(6.5);
            doc.setTextColor(...alertColor);
            doc.text(tipoLabel, PAGE_W - MARGIN - 2, y + 4, { align: 'right' });

            // Descripción
            doc.setFontSize(7.8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(55, 65, 81);
            const descLines2 = doc.splitTextToSize(alerta.descripcion || '', CONTENT_W - 16);
            doc.text(descLines2[0] || '', MARGIN + 14, y + 10);

            // Referencia legal
            if (alerta.referencia_legal) {
                doc.setFontSize(7);
                doc.setTextColor(...COLOR_GRIS);
                doc.text(`⚖ ${alerta.referencia_legal}`, MARGIN + 14, y + 16);
            }

            // Recomendación
            if (alerta.recomendacion) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(55, 65, 81);
                const recLines = doc.splitTextToSize(`→ ${alerta.recomendacion}`, CONTENT_W - 16);
                doc.text(recLines[0], MARGIN + 14, y + (alerta.referencia_legal ? 20 : 16));
            }

            y += 25;
        });
    }

    doc.setDrawColor(...COLOR_LINEA);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 7;

    // ════════════════════════════════════
    //  INCREMENTOS IPC
    // ════════════════════════════════════
    if (incrementos.length > 0) {
        checkPage(30);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_HEADER);
        doc.text('INCREMENTOS ANUALES IPC (DANE)', MARGIN, y);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR_GRIS);
        doc.text('Calculados desde el inicio del contrato hasta el año actual con datos certificados', MARGIN, y + 5);
        y += 10;

        doc.autoTable({
            startY: y,
            margin: { left: MARGIN, right: MARGIN },
            head: [['Año', 'IPC Aplicado', 'Canon Anterior', 'Incremento', 'Canon Nuevo']],
            body: incrementos.map(inc => [
                inc.anio || '—',
                `${inc.ipc_aplicado || inc.ipc_estimado || 0}%`,
                formatCurrency(inc.canon_anterior || 0),
                formatCurrency(inc.incremento || 0),
                formatCurrency(inc.canon_proyectado || 0)
            ]),
            headStyles: {
                fillColor: COLOR_HEADER,
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: { fontSize: 8, halign: 'center' },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: COLOR_FONDO },
            tableLineColor: COLOR_LINEA,
            tableLineWidth: 0.2
        });

        y = doc.lastAutoTable.finalY + 8;

        doc.setDrawColor(...COLOR_LINEA);
        doc.line(MARGIN, y, PAGE_W - MARGIN, y);
        y += 7;
    }

    // ════════════════════════════════════
    //  FECHAS IMPORTANTES
    // ════════════════════════════════════
    const hasFechas = fechas && Object.keys(fechas).length > 0;
    if (hasFechas) {
        checkPage(35);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_HEADER);
        doc.text('FECHAS IMPORTANTES', MARGIN, y);
        y += 7;

        const fechaItems = [
            { icon: '📅', label: 'Próximo incremento', value: fechas.proximo_incremento?.fecha ? formatDate(fechas.proximo_incremento.fecha) : '—', color: COLOR_MEDIO },
            { icon: '🔔', label: 'Notificar incremento', value: fechas.notificacion_incremento ? formatDate(fechas.notificacion_incremento) : '—', desc: '1 mes antes del aniversario', color: COLOR_MEDIO },
            { icon: '🚪', label: 'Notificar terminación', value: fechas.notificacion_desocupacion ? formatDate(fechas.notificacion_desocupacion) : '—', desc: '3 meses antes — Art. 22 Ley 820', color: COLOR_ALTO },
            { icon: '📆', label: 'Días para vencimiento', value: fechas.dias_para_vencimiento !== undefined ? `${fechas.dias_para_vencimiento} días` : '—', color: COLOR_HEADER }
        ];

        const fItemW = (CONTENT_W - 6) / 2;
        fechaItems.forEach((item, i) => {
            const fx = i % 2 === 0 ? MARGIN : MARGIN + fItemW + 6;
            const fy = y + Math.floor(i / 2) * 18;

            doc.setFillColor(...COLOR_FONDO);
            doc.rect(fx, fy - 3, fItemW, 14, 'F');
            doc.setDrawColor(...item.color);
            doc.setLineWidth(0.5);
            doc.rect(fx, fy - 3, fItemW, 14);
            doc.setLineWidth(0.3);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...item.color);
            doc.text(item.label.toUpperCase(), fx + 3, fy + 2);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text(item.value, fx + 3, fy + 8);
        });

        y += Math.ceil(fechaItems.length / 2) * 18 + 6;
    }

    // ════════════════════════════════════
    //  PIE DE PÁGINA EN TODAS LAS PÁGINAS
    // ════════════════════════════════════
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawFooter();
    }

    // ════════════════════════════════════
    //  GUARDAR
    // ════════════════════════════════════
    const arrendatario = (data.arrendatario_nombre || 'contrato').replace(/\s+/g, '_').substring(0, 20);
    const fechaHoy = new Date().toISOString().split('T')[0];
    doc.save(`InmoLawyer_${arrendatario}_${fechaHoy}.pdf`);

    showToast('PDF descargado correctamente', 'success');

    } catch (err) {
        console.error('PDF generation failed:', err);
        showToast('Error generando el PDF. Intenta de nuevo.', 'error');
    }
}

// ===== PANEL ADMINISTRADOR =====

let adminPanelVisible = false;
let activeAdminTab = 'stats';
let usersDataCache = []; // cache de la página actual para filtrado y export CSV

// Paginación del registro de clientes
const ADMIN_PAGE_SIZE = 50;
let adminUsersPage = 0;
let adminUsersTotalCount = 0;

// Cache con TTL para evitar refetches innecesarios
const ADMIN_CACHE = {
    stats: null, statsAt: 0,
    TTL: 5 * 60 * 1000 // 5 minutos
};

function toggleAdminPanel() {
    if (!isAdmin()) return;
    adminPanelVisible = !adminPanelVisible;
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = adminPanelVisible ? 'block' : 'none';
        if (adminPanelVisible) loadAdminData();
    }
}

function switchAdminTab(tab) {
    activeAdminTab = tab;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.getElementById('adminTabStats').style.display = tab === 'stats' ? 'block' : 'none';
    document.getElementById('adminTabClientes').style.display = tab === 'clientes' ? 'block' : 'none';
    if (tab === 'clientes' && usersDataCache.length === 0) {
        loadUsersRegistry(0);
        loadTopPreguntas();
    }
}

async function loadAdminData(forceRefresh = false) {
    if (!isAdmin()) return;

    const now = Date.now();
    if (!forceRefresh && ADMIN_CACHE.stats && (now - ADMIN_CACHE.statsAt) < ADMIN_CACHE.TTL) {
        renderAdminStats(ADMIN_CACHE.stats);
        return;
    }

    try {
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);

        // 5 queries en paralelo (antes eran 7 secuenciales, 4 full-table scans)
        const [
            { count: totalContratos },
            { count: contratosMes },
            { count: totalConsultas },
            { data: contractData },
            { data: recientes }
        ] = await Promise.all([
            supabaseClient.from('contratos').select('*', { count: 'exact', head: true }),
            supabaseClient.from('contratos').select('*', { count: 'exact', head: true }).gte('created_at', firstOfMonth.toISOString()),
            supabaseClient.from('consultas_chat').select('*', { count: 'exact', head: true }),
            supabaseClient.from('contratos').select('user_email, score_riesgo, ciudad'),
            supabaseClient.from('contratos').select('created_at, ciudad, score_riesgo, user_email, duracion_meses').order('created_at', { ascending: false }).limit(20)
        ]);

        // Usuarios únicos desde contractData (client-side, sin query extra)
        const uniqueUsers = new Set((contractData || []).map(r => r.user_email).filter(Boolean)).size;

        // Distribución de riesgo
        let riskHTML;
        if (contractData && contractData.length > 0) {
            const high = contractData.filter(c => (c.score_riesgo || 0) >= 51).length;
            const med  = contractData.filter(c => (c.score_riesgo || 0) >= 26 && (c.score_riesgo || 0) < 51).length;
            const low  = contractData.filter(c => (c.score_riesgo || 0) < 26).length;
            riskHTML = `
                <div class="risk-bar"><span class="risk-label danger">🔴 Alto (&ge;51)</span><strong class="risk-count">${high}</strong></div>
                <div class="risk-bar"><span class="risk-label warning">🟡 Medio (26-50)</span><strong class="risk-count">${med}</strong></div>
                <div class="risk-bar"><span class="risk-label success">🟢 Bajo (&lt;26)</span><strong class="risk-count">${low}</strong></div>
            `;
        } else {
            riskHTML = '<p class="admin-empty">Sin datos aún</p>';
        }

        // Top ciudades
        let ciudadesHTML;
        if (contractData && contractData.length > 0) {
            const freq = {};
            contractData.forEach(r => { if (r.ciudad) freq[r.ciudad] = (freq[r.ciudad] || 0) + 1; });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
            ciudadesHTML = sorted
                .map(([city, n]) => `<div class="ciudad-row"><span>${escapeHTML(city)}</span><strong>${n}</strong></div>`)
                .join('') || '<p class="admin-empty">Sin datos aún</p>';
        } else {
            ciudadesHTML = '<p class="admin-empty">Sin datos aún</p>';
        }

        // Tabla contratos recientes
        let recientesHTML;
        if (recientes && recientes.length > 0) {
            recientesHTML = recientes.map(c => {
                const score = c.score_riesgo ?? null;
                const scoreClass = score === null ? '' : score >= 51 ? 'high' : score >= 26 ? 'med' : 'low';
                return `<tr>
                    <td>${new Date(c.created_at).toLocaleDateString('es-CO')}</td>
                    <td>${escapeHTML(c.user_email || '—')}</td>
                    <td>${escapeHTML(c.ciudad || '—')}</td>
                    <td>${score !== null ? `<span class="score-badge ${scoreClass}">${score}</span>` : '—'}</td>
                    <td>${escapeHTML(c.duracion_meses ? c.duracion_meses + ' meses' : '—')}</td>
                </tr>`;
            }).join('');
        } else {
            recientesHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px">Sin contratos aún</td></tr>';
        }

        // Guardar en caché
        ADMIN_CACHE.stats = { totalContratos, contratosMes, totalConsultas, uniqueUsers, riskHTML, ciudadesHTML, recientesHTML };
        ADMIN_CACHE.statsAt = Date.now();

        renderAdminStats(ADMIN_CACHE.stats);

        // Si el tab de clientes está activo, recargar también
        if (activeAdminTab === 'clientes') {
            adminUsersPage = 0;
            usersDataCache = [];
            loadUsersRegistry(0);
            loadTopPreguntas();
        }

    } catch (err) {
        console.error('Admin panel error:', err);
        showToast('Error cargando datos del panel admin: ' + err.message, 'error');
    }
}

function renderAdminStats(s) {
    document.getElementById('statTotalContratos').textContent = s.totalContratos ?? '—';
    document.getElementById('statContratosMes').textContent = s.contratosMes ?? '—';
    document.getElementById('statConsultas').textContent = s.totalConsultas ?? '—';
    document.getElementById('statUsuarios').textContent = s.uniqueUsers || '—';
    document.getElementById('riskDistribution').innerHTML = s.riskHTML;
    document.getElementById('topCiudades').innerHTML = s.ciudadesHTML;
    document.getElementById('adminContractosBody').innerHTML = s.recientesHTML;
}

// ===== CLIENTES: Registro de usuarios =====

async function loadUsersRegistry(page = 0) {
    if (!isAdmin()) return;
    adminUsersPage = page;
    const tbody = document.getElementById('usersTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px"><i class="fas fa-spinner fa-spin"></i> Cargando clientes...</td></tr>';

    try {
        const from = page * ADMIN_PAGE_SIZE;
        const to   = from + ADMIN_PAGE_SIZE - 1;

        // Paginación server-side: solo trae los usuarios de esta página
        const { data: profiles, count: totalCount } = await supabaseClient
            .from('user_profiles')
            .select('id, email, nombre, fecha_registro, plan, estudios_restantes, alias_detectado', { count: 'exact' })
            .order('fecha_registro', { ascending: false })
            .range(from, to);

        if (totalCount !== null) adminUsersTotalCount = totalCount;

        if (!profiles || profiles.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px">No hay clientes registrados</td></tr>';
            updatePaginationUI();
            return;
        }

        // Traer contratos y chats SOLO para los usuarios de esta página (filtrado por ids)
        const userIds = profiles.map(p => p.id);
        const [{ data: contratos }, { data: chats }] = await Promise.all([
            supabaseClient.from('contratos').select('user_id, created_at').in('user_id', userIds),
            supabaseClient.from('consultas_chat').select('user_id, created_at').in('user_id', userIds)
        ]);

        const now = new Date();
        const hace30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const hace7  = new Date(now -  7 * 24 * 60 * 60 * 1000);
        const primerDelMes = new Date(now.getFullYear(), now.getMonth(), 1);

        // Agrupar contratos por user_id
        const contratosByUser = {};
        (contratos || []).forEach(c => {
            if (!c.user_id) return;
            if (!contratosByUser[c.user_id]) contratosByUser[c.user_id] = { total: 0, esteMes: 0, lastAt: null };
            contratosByUser[c.user_id].total++;
            const d = new Date(c.created_at);
            if (d >= primerDelMes) contratosByUser[c.user_id].esteMes++;
            if (!contratosByUser[c.user_id].lastAt || d > contratosByUser[c.user_id].lastAt)
                contratosByUser[c.user_id].lastAt = d;
        });

        // Agrupar chats por user_id
        const chatsByUser = {};
        (chats || []).forEach(c => {
            if (!c.user_id) return;
            if (!chatsByUser[c.user_id]) chatsByUser[c.user_id] = { total: 0, lastAt: null };
            chatsByUser[c.user_id].total++;
            const d = new Date(c.created_at);
            if (!chatsByUser[c.user_id].lastAt || d > chatsByUser[c.user_id].lastAt)
                chatsByUser[c.user_id].lastAt = d;
        });

        // Construir array enriquecido (solo los perfiles de esta página)
        usersDataCache = profiles.map(u => {
            const cts = contratosByUser[u.id] || { total: 0, esteMes: 0, lastAt: null };
            const chs = chatsByUser[u.id]     || { total: 0, lastAt: null };
            const lastAct = [cts.lastAt, chs.lastAt].filter(Boolean).sort((a,b) => b-a)[0] || null;

            let tipo;
            if (cts.esteMes >= 3) {
                tipo = 'power';
            } else if (lastAct && lastAct >= hace30) {
                tipo = 'activo';
            } else {
                tipo = 'inactivo';
            }

            return {
                id: u.id,
                email: u.email,
                nombre: u.nombre || '',
                fecha_registro: u.fecha_registro,
                es_nuevo: new Date(u.fecha_registro) >= hace7,
                ultima_actividad: lastAct,
                contratos: cts.total,
                consultas: chs.total,
                tipo,
                plan: u.plan ?? 'freemium',
                estudios_restantes: u.estudios_restantes ?? 5,
                alias_detectado: u.alias_detectado ?? false
            };
        });

        renderUsersTable(usersDataCache);
        updatePaginationUI();

    } catch (err) {
        console.error('Error cargando clientes:', err);
        const tbody = document.getElementById('usersTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#dc2626;padding:20px">Error: ${escapeHTML(err.message)}</td></tr>`;
    }
}

function updatePaginationUI() {
    const totalPages = Math.ceil(adminUsersTotalCount / ADMIN_PAGE_SIZE);
    const pageInfo = document.getElementById('adminPageInfo');
    const btnPrev  = document.getElementById('btnPrevPage');
    const btnNext  = document.getElementById('btnNextPage');
    if (!pageInfo) return;
    pageInfo.textContent = `Página ${adminUsersPage + 1} de ${totalPages || 1} (${adminUsersTotalCount} clientes)`;
    if (btnPrev) btnPrev.disabled = adminUsersPage === 0;
    if (btnNext) btnNext.disabled = (adminUsersPage + 1) >= totalPages;
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    const countBadge = document.getElementById('usersCount');
    if (!tbody) return;

    if (countBadge) countBadge.textContent = users.length;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px">No hay clientes registrados</td></tr>';
        return;
    }

    const tipoBadge = {
        power:   '<span class="badge-activity badge-power"><i class="fas fa-bolt"></i> Power User</span>',
        activo:  '<span class="badge-activity badge-activo"><i class="fas fa-circle"></i> Activo</span>',
        inactivo:'<span class="badge-activity badge-inactivo"><i class="fas fa-moon"></i> Inactivo</span>'
    };

    tbody.innerHTML = users.map(u => {
        const nuevoTag = u.es_nuevo ? '<span class="badge-nuevo">NUEVO</span>' : '';
        const aliasTag = u.alias_detectado ? '<span class="badge-alias" title="Registrado con email +alias">⚠️ alias</span>' : '';
        const lastActStr = u.ultima_actividad
            ? new Date(u.ultima_actividad).toLocaleDateString('es-CO')
            : '—';
        const regStr = new Date(u.fecha_registro).toLocaleDateString('es-CO');
        const nombre = u.nombre
            ? escapeHTML(u.nombre)
            : '<span style="color:#64748b;font-style:italic">Sin nombre</span>';
        const verBtn = u.consultas > 0
            ? `<button class="btn-ver-preguntas" onclick="showUserQuestionsById('${u.id}')"><i class="fas fa-eye"></i></button>`
            : '';
        const estudiosTag = u.estudios_restantes !== undefined
            ? `<span class="badge-estudios">${escapeHTML(u.estudios_restantes)}</span>`
            : '';
        return `<tr>
            <td>${nombre}</td>
            <td class="email-cell">${escapeHTML(u.email)} ${aliasTag}</td>
            <td>${tipoBadge[u.tipo] || ''}</td>
            <td>${escapeHTML(regStr)} ${nuevoTag}</td>
            <td>${escapeHTML(lastActStr)}</td>
            <td class="num-cell">${escapeHTML(u.contratos)}</td>
            <td class="num-cell">${escapeHTML(u.consultas)}</td>
            <td class="num-cell">${estudiosTag}</td>
            <td>${verBtn}</td>
        </tr>`;
    }).join('');
}

let _filterUsersTimeout;
function filterUsers() {
    clearTimeout(_filterUsersTimeout);
    _filterUsersTimeout = setTimeout(_applyUsersFilter, 300);
}

function _applyUsersFilter() {
    const search = (document.getElementById('userSearch')?.value || '').toLowerCase();
    const activity = document.getElementById('activityFilter')?.value || '';
    const onlyNew = document.getElementById('newFilter')?.value === 'new';

    const filtered = usersDataCache.filter(u => {
        const email = (u.email || '').toLowerCase();
        const nombre = (u.nombre || '').toLowerCase();
        if (search && !email.includes(search) && !nombre.includes(search)) return false;
        if (activity && u.tipo !== activity) return false;
        if (onlyNew && !u.es_nuevo) return false;
        return true;
    });

    renderUsersTable(filtered);
}

function exportUsersCSV() {
    if (!usersDataCache.length) return;
    const headers = ['Nombre','Email','Nivel','Nuevo','Fecha Registro','Ultima Actividad','Contratos','Consultas'];
    const rows = usersDataCache.map(u => [
        u.nombre || '',
        u.email,
        u.tipo,
        u.es_nuevo ? 'Si' : 'No',
        new Date(u.fecha_registro).toLocaleDateString('es-CO'),
        u.ultima_actividad ? new Date(u.ultima_actividad).toLocaleDateString('es-CO') : '',
        u.contratos,
        u.consultas
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes-inmolawyer-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// ===== TOP PREGUNTAS FRECUENTES =====

async function loadTopPreguntas() {
    if (!isAdmin()) return;
    const container = document.getElementById('topPreguntasContainer');
    if (!container) return;

    try {
        const { data } = await supabaseClient
            .from('consultas_chat')
            .select('pregunta')
            .limit(500);

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="admin-empty">Sin consultas aún</p>';
            return;
        }

        // Normalizar y contar
        const freq = {};
        data.forEach(r => {
            if (!r.pregunta) return;
            const key = r.pregunta.trim().toLowerCase().slice(0, 120);
            freq[key] = (freq[key] || 0) + 1;
        });

        const top10 = Object.entries(freq)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 10);

        const maxCount = top10[0]?.[1] || 1;

        container.innerHTML = top10.map(([pregunta, count], i) => {
            const pct = Math.round((count / maxCount) * 100);
            const preguntaLabel = escapeHTML(pregunta.charAt(0).toUpperCase() + pregunta.slice(1));
            return `<div class="top-pregunta-row">
                <span class="pregunta-rank">${i+1}</span>
                <div class="pregunta-info">
                    <p class="pregunta-text">${preguntaLabel}</p>
                    <div class="pregunta-bar-wrap">
                        <div class="pregunta-bar" style="width:${pct}%"></div>
                    </div>
                </div>
                <span class="pregunta-count">${escapeHTML(count)}x</span>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Error cargando preguntas:', err);
        container.innerHTML = '<p class="admin-empty">Error cargando preguntas</p>';
    }
}

function showUserQuestionsById(userId) {
    const user = usersDataCache.find(u => u.id === userId);
    const userName = user?.nombre || user?.email || 'Usuario';
    return showUserQuestions(userId, userName);
}

// ===== MODAL: PREGUNTAS DE UN USUARIO =====

async function showUserQuestions(userId, userName) {
    const modal = document.getElementById('userQuestionsModal');
    const content = document.getElementById('uqModalContent');
    const title = document.getElementById('uqModalUserName');
    if (!modal || !content) return;

    if (title) title.textContent = userName;
    content.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    modal.style.display = 'flex';

    try {
        const { data } = await supabaseClient
            .from('consultas_chat')
            .select('pregunta, respuesta, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!data || data.length === 0) {
            content.innerHTML = '<p class="admin-empty">Este usuario no tiene consultas registradas.</p>';
            return;
        }

        content.innerHTML = data.map(q => `
            <div class="uq-item">
                <div class="uq-meta">${escapeHTML(new Date(q.created_at).toLocaleString('es-CO'))}</div>
                <div class="uq-question"><i class="fas fa-question-circle"></i> ${escapeHTML(q.pregunta || '—')}</div>
                ${q.respuesta ? `<div class="uq-answer"><i class="fas fa-balance-scale"></i> ${escapeHTML(q.respuesta.slice(0, 300))}${q.respuesta.length > 300 ? '…' : ''}</div>` : ''}
            </div>
        `).join('');

    } catch (err) {
        content.innerHTML = `<p style="color:#dc2626">Error: ${escapeHTML(err.message)}</p>`;
    }
}

function closeUserQuestionsModal(event) {
    if (event && event.target !== document.getElementById('userQuestionsModal')) return;
    document.getElementById('userQuestionsModal').style.display = 'none';
}

// ===== MIS CONTRATOS: Dashboard de historial =====

function showAppTab(tab) {
    document.querySelectorAll('.app-nav-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === tab));
    const isAnalizar = tab === 'analizar';
    uploadSection.style.display  = isAnalizar && currentAppState === 'upload'   ? 'flex'   : 'none';
    resultsSection.style.display = isAnalizar && currentAppState === 'results'  ? 'block'  : 'none';
    loadingSection.style.display = 'none';
    const blocked = document.getElementById('blockedSection');
    if (blocked) blocked.style.display = isAnalizar && currentAppState === 'blocked' ? 'flex' : 'none';
    document.getElementById('historialSection').style.display = isAnalizar ? 'none' : 'block';
    if (!isAnalizar) loadMisContratos();
}

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

    if (countEl) countEl.textContent = `${data.length} análisis`;

    tbody.innerHTML = data.map(c => {
        const fecha = new Date(c.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        const score = c.score_riesgo ?? '—';
        const scoreClass = typeof score === 'number'
            ? (score >= 51 ? 'score-badge-high' : score >= 26 ? 'score-badge-med' : 'score-badge-low')
            : 'score-badge-med';
        const riesgoLabel = typeof score === 'number'
            ? (score >= 51 ? 'Alto' : score >= 26 ? 'Medio' : 'Bajo')
            : '—';
        return `<tr>
            <td>${escapeHTML(fecha)}</td>
            <td>${escapeHTML(c.arrendatario_nombre || '—')}</td>
            <td>${escapeHTML(c.arrendador_nombre || '—')}</td>
            <td>${escapeHTML(c.ciudad || '—')}</td>
            <td><span class="score-badge ${scoreClass}">${score} · ${riesgoLabel}</span></td>
            <td><button class="btn-dl-pdf" onclick="downloadHistorialPDF(this)">
                <i class="fas fa-file-pdf"></i> PDF
            </button></td>
        </tr>`;
    }).join('');

    // Guardar datos en dataset para acceso limpio desde el botón
    data.forEach((c, i) => {
        const btn = tbody.querySelectorAll('.btn-dl-pdf')[i];
        if (btn) btn._contractData = c;
    });
}

async function downloadHistorialPDF(btn) {
    const contractData = btn._contractData;
    if (!contractData) return;
    lastAnalysisData = { ...contractData, ...(contractData.analisis || {}) };
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
