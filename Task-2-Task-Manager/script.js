// TaskFlow stores task objects in the browser. No server or account is used.
const STORAGE_KEY = 'taskflow-tasks-v1';
const THEME_KEY = 'taskflow-theme-v1';
const CATEGORIES = ['Work', 'Personal', 'Study'];
const PRIORITIES = ['Low', 'Medium', 'High'];
let tasks = loadFromLocalStorage();
let statusFilter = 'all';
let categoryFilter = 'all';
let searchQuery = '';
let editingTaskId = null;
let draggedTaskId = null;
let toastTimer;

const elements = {
  form: document.querySelector('#task-form'), title: document.querySelector('#task-title'), description: document.querySelector('#task-description'),
  category: document.querySelector('#task-category'), dueDate: document.querySelector('#task-due-date'), priority: document.querySelector('#task-priority'),
  list: document.querySelector('#task-list'), empty: document.querySelector('#empty-state'), emptyTitle: document.querySelector('#empty-title'), emptyMessage: document.querySelector('#empty-message'),
  search: document.querySelector('#task-search'), categoryFilter: document.querySelector('#category-filter'), formHeading: document.querySelector('#form-heading'), submit: document.querySelector('#submit-task'),
  cancelEdit: document.querySelector('#cancel-edit'), toast: document.querySelector('#toast'), clearCompleted: document.querySelector('#clear-completed'),
  stats: { total: document.querySelector('#stat-total'), active: document.querySelector('#stat-active'), completed: document.querySelector('#stat-completed'), overdue: document.querySelector('#stat-overdue') }
};

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function normalizeTask(task, index) {
  if (!task || typeof task !== 'object' || typeof task.title !== 'string' || !task.title.trim()) return null;
  const date = isValidDate(task.dueDate) ? task.dueDate : todayString();
  return {
    id: typeof task.id === 'string' ? task.id : makeId(),
    title: task.title.trim().slice(0, 100),
    description: typeof task.description === 'string' ? task.description.slice(0, 500) : '',
    category: CATEGORIES.includes(task.category) ? task.category : 'Personal',
    dueDate: date,
    priority: PRIORITIES.includes(task.priority) ? task.priority : 'Medium',
    completed: Boolean(task.completed),
    order: Number.isFinite(task.order) ? task.order : index,
    createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString()
  };
}

function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTask).filter(Boolean).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.warn('TaskFlow could not read saved tasks. Starting with an empty list.', error);
    return [];
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    document.querySelector('#storage-status').textContent = 'Stored locally on this device';
    return true;
  } catch (error) {
    document.querySelector('#storage-status').textContent = 'Local storage is unavailable';
    showToast('Could not save tasks. Check your browser storage settings.');
    console.error('TaskFlow could not save tasks.', error);
    return false;
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function getFormValues() {
  return {
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    category: elements.category.value,
    dueDate: elements.dueDate.value,
    priority: elements.priority.value
  };
}

function validateForm(values) {
  const titleError = document.querySelector('#title-error');
  const categoryError = document.querySelector('#category-error');
  const dateError = document.querySelector('#date-error');
  titleError.textContent = values.title ? '' : 'Please enter a task title.';
  categoryError.textContent = CATEGORIES.includes(values.category) ? '' : 'Choose a category.';
  dateError.textContent = !values.dueDate ? 'Choose a due date.' : (!isValidDate(values.dueDate) ? 'Enter a valid date.' : '');
  elements.title.setAttribute('aria-invalid', String(Boolean(titleError.textContent)));
  elements.category.setAttribute('aria-invalid', String(Boolean(categoryError.textContent)));
  elements.dueDate.setAttribute('aria-invalid', String(Boolean(dateError.textContent)));
  if (titleError.textContent) elements.title.focus();
  else if (categoryError.textContent) elements.category.focus();
  else if (dateError.textContent) elements.dueDate.focus();
  return !titleError.textContent && !categoryError.textContent && !dateError.textContent;
}

function addTask(values) {
  tasks.push({ id: makeId(), ...values, completed: false, order: tasks.length ? Math.max(...tasks.map(task => task.order)) + 1 : 0, createdAt: new Date().toISOString() });
  saveToLocalStorage();
  render();
  showToast('Task added to your board.');
}

function editTask(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;
  editingTaskId = task.id;
  elements.title.value = task.title;
  elements.description.value = task.description;
  elements.category.value = task.category;
  elements.dueDate.value = task.dueDate;
  elements.priority.value = task.priority;
  elements.formHeading.textContent = 'Edit your task';
  elements.submit.textContent = 'Save changes →';
  elements.cancelEdit.hidden = false;
  document.querySelector('#task-form-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  elements.title.focus({ preventScroll: true });
}

function updateTask(taskId, values) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;
  Object.assign(task, values);
  saveToLocalStorage();
  resetForm();
  render();
  showToast('Task updated.');
}

function deleteTask(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task || !window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
  tasks = tasks.filter(item => item.id !== taskId);
  if (editingTaskId === taskId) resetForm();
  normalizeOrder();
  saveToLocalStorage();
  render();
  showToast('Task deleted.');
}

function toggleTaskCompletion(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  saveToLocalStorage();
  render();
  showToast(task.completed ? 'Nice work — task completed.' : 'Task moved back to active.');
}

function resetForm() {
  editingTaskId = null;
  elements.form.reset();
  elements.priority.value = 'Medium';
  elements.formHeading.textContent = 'Create a task';
  elements.submit.textContent = 'Add task →';
  elements.cancelEdit.hidden = true;
  document.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
  [elements.title, elements.category, elements.dueDate].forEach(field => field.removeAttribute('aria-invalid'));
}

function normalizeOrder() {
  tasks.sort((a, b) => a.order - b.order).forEach((task, index) => { task.order = index; });
}

function getVisibleTasks() {
  const query = searchQuery.trim().toLocaleLowerCase();
  return [...tasks].sort((a, b) => a.order - b.order).filter(task => {
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && !task.completed) || (statusFilter === 'completed' && task.completed);
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesSearch = !query || `${task.title} ${task.description} ${task.category}`.toLocaleLowerCase().includes(query);
    return matchesStatus && matchesCategory && matchesSearch;
  });
}

