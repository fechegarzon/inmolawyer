// InmoLawyer - Admin Panel Module
// Dashboard stats, user registry, questions viewer
// Uses Supabase RPC functions (SECURITY DEFINER) to bypass RLS for admin

import { showToast } from './ui-helpers.js';

function getAuth() {
    return window.__INMO_AUTH__ || {};
}

function isAdminUser() {
    return typeof window.__INMO_AUTH__?.isAdmin === 'function' && window.__INMO_AUTH__.isAdmin();
}

// ===== State =====

let adminPanelVisible = false;
let activeAdminTab = 'stats';
let usersDataCache = []; // cache de la pagina actual para filtrado y export CSV

// Paginacion del registro de clientes
const ADMIN_PAGE_SIZE = 50;
let adminUsersPage = 0;
let adminUsersTotalCount = 0;

// Cache con TTL para evitar refetches innecesarios
const ADMIN_CACHE = {
    stats: null, statsAt: 0,
    TTL: 5 * 60 * 1000 // 5 minutos
};

// ===== Toggle Panel =====

export function toggleAdminPanel() {
    if (!isAdminUser()) return;
    adminPanelVisible = !adminPanelVisible;
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = adminPanelVisible ? 'block' : 'none';
        if (adminPanelVisible) loadAdminData();
    }
}

// ===== Tab Switching =====

