// Application State Management
const STATE_KEY = 'zentodo_state';
const THEME_KEY = 'zentodo_theme';

// Default State if no local storage is found
const defaultState = {
    tabs: ['Работа', 'Личное', 'Покупки'],
    notebooks: ['Идеи', 'Разное'],
    activeTab: 'Работа',
    todos: [
        { id: '1', text: 'Подготовить отчет по проекту', completed: false, tab: 'Работа', createdAt: Date.now() - 3600000 * 2, priority: 'high' },
        { id: '2', text: 'Созвон с командой в 15:00', completed: true, tab: 'Работа', createdAt: Date.now() - 3600000 * 4, priority: 'none' },
        { id: '3', text: 'Купить подарки друзьям', completed: false, tab: 'Личное', createdAt: Date.now() - 3600000 * 24, priority: 'medium' },
        { id: '4', text: 'Купить молоко и фрукты', completed: false, tab: 'Покупки', createdAt: Date.now(), priority: 'none' }
    ],
    notes: [
        { id: 'n1', title: 'Идеи для проекта', content: '1. Использовать стек CSS Variables\n2. Реализовать стек на Grid и Flexbox', tab: 'Работа', createdAt: Date.now() - 3600000 * 5, color: 'purple' },
        { id: 'n2', title: 'Список покупок расширенный', content: 'Не забыть взять пакеты на кассе', tab: 'Покупки', createdAt: Date.now() - 3600000 * 2, color: 'yellow' },
        { id: 'n3', title: 'План поездки', content: 'Купить билеты, забронировать отель, составить маршрут', tab: 'Разное', createdAt: Date.now() - 3600000 * 10, color: 'blue' }
    ]
};

let state = { ...defaultState };
let currentFilter = 'all'; // 'all', 'active', 'completed'
let currentFormPriority = 'none'; // 'none', 'medium', 'high'
let currentView = 'tasks'; // 'tasks' or 'notes'
let currentNoteFormColor = 'none'; // 'none', 'purple', 'blue', 'green', 'yellow', 'red'
let editingNoteId = null; // ID of the note currently being edited

const noteColorLabels = {
    none: 'Обычный',
    purple: 'Фиолетовый',
    blue: 'Синий',
    green: 'Зеленый',
    yellow: 'Желтый',
    red: 'Красный'
};

const priorityWeight = {
    high: 3,
    medium: 2,
    none: 1
};

const priorityLabels = {
    high: 'Высокий',
    medium: 'Средний',
    none: 'Обычный'
};

