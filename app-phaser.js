const STORAGE_KEY = 'agent-os-phaser-rpg-v2';
const GAME_W = 960;
const GAME_H = 720;
const CELL = 48;

const zones = {
  desks: [
    { x: 430, y: 414 },
    { x: 640, y: 414 },
    { x: 430, y: 604 },
    { x: 640, y: 604 },
    { x: 872, y: 424 },
    { x: 296, y: 624 }
  ],
  board: { x: 316, y: 342 },
  rest: { x: 164, y: 610 },
  outsource: { x: 682, y: 552 },
  portal: { x: 722, y: 304 },
  secretary: { x: 284, y: 474 },
  mail: { x: 522, y: 222 }
};

const props = [
  { key: 'desk', frame: 0, x: 430, y: 336, w: 156, h: 124, solid: true },
  { key: 'desk', frame: 0, x: 640, y: 336, w: 156, h: 124, solid: true },
  { key: 'desk', frame: 0, x: 430, y: 524, w: 156, h: 124, solid: true },
  { key: 'desk', frame: 0, x: 640, y: 524, w: 156, h: 124, solid: true },
  { key: 'desk', frame: 0, x: 772, y: 394, w: 156, h: 124, solid: true },
  { key: 'desk', frame: 0, x: 296, y: 528, w: 156, h: 124, solid: true },
  { key: 'task-board', frame: 1, x: 154, y: 296, w: 252, h: 162, solid: true },
  { key: 'portal', frame: 2, x: 855, y: 284, w: 174, h: 126, solid: true },
  { key: 'service-desk', frame: 3, x: 816, y: 540, w: 184, h: 124, solid: true },
  { key: 'secretary', frame: 4, x: 149, y: 478, w: 194, h: 116, solid: true },
  { key: 'rest', frame: 5, x: 164, y: 628, w: 260, h: 112, solid: false },
  { key: 'plant', frame: 7, x: 72, y: 188, w: 72, h: 90, solid: true },
  { key: 'water', frame: 9, x: 900, y: 200, w: 64, h: 96, solid: true }
];

const candidates = [
  { id: 'codex', name: 'Codex', role: 'Coding agent', specialty: 'implementation', salary: 120, row: 0, color: '#64d2a6' },
  { id: 'hermes', name: 'Hermes', role: 'Ops messenger', specialty: 'coordination', salary: 95, row: 1, color: '#ffcf66' },
  { id: 'claude', name: 'Claude Code', role: 'Reviewer', specialty: 'review', salary: 115, row: 2, color: '#9fb7ff' },
  { id: 'openclaw', name: 'Open Claw', role: 'Tool runner', specialty: 'outsourcing', salary: 100, row: 3, color: '#ff8a7a' },
  { id: 'nova-temp', name: 'Nova Temp', role: 'Research temp', specialty: 'research', salary: 55, row: 5, color: '#dda6ff' },
  { id: 'qwen-analyst', name: 'Qwen Analyst', role: 'Data temp', specialty: 'analysis', salary: 60, row: 5, color: '#68d8ff' }
];

const statusThoughts = {
  working: ['Shipping code', 'Reading context', 'Testing patch', 'Writing notes'],
  board: ['Updating board', 'Moving task card', 'Syncing progress'],
  outsourcing: ['Calling tools', 'Asking Gemini', 'Checking ChatGPT'],
  calling: ['Voice call', 'Clarifying ask', 'Taking notes'],
  resting: ['Recharging', 'Waiting task', 'Coffee break'],
  portal: ['Portal check', 'Temp contract', 'Onboarding']
};

