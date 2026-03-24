// InmoLawyer - Autenticacion Supabase v3.0

const CONFIG_AUTH = {
    supabase: {
        url: 'https://oqipslfzbeioakfllohm.supabase.co',
        anonKey: 'sb_publishable_jZUUlb22emiChmOQnlwujw_3NRk0oLS'
    },
    admin: {
        emails: ['f@feche.xyz']
    },
    whatsapp: {
        // Número del bot de WhatsApp Business (sin +, formato internacional)
        phoneNumber: '573337124882'
    }
};

const supabaseClient = window.supabase.createClient(CONFIG_AUTH.supabase.url, CONFIG_AUTH.supabase.anonKey);

function isAdmin() {
    return !!(currentUser && CONFIG_AUTH.admin.emails.includes(currentUser.email.toLowerCase()));
}

// Variables globales accesibles desde app.js
let currentUser = null;
let currentUserProfile = null;
let appInitialized = false;

// ===== Normalizar email: eliminar +alias =====
function normalizeEmail(email) {
    const lower = email.toLowerCase().trim();
    const [local, domain] = lower.split('@');
    if (!domain) return lower;
    const cleanLocal = local.split('+')[0];
    return `${cleanLocal}@${domain}`;
}

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function normalizeDisplayName(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ===== Cargar perfil del usuario desde Supabase =====
async function loadCurrentUserProfile() {
    if (!currentUser) return null;
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();
        if (error) throw error;

        if (!data) {
            // Primera vez: crear perfil con defaults
            const newProfile = {
                id: currentUser.id,
                email: currentUser.email,
                nombre: normalizeDisplayName(currentUser.user_metadata?.full_name || currentUser.email.split('@')[0]),
                fecha_registro: new Date().toISOString(),
                plan: 'freemium',
                estudios_restantes: 5,
                tc_aceptados: false
            };
            const { data: created, error: createErr } = await supabaseClient
                .from('user_profiles')
                .insert(newProfile)
                .select()
                .single();
            if (createErr) throw createErr;
            currentUserProfile = created;
            return created;
        }

        currentUserProfile = data;
        return data;
    } catch (err) {
        console.error('Error cargando perfil:', err);
        return null;
    }
}

// ===== Inicializar auth =====
async function initAuth() {
    let recoveryDetected = false;

    // Register listener FIRST to catch PASSWORD_RECOVERY event
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            recoveryDetected = true;
            showResetPasswordForm();
            return;
        }
        // Skip any event that would override the recovery form
        if (recoveryDetected) return;
        currentUser = session?.user ?? null;
        if (session) {
            await showApp();
        } else {
            appInitialized = false;
            currentUserProfile = null;
            showAuth();
        }
    });

    const { data: { session } } = await supabaseClient.auth.getSession();
    // Wait a tick to let onAuthStateChange fire PASSWORD_RECOVERY if applicable
    await new Promise(r => setTimeout(r, 100));
    // Only show app/auth if recovery was NOT detected by the listener
    if (!recoveryDetected) {
        if (session) {
            currentUser = session.user;
            await showApp();
        } else {
            showAuth();
        }
    }
}

// ===== Mostrar pantalla de auth =====
function showAuth() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

// ===== Mostrar la app principal =====
async function showApp() {
    // Cargar perfil antes de mostrar la app
    await loadCurrentUserProfile();

    // Verificar T&C para usuarios existentes
    if (currentUserProfile && !currentUserProfile.tc_aceptados) {
        showTCModal();
        return; // No mostrar la app hasta que acepte T&C
    }

    _renderApp();
}

function _renderApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    const emailEl = document.getElementById('userEmailDisplay');
    if (emailEl && currentUser) emailEl.textContent = currentUser.email;

    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.style.display = isAdmin() ? 'inline-flex' : 'none';

    const buyBtn = document.getElementById('buyCreditsBtn');
    if (buyBtn) buyBtn.style.display = isAdmin() ? 'none' : 'inline-flex';

    const appNav = document.getElementById('appNav');
    if (appNav) appNav.style.display = isAdmin() ? 'none' : 'flex';

    if (!appInitialized) {
        appInitialized = true;
        if (typeof initApp === 'function') initApp();
    }

    // Actualizar contador de estudios
    if (typeof updateStudiosCounter === 'function') updateStudiosCounter();

    // Verificar si el usuario ya vinculó WhatsApp
    checkAndShowWhatsAppBanner();
}

// ===== Modal Términos y Condiciones =====
function showTCModal() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('tcModal').style.display = 'flex';
}

async function acceptTerms() {
    const btn = document.getElementById('tcAcceptBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({
                tc_aceptados: true,
                tc_aceptados_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        if (currentUserProfile) {
            currentUserProfile.tc_aceptados = true;
            currentUserProfile.tc_aceptados_at = new Date().toISOString();
        }

        document.getElementById('tcModal').style.display = 'none';
        _renderApp();

    } catch (err) {
        console.error('Error aceptando T&C:', err);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Acepto los Términos y Condiciones';
    }
}

