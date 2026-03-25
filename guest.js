// InmoLawyer - Guest Analysis Flow v1.0
// Permite analizar contratos sin registro previo

const GUEST_CONFIG = {
    N8N_BASE: 'https://oqipslfzbeioakfllohm.supabase.co/functions/v1',
    WOMPI_PUBLIC_KEY: 'pub_prod_uohbfwCKYyrQ0LN3EuKK18cNE6gv5yL5',
    WOMPI_CHECKOUT_URL: 'https://checkout.wompi.co/p/',
    WOMPI_REDIRECT_URL: 'https://inmolawyer.surge.sh',
    ANALYSIS_PRICE: 4990000, // $49.900 COP en centavos
    POLL_INTERVAL_MS: 3000,
    POLL_MAX_ATTEMPTS: 30   // 90 segundos máximo
};

// ===== Estado global del flujo guest =====
let guestSessionToken = null;
let guestAnalysisData = null;
let pollInterval = null;

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', () => {
    initGuestUpload();
    handleGuestWompiReturn();
});

// ===== Mostrar estado del demo =====
function showGuestState(stateNum) {
    for (let i = 0; i <= 3; i++) {
        const el = document.getElementById(`guestState${i}`);
        if (el) el.style.display = i === stateNum ? (i === 0 ? 'flex' : 'block') : 'none';
    }
    // Always clear error when switching states
    const errEl = document.getElementById('guestError');
    if (errEl) errEl.style.display = 'none';
}

// ===== Init upload drag & drop =====
function initGuestUpload() {
    const zone = document.getElementById('guestDropZone');
    const input = document.getElementById('guestFileInput');
    if (!zone || !input) return;

    zone.addEventListener('click', (e) => {
        // Avoid double-triggering when clicking the button or the input itself
        if (e.target.closest('button') || e.target === input) return;
        input.click();
    });

    zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleGuestFileUpload(file);
    });

    input.addEventListener('change', () => {
        if (input.files[0]) handleGuestFileUpload(input.files[0]);
        input.value = '';
    });
}

// ===== Manejar archivo seleccionado =====
async function handleGuestFileUpload(file) {
    if (typeof plausible !== 'undefined') plausible('guest_analysis_started');
    // Clear any previous error
    const errEl = document.getElementById('guestError');
    if (errEl) errEl.style.display = 'none';

    const ext = file.name.split('.').pop().toLowerCase();
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

    // DOCX not supported — Anthropic API only accepts PDF
    if (ext === 'docx' || file.type.includes('wordprocessingml')) {
        showGuestError('Solo aceptamos PDF. Para contratos en Word (.docx), ábrelo en Word y guárdalo como PDF: Archivo → Guardar como → PDF.');
        return;
    }
    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
        showGuestError('Formato no soportado. Usa PDF o imagen escaneada (JPG, PNG).');
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        showGuestError('El archivo es muy grande. Máximo 20 MB.');
        return;
    }

    showGuestState(1); // analizando

    try {
        // Convert file to base64 (avoids N8N binary filesystem issues)
        // Send as FormData string fields to avoid CORS preflight
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const formData = new FormData();
        formData.append('base64Data', base64Data);
        formData.append('mimeType', file.type || 'application/pdf');
        formData.append('fileName', file.name);

        const resp = await fetch(`${GUEST_CONFIG.N8N_BASE}/analizar-guest`, {
            method: 'POST',
            body: formData
        });

        if (!resp.ok) {
            throw new Error(`Error ${resp.status}: ${resp.statusText}`);
        }

        let data;
        try {
            data = await resp.json();
        } catch (parseErr) {
            throw new Error('El servidor no respondió correctamente. Por favor intenta de nuevo.');
        }

        if (data.success === false) {
            throw new Error(data.error || 'Error en el análisis del contrato.');
        }

        if (!data.session_token) {
            throw new Error('No se recibió token de sesión');
        }

        guestSessionToken = data.session_token;
        localStorage.setItem('guestToken', guestSessionToken);
        localStorage.setItem('guestTokenTs', Date.now().toString());

        showGuestTeaser(data);
    } catch (err) {
        console.error('Error analizando:', err);
        showGuestState(0);
        showGuestError(err.message || 'Error al analizar. Por favor intenta de nuevo.');
    }
}

