// Application State Management
const STATE_KEY = 'zentodo_state';
const THEME_KEY = 'zentodo_theme';

// Default State if no local storage is found
const defaultState = {
    tabs: ['Работа', 'Личное', 'Покупки'],
    notebooks: ['Идеи', 'Разное'],
    activeTab: 'Работа',
    todos: [

    ],
    notes: [

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
    btnCancelNotebook: document.getElementById('btn-cancel-notebook'),
    btnExportPdf: document.getElementById('btn-export-pdf'),
    btnExportListPdf: document.getElementById('btn-export-list-pdf')
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

    // Export PDF click
    if (DOM.btnExportPdf) {
        DOM.btnExportPdf.addEventListener('click', exportToPDF);
    }

    // Export List PDF click
    if (DOM.btnExportListPdf) {
        DOM.btnExportListPdf.addEventListener('click', exportListToPDF);
    }
}

// PDF Export Function
function exportToPDF() {
    const btn = DOM.btnExportPdf;
    if (!btn || btn.classList.contains('loading')) return;
    
    // Save original button content
    const originalHTML = btn.innerHTML;
    
    // Check if html2pdf library is available
    if (typeof html2pdf === 'undefined') {
        alert('Библиотека для генерации PDF еще загружается. Пожалуйста, подождите несколько секунд и попробуйте снова.');
        return;
    }
    
    // Set loading state
    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Генерация...</span>`;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Calculate statistics
    const totalTabsCount = state.tabs.length;
    const totalNotebooksCount = state.notebooks.length;
    const totalTasksCount = state.todos.length;
    const completedTasksCount = state.todos.filter(t => t.completed).length;
    const activeTasksCount = totalTasksCount - completedTasksCount;
    const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    const totalNotesCount = state.notes.length;
    
    // Date formatting
    const genDate = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construct the HTML for the PDF
    const element = document.createElement('div');
    element.className = 'pdf-export-wrapper';
    
    let contentHTML = `
    <div class="pdf-report">
        <style>
            .pdf-report {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #1e293b;
                line-height: 1.5;
                padding: 10px;
                background: #ffffff;
            }
            .pdf-header {
                border-bottom: 2px solid #7c3aed;
                padding-bottom: 16px;
                margin-bottom: 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .pdf-logo {
                font-family: 'Outfit', sans-serif;
                font-size: 1.6rem;
                font-weight: 700;
                color: #7c3aed;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .pdf-logo-box {
                background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 1.1rem;
            }
            .pdf-meta {
                text-align: right;
                font-size: 0.8rem;
                color: #64748b;
            }
            .pdf-title {
                font-family: 'Outfit', sans-serif;
                font-size: 2rem;
                font-weight: 800;
                margin-bottom: 6px;
                color: #0f172a;
                margin-top: 0;
            }
            .pdf-subtitle {
                font-size: 1rem;
                color: #475569;
                margin-bottom: 24px;
                margin-top: 0;
            }
            .pdf-stats-grid {
                display: flex;
                gap: 16px;
                margin-bottom: 30px;
                width: 100%;
            }
            .pdf-stat-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 12px;
                border-radius: 8px;
                flex: 1;
                text-align: center;
            }
            .pdf-stat-val {
                font-size: 1.5rem;
                font-weight: 700;
                color: #7c3aed;
                margin-bottom: 2px;
            }
            .pdf-stat-lbl {
                font-size: 0.75rem;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .pdf-section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .pdf-section-title {
                font-family: 'Outfit', sans-serif;
                font-size: 1.25rem;
                font-weight: 700;
                color: #0f172a;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 6px;
                margin-bottom: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 0;
            }
            .pdf-badge-category {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                background: #f1f5f9;
                color: #475569;
                margin-left: auto;
            }
            .pdf-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 16px;
            }
            .pdf-table th {
                background: #f8fafc;
                text-align: left;
                padding: 8px 10px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #475569;
                border-bottom: 2px solid #e2e8f0;
            }
            .pdf-table td {
                padding: 10px 10px;
                font-size: 0.85rem;
                border-bottom: 1px solid #f1f5f9;
                color: #334155;
            }
            .pdf-table tr {
                page-break-inside: avoid;
            }
            .pdf-badge-priority {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                display: inline-block;
            }
            .pdf-badge-priority.high {
                background: #ffe4e6;
                color: #e11d48;
            }
            .pdf-badge-priority.medium {
                background: #fef3c7;
                color: #d97706;
            }
            .pdf-badge-priority.none {
                background: #f1f5f9;
                color: #64748b;
            }
            .pdf-badge-status {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                display: inline-block;
            }
            .pdf-badge-status.completed {
                background: #dcfce7;
                color: #15803d;
            }
            .pdf-badge-status.active {
                background: #f1f5f9;
                color: #475569;
            }
            .pdf-notes-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .pdf-note-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-left: 4px solid #cbd5e1;
                padding: 12px;
                border-radius: 6px;
                page-break-inside: avoid;
            }
            .pdf-note-card.color-purple { border-left-color: #8b5cf6; }
            .pdf-note-card.color-blue { border-left-color: #3b82f6; }
            .pdf-note-card.color-green { border-left-color: #10b981; }
            .pdf-note-card.color-yellow { border-left-color: #f59e0b; }
            .pdf-note-card.color-red { border-left-color: #ef4444; }

            .pdf-note-title {
                font-family: 'Outfit', sans-serif;
                font-size: 0.95rem;
                font-weight: 600;
                color: #0f172a;
                margin-bottom: 4px;
                margin-top: 0;
            }
            .pdf-note-content {
                font-size: 0.85rem;
                color: #334155;
                white-space: pre-wrap;
                margin-bottom: 6px;
                word-break: break-word;
            }
            .pdf-note-meta {
                font-size: 0.7rem;
                color: #94a3b8;
            }
            .page-break {
                page-break-before: always;
            }
        </style>

        <div class="pdf-header">
            <div class="pdf-logo">
                <div class="pdf-logo-box">✓</div>
                <span>ZenTodo</span>
            </div>
            <div class="pdf-meta">
                <div>Дата создания: ${genDate}</div>
                <div>Создано в ZenTodo</div>
            </div>
        </div>

        <h1 class="pdf-title">Сводный отчет задач и заметок</h1>
        <p class="pdf-subtitle">Подробный список всех запланированных дел и сохраненных мыслей</p>

        <div class="pdf-stats-grid">
            <div class="pdf-stat-card">
                <div class="pdf-stat-val">${totalTasksCount}</div>
                <div class="pdf-stat-lbl">Всего задач</div>
            </div>
            <div class="pdf-stat-card">
                <div class="pdf-stat-val">${completionRate}%</div>
                <div class="pdf-stat-lbl">Выполнено</div>
            </div>
            <div class="pdf-stat-card">
                <div class="pdf-stat-val">${totalNotesCount}</div>
                <div class="pdf-stat-lbl">Заметок</div>
            </div>
        </div>
    `;

    // Handle completely empty state
    if (totalTasksCount === 0 && totalNotesCount === 0) {
        contentHTML += `
            <div style="text-align: center; padding: 40px 20px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">📋</div>
                <h3 style="font-size: 1.15rem; font-weight: 600; color: #0f172a; margin-bottom: 6px; margin-top: 0;">Данные отсутствуют</h3>
                <p style="margin: 0; font-size: 0.9rem;">Создайте хотя бы одну задачу или заметку, чтобы сгенерировать подробный список.</p>
            </div>
        `;
    } else {
        // Iterate through each normal Todo Tab
        state.tabs.forEach((tabName, index) => {
            const tabTodos = state.todos.filter(t => t.tab === tabName);
            const tabNotes = state.notes.filter(n => n.tab === tabName);
            
            // Skip tabs that have absolutely no content to keep report clean,
            // unless all lists are empty, but we check contents first.
            if (tabTodos.length === 0 && tabNotes.length === 0) return;

            contentHTML += `
            <div class="pdf-section">
                <h2 class="pdf-section-title">
                    <span>📁</span> ${escapeHTML(tabName)}
                    <span class="pdf-badge-category">Список задач</span>
                </h2>
            `;
            
            // Render Tasks Table if any
            if (tabTodos.length > 0) {
                contentHTML += `
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Задача</th>
                            <th style="width: 15%;">Приоритет</th>
                            <th style="width: 15%;">Статус</th>
                            <th style="width: 20%;">Создано</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                
                // Sort similar to standard render
                const sortedTodos = [...tabTodos].sort((a, b) => {
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
                
                sortedTodos.forEach(todo => {
                    const priorityText = priorityLabels[todo.priority] || 'Обычный';
                    const statusText = todo.completed ? 'Выполнено' : 'Активно';
                    const statusClass = todo.completed ? 'completed' : 'active';
                    const priorityClass = todo.priority || 'none';
                    
                    contentHTML += `
                        <tr>
                            <td style="font-weight: 500; ${todo.completed ? 'text-decoration: line-through; color: #94a3b8;' : ''}">${escapeHTML(todo.text)}</td>
                            <td><span class="pdf-badge-priority ${priorityClass}">${priorityText}</span></td>
                            <td><span class="pdf-badge-status ${statusClass}">${statusText}</span></td>
                            <td style="font-size: 0.8rem; color: #64748b;">${formatDate(todo.createdAt)}</td>
                        </tr>
                    `;
                });
                
                contentHTML += `
                    </tbody>
                </table>
                `;
            } else {
                contentHTML += `<p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin-bottom: 16px;">Нет задач в этом списке.</p>`;
            }
            
            // Render Notes inside this tab if any
            if (tabNotes.length > 0) {
                contentHTML += `<h3 style="font-size: 0.9rem; font-weight: 600; color: #475569; margin-bottom: 8px; margin-top: 14px;">Заметки списка:</h3>`;
                contentHTML += `<div class="pdf-notes-list">`;
                
                const sortedNotes = [...tabNotes].sort((a, b) => b.createdAt - a.createdAt);
                sortedNotes.forEach(note => {
                    contentHTML += `
                        <div class="pdf-note-card color-${note.color || 'none'}">
                            ${note.title ? `<div class="pdf-note-title">${escapeHTML(note.title)}</div>` : ''}
                            <div class="pdf-note-content">${escapeHTML(note.content)}</div>
                            <div class="pdf-note-meta">Создана: ${formatDate(note.createdAt)}</div>
                        </div>
                    `;
                });
                
                contentHTML += `</div>`;
            }
            
            contentHTML += `</div>`;
        });
        
        // Iterate through Notebooks
        let notebooksHeaderAdded = false;
        state.notebooks.forEach(notebookName => {
            const notebookNotes = state.notes.filter(n => n.tab === notebookName);
            if (notebookNotes.length === 0) return; // Skip empty notebooks
            
            if (!notebooksHeaderAdded) {
                // Add page break before notebooks section
                contentHTML += `<div class="page-break"></div>`;
                contentHTML += `<h1 class="pdf-title" style="margin-top: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 20px;">Блокноты</h1>`;
                notebooksHeaderAdded = true;
            }
            
            contentHTML += `
            <div class="pdf-section">
                <h2 class="pdf-section-title">
                    <span>📖</span> ${escapeHTML(notebookName)}
                    <span class="pdf-badge-category">Блокнот</span>
                </h2>
                <div class="pdf-notes-list">
            `;
            
            const sortedNotes = [...notebookNotes].sort((a, b) => b.createdAt - a.createdAt);
            sortedNotes.forEach(note => {
                contentHTML += `
                    <div class="pdf-note-card color-${note.color || 'none'}">
                        ${note.title ? `<div class="pdf-note-title">${escapeHTML(note.title)}</div>` : ''}
                        <div class="pdf-note-content">${escapeHTML(note.content)}</div>
                        <div class="pdf-note-meta">Создана: ${formatDate(note.createdAt)}</div>
                    </div>
                `;
            });
            
            contentHTML += `
                </div>
            </div>
            `;
        });
    }

    contentHTML += `</div>`;
    element.innerHTML = contentHTML;
    
    // Set configuration for html2pdf
    const cleanDateString = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    const options = {
        margin: [10, 10, 10, 10],
        filename: `ZenTodo_Отчет_${cleanDateString}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate and download PDF
    html2pdf().set(options).from(element).save().then(() => {
        // Success state
        btn.innerHTML = `<i data-lucide="check"></i><span>Готово!</span>`;
        btn.style.background = 'var(--success)';
        btn.style.boxShadow = '0 4px 12px var(--success-bg)';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            // Restore button to original state
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('loading');
            btn.style.background = '';
            btn.style.boxShadow = '';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 2000);
    }).catch(err => {
        console.error('Ошибка экспорта в PDF:', err);
        alert('Произошла ошибка при экспорте в PDF. Пожалуйста, попробуйте еще раз.');
        
        // Restore button state
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        btn.classList.remove('loading');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

// Export Single List to PDF
function exportListToPDF() {
    const btn = DOM.btnExportListPdf;
    if (!btn || btn.classList.contains('loading')) return;
    
    // Save original button content
    const originalHTML = btn.innerHTML;
    
    // Check if html2pdf library is available
    if (typeof html2pdf === 'undefined') {
        alert('Библиотека для генерации PDF еще загружается. Пожалуйста, подождите несколько секунд и попробуйте снова.');
        return;
    }
    
    // Set loading state
    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Генерация...</span>`;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    const activeTab = state.activeTab;
    const isNotebook = state.notebooks.includes(activeTab);
    
    // Calculate statistics for the active tab
    const tabTodos = state.todos.filter(t => t.tab === activeTab);
    const tabNotes = state.notes.filter(n => n.tab === activeTab);
    
    const totalTasksCount = tabTodos.length;
    const completedTasksCount = tabTodos.filter(t => t.completed).length;
    const activeTasksCount = totalTasksCount - completedTasksCount;
    const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    const totalNotesCount = tabNotes.length;
    
    // Date formatting
    const genDate = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construct the HTML for the PDF
    const element = document.createElement('div');
    element.className = 'pdf-export-wrapper';
    
    let contentHTML = `
    <div class="pdf-report">
        <style>
            .pdf-report {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #1e293b;
                line-height: 1.5;
                padding: 10px;
                background: #ffffff;
            }
            .pdf-header {
                border-bottom: 2px solid #7c3aed;
                padding-bottom: 16px;
                margin-bottom: 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .pdf-logo {
                font-family: 'Outfit', sans-serif;
                font-size: 1.6rem;
                font-weight: 700;
                color: #7c3aed;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .pdf-logo-box {
                background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 1.1rem;
            }
            .pdf-meta {
                text-align: right;
                font-size: 0.8rem;
                color: #64748b;
            }
            .pdf-title {
                font-family: 'Outfit', sans-serif;
                font-size: 2rem;
                font-weight: 800;
                margin-bottom: 6px;
                color: #0f172a;
                margin-top: 0;
            }
            .pdf-subtitle {
                font-size: 1rem;
                color: #475569;
                margin-bottom: 24px;
                margin-top: 0;
            }
            .pdf-stats-grid {
                display: flex;
                gap: 16px;
                margin-bottom: 30px;
                width: 100%;
            }
            .pdf-stat-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 12px;
                border-radius: 8px;
                flex: 1;
                text-align: center;
            }
            .pdf-stat-val {
                font-size: 1.5rem;
                font-weight: 700;
                color: #7c3aed;
                margin-bottom: 2px;
            }
            .pdf-stat-lbl {
                font-size: 0.75rem;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .pdf-section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .pdf-section-title {
                font-family: 'Outfit', sans-serif;
                font-size: 1.25rem;
                font-weight: 700;
                color: #0f172a;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 6px;
                margin-bottom: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 0;
            }
            .pdf-badge-category {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                background: #f1f5f9;
                color: #475569;
                margin-left: auto;
            }
            .pdf-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 16px;
            }
            .pdf-table th {
                background: #f8fafc;
                text-align: left;
                padding: 8px 10px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #475569;
                border-bottom: 2px solid #e2e8f0;
            }
            .pdf-table td {
                padding: 10px 10px;
                font-size: 0.85rem;
                border-bottom: 1px solid #f1f5f9;
                color: #334155;
            }
            .pdf-table tr {
                page-break-inside: avoid;
            }
            .pdf-badge-priority {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                display: inline-block;
            }
            .pdf-badge-priority.high {
                background: #ffe4e6;
                color: #e11d48;
            }
            .pdf-badge-priority.medium {
                background: #fef3c7;
                color: #d97706;
            }
            .pdf-badge-priority.none {
                background: #f1f5f9;
                color: #64748b;
            }
            .pdf-badge-status {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                display: inline-block;
            }
            .pdf-badge-status.completed {
                background: #dcfce7;
                color: #15803d;
            }
            .pdf-badge-status.active {
                background: #f1f5f9;
                color: #475569;
            }
            .pdf-notes-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .pdf-note-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-left: 4px solid #cbd5e1;
                padding: 12px;
                border-radius: 6px;
                page-break-inside: avoid;
            }
            .pdf-note-card.color-purple { border-left-color: #8b5cf6; }
            .pdf-note-card.color-blue { border-left-color: #3b82f6; }
            .pdf-note-card.color-green { border-left-color: #10b981; }
            .pdf-note-card.color-yellow { border-left-color: #f59e0b; }
            .pdf-note-card.color-red { border-left-color: #ef4444; }

            .pdf-note-title {
                font-family: 'Outfit', sans-serif;
                font-size: 0.95rem;
                font-weight: 600;
                color: #0f172a;
                margin-bottom: 4px;
                margin-top: 0;
            }
            .pdf-note-content {
                font-size: 0.85rem;
                color: #334155;
                white-space: pre-wrap;
                margin-bottom: 6px;
                word-break: break-word;
            }
            .pdf-note-meta {
                font-size: 0.7rem;
                color: #94a3b8;
            }
        </style>

        <div class="pdf-header">
            <div class="pdf-logo">
                <div class="pdf-logo-box">✓</div>
                <span>ZenTodo</span>
            </div>
            <div class="pdf-meta">
                <div>Дата генерации: ${genDate}</div>
                <div>Создано в ZenTodo</div>
            </div>
        </div>

        <h1 class="pdf-title">Отчет по списку: ${escapeHTML(activeTab)}</h1>
        <p class="pdf-subtitle">Список задач ${!isNotebook ? 'и заметок ' : ''}категории "${escapeHTML(activeTab)}"</p>

        <div class="pdf-stats-grid">
            ${!isNotebook ? `
            <div class="pdf-stat-card">
                <div class="pdf-stat-val">${totalTasksCount}</div>
                <div class="pdf-stat-lbl">Всего задач</div>
            </div>
            <div class="pdf-stat-card">
                <div class="pdf-stat-val">${completionRate}%</div>
                <div class="pdf-stat-lbl">Выполнено</div>
            </div>
            ` : ''}
            <div class="pdf-stat-card">
                <div class="pdf-stat-val">${totalNotesCount}</div>
                <div class="pdf-stat-lbl">Заметок</div>
            </div>
        </div>
    `;

    // Handle empty list case
    if (totalTasksCount === 0 && totalNotesCount === 0) {
        contentHTML += `
            <div style="text-align: center; padding: 40px 20px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">📋</div>
                <h3 style="font-size: 1.15rem; font-weight: 600; color: #0f172a; margin-bottom: 6px; margin-top: 0;">Список пуст</h3>
                <p style="margin: 0; font-size: 0.9rem;">В этом списке пока нет ни одной задачи или заметки.</p>
            </div>
        `;
    } else {
        // Render Tasks Section if not empty and not a notebook
        if (!isNotebook) {
            contentHTML += `
            <div class="pdf-section">
                <h2 class="pdf-section-title">
                    <span>📁</span> Задачи списка
                    <span class="pdf-badge-category">Задачи</span>
                </h2>
            `;
            
            if (totalTasksCount > 0) {
                contentHTML += `
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Задача</th>
                            <th style="width: 15%;">Приоритет</th>
                            <th style="width: 15%;">Статус</th>
                            <th style="width: 20%;">Создано</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                
                // Sort tasks: Active first, then Completed, then by priority weight, then by creation date descending
                const sortedTodos = [...tabTodos].sort((a, b) => {
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
                
                sortedTodos.forEach(todo => {
                    const priorityText = priorityLabels[todo.priority] || 'Обычный';
                    const statusText = todo.completed ? 'Выполнено' : 'Активно';
                    const statusClass = todo.completed ? 'completed' : 'active';
                    const priorityClass = todo.priority || 'none';
                    
                    contentHTML += `
                        <tr>
                            <td style="font-weight: 500; ${todo.completed ? 'text-decoration: line-through; color: #94a3b8;' : ''}">${escapeHTML(todo.text)}</td>
                            <td><span class="pdf-badge-priority ${priorityClass}">${priorityText}</span></td>
                            <td><span class="pdf-badge-status ${statusClass}">${statusText}</span></td>
                            <td style="font-size: 0.8rem; color: #64748b;">${formatDate(todo.createdAt)}</td>
                        </tr>
                    `;
                });
                
                contentHTML += `
                    </tbody>
                </table>
                `;
            } else {
                contentHTML += `<p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin-bottom: 16px;">В этом списке задач пока нет.</p>`;
            }
            contentHTML += `</div>`;
        }

        // Render Notes Section if any
        if (totalNotesCount > 0) {
            contentHTML += `
            <div class="pdf-section">
                <h2 class="pdf-section-title">
                    <span>📖</span> Заметки списка
                    <span class="pdf-badge-category">Заметки</span>
                </h2>
                <div class="pdf-notes-list">
            `;
            
            const sortedNotes = [...tabNotes].sort((a, b) => b.createdAt - a.createdAt);
            sortedNotes.forEach(note => {
                contentHTML += `
                    <div class="pdf-note-card color-${note.color || 'none'}">
                        ${note.title ? `<div class="pdf-note-title">${escapeHTML(note.title)}</div>` : ''}
                        <div class="pdf-note-content">${escapeHTML(note.content)}</div>
                        <div class="pdf-note-meta">Создана: ${formatDate(note.createdAt)}</div>
                    </div>
                `;
            });
            
            contentHTML += `
                </div>
            </div>
            `;
        }
    }
    
    contentHTML += `</div>`;
    element.innerHTML = contentHTML;
    
    // Set configuration for html2pdf
    const cleanDateString = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    const options = {
        margin: [10, 10, 10, 10],
        filename: `ZenTodo_Список_${activeTab}_${cleanDateString}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate and download PDF
    html2pdf().set(options).from(element).save().then(() => {
        // Success state
        btn.innerHTML = `<i data-lucide="check"></i><span>Готово!</span>`;
        btn.classList.add('success');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            // Restore button to original state
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('loading', 'success');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 2000);
    }).catch(err => {
        console.error('Ошибка экспорта списка в PDF:', err);
        alert('Произошла ошибка при экспорте списка в PDF. Пожалуйста, попробуйте еще раз.');
        
        // Restore button state
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        btn.classList.remove('loading', 'success');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
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
