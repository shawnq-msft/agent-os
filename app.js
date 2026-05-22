const STORAGE_KEY = 'agent-os-office-rpg-v2';

const zones = {
  desks: [
    { x: 430, y: 336 },
    { x: 640, y: 336 },
    { x: 430, y: 524 },
    { x: 640, y: 524 },
    { x: 772, y: 394 },
    { x: 296, y: 528 }
  ],
  board: { x: 162, y: 342 },
  rest: { x: 164, y: 610 },
  outsource: { x: 824, y: 552 },
  portal: { x: 822, y: 304 },
  secretary: { x: 150, y: 462 },
  mail: { x: 522, y: 222 }
};

const candidates = [
  { name: 'Codex', role: 'Coding agent', specialty: 'implementation', salary: 120, sprite: 'codex', color: '#64d2a6' },
  { name: 'Hermes', role: 'Ops messenger', specialty: 'coordination', salary: 95, sprite: 'hermes', color: '#ffcf66' },
  { name: 'Claude Code', role: 'Reviewer', specialty: 'review', salary: 115, sprite: 'claude', color: '#9fb7ff' },
  { name: 'Open Claw', role: 'Tool runner', specialty: 'outsourcing', salary: 100, sprite: 'openclaw', color: '#ff8a7a' },
  { name: 'Nova Temp', role: 'Research temp', specialty: 'research', salary: 55, sprite: 'temp', color: '#dda6ff' },
  { name: 'Qwen Analyst', role: 'Data temp', specialty: 'analysis', salary: 60, sprite: 'temp', color: '#68d8ff' },
  { name: 'Sage Architect', role: 'System planner', specialty: 'architecture', salary: 130, sprite: 'temp', color: '#a8e06e' }
];

const defaultState = {
  cash: 4200,
  reputation: 42,
  day: 1,
  speed: 3,
  selectedId: 'codex',
  nextTaskId: 5,
  nextEmployeeId: 5,
  systems: {
    voiceEndpoint: '',
    emailWorkspace: ''
  },
  employees: [
    makeEmployee('codex', candidates[0], 0, false, 'working', 'Build office RPG core'),
    makeEmployee('hermes', candidates[1], 1, false, 'resting', ''),
    makeEmployee('claude', candidates[2], 2, false, 'working', 'Review management loop'),
    makeEmployee('openclaw', candidates[3], 3, false, 'outsourcing', 'Call external tool desk')
  ],
  tasks: [
    makeTask(1, 'Build office RPG core', 'codex', 'doing', 'High', 'none', ''),
    makeTask(2, 'Review management loop', 'claude', 'doing', 'Normal', 'weekly', ''),
    makeTask(3, 'Daily agent standup', 'hermes', 'todo', 'Normal', 'daily', ''),
    makeTask(4, 'Call external tool desk', 'openclaw', 'doing', 'Normal', 'none', '')
  ],
  mail: [],
  log: []
};

let state = loadState();
let tickHandle;

const els = {
  cashStat: document.querySelector('#cashStat'),
  repStat: document.querySelector('#repStat'),
  dayStat: document.querySelector('#dayStat'),
  boardSummary: document.querySelector('#boardSummary'),
  restSummary: document.querySelector('#restSummary'),
  deskLayer: document.querySelector('#deskLayer'),
  routeLayer: document.querySelector('#routeLayer'),
  spriteLayer: document.querySelector('#spriteLayer'),
  fxLayer: document.querySelector('#fxLayer'),
  employeeList: document.querySelector('#employeeList'),
  taskOwner: document.querySelector('#taskOwner'),
  kanban: document.querySelector('#kanban'),
  selectedCard: document.querySelector('#selectedCard'),
  messageBox: document.querySelector('#messageBox'),
  officeLog: document.querySelector('#officeLog'),
  hireDialog: document.querySelector('#hireDialog'),
  candidateSelect: document.querySelector('#candidateSelect'),
  tempHire: document.querySelector('#tempHire'),
  voiceEndpoint: document.querySelector('#voiceEndpoint'),
  emailWorkspace: document.querySelector('#emailWorkspace'),
  speedSlider: document.querySelector('#speedSlider')
};

init();

function init() {
  renderDesks();
  renderCandidates();
  hydrateSystemFields();
  wireEvents();
  log('Secretary initialized the office environment, desks, task board, portal, and service desk.', false);
  render();
  startLoop();
}

