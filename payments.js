// InmoLawyer - Payments Module
// Wompi integration, plans, credits management

import { CONFIG_WOMPI } from './config.js';
import { showToast } from './ui-helpers.js';

function getAuth() {
    return window.__INMO_AUTH__ || {};
}

// ===== Freemium: Control de estudios =====

export function updateStudiosCounter() {
    const { currentUserProfile, isAdmin } = getAuth();
    const el = document.getElementById('estudiosCounter');
    if (!el) return;

    if (typeof isAdmin === 'function' && isAdmin()) {
        el.style.display = 'none';
        return;
    }

    const profile = currentUserProfile ?? null;
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

export async function decrementEstudios() {
    const { currentUser, currentUserProfile, isAdmin, supabaseClient } = getAuth();
    if (typeof isAdmin === 'function' && isAdmin()) return;
    const profile = currentUserProfile ?? null;
    if (!profile) return;

    const nuevos = Math.max(0, (profile.estudios_restantes ?? 0) - 1);
    profile.estudios_restantes = nuevos; // actualizar local inmediatamente

    await supabaseClient
        .from('user_profiles')
        .update({ estudios_restantes: nuevos })
        .eq('id', currentUser.id);

    updateStudiosCounter();
}

export function hasEstudiosDisponibles() {
    const { currentUserProfile, isAdmin } = getAuth();
    if (typeof isAdmin === 'function' && isAdmin()) return true;
    const profile = currentUserProfile ?? null;
    if (!profile) return false;
    return (profile.estudios_restantes ?? 0) > 0;
}

export function showSectionBlocked() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('blockedSection').style.display = 'flex';
}

// ===== Wompi: Pricing Modal =====

export function showPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (!modal) return;

    // Si la llave publica no esta configurada, redirigir a WhatsApp
    if (CONFIG_WOMPI.publicKey.includes('REPLACE')) {
        showToast('Sistema de pagos en configuracion. Te contactamos por WhatsApp.', 'info');
        if (typeof plausible !== 'undefined') plausible('whatsapp_cta_clicked', { props: { source: 'payments_fallback' } });
        window.open('https://wa.me/573011848771?text=Hola%2C%20quiero%20comprar%20estudios%20en%20InmoLawyer', '_blank');
        return;
    }

    renderPricingPlans();
    modal.style.display = 'flex';
}

export function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) modal.style.display = 'none';
}

function renderPricingPlans() {
    const { currentUser } = getAuth();
    const container = document.getElementById('pricingPlansContainer');
    if (!container) return;

    const userId = currentUser
        ? currentUser.id.replace(/-/g, '').substring(0, 8)
        : 'anon';

    container.innerHTML = CONFIG_WOMPI.plans.map(plan => {
        // Referencia unica por transaccion
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
        <div class="plan-card${plan.badge === 'Mas popular' ? ' plan-featured' : ''}">
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

// ===== Wompi: Checkout =====

export async function initiateWompiCheckout(btn, reference, amountInCents) {
    if (typeof plausible !== 'undefined') plausible('payment_initiated');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
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
        showToast('Error iniciando el pago. Intenta de nuevo.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Comprar ahora';
    }
}

// ===== Wompi: Return Handler =====

export function handleWompiReturn() {
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('id');
    if (!transactionId) return;

    // Limpiar parametros de la URL sin recargar
    window.history.replaceState({}, document.title, window.location.pathname);

    // Notificar al usuario — N8N webhook procesa y actualiza Supabase en el fondo
    setTimeout(() => {
        showToast('Pago recibido! Tus creditos se activaran en unos segundos. Recarga si no ves el cambio.', 'success');
    }, 1200);
}