// DOM Elements
const DOM = {
    sidebar: document.getElementById('sidebar'),
    btnOpenSidebar: document.getElementById('btn-open-sidebar'),
    btnCloseSidebar: document.getElementById('btn-close-sidebar'),
    tabsList: document.getElementById('tabs-list'),
    btnAddTabPrompt: document.getElementById('btn-add-tab-prompt'),
    formAddTab: document.getElementById('form-add-tab'),
    inputNewTab: document.getElementById('input-new-tab'),
    btnCancelTab: document.getElementById('btn-cancel-tab'),
    btnToggleTheme: document.getElementById('btn-toggle-theme'),
    activeTabTitle: document.getElementById('active-tab-title'),
    activeTabSubtitle: document.getElementById('active-tab-subtitle'),
    progressPercentage: document.getElementById('progress-percentage'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    formAddTodo: document.getElementById('form-add-todo'),
    inputNewTodo: document.getElementById('input-new-todo'),
    filtersBar: document.querySelector('.filters-bar'),
    filterButtons: document.querySelectorAll('.btn-filter'),
    btnClearCompleted: document.getElementById('btn-clear-completed'),
    tasksList: document.getElementById('tasks-list'),
    emptyState: document.getElementById('empty-state'),
    btnPrioritySelect: document.getElementById('btn-priority-select'),
    priorityDropdownMenu: document.getElementById('priority-dropdown-menu'),
    selectedPriorityText: document.getElementById('selected-priority-text'),
    
    // Notes view elements
    viewSwitcher: document.getElementById('view-switcher'),
    btnSwitchViews: document.querySelectorAll('.btn-switch-view'),
    taskControls: document.getElementById('task-controls'),
    tasksContainer: document.querySelector('.tasks-container'),
    notesControls: document.getElementById('notes-controls'),
    notesContainer: document.getElementById('notes-container'),
    formAddNote: document.getElementById('form-add-note'),
    inputNoteTitle: document.getElementById('input-note-title'),
    inputNoteContent: document.getElementById('input-note-content'),
    btnNoteColorSelect: document.getElementById('btn-note-color-select'),
    noteColorDropdown: document.getElementById('note-color-dropdown'),
    selectedNoteColorText: document.getElementById('selected-note-color-text'),
    notesGrid: document.getElementById('notes-grid'),
    emptyNotesState: document.getElementById('empty-notes-state'),
    notesCountBadge: document.getElementById('notes-count-badge'),
    
    // Notebooks sidebar elements
    notebooksList: document.getElementById('notebooks-list'),
    btnAddNotebookPrompt: document.getElementById('btn-add-notebook-prompt'),
    formAddNotebook: document.getElementById('form-add-notebook'),
    inputNewNotebook: document.getElementById('input-new-notebook'),
    btnCancelNotebook: document.getElementById('btn-cancel-notebook')
};

// Map default tab names to Lucide icons
const tabIconMap = {
    'Работа': 'briefcase',
    'Личное': 'user',
    'Покупки': 'shopping-bag',
    'default': 'list'
};

// Initialize Application
function init() {
    loadState();
    initTheme();
    setupEventListeners();
    render();
}

// Load State from LocalStorage
function loadState() {
    const storedState = localStorage.getItem(STATE_KEY);
    if (storedState) {
        try {
            state = JSON.parse(storedState);
            // Ensure lists aren't empty
            if (!state.tabs || state.tabs.length === 0) {
                state.tabs = [...defaultState.tabs];
            }
            if (!state.notebooks) {
                state.notebooks = [...defaultState.notebooks];
            }
            const allTabs = [...state.tabs, ...state.notebooks];
            if (!state.activeTab || !allTabs.includes(state.activeTab)) {
                state.activeTab = state.tabs[0];
            }
            if (!state.todos) {
                state.todos = [];
            }
            if (!state.notes) {
                state.notes = [];
            }
        } catch (e) {
            console.error('Ошибка загрузки состояния, сброс к значениям по умолчанию', e);
            state = { ...defaultState };
        }
    } else {
        state = { ...defaultState };
    }
}

// Save State to LocalStorage
function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const sunIcon = DOM.btnToggleTheme.querySelector('.icon-sun');
    const moonIcon = DOM.btnToggleTheme.querySelector('.icon-moon');
    const themeText = DOM.btnToggleTheme.querySelector('span');

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        themeText.textContent = 'Темная тема';
    } else {
        document.body.classList.remove('light-theme');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        themeText.textContent = 'Светлая тема';
    }
}

function toggleTheme() {
    const isLightTheme = document.body.classList.toggle('light-theme');
    localStorage.setItem(THEME_KEY, isLightTheme ? 'light' : 'dark');
    initTheme();
}

// Helper: Get Icon Name for a Tab
function getTabIcon(tabName) {
    return tabIconMap[tabName] || tabIconMap['default'];
}