export function switchAdminTab(tab) {
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

// ===== Load Admin Data (RPC) =====

export async function loadAdminData(forceRefresh = false) {
    if (!isAdminUser()) return;
    const { supabaseClient } = getAuth();

    const now = Date.now();
    if (!forceRefresh && ADMIN_CACHE.stats && (now - ADMIN_CACHE.statsAt) < ADMIN_CACHE.TTL) {
        renderAdminStats(ADMIN_CACHE.stats);
        return;
    }

    try {
        // RPC calls bypass RLS via SECURITY DEFINER
        const [
            { data: stats, error: statsErr },
            { data: contracts, error: contractsErr },
            { data: risk, error: riskErr }
        ] = await Promise.all([
            supabaseClient.rpc('admin_get_stats'),
            supabaseClient.rpc('admin_get_contracts', { p_limit: 20, p_offset: 0 }),
            supabaseClient.rpc('admin_get_risk_distribution')
        ]);

        if (statsErr) throw statsErr;
        if (contractsErr) throw contractsErr;
        if (riskErr) throw riskErr;

        // Risk distribution HTML
        let riskHTML;
        if (risk) {
            riskHTML = `
                <div class="risk-bar"><span class="risk-label danger">Alto (&ge;51)</span><strong class="risk-count">${risk.alto || 0}</strong></div>
                <div class="risk-bar"><span class="risk-label warning">Medio (26-50)</span><strong class="risk-count">${risk.medio || 0}</strong></div>
                <div class="risk-bar"><span class="risk-label success">Bajo (&lt;26)</span><strong class="risk-count">${risk.bajo || 0}</strong></div>
            `;
        } else {
            riskHTML = '<p class="admin-empty">Sin datos aun</p>';
        }

        // Ciudades HTML
        let ciudadesHTML = '<p class="admin-empty">Sin datos aun</p>';
        if (risk?.ciudades && risk.ciudades.length > 0) {
            ciudadesHTML = risk.ciudades.slice(0, 5)
                .map(c => `<div class="ciudad-row"><span>${c.ciudad}</span><strong>${c.total}</strong></div>`)
                .join('');
        }

        // Recientes HTML
        let recientesHTML;
        if (contracts && contracts.length > 0) {
            recientesHTML = contracts.map(c => {
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
            recientesHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px">Sin contratos aun</td></tr>';
        }

        // Guardar en cache
        ADMIN_CACHE.stats = {
            totalContratos: (stats.total_contratos || 0) + (stats.total_documentos || 0),
            contratosMes: (stats.contratos_mes || 0) + (stats.documentos_mes || 0),
            totalConsultas: stats.total_consultas || 0,
            uniqueUsers: stats.total_usuarios || 0,
            usuariosMes: stats.usuarios_mes || 0,
            waAnalyses: stats.total_wa_analyses || 0,
            waMessages: stats.total_wa_messages || 0,
            jobsStuck: stats.jobs_stuck || 0,
            riskHTML,
            ciudadesHTML,
            recientesHTML
        };
        ADMIN_CACHE.statsAt = Date.now();

        renderAdminStats(ADMIN_CACHE.stats);

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

// ===== Users Registry (RPC) =====

export async function loadUsersRegistry(page = 0) {
    if (!isAdminUser()) return;
    const { supabaseClient } = getAuth();
    adminUsersPage = page;
    const tbody = document.getElementById('usersTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px"><i class="fas fa-spinner fa-spin"></i> Cargando clientes...</td></tr>';

    try {
        const { data, error } = await supabaseClient.rpc('admin_get_users', {
            p_limit: ADMIN_PAGE_SIZE,
            p_offset: page * ADMIN_PAGE_SIZE
        });

        if (error) throw error;

        adminUsersTotalCount = data.total || 0;
        const profiles = data.users || [];

        if (profiles.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px">No hay clientes registrados</td></tr>';
            updatePaginationUI();
            return;
        }

        const now = new Date();
        const hace30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const hace7  = new Date(now -  7 * 24 * 60 * 60 * 1000);

        usersDataCache = profiles.map(u => {
            const lastAct = u.ultima_actividad && new Date(u.ultima_actividad).getFullYear() > 1970
                ? new Date(u.ultima_actividad)
                : null;

            let tipo;
            if (u.contratos_mes >= 3) tipo = 'power';
            else if (lastAct && lastAct >= hace30) tipo = 'activo';
            else tipo = 'inactivo';

            return {
                id: u.id,
                email: u.email,
                nombre: u.nombre || '',
                fecha_registro: u.fecha_registro,
                es_nuevo: new Date(u.fecha_registro) >= hace7,
                ultima_actividad: lastAct,
                contratos: u.contratos_total || 0,
                consultas: u.consultas_total || 0,
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
        const tbody2 = document.getElementById('usersTableBody');
        if (tbody2) tbody2.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#dc2626;padding:20px">Error: ${err.message}</td></tr>`;
    }
}

function updatePaginationUI() {
    const totalPages = Math.ceil(adminUsersTotalCount / ADMIN_PAGE_SIZE);
    const pageInfo = document.getElementById('adminPageInfo');
    const btnPrev  = document.getElementById('btnPrevPage');
    const btnNext  = document.getElementById('btnNextPage');
    if (!pageInfo) return;
    pageInfo.textContent = `Pagina ${adminUsersPage + 1} de ${totalPages || 1} (${adminUsersTotalCount} clientes)`;
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
        const aliasTag = u.alias_detectado ? '<span class="badge-alias" title="Registrado con email +alias">alias</span>' : '';
        const lastActStr = u.ultima_actividad
            ? new Date(u.ultima_actividad).toLocaleDateString('es-CO')
            : '—';
        const regStr = new Date(u.fecha_registro).toLocaleDateString('es-CO');
        const nombre = u.nombre || '<span style="color:#64748b;font-style:italic">Sin nombre</span>';
        const verBtn = u.consultas > 0
            ? `<button class="btn-ver-preguntas" onclick="showUserQuestions('${u.id}','${(u.nombre || u.email).replace(/'/g,"\\'")}')"><i class="fas fa-eye"></i></button>`
            : '';
        const estudiosTag = u.estudios_restantes !== undefined
            ? `<span class="badge-estudios">${u.estudios_restantes}</span>`
            : '';
        return `<tr>
            <td>${nombre}</td>
            <td class="email-cell">${u.email} ${aliasTag}</td>
            <td>${tipoBadge[u.tipo] || ''}</td>
            <td>${regStr} ${nuevoTag}</td>
            <td>${lastActStr}</td>
            <td class="num-cell">${u.contratos}</td>
            <td class="num-cell">${u.consultas}</td>
            <td class="num-cell">${estudiosTag}</td>
            <td>${verBtn}</td>
        </tr>`;
    }).join('');
}

// ===== User Filtering =====

let _filterUsersTimeout;
export function filterUsers() {
    clearTimeout(_filterUsersTimeout);
    _filterUsersTimeout = setTimeout(_applyUsersFilter, 300);
}

function _applyUsersFilter() {
    const search = (document.getElementById('userSearch')?.value || '').toLowerCase();
    const activity = document.getElementById('activityFilter')?.value || '';
    const onlyNew = document.getElementById('newFilter')?.value === 'new';

    const filtered = usersDataCache.filter(u => {
        if (search && !u.email.toLowerCase().includes(search) && !u.nombre.toLowerCase().includes(search)) return false;
        if (activity && u.tipo !== activity) return false;
        if (onlyNew && !u.es_nuevo) return false;
        return true;
    });

    renderUsersTable(filtered);
}

// ===== CSV Export =====

export function exportUsersCSV() {
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

// ===== Top Preguntas (RPC) =====

export async function loadTopPreguntas() {
    if (!isAdminUser()) return;
    const { supabaseClient } = getAuth();
    const container = document.getElementById('topPreguntasContainer');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient.rpc('admin_get_top_preguntas');
        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="admin-empty">Sin consultas aun</p>';
            return;
        }

        const maxCount = data[0]?.frecuencia || 1;
        container.innerHTML = data.map((item, i) => {
            const pct = Math.round((item.frecuencia / maxCount) * 100);
            return `<div class="top-pregunta-row">
                <span class="pregunta-rank">${i+1}</span>
                <div class="pregunta-info">
                    <p class="pregunta-text">${item.pregunta.charAt(0).toUpperCase() + item.pregunta.slice(1)}</p>
                    <div class="pregunta-bar-wrap">
                        <div class="pregunta-bar" style="width:${pct}%"></div>
                    </div>
                </div>
                <span class="pregunta-count">${item.frecuencia}x</span>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Error cargando preguntas:', err);
        container.innerHTML = '<p class="admin-empty">Error cargando preguntas</p>';
    }
}

// ===== User Questions Modal (RPC) =====

export async function showUserQuestions(userId, userName) {
    const { supabaseClient } = getAuth();
    const modal = document.getElementById('userQuestionsModal');
    const content = document.getElementById('uqModalContent');
    const title = document.getElementById('uqModalUserName');
    if (!modal || !content) return;

    if (title) title.textContent = userName;
    content.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    modal.style.display = 'flex';

    try {
        const { data, error } = await supabaseClient.rpc('admin_get_user_questions', { p_user_id: userId });
        if (error) throw error;

        if (!data || data.length === 0) {
            content.innerHTML = '<p class="admin-empty">Este usuario no tiene consultas registradas.</p>';
            return;
        }

        content.innerHTML = data.map(q => `
            <div class="uq-item">
                <div class="uq-meta">${new Date(q.created_at).toLocaleString('es-CO')}</div>
                <div class="uq-question"><i class="fas fa-question-circle"></i> ${q.pregunta || '—'}</div>
                ${q.respuesta ? `<div class="uq-answer"><i class="fas fa-balance-scale"></i> ${q.respuesta.slice(0, 300)}${q.respuesta.length > 300 ? '...' : ''}</div>` : ''}
            </div>
        `).join('');

    } catch (err) {
        content.innerHTML = `<p style="color:#dc2626">Error: ${err.message}</p>`;
    }
}

export function closeUserQuestionsModal(event) {
    if (event && event.target !== document.getElementById('userQuestionsModal')) return;
    document.getElementById('userQuestionsModal').style.display = 'none';
}

// ===== Expose adminUsersPage for pagination onclick =====

export function getAdminUsersPage() {
    return adminUsersPage;
}