function wireEvents() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  document.querySelector('#taskForm').addEventListener('submit', createTask);
  document.querySelector('#hireButton').addEventListener('click', () => els.hireDialog.showModal());
  document.querySelector('#portalZone').addEventListener('click', () => {
    els.tempHire.checked = true;
    els.hireDialog.showModal();
  });
  document.querySelector('#confirmHireButton').addEventListener('click', hireAgent);
  document.querySelector('#callButton').addEventListener('click', callSelected);
  document.querySelector('#emailButton').addEventListener('click', emailSelected);
  document.querySelector('#adjustButton').addEventListener('click', adjustSelectedTask);
  document.querySelector('#outsourceButton').addEventListener('click', outsourceSelected);
  document.querySelector('#outsourceZone').addEventListener('click', outsourceSelected);
  document.querySelector('#boardZone').addEventListener('click', () => activateTab('tasks'));
  document.querySelector('#secretaryZone').addEventListener('click', secretarySetup);
  document.querySelector('#secretarySetupButton').addEventListener('click', secretarySetup);
  document.querySelector('#completeTaskButton').addEventListener('click', completeSelectedTask);
  document.querySelector('#clearMessageButton').addEventListener('click', () => els.messageBox.value = '');
  document.querySelector('#saveButton').addEventListener('click', saveSystems);
  document.querySelector('#resetButton').addEventListener('click', newDay);
  els.speedSlider.addEventListener('input', () => {
    state.speed = Number(els.speedSlider.value);
    startLoop();
    persist();
  });
}

function render() {
  renderHud();
  renderEmployees();
  renderTaskOwners();
  renderKanban();
  renderSprites();
  renderRoutes();
  renderSelectedCard();
  renderLog();
  persist();
}

function renderHud() {
  els.cashStat.textContent = `Cash $${state.cash}`;
  els.repStat.textContent = `Rep ${state.reputation}`;
  els.dayStat.textContent = `Day ${state.day}`;
  els.boardSummary.textContent = `${state.tasks.filter(task => task.status !== 'done').length} active`;
  els.restSummary.textContent = `${state.employees.filter(employee => employee.status === 'resting').length} idle`;
}

function renderDesks() {
  els.deskLayer.innerHTML = zones.desks.map((desk, index) => `
    <div class="desk" style="left:${desk.x - 78}px;top:${desk.y - 62}px">
      <span>Desk ${index + 1}</span>
      <i></i>
    </div>
  `).join('');
}

function renderEmployees() {
  els.employeeList.innerHTML = state.employees.map(employee => `
    <button class="employee-card ${employee.id === state.selectedId ? 'active' : ''}" data-employee="${employee.id}" type="button">
      <span class="avatar-dot" style="--dot:${employee.color}"></span>
      <span class="employee-main">
        <strong>${employee.name}</strong>
        <small>${employee.role}</small>
        <progress max="100" value="${employee.energy}"></progress>
      </span>
      <span class="status-pill ${employee.status}">${labelStatus(employee.status)}</span>
    </button>
  `).join('');

  els.employeeList.querySelectorAll('[data-employee]').forEach(button => {
    button.addEventListener('click', () => selectEmployee(button.dataset.employee));
  });
}

function renderTaskOwners() {
  els.taskOwner.innerHTML = state.employees.map(employee => `<option value="${employee.id}">${employee.name}</option>`).join('');
  els.taskOwner.value = state.selectedId;
}

function renderKanban() {
  const columns = [
    { id: 'todo', label: 'To Do' },
    { id: 'doing', label: 'Doing' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'done', label: 'Done' }
  ];

  els.kanban.innerHTML = columns.map(column => `
    <div class="kanban-column">
      <h3>${column.label}</h3>
      ${state.tasks.filter(task => task.status === column.id).map(renderTaskCard).join('')}
    </div>
  `).join('');

  els.kanban.querySelectorAll('[data-task]').forEach(card => {
    card.addEventListener('click', () => {
      const task = state.tasks.find(item => item.id === Number(card.dataset.task));
      if (task) selectEmployee(task.owner);
    });
  });
}