// Main Render Function
function render() {
    renderTabs();
    renderNotebooks();
    renderHeader();
    
    const isNotebook = state.notebooks.includes(state.activeTab);
    
    if (isNotebook) {
        currentView = 'notes';
        DOM.viewSwitcher.classList.add('hidden');
        DOM.taskControls.classList.add('hidden');
        DOM.tasksContainer.classList.add('hidden');
        DOM.notesControls.classList.remove('hidden');
        DOM.notesContainer.classList.remove('hidden');
        renderNotes();
    } else {
        DOM.viewSwitcher.classList.remove('hidden');
        
        // Update view switcher buttons UI state
        DOM.btnSwitchViews.forEach(btn => {
            if (btn.dataset.view === currentView) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update notes count badge in switcher button
        const tabNotes = state.notes.filter(n => n.tab === state.activeTab);
        if (DOM.notesCountBadge) {
            if (tabNotes.length > 0) {
                DOM.notesCountBadge.textContent = tabNotes.length;
                DOM.notesCountBadge.classList.remove('hidden');
            } else {
                DOM.notesCountBadge.classList.add('hidden');
            }
        }
        
        if (currentView === 'tasks') {
            DOM.taskControls.classList.remove('hidden');
            DOM.tasksContainer.classList.remove('hidden');
            DOM.notesControls.classList.add('hidden');
            DOM.notesContainer.classList.add('hidden');
            renderTasks();
        } else {
            DOM.taskControls.classList.add('hidden');
            DOM.tasksContainer.classList.add('hidden');
            DOM.notesControls.classList.remove('hidden');
            DOM.notesContainer.classList.remove('hidden');
            renderNotes();
        }
    }
    
    // Reinitialize Lucide icons for dynamically added elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Render Tabs Sidebar
function renderTabs() {
    DOM.tabsList.innerHTML = '';
    
    state.tabs.forEach(tab => {
        // Count active (incomplete) tasks in this tab
        const activeCount = state.todos.filter(t => t.tab === tab && !t.completed).length;
        const iconName = getTabIcon(tab);
        const isActive = tab === state.activeTab;
        
        const li = document.createElement('li');
        li.className = `tab-item ${isActive ? 'active' : ''}`;
        li.dataset.tabName = tab;
        
        li.innerHTML = `
            <div class="tab-left">
                <i data-lucide="${iconName}" class="tab-icon"></i>
                <span class="tab-name">${escapeHTML(tab)}</span>
            </div>
            <div class="tab-right">
                ${activeCount > 0 ? `<span class="tab-badge">${activeCount}</span>` : ''}
                <button class="btn-delete-tab" title="Удалить список" data-tab-name="${tab}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        // Tab Switch Click Event
        li.addEventListener('click', (e) => {
            // Prevent trigger if clicking delete button
            if (e.target.closest('.btn-delete-tab')) return;
            selectTab(tab);
        });
        
        // Delete Tab Click Event
        const btnDelete = li.querySelector('.btn-delete-tab');
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTab(tab);
        });
        
        DOM.tabsList.appendChild(li);
    });
}

// Render Notebooks Sidebar
function renderNotebooks() {
    DOM.notebooksList.innerHTML = '';
    
    state.notebooks.forEach(notebook => {
        const notesCount = state.notes.filter(n => n.tab === notebook).length;
        const isActive = notebook === state.activeTab;
        
        const li = document.createElement('li');
        li.className = `tab-item ${isActive ? 'active' : ''}`;
        li.dataset.tabName = notebook;
        
        li.innerHTML = `
            <div class="tab-left">
                <i data-lucide="book-open" class="tab-icon"></i>
                <span class="tab-name">${escapeHTML(notebook)}</span>
            </div>
            <div class="tab-right">
                ${notesCount > 0 ? `<span class="tab-badge">${notesCount}</span>` : ''}
                <button class="btn-delete-tab" title="Удалить блокнот" data-tab-name="${notebook}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        // Notebook Switch Click Event
        li.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-tab')) return;
            selectTab(notebook);
        });
        
        // Delete Notebook Click Event
        const btnDelete = li.querySelector('.btn-delete-tab');
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNotebook(notebook);
        });
        
        DOM.notebooksList.appendChild(li);
    });
}

// Add a Notebook
function addNotebook(name) {
    const cleanName = name.trim();
    if (!cleanName) return;
    
    const allTabs = [...state.tabs, ...state.notebooks];
    if (allTabs.some(t => t.toLowerCase() === cleanName.toLowerCase())) {
        alert('Список или блокнот с таким названием уже существует!');
        return;
    }
    
    state.notebooks.push(cleanName);
    state.activeTab = cleanName;
    currentView = 'notes';
    saveState();
    render();
}

