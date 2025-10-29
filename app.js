const STORAGE_KEY = 'biovet-convenio-demo';

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { session: null, compras: {} };
    }
    const parsed = JSON.parse(stored);
    if (!parsed.session) parsed.session = null;
    if (!parsed.compras) parsed.compras = {};
    return parsed;
  } catch (err) {
    console.error('Não foi possível carregar os dados armazenados', err);
    return { session: null, compras: {} };
  }
}

let state = loadState();

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
const toastContainer = document.querySelector('.toast-container');
const logoutButton = document.getElementById('logoutButton');
const logoutInfo = document.getElementById('logoutInfo');
const homeGreeting = document.getElementById('homeGreeting');
const homeCards = {
  total: document.getElementById('homeTotalRequests'),
  pending: document.getElementById('homePendingRequests'),
  approved: document.getElementById('homeApprovedRequests'),
};

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
  persistState();
  updateSessionUI();
  closeLoginModal();
  showToast(`Bem-vindo ao convênio, ${name.split(' ')[0]}!`, 'success');
  setActiveView('home');
});

function setActiveView(viewName) {
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

function getUserRequests() {
  if (!state.session) return [];
  return state.compras[state.session.email] ?? [];
}

function renderHistory() {
  const items = [...getUserRequests()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const statusFilter = historyFilterStatus.value;
  const searchTerm = historyFilterSearch.value.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesStatus = statusFilter === 'todas' || item.status === statusFilter;
    const matchesSearch = !searchTerm || [item.numero, item.descricao, item.fornecedor]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

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
        <td>${item.numero}</td>
        <td>${new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td>${item.descricao || '—'}</td>
        <td>${item.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor) : '—'}</td>
        <td><span class="status-badge status-${item.status}">${formatStatusLabel(item.status)}</span></td>
      `;
      historyTableBody.appendChild(row);
    });
  }

  const totalValue = filtered.reduce((sum, item) => sum + (item.valor || 0), 0);
  historyTotals.textContent = filtered.length
    ? `${filtered.length} orçamento(s) • Total aproximado ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}`
    : 'Nenhum orçamento no período selecionado.';
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

[historyFilterStatus, historyFilterSearch]
  .filter(Boolean)
  .forEach((element) => {
    element.addEventListener('input', () => {
      renderHistory();
    });
  });

purchaseForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!state.session) {
    openLoginModal();
    return;
  }

  const numero = event.target.numero.value.trim();
  const descricao = event.target.descricao.value.trim();
  const valor = parseFloat(event.target.valor.value.replace(',', '.'));
  const fornecedor = event.target.fornecedor.value.trim();
  const observacoes = event.target.observacoes.value.trim();

  if (!numero) {
    showToast('Informe o número do orçamento para enviar.', 'error');
    return;
  }

  const userList = state.compras[state.session.email] ?? [];
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
    descricao,
    fornecedor,
    observacoes,
    valor: Number.isFinite(valor) ? valor : 0,
    status: 'pendente',
    createdAt: new Date().toISOString(),
  };

  if (!state.compras[state.session.email]) {
    state.compras[state.session.email] = [];
  }
  state.compras[state.session.email].push(newRequest);
  persistState();
  event.target.reset();
  renderHistory();
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

  logoutInfo.innerHTML = `
    <div class="card">
      <h3>${state.session.name}</h3>
      <p class="helper-text">${state.session.email}</p>
      ${state.session.department ? `<p>Setor: <strong>${state.session.department}</strong></p>` : ''}
      <p>Desde ${new Date(state.session.joinedAt).toLocaleDateString('pt-BR')} conectado ao convênio.</p>
      <div class="badge">${getUserRequests().length} orçamento(s) registrados</div>
    </div>
  `;
}

function updateSessionUI() {
  if (state.session) {
    profileChip.innerHTML = `<span class="icon">👩‍⚕️</span><span><strong>${state.session.name.split(' ')[0]}</strong><br>${state.session.email}</span>`;
    profileChip.style.visibility = 'visible';
    homeGreeting.innerHTML = `Olá, <span class="highlight">${state.session.name.split(' ')[0]}</span>!`;
  } else {
    profileChip.innerHTML = '<span class="icon">🔐</span><span><strong>Visitante</strong><br>Entre para usar o convênio</span>';
    profileChip.style.visibility = 'visible';
    homeGreeting.innerHTML = 'Bem-vindo ao convênio Biovetfarma!';
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
