const STORAGE_KEY = 'agent-os-office-rpg-v3';

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

const propLayers = [
  { id: 'task-board', label: 'Task Board', x: 28, y: 214, w: 252, h: 162, solid: true },
  { id: 'agent-portal', label: 'Agent Portal', x: 768, y: 220, w: 174, h: 126, solid: true },
  { id: 'service-desk', label: 'Service Desk', x: 724, y: 478, w: 184, h: 124, solid: true },
  { id: 'secretary-station', label: 'Secretary', x: 52, y: 420, w: 194, h: 116, solid: true },
  { id: 'rest-area', label: 'Rest Area', x: 34, y: 572, w: 260, h: 112, solid: false },
  { id: 'desk-1', label: 'Desk 1', x: 352, y: 274, w: 156, h: 124, solid: true },
  { id: 'desk-2', label: 'Desk 2', x: 562, y: 274, w: 156, h: 124, solid: true },
  { id: 'desk-3', label: 'Desk 3', x: 352, y: 462, w: 156, h: 124, solid: true },
  { id: 'desk-4', label: 'Desk 4', x: 562, y: 462, w: 156, h: 124, solid: true },
  { id: 'desk-5', label: 'Desk 5', x: 694, y: 332, w: 156, h: 124, solid: true },
  { id: 'desk-6', label: 'Desk 6', x: 218, y: 466, w: 156, h: 124, solid: true }
];

const collisionRects = propLayers
  .filter(layer => layer.solid)
  .map(layer => ({ x: layer.x + 10, y: layer.y + 18, w: layer.w - 20, h: layer.h - 22 }));

const spriteAtlas = {
  codex: { row: 0 },
  hermes: { row: 1 },
  claude: { row: 2 },
  openclaw: { row: 3 },
  temp: { row: 4 }
};

const walkGrid = {
  size: 48,
  cols: 20,
  rows: 15
};

const candidates = [
  { name: 'Codex', role: 'Coding agent', specialty: 'implementation', salary: 120, sprite: 'codex', color: '#64d2a6' },
  { name: 'Hermes', role: 'Ops messenger', specialty: 'coordination', salary: 95, sprite: 'hermes', color: '#ffcf66' },
  { name: 'Claude Code', role: 'Reviewer', specialty: 'review', salary: 115, sprite: 'claude', color: '#9fb7ff' },
  { name: 'Open Claw', role: 'Tool runner', specialty: 'outsourcing', salary: 100, sprite: 'openclaw', color: '#ff8a7a' },
  { name: 'Nova Temp', role: 'Research temp', specialty: 'research', salary: 55, sprite: 'temp', color: '#dda6ff' },
  { name: 'Qwen Analyst', role: 'Data temp', specialty: 'analysis', salary: 60, sprite: 'temp', color: '#68d8ff' },
  { name: 'Sage Architect', role: 'System planner', specialty: 'architecture', salary: 130, sprite: 'temp', color: '#a8e06e' },
  { name: 'Atlas Clerk', role: 'Task board temp', specialty: 'coordination', salary: 58, sprite: 'temp', color: '#f2a86b' },
  { name: 'Mira QA', role: 'Quality temp', specialty: 'review', salary: 62, sprite: 'temp', color: '#f084b9' }
];

const taskSeeds = [
  'Draft boss briefing',
  'Patch agent portal flow',
  'Summarize vendor output',
  'Refine office animation pass',
  'Prepare standup notes',
  'Audit task board state',
  'Prototype Azure voice handoff',
  'Clean inbox requests'
];

const thoughtBank = {
  working: ['Shipping a slice', 'Checking context', 'Running tests', 'Tightening scope', 'Almost there'],
  resting: ['Recharging focus', 'Waiting for task', 'Coffee then clarity', 'Idle but ready', 'Battery up'],
  calling: ['On voice with boss', 'Clarifying ask', 'Taking notes', 'Confirming priority'],
  outsourcing: ['Calling tools', 'Asking Gemini', 'Checking ChatGPT', 'Fetching outside help'],
  board: ['Updating board', 'Moving task card', 'Posting progress', 'Syncing status'],
  portal: ['Entering portal', 'Temp onboarding', 'New contract ready']
};