// Delete a Notebook
function deleteNotebook(name) {
    const notebookNotes = state.notes.filter(n => n.tab === name);
    
    if (notebookNotes.length > 0) {
        const confirmDelete = confirm(`В блокноте "${name}" есть заметки (${notebookNotes.length}). Вы уверены, что хотите удалить его вместе со всеми заметками?`);
        if (!confirmDelete) return;
    }
    
    // Remove the notebook and its notes
    state.notebooks = state.notebooks.filter(n => n !== name);
    state.notes = state.notes.filter(n => n.tab !== name);
    
    // Adjust active tab if the deleted one was active
    if (state.activeTab === name) {
        state.activeTab = state.tabs.length > 0 ? state.tabs[0] : (state.notebooks.length > 0 ? state.notebooks[0] : '');
    }
    
    saveState();
    render();
}

// Render Header Info & Progress Bar
function renderHeader() {
    DOM.activeTabTitle.textContent = state.activeTab;
    
    const isNotebook = state.notebooks.includes(state.activeTab);
    const progressContainer = document.querySelector('.progress-container');
    
    if (isNotebook) {
        if (progressContainer) progressContainer.classList.add('hidden');
        const tabNotes = state.notes.filter(n => n.tab === state.activeTab);
        const count = tabNotes.length;
        if (count === 0) {
            DOM.activeTabSubtitle.textContent = 'В этом блокноте пока нет заметок';
        } else {
            DOM.activeTabSubtitle.textContent = `${count} ${getNoun(count, 'заметка', 'заметки', 'заметок')}`;
        }
    } else {
        if (progressContainer) progressContainer.classList.remove('hidden');
        
        const tabTodos = state.todos.filter(t => t.tab === state.activeTab);
        const total = tabTodos.length;
        const completed = tabTodos.filter(t => t.completed).length;
        const active = total - completed;
        
        // Set subtitle based on tasks count
        if (total === 0) {
            DOM.activeTabSubtitle.textContent = 'В этом списке пока нет задач';
        } else {
            DOM.activeTabSubtitle.textContent = `${active} активных ${getNoun(active, 'задача', 'задачи', 'задач')}, ${completed} выполнено из ${total}`;
        }
        
        // Calculate progress
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        DOM.progressPercentage.textContent = `${percentage}%`;
        DOM.progressBarFill.style.width = `${percentage}%`;
    }
}