// ===== Login =====
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    errorEl.style.display = 'none';

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            const msg = error.message === 'Invalid login credentials'
                ? 'Email o contraseña incorrectos'
                : error.message;
            errorEl.textContent = msg;
            errorEl.style.color = '#dc2626';
            errorEl.style.display = 'block';
        }
        // Si no hay error, onAuthStateChange maneja el flujo
    } catch (err) {
        errorEl.textContent = 'Error inesperado: ' + err.message;
        errorEl.style.color = '#dc2626';
        errorEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar sesión';
}

// ===== Registro =====
async function handleRegister(e) {
    e.preventDefault();
    const nombre = normalizeDisplayName(document.getElementById('registerName').value);
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const tcCheck = document.getElementById('registerTC');
    const errorEl = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');

    // Validar T&C obligatorio
    if (!tcCheck || !tcCheck.checked) {
        errorEl.textContent = 'Debes aceptar los Términos y Condiciones para continuar.';
        errorEl.style.color = '#dc2626';
        errorEl.style.display = 'block';
        return;
    }

    if (!nombre) {
        errorEl.textContent = 'Ingresa un nombre válido.';
        errorEl.style.color = '#dc2626';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
    errorEl.style.display = 'none';

    // Detectar +alias
    const emailNormalizado = normalizeEmail(email);
    const aliasDetectado = emailNormalizado !== email.toLowerCase().trim();

    try {
        // Verificar si el email normalizado ya existe (anti +alias duplicado)
        const { data: existingByNormalized } = await supabaseClient
            .from('user_profiles')
            .select('id, email')
            .eq('email_normalizado', emailNormalizado)
            .maybeSingle();

        if (existingByNormalized) {
            errorEl.innerHTML = aliasDetectado
                ? `Ya existe una cuenta asociada a este email (<strong>${escapeHTML(existingByNormalized.email)}</strong>). Usá "Iniciar sesión".`
                : 'Este email ya tiene una cuenta. Usá "Iniciar sesión".';
            errorEl.style.color = '#dc2626';
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Crear cuenta';
            return;
        }

        // Crear cuenta en Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { nombre },
                emailRedirectTo: 'https://inmo.tools/inmolawyer/app'
            }
        });

        if (error) {
            const msg = error.message.includes('rate limit')
                ? 'Demasiados intentos. Esperá unos minutos.'
                : error.message.includes('already registered') || error.message.includes('User already registered')
                ? 'Este email ya tiene una cuenta. Usá "Iniciar sesión".'
                : error.message;
            errorEl.textContent = msg;
            errorEl.style.color = '#dc2626';
            errorEl.style.display = 'block';
        } else {
            if (data?.user) {
                await supabaseClient.from('user_profiles').upsert({
                    id: data.user.id,
                    email: email,
                    nombre: nombre,
                    fecha_registro: new Date().toISOString(),
                    plan: 'freemium',
                    estudios_restantes: 5,
                    tc_aceptados: true,
                    tc_aceptados_at: new Date().toISOString(),
                    email_normalizado: emailNormalizado,
                    alias_detectado: aliasDetectado
                });
            }

            // Generar código de vinculación WhatsApp
            let waCode = null;
            try {
                waCode = await createWhatsAppLink(data.user.id);
            } catch (_) { /* silently continue if fails */ }

            if (data?.session) {
                // autoconfirm: onAuthStateChange hará showApp(), luego mostrar QR
                if (waCode) setTimeout(() => showWhatsAppModal(waCode), 1200);
                return;
            }

            errorEl.innerHTML = '✅ ¡Cuenta creada! <strong>Revisá tu email</strong> y hacé clic en el enlace para activar tu cuenta.';
            errorEl.style.color = '#16a34a';
            errorEl.style.display = 'block';
            // Mostrar QR de WhatsApp debajo del mensaje de confirmación
            if (waCode) setTimeout(() => showWhatsAppModal(waCode), 500);
        }
    } catch (err) {
        errorEl.textContent = 'Error inesperado: ' + err.message;
        errorEl.style.color = '#dc2626';
        errorEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Crear cuenta';
}

// ===== WhatsApp Linking =====
function generateVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I/O/0/1 para evitar confusión
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

async function createWhatsAppLink(userId) {
    const code = generateVerificationCode();
    await supabaseClient.from('user_whatsapp').upsert({
        user_id: userId,
        phone_number: 'pending',
        verification_code: code,
        verified: false
    }, { onConflict: 'user_id' });
    return code;
}

function getWhatsAppQRUrl(code) {
    const phone = CONFIG_AUTH.whatsapp.phoneNumber;
    const text = encodeURIComponent(`reg-${code}`);
    const waLink = `https://wa.me/${phone}?text=${text}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waLink)}`;
}

function getWhatsAppDirectLink(code) {
    const phone = CONFIG_AUTH.whatsapp.phoneNumber;
    const text = encodeURIComponent(`reg-${code}`);
    return `https://wa.me/${phone}?text=${text}`;
}

