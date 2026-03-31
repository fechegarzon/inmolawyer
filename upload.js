// InmoLawyer - Upload Module
// Handles file upload, validation, submission, and job polling

import { CONFIG } from './config.js';
import { showSection, updateLoadingStep, showErrorBanner, hideErrorBanner, showToast } from './ui-helpers.js';
import { displayResults, setLastAnalysisData } from './results-renderer.js';
import { decrementEstudios, hasEstudiosDisponibles, showSectionBlocked } from './payments.js';

function getCurrentUser() {
    return window.__INMO_AUTH__?.currentUser ?? null;
}

// ===== Lazy-load Helpers =====

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load: ' + src));
        document.head.appendChild(s);
    });
}

export async function loadMammoth() {
    if (window.mammoth) return; // ya cargado
    await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
}

export async function loadPDFLibraries() {
    if (window.jspdf) return; // ya cargado
    // Cargar secuencialmente: autoTable es plugin de jsPDF y necesita que jsPDF exista primero
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
}

// ===== State =====

let currentContractId = null;

export function getCurrentContractId() {
    return currentContractId;
}

export function setCurrentContractId(id) {
    currentContractId = id;
}

// ===== Upload Initialization =====

export function initUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

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

// ===== File Handling =====

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (typeof plausible !== 'undefined') plausible('upload_started', { props: { type: 'web' } });
        processFile(file);
    }
}

export async function processFile(file) {
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
            `El archivo supera los ${MAX_FILE_SIZE_MB} MB permitidos. Reduce el tamano o convierte a TXT.`
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
                    'El archivo Word no contiene texto extraible. Intenta exportarlo como PDF.');
                return;
            }
            // Reemplazar file por un .txt con el texto extraido
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

        updateLoadingStep(3, 'Analizando clausulas con IA...');

        const response = await submitContract(file);
        console.log('Respuesta del servidor:', response);

        // --- Async: servidor devolvio job_id -> hacer polling ---
        let finalResult;
        if (response.job_id) {
            finalResult = await pollJobStatus(response.job_id);
        } else {
            // Respuesta sincrona (fallback, contratos pequenos que respondieron directo)
            finalResult = response;
        }

        // Si el LLM detecto que no es un contrato de arrendamiento de vivienda urbana
        if (finalResult.error === true) {
            showSection('upload');
            showErrorBanner(
                'Documento no compatible con Ley 820',
                finalResult.motivo || 'El documento no es un contrato de arrendamiento de vivienda urbana valido.'
            );
            return;
        }

        if (!finalResult.success) {
            throw new Error(finalResult.error || 'Error al analizar el contrato');
        }

        updateLoadingStep(4, 'Analisis completado!');
        await new Promise(r => setTimeout(r, 500));

        setLastAnalysisData(finalResult);
        displayResults(finalResult);
        showSection('results');

        await decrementEstudios();

    } catch (error) {
        console.error('Error processing file:', error);

        let errorMsg = error.message;
        if (error.name === 'AbortError') {
            errorMsg = 'El analisis tardo demasiado. Por favor intenta de nuevo.';
        }

        showSection('upload');
        showErrorBanner('Error al analizar el documento', errorMsg);
    }
}

// ===== Contract Submission =====

async function submitContract(file) {
    const formData = new FormData();
    formData.append('file', file);

    const currentUser = getCurrentUser();
    if (currentUser) {
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
                throw new Error('El analisis tardo demasiado tiempo (contrato escaneado muy largo). Por favor intenta de nuevo — el servidor puede tardar hasta 4 minutos en procesar contratos escaneados.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
            throw new Error('El servidor no devolvio una respuesta. Por favor intenta de nuevo en unos minutos.');
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

// ===== Job Status Polling =====

async function pollJobStatus(jobId) {
    for (let attempt = 0; attempt < CONFIG.POLL_MAX_ATTEMPTS; attempt++) {
        await new Promise(r => setTimeout(r, CONFIG.POLL_INTERVAL));

        // Mensajes de carga progresivos
        if (attempt === 8)  updateLoadingStep(3, 'Procesando con OCR (contrato escaneado)...');
        if (attempt === 20) updateLoadingStep(3, 'Analizando clausulas (puede tardar 2-3 min)...');
        if (attempt === 40) updateLoadingStep(3, 'Casi listo, finalizando analisis...');

        console.log(`Poll #${attempt + 1} — job: ${jobId}`);

        try {
            const response = await fetch(
                `${CONFIG.N8N_BASE_URL + CONFIG.ENDPOINTS.STATUS}?jobId=${encodeURIComponent(jobId)}`
            );

            if (!response.ok) {
                throw new Error(`Error consultando estado: ${response.status}`);
            }

            const payload = await response.json();
            console.log(`Poll #${attempt + 1} — status: ${payload.status}`);

            if (payload.status === 'error') {
                throw new Error('Error al procesar el contrato en el servidor');
            }

            if (payload.status === 'completed' && payload.result) {
                const result = payload.result;
                const fullResult = result.resultado_json
                    ? { ...result, ...result.resultado_json }
                    : result;

                return {
                    ...fullResult,
                    success: true,
                    contratoId: fullResult.contratoId || fullResult.contrato_id || fullResult.id
                };
            }

        } catch (err) {
            if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
                throw err;
            }
            console.warn(`Poll #${attempt + 1} error red:`, err.message);
        }
    }

    throw new Error('El analisis tardo demasiado tiempo. Por favor intenta de nuevo.');
}