function formatDueDate(dateValue) {
  if (dateValue === todayString()) return 'Due today';
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: year !== new Date().getFullYear() ? 'numeric' : undefined }).format(new Date(year, month - 1, day));
}

function makeBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function makeAction(label, symbol, action, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `task-action ${extraClass}`.trim();
  button.dataset.action = action;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = symbol;
  return button;
}

function createTaskCard(task) {
  const card = document.createElement('article');
  card.className = `task-card${task.completed ? ' is-completed' : ''}`;
  card.dataset.taskId = task.id;
  card.draggable = true;
  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.setAttribute('aria-hidden', 'true');
  handle.title = 'Drag to reorder';
  handle.textContent = '⠿';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'task-check';
  check.checked = task.completed;
  check.dataset.action = 'toggle';
  check.setAttribute('aria-label', task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`);

  const main = document.createElement('div');
  main.className = 'task-main';
  const title = document.createElement('h3');
  title.className = 'task-title';
  title.textContent = task.title;
  const description = document.createElement('p');
  description.className = 'task-description';
  description.textContent = task.description;
  const meta = document.createElement('div');
  meta.className = 'task-meta';
  meta.append(makeBadge(task.category, `category-${task.category.toLowerCase()}`), makeBadge(`${task.priority} priority`, `priority-${task.priority.toLowerCase()}`));
  const date = document.createElement('span');
  date.className = 'due-date';
  const overdue = !task.completed && task.dueDate < todayString();
  const dueToday = !task.completed && task.dueDate === todayString();
  if (overdue) date.classList.add('overdue');
  if (dueToday) date.classList.add('due-today');
  date.textContent = `${overdue ? 'Overdue · ' : ''}${formatDueDate(task.dueDate)}`;
  meta.append(date);
  main.append(title, description, meta);

  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.append(makeAction('Edit task', '✎', 'edit'), makeAction('Delete task', '×', 'delete', 'delete'));
  card.append(handle, check, main, actions);
  return card;
}

function updateStats() {
  const completed = tasks.filter(task => task.completed).length;
  const active = tasks.length - completed;
  const overdue = tasks.filter(task => !task.completed && task.dueDate < todayString()).length;
  elements.stats.total.textContent = tasks.length;
  elements.stats.active.textContent = active;
  elements.stats.completed.textContent = completed;
  elements.stats.overdue.textContent = overdue;
  document.querySelector('#filter-all-count').textContent = tasks.length;
  document.querySelector('#filter-active-count').textContent = active;
  document.querySelector('#filter-completed-count').textContent = completed;
  elements.clearCompleted.disabled = completed === 0;
  elements.clearCompleted.setAttribute('aria-disabled', String(completed === 0));
}

function displayTasks() {
  const visibleTasks = getVisibleTasks();
  const fragment = document.createDocumentFragment();
  visibleTasks.forEach(task => fragment.append(createTaskCard(task)));
  elements.list.replaceChildren(fragment);
  document.querySelector('#visible-count').textContent = visibleTasks.length;
  elements.empty.hidden = visibleTasks.length > 0;
  document.querySelector('#drag-hint').hidden = visibleTasks.length < 2;
  if (!tasks.length) {
    elements.emptyTitle.textContent = 'A fresh start.';
    elements.emptyMessage.textContent = 'Add a task to turn your plans into progress.';
  } else if (!visibleTasks.length) {
    elements.emptyTitle.textContent = 'No matching tasks.';
    elements.emptyMessage.textContent = 'Try another search or adjust your filters.';
  }
}

function displayTasksAndStats() {
  displayTasks();
  updateStats();
}

function render() {
  displayTasksAndStats();
}

function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('light-theme', light);
  document.querySelector('.theme-glyph').textContent = light ? '☾' : '☼';
  document.querySelector('.theme-toggle').setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  document.querySelector('meta[name="theme-color"]').content = light ? '#f4f6fb' : '#0b1020';
}

function initializeTheme() {
  let theme = 'dark';
  try { theme = localStorage.getItem(THEME_KEY) || 'dark'; } catch { /* Keep the default for this visit. */ }
  applyTheme(theme);
  document.querySelector('.theme-toggle').addEventListener('click', () => {
    const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { showToast('Theme changed for this visit.'); }
  });
}

function moveTask(draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) return;
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  const fromIndex = sorted.findIndex(task => task.id === draggedId);
  const toIndex = sorted.findIndex(task => task.id === targetId);
  if (fromIndex < 0 || toIndex < 0) return;
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex - (fromIndex < toIndex ? 1 : 0), 0, moved);
  sorted.forEach((task, index) => { task.order = index; });
  tasks = sorted;
  saveToLocalStorage();
  render();
}

elements.form.addEventListener('submit', event => {
  event.preventDefault();
  const values = getFormValues();
  if (!validateForm(values)) return;
  if (editingTaskId) updateTask(editingTaskId, values);
  else { addTask(values); resetForm(); }
});

elements.cancelEdit.addEventListener('click', resetForm);
document.querySelector('.jump-add').addEventListener('click', () => { elements.title.focus(); document.querySelector('#task-form-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
document.querySelector('.empty-add').addEventListener('click', () => { elements.title.focus(); document.querySelector('#task-form-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }); });

elements.list.addEventListener('click', event => {
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) return;
  const card = actionElement.closest('[data-task-id]');
  if (!card) return;
  const taskId = card.dataset.taskId;
  if (actionElement.dataset.action === 'edit') editTask(taskId);
  if (actionElement.dataset.action === 'delete') deleteTask(taskId);
  if (actionElement.dataset.action === 'toggle') toggleTaskCompletion(taskId);
});

document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
  statusFilter = button.dataset.status;
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const selected = chip === button;
    chip.classList.toggle('selected', selected);
    chip.setAttribute('aria-pressed', String(selected));
  });
  render();
}));
elements.categoryFilter.addEventListener('change', () => { categoryFilter = elements.categoryFilter.value; render(); });
elements.search.addEventListener('input', () => { searchQuery = elements.search.value; render(); });

elements.clearCompleted.addEventListener('click', () => {
  const completedCount = tasks.filter(task => task.completed).length;
  if (!completedCount || !window.confirm(`Clear ${completedCount} completed task${completedCount === 1 ? '' : 's'}? This cannot be undone.`)) return;
  tasks = tasks.filter(task => !task.completed);
  normalizeOrder();
  saveToLocalStorage();
  render();
  showToast('Completed tasks cleared.');
});

elements.list.addEventListener('dragstart', event => {
  const card = event.target.closest('.task-card');
  if (!card) return;
  draggedTaskId = card.dataset.taskId;
  card.classList.add('dragging');
  if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', draggedTaskId); }
});
elements.list.addEventListener('dragover', event => {
  const card = event.target.closest('.task-card');
  if (!card || card.dataset.taskId === draggedTaskId) return;
  event.preventDefault();
  elements.list.querySelectorAll('.drop-target').forEach(item => item.classList.remove('drop-target'));
  card.classList.add('drop-target');
});
elements.list.addEventListener('drop', event => {
  const card = event.target.closest('.task-card');
  if (!card) return;
  event.preventDefault();
  moveTask(draggedTaskId, card.dataset.taskId);
});
elements.list.addEventListener('dragend', () => {
  draggedTaskId = null;
  elements.list.querySelectorAll('.dragging,.drop-target').forEach(card => card.classList.remove('dragging', 'drop-target'));
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    elements.search.focus();
  }
});

const dateFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
document.querySelector('#current-date').textContent = dateFormatter.format(new Date());
elements.dueDate.min = '1900-01-01'; // Past dates are allowed so overdue tasks can be tracked.
initializeTheme();
render();
