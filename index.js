// TaskFlow: a practical DOM manipulation project. No APIs or frameworks.

// 1. DOM SELECTORS
const heading = document.getElementById('heading');
const paragraphs = document.getElementsByTagName('p'); // HTMLCollection
const taskCardsByClass = () => document.getElementsByClassName('task-card');
const firstButton = document.querySelector('button');
const allButtons = () => document.querySelectorAll('button'); // NodeList
const priorityInputs = document.getElementsByName('priority');

const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const emptyTitle = document.querySelector('#emptyTitle');
const emptyText = document.querySelector('#emptyText');
const taskForm = document.querySelector('#taskForm');
const modal = document.querySelector('#modal');
const confirmModal = document.querySelector('#confirmModal');
const confirmText = document.querySelector('#confirmText');
const searchInput = document.querySelector('#searchInput');
const statusFilter = document.querySelector('#statusFilter'); // segmented button group
const filterButtons = statusFilter.querySelectorAll('button[data-filter]');
const titleInput = document.querySelector('#taskTitle');
const descriptionInput = document.querySelector('#taskDescription');
const titleError = document.querySelector('#titleError');
const titleCount = document.querySelector('#titleCount');
const descriptionCount = document.querySelector('#descriptionCount');
const clearCompletedBtn = document.querySelector('#clearCompletedBtn');
const openAddBtn = document.querySelector('#openAddBtn');
const progressBar = document.querySelector('#progressBar');
const progressLabel = document.querySelector('#progressLabel');
const progressPercent = document.querySelector('#progressPercent');
const toast = document.querySelector('#toast');
const toastIcon = document.querySelector('#toastIcon');
const toastMessage = document.querySelector('#toastMessage');

// 2. JAVASCRIPT STATE (resets on refresh; no database or API)
let nextId = 4;
let editingId = null;
let deletingId = null;
let previousFocus = null;
let toastTimer;
let currentFilter = 'all';
let lastAddedId = null;
let tasks = [
  { id: 1, title: 'Explore DOM selectors', description: 'Try getElementById, querySelector, and querySelectorAll.', priority: 'High', completed: false },
  { id: 2, title: 'Practice click events', description: 'Attach event listeners and update page content.', priority: 'Medium', completed: true },
  { id: 3, title: 'Build a popup modal', description: 'Open, close, and validate an HTML form.', priority: 'Low', completed: false }
];