const initialState = {
  cash: 4200,
  reputation: 42,
  day: 1,
  speed: 3,
  selectedId: 'codex',
  nextTaskId: 7,
  nextEmployeeId: 7,
  beat: 0,
  systems: { voiceEndpoint: '', emailWorkspace: '' },
  employees: [
    makeEmployee('codex', candidates[0], 0, false, 'working', 'Build office RPG core'),
    makeEmployee('hermes', candidates[1], 1, false, 'board', 'Daily agent standup'),
    makeEmployee('claude', candidates[2], 2, false, 'working', 'Review management loop'),
    makeEmployee('openclaw', candidates[3], 3, false, 'outsourcing', 'Call external tool desk'),
    makeEmployee('nova-temp-5', candidates[4], 4, true, 'portal', ''),
    makeEmployee('qwen-analyst-6', candidates[5], 5, true, 'resting', '')
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

let state = normalize(loadState());
let gameScene;
let tickHandle;

const els = {
  cashStat: document.querySelector('#cashStat'),
  repStat: document.querySelector('#repStat'),
  dayStat: document.querySelector('#dayStat'),
  boardSummary: document.querySelector('#boardSummary'),
  restSummary: document.querySelector('#restSummary'),
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

class OfficeScene extends Phaser.Scene {
  constructor() {
    super('office');
    this.agentSprites = new Map();
    this.routeGraphics = null;
    this.obstacles = props.filter(item => item.solid).map(item => ({ x: item.x - item.w / 2, y: item.y - item.h / 2, w: item.w, h: item.h }));
  }

  preload() {
    this.load.image('office-empty', 'assets/generated/phaser-empty-office.png');
    this.load.spritesheet('props', 'assets/generated/phaser-props-transparent.png', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('agents', 'assets/generated/phaser-agents-transparent.png', { frameWidth: 256, frameHeight: 256 });
  }

  create() {
    gameScene = this;
    this.add.image(GAME_W / 2, GAME_H / 2, 'office-empty').setDisplaySize(GAME_W, GAME_H);
    props.forEach(prop => {
      this.add.image(prop.x, prop.y, 'props', prop.frame).setOrigin(0.5, 0.86).setDisplaySize(prop.w, prop.h).setDepth(prop.y);
    });
    this.routeGraphics = this.add.graphics().setDepth(1000);
    state.employees.forEach(employee => this.createAgent(employee));
    this.syncAgents(true);
    renderConsole();
    startLoop();
  }

  createAgent(employee) {
    const container = this.add.container(0, 0).setDepth(2000);
    const shadow = this.add.ellipse(0, 26, 54, 16, 0x050a0f, 0.35);
    const sprite = this.add.sprite(0, 0, 'agents', employee.row * 4).setOrigin(0.5, 0.92).setDisplaySize(78, 78);
    const bubble = this.add.text(0, -76, employee.thought, {
      fontFamily: 'monospace', fontSize: '11px', color: '#122230', backgroundColor: '#f6fbff', padding: { x: 5, y: 3 }, align: 'center'
    }).setOrigin(0.5).setStroke('#102131', 2);
    const label = this.add.text(0, 44, employee.name, {
      fontFamily: 'monospace', fontSize: '10px', color: '#edf6ff', backgroundColor: 'rgba(13,20,28,.82)', padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    container.add([shadow, sprite, bubble, label]);
    container.setSize(78, 92).setInteractive({ useHandCursor: true }).on('pointerdown', () => selectEmployee(employee.id));
    this.agentSprites.set(employee.id, { container, sprite, bubble, route: [] });
  }

  syncAgents(immediate = false) {
    this.routeGraphics.clear();
    state.employees.forEach(employee => {
      if (!this.agentSprites.has(employee.id)) this.createAgent(employee);
      const actor = this.agentSprites.get(employee.id);
      const target = getPosition(employee);
      const current = immediate ? target : { x: actor.container.x, y: actor.container.y };
      const route = findRoute(current, target, this.obstacles);
      actor.route = route;
      actor.bubble.setText(employee.thought);
      actor.sprite.setFrame(employee.row * 4 + frameForStatus(employee.status));
      actor.container.setDepth(Math.floor(target.y) + 2000);
      actor.container.setAlpha(employee.status === 'resting' ? 0.78 : 1);
      if (immediate) {
        actor.container.setPosition(target.x, target.y);
      } else {
        this.tweens.killTweensOf(actor.container);
        this.moveAlong(actor, route, employee);
      }
      drawRoute(this.routeGraphics, route, employee.status);
    });
  }

  moveAlong(actor, route, employee) {
    if (route.length < 2) return;
    const tweens = route.slice(1).map(point => ({ x: point.x, y: point.y, duration: 260, ease: 'Sine.easeInOut' }));
    this.tweens.chain({
      targets: actor.container,
      tweens,
      onUpdate: () => actor.container.setDepth(Math.floor(actor.container.y) + 2000),
      onComplete: () => actor.sprite.setFrame(employee.row * 4 + frameForStatus(employee.status))
    });
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'gameCanvas',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#203442',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: OfficeScene
});

wireEvents();
renderConsole();

function wireEvents() {
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  document.querySelector('#taskForm').addEventListener('submit', createTask);
  document.querySelector('#hireButton').addEventListener('click', () => els.hireDialog.showModal());
  document.querySelector('#portalZone').addEventListener('click', () => { els.tempHire.checked = true; els.hireDialog.showModal(); });
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
  document.querySelector('#demoBeatButton').addEventListener('click', demoBeat);
  els.speedSlider.addEventListener('input', () => { state.speed = Number(els.speedSlider.value); startLoop(); persist(); });
}

function renderConsole() {
  els.cashStat.textContent = `Cash $${state.cash}`;
  els.repStat.textContent = `Rep ${state.reputation}`;
  els.dayStat.textContent = `Day ${state.day}`;
  document.querySelector('#boardSummary').textContent = `${state.tasks.filter(task => task.status !== 'done').length} active`;
  document.querySelector('#restSummary').textContent = `${state.employees.filter(employee => employee.status === 'resting').length} idle`;
  renderEmployees();
  renderTaskOwners();
  renderKanban();
  renderSelectedCard();
  renderLog();
  persist();
  if (gameScene) gameScene.syncAgents();
}

function renderEmployees() {
  els.employeeList.innerHTML = state.employees.map(employee => `
    <button class="employee-card ${employee.id === state.selectedId ? 'active' : ''}" data-employee="${escapeHtml(employee.id)}" type="button">
      <span class="avatar-dot" style="--dot:${employee.color}"></span>
      <span class="employee-main"><strong>${escapeHtml(employee.name)}</strong><small>${escapeHtml(employee.role)} / ${escapeHtml(employee.thought)}</small><progress max="100" value="${employee.energy}"></progress></span>
      <span class="status-pill ${employee.status}">${labelStatus(employee.status)}</span>
    </button>`).join('');
  els.employeeList.querySelectorAll('[data-employee]').forEach(button => button.addEventListener('click', () => selectEmployee(button.dataset.employee)));
}

function renderTaskOwners() {
  els.taskOwner.innerHTML = state.employees.map(employee => `<option value="${escapeHtml(employee.id)}">${escapeHtml(employee.name)}</option>`).join('');
  els.taskOwner.value = state.selectedId;
}

function renderKanban() {
  const columns = [
    { id: 'todo', label: 'To Do' }, { id: 'doing', label: 'Doing' }, { id: 'blocked', label: 'Blocked' }, { id: 'done', label: 'Done' }
  ];
  els.kanban.innerHTML = columns.map(column => `<div class="kanban-column"><h3>${column.label}</h3>${state.tasks.filter(task => task.status === column.id).map(renderTaskCard).join('')}</div>`).join('');
  els.kanban.querySelectorAll('[data-task]').forEach(card => card.addEventListener('click', () => {
    const task = state.tasks.find(item => item.id === Number(card.dataset.task));
    if (task) selectEmployee(task.owner);
  }));
}

function renderTaskCard(task) {
  const owner = getEmployee(task.owner);
  const repeat = task.repeat !== 'none' ? ` / ${task.repeat}` : '';
  const due = task.start ? ` / ${formatShortDate(task.start)}` : '';
  return `<button class="task-card ${task.priority.toLowerCase()}" type="button" data-task="${task.id}"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(owner?.name || 'Unassigned')} / ${task.priority}${repeat}${due}</small><span style="width:${task.progress}%"></span></button>`;
}

function renderSelectedCard() {
  const employee = getSelected();
  const activeTask = getActiveTask(employee.id);
  els.selectedCard.innerHTML = `<strong>${escapeHtml(employee.name)}</strong><span>${escapeHtml(employee.role)} / ${escapeHtml(employee.specialty)}</span><small>${labelStatus(employee.status)} / Energy ${employee.energy}% / ${escapeHtml(activeTask?.title || 'No active task')}</small><small>${escapeHtml(employee.thought)}</small>`;
}

function renderLog() {
  els.officeLog.innerHTML = state.log.slice(0, 40).map(entry => `<div class="log-entry"><strong>${escapeHtml(entry.time)}</strong> ${escapeHtml(entry.message)}</div>`).join('');
}

function createTask(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const owner = form.get('owner');
  const title = form.get('title').trim();
  if (!title) return;
  const start = form.get('start');
  const status = start && new Date(start) > new Date() ? 'todo' : 'doing';
  const task = makeTask(state.nextTaskId++, title, owner, status, form.get('priority'), form.get('repeat'), start, 0);
  state.tasks.push(task);
  assignTask(owner, task);
  log(`${getEmployee(owner).name} posted task board update: ${title}.`);
  renderConsole();
}

function assignTask(ownerId, task) {
  const employee = getEmployee(ownerId);
  if (!employee) return;
  employee.task = task.title;
  employee.status = task.status === 'todo' ? 'board' : 'working';
  employee.target = targetForStatus(employee.status);
  thought(employee, pick(statusThoughts[employee.status]));
}

function hireAgent() {
  const candidate = candidates[Number(els.candidateSelect.value)];
  const isTemp = els.tempHire.checked;
  const cost = isTemp ? Math.floor(candidate.salary / 2) : candidate.salary;
  if (state.cash < cost) return log(`Secretary declined hire: not enough cash for ${candidate.name}.`);
  const id = `${slug(candidate.name)}-${state.nextEmployeeId++}`;
  const employee = makeEmployee(id, candidate, state.employees.length % zones.desks.length, isTemp, 'portal', '');
  state.cash -= cost;
  state.employees.push(employee);
  state.selectedId = id;
  els.hireDialog.close();
  log(`Secretary hired ${employee.name}${isTemp ? ' as a temporary agent' : ''} from the portal.`);
  renderConsole();
}

function callSelected() {
  const employee = getSelected();
  employee.status = 'calling'; employee.target = 'mail'; employee.energy = clamp(employee.energy - 4, 0, 100); thought(employee, 'Voice call');
  log(`Voice call started with ${employee.name} through ${state.systems.voiceEndpoint || 'local Azure Voice Live hook'}.`);
  renderConsole();
}

function emailSelected() {
  const employee = getSelected();
  const body = els.messageBox.value.trim() || 'Please send a status update and next action.';
  state.mail.unshift({ to: employee.id, body, time: nowTime() });
  thought(employee, 'Inbox updated');
  log(`Email sent to ${employee.name}: ${body}`);
  els.messageBox.value = '';
  renderConsole();
}

function adjustSelectedTask() {
  const employee = getSelected();
  let task = getActiveTask(employee.id);
  if (!task) { task = makeTask(state.nextTaskId++, 'Boss follow-up', employee.id, 'doing', 'High', 'none', '', 0); state.tasks.push(task); }
  task.priority = 'High'; task.status = 'doing'; employee.task = task.title; employee.status = 'board'; employee.target = 'board'; thought(employee, 'Updating board');
  log(`${employee.name} updated the task board after boss adjustment.`);
  renderConsole();
}

function outsourceSelected() {
  const employee = getSelected();
  employee.status = 'outsourcing'; employee.target = 'outsource'; employee.energy = clamp(employee.energy - 6, 0, 100); thought(employee, pick(statusThoughts.outsourcing));
  log(`${employee.name} requested Gemini / ChatGPT assistance at the outsource service desk.`);
  renderConsole();
}

function completeSelectedTask() {
  const employee = getSelected();
  const task = getActiveTask(employee.id);
  if (!task) return log(`${employee.name} has no active task to complete.`);
  completeTask(task, employee);
  renderConsole();
}

function secretarySetup() {
  const idle = state.employees.filter(employee => !getActiveTask(employee.id));
  idle.forEach(employee => { employee.status = 'resting'; employee.target = 'rest'; thought(employee, 'Waiting task'); });
  state.reputation += 1;
  log(`Secretary refreshed the office: ${idle.length} idle agents moved to rest, systems checked.`);
  renderConsole();
}

function saveSystems() {
  state.systems.voiceEndpoint = els.voiceEndpoint.value.trim();
  state.systems.emailWorkspace = els.emailWorkspace.value.trim();
  log('System settings saved for voice and mail routing.');
  renderConsole();
}

function newDay() {
  state.day += 1;
  state.cash -= state.employees.reduce((sum, employee) => sum + Math.floor(employee.salary / 8), 0);
  state.employees.forEach(employee => { employee.energy = 100; if (!getActiveTask(employee.id)) { employee.status = 'resting'; employee.target = 'rest'; thought(employee, 'Fresh day'); } });
  log(`Day ${state.day} started. Recurring tasks refreshed and staff energy restored.`);
  renderConsole();
}

function demoBeat() {
  state.beat += 1;
  ensureDemoTasks();
  state.employees.forEach((employee, index) => {
    const cycle = ['working', 'board', 'outsourcing', 'calling', 'resting', 'working'];
    employee.status = cycle[(state.beat + index) % cycle.length];
    employee.target = targetForStatus(employee.status);
    employee.energy = clamp(employee.energy + (employee.status === 'resting' ? 8 : -3), 8, 100);
    thought(employee, pick(statusThoughts[employee.status]));
  });
  log(`Demo beat ${state.beat}: randomized agent states into Phaser sprite movement.`);
  renderConsole();
}

function simulationTick() {
  const now = new Date();
  state.tasks.forEach(task => {
    if (task.status === 'todo' && task.start && new Date(task.start) <= now) { task.status = 'doing'; assignTask(task.owner, task); }
  });
  state.employees.forEach(employee => {
    const task = getActiveTask(employee.id);
    if (!task) { employee.status = 'resting'; employee.target = 'rest'; employee.energy = clamp(employee.energy + 3, 0, 100); if (Math.random() < 0.35) thought(employee, pick(statusThoughts.resting)); return; }
    randomAgentMoment(employee);
    if (employee.status === 'working') { task.progress = clamp(task.progress + 5 + state.speed, 0, 100); employee.energy = clamp(employee.energy - 2, 0, 100); if (task.progress >= 100) completeTask(task, employee); }
    if (employee.status === 'outsourcing') { task.progress = clamp(task.progress + 12, 0, 100); if (task.progress >= 70) { employee.status = 'working'; employee.target = 'desk'; thought(employee, 'Tool output ready'); } }
  });
  renderConsole();
}

function randomAgentMoment(employee) {
  if (employee.status === 'calling' || employee.status === 'portal') return;
  const roll = Math.random();
  if (roll < 0.18) { employee.status = 'board'; employee.target = 'board'; }
  else if (roll < 0.36 && employee.energy > 25) { employee.status = 'outsourcing'; employee.target = 'outsource'; }
  else if (roll < 0.5 && employee.energy > 35) { employee.status = 'calling'; employee.target = 'mail'; setTimeout(() => { employee.status = 'working'; employee.target = 'desk'; thought(employee, 'Call notes applied'); renderConsole(); }, 1200); }
  else if (employee.status === 'board') { employee.status = 'working'; employee.target = 'desk'; }
  thought(employee, pick(statusThoughts[employee.status]));
}

function completeTask(task, employee) {
  task.status = 'done'; task.progress = 100; employee.task = ''; employee.status = 'board'; employee.target = 'board'; thought(employee, 'Done, updating board');
  const reward = task.priority === 'Critical' ? 420 : task.priority === 'High' ? 260 : 160;
  state.cash += reward; state.reputation += task.priority === 'Critical' ? 4 : 2;
  log(`${employee.name} completed ${task.title} and updated the task board. +$${reward}`);
}

function ensureDemoTasks() {
  state.employees.forEach(employee => {
    if (getActiveTask(employee.id)) return;
    const task = makeTask(state.nextTaskId++, pick(['Draft boss briefing', 'Patch portal flow', 'Summarize vendor output', 'Refine animation pass']), employee.id, 'doing', pick(['Normal', 'High']), 'none', '', Math.floor(Math.random() * 35));
    state.tasks.push(task); employee.task = task.title;
  });
}

function startLoop() {
  clearInterval(tickHandle);
  tickHandle = setInterval(simulationTick, 5200 - (state.speed * 700));
}

function drawRoute(graphics, route, status) {
  if (route.length < 2) return;
  const color = { calling: 0x71c7ff, outsourcing: 0xb895ff, board: 0xffcf66, portal: 0xff8a7a }[status] || 0x64d2a6;
  graphics.lineStyle(2, color, 0.52);
  graphics.beginPath();
  graphics.moveTo(route[0].x, route[0].y);
  route.slice(1).forEach(point => graphics.lineTo(point.x, point.y));
  graphics.strokePath();
}

function findRoute(from, to, obstacles) {
  const start = nearestOpenCell(from, obstacles);
  const goal = nearestOpenCell(to, obstacles);
  const queue = [start];
  const cameFrom = new Map([[cellKey(start), null]]);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (queue.length) {
    const current = queue.shift();
    if (current.x === goal.x && current.y === goal.y) break;
    for (const [dx, dy] of dirs) {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = cellKey(next);
      if (cameFrom.has(key) || isBlockedCell(next, obstacles)) continue;
      cameFrom.set(key, current); queue.push(next);
    }
  }
  if (!cameFrom.has(cellKey(goal))) return [from, to];
  const cells = [];
  let cursor = goal;
  while (cursor) { cells.unshift(cursor); cursor = cameFrom.get(cellKey(cursor)); }
  return simplifyRoute([from, ...cells.map(cellCenter), to]);
}

function nearestOpenCell(point, obstacles) {
  const base = pointToCell(point);
  if (!isBlockedCell(base, obstacles)) return base;
  for (let r = 1; r < 5; r += 1) for (let y = -r; y <= r; y += 1) for (let x = -r; x <= r; x += 1) {
    const cell = { x: base.x + x, y: base.y + y };
    if (!isBlockedCell(cell, obstacles)) return cell;
  }
  return base;
}

function isBlockedCell(cell, obstacles) {
  if (cell.x < 0 || cell.y < 0 || cell.x >= GAME_W / CELL || cell.y >= GAME_H / CELL) return true;
  const point = cellCenter(cell);
  return obstacles.some(rect => point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h);
}

function pointToCell(point) { return { x: clamp(Math.floor(point.x / CELL), 0, GAME_W / CELL - 1), y: clamp(Math.floor(point.y / CELL), 0, GAME_H / CELL - 1) }; }
function cellCenter(cell) { return { x: cell.x * CELL + CELL / 2, y: cell.y * CELL + CELL / 2 }; }
function cellKey(cell) { return `${cell.x}:${cell.y}`; }
function simplifyRoute(points) { return points.filter((p, i) => i === 0 || i === points.length - 1 || !((points[i - 1].x === p.x && p.x === points[i + 1].x) || (points[i - 1].y === p.y && p.y === points[i + 1].y))); }

function getPosition(employee) {
  const index = queueIndex(employee);
  const target = zones[targetForStatus(employee.status)] || zones.desks[employee.desk % zones.desks.length];
  if (employee.status === 'working') return queuePoint(zones.desks[employee.desk % zones.desks.length], index, 36, 28);
  return queuePoint(target, index, 44, 28);
}
function queuePoint(point, seed, gapX, gapY) { return { x: point.x + ((seed % 4) - 1.5) * gapX, y: point.y + (Math.floor(seed / 4) % 2) * gapY }; }
function queueIndex(employee) { const target = targetForStatus(employee.status); return state.employees.filter(item => targetForStatus(item.status) === target).findIndex(item => item.id === employee.id); }
function targetForStatus(status) { return { working: 'desk', resting: 'rest', calling: 'mail', outsourcing: 'outsource', board: 'board', portal: 'portal' }[status] || 'desk'; }
function frameForStatus(status) { return status === 'calling' || status === 'outsourcing' ? 3 : status === 'resting' ? 0 : status === 'board' ? 2 : Math.random() > 0.5 ? 1 : 2; }

function selectEmployee(id) { state.selectedId = id; renderConsole(); }
function getSelected() { return getEmployee(state.selectedId) || state.employees[0]; }
function getEmployee(id) { return state.employees.find(employee => employee.id === id); }
function getActiveTask(ownerId) { return state.tasks.find(task => task.owner === ownerId && task.status !== 'done'); }
function thought(employee, text) { employee.thought = text; }
function labelStatus(status) { return { working: 'Working', resting: 'Resting', calling: 'Calling', outsourcing: 'Tools', board: 'Board', portal: 'Portal' }[status] || status; }
function activateTab(name) { document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name)); document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active')); document.querySelector(`#${name}Panel`).classList.add('active'); }
function hydrateSystemFields() { els.voiceEndpoint.value = state.systems.voiceEndpoint; els.emailWorkspace.value = state.systems.emailWorkspace; els.speedSlider.value = state.speed; }
function log(message) { state.log.unshift({ time: nowTime(), message }); state.log = state.log.slice(0, 60); }
function makeEmployee(id, candidate, desk, temp, status, task) { return { id, name: candidate.name, role: candidate.role, specialty: candidate.specialty, salary: candidate.salary, row: candidate.row, color: candidate.color, desk, temp, status, target: targetForStatus(status), task, thought: pick(statusThoughts[status] || statusThoughts.working), energy: temp ? 82 : 100 }; }
function makeTask(id, title, owner, status, priority, repeat, start, progress = 0) { return { id, title, owner, status, priority, repeat, start, progress }; }
function normalize(next) { next.employees = next.employees.map((e, i) => ({ ...e, row: Number.isFinite(e.row) ? e.row : candidates[i % candidates.length].row, thought: e.thought || pick(statusThoughts[e.status] || statusThoughts.working) })); return next; }
function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(initialState); } catch { return structuredClone(initialState); } }
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function pick(items) { return items[Math.floor(Math.random() * items.length)]; }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function nowTime() { return new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()); }
function formatShortDate(value) { return new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char])); }

hydrateSystemFields();