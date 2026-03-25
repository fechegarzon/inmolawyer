// InmoLawyer - Results Renderer Module
// KEY MODULE FOR MULTI-DOC: Renders analysis results with extension points
// for dynamic document types (campos_display, score_labels, secciones_extra)

import { formatCurrency, formatDate, showToast } from './ui-helpers.js';
import { setCurrentContractId } from './upload.js';

// ===== Helpers =====

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
}

// ===== State =====

let lastAnalysisData = null;

export function getLastAnalysisData() {
    return lastAnalysisData;
}

export function setLastAnalysisData(data) {
    lastAnalysisData = data;
}

// ===== Main Display Orchestrator =====

// Document type labels for badge display
const TIPO_DOC_LABELS = {
    'ARRIENDO_VIVIENDA': 'Contrato de Arriendo de Vivienda',
    'ARRIENDO_COMERCIAL': 'Contrato de Arriendo Comercial',
    'PROMESA_COMPRAVENTA': 'Promesa de Compraventa',
    'CERT_LIBERTAD': 'Certificado de Libertad y Tradicion'
};

export function displayResults(data) {
    if (!data) {
        showToast('No se recibieron datos del analisis', 'error');
        return;
    }

    // Guardar ID para el chat
    setCurrentContractId(data.contratoId || data.contrato_id || data.id);

    // Plausible custom event
    if (typeof plausible !== 'undefined') plausible('analysis_complete', { props: { tipo: data.tipo_documento || 'ARRIENDO_VIVIENDA' } });

    const tipo = data.tipo_documento || 'ARRIENDO_VIVIENDA';
    const isVivienda = tipo === 'ARRIENDO_VIVIENDA';

    // Badge de tipo de documento
    displayDocTypeBadge(tipo);

    // Score de Riesgo
    const score = data.score_riesgo || data.analisis?.score_riesgo || 0;
    displayRiskScore(score, data);

    // Toggle fixed vs dynamic data cards
    const partiesCard = document.querySelector('.parties-card');
    const resultCol = document.querySelector('.result-col');
    const camposCard = document.querySelector('.campos-display-card');
    const usesDynamicCampos = !isVivienda && data.campos_display && Array.isArray(data.campos_display);

    if (partiesCard) partiesCard.style.display = usesDynamicCampos ? 'none' : '';
    if (resultCol) resultCol.style.display = usesDynamicCampos ? 'none' : '';
    if (camposCard) camposCard.style.display = usesDynamicCampos ? '' : 'none';

    if (usesDynamicCampos) {
        displayCamposDisplay(data.campos_display);
    } else {
        displayContractDataFixed(data);
    }

    // Deudores Solidarios (solo vivienda)
    const deudores = data.deudores_solidarios || [];
    displayDeudores(isVivienda ? deudores : []);

    // Alertas
    const alertas = data.alertas || data.analisis?.alertas || [];
    displayAlerts(alertas);

    // Secciones vivienda-only vs secciones_extra para nuevos tipos
    const viviendaSections = document.getElementById('viviendaSections');
    const seccionesExtraContainer = document.getElementById('seccionesExtraContainer');

    if (isVivienda) {
        // Mostrar secciones vivienda, ocultar secciones_extra
        if (viviendaSections) viviendaSections.style.display = '';
        if (seccionesExtraContainer) seccionesExtraContainer.style.display = 'none';

        const incrementos = data.incrementos || [];
        displayIncrements(incrementos);
        displayDates(data.fechas_importantes || {});
    } else {
        // Ocultar secciones vivienda, mostrar secciones_extra
        if (viviendaSections) viviendaSections.style.display = 'none';
        if (seccionesExtraContainer) seccionesExtraContainer.style.display = '';

        displaySeccionesExtra(data.secciones_extra || {}, tipo);
    }

    // Resumen del analisis (nuevos tipos lo envian top-level)
    const resumen = data.resumen || data.analisis?.resumen || '';
    if (resumen) {
        const resumenEl = document.getElementById('analisisResumen');
        if (resumenEl) {
            resumenEl.textContent = resumen;
        }
    }
}

// ===== Document Type Badge =====

function displayDocTypeBadge(tipo) {
    const badge = document.getElementById('docTypeBadge');
    if (!badge) return;
    badge.textContent = TIPO_DOC_LABELS[tipo] || tipo;
    badge.className = 'doc-type-badge doc-type-' + tipo.toLowerCase();
    badge.style.display = '';
}

// ===== Dynamic Fields Display (campos_display) =====