const defaultState = {
  cash: 4200,
  reputation: 42,
  day: 1,
  speed: 3,
  selectedId: 'codex',
  nextTaskId: 7,
  nextEmployeeId: 7,
  beat: 0,
  systems: {
    voiceEndpoint: '',
    emailWorkspace: ''
  },
  employees: [
    makeEmployee('codex', candidates[0], 0, false, 'working', 'Build office RPG core', 'Shipping a slice'),
    makeEmployee('hermes', candidates[1], 1, false, 'board', 'Daily agent standup', 'Syncing status'),
    makeEmployee('claude', candidates[2], 2, false, 'working', 'Review management loop', 'Checking context'),
    makeEmployee('openclaw', candidates[3], 3, false, 'outsourcing', 'Call external tool desk', 'Calling tools'),
    makeEmployee('nova-temp-5', candidates[4], 4, true, 'portal', '', 'Temp onboarding'),
    makeEmployee('qwen-analyst-6', candidates[5], 5, true, 'resting', '', 'Waiting for task')
  ],
  tasks: [
    makeTask(1, 'Build office RPG core', 'codex', 'doing', 'High', 'none', '', 38),
    makeTask(2, 'Review management loop', 'claude', 'doing', 'Normal', 'weekly', '', 22),
    makeTask(3, 'Daily agent standup', 'hermes', 'todo', 'Normal', 'daily', '', 0),
    makeTask(4, 'Call external tool desk', 'openclaw', 'doing', 'Normal', 'none', '', 54),
    makeTask(5, 'Prototype voice call hook', 'nova-temp-5', 'todo', 'High', 'none', '', 0),
    makeTask(6, 'Build status bubble demo', 'qwen-analyst-6', 'doing', 'Normal', 'none', '', 16)
  ],
  mail: [],
  log: []
};

let state = normalizeState(loadState());
let tickHandle;

const els = {
  cashStat: document.querySelector('#cashStat'),
  repStat: document.querySelector('#repStat'),
  dayStat: document.querySelector('#dayStat'),
  boardSummary: document.querySelector('#boardSummary'),
  restSummary: document.querySelector('#restSummary'),
  propLayer: document.querySelector('#propLayer'),
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
  speedSlider: document.querySelector('#speedSlider'),
  demoBeatButton: document.querySelector('#demoBeatButton')
};

init();