// Render Tasks List
function renderTasks() {
    DOM.tasksList.innerHTML = '';
    
    // Filter tasks by active tab
    let tabTodos = state.todos.filter(t => t.tab === state.activeTab);
    
    // Sort tasks: Active first, then Completed, then by priority weight, then by creation date descending
    tabTodos.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        const weightA = priorityWeight[a.priority] || 1;
        const weightB = priorityWeight[b.priority] || 1;
        if (weightA !== weightB) {
            return weightB - weightA;
        }
        return b.createdAt - a.createdAt;
    });
    
    // Filter by Active/Completed tabs filter
    let filteredTodos = tabTodos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });
    
    // Manage Clear Completed visibility
    const hasCompleted = tabTodos.some(t => t.completed);
    if (hasCompleted) {
        DOM.btnClearCompleted.classList.remove('hidden');
    } else {
        DOM.btnClearCompleted.classList.add('hidden');
    }
    
    if (filteredTodos.length === 0) {
        DOM.emptyState.classList.remove('hidden');
    } else {
        DOM.emptyState.classList.add('hidden');
        
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.todoId = todo.id;
            
            const priority = todo.priority || 'none';
            const priorityText = priorityLabels[priority];
            
            li.innerHTML = `
                <div class="todo-item-left">
                    <label class="checkbox-container">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                        <span class="checkmark">
                            <i data-lucide="check"></i>
                        </span>
                    </label>
                    <span class="todo-text">${escapeHTML(todo.text)}</span>
                </div>
                <div class="todo-item-actions">
                    <div class="todo-priority-container">
                        <button class="btn-todo-priority" title="Изменить приоритет (текущий: ${priorityText})">
                            <i data-lucide="flag" class="priority-flag-icon icon-${priority}"></i>
                        </button>
                        <div class="priority-dropdown-menu hidden">
                            <div class="priority-dropdown-option ${priority === 'high' ? 'active' : ''}" data-priority="high">
                                <i data-lucide="flag" class="priority-flag-icon icon-high"></i>
                                <span>Высокий</span>
                            </div>
                            <div class="priority-dropdown-option ${priority === 'medium' ? 'active' : ''}" data-priority="medium">
                                <i data-lucide="flag" class="priority-flag-icon icon-medium"></i>
                                <span>Средний</span>
                            </div>
                            <div class="priority-dropdown-option ${priority === 'none' ? 'active' : ''}" data-priority="none">
                                <i data-lucide="flag" class="priority-flag-icon icon-none"></i>
                                <span>Обычный</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn-delete-todo" title="Удалить задачу">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            
            // Checkbox Change Event
            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                toggleTodo(todo.id);
            });
            
            // Priority Button Click Event
            const btnPriority = li.querySelector('.btn-todo-priority');
            const menuPriority = li.querySelector('.priority-dropdown-menu');
            btnPriority.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close other dropdowns and remove priority-menu-open from other tasks
                document.querySelectorAll('.priority-dropdown-menu').forEach(m => {
                    if (m !== menuPriority) {
                        m.classList.add('hidden');
                        const otherLi = m.closest('.todo-item');
                        if (otherLi) {
                            otherLi.classList.remove('priority-menu-open');
                        }
                    }
                });
                DOM.priorityDropdownMenu.classList.add('hidden');
                DOM.btnPrioritySelect.parentElement.classList.remove('open');
                
                const isClosed = menuPriority.classList.toggle('hidden');
                li.classList.toggle('priority-menu-open', !isClosed);
            });
            
            // Priority Option Click Event
            const optElements = li.querySelectorAll('.priority-dropdown-option');
            optElements.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newPriority = opt.dataset.priority;
                    updateTodoPriority(todo.id, newPriority);
                });
            });
            
            // Delete Todo Click Event
            const btnDelete = li.querySelector('.btn-delete-todo');
            btnDelete.addEventListener('click', () => {
                deleteTodo(todo.id);
            });
            
            DOM.tasksList.appendChild(li);
        });
    }
}

// Select a Tab
function selectTab(tabName) {
    state.activeTab = tabName;
    currentFilter = 'all';
    editingNoteId = null;
    updateFilterUI();
    saveState();
    render();
    
    // Close sidebar on mobile after selection
    closeMobileSidebar();
}

// Add a Tab
function addTab(tabName) {
    const cleanName = tabName.trim();
    if (!cleanName) return;
    
    if (state.tabs.some(t => t.toLowerCase() === cleanName.toLowerCase())) {
        alert('Список с таким названием уже существует!');
        return;
    }
    
    state.tabs.push(cleanName);
    state.activeTab = cleanName;
    currentFilter = 'all';
    updateFilterUI();
    saveState();
    render();
}

// Delete a Tab
function deleteTab(tabName) {
    const tabTasks = state.todos.filter(t => t.tab === tabName);
    const tabNotes = state.notes ? state.notes.filter(t => t.tab === tabName) : [];
    const totalCount = tabTasks.length + tabNotes.length;
    
    if (totalCount > 0) {
        const confirmDelete = confirm(`В списке "${tabName}" есть задачи (${tabTasks.length}) и заметки (${tabNotes.length}). Вы уверены, что хотите удалить его вместе со всеми элементами?`);
        if (!confirmDelete) return;
    }
    
    // Remove the tab, its tasks and its notes
    state.tabs = state.tabs.filter(t => t !== tabName);
    state.todos = state.todos.filter(t => t.tab !== tabName);
    if (state.notes) {
        state.notes = state.notes.filter(t => t.tab !== tabName);
    }
    
    // Adjust active tab if the deleted one was active
    if (state.activeTab === tabName) {
        state.activeTab = state.tabs.length > 0 ? state.tabs[0] : '';
    }
    
    saveState();
    render();
}

// Add a Todo Task
function addTodo(text, priority = 'none') {
    const cleanText = text.trim();
    if (!cleanText || !state.activeTab) return;
    
    const newTodo = {
        id: generateUUID(),
        text: cleanText,
        completed: false,
        tab: state.activeTab,
        createdAt: Date.now(),
        priority: priority
    };
    
    state.todos.push(newTodo);
    saveState();
    render();
}

// Update Todo Priority
function updateTodoPriority(todoId, priority) {
    const todo = state.todos.find(t => t.id === todoId);
    if (todo) {
        todo.priority = priority;
        saveState();
        render();
    }
}

// Update priority selector UI in form
function updateFormPriorityUI() {
    DOM.selectedPriorityText.textContent = priorityLabels[currentFormPriority];
    
    const flagIcon = DOM.btnPrioritySelect.querySelector('.priority-flag-icon');
    if (flagIcon) {
        flagIcon.classList.remove('icon-none', 'icon-medium', 'icon-high');
        flagIcon.classList.add('icon-' + currentFormPriority);
    }
    
    const options = DOM.priorityDropdownMenu.querySelectorAll('.priority-dropdown-option');
    options.forEach(opt => {
        if (opt.dataset.priority === currentFormPriority) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

// Toggle Todo Completed State
function toggleTodo(todoId) {
    const todo = state.todos.find(t => t.id === todoId);
    if (todo) {
        todo.completed = !todo.completed;
        saveState();
        render();
    }
}

// Delete a Todo Task
function deleteTodo(todoId) {
    state.todos = state.todos.filter(t => t.id !== todoId);
    saveState();
    render();
}

// Clear Completed Todos in Active Tab
function clearCompletedInActiveTab() {
    state.todos = state.todos.filter(t => !(t.tab === state.activeTab && t.completed));
    saveState();
    render();
}

// Add a Note
function addNote(title, content, color = 'none') {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanContent || !state.activeTab) return;
    
    const newNote = {
        id: generateUUID(),
        title: cleanTitle,
        content: cleanContent,
        color: color,
        tab: state.activeTab,
        createdAt: Date.now()
    };
    
    state.notes.push(newNote);
    saveState();
    render();
}

// Delete a Note
function deleteNote(noteId) {
    state.notes = state.notes.filter(n => n.id !== noteId);
    saveState();
    render();
}

// Save edited Note
function saveNoteEdit(noteId, title, content) {
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
        note.title = title.trim();
        note.content = content.trim();
        editingNoteId = null;
        saveState();
        render();
    }
}

// Format date helper (e.g. "16.07.2026 12:35")
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Render Notes List Grid
function renderNotes() {
    DOM.notesGrid.innerHTML = '';
    
    // Filter notes by active tab
    const tabNotes = state.notes.filter(n => n.tab === state.activeTab);
    
    // Sort notes: creation date descending
    tabNotes.sort((a, b) => b.createdAt - a.createdAt);
    
    if (tabNotes.length === 0) {
        DOM.emptyNotesState.classList.remove('hidden');
    } else {
        DOM.emptyNotesState.classList.add('hidden');
        
        tabNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = `note-card note-color-${note.color || 'none'}`;
            card.dataset.noteId = note.id;
            
            if (editingNoteId === note.id) {
                // Edit Mode Card
                card.innerHTML = `
                    <form class="note-edit-form">
                        <input type="text" class="input-edit-title" value="${escapeHTML(note.title)}" placeholder="Заголовок..." autocomplete="off" maxlength="100">
                        <textarea class="textarea-edit-content" placeholder="Текст..." required autocomplete="off">${escapeHTML(note.content)}</textarea>
                        <div class="note-edit-actions">
                            <button type="button" class="btn-edit-action btn-edit-cancel" title="Отмена">
                                <i data-lucide="x"></i>
                            </button>
                            <button type="submit" class="btn-edit-action btn-edit-save" title="Сохранить">
                                <i data-lucide="check"></i>
                            </button>
                        </div>
                    </form>
                `;
                
                const form = card.querySelector('.note-edit-form');
                const btnCancel = card.querySelector('.btn-edit-cancel');
                
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const newTitle = card.querySelector('.input-edit-title').value;
                    const newContent = card.querySelector('.textarea-edit-content').value;
                    saveNoteEdit(note.id, newTitle, newContent);
                });
                
                btnCancel.addEventListener('click', () => {
                    editingNoteId = null;
                    render();
                });
                
            } else {
                // View Mode Card
                card.innerHTML = `
                    <div class="note-card-body">
                        ${note.title ? `<h3 class="note-card-title">${escapeHTML(note.title)}</h3>` : ''}
                        <div class="note-card-content">${escapeHTML(note.content)}</div>
                    </div>
                    <div class="note-card-footer">
                        <span class="note-card-date">${formatDate(note.createdAt)}</span>
                        <div class="note-card-actions">
                            <button class="btn-note-action btn-edit-note" title="Редактировать">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-note-action btn-delete-note" title="Удалить заметку">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                const btnEdit = card.querySelector('.btn-edit-note');
                const btnDelete = card.querySelector('.btn-delete-note');
                
                btnEdit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editingNoteId = note.id;
                    render();
                });
                
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
                        deleteNote(note.id);
                    }
                });
            }
            
            DOM.notesGrid.appendChild(card);
        });
    }
}

