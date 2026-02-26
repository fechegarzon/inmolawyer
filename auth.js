// InmoLawyer - Autenticacion Supabase v1.0
// ============================================================
// PASO 1: Ve a Supabase Dashboard → Settings → API
// PASO 2: Copia "Project URL" y "anon / public" key abajo
// ============================================================

const SUPABASE_URL = 'https://oqipslfzbeioakfllohm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jZUUlb22emiChmOQnlwujw_3NRk0oLS';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable global: el usuario autenticado (accesible desde app.js)
let currentUser = null;
let appInitialized = false;

// ===== Inicializar auth =====
async function initAuth() {
    // Verificar si ya hay sesión activa (cookie de sesión)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
    } else {
        showAuth();
    }

    // Escuchar cambios de sesión (login, logout, token refresh)
    supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user ?? null;
        if (session) {
            showApp();
        } else {
            appInitialized = false; // reset para re-init si vuelve a loguearse
            showAuth();
        }
    });
}

// ===== Mostrar pantalla de auth =====
function showAuth() {
    const authSection = document.getElementById('authSection');
    const appContainer = document.getElementById('appContainer');
    if (authSection) authSection.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
}

// ===== Mostrar la app principal =====
function showApp() {
    const authSection = document.getElementById('authSection');
    const appContainer = document.getElementById('appContainer');
    if (authSection) authSection.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';

    // Mostrar email del usuario en el header
    const emailEl = document.getElementById('userEmailDisplay');
    if (emailEl && currentUser) {
        emailEl.textContent = currentUser.email;
    }

    // Inicializar la app solo una vez
    if (!appInitialized) {
        appInitialized = true;
        if (typeof initApp === 'function') {
            initApp();
        }
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
    btn.textContent = 'Iniciando sesión...';
    errorEl.style.display = 'none';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        const msg = error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos'
            : error.message;
        errorEl.textContent = msg;
        errorEl.style.color = '#dc2626';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
    }
    // Si no hay error, onAuthStateChange llama a showApp() automáticamente
}

// ===== Registro =====
async function handleRegister(e) {
    e.preventDefault();
    const nombre = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const errorEl = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');

    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';
    errorEl.style.display = 'none';

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { nombre }
        }
    });

    if (error) {
        errorEl.textContent = error.message;
        errorEl.style.color = '#dc2626';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
    } else {
        // Éxito - puede que el email de confirmación esté desactivado
        errorEl.textContent = '¡Cuenta creada! Si recibiste un email de confirmación, revísalo.';
        errorEl.style.color = '#16a34a';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
    }
}

// ===== Logout =====
async function handleLogout() {
    await supabase.auth.signOut();
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

    // Formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Tabs
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
    });
});
