// InmoLawyer - Chat Module
// AI-powered post-analysis chat with virtual lawyer

import { CONFIG } from './config.js';
import { showToast } from './ui-helpers.js';
import { getCurrentContractId } from './upload.js';

function getAuth() {
    return window.__INMO_AUTH__ || {};
}

// ===== State =====

const chatQuestionsUsed = {}; // { [contractId]: true } — 1 pregunta por contrato
const chatRateLimit = { lastSent: 0, minInterval: 3000 }; // 3s entre mensajes

// ===== Chat Initialization =====

export function initChat() {
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

// ===== Send Message =====

async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendBtn');

    const message = chatInput.value.trim();
    if (!message) return;

    const currentContractId = getCurrentContractId();

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

    const { currentUser, currentUserProfile, isAdmin } = getAuth();

    // Limite freemium: 1 pregunta por contrato
    if (!(typeof isAdmin === 'function' && isAdmin()) && currentContractId && chatQuestionsUsed[currentContractId]) {
        const profile = currentUserProfile ?? null;
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
                user_id: currentUser ? currentUser.id : null
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

        // Marcar pregunta como usada para este contrato (freemium: 1 por contrato)
        if (currentContractId) chatQuestionsUsed[currentContractId] = true;

    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        addChatMessage('Error al procesar la consulta. Por favor intenta de nuevo.', 'assistant');
    }

    sendBtn.disabled = false;
    chatInput.focus();
}

// ===== Chat Message Rendering =====

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

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

// ===== Typing Indicator =====

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

// ===== Chat Reset (used by new analysis) =====

export function resetChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="message assistant">
            <div class="avatar"><i class="fas fa-balance-scale"></i></div>
            <div class="content">
                <p>Soy tu abogado virtual especializado en arrendamientos. Ya analice tu contrato. Puedes preguntarme:</p>
                <ul>
                    <li>"Es legal el deposito que me piden?"</li>
                    <li>"Como notifico que quiero terminar el contrato?"</li>
                    <li>"Pueden subirme el arriendo mas del IPC?"</li>
                    <li>"Que clausulas son abusivas?"</li>
                </ul>
            </div>
        </div>
    `;
}