async function showWhatsAppModal(code) {
    const modal = document.getElementById('waLinkModal');
    if (!modal) return;
    const qrImg = document.getElementById('waQrCode');
    const directLink = document.getElementById('waDirectLink');
    const codeEl = document.getElementById('waVerificationCode');

    if (qrImg) qrImg.src = getWhatsAppQRUrl(code);
    if (directLink) directLink.href = getWhatsAppDirectLink(code);
    if (codeEl) codeEl.textContent = code;
    modal.style.display = 'flex';
}

function closeWhatsAppModal() {
    const modal = document.getElementById('waLinkModal');
    if (modal) modal.style.display = 'none';
}

async function checkAndShowWhatsAppBanner() {
    if (!currentUser || isAdmin()) return;
    const { data } = await supabaseClient
        .from('user_whatsapp')
        .select('verified, verification_code')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    const banner = document.getElementById('waLinkBanner');
    if (!banner) return;

    if (!data || !data.verified) {
        banner.style.display = 'flex';
        const code = data?.verification_code || await createWhatsAppLink(currentUser.id);
        banner.querySelector('.wa-banner-btn').onclick = () => showWhatsAppModal(code);
    } else {
        banner.style.display = 'none';
    }
}

// ===== Logout =====
async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// ===== Forgot Password =====
function showForgotForm() {
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    document.getElementById('forgotForm').style.display = 'flex';
    document.querySelector('.auth-tabs').style.display = 'none';
    const msg = document.getElementById('forgotMsg');
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
    const input = document.getElementById('forgotEmail');
    if (input) input.value = '';
}

function hideForgotForm() {
    document.getElementById('forgotForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
    document.querySelector('.auth-tabs').style.display = 'flex';
}

async function handleForgotPassword() {
    const email = (document.getElementById('forgotEmail')?.value || '').trim();
    const msgEl = document.getElementById('forgotMsg');
    const btn = document.getElementById('forgotBtn');

    if (!email) {
        msgEl.textContent = 'Ingresa tu email.';
        msgEl.style.color = '#dc2626';
        msgEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    msgEl.style.display = 'none';

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://inmo.tools/inmolawyer/app'
        });
        if (error) throw error;
        msgEl.innerHTML = '✅ <strong>Enlace enviado.</strong> Revisá tu email (incluída la carpeta de spam) y hacé clic en el enlace para restablecer tu contraseña.';
        msgEl.style.color = '#16a34a';
        msgEl.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-envelope"></i> Reenviar enlace';
    } catch (err) {
        const msg = err.message?.includes('rate limit')
            ? 'Demasiados intentos. Esperá unos minutos.'
            : (err.message || 'Error al enviar el email. Intenta de nuevo.');
        msgEl.textContent = msg;
        msgEl.style.color = '#dc2626';
        msgEl.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-envelope"></i> Enviar enlace';
    }
    btn.disabled = false;
}

// ===== Reset Password (recovery flow tras clic en email) =====
function showResetPasswordForm() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'flex';
    const msg = document.getElementById('resetMsg');
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
    const btn = document.getElementById('resetBtn');
    if (btn) { btn.style.display = ''; btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Cambiar contraseña'; }
}

async function handleNewPassword() {
    const newPwd = document.getElementById('newPassword')?.value || '';
    const confirmPwd = document.getElementById('confirmPassword')?.value || '';
    const msgEl = document.getElementById('resetMsg');
    const btn = document.getElementById('resetBtn');

    msgEl.style.display = 'none';

    if (newPwd.length < 6) {
        msgEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        msgEl.style.color = '#dc2626';
        msgEl.style.display = 'block';
        return;
    }
    if (newPwd !== confirmPwd) {
        msgEl.textContent = 'Las contraseñas no coinciden.';
        msgEl.style.color = '#dc2626';
        msgEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const { error } = await supabaseClient.auth.updateUser({ password: newPwd });
        if (error) throw error;
        msgEl.innerHTML = '✅ <strong>Contraseña actualizada.</strong> Ya podés iniciar sesión.';
        msgEl.style.color = '#16a34a';
        msgEl.style.display = 'block';
        btn.style.display = 'none';
        // Volver al login después de 2s
        setTimeout(() => {
            document.getElementById('resetPasswordForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'flex';
            const tabs = document.querySelector('.auth-tabs');
            if (tabs) tabs.style.display = 'flex';
        }, 2500);
    } catch (err) {
        msgEl.textContent = err.message || 'Error al cambiar la contraseña. Intenta de nuevo.';
        msgEl.style.color = '#dc2626';
        msgEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> Cambiar contraseña';
    }
}

// ===== Cambiar tab login/registro =====
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    const activeBtn = document.querySelector(`.auth-tab-btn[data-tab="${tab}"]`);
    const activeForm = document.getElementById(tab + 'Form');
    if (activeBtn) activeBtn.classList.add('active');
    if (activeForm) activeForm.style.display = 'flex';
}

// ===== Inicializar al cargar el DOM =====
document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
    });
});