// 3. ICONS (SVG built with createElementNS, since SVG lives in its own namespace)
const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  check: ['M20 6 9 17l-5-5'],
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 16v-4', 'M12 8h.01'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2']
};
function icon(name, size = 16) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const attrs = { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };
  for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, value);
  for (const d of ICONS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

// 4. REUSABLE FUNCTIONS
const TOAST_STYLES = {
  success: { icon: 'check', bg: 'bg-emerald-500' },
  info: { icon: 'info', bg: 'bg-indigo-500' },
  danger: { icon: 'trash', bg: 'bg-rose-600' }
};
function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toastMessage.textContent = message; // Safe: user input is never parsed as HTML.
  const style = TOAST_STYLES[type];
  toastIcon.className = `grid size-7 shrink-0 place-items-center rounded-full text-white ${style.bg}`;
  toastIcon.replaceChildren(icon(style.icon, 14));
  toast.classList.add('hidden');
  void toast.offsetWidth; // Force a reflow so the entrance animation replays.
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

function updateCounter(input, output) {
  output.textContent = `${input.value.length}/${input.maxLength}`;
}

function setTitleError(show) {
  titleError.classList.toggle('hidden', !show);
  titleInput.setAttribute('aria-invalid', String(show));
}

function restoreFocus() {
  if (previousFocus?.isConnected) previousFocus.focus();
  else (taskList.querySelector('button') || searchInput).focus({ preventScroll: true });
}

// Re-rendering replaces the cards, so put focus back on the "same" button.
function focusTaskButton(id, action) {
  const target = taskList.querySelector(`button[data-action="${action}"][data-id="${id}"]`);
  (target || taskList.querySelector('button') || searchInput).focus({ preventScroll: true });
}

function openModal(task = null) {
  previousFocus = document.activeElement;
  taskForm.reset();
  setTitleError(false);
  editingId = task ? task.id : null;
  document.querySelector('#modalTitle').textContent = task ? 'Edit task' : 'Add task';
  document.querySelector('#saveTaskBtn').textContent = task ? 'Update task' : 'Save task';
  if (task) {
    titleInput.value = task.title;
    descriptionInput.value = task.description;
    for (const radio of priorityInputs) radio.checked = radio.value === task.priority;
  }
  updateCounter(titleInput, titleCount);
  updateCounter(descriptionInput, descriptionCount);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.classList.add('overflow-hidden');
  titleInput.focus();
}
function closeModal(shouldRestoreFocus = true) {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  editingId = null;
  if (shouldRestoreFocus) restoreFocus();
}
function openDeleteModal(task) {
  deletingId = task.id;
  previousFocus = document.activeElement;
  confirmText.textContent = `“${task.title}” will be removed from your list. This action cannot be undone.`;
  confirmModal.classList.remove('hidden');
  confirmModal.classList.add('flex');
  document.body.classList.add('overflow-hidden');
  document.querySelector('#cancelDeleteBtn').focus();
}
function closeDeleteModal(shouldRestoreFocus = true) {
  deletingId = null;
  confirmModal.classList.add('hidden');
  confirmModal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  if (shouldRestoreFocus) restoreFocus();
}

// 5. CREATE ELEMENTS DYNAMICALLY (no unsafe innerHTML)
// Tailwind class sets reused by the cards. The Tailwind browser build
// generates these classes as soon as the elements land in the DOM.
const PRIORITY_STYLES = {
  High: { rail: 'before:bg-rose-600', badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-600' },
  Medium: { rail: 'before:bg-amber-500', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  Low: { rail: 'before:bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' }
};
const CARD_ACTION = 'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-slate-600 transition';

function makeButton({ label = '', action, id, className = '', iconName = null, ariaLabel = null }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = String(id);
  if (iconName) button.append(icon(iconName, action === 'toggle' ? 14 : 15));
  if (label) button.append(document.createTextNode(label));
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  return button;
}

function createTaskCard(task) {
  const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;
  const card = document.createElement('article');
  card.className = [
    'task-card relative flex flex-col overflow-hidden rounded-[18px] border border-slate-200 pb-3.5 pl-6 pr-5 pt-5 shadow-xs transition',
    'hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5',
    'before:absolute before:inset-y-0 before:left-0 before:w-1 before:transition-colors',
    task.completed ? 'bg-slate-50/60 before:bg-slate-300' : `bg-white ${style.rail}`,
    task.id === lastAddedId ? 'motion-safe:animate-arrive' : ''
  ].join(' ');
  card.dataset.id = String(task.id);

  // Body: round checkbox + title, badge, description
  const body = document.createElement('div');
  body.className = 'flex gap-3.5';

  const toggle = makeButton({
    action: 'toggle',
    id: task.id,
    className: `mt-px grid size-6 shrink-0 place-items-center rounded-full border-2 transition [&_svg]:stroke-3 ${task.completed
      ? 'border-indigo-600 bg-indigo-600 text-white *:motion-safe:animate-tick'
      : 'border-slate-300 bg-white text-transparent hover:border-indigo-600 hover:text-indigo-600/50'}`,
    iconName: 'check',
    ariaLabel: task.completed ? `Mark “${task.title}” as pending` : `Mark “${task.title}” as complete`
  });
  toggle.setAttribute('aria-pressed', String(task.completed));

  const content = document.createElement('div');
  content.className = 'min-w-0 flex-1';

  const top = document.createElement('div');
  top.className = 'flex items-start justify-between gap-3';
  const title = document.createElement('h3');
  title.className = `font-display text-[17px] font-semibold leading-snug tracking-tight break-words ${task.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'}`;
  title.textContent = task.title;

  const badge = document.createElement('span');
  badge.className = `inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${style.badge}`;
  const dot = document.createElement('span');
  dot.className = `size-1.5 rounded-full ${style.dot}`;
  badge.append(dot, document.createTextNode(task.priority));
  top.append(title, badge);

  const description = document.createElement('p');
  description.className = `mt-1.5 text-sm leading-6 break-words ${task.completed || !task.description ? 'text-slate-400' : 'text-slate-500'} ${task.description ? '' : 'italic'}`;
  description.textContent = task.description || 'No description provided.';

  content.append(top, description);
  body.append(toggle, content);

  // Footer: status + actions
  const footer = document.createElement('div');
  footer.className = 'mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3';

  const status = document.createElement('span');
  status.className = `inline-flex items-center gap-1.5 text-xs font-medium ${task.completed ? 'text-indigo-600' : 'text-slate-400'}`;
  status.append(icon(task.completed ? 'check' : 'clock', 13), document.createTextNode(task.completed ? 'Completed' : 'Pending'));

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-1';
  actions.append(
    makeButton({ label: 'Edit', action: 'edit', id: task.id, className: `${CARD_ACTION} hover:bg-slate-100 hover:text-slate-900`, iconName: 'edit', ariaLabel: `Edit “${task.title}”` }),
    makeButton({ label: 'Delete', action: 'delete', id: task.id, className: `${CARD_ACTION} hover:bg-rose-50 hover:text-rose-600`, iconName: 'trash', ariaLabel: `Delete “${task.title}”` })
  );
  footer.append(status, actions);

  card.append(body, footer);
  return card;
}

// 6. ARRAYS, LOOPS, FILTERS, AND UI UPDATES
function renderProgress(completed) {
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  progressPercent.textContent = `${percent}%`;
  progressLabel.textContent = total ? `${completed} of ${total} tasks completed` : 'No tasks yet';
  progressBar.setAttribute('aria-valuenow', String(percent));

  // One segment per task (completed first). Many tasks → a single smooth bar.
  if (total > 0 && total <= 24) {
    const segments = Array.from({ length: total }, (_, index) => {
      const segment = document.createElement('span');
      segment.className = `min-w-0 flex-1 rounded-full transition-colors duration-300 ${index < completed ? 'bg-white' : 'bg-white/20'}`;
      return segment;
    });
    progressBar.replaceChildren(...segments);
  } else {
    const track = document.createElement('span');
    track.className = 'min-w-0 flex-1 rounded-full bg-white/20';
    const fill = document.createElement('span');
    fill.className = 'absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-500';
    fill.style.width = `${percent}%`;
    progressBar.replaceChildren(track, fill);
  }
}

function renderEmptyState(query) {
  if (!tasks.length) {
    emptyTitle.textContent = 'No tasks yet';
    emptyText.textContent = 'Add your first task to start tracking what you practice.';
  } else if (query) {
    emptyTitle.textContent = `No tasks match “${searchInput.value.trim()}”`;
    emptyText.textContent = 'Check the spelling or try a shorter search.';
  } else if (currentFilter === 'completed') {
    emptyTitle.textContent = 'Nothing completed yet';
    emptyText.textContent = 'Tick the circle on a task to mark it as complete.';
  } else {
    emptyTitle.textContent = 'All caught up';
    emptyText.textContent = 'Every task is complete. Add a new one to keep practicing.';
  }
}

function renderTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = tasks.filter(task => {
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(query);
    const matchesStatus = currentFilter === 'all' || (currentFilter === 'completed' ? task.completed : !task.completed);
    return matchesSearch && matchesStatus;
  });

  taskList.replaceChildren(...visible.map(createTaskCard));
  emptyState.classList.toggle('hidden', visible.length > 0);
  if (!visible.length) renderEmptyState(query);

  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;
  document.querySelector('#totalCount').textContent = tasks.length;
  document.querySelector('#completedCount').textContent = completed;
  document.querySelector('#pendingCount').textContent = pending;
  document.querySelector('#countAll').textContent = tasks.length;
  document.querySelector('#countPending').textContent = pending;
  document.querySelector('#countCompleted').textContent = completed;
  document.querySelector('#taskSubtitle').textContent = `Showing ${visible.length} of ${tasks.length} tasks`;
  clearCompletedBtn.disabled = completed === 0;

  renderProgress(completed);
  lastAddedId = null;
}

// 7. EVENT LISTENERS
heading.addEventListener('click', () => showToast('You clicked the heading!', 'info'));
openAddBtn.addEventListener('click', () => openModal());
document.querySelector('#headerAddBtn').addEventListener('click', () => openModal());
document.querySelector('#emptyAddBtn').addEventListener('click', () => openModal());
document.querySelector('#closeModalBtn').addEventListener('click', () => closeModal());
document.querySelector('#cancelBtn').addEventListener('click', () => closeModal());
document.querySelector('#cancelDeleteBtn').addEventListener('click', () => closeDeleteModal());
document.querySelector('#helpBtn').addEventListener('click', () => showToast('Add, edit, complete, search, filter, or delete tasks to practice DOM events.', 'info'));
searchInput.addEventListener('input', renderTasks);
titleInput.addEventListener('input', () => { setTitleError(false); updateCounter(titleInput, titleCount); });
descriptionInput.addEventListener('input', () => updateCounter(descriptionInput, descriptionCount));

// Segmented filter: one listener on the group (event delegation again)
statusFilter.addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  currentFilter = button.dataset.filter;
  filterButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn === button)));
  renderTasks();
});