function init() {
  renderProps();
  renderCandidates();
  hydrateSystemFields();
  wireEvents();
  log('Secretary initialized the dynamic mockup: scene zones, animated agents, state bubbles, and task routing are online.', false);
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
    pulse(zones.portal.x, zones.portal.y, 'hire');
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
  if (els.demoBeatButton) els.demoBeatButton.addEventListener('click', demoBeat);
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

function renderProps() {
  els.propLayer.innerHTML = propLayers.map(layer => `
    <img class="prop prop-${layer.id}" src="assets/layers/${layer.id}.png" alt="${escapeHtml(layer.label)}"
      style="left:${layer.x}px;top:${layer.y}px;width:${layer.w}px;height:${layer.h}px" />
  `).join('');
}

function renderEmployees() {
  els.employeeList.innerHTML = state.employees.map(employee => `
    <button class="employee-card ${employee.id === state.selectedId ? 'active' : ''}" data-employee="${escapeHtml(employee.id)}" type="button">
      <span class="avatar-dot" style="--dot:${employee.color}"></span>
      <span class="employee-main">
        <strong>${escapeHtml(employee.name)}</strong>
        <small>${escapeHtml(employee.role)} / ${escapeHtml(employee.thought)}</small>
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
  els.taskOwner.innerHTML = state.employees.map(employee => `<option value="${escapeHtml(employee.id)}">${escapeHtml(employee.name)}</option>`).join('');
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
      <strong>${escapeHtml(task.title)}</strong>
      <small>${escapeHtml(owner?.name || 'Unassigned')} / ${task.priority}${repeat}${due}</small>
      <span style="width:${task.progress}%"></span>
    </button>
  `;
}

function renderSprites() {
  els.spriteLayer.innerHTML = state.employees.map(employee => {
    const point = getPosition(employee);
    const atlas = spriteAtlas[employee.sprite] || spriteAtlas.temp;
    const frame = spriteFrame(employee);
    return `
      <button class="sprite ${employee.status} ${employee.id === state.selectedId ? 'selected' : ''}" type="button"
        data-sprite="${escapeHtml(employee.id)}" style="left:${point.x}px;top:${point.y}px;--agent:${employee.color};--sprite-x:${frame * -48}px;--sprite-y:${atlas.row * -64}px;--sprite-next-x:${((frame + 1) % 3) * -48}px">
        <span class="thought-bubble">${escapeHtml(employee.thought)}</span>
        <span class="status-icon">${statusIcon(employee.status)}</span>
        <span class="sprite-shadow"></span>
        <span class="sprite-frame"></span>
        <small>${escapeHtml(employee.name)}</small>
      </button>
    `;
  }).join('');

  els.spriteLayer.querySelectorAll('[data-sprite]').forEach(sprite => {
    sprite.addEventListener('click', () => {
      selectEmployee(sprite.dataset.sprite);
      const employee = getEmployee(sprite.dataset.sprite);
      if (employee) thought(employee, statusLine(employee));
    });
  });
}

function renderRoutes() {
  els.routeLayer.innerHTML = state.employees.filter(employee => employee.status !== 'resting').flatMap(employee => {
    const from = zones.desks[employee.desk % zones.desks.length];
    const to = getPosition(employee);
    const points = findRoute(from, to, employee.id);
    return points.slice(1).map((point, index) => renderRouteSegment(points[index], point, employee.status));
  }).join('');
}

function renderSelectedCard() {
  const employee = getSelected();
  const activeTask = getActiveTask(employee.id);
  els.selectedCard.innerHTML = `
    <strong>${escapeHtml(employee.name)}</strong>
    <span>${escapeHtml(employee.role)} / ${escapeHtml(employee.specialty)}</span>
    <small>${labelStatus(employee.status)} / Energy ${employee.energy}% / ${escapeHtml(activeTask?.title || 'No active task')}</small>
    <small>${escapeHtml(employee.thought)}</small>
  `;
}

function renderCandidates() {
  els.candidateSelect.innerHTML = candidates.map((candidate, index) => `
    <option value="${index}">${escapeHtml(candidate.name)} - ${escapeHtml(candidate.role)} ($${candidate.salary})</option>
  `).join('');
}

function renderLog() {
  els.officeLog.innerHTML = state.log.slice(0, 40).map(entry => `
    <div class="log-entry"><strong>${escapeHtml(entry.time)}</strong> ${escapeHtml(entry.message)}</div>
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
  const task = makeTask(state.nextTaskId++, title, owner, status, priority, repeat, start, 0);
  state.tasks.push(task);
  assignTask(owner, task);
  log(`${getEmployee(owner).name} posted task board update: ${title}.`);
  pulse(zones.board.x, zones.board.y, 'board');
  render();
}

function assignTask(ownerId, task) {
  const employee = getEmployee(ownerId);
  if (!employee) return;
  employee.task = task.title;
  employee.status = task.status === 'todo' ? 'board' : 'working';
  employee.target = task.status === 'todo' ? 'board' : 'desk';
  thought(employee, task.status === 'todo' ? 'Posting progress' : pick(thoughtBank.working));
}

function hireAgent() {
  const candidate = candidates[Number(els.candidateSelect.value)];
  const isTemp = els.tempHire.checked;
  const cost = isTemp ? Math.floor(candidate.salary / 2) : candidate.salary;
  if (state.cash < cost) {
    log(`Secretary declined hire: not enough cash for ${candidate.name}.`);
    return;
  }

  const id = `${slug(candidate.name)}-${state.nextEmployeeId++}`;
  const employee = makeEmployee(id, candidate, state.employees.length % zones.desks.length, isTemp, 'portal', '', 'Temp onboarding');
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
    thought(employee, 'Waiting for task');
    log(`${employee.name} has no task and moved to the rest area.`);
    render();
  }, 900);
}

function callSelected() {
  const employee = getSelected();
  employee.status = 'calling';
  employee.target = 'mail';
  employee.energy = clamp(employee.energy - 4, 0, 100);
  thought(employee, 'On voice with boss');
  const endpoint = state.systems.voiceEndpoint || 'local Azure Voice Live hook';
  log(`Voice call started with ${employee.name} through ${endpoint}.`);
  pulse(zones.mail.x, zones.mail.y, 'call');
  render();
  setTimeout(() => {
    thought(employee, statusLine(employee));
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
  thought(employee, 'Inbox updated');
  log(`Email sent to ${employee.name}: ${body}`);
  els.messageBox.value = '';
  employee.status = employee.task ? 'working' : 'resting';
  render();
}

function adjustSelectedTask() {
  const employee = getSelected();
  let task = getActiveTask(employee.id);
  if (!task) {
    task = makeTask(state.nextTaskId++, 'Boss follow-up', employee.id, 'doing', 'High', 'none', '', 0);
    state.tasks.push(task);
  }
  const note = els.messageBox.value.trim() || 'Priority and context adjusted by boss.';
  task.priority = 'High';
  task.status = 'doing';
  employee.task = task.title;
  employee.status = 'board';
  employee.target = 'board';
  thought(employee, 'Updating board');
  log(`${employee.name} updated the task board after boss adjustment: ${note}`);
  els.messageBox.value = '';
  pulse(zones.board.x, zones.board.y, 'board');
  render();
  setTimeout(() => {
    employee.status = 'working';
    employee.target = 'desk';
    thought(employee, 'New plan locked');
    render();
  }, 1000);
}

function outsourceSelected() {
  const employee = getSelected();
  employee.status = 'outsourcing';
  employee.target = 'outsource';
  employee.energy = clamp(employee.energy - 6, 0, 100);
  thought(employee, pick(thoughtBank.outsourcing));
  log(`${employee.name} requested Gemini / ChatGPT assistance at the outsource service desk.`);
  pulse(zones.outsource.x, zones.outsource.y, 'tool');
  render();
}

function completeSelectedTask() {
  const employee = getSelected();
  const task = getActiveTask(employee.id);
  if (!task) {
    thought(employee, 'No active task');
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
    thought(employee, 'Waiting for task');
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
      thought(employee, 'Fresh day ready');
    }
  });
  state.tasks.filter(task => task.repeat !== 'none' && task.status === 'done').forEach(task => {
    state.tasks.push(makeTask(state.nextTaskId++, task.title, task.owner, 'todo', task.priority, task.repeat, '', 0));
  });
  log(`Day ${state.day} started. Recurring tasks refreshed and staff energy restored.`);
  render();
}

function demoBeat() {
  state.beat += 1;
  ensureDemoTasks();
  state.employees.forEach((employee, index) => {
    const activeTask = getActiveTask(employee.id);
    const cycle = ['working', 'board', 'outsourcing', 'calling', 'resting', 'working'];
    const nextStatus = activeTask ? cycle[(state.beat + index) % cycle.length] : (index % 2 ? 'resting' : 'portal');
    employee.status = nextStatus;
    employee.target = targetForStatus(nextStatus);
    employee.energy = clamp(employee.energy + (nextStatus === 'resting' ? 8 : -3), 8, 100);
    thought(employee, pick(thoughtBank[nextStatus] || thoughtBank.working));
  });
  log(`Demo beat ${state.beat}: randomized agent states into an animated office scene.`);
  pulse(zones.board.x, zones.board.y, 'board');
  pulse(zones.portal.x, zones.portal.y, 'hire');
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
        employee.status = 'resting';
        employee.target = 'rest';
        employee.energy = clamp(employee.energy + 3, 0, 100);
        if (Math.random() < 0.35) thought(employee, pick(thoughtBank.resting));
      }
      return;
    }

    randomAgentMoment(employee, task);

    if (employee.status === 'working') {
      const focus = employee.specialty === 'implementation' || employee.specialty === 'review' ? 7 : 5;
      task.progress = clamp(task.progress + focus + state.speed, 0, 100);
      employee.energy = clamp(employee.energy - 2, 0, 100);
      if (Math.random() < 0.4) thought(employee, pick(thoughtBank.working));
      if (employee.energy < 18) {
        employee.status = 'resting';
        employee.target = 'rest';
        thought(employee, 'Need recharge');
        log(`${employee.name} got tired and went to the rest area.`);
      }
      if (task.progress >= 100) completeTask(task, employee);
    }

    if (employee.status === 'outsourcing') {
      task.progress = clamp(task.progress + 12, 0, 100);
      if (Math.random() < 0.5) thought(employee, pick(thoughtBank.outsourcing));
      if (task.progress >= 70) {
        employee.status = 'working';
        employee.target = 'desk';
        thought(employee, 'Tool output ready');
        log(`${employee.name} returned from the service desk with external tool output.`);
      }
    }
  });

  render();
}

function randomAgentMoment(employee, task) {
  if (employee.status === 'calling' || employee.status === 'portal') return;
  const roll = Math.random();
  if (roll < 0.08) {
    employee.status = 'board';
    employee.target = 'board';
    task.status = task.status === 'done' ? 'done' : 'doing';
    thought(employee, pick(thoughtBank.board));
  } else if (roll < 0.15 && employee.energy > 25) {
    employee.status = 'outsourcing';
    employee.target = 'outsource';
    thought(employee, pick(thoughtBank.outsourcing));
  } else if (roll < 0.22 && employee.energy > 35) {
    employee.status = 'calling';
    employee.target = 'mail';
    thought(employee, pick(thoughtBank.calling));
    setTimeout(() => {
      if (employee.status === 'calling') {
        employee.status = 'working';
        employee.target = 'desk';
        thought(employee, 'Call notes applied');
        render();
      }
    }, 1200);
  } else if (employee.status === 'board') {
    employee.status = 'working';
    employee.target = 'desk';
  }
}

function completeTask(task, employee) {
  task.status = 'done';
  task.progress = 100;
  employee.task = '';
  employee.status = 'board';
  employee.target = 'board';
  thought(employee, 'Done, updating board');
  const reward = task.priority === 'Critical' ? 420 : task.priority === 'High' ? 260 : 160;
  state.cash += reward;
  state.reputation += task.priority === 'Critical' ? 4 : 2;
  log(`${employee.name} completed ${task.title} and updated the task board. +$${reward}`);
  pulse(zones.board.x, zones.board.y, 'board');
  setTimeout(() => {
    if (!getActiveTask(employee.id)) {
      employee.status = 'resting';
      employee.target = 'rest';
      thought(employee, 'Waiting for next task');
      render();
    }
  }, 1100);
}

function ensureDemoTasks() {
  state.employees.forEach(employee => {
    if (getActiveTask(employee.id)) return;
    const title = pick(taskSeeds);
    const task = makeTask(state.nextTaskId++, title, employee.id, 'doing', pick(['Normal', 'High']), 'none', '', Math.floor(Math.random() * 35));
    state.tasks.push(task);
    employee.task = title;
  });
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
  const queueSeed = queueIndex(employee);
  if (employee.status === 'resting') return queuePoint(zones.rest, queueSeed, 44, 24);
  if (employee.status === 'outsourcing') return queuePoint(zones.outsource, queueSeed, 42, 30);
  if (employee.status === 'board') return queuePoint(zones.board, queueSeed, 60, 28);
  if (employee.status === 'portal') return queuePoint(zones.portal, queueSeed, 38, 26);
  if (employee.status === 'calling') return queuePoint(zones.mail, queueSeed, 42, 24);
  return queuePoint(zones.desks[employee.desk % zones.desks.length], queueSeed, 36, 28);
}

function queuePoint(point, seed, gapX, gapY) {
  const lane = seed % 4;
  const row = Math.floor(seed / 4) % 2;
  return {
    x: point.x + (lane - 1.5) * gapX,
    y: point.y + row * gapY
  };
}

function queueIndex(employee) {
  const target = targetForStatus(employee.status);
  const peers = state.employees.filter(item => targetForStatus(item.status) === target);
  return Math.max(0, peers.findIndex(item => item.id === employee.id));
}

function findRoute(from, to, employeeId) {
  const start = nearestOpenCell(from);
  const goal = nearestOpenCell(to);
  const key = cellKey(start);
  const queue = [start];
  const cameFrom = new Map([[key, null]]);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length) {
    const current = queue.shift();
    if (current.x === goal.x && current.y === goal.y) break;
    for (const [dx, dy] of dirs) {
      const next = { x: current.x + dx, y: current.y + dy };
      const nextKey = cellKey(next);
      if (cameFrom.has(nextKey) || isBlockedCell(next, employeeId)) continue;
      cameFrom.set(nextKey, current);
      queue.push(next);
    }
  }

  if (!cameFrom.has(cellKey(goal))) return [from, to];
  const cells = [];
  let cursor = goal;
  while (cursor) {
    cells.unshift(cursor);
    cursor = cameFrom.get(cellKey(cursor));
  }
  return simplifyRoute([from, ...cells.map(cellCenter), to]);
}

function nearestOpenCell(point) {
  const base = pointToCell(point);
  if (!isBlockedCell(base)) return base;
  for (let radius = 1; radius < 5; radius += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        const cell = { x: base.x + x, y: base.y + y };
        if (!isBlockedCell(cell)) return cell;
      }
    }
  }
  return base;
}

function isBlockedCell(cell) {
  if (cell.x < 0 || cell.y < 0 || cell.x >= walkGrid.cols || cell.y >= walkGrid.rows) return true;
  const center = cellCenter(cell);
  return collisionRects.some(rect => pointInRect(center, rect));
}

function pointToCell(point) {
  return {
    x: clamp(Math.floor(point.x / walkGrid.size), 0, walkGrid.cols - 1),
    y: clamp(Math.floor(point.y / walkGrid.size), 0, walkGrid.rows - 1)
  };
}

function cellCenter(cell) {
  return {
    x: cell.x * walkGrid.size + walkGrid.size / 2,
    y: cell.y * walkGrid.size + walkGrid.size / 2
  };
}

function cellKey(cell) {
  return `${cell.x}:${cell.y}`;
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function simplifyRoute(points) {
  return points.filter((point, index) => {
    if (index === 0 || index === points.length - 1) return true;
    const prev = points[index - 1];
    const next = points[index + 1];
    return !((prev.x === point.x && point.x === next.x) || (prev.y === point.y && point.y === next.y));
  });
}

function renderRouteSegment(from, to, status) {
  const left = Math.min(from.x, to.x);
  const top = Math.min(from.y, to.y);
  const width = Math.max(2, Math.abs(from.x - to.x));
  const height = Math.max(2, Math.abs(from.y - to.y));
  return `<span class="route ${status}" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px"></span>`;
}

function spriteFrame(employee) {
  if (employee.status === 'resting') return 0;
  if (employee.status === 'calling') return 1;
  if (employee.status === 'board') return 2;
  return employee.energy % 2 ? 1 : 2;
}

function targetForStatus(status) {
  return {
    working: 'desk',
    resting: 'rest',
    calling: 'mail',
    outsourcing: 'outsource',
    board: 'board',
    portal: 'portal'
  }[status] || 'desk';
}

function statusLine(employee) {
  const task = getActiveTask(employee.id);
  if (!task) return 'No active task. I will stay in the rest area until assigned.';
  return `${task.title} is ${task.progress}% complete, priority ${task.priority}.`;
}

function statusIcon(status) {
  return {
    working: 'code',
    resting: 'zzz',
    calling: 'call',
    outsourcing: 'tool',
    board: 'plan',
    portal: 'new'
  }[status] || 'agent';
}

function thought(employee, message) {
  employee.thought = message;
  employee.thoughtTick = Date.now();
}

function pulse(x, y, type) {
  const fx = document.createElement('span');
  fx.className = `pulse ${type}`;
  fx.style.left = `${x}px`;
  fx.style.top = `${y}px`;
  els.fxLayer.appendChild(fx);
  setTimeout(() => fx.remove(), 900);
}

function makeEmployee(id, candidate, desk, temp, status, task, idea = '') {
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
    target: targetForStatus(status),
    task,
    thought: idea || pick(thoughtBank[status] || thoughtBank.working),
    thoughtTick: Date.now(),
    energy: temp ? 82 : 100
  };
}

function makeTask(id, title, owner, status, priority, repeat, start, progress = 0) {
  return { id, title, owner, status, priority, repeat, start, progress: status === 'done' ? 100 : progress };
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

function normalizeState(nextState) {
  nextState.employees = nextState.employees.map((employee, index) => ({
    ...employee,
    desk: Number.isFinite(employee.desk) ? employee.desk : index % zones.desks.length,
    color: employee.color || candidates[index % candidates.length].color,
    thought: employee.thought || pick(thoughtBank[employee.status] || thoughtBank.working),
    thoughtTick: employee.thoughtTick || Date.now(),
    target: employee.target || targetForStatus(employee.status)
  }));
  nextState.tasks = nextState.tasks.map(task => ({ ...task, progress: task.progress || 0 }));
  nextState.beat ||= 0;
  return nextState;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
