// InmoLawyer - Admin Panel Module
// Dashboard stats, user registry, questions viewer

import { showToast } from './ui-helpers.js';

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
    if (!isAdmin()) return;
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

// ===== Load Admin Data =====

export async function loadAdminData(forceRefresh = false) {
    if (!isAdmin()) return;

    const now = Date.now();
    if (!forceRefresh && ADMIN_CACHE.stats && (now - ADMIN_CACHE.statsAt) < ADMIN_CACHE.TTL) {
        renderAdminStats(ADMIN_CACHE.stats);
        return;
    }

    try {
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);

        // 5 queries en paralelo
        const [
            { count: totalContratos },
            { count: contratosMes },
            { count: totalConsultas },
            { data: contractData },
            { data: recientes }
        ] = await Promise.all([
            supabaseClient.from('contratos').select('*', { count: 'exact', head: true }),
            supabaseClient.from('contratos').select('*', { count: 'exact', head: true }).gte('created_at', firstOfMonth.toISOString()),
            supabaseClient.from('consultas_chat').select('*', { count: 'exact', head: true }),
            supabaseClient.from('contratos').select('user_email, score_riesgo, ciudad'),
            supabaseClient.from('contratos').select('created_at, ciudad, score_riesgo, user_email, duracion_meses').order('created_at', { ascending: false }).limit(20)
        ]);

        // Usuarios unicos desde contractData (client-side, sin query extra)
        const uniqueUsers = new Set((contractData || []).map(r => r.user_email).filter(Boolean)).size;

        // Distribucion de riesgo
        let riskHTML;
        if (contractData && contractData.length > 0) {
            const high = contractData.filter(c => (c.score_riesgo || 0) >= 51).length;
            const med  = contractData.filter(c => (c.score_riesgo || 0) >= 26 && (c.score_riesgo || 0) < 51).length;
            const low  = contractData.filter(c => (c.score_riesgo || 0) < 26).length;
            riskHTML = `
                <div class="risk-bar"><span class="risk-label danger">Alto (&ge;51)</span><strong class="risk-count">${high}</strong></div>
                <div class="risk-bar"><span class="risk-label warning">Medio (26-50)</span><strong class="risk-count">${med}</strong></div>
                <div class="risk-bar"><span class="risk-label success">Bajo (&lt;26)</span><strong class="risk-count">${low}</strong></div>
            `;
        } else {
            riskHTML = '<p class="admin-empty">Sin datos aun</p>';
        }

        // Top ciudades
        let ciudadesHTML;
        if (contractData && contractData.length > 0) {
            const freq = {};
            contractData.forEach(r => { if (r.ciudad) freq[r.ciudad] = (freq[r.ciudad] || 0) + 1; });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
            ciudadesHTML = sorted
                .map(([city, n]) => `<div class="ciudad-row"><span>${city}</span><strong>${n}</strong></div>`)
                .join('') || '<p class="admin-empty">Sin datos aun</p>';
        } else {
            ciudadesHTML = '<p class="admin-empty">Sin datos aun</p>';
        }

        // Tabla contratos recientes
        let recientesHTML;
        if (recientes && recientes.length > 0) {
            recientesHTML = recientes.map(c => {
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
        ADMIN_CACHE.stats = { totalContratos, contratosMes, totalConsultas, uniqueUsers, riskHTML, ciudadesHTML, recientesHTML };
        ADMIN_CACHE.statsAt = Date.now();

        renderAdminStats(ADMIN_CACHE.stats);

        // Si el tab de clientes esta activo, recargar tambien
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

// ===== Users Registry =====

export async function loadUsersRegistry(page = 0) {
    if (!isAdmin()) return;
    adminUsersPage = page;
    const tbody = document.getElementById('usersTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px"><i class="fas fa-spinner fa-spin"></i> Cargando clientes...</td></tr>';

    try {
        const from = page * ADMIN_PAGE_SIZE;
        const to   = from + ADMIN_PAGE_SIZE - 1;

        // Paginacion server-side: solo trae los usuarios de esta pagina
        const { data: profiles, count: totalCount } = await supabaseClient
            .from('user_profiles')
            .select('id, email, nombre, fecha_registro, plan, estudios_restantes, alias_detectado', { count: 'exact' })
            .order('fecha_registro', { ascending: false })
            .range(from, to);

        if (totalCount !== null) adminUsersTotalCount = totalCount;

        if (!profiles || profiles.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px">No hay clientes registrados</td></tr>';
            updatePaginationUI();
            return;
        }

        // Traer contratos y chats SOLO para los usuarios de esta pagina (filtrado por ids)
        const userIds = profiles.map(p => p.id);
        const [{ data: contratos }, { data: chats }] = await Promise.all([
            supabaseClient.from('contratos').select('user_id, created_at').in('user_id', userIds),
            supabaseClient.from('consultas_chat').select('user_id, created_at').in('user_id', userIds)
        ]);

        const now = new Date();
        const hace30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const hace7  = new Date(now -  7 * 24 * 60 * 60 * 1000);
        const primerDelMes = new Date(now.getFullYear(), now.getMonth(), 1);

        // Agrupar contratos por user_id
        const contratosByUser = {};
        (contratos || []).forEach(c => {
            if (!c.user_id) return;
            if (!contratosByUser[c.user_id]) contratosByUser[c.user_id] = { total: 0, esteMes: 0, lastAt: null };
            contratosByUser[c.user_id].total++;
            const d = new Date(c.created_at);
            if (d >= primerDelMes) contratosByUser[c.user_id].esteMes++;
            if (!contratosByUser[c.user_id].lastAt || d > contratosByUser[c.user_id].lastAt)
                contratosByUser[c.user_id].lastAt = d;
        });

        // Agrupar chats por user_id
        const chatsByUser = {};
        (chats || []).forEach(c => {
            if (!c.user_id) return;
            if (!chatsByUser[c.user_id]) chatsByUser[c.user_id] = { total: 0, lastAt: null };
            chatsByUser[c.user_id].total++;
            const d = new Date(c.created_at);
            if (!chatsByUser[c.user_id].lastAt || d > chatsByUser[c.user_id].lastAt)
                chatsByUser[c.user_id].lastAt = d;
        });

        // Construir array enriquecido (solo los perfiles de esta pagina)
        usersDataCache = profiles.map(u => {
            const cts = contratosByUser[u.id] || { total: 0, esteMes: 0, lastAt: null };
            const chs = chatsByUser[u.id]     || { total: 0, lastAt: null };
            const lastAct = [cts.lastAt, chs.lastAt].filter(Boolean).sort((a,b) => b-a)[0] || null;

            let tipo;
            if (cts.esteMes >= 3) {
                tipo = 'power';
            } else if (lastAct && lastAct >= hace30) {
                tipo = 'activo';
            } else {
                tipo = 'inactivo';
            }

            return {
                id: u.id,
                email: u.email,
                nombre: u.nombre || '',
                fecha_registro: u.fecha_registro,
                es_nuevo: new Date(u.fecha_registro) >= hace7,
                ultima_actividad: lastAct,
                contratos: cts.total,
                consultas: chs.total,
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

// ===== Top Preguntas =====

export async function loadTopPreguntas() {
    if (!isAdmin()) return;
    const container = document.getElementById('topPreguntasContainer');
    if (!container) return;

    try {
        const { data } = await supabaseClient
            .from('consultas_chat')
            .select('pregunta')
            .limit(500);

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="admin-empty">Sin consultas aun</p>';
            return;
        }

        // Normalizar y contar
        const freq = {};
        data.forEach(r => {
            if (!r.pregunta) return;
            const key = r.pregunta.trim().toLowerCase().slice(0, 120);
            freq[key] = (freq[key] || 0) + 1;
        });

        const top10 = Object.entries(freq)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 10);

        const maxCount = top10[0]?.[1] || 1;

        container.innerHTML = top10.map(([pregunta, count], i) => {
            const pct = Math.round((count / maxCount) * 100);
            return `<div class="top-pregunta-row">
                <span class="pregunta-rank">${i+1}</span>
                <div class="pregunta-info">
                    <p class="pregunta-text">${pregunta.charAt(0).toUpperCase() + pregunta.slice(1)}</p>
                    <div class="pregunta-bar-wrap">
                        <div class="pregunta-bar" style="width:${pct}%"></div>
                    </div>
                </div>
                <span class="pregunta-count">${count}x</span>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Error cargando preguntas:', err);
        container.innerHTML = '<p class="admin-empty">Error cargando preguntas</p>';
    }
}

// ===== User Questions Modal =====

export async function showUserQuestions(userId, userName) {
    const modal = document.getElementById('userQuestionsModal');
    const content = document.getElementById('uqModalContent');
    const title = document.getElementById('uqModalUserName');
    if (!modal || !content) return;

    if (title) title.textContent = userName;
    content.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    modal.style.display = 'flex';

    try {
        const { data } = await supabaseClient
            .from('consultas_chat')
            .select('pregunta, respuesta, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

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