function renderTaskCard(task) {
  const owner = getEmployee(task.owner);
  const repeat = task.repeat !== 'none' ? ` / ${task.repeat}` : '';
  const due = task.start ? ` / ${formatShortDate(task.start)}` : '';
  return `
    <button class="task-card ${task.priority.toLowerCase()}" type="button" data-task="${task.id}">
      <strong>${task.title}</strong>
      <small>${owner?.name || 'Unassigned'} / ${task.priority}${repeat}${due}</small>
      <span style="width:${task.progress}%"></span>
    </button>
  `;
}

function renderSprites() {
  els.spriteLayer.innerHTML = state.employees.map(employee => {
    const point = getPosition(employee);
    return `
      <button class="sprite ${employee.status} ${employee.id === state.selectedId ? 'selected' : ''}" type="button"
        data-sprite="${employee.id}" style="left:${point.x}px;top:${point.y}px;--agent:${employee.color}">
        <span class="head"></span><span class="body"></span><span class="legs"></span>
        <small>${employee.name}</small>
      </button>
    `;
  }).join('');

  els.spriteLayer.querySelectorAll('[data-sprite]').forEach(sprite => {
    sprite.addEventListener('click', () => selectEmployee(sprite.dataset.sprite));
  });
}

function renderRoutes() {
  els.routeLayer.innerHTML = state.employees.filter(employee => employee.status !== 'resting').map(employee => {
    const from = zones.desks[employee.desk % zones.desks.length];
    const to = getPosition(employee);
    const left = Math.min(from.x, to.x);
    const top = Math.min(from.y, to.y);
    const width = Math.abs(from.x - to.x) || 2;
    const height = Math.abs(from.y - to.y) || 2;
    return `<span class="route" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px"></span>`;
  }).join('');
}

function renderSelectedCard() {
  const employee = getSelected();
  const activeTask = getActiveTask(employee.id);
  els.selectedCard.innerHTML = `
    <strong>${employee.name}</strong>
    <span>${employee.role} / ${employee.specialty}</span>
    <small>${labelStatus(employee.status)} / Energy ${employee.energy}% / ${activeTask?.title || 'No active task'}</small>
  `;
}

function renderCandidates() {
  els.candidateSelect.innerHTML = candidates.map((candidate, index) => `
    <option value="${index}">${candidate.name} - ${candidate.role} ($${candidate.salary})</option>
  `).join('');
}

function renderLog() {
  els.officeLog.innerHTML = state.log.slice(0, 40).map(entry => `
    <div class="log-entry"><strong>${entry.time}</strong> ${entry.message}</div>
  `).join('');
}

function createTask(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const owner = form.get('owner');
  const title = form.get('title').trim();
  const repeat = form.get('repeat');
  const priority = form.get('priority');
  const start = form.get('start');
  if (!title) return;

  const status = start && new Date(start) > new Date() ? 'todo' : 'doing';
  const task = makeTask(state.nextTaskId++, title, owner, status, priority, repeat, start);
  state.tasks.push(task);
  assignTask(owner, task);
  log(`${getEmployee(owner).name} posted task board update: ${title}.`);
  render();
}

function assignTask(ownerId, task) {
  const employee = getEmployee(ownerId);
  if (!employee) return;
  employee.task = task.title;
  employee.status = task.status === 'todo' ? 'board' : 'working';
  employee.target = task.status === 'todo' ? 'board' : 'desk';
}

function hireAgent() {
  const candidate = candidates[Number(els.candidateSelect.value)];
  const isTemp = els.tempHire.checked;
  const cost = isTemp ? Math.floor(candidate.salary / 2) : candidate.salary;
  if (state.cash < cost) {
    log(`Secretary declined hire: not enough cash for ${candidate.name}.`);
    return;
  }

  const id = slug(candidate.name) + '-' + state.nextEmployeeId++;
  const employee = makeEmployee(id, candidate, state.employees.length % zones.desks.length, isTemp, 'portal', '');
  state.cash -= cost;
  state.employees.push(employee);
  state.selectedId = id;
  els.hireDialog.close();
  log(`Secretary hired ${employee.name}${isTemp ? ' as a temporary agent' : ''} from the portal.`);
  pulse(zones.portal.x, zones.portal.y, 'hire');
  render();
  setTimeout(() => {
    employee.status = 'resting';
    employee.target = 'rest';
    log(`${employee.name} has no task and moved to the rest area.`);
    render();
  }, 900);
}