// Update note color select UI
function updateNoteFormColorUI() {
    DOM.selectedNoteColorText.textContent = noteColorLabels[currentNoteFormColor];
    
    const colorDot = DOM.btnNoteColorSelect.querySelector('.color-dot');
    if (colorDot) {
        colorDot.className = 'color-dot color-' + currentNoteFormColor;
    }
    
    const options = DOM.noteColorDropdown.querySelectorAll('.note-color-option');
    options.forEach(opt => {
        if (opt.dataset.color === currentNoteFormColor) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

// Sidebar Mobile Toggle Functions
function openMobileSidebar() {
    DOM.sidebar.classList.add('open');
    // Add backdrop overlay
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', closeMobileSidebar);
        document.body.appendChild(overlay);
    }
}

function closeMobileSidebar() {
    DOM.sidebar.classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Update Filter Buttons UI State
function updateFilterUI() {
    DOM.filterButtons.forEach(btn => {
        if (btn.dataset.filter === currentFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Event Listeners Configuration
function setupEventListeners() {
    // View Switcher Click Events
    DOM.btnSwitchViews.forEach(btn => {
        btn.addEventListener('click', () => {
            currentView = btn.dataset.view;
            editingNoteId = null; // reset editing state when switching view
            render();
        });
    });

    // Add Todo Form Submit
    DOM.formAddTodo.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = DOM.inputNewTodo.value;
        addTodo(text, currentFormPriority);
        DOM.inputNewTodo.value = '';
        
        // Reset priority selection
        currentFormPriority = 'none';
        updateFormPriorityUI();
    });
    
    // Priority Selector Button Click
    DOM.btnPrioritySelect.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close task-level dropdowns
        document.querySelectorAll('.priority-dropdown-menu').forEach(menu => {
            if (menu !== DOM.priorityDropdownMenu) {
                menu.classList.add('hidden');
            }
        });
        
        const isClosed = DOM.priorityDropdownMenu.classList.toggle('hidden');
        DOM.btnPrioritySelect.parentElement.classList.toggle('open', !isClosed);
    });
    
    // Priority Options Selection
    const formPriorityOptions = DOM.priorityDropdownMenu.querySelectorAll('.priority-dropdown-option');
    formPriorityOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            currentFormPriority = opt.dataset.priority;
            updateFormPriorityUI();
            DOM.priorityDropdownMenu.classList.add('hidden');
            DOM.btnPrioritySelect.parentElement.classList.remove('open');
        });
    });
    
    // Add Note Form Submit
    DOM.formAddNote.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = DOM.inputNoteTitle.value;
        const content = DOM.inputNoteContent.value;
        addNote(title, content, currentNoteFormColor);
        DOM.inputNoteTitle.value = '';
        DOM.inputNoteContent.value = '';
        
        // Reset color selection
        currentNoteFormColor = 'none';
        updateNoteFormColorUI();
    });
    
    // Note Color Selector Button Click
    DOM.btnNoteColorSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close priority dropdowns
        DOM.priorityDropdownMenu.classList.add('hidden');
        DOM.btnPrioritySelect.parentElement.classList.remove('open');
        
        const isClosed = DOM.noteColorDropdown.classList.toggle('hidden');
        DOM.btnNoteColorSelect.parentElement.classList.toggle('open', !isClosed);
    });
    
    // Note Color Options Selection
    const noteColorOptions = DOM.noteColorDropdown.querySelectorAll('.note-color-option');
    noteColorOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            currentNoteFormColor = opt.dataset.color;
            updateNoteFormColorUI();
            DOM.noteColorDropdown.classList.add('hidden');
            DOM.btnNoteColorSelect.parentElement.classList.remove('open');
        });
    });
    
    // Global click listener to close all dropdowns when clicking outside
    document.addEventListener('click', () => {
        DOM.priorityDropdownMenu.classList.add('hidden');
        DOM.btnPrioritySelect.parentElement.classList.remove('open');
        
        DOM.noteColorDropdown.classList.add('hidden');
        DOM.btnNoteColorSelect.parentElement.classList.remove('open');
        
        document.querySelectorAll('.priority-dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
        document.querySelectorAll('.todo-item').forEach(item => {
            item.classList.remove('priority-menu-open');
        });
    });
    
    // Add Tab Inline Form Interactions
    DOM.btnAddTabPrompt.addEventListener('click', () => {
        DOM.btnAddTabPrompt.classList.add('hidden');
        DOM.formAddTab.classList.remove('hidden');
        DOM.inputNewTab.focus();
    });
    
    DOM.btnCancelTab.addEventListener('click', () => {
        DOM.formAddTab.classList.add('hidden');
        DOM.btnAddTabPrompt.classList.remove('hidden');
        DOM.inputNewTab.value = '';
    });
    
    DOM.formAddTab.addEventListener('submit', (e) => {
        e.preventDefault();
        const tabName = DOM.inputNewTab.value;
        addTab(tabName);
        DOM.formAddTab.classList.add('hidden');
        DOM.btnAddTabPrompt.classList.remove('hidden');
        DOM.inputNewTab.value = '';
    });
    
    // Add Notebook Inline Form Interactions
    DOM.btnAddNotebookPrompt.addEventListener('click', () => {
        DOM.btnAddNotebookPrompt.classList.add('hidden');
        DOM.formAddNotebook.classList.remove('hidden');
        DOM.inputNewNotebook.focus();
    });
    
    DOM.btnCancelNotebook.addEventListener('click', () => {
        DOM.formAddNotebook.classList.add('hidden');
        DOM.btnAddNotebookPrompt.classList.remove('hidden');
        DOM.inputNewNotebook.value = '';
    });
    
    DOM.formAddNotebook.addEventListener('submit', (e) => {
        e.preventDefault();
        const notebookName = DOM.inputNewNotebook.value;
        addNotebook(notebookName);
        DOM.formAddNotebook.classList.add('hidden');
        DOM.btnAddNotebookPrompt.classList.remove('hidden');
        DOM.inputNewNotebook.value = '';
    });
    
    // Clear Completed click
    DOM.btnClearCompleted.addEventListener('click', () => {
        clearCompletedInActiveTab();
    });
    
    // Filter click
    DOM.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            updateFilterUI();
            renderTasks();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    });
    
    // Theme toggle click
    DOM.btnToggleTheme.addEventListener('click', () => {
        toggleTheme();
    });
    
    // Mobile menu toggles
    DOM.btnOpenSidebar.addEventListener('click', openMobileSidebar);
    DOM.btnCloseSidebar.addEventListener('click', closeMobileSidebar);
}

// Utilities
function generateUUID() {
    return 'todo_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Grammar declension helper for Russian language
function getNoun(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}

// Start Application
document.addEventListener('DOMContentLoaded', init);
