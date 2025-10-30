const STORAGE_KEY = 'biovet-convenio-demo';
const ADMIN_EMAIL = 'adm.biovetfarma@gmail.com';

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { session: null, compras: {}, colaboradores: {} };
    }
    const parsed = JSON.parse(stored);
    if (!parsed.session) parsed.session = null;
    if (!parsed.compras) parsed.compras = {};
    if (!parsed.colaboradores) parsed.colaboradores = {};
    return parsed;
  } catch (err) {
    console.error('Não foi possível carregar os dados armazenados', err);
    return { session: null, compras: {}, colaboradores: {} };
  }
}

let state = loadState();

function normalizeState() {
  if (!state.compras) state.compras = {};
  if (!state.colaboradores) state.colaboradores = {};

  Object.entries(state.compras).forEach(([email, list]) => {
    if (!Array.isArray(list)) {
      state.compras[email] = [];
      return;
    }
    state.compras[email] = list.map((item) => {
      const normalized = { ...item };
      if (!normalized.id) {
        normalized.id = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      }
      normalized.numero = (normalized.numero || '').trim();
      normalized.observacoes = normalized.observacoes ?? normalized.observacao ?? normalized.descricao ?? '';
      normalized.status = normalized.status || 'pendente';
      normalized.createdAt = normalized.createdAt || new Date().toISOString();
      normalized.ownerEmail = normalized.ownerEmail || email;
      normalized.ownerName = normalized.ownerName || normalized.nomeUsuario || state.colaboradores[email]?.name || email.split('@')[0];
      if (normalized.admin) {
        normalized.admin = {
          valorComDesconto: normalized.admin.valorComDesconto ?? normalized.valor ?? 0,
          status: normalized.admin.status || normalized.status,
          observacao: normalized.admin.observacao || '',
          mesReferencia: normalized.admin.mesReferencia || '',
          descontoData: normalized.admin.descontoData || '',
          atualizadoPor: normalized.admin.atualizadoPor || '',
          atualizadoEm: normalized.admin.atualizadoEm || '',
        };
      } else {
        normalized.admin = null;
      }
      delete normalized.descricao;
      delete normalized.fornecedor;
      delete normalized.valor;
      delete normalized.observacao;
      delete normalized.nomeUsuario;
      return normalized;
    });
  });
}

normalizeState();

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const views = document.querySelectorAll('main > section');
const navButtons = document.querySelectorAll('[data-view]');
const profileChip = document.querySelector('.profile-chip');
const brandLink = document.querySelector('.brand');
const heroCTA = document.getElementById('ctaStart');
const historyTableBody = document.getElementById('historyTableBody');
const historyTotals = document.getElementById('historyTotals');
const purchaseForm = document.getElementById('purchaseForm');
const historyFilterStatus = document.getElementById('historyFilterStatus');
const historyFilterSearch = document.getElementById('historyFilterSearch');
const historyFilterCollaborator = document.getElementById('historyFilterCollaborator');
const historyFilterMonth = document.getElementById('historyFilterMonth');
const historyPrintButton = document.getElementById('historyPrintButton');
const toastContainer = document.querySelector('.toast-container');
const logoutButton = document.getElementById('logoutButton');
const logoutInfo = document.getElementById('logoutInfo');
const homeGreeting = document.getElementById('homeGreeting');
const homeCards = {
  total: document.getElementById('homeTotalRequests'),
  pending: document.getElementById('homePendingRequests'),
  approved: document.getElementById('homeApprovedRequests'),
};

const adminFilterStatus = document.getElementById('adminFilterStatus');
const adminFilterSearch = document.getElementById('adminFilterSearch');
const adminRequestsContainer = document.getElementById('adminRequests');
const adminNavButton = document.querySelector('nav .nav-button[data-view="admin"]');

const loginBackdrop = document.getElementById('loginBackdrop');
const loginForm = document.getElementById('loginForm');
const loginName = document.getElementById('loginName');
const loginEmail = document.getElementById('loginEmail');
const loginDepartment = document.getElementById('loginDepartment');

