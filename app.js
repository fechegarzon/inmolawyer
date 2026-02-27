// InmoLawyer - Frontend App v3.0
// Arquitectura Síncrona - Respuesta Directa

const CONFIG = {
    N8N_BASE_URL: 'https://n8n.feche.xyz/webhook',
    ENDPOINTS: {
        ANALYZE: '/analizar-contrato',
        CHAT: '/consulta-contrato'
    },
    TIMEOUT: 300000 // 5 minutos para análisis con OCR de contratos escaneados
};

// State
let currentContractId = null;

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

        // Pequeña pausa para UX
        await new Promise(r => setTimeout(r, 500));

        updateLoadingStep(3, 'Analizando cláusulas con IA...');

        // Llamada directa - esperar respuesta completa del análisis
        const response = await submitContract(file);

        console.log('Respuesta del servidor:', response);

        // Si el LLM detectó que no es un contrato de arrendamiento de vivienda urbana
        if (response.error === true) {
            showSection('upload');
            showErrorBanner(
                'Documento no compatible con Ley 820',
                response.motivo || 'El documento no es un contrato de arrendamiento de vivienda urbana válido.'
            );
            return;
        }

        if (!response.success) {
            throw new Error(response.error || 'Error al analizar el contrato');
        }

        updateLoadingStep(4, 'Análisis completado!');

        // Pequeña pausa para mostrar "completado"
        await new Promise(r => setTimeout(r, 500));

        lastAnalysisData = response;
        displayResults(response);
        showSection('results');

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
        const tipoLabel = d.tipo || 'Deudor Solidario';
        const tipoCapital = tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1);
        return `
            <div class="party deudor">
                <div class="party-icon"><i class="fas fa-user-shield"></i></div>
                <div class="party-info">
                    <label>${tipoCapital}</label>
                    <span>${d.nombre || 'No especificado'}</span>
                    <small>${d.documento ? 'Doc: ' + d.documento : ''}</small>
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
        const tipo = alert.tipo || alert.type || 'info';
        const icon = getAlertIcon(tipo);

        return `
            <div class="alert ${tipo}">
                <i class="fas ${icon}"></i>
                <div class="alert-content">
                    <h4>${alert.titulo || alert.title || 'Alerta'}</h4>
                    <p>${alert.descripcion || alert.description || ''}</p>
                    ${alert.referencia_legal ? `<span class="legal-ref">${alert.referencia_legal}</span>` : ''}
                    ${alert.recomendacion ? `<p class="recomendacion"><strong>Recomendación:</strong> ${alert.recomendacion}</p>` : ''}
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

        if (data.respuesta) {
            addChatMessage(data.respuesta, 'assistant');
        } else {
            addChatMessage('Lo siento, no pude procesar tu consulta. Intenta de nuevo.', 'assistant');
        }

    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
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
    let htmlContent = content;
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