// Form submission and radio selection
taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    setTitleError(true);
    titleInput.focus();
    return;
  }
  const selectedPriority = document.querySelector('input[name="priority"]:checked')?.value || 'Medium';
  const description = descriptionInput.value.trim();
  const wasEditingId = editingId;

  if (wasEditingId !== null) {
    const task = tasks.find(item => item.id === wasEditingId);
    if (task) Object.assign(task, { title, description, priority: selectedPriority });
    showToast('Task updated.');
  } else {
    lastAddedId = nextId;
    tasks.unshift({ id: nextId++, title, description, priority: selectedPriority, completed: false });
    showToast('Task added.');
  }
  closeModal(false);
  renderTasks();
  if (wasEditingId !== null) focusTaskButton(wasEditingId, 'edit');
  else restoreFocus();
});

// Event delegation: one listener handles buttons created later.
taskList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || !taskList.contains(button)) return;
  const id = Number(button.dataset.id);
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  if (button.matches('[data-action="toggle"]')) {
    task.completed = !task.completed;
    renderTasks();
    focusTaskButton(id, 'toggle');
    showToast(task.completed ? 'Task completed.' : 'Task reopened.', task.completed ? 'success' : 'info');
  } else if (button.dataset.action === 'edit') {
    openModal(task);
  } else if (button.dataset.action === 'delete') {
    openDeleteModal(task);
  }
});