function callSelected() {
  const employee = getSelected();
  employee.status = 'calling';
  employee.target = 'mail';
  employee.energy = clamp(employee.energy - 4, 0, 100);
  const endpoint = state.systems.voiceEndpoint || 'local Azure Voice Live hook';
  log(`Voice call started with ${employee.name} through ${endpoint}.`);
  pulse(zones.mail.x, zones.mail.y, 'call');
  render();
  setTimeout(() => {
    log(`${employee.name}: ${statusLine(employee)}`);
    employee.status = employee.task ? 'working' : 'resting';
    employee.target = employee.task ? 'desk' : 'rest';
    render();
  }, 1800);
}

function emailSelected() {
  const employee = getSelected();
  const body = els.messageBox.value.trim() || 'Please send a status update and next action.';
  state.mail.unshift({ to: employee.id, body, time: nowTime() });
  log(`Email sent to ${employee.name}: ${body}`);
  els.messageBox.value = '';
  employee.status = employee.task ? 'working' : 'resting';
  render();
}

function adjustSelectedTask() {
  const employee = getSelected();
  let task = getActiveTask(employee.id);
  if (!task) {
    task = makeTask(state.nextTaskId++, 'Boss follow-up', employee.id, 'doing', 'High', 'none', '');
    state.tasks.push(task);
  }
  const note = els.messageBox.value.trim() || 'Priority and context adjusted by boss.';
  task.priority = 'High';
  task.status = 'doing';
  employee.task = task.title;
  employee.status = 'board';
  employee.target = 'board';
  log(`${employee.name} updated the task board after boss adjustment: ${note}`);
  els.messageBox.value = '';
  render();
  setTimeout(() => {
    employee.status = 'working';
    employee.target = 'desk';
    render();
  }, 1000);
}

function outsourceSelected() {
  const employee = getSelected();
  employee.status = 'outsourcing';
  employee.target = 'outsource';
  employee.energy = clamp(employee.energy - 6, 0, 100);
  log(`${employee.name} requested Gemini / ChatGPT assistance at the outsource service desk.`);
  pulse(zones.outsource.x, zones.outsource.y, 'tool');
  render();
}

function completeSelectedTask() {
  const employee = getSelected();
  const task = getActiveTask(employee.id);
  if (!task) {
    log(`${employee.name} has no active task to complete.`);
    return;
  }
  completeTask(task, employee);
  render();
}

function secretarySetup() {
  const idle = state.employees.filter(employee => !getActiveTask(employee.id));
  idle.forEach(employee => {
    employee.status = 'resting';
    employee.target = 'rest';
  });
  state.reputation += 1;
  log(`Secretary refreshed the office: ${idle.length} idle agents moved to rest, systems checked.`);
  pulse(zones.secretary.x, zones.secretary.y, 'setup');
  render();
}

function saveSystems() {
  state.systems.voiceEndpoint = els.voiceEndpoint.value.trim();
  state.systems.emailWorkspace = els.emailWorkspace.value.trim();
  log('System settings saved for voice and mail routing.');
  render();
}

function newDay() {
  state.day += 1;
  state.cash -= state.employees.reduce((sum, employee) => sum + Math.floor(employee.salary / 8), 0);
  state.employees.forEach(employee => {
    employee.energy = 100;
    if (!getActiveTask(employee.id)) {
      employee.status = 'resting';
      employee.target = 'rest';
    }
  });
  state.tasks.filter(task => task.repeat !== 'none' && task.status === 'done').forEach(task => {
    state.tasks.push(makeTask(state.nextTaskId++, task.title, task.owner, 'todo', task.priority, task.repeat, ''));
  });
  log(`Day ${state.day} started. Recurring tasks refreshed and staff energy restored.`);
  render();
}

function simulationTick() {
  const now = new Date();
  state.tasks.forEach(task => {
    if (task.status === 'todo' && task.start && new Date(task.start) <= now) {
      task.status = 'doing';
      assignTask(task.owner, task);
      log(`${getEmployee(task.owner).name} started scheduled task: ${task.title}.`);
    }
  });

  state.employees.forEach(employee => {
    const task = getActiveTask(employee.id);
    if (!task) {
      if (employee.status !== 'calling' && employee.status !== 'portal') {
        employee.status = employee.energy < 95 ? 'resting' : 'resting';
        employee.target = 'rest';
        employee.energy = clamp(employee.energy + 3, 0, 100);
      }
      return;
    }

    if (employee.status === 'working') {
      const focus = employee.specialty === 'implementation' || employee.specialty === 'review' ? 7 : 5;
      task.progress = clamp(task.progress + focus + state.speed, 0, 100);
      employee.energy = clamp(employee.energy - 2, 0, 100);
      if (employee.energy < 18) {
        employee.status = 'resting';
        employee.target = 'rest';
        log(`${employee.name} got tired and went to the rest area.`);
      }
      if (task.progress >= 100) completeTask(task, employee);
    }

    if (employee.status === 'outsourcing') {
      task.progress = clamp(task.progress + 12, 0, 100);
      if (task.progress >= 70) {
        employee.status = 'working';
        employee.target = 'desk';
        log(`${employee.name} returned from the service desk with external tool output.`);
      }
    }
  });

  render();
}