function openLoginModal(prefillEmail = '') {
  loginBackdrop.classList.add('active');
  if (prefillEmail) {
    loginEmail.value = prefillEmail;
  }
  setTimeout(() => loginName.focus(), 80);
}

function closeLoginModal() {
  loginBackdrop.classList.remove('active');
  loginForm.reset();
}

document.querySelectorAll('[data-action="open-login"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    openLoginModal(state.session?.email ?? '');
  });
});

document.querySelectorAll('[data-action="close-modal"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    closeLoginModal();
  });
});

loginBackdrop.addEventListener('click', (event) => {
  if (event.target === loginBackdrop) {
    closeLoginModal();
  }
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = loginName.value.trim();
  const email = loginEmail.value.trim().toLowerCase();
  const department = loginDepartment.value.trim();

  if (!name || !email) {
    showToast('Informe nome e e-mail corporativo para continuar.', 'error');
    return;
  }

  state.session = {
    name,
    email,
    department,
    joinedAt: state.session?.joinedAt ?? new Date().toISOString(),
  };
  if (!state.compras[email]) {
    state.compras[email] = [];
  }
  state.colaboradores[email] = {
    name,
    department,
    updatedAt: new Date().toISOString(),
  };
  normalizeState();
  persistState();
  updateSessionUI();
  closeLoginModal();
  showToast(`Bem-vindo ao convênio, ${name.split(' ')[0]}!`, 'success');
  setActiveView('home');
});

function isAdmin() {
  return state.session?.email === ADMIN_EMAIL;
}

function getCollaboratorName(email) {
  return state.colaboradores[email]?.name || email.split('@')[0];
}

function getRequestsForEmail(email) {
  return state.compras[email] ?? [];
}

function getAllRequests() {
  return Object.entries(state.compras).flatMap(([email, list]) =>
    (list || []).map((item) => ({
      ...item,
      ownerEmail: item.ownerEmail || email,
      ownerName: item.ownerName || getCollaboratorName(email),
    })),
  );
}

function getVisibleRequests() {
  if (!state.session) return [];
  return isAdmin() ? getAllRequests() : getRequestsForEmail(state.session.email);
}

function getUserRequests() {
  return getVisibleRequests();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMultiline(value) {
  return escapeHtml(value)
    .replace(/\\n/g, '<br>')
    .replace(/\n/g, '<br>');
}

function formatCurrency(value) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  const hasTime = 'hour' in options || 'minute' in options || 'second' in options;
  return hasTime ? date.toLocaleString('pt-BR', options) : date.toLocaleDateString('pt-BR', options);
}

function formatDeductionDate(dateString) {
  if (!dateString) return '—';
  return formatDate(dateString, { day: '2-digit', month: 'long', year: 'numeric' });
}

function calculateFifthBusinessDay(year, monthIndex) {
  let day = 1;
  let businessCount = 0;
  let result = null;
  while (true) {
    const date = new Date(year, monthIndex, day);
    if (date.getMonth() !== monthIndex) break;
    const weekDay = date.getDay();
    if (weekDay !== 0 && weekDay !== 6) {
      businessCount += 1;
      if (businessCount === 5) {
        result = date;
        break;
      }
    }
    day += 1;
  }
  return result || new Date(year, monthIndex, 5);
}

function formatMonthLabel(monthString) {
  if (!monthString) return 'Todos os meses';
  const [year, month] = monthString.split('-').map(Number);
  if (!year || !month) return monthString;
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

function updateCollaboratorFilterOptions() {
  if (!historyFilterCollaborator) return;
  const currentValue = historyFilterCollaborator.value;
  const collaborators = Object.keys(state.compras)
    .filter((email) => (state.compras[email] || []).length > 0)
    .sort((a, b) => getCollaboratorName(a).localeCompare(getCollaboratorName(b), 'pt-BR'));

  historyFilterCollaborator.innerHTML = '<option value="todos">Todos</option>';
  collaborators.forEach((email) => {
    const option = document.createElement('option');
    option.value = email;
    option.textContent = `${getCollaboratorName(email)} (${email})`;
    historyFilterCollaborator.appendChild(option);
  });

  if (collaborators.includes(currentValue)) {
    historyFilterCollaborator.value = currentValue;
  }
}

function setActiveView(viewName) {
  if (viewName === 'admin' && !isAdmin()) {
    showToast('Área restrita ao administrador.', 'error');
    viewName = 'home';
  }

  views.forEach((section) => {
    section.classList.toggle('active', section.dataset.view === viewName);
  });
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  if (viewName !== 'home' && !state.session) {
    openLoginModal();
  }

  if (viewName === 'compras') {
    purchaseForm.querySelector('input')?.focus();
  }

  if (viewName === 'historico') {
    renderHistory();
  }

  if (viewName === 'admin') {
    renderAdmin();
  }

  if (viewName === 'sair') {
    renderLogoutInfo();
  }
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetView = button.dataset.view;
    if (!state.session && targetView !== 'home') {
      openLoginModal();
      return;
    }
    setActiveView(targetView);
  });
});

brandLink?.addEventListener('click', (event) => {
  event.preventDefault();
  setActiveView('home');
  if (!state.session) {
    openLoginModal();
  }
});

heroCTA?.addEventListener('click', () => {
  if (state.session) {
    setActiveView('compras');
  } else {
    openLoginModal();
  }
});