// ===== Mostrar teaser (estado 2) =====
function showGuestTeaser(data) {
    const score = data.score || data.score_riesgo || 0;
    const alertsCount = data.alerts_count || data.alertas_count || 0;
    const alertasAlto = data.alertas_alto || 0;
    const alertasMedio = data.alertas_medio || 0;
    const preview = data.alertas_preview || [];
    const hiddenCount = data.alertas_hidden_count || 0;

    const scoreEl = document.getElementById('guestTeaserScore');
    const alertsEl = document.getElementById('guestTeaserAlerts');
    const ringEl = document.getElementById('guestScoreRing');
    const resumenEl = document.getElementById('guestTeaserResumen');
    const alertsListEl = document.getElementById('guestTeaserAlertsList');

    if (scoreEl) scoreEl.textContent = score;

    // Alerts summary text
    if (alertsEl) {
        const parts = [];
        if (alertasAlto > 0) parts.push(`${alertasAlto} critica${alertasAlto > 1 ? 's' : ''}`);
        if (alertasMedio > 0) parts.push(`${alertasMedio} advertencia${alertasMedio > 1 ? 's' : ''}`);
        const remaining = alertsCount - alertasAlto - alertasMedio;
        if (remaining > 0) parts.push(`${remaining} informativa${remaining > 1 ? 's' : ''}`);
        alertsEl.textContent = `${alertsCount} alerta${alertsCount !== 1 ? 's' : ''} detectada${alertsCount !== 1 ? 's' : ''}` + (parts.length ? ` (${parts.join(', ')})` : '');
    }

    // Resumen
    if (resumenEl) resumenEl.textContent = data.resumen || '';

    // Score ring color
    if (ringEl) {
        const pct = Math.max(0, Math.min(100, score));
        const color = pct >= 70 ? '#15803d' : pct >= 40 ? '#d97706' : '#dc2626';
        ringEl.style.background = `conic-gradient(${color} ${pct}%, #e5e7eb ${pct}%)`;
    }

    // Alerts preview
    if (alertsListEl) {
        let html = '';
        // Visible alerts (first 2)
        preview.forEach(a => {
            const nivel = (a.nivel || 'BAJO').toUpperCase();
            const cls = nivel === 'ALTO' ? 'alto' : nivel === 'MEDIO' ? 'medio' : 'bajo';
            const icon = nivel === 'ALTO' ? 'exclamation-circle' : nivel === 'MEDIO' ? 'exclamation-triangle' : 'check-circle';
            html += `<div class="guest-teaser-alert-item ${cls}">
                <i class="fas fa-${icon}"></i>
                <span>${a.titulo || 'Alerta detectada'}</span>
            </div>`;
        });
        // Locked/blurred alerts
        for (let i = 0; i < hiddenCount; i++) {
            html += `<div class="guest-teaser-alert-locked">
                <i class="fas fa-exclamation-circle"></i>
                <span class="locked-text">Clausula detectada con referencia legal</span>
                <i class="fas fa-lock lock-icon"></i>
            </div>`;
        }
        alertsListEl.innerHTML = html;
    }

    showGuestState(2);

    // Scroll to teaser
    const el = document.getElementById('guestState2');
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

// ===== Iniciar pago Wompi =====
async function initiateGuestPayment() {
    if (!guestSessionToken) return;

    const btn = document.getElementById('guestPayBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando enlace de pago...';
    }

    const ts = Date.now();
    const reference = `INMO-guest-${guestSessionToken}-${ts}`;

    try {
        const resp = await fetch(`${GUEST_CONFIG.N8N_BASE}/wompi-integrity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reference,
                amountInCents: GUEST_CONFIG.ANALYSIS_PRICE,
                currency: 'COP'
            })
        });

        const { integrity } = await resp.json();

        const params = new URLSearchParams({
            'public-key': GUEST_CONFIG.WOMPI_PUBLIC_KEY,
            'currency': 'COP',
            'amount-in-cents': GUEST_CONFIG.ANALYSIS_PRICE,
            'reference': reference,
            'redirect-url': GUEST_CONFIG.WOMPI_REDIRECT_URL,
            'signature:integrity': integrity
        });

        window.location.href = `${GUEST_CONFIG.WOMPI_CHECKOUT_URL}?${params.toString()}`;
    } catch (err) {
        console.error('Error Wompi:', err);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> Ver análisis completo — $49.900';
        }
        showGuestError('Error al conectar con pasarela de pago. Intenta de nuevo.');
    }
}

// ===== Detectar regreso desde Wompi =====
function handleGuestWompiReturn() {
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('id');
    const reference = params.get('reference') || '';

    if (!transactionId || !reference.startsWith('INMO-guest-')) return;

    // Limpiar la URL
    window.history.replaceState({}, document.title, window.location.pathname);

    // Recuperar token de localStorage
    const storedToken = localStorage.getItem('guestToken');
    const storedTs = parseInt(localStorage.getItem('guestTokenTs') || '0');
    const tokenAge = Date.now() - storedTs;

    // Token válido por 24 horas
    if (!storedToken || tokenAge > 24 * 60 * 60 * 1000) {
        showGuestError('La sesión expiró. Por favor sube tu contrato de nuevo.');
        return;
    }

    guestSessionToken = storedToken;

    // Scroll a la sección demo
    const demoSection = document.getElementById('demo-guest');
    if (demoSection) {
        setTimeout(() => demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }

    // Mostrar estado de espera/polling
    showGuestState(1);
    updateGuestLoadingText('Verificando tu pago...');

    // Comenzar polling
    pollGuestResult(storedToken);
}

// ===== Polling para obtener el resultado =====
function pollGuestResult(token) {
    let attempts = 0;

    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
        attempts++;

        if (attempts > GUEST_CONFIG.POLL_MAX_ATTEMPTS) {
            clearInterval(pollInterval);
            showGuestState(0);
            showGuestError('No se pudo verificar tu pago. Contáctanos a hola@inmolawyer.co con tu referencia.');
            return;
        }

        try {
            const resp = await fetch(`${GUEST_CONFIG.N8N_BASE}/guest-result?token=${token}`);
            const data = await resp.json();

            if (data.status === 'paid' && data.result) {
                clearInterval(pollInterval);
                guestAnalysisData = data.result;
                localStorage.removeItem('guestToken');
                localStorage.removeItem('guestTokenTs');
                showGuestResult(data.result);
            } else if (data.status === 'not_found') {
                clearInterval(pollInterval);
                showGuestState(0);
                showGuestError('Sesión no encontrada. Por favor sube tu contrato de nuevo.');
            }
            // Si es 'pending', continuar polling
        } catch (err) {
            // Continuar intentando
        }
    }, GUEST_CONFIG.POLL_INTERVAL_MS);
}

// ===== Mostrar resultado completo (estado 3) =====
function showGuestResult(result) {
    const score = result.score_riesgo || 0;
    const alertas = result.alertas || [];

    // Score
    const scoreEl = document.getElementById('guestResultScore');
    const scoreLabelEl = document.getElementById('guestResultScoreLabel');
    const scoreDescEl = document.getElementById('guestResultScoreDesc');

    if (scoreEl) scoreEl.textContent = score;

    const isAlto = score >= 51;
    const isMedio = score >= 26 && score < 51;
    const esBajo = score < 26;

    if (scoreLabelEl) {
        scoreLabelEl.textContent = score >= 76 ? 'RIESGO MUY ALTO' : isAlto ? 'RIESGO ALTO' : isMedio ? 'RIESGO MEDIO' : 'RIESGO BAJO';
        scoreLabelEl.className = 'guest-score-label ' + (isAlto ? 'score-alto' : isMedio ? 'score-medio' : 'score-bajo');
    }

    if (scoreDescEl) {
        scoreDescEl.textContent = score >= 76
            ? 'Múltiples cláusulas ilegales. No firmar sin negociar.'
            : isAlto ? 'Cláusulas que violan la Ley 820. Exige modificarlas.'
            : isMedio ? 'Cláusulas cuestionables. Revísalas antes de firmar.'
            : 'El contrato cumple con los requisitos principales de la Ley 820.';
    }

    // Datos del contrato
    setGuestText('guestResultArrendador', result.arrendador_nombre);
    setGuestText('guestResultArrendatario', result.arrendatario_nombre);
    setGuestText('guestResultCiudad', result.ciudad);
    setGuestText('guestResultCanon', result.canon);

    // Alertas
    const alertasContainer = document.getElementById('guestResultAlertas');
    if (alertasContainer) {
        if (!alertas.length) {
            alertasContainer.innerHTML = '<div class="guest-alert-item bajo"><i class="fas fa-check-circle"></i> Sin alertas detectadas</div>';
        } else {
            alertasContainer.innerHTML = alertas.map(a => {
                const nivel = (a.nivel || 'BAJO').toUpperCase();
                const cls = nivel === 'ALTO' ? 'alto' : nivel === 'MEDIO' ? 'medio' : 'bajo';
                const icon = nivel === 'ALTO' ? 'exclamation-circle' : nivel === 'MEDIO' ? 'exclamation-triangle' : 'check-circle';
                return `<div class="guest-alert-item ${cls}">
                    <i class="fas fa-${icon}"></i>
                    <div>
                        <strong>${a.titulo || a.descripcion || 'Alerta'}</strong>
                        ${a.descripcion && a.titulo ? `<p>${a.descripcion}</p>` : ''}
                    </div>
                </div>`;
            }).join('');
        }
    }

    showGuestState(3);

    // Scroll al resultado
    const el = document.getElementById('guestState3');
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

function setGuestText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
}

// ===== Descargar PDF =====
async function downloadGuestPDF() {
    if (!guestAnalysisData) return;

    const btn = document.getElementById('guestPdfBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...'; }

    try {
        // Cargar jsPDF si no está cargado
        if (!window.jspdf) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                s.onload = resolve; s.onerror = reject;
                document.head.appendChild(s);
            });
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const data = guestAnalysisData;
        const score = data.score_riesgo || 0;
        const alertas = data.alertas || [];

        const COLOR_HEADER = [30, 58, 138];
        const COLOR_ALTO   = [185, 28, 28];
        const COLOR_MEDIO  = [161, 98, 7];
        const COLOR_BAJO   = [21, 128, 61];
        const COLOR_GRIS   = [107, 114, 128];
        const COLOR_LINEA  = [229, 231, 235];
        const COLOR_FONDO  = [249, 250, 251];
        const PAGE_W = 210;
        const MARGIN = 14;
        const CONTENT_W = PAGE_W - MARGIN * 2;
        let y = 0;

        const scoreColor = score >= 51 ? COLOR_ALTO : score >= 26 ? COLOR_MEDIO : COLOR_BAJO;
        const scoreLabel = score >= 76 ? 'RIESGO MUY ALTO' : score >= 51 ? 'RIESGO ALTO' : score >= 26 ? 'RIESGO MEDIO' : 'RIESGO BAJO';

        function checkPage(needed = 20) {
            if (y + needed > 272) { doc.addPage(); y = 14; drawFooter(); }
        }
        function drawFooter() {
            doc.setFontSize(7); doc.setTextColor(...COLOR_GRIS);
            doc.text('InmoLawyer — Análisis basado en Ley 820 de 2003 (Colombia)', MARGIN, 290);
            doc.text(`Pág. ${doc.internal.getNumberOfPages()}`, PAGE_W - MARGIN, 290, { align: 'right' });
            doc.text('Este documento es informativo y no constituye asesoría legal profesional.', MARGIN, 294);
        }

        // Header
        doc.setFillColor(...COLOR_HEADER);
        doc.rect(0, 0, PAGE_W, 36, 'F');
        doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
        doc.text('InmoLawyer', MARGIN, 14);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('Análisis de Contrato de Arrendamiento — Ley 820 de 2003', MARGIN, 21);
        const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.setFontSize(8);
        doc.text(`Generado: ${hoy}`, PAGE_W - MARGIN, 21, { align: 'right' });
        y = 44;

        // Score
        doc.setFillColor(...scoreColor);
        doc.circle(MARGIN + 14, y + 10, 13, 'F');
        doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
        doc.text(String(score), MARGIN + 14, y + 12, { align: 'center' });
        doc.setFontSize(13); doc.setTextColor(...scoreColor);
        doc.text(scoreLabel, MARGIN + 32, y + 7);
        y += 32;

        doc.setDrawColor(...COLOR_LINEA); doc.setLineWidth(0.3);
        doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 8;

        // Datos del contrato
        checkPage(50);
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLOR_HEADER);
        doc.text('DATOS DEL CONTRATO', MARGIN, y); y += 6;

        const halfW = (CONTENT_W - 4) / 2;
        function dataRow(label, value, x, ry) {
            doc.setFillColor(...COLOR_FONDO); doc.rect(x, ry - 4, halfW, 8, 'F');
            doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLOR_GRIS);
            doc.text(label.toUpperCase(), x + 2, ry);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(17, 24, 39); doc.setFontSize(8.5);
            doc.text((value || '—').substring(0, 35), x + 2, ry + 4);
        }
        dataRow('Arrendador', data.arrendador_nombre, MARGIN, y);
        dataRow('Arrendatario', data.arrendatario_nombre, MARGIN + halfW + 4, y); y += 12;
        dataRow('Ciudad', data.ciudad, MARGIN, y);
        dataRow('Canon mensual', data.canon, MARGIN + halfW + 4, y); y += 14;

        doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 8;

        // Alertas
        checkPage(20);
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLOR_HEADER);
        doc.text(`ALERTAS LEGALES (${alertas.length})`, MARGIN, y); y += 6;

        if (alertas.length === 0) {
            doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLOR_BAJO);
            doc.text('Sin alertas detectadas. El contrato cumple con la Ley 820.', MARGIN, y); y += 8;
        } else {
            alertas.forEach((alerta) => {
                checkPage(18);
                const nivel = (alerta.nivel || 'BAJO').toUpperCase();
                const col = nivel === 'ALTO' ? COLOR_ALTO : nivel === 'MEDIO' ? COLOR_MEDIO : COLOR_BAJO;
                const bgRgb = nivel === 'ALTO' ? [254, 242, 242] : nivel === 'MEDIO' ? [255, 251, 235] : [240, 253, 244];
                doc.setFillColor(...bgRgb);
                doc.rect(MARGIN, y - 4, CONTENT_W, 14, 'F');
                doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...col);
                doc.text(nivel, MARGIN + 2, y);
                doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(17, 24, 39);
                const lines = doc.splitTextToSize(alerta.titulo || alerta.descripcion || '', CONTENT_W - 20);
                doc.text(lines[0], MARGIN + 18, y);
                y += 14;
            });
        }

        drawFooter();
        doc.save(`InmoLawyer-Analisis-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        console.error('Error PDF:', err);
        showGuestError('Error generando el PDF. Por favor intenta de nuevo.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Descargar PDF'; }
    }
}

// ===== Enviar email =====
async function submitGuestEmail() {
    const input = document.getElementById('guestEmailInput');
    const btn = document.getElementById('guestEmailBtn');
    if (!input || !guestSessionToken) return;

    const email = input.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.style.borderColor = '#dc2626';
        return;
    }
    input.style.borderColor = '';

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        await fetch(`${GUEST_CONFIG.N8N_BASE}/guest-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_token: guestSessionToken, email })
        });

        btn.innerHTML = '<i class="fas fa-check"></i>';
        input.disabled = true;
        const msgEl = document.getElementById('guestEmailMsg');
        if (msgEl) {
            msgEl.textContent = `✓ Guardamos tu email. Te contactaremos a ${email}.`;
            msgEl.style.display = 'block';
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        showGuestError('Error guardando email. Intenta de nuevo.');
    }
}

// ===== Reiniciar flujo =====
function resetGuestFlow() {
    guestSessionToken = null;
    guestAnalysisData = null;
    if (pollInterval) clearInterval(pollInterval);
    localStorage.removeItem('guestToken');
    localStorage.removeItem('guestTokenTs');
    showGuestState(0);
    const errEl = document.getElementById('guestError');
    if (errEl) errEl.style.display = 'none';
}

// ===== Helpers =====
function showGuestError(msg) {
    const el = document.getElementById('guestError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function updateGuestLoadingText(text) {
    const el = document.getElementById('guestLoadingText');
    if (el) el.textContent = text;
}