function displayCamposDisplay(campos) {
    const container = document.getElementById('camposDisplayContainer');
    if (!container) return;

    const iconMap = {
        'user': 'fa-user',
        'dollar-sign': 'fa-dollar-sign',
        'calendar': 'fa-calendar-alt',
        'map-pin': 'fa-map-marker-alt',
        'building': 'fa-building',
        'file': 'fa-file-alt',
        'clock': 'fa-clock',
        'hash': 'fa-hashtag',
        'shield': 'fa-shield-alt',
        'home': 'fa-home',
        'percent': 'fa-percentage',
        'briefcase': 'fa-briefcase'
    };

    container.innerHTML = campos.map(campo => {
        const iconClass = iconMap[campo.icon] || 'fa-info-circle';
        return `
            <div class="campo-display-item">
                <div class="campo-icon"><i class="fas ${iconClass}"></i></div>
                <div class="campo-info">
                    <label>${esc(campo.label)}</label>
                    <span>${esc(campo.value) || '—'}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Secciones Extra Display =====

function displaySeccionesExtra(secciones, tipo) {
    const container = document.getElementById('seccionesExtraContent');
    if (!container) return;
    if (!secciones || Object.keys(secciones).length === 0) {
        container.innerHTML = '';
        return;
    }

    const sectionConfigs = {
        'derechos_comerciales': {
            title: 'Derechos Comerciales',
            icon: 'fa-gavel',
            dangerKeywords: ['RENUNCIADO', 'INEFICAZ', 'PROHIBID'],
            successKeywords: ['RESPETADO', 'VIGENTE']
        },
        'checklist_prefirma': {
            title: 'Checklist Pre-Firma',
            icon: 'fa-clipboard-check',
            dangerKeywords: ['NO ANEXO', 'FALTANTE', 'PENDIENTE'],
            successKeywords: ['VERIFICADO', 'OK', 'COMPLETO']
        },
        'estado_anotaciones': {
            title: 'Estado de Anotaciones',
            icon: 'fa-file-signature',
            dangerKeywords: [],
            successKeywords: ['CANCELADA', 'CERRAD'],
            warningKeywords: ['VIGENTE', 'ACTIV'],
            defaultStatus: 'status-info'
        }
    };

    function resolveStatusClass(estado, config) {
        const upper = (estado || '').toUpperCase();
        if (config.warningKeywords?.some(k => upper.includes(k))) return 'status-warning';
        if (config.dangerKeywords?.some(k => upper.includes(k))) return 'status-danger';
        if (config.successKeywords?.some(k => upper.includes(k))) return 'status-success';
        return config.defaultStatus || 'status-warning';
    }

    function renderItem(item, config, key) {
        const statusClass = resolveStatusClass(item.estado, config);
        const label = key === 'estado_anotaciones'
            ? `<div class="seccion-extra-label">${item.tipo ? `<small class="seccion-extra-tipo">${esc(item.tipo)}</small>` : ''}${esc(item.label || item.descripcion || '')}</div>`
            : `<span class="seccion-extra-label">${esc(item.label || item.item || '')}</span>`;
        return `<div class="seccion-extra-item">${label}<span class="seccion-extra-status ${statusClass}">${esc(item.estado) || '—'}</span></div>`;
    }

    let html = '';
    for (const [key, items] of Object.entries(secciones)) {
        if (!Array.isArray(items) || items.length === 0) continue;
        const config = sectionConfigs[key] || {
            title: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            icon: 'fa-list',
            dangerKeywords: [], successKeywords: []
        };

        html += `
            <div class="seccion-extra-card">
                <div class="card-header">
                    <span class="ch-icon"><i class="fas ${config.icon}"></i></span>
                    <h3>${config.title}</h3>
                </div>
                <div class="seccion-extra-items">
                    ${items.map(item => renderItem(item, config, key)).join('')}
                </div>
            </div>`;
    }

    container.innerHTML = html;
}

// ===== Risk Score Display =====

function displayRiskScore(score, data) {
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreValue = document.getElementById('scoreValue');
    const scoreTitle = document.getElementById('scoreTitle');
    const scoreDescription = document.getElementById('scoreDescription');

    scoreValue.textContent = score;
    scoreCircle.classList.remove('low', 'medium', 'high');

    // MULTI-DOC EXTENSION POINT: use data.score_labels if provided by backend
    // Expected format: data.score_labels = { high: { title, description }, medium: {...}, low: {...} }
    const scoreLabels = data?.score_labels || null;

    if (score >= 76) {
        scoreCircle.classList.add('high');
        scoreTitle.textContent = scoreLabels?.very_high?.title ||
            'Riesgo Muy Alto — Multiples Violaciones Criticas';
        scoreDescription.textContent = scoreLabels?.very_high?.description ||
            'El contrato contiene varias clausulas ilegales segun la Ley 820 de 2003. Se recomienda no firmar sin antes negociar las clausulas senaladas o consultar un abogado.';
    } else if (score >= 51) {
        scoreCircle.classList.add('high');
        scoreTitle.textContent = scoreLabels?.high?.title ||
            'Riesgo Alto — Clausulas Ilegales Detectadas';
        scoreDescription.textContent = scoreLabels?.high?.description ||
            'Este contrato contiene clausulas que violan la Ley 820 de 2003. Revisa las alertas criticas y exige modificarlas antes de firmar.';
    } else if (score >= 26) {
        scoreCircle.classList.add('medium');
        scoreTitle.textContent = scoreLabels?.medium?.title ||
            'Riesgo Medio — Revisar Algunas Clausulas';
        scoreDescription.textContent = scoreLabels?.medium?.description ||
            'El contrato tiene clausulas cuestionables. No son necesariamente ilegales, pero te recomendamos revisarlas con atencion antes de firmar.';
    } else {
        scoreCircle.classList.add('low');
        scoreTitle.textContent = scoreLabels?.low?.title ||
            'Riesgo Bajo — Contrato Conforme a Ley 820';
        scoreDescription.textContent = scoreLabels?.low?.description ||
            'El contrato cumple con los requisitos principales de la Ley 820 de 2003. Revisa las observaciones informativas si las hay.';
    }
}

// ===== Contract Data Display (Fixed Layout — current Ley 820 format) =====

function displayContractDataFixed(data) {
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

    document.getElementById('arrendadorNombre').textContent = displayData.arrendador_nombre;
    document.getElementById('arrendadorDoc').textContent =
        displayData.arrendador_doc ? `Doc: ${displayData.arrendador_doc}` : '';

    document.getElementById('arrendatarioNombre').textContent = displayData.arrendatario_nombre;
    document.getElementById('arrendatarioDoc').textContent =
        displayData.arrendatario_doc ? `Doc: ${displayData.arrendatario_doc}` : '';

    document.getElementById('direccion').textContent = displayData.direccion;
    document.getElementById('ciudad').textContent = displayData.ciudad;

    document.getElementById('canon').textContent =
        displayData.canon ? formatCurrency(displayData.canon) : '-';
    document.getElementById('fechaInicio').textContent =
        displayData.fecha_inicio ? formatDate(displayData.fecha_inicio) : '-';
    document.getElementById('duracion').textContent =
        displayData.duracion_meses ? `${displayData.duracion_meses} meses` : '-';

    if (displayData.fecha_inicio && displayData.duracion_meses) {
        const inicio = new Date(displayData.fecha_inicio);
        const vencimiento = new Date(inicio);
        vencimiento.setMonth(vencimiento.getMonth() + parseInt(displayData.duracion_meses));
        document.getElementById('vencimiento').textContent = formatDate(vencimiento);
    }
}

// ===== Deudores Solidarios =====

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
                    <label>${esc(tipoCapital)}</label>
                    <span>${esc(d.nombre) || 'No especificado'}</span>
                    <small>${d.documento ? 'Doc: ' + esc(d.documento) : ''}</small>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Alerts Display =====

function displayAlerts(alertas) {
    const container = document.getElementById('alertsContainer');

    if (!alertas || alertas.length === 0) {
        container.innerHTML = `
            <div class="alert success">
                <i class="fas fa-check-circle"></i>
                <div class="alert-content">
                    <h4>Sin alertas criticas</h4>
                    <p>No se detectaron clausulas abusivas o ilegales en el contrato.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = alertas.map(alert => {
        const tipo = alert.tipo || alert.type || 'info';
        const icon = getAlertIcon(tipo);

        return `
            <div class="alert ${esc(tipo)}">
                <i class="fas ${icon}"></i>
                <div class="alert-content">
                    <h4>${esc(alert.titulo || alert.title || 'Alerta')}</h4>
                    <p>${esc(alert.descripcion || alert.description || '')}</p>
                    ${alert.referencia_legal ? `<span class="legal-ref">${esc(alert.referencia_legal)}</span>` : ''}
                    ${alert.recomendacion ? `<p class="recomendacion"><strong>Recomendacion:</strong> ${esc(alert.recomendacion)}</p>` : ''}
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

// ===== Increments Display =====

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

// ===== Dates Display =====

function displayDates(fechas) {
    const noDataMsg = 'No disponible';

    // Si no hay fechas o el objeto esta vacio, mostrar mensaje
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
            diasVenc.textContent = `${fechas.dias_para_vencimiento} dias`;
        }
    }
}
