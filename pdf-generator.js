// InmoLawyer - PDF Generator Module
// Generates downloadable PDF reports from analysis data
// MULTI-DOC: "Ley 820" references use data fallback for future document types

import { formatCurrency, formatDate, showToast } from './ui-helpers.js';
import { getLastAnalysisData } from './results-renderer.js';
import { loadPDFLibraries } from './upload.js';

// ===== PDF Generation =====

export function initPDFGenerator() {
    const btn = document.getElementById('btnDownloadPdf');
    if (btn) {
        btn.addEventListener('click', generatePDF);
    }
}

export async function generatePDF() {
    const lastAnalysisData = getLastAnalysisData();

    if (!lastAnalysisData) {
        showToast('No hay analisis disponible para descargar', 'warning');
        return;
    }

    try {
    await loadPDFLibraries(); // lazy-load: solo cuando el usuario pide el PDF

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const data = lastAnalysisData;
    const tipo = data.tipo_documento || 'ARRIENDO_VIVIENDA';
    const isVivienda = tipo === 'ARRIENDO_VIVIENDA';
    const score = data.score_riesgo || data.analisis?.score_riesgo || 0;
    const alertas = data.alertas || [];
    const incrementos = isVivienda ? (data.incrementos || []) : [];
    const fechas = isVivienda ? (data.fechas_importantes || {}) : {};
    const resumen = data.resumen || data.analisis?.resumen || '';
    const deudoresSolidarios = isVivienda ? (data.deudores_solidarios || []) : [];

    const TIPO_DOC_LABELS = {
        'ARRIENDO_VIVIENDA': 'Ley 820 de 2003',
        'ARRIENDO_COMERCIAL': 'Codigo de Comercio Arts. 518-524',
        'PROMESA_COMPRAVENTA': 'Codigo Civil Art. 1611',
        'CERT_LIBERTAD': 'Ley 1579 de 2012'
    };
    const TIPO_DOC_TITLES = {
        'ARRIENDO_VIVIENDA': 'Contrato de Arrendamiento',
        'ARRIENDO_COMERCIAL': 'Contrato de Arriendo Comercial',
        'PROMESA_COMPRAVENTA': 'Promesa de Compraventa',
        'CERT_LIBERTAD': 'Certificado de Libertad y Tradicion'
    };
    const tipoDocLabel = data.tipo_documento_label || TIPO_DOC_LABELS[tipo] || 'Ley 820 de 2003';
    const tipoDocTitle = TIPO_DOC_TITLES[tipo] || 'Analisis de Contrato';
    const scoreLabels = data.score_labels || null;

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

    // -- Funcion auxiliar: nueva pagina si es necesario --
    function checkPage(needed = 20) {
        if (y + needed > 272) {
            doc.addPage();
            y = 14;
        }
    }

    // -- Footer --
    function drawFooter() {
        const pageNum = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(...COLOR_GRIS);
        doc.text(`InmoLawyer — Analisis basado en ${tipoDocLabel} (Colombia)`, MARGIN, 290);
        doc.text(`Pag. ${pageNum}`, PAGE_W - MARGIN, 290, { align: 'right' });
        doc.text('Este documento es informativo y no constituye asesoria legal profesional.', MARGIN, 294);
    }

    // ============================
    //  ENCABEZADO
    // ============================
    doc.setFillColor(...COLOR_HEADER);
    doc.rect(0, 0, PAGE_W, 36, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('InmoLawyer', MARGIN, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tipoDocTitle} — ${tipoDocLabel}`, MARGIN, 21);

    const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.setFontSize(8);
    doc.text(`Generado: ${hoy}`, PAGE_W - MARGIN, 21, { align: 'right' });

    y = 44;

    // ============================
    //  SCORE DE RIESGO
    // ============================
    // Circulo del score
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

    // MULTI-DOC: score descriptions can come from backend score_labels
    const scoreDesc = score >= 76
        ? (scoreLabels?.very_high?.description || 'Contiene multiples clausulas ilegales. No firmar sin negociar o consultar un abogado.')
        : score >= 51
        ? (scoreLabels?.high?.description || 'Clausulas que violan la Ley 820 detectadas. Exige modificarlas antes de firmar.')
        : score >= 26
        ? (scoreLabels?.medium?.description || 'Clausulas cuestionables. Revisalas con atencion antes de firmar.')
        : (scoreLabels?.low?.description || 'El contrato cumple con los requisitos principales de la Ley 820 de 2003.');
    const descLines = doc.splitTextToSize(scoreDesc, CONTENT_W - 36);
    doc.text(descLines, MARGIN + 32, y + 14);

    y += 30;

    // Linea separadora
    doc.setDrawColor(...COLOR_LINEA);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 7;

    // ============================
    //  RESUMEN EJECUTIVO
    // ============================
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

    // ============================
    //  DATOS DEL CONTRATO / DOCUMENTO
    // ============================
    checkPage(50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_HEADER);
    doc.text(isVivienda ? 'DATOS DEL CONTRATO' : 'DATOS DEL DOCUMENTO', MARGIN, y);
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

    if (!isVivienda && data.campos_display && Array.isArray(data.campos_display)) {
        // Dynamic campos_display rendering for new types
        const campos = data.campos_display;
        for (let i = 0; i < campos.length; i += 2) {
            checkPage(14);
            drawDataRow(campos[i].label, campos[i].value || '—', MARGIN, y, halfW);
            if (campos[i + 1]) {
                drawDataRow(campos[i + 1].label, campos[i + 1].value || '—', MARGIN + halfW + 4, y, halfW);
            }
            y += 12;
        }
    } else {
        // Fixed vivienda layout
        drawDataRow('Arrendador', data.arrendador_nombre || '—', MARGIN, y, halfW);
        drawDataRow('Arrendatario', data.arrendatario_nombre || '—', MARGIN + halfW + 4, y, halfW);
        y += 12;

        drawDataRow('Cedula Arrendador', data.arrendador_doc || '—', MARGIN, y, halfW);
        drawDataRow('Cedula Arrendatario', data.arrendatario_doc || '—', MARGIN + halfW + 4, y, halfW);
        y += 12;

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

        drawDataRow('Direccion', data.direccion || '—', MARGIN, y, halfW);
        drawDataRow('Ciudad', data.ciudad || '—', MARGIN + halfW + 4, y, halfW);
        y += 12;

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
        drawDataRow('Duracion', data.duracion_meses ? `${data.duracion_meses} meses` : '—', MARGIN + (quarterW + 2) * 2, y, quarterW);
        drawDataRow('Vencimiento', vencStr, MARGIN + (quarterW + 2) * 3, y, quarterW);
        y += 14;
    }

    doc.setDrawColor(...COLOR_LINEA);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 7;

    // ============================
    //  ALERTAS LEGALES
    // ============================
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
        doc.text('No se detectaron clausulas abusivas o ilegales.', MARGIN, y);
        y += 8;
    } else {
        alertas.forEach((alerta, idx) => {
            const tipo = (alerta.tipo || 'info').toLowerCase();
            const alertColor = tipo === 'critica' || tipo === 'danger' ? COLOR_ALTO
                             : tipo === 'advertencia' || tipo === 'warning' ? COLOR_MEDIO
                             : [37, 99, 235];

            // Pre-calculate content height for dynamic box sizing
            const descLines2 = doc.splitTextToSize(alerta.descripcion || '', CONTENT_W - 16);
            let boxH = 10 + descLines2.length * 3.5; // header + description
            if (alerta.referencia_legal) boxH += 4;
            const recLines = alerta.recomendacion ? doc.splitTextToSize(`-> ${alerta.recomendacion}`, CONTENT_W - 16) : [];
            if (recLines.length) boxH += recLines.length * 3.5 + 2;
            boxH += 4; // padding

            checkPage(boxH + 4);

            // Barra de color lateral
            doc.setFillColor(...alertColor);
            doc.rect(MARGIN, y - 1, 2.5, boxH, 'F');

            // Fondo claro
            doc.setFillColor(248, 250, 252);
            doc.rect(MARGIN + 2.5, y - 1, CONTENT_W - 2.5, boxH, 'F');

            // Numero
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...alertColor);
            doc.text(`${String(idx + 1).padStart(2, '0')}`, MARGIN + 5, y + 4);

            // Titulo
            doc.setFontSize(9);
            doc.setTextColor(17, 24, 39);
            doc.text(alerta.titulo || 'Alerta', MARGIN + 14, y + 4);

            // Tipo badge
            const tipoLabel = (tipo === 'critica' || tipo === 'danger') ? 'CRITICA'
                : (tipo === 'advertencia' || tipo === 'warning') ? 'ADVERTENCIA' : 'INFO';
            doc.setFontSize(6.5);
            doc.setTextColor(...alertColor);
            doc.text(tipoLabel, PAGE_W - MARGIN - 2, y + 4, { align: 'right' });

            // Descripcion
            doc.setFontSize(7.8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(55, 65, 81);
            doc.text(descLines2, MARGIN + 14, y + 10);
            let lineY = y + 10 + descLines2.length * 3.5;

            // Referencia legal
            if (alerta.referencia_legal) {
                doc.setFontSize(7);
                doc.setTextColor(...COLOR_GRIS);
                doc.text(`${alerta.referencia_legal}`, MARGIN + 14, lineY + 2);
                lineY += 4;
            }

            // Recomendacion
            if (recLines.length) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(55, 65, 81);
                doc.text(recLines, MARGIN + 14, lineY + 2);
                lineY += recLines.length * 3.5;
            }

            y = lineY + 6;
        });
    }

    doc.setDrawColor(...COLOR_LINEA);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 7;

    // ============================
    //  SECCIONES EXTRA (nuevos tipos)
    // ============================
    if (!isVivienda && data.secciones_extra) {
        const sectionTitles = {
            'derechos_comerciales': 'DERECHOS COMERCIALES',
            'checklist_prefirma': 'CHECKLIST PRE-FIRMA',
            'estado_anotaciones': 'ESTADO DE ANOTACIONES'
        };

        for (const [key, items] of Object.entries(data.secciones_extra)) {
            if (!Array.isArray(items) || items.length === 0) continue;

            checkPage(15 + items.length * 10);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLOR_HEADER);
            doc.text(sectionTitles[key] || key.toUpperCase().replace(/_/g, ' '), MARGIN, y);
            y += 7;

            items.forEach(item => {
                checkPage(12);
                const label = item.label || item.descripcion || item.item || '';
                const estado = item.estado || '';
                const estadoUpper = estado.toUpperCase();

                const statusColor = estadoUpper.includes('RENUNCIADO') || estadoUpper.includes('INEFICAZ') || estadoUpper.includes('NO ANEXO') || estadoUpper.includes('FALTANTE')
                    ? COLOR_ALTO
                    : estadoUpper.includes('RESPETADO') || estadoUpper.includes('VERIFICADO') || estadoUpper.includes('CANCELADA') || estadoUpper.includes('OK')
                    ? COLOR_BAJO
                    : COLOR_MEDIO;

                doc.setFillColor(...COLOR_FONDO);
                doc.rect(MARGIN, y - 3, CONTENT_W, 9, 'F');

                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(17, 24, 39);
                doc.text(label, MARGIN + 3, y + 2);

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...statusColor);
                doc.text(estado, PAGE_W - MARGIN - 3, y + 2, { align: 'right' });

                y += 11;
            });

            y += 4;
            doc.setDrawColor(...COLOR_LINEA);
            doc.line(MARGIN, y, PAGE_W - MARGIN, y);
            y += 7;
        }
    }

    // ============================
    //  INCREMENTOS IPC
    // ============================
    if (incrementos.length > 0) {
        checkPage(30);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_HEADER);
        doc.text('INCREMENTOS ANUALES IPC (DANE)', MARGIN, y);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR_GRIS);
        doc.text('Calculados desde el inicio del contrato hasta el ano actual con datos certificados', MARGIN, y + 5);
        y += 10;

        doc.autoTable({
            startY: y,
            margin: { left: MARGIN, right: MARGIN },
            head: [['Ano', 'IPC Aplicado', 'Canon Anterior', 'Incremento', 'Canon Nuevo']],
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

    // ============================
    //  FECHAS IMPORTANTES
    // ============================
    const hasFechas = fechas && Object.keys(fechas).length > 0;
    if (hasFechas) {
        checkPage(35);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_HEADER);
        doc.text('FECHAS IMPORTANTES', MARGIN, y);
        y += 7;

        const fechaItems = [
            { icon: '', label: 'Proximo incremento', value: fechas.proximo_incremento?.fecha ? formatDate(fechas.proximo_incremento.fecha) : '—', color: COLOR_MEDIO },
            { icon: '', label: 'Notificar incremento', value: fechas.notificacion_incremento ? formatDate(fechas.notificacion_incremento) : '—', desc: '1 mes antes del aniversario', color: COLOR_MEDIO },
            { icon: '', label: 'Notificar terminacion', value: fechas.notificacion_desocupacion ? formatDate(fechas.notificacion_desocupacion) : '—', desc: '3 meses antes — Art. 22 Ley 820', color: COLOR_ALTO },
            { icon: '', label: 'Dias para vencimiento', value: fechas.dias_para_vencimiento !== undefined ? `${fechas.dias_para_vencimiento} dias` : '—', color: COLOR_HEADER }
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

    // ============================
    //  PIE DE PAGINA EN TODAS LAS PAGINAS
    // ============================
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawFooter();
    }

    // ============================
    //  GUARDAR
    // ============================
    const docName = isVivienda
        ? (data.arrendatario_nombre || 'contrato')
        : (data.campos_display?.[0]?.value || tipo);
    const arrendatario = docName.replace(/\s+/g, '_').substring(0, 20);
    const fechaHoy = new Date().toISOString().split('T')[0];
    doc.save(`InmoLawyer_${arrendatario}_${fechaHoy}.pdf`);

    showToast('PDF descargado correctamente', 'success');

    } catch (err) {
        console.error('PDF generation failed:', err);
        showToast('Error generando el PDF. Intenta de nuevo.', 'error');
    }
}