function getHistoryFilteredItems() {
  if (!state.session) return [];

  const items = [...getVisibleRequests()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const statusFilter = historyFilterStatus?.value || 'todas';
  const searchTerm = historyFilterSearch?.value.trim().toLowerCase() || '';
  const collaboratorFilter = historyFilterCollaborator?.value || 'todos';
  const monthFilter = historyFilterMonth?.value || '';

  return items.filter((item) => {
    const matchesStatus = statusFilter === 'todas' || item.status === statusFilter;
    const matchesCollaborator = !isAdmin()
      ? true
      : collaboratorFilter === 'todos' || item.ownerEmail === collaboratorFilter;
    const searchableText = [item.numero, item.observacoes, item.admin?.observacao, item.ownerName, item.ownerEmail]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const itemMonth = (item.admin?.mesReferencia || item.createdAt || '').slice(0, 7);
    const matchesMonth = !monthFilter || (itemMonth && itemMonth === monthFilter);
    return matchesStatus && matchesCollaborator && matchesSearch && matchesMonth;
  });
}

function renderHistory() {
  if (!state.session) return;

  if (isAdmin()) {
    updateCollaboratorFilterOptions();
  }

  const filtered = getHistoryFilteredItems();

  historyTableBody.innerHTML = '';
  if (filtered.length === 0) {
    const emptyRow = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'empty-state';
    cell.innerHTML = '<strong>Nenhum orçamento enviado ainda.</strong><br>Envie sua primeira solicitação na aba Compras.';
    emptyRow.appendChild(cell);
    historyTableBody.appendChild(emptyRow);
  } else {
    filtered.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td title="${escapeHtml(item.observacoes || '')}">${escapeHtml(item.numero)}</td>
        <td>${formatDate(item.createdAt)}</td>
        <td>${formatCurrency(item.admin?.valorComDesconto)}</td>
        <td>${formatDeductionDate(item.admin?.descontoData)}</td>
        <td><span class="status-badge status-${item.status}">${formatStatusLabel(item.status)}</span></td>
      `;
      const combinedNotes = [item.observacoes, item.admin?.observacao].filter(Boolean).join(' • ');
      if (combinedNotes) {
        row.title = combinedNotes;
      }
      historyTableBody.appendChild(row);
    });
  }

  const totalValue = filtered.reduce((sum, item) => sum + (item.admin?.valorComDesconto || 0), 0);
  const totalDisplay = totalValue > 0 ? formatCurrency(totalValue) : 'R$ 0,00';
  historyTotals.textContent = filtered.length
    ? `${filtered.length} orçamento(s) • Total com desconto ${totalDisplay}`
    : 'Nenhum orçamento no período selecionado.';
}

function printHistoryReport() {
  const items = getHistoryFilteredItems();
  if (items.length === 0) {
    showToast('Nenhum registro disponível para impressão com os filtros selecionados.', 'error');
    return;
  }

  const collaboratorFilter = historyFilterCollaborator?.value || 'todos';
  const collaboratorLabel = collaboratorFilter === 'todos'
    ? 'Todos os colaboradores'
    : `${getCollaboratorName(collaboratorFilter)} (${collaboratorFilter})`;
  const monthFilter = historyFilterMonth?.value || '';
  const monthLabel = formatMonthLabel(monthFilter);
  const statusValue = historyFilterStatus?.value || 'todas';
  const statusLabel = statusValue === 'todas' ? 'Todos os status' : formatStatusLabel(statusValue);

  const totalNumeric = items.reduce((sum, item) => sum + (item.admin?.valorComDesconto || 0), 0);
  const totalValue = totalNumeric > 0 ? formatCurrency(totalNumeric) : 'R$ 0,00';
  const rowsHtml = items
    .map((item) => {
      const parts = [];
      if (item.observacoes) parts.push(`Colaborador: ${item.observacoes}`);
      if (item.admin?.observacao) parts.push(`Administrador: ${item.admin.observacao}`);
      const observationsCell = parts.length ? formatMultiline(parts.join('\n')) : '—';
      return `
      <tr>
        <td>${escapeHtml(item.numero)}</td>
        <td>${formatDate(item.createdAt)}</td>
        <td>${escapeHtml(item.ownerName || getCollaboratorName(item.ownerEmail))}</td>
        <td>${formatCurrency(item.admin?.valorComDesconto)}</td>
        <td>${formatDeductionDate(item.admin?.descontoData)}</td>
        <td>${formatStatusLabel(item.status)}</td>
        <td>${observationsCell}</td>
      </tr>
    `;
    })
    .join('');

  const popup = window.open('', '_blank', 'width=900,height=650');
  if (!popup) {
    showToast('Não foi possível abrir a janela de impressão. Desative o bloqueador de pop-ups e tente novamente.', 'error');
    return;
  }

  popup.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório de compras - Convênio Biovetfarma</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2rem; color: #123; }
          h1 { color: #1a7175; }
          table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
          th, td { border: 1px solid rgba(26, 113, 117, 0.2); padding: 0.6rem 0.75rem; text-align: left; font-size: 0.9rem; }
          th { background: rgba(60, 179, 192, 0.1); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.04em; }
          tfoot td { font-weight: bold; }
          .meta { margin-top: 0.5rem; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <h1>Convênio Biovetfarma &mdash; Relatório de Compras</h1>
        <p class="meta"><strong>Colaborador:</strong> ${escapeHtml(collaboratorLabel)}</p>
        <p class="meta"><strong>Mês de desconto:</strong> ${escapeHtml(monthLabel)}</p>
        <p class="meta"><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
        <table>
          <thead>
            <tr>
              <th>Orçamento</th>
              <th>Enviado em</th>
              <th>Colaborador</th>
              <th>Valor com desconto</th>
              <th>Desconto em</th>
              <th>Status</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7">Total com desconto: ${totalValue}</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function applyAdminDecision(requestId, { valorComDesconto, status, observacao, mesReferencia, descontoData }) {
  const allowedStatuses = ['pendente', 'aprovado', 'negado'];
  const safeStatus = allowedStatuses.includes(status) ? status : 'pendente';
  let updatedRequest = null;
  Object.entries(state.compras).forEach(([email, list]) => {
    if (updatedRequest) return;
    const requests = list || [];
    const index = requests.findIndex((item) => item.id === requestId);
    if (index >= 0) {
      const target = requests[index];
      target.status = safeStatus;
      target.admin = {
        valorComDesconto: Number.isFinite(valorComDesconto) && valorComDesconto > 0 ? valorComDesconto : 0,
        status: safeStatus,
        observacao,
        mesReferencia,
        descontoData,
        atualizadoPor: state.session?.email || ADMIN_EMAIL,
        atualizadoEm: new Date().toISOString(),
      };
      target.ownerEmail = target.ownerEmail || email;
      target.ownerName = target.ownerName || getCollaboratorName(email);
      updatedRequest = target;
    }
  });

  if (updatedRequest) {
    normalizeState();
    persistState();
  }
  return updatedRequest;
}

function renderAdmin() {
  if (!adminRequestsContainer) return;
  if (!isAdmin()) {
    adminRequestsContainer.innerHTML = '<p class="helper-text">Identifique-se como administrador para acessar os pedidos.</p>';
    return;
  }

  const statusFilter = adminFilterStatus?.value || 'todos';
  const searchTerm = adminFilterSearch?.value.trim().toLowerCase() || '';

  const items = getAllRequests()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((item) => {
      const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
      const searchable = [item.numero, item.ownerName, item.ownerEmail, item.observacoes, item.admin?.observacao]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !searchTerm || searchable.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });

  adminRequestsContainer.innerHTML = '';

  if (items.length === 0) {
    adminRequestsContainer.innerHTML = '<p class="helper-text">Nenhum orçamento encontrado para os filtros selecionados.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'admin-request-card';

    card.innerHTML = `
      <div class="admin-card-header">
        <h3>Orçamento ${escapeHtml(item.numero)}</h3>
        <span class="status-badge status-${item.status}">${formatStatusLabel(item.status)}</span>
      </div>
      <div class="meta">
        <span>👤 ${escapeHtml(item.ownerName || getCollaboratorName(item.ownerEmail))}</span>
        <span>📧 ${escapeHtml(item.ownerEmail)}</span>
        <span>📅 ${formatDate(item.createdAt)}</span>
      </div>
      ${item.observacoes ? `<p><strong>Observações do colaborador:</strong> ${formatMultiline(item.observacoes)}</p>` : ''}
    `;

    const form = document.createElement('form');
    form.dataset.id = item.id;
    form.innerHTML = `
      <div class="input-row">
        <div>
          <label for="admin-valor-${item.id}">Valor com desconto (R$)</label>
          <input type="number" step="0.01" min="0" name="valor" id="admin-valor-${item.id}" placeholder="0,00" />
        </div>
        <div>
          <label for="admin-status-${item.id}">Status</label>
          <select name="status" id="admin-status-${item.id}">
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="negado">Negado</option>
          </select>
        </div>
        <div>
          <label for="admin-mes-${item.id}">Mês para desconto (5º dia útil)</label>
          <input type="month" name="mes" id="admin-mes-${item.id}" />
        </div>
      </div>
      <label for="admin-observacao-${item.id}">Observações do administrador</label>
      <textarea name="observacao" id="admin-observacao-${item.id}" placeholder="Anote orientações para o colaborador"></textarea>
      <button type="submit" class="btn btn-primary"><span class="icon">💾</span> Salvar decisão</button>
    `;

    adminRequestsContainer.appendChild(card);
    card.appendChild(form);

    const valorInput = form.querySelector('input[name="valor"]');
    const statusSelect = form.querySelector('select[name="status"]');
    const mesInput = form.querySelector('input[name="mes"]');
    const observacaoTextarea = form.querySelector('textarea[name="observacao"]');

    if (item.admin && Number.isFinite(item.admin.valorComDesconto)) {
      valorInput.value = item.admin.valorComDesconto;
    }
    statusSelect.value = item.status;
    if (item.admin?.mesReferencia) {
      mesInput.value = item.admin.mesReferencia;
    }
    if (item.admin?.observacao) {
      observacaoTextarea.value = item.admin.observacao;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const valor = parseFloat(valorInput.value);
      const status = statusSelect.value;
      const mesReferencia = mesInput.value;
      const observacao = observacaoTextarea.value.trim();
      let descontoData = '';
      if (mesReferencia) {
        const [year, month] = mesReferencia.split('-').map(Number);
        if (year && month) {
          descontoData = calculateFifthBusinessDay(year, month - 1).toISOString();
        }
      }

      const updated = applyAdminDecision(item.id, {
        valorComDesconto: Number.isFinite(valor) ? valor : 0,
        status,
        observacao,
        mesReferencia,
        descontoData,
      });

      if (updated) {
        showToast('Decisão registrada com sucesso.', 'success');
        renderHistory();
        renderAdmin();
        updateHomeSummary();
      } else {
        showToast('Não foi possível atualizar este orçamento.', 'error');
      }
    });

    const footer = document.createElement('div');
    footer.className = 'admin-card-footer';
    const descontoInfo = item.admin?.descontoData
      ? `Desconto em ${formatDeductionDate(item.admin.descontoData)}`
      : 'Sem data de desconto definida';
    footer.innerHTML = `
      <span class="badge">${escapeHtml(descontoInfo)}</span>
      ${item.admin?.atualizadoEm
        ? `<small>Última atualização em ${formatDate(item.admin.atualizadoEm, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>`
        : '<small>Sem histórico de aprovação.</small>'}
    `;
    card.appendChild(footer);
  });
}

function formatStatusLabel(status) {
  switch (status) {
    case 'aprovado':
      return 'Aprovado';
    case 'negado':
      return 'Negado';
    default:
      return 'Pendente';
  }
}

[historyFilterStatus, historyFilterSearch, historyFilterMonth, historyFilterCollaborator]
  .filter(Boolean)
  .forEach((element) => {
    const eventName = element.tagName === 'SELECT' ? 'change' : 'input';
    element.addEventListener(eventName, () => {
      renderHistory();
    });
  });

historyPrintButton?.addEventListener('click', () => {
  if (!isAdmin()) {
    showToast('Disponível apenas para o administrador.', 'error');
    return;
  }
  printHistoryReport();
});

[adminFilterStatus, adminFilterSearch]
  .filter(Boolean)
  .forEach((element) => {
    const eventName = element === adminFilterSearch ? 'input' : 'change';
    element.addEventListener(eventName, () => {
      renderAdmin();
    });
  });

purchaseForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!state.session) {
    openLoginModal();
    return;
  }

  const numero = event.target.numero.value.trim();
  const observacoes = event.target.observacoes.value.trim();

  if (!numero) {
    showToast('Informe o número do orçamento para enviar.', 'error');
    return;
  }

  const userList = getRequestsForEmail(state.session.email);
  const alreadyExists = userList.some((item) => item.numero === numero);
  if (alreadyExists) {
    showToast('Você já enviou um orçamento com esse número.', 'error');
    return;
  }

  const newRequest = {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    numero,
    observacoes,
    status: 'pendente',
    createdAt: new Date().toISOString(),
    ownerEmail: state.session.email,
    ownerName: getCollaboratorName(state.session.email),
    admin: null,
  };

  if (!state.compras[state.session.email]) {
    state.compras[state.session.email] = [];
  }
  state.compras[state.session.email].push(newRequest);
  normalizeState();
  persistState();
  event.target.reset();
  renderHistory();
  if (isAdmin()) {
    renderAdmin();
  }
  updateHomeSummary();
  showToast('Orçamento enviado para avaliação do administrador (DEMO).', 'success');
});

logoutButton.addEventListener('click', () => {
  if (!state.session) {
    openLoginModal();
    return;
  }
  const name = state.session.name.split(' ')[0];
  state.session = null;
  persistState();
  updateSessionUI();
  showToast(`${name}, sua sessão foi encerrada.`, 'success');
  setActiveView('home');
});

function renderLogoutInfo() {
  if (!logoutInfo) return;
  if (!state.session) {
    logoutInfo.innerHTML = '<p class="helper-text">Faça login para visualizar os dados da sua conta corporativa.</p>';
    return;
  }

  const adminMode = isAdmin();
  const totalRequests = getUserRequests().length;
  logoutInfo.innerHTML = `
    <div class="card">
      <h3>${state.session.name}</h3>
      <p class="helper-text">${state.session.email}</p>
      ${state.session.department ? `<p>Setor: <strong>${state.session.department}</strong></p>` : ''}
      <p>Desde ${new Date(state.session.joinedAt).toLocaleDateString('pt-BR')} conectado ao convênio.</p>
      <div class="badge">${totalRequests} orçamento(s) ${adminMode ? 'monitorados' : 'registrados'}</div>
      ${adminMode ? '<p class="helper-text">Modo administrador ativo: utilize a aba Admin para aprovar orçamentos e programar descontos.</p>' : ''}
    </div>
  `;
}

function updateSessionUI() {
  const adminMode = isAdmin();
  if (state.session) {
    const firstName = state.session.name.split(' ')[0];
    const icon = adminMode ? '🛡️' : '👩‍⚕️';
    profileChip.innerHTML = `<span class="icon">${icon}</span><span><strong>${firstName}</strong><br>${state.session.email}</span>`;
    profileChip.style.visibility = 'visible';
    homeGreeting.innerHTML = `Olá, <span class="highlight">${firstName}</span>!`;
  } else {
    profileChip.innerHTML = '<span class="icon">🔐</span><span><strong>Visitante</strong><br>Entre para usar o convênio</span>';
    profileChip.style.visibility = 'visible';
    homeGreeting.innerHTML = 'Bem-vindo ao convênio Biovetfarma!';
  }

  document.body.classList.toggle('is-admin', adminMode);
  if (adminNavButton) {
    adminNavButton.style.display = adminMode ? 'inline-flex' : 'none';
  }
  if (historyFilterCollaborator) {
    historyFilterCollaborator.disabled = !adminMode;
    if (!adminMode) {
      historyFilterCollaborator.value = 'todos';
    }
  }
  if (historyPrintButton) {
    historyPrintButton.disabled = !adminMode;
  }

  if (purchaseForm) {
    const submitButton = purchaseForm.querySelector('button[type="submit"]');
    Array.from(purchaseForm.elements).forEach((element) => {
      if (element instanceof HTMLButtonElement) return;
      element.disabled = !state.session;
    });
    if (submitButton) {
      submitButton.disabled = !state.session;
      submitButton.setAttribute(
        'title',
        state.session ? 'Enviar orçamento para aprovação' : 'Faça login para enviar seu orçamento',
      );
    }
  }
  if (logoutButton) {
    logoutButton.disabled = !state.session;
    logoutButton.setAttribute(
      'title',
      state.session ? 'Encerrar sessão do convênio' : 'Faça login para acessar esta área',
    );
  }
  updateHomeSummary();
  renderHistory();
  renderLogoutInfo();
  if (adminMode) {
    renderAdmin();
  }
}

function updateHomeSummary() {
  const requests = getUserRequests();
  const total = requests.length;
  const pending = requests.filter((item) => item.status === 'pendente').length;
  const approved = requests.filter((item) => item.status === 'aprovado').length;

  homeCards.total.textContent = String(total).padStart(2, '0');
  homeCards.pending.textContent = String(pending).padStart(2, '0');
  homeCards.approved.textContent = String(approved).padStart(2, '0');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'success' : type === 'error' ? 'error' : ''}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => console.info('Service worker registrado para o convênio Biovetfarma.'))
      .catch((err) => console.warn('Não foi possível registrar o service worker', err));
  });
}

window.addEventListener('load', () => {
  updateSessionUI();
  if (!state.session) {
    openLoginModal();
  } else {
    setActiveView('home');
  }
});

historyFilterSearch?.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') {
    event.target.value = '';
    renderHistory();
  }
});

setActiveView('home');