function completeTask(task, employee) {
  task.status = 'done';
  task.progress = 100;
  employee.task = '';
  employee.status = 'board';
  employee.target = 'board';
  const reward = task.priority === 'Critical' ? 420 : task.priority === 'High' ? 260 : 160;
  state.cash += reward;
  state.reputation += task.priority === 'Critical' ? 4 : 2;
  log(`${employee.name} completed ${task.title} and updated the task board. +$${reward}`);
  setTimeout(() => {
    if (!getActiveTask(employee.id)) {
      employee.status = 'resting';
      employee.target = 'rest';
      render();
    }
  }, 1100);
}

function startLoop() {
  clearInterval(tickHandle);
  tickHandle = setInterval(simulationTick, 5200 - (state.speed * 700));
}

function activateTab(name) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelector(`#${name}Panel`).classList.add('active');
}

function selectEmployee(id) {
  state.selectedId = id;
  render();
}

function getSelected() {
  return getEmployee(state.selectedId) || state.employees[0];
}

function getEmployee(id) {
  return state.employees.find(employee => employee.id === id);
}

function getActiveTask(ownerId) {
  return state.tasks.find(task => task.owner === ownerId && task.status !== 'done');
}

function getPosition(employee) {
  if (employee.status === 'resting') return jitter(zones.rest, employee.desk);
  if (employee.status === 'outsourcing') return jitter(zones.outsource, employee.desk);
  if (employee.status === 'board') return jitter(zones.board, employee.desk);
  if (employee.status === 'portal') return jitter(zones.portal, employee.desk);
  if (employee.status === 'calling') return jitter(zones.mail, employee.desk);
  return jitter(zones.desks[employee.desk % zones.desks.length], employee.desk);
}

function jitter(point, seed) {
  return { x: point.x + ((seed % 3) - 1) * 18, y: point.y + (seed % 2) * 14 };
}

function statusLine(employee) {
  const task = getActiveTask(employee.id);
  if (!task) return 'No active task. I will stay in the rest area until assigned.';
  return `${task.title} is ${task.progress}% complete, priority ${task.priority}.`;
}

function pulse(x, y, type) {
  const fx = document.createElement('span');
  fx.className = `pulse ${type}`;
  fx.style.left = `${x}px`;
  fx.style.top = `${y}px`;
  els.fxLayer.appendChild(fx);
  setTimeout(() => fx.remove(), 900);
}

function makeEmployee(id, candidate, desk, temp, status, task) {
  return {
    id,
    name: candidate.name,
    role: candidate.role,
    specialty: candidate.specialty,
    salary: candidate.salary,
    sprite: candidate.sprite,
    color: candidate.color,
    desk,
    temp,
    status,
    target: status,
    task,
    energy: temp ? 82 : 100
  };
}

function makeTask(id, title, owner, status, priority, repeat, start) {
  return { id, title, owner, status, priority, repeat, start, progress: status === 'done' ? 100 : 0 };
}

function labelStatus(status) {
  return {
    working: 'Working',
    resting: 'Resting',
    calling: 'Calling',
    outsourcing: 'Tools',
    board: 'Board',
    portal: 'Portal'
  }[status] || status;
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function nowTime() {
  return new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
}

function log(message, shouldRender = true) {
  state.log.unshift({ time: nowTime(), message });
  state.log = state.log.slice(0, 60);
  if (shouldRender) render();
}

function hydrateSystemFields() {
  els.voiceEndpoint.value = state.systems.voiceEndpoint;
  els.emailWorkspace.value = state.systems.emailWorkspace;
  els.speedSlider.value = state.speed;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaultState);
  }
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