function formatChatResponse(text) {
    text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    text = text.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    text = text.replace(/---\n([\s\S]*?)---/g, '<pre>$1</pre>');

    text = text.split('\n\n').map(p => {
        if (p.startsWith('<') || p.trim() === '') return p;
        return `<p>${p}</p>`;
    }).join('');

    text = text.replace(/<p><\/p>/g, '');
    text = text.replace(/\n/g, ' ');

    return text;
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
function showSection(section) {
    uploadSection.style.display = section === 'upload' ? 'flex' : 'none';
    loadingSection.style.display = section === 'loading' ? 'flex' : 'none';
    resultsSection.style.display = section === 'results' ? 'block' : 'none';
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

function generatePDF() {
    if (!lastAnalysisData) {
        showToast('No hay análisis disponible para descargar', 'warning');
        return;
    }

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
}

// ===== PANEL ADMINISTRADOR =====

let adminPanelVisible = false;

function toggleAdminPanel() {
    if (!isAdmin()) return;
    adminPanelVisible = !adminPanelVisible;
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = adminPanelVisible ? 'block' : 'none';
        if (adminPanelVisible) loadAdminData();
    }
}

async function loadAdminData() {
    if (!isAdmin()) return;

    try {
        // 1. Total contratos
        const { count: totalContratos } = await supabaseClient
            .from('contratos')
            .select('*', { count: 'exact', head: true });
        document.getElementById('statTotalContratos').textContent = totalContratos ?? '—';

        // 2. Contratos este mes
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        const { count: contratosMes } = await supabaseClient
            .from('contratos')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstOfMonth.toISOString());
        document.getElementById('statContratosMes').textContent = contratosMes ?? '—';

        // 3. Total consultas chat
        const { count: totalConsultas } = await supabaseClient
            .from('consultas_chat')
            .select('*', { count: 'exact', head: true });
        document.getElementById('statConsultas').textContent = totalConsultas ?? '—';

        // 4. Usuarios únicos por user_email
        const { data: emailRows } = await supabaseClient
            .from('contratos')
            .select('user_email');
        const uniqueUsers = new Set((emailRows || []).map(r => r.user_email).filter(Boolean)).size;
        document.getElementById('statUsuarios').textContent = uniqueUsers || (emailRows?.length ? '1+' : '—');

        // 5. Distribución de riesgo
        const { data: scoreRows } = await supabaseClient
            .from('contratos')
            .select('score_riesgo');
        if (scoreRows && scoreRows.length > 0) {
            const high = scoreRows.filter(c => (c.score_riesgo || 0) >= 51).length;
            const med  = scoreRows.filter(c => (c.score_riesgo || 0) >= 26 && (c.score_riesgo || 0) < 51).length;
            const low  = scoreRows.filter(c => (c.score_riesgo || 0) < 26).length;
            document.getElementById('riskDistribution').innerHTML = `
                <div class="risk-bar"><span class="risk-label danger">🔴 Alto (&ge;51)</span><strong class="risk-count">${high}</strong></div>
                <div class="risk-bar"><span class="risk-label warning">🟡 Medio (26-50)</span><strong class="risk-count">${med}</strong></div>
                <div class="risk-bar"><span class="risk-label success">🟢 Bajo (&lt;26)</span><strong class="risk-count">${low}</strong></div>
            `;
        } else {
            document.getElementById('riskDistribution').innerHTML = '<p class="admin-empty">Sin datos aún</p>';
        }

        // 6. Top ciudades
        const { data: ciudadRows } = await supabaseClient
            .from('contratos')
            .select('ciudad');
        if (ciudadRows && ciudadRows.length > 0) {
            const freq = {};
            ciudadRows.forEach(r => { if (r.ciudad) freq[r.ciudad] = (freq[r.ciudad] || 0) + 1; });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
            document.getElementById('topCiudades').innerHTML = sorted
                .map(([city, n]) => `<div class="ciudad-row"><span>${city}</span><strong>${n}</strong></div>`)
                .join('') || '<p class="admin-empty">Sin datos aún</p>';
        } else {
            document.getElementById('topCiudades').innerHTML = '<p class="admin-empty">Sin datos aún</p>';
        }

        // 7. Tabla contratos recientes
        const { data: recientes } = await supabaseClient
            .from('contratos')
            .select('created_at, ciudad, score_riesgo, user_email, duracion_meses')
            .order('created_at', { ascending: false })
            .limit(20);
        if (recientes && recientes.length > 0) {
            document.getElementById('adminContractosBody').innerHTML = recientes.map(c => {
                const score = c.score_riesgo ?? null;
                const scoreClass = score === null ? '' : score >= 51 ? 'high' : score >= 26 ? 'med' : 'low';
                return `<tr>
                    <td>${new Date(c.created_at).toLocaleDateString('es-CO')}</td>
                    <td>${c.user_email || '—'}</td>
                    <td>${c.ciudad || '—'}</td>
                    <td>${score !== null ? `<span class="score-badge ${scoreClass}">${score}</span>` : '—'}</td>
                    <td>${c.duracion_meses ? c.duracion_meses + ' meses' : '—'}</td>
                </tr>`;
            }).join('');
        } else {
            document.getElementById('adminContractosBody').innerHTML =
                '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px">Sin contratos aún</td></tr>';
        }

    } catch (err) {
        console.error('Admin panel error:', err);
        showToast('Error cargando datos del panel admin: ' + err.message, 'error');
    }
}