document.querySelector('#confirmDeleteBtn').addEventListener('click', () => {
  tasks = tasks.filter(task => task.id !== deletingId);
  closeDeleteModal(false);
  renderTasks();
  restoreFocus();
  showToast('Task deleted.', 'danger');
});
clearCompletedBtn.addEventListener('click', () => {
  const removed = tasks.filter(task => task.completed).length;
  tasks = tasks.filter(task => !task.completed);
  renderTasks();
  searchInput.focus({ preventScroll: true });
  showToast(`${removed} completed ${removed === 1 ? 'task' : 'tasks'} cleared.`, 'danger');
});

// Backdrop and keyboard interactions
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
confirmModal.addEventListener('click', event => { if (event.target === confirmModal) closeDeleteModal(); });
document.addEventListener('keydown', event => {
  const activeDialog = !confirmModal.classList.contains('hidden') ? confirmModal : !modal.classList.contains('hidden') ? modal : null;

  if (event.key === 'Escape') {
    if (activeDialog === confirmModal) closeDeleteModal();
    else if (activeDialog === modal) closeModal();
    return;
  }

  // Keep keyboard focus inside an open dialog.
  if (event.key === 'Tab' && activeDialog) {
    const focusable = [...activeDialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])')].filter(el => el.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    return;
  }

  // Shortcuts: "/" focuses search, "N" opens the add dialog (not while typing).
  const isTyping = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
  if (activeDialog || isTyping || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === '/') { event.preventDefault(); searchInput.focus(); }
  else if (event.key.toLowerCase() === 'n') { event.preventDefault(); openModal(); }
});

// Inspect selector examples in the browser console.
console.log('First paragraph:', paragraphs[0]);
console.log('First button:', firstButton);
console.log('Priority radio inputs:', priorityInputs);
console.log('Number of buttons:', allButtons().length);
console.log('Task cards before first render:', taskCardsByClass().length);
renderTasks();
console.log('Task cards after render:', taskCardsByClass().length);