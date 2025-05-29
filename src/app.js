class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.init();
    }

    init() {
        this.addBtn = document.getElementById('addBtn');
        this.todoInput = document.getElementById('todoInput');
        this.todoList = document.getElementById('todoList');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.clearAll = document.getElementById('clearAll');
        this.emptyState = document.getElementById('emptyState');
        
        // New enhanced elements
        this.prioritySelect = document.getElementById('prioritySelect');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.customCategoryInput = document.getElementById('customCategoryInput');
        this.searchInput = document.getElementById('searchInput');
        this.priorityFilter = document.getElementById('priorityFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.dueDateFilter = document.getElementById('dueDateFilter');

        this.bindEvents();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.clearCompleted.addEventListener('click', () => this.clearCompleted());
        this.clearAll.addEventListener('click', () => this.clearAll());
        
        // Enhanced features event bindings
        this.categorySelect.addEventListener('change', (e) => {
            const customGroup = document.getElementById('customCategoryGroup');
            if (e.target.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
            }
        });

        // Search and filter functionality
        this.searchInput.addEventListener('input', () => this.filterTodos());
        this.priorityFilter.addEventListener('change', () => this.filterTodos());
        this.categoryFilter.addEventListener('change', () => this.filterTodos());
        this.dueDateFilter.addEventListener('change', () => this.filterTodos());
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (text === '') return;

        const priority = this.prioritySelect.value;
        const dueDate = this.dueDateInput.value;
        let category = this.categorySelect.value;
        
        // Handle custom category
        if (category === 'custom' && this.customCategoryInput.value.trim()) {
            category = this.customCategoryInput.value.trim();
        } else if (category === 'custom') {
            category = '';
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            priority: priority,
            dueDate: dueDate || null,
            category: category
        };

        this.todos.push(todo);
        this.saveTodos();
        this.render();
        this.updateStats();
        
        // Reset form
        this.todoInput.value = '';
        this.dueDateInput.value = '';
        this.categorySelect.value = '';
        this.customCategoryInput.value = '';
        document.getElementById('customCategoryGroup').style.display = 'none';
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    toggleComplete(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.text = newText;
            this.saveTodos();
            this.render();
        }
    }

    getDueDateStatus(dueDate) {
        if (!dueDate) return '';
        
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'overdue';
        if (diffDays === 0) return 'due-today';
        if (diffDays <= 3) return 'due-soon';
        return '';
    }

    getCategoryIcon(category) {
        const icons = {
            'work': '💼',
            'personal': '🏠',
            'shopping': '🛒',
            'health': '💪',
            'study': '📚'
        };
        return icons[category] || '📝';
    }

    formatDueDate(dueDate) {
        if (!dueDate) return '';
        
        const date = new Date(dueDate);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `⚠️ ${Math.abs(diffDays)}日前に期限切れ`;
        } else if (diffDays === 0) {
            return '📅 今日が期限';
        } else if (diffDays === 1) {
            return '📅 明日が期限';
        } else {
            return `📅 ${diffDays}日後`;
        }
    }

    filterTodos() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const priorityFilter = this.priorityFilter.value;
        const categoryFilter = this.categoryFilter.value;
        const dueDateFilter = this.dueDateFilter.value;

        let filtered = this.todos.filter(todo => {
            // Text search
            const matchesSearch = todo.text.toLowerCase().includes(searchTerm);
            
            // Priority filter
            const matchesPriority = !priorityFilter || todo.priority === priorityFilter;
            
            // Category filter
            const matchesCategory = !categoryFilter || todo.category === categoryFilter;
            
            // Due date filter
            let matchesDueDate = true;
            if (dueDateFilter) {
                const status = this.getDueDateStatus(todo.dueDate);
                switch (dueDateFilter) {
                    case 'overdue':
                        matchesDueDate = status === 'overdue';
                        break;
                    case 'today':
                        matchesDueDate = status === 'due-today';
                        break;
                    case 'week':
                        matchesDueDate = ['due-today', 'due-soon'].includes(status);
                        break;
                    case 'nodate':
                        matchesDueDate = !todo.dueDate;
                        break;
                }
            }
            
            return matchesSearch && matchesPriority && matchesCategory && matchesDueDate;
        });

        this.renderFiltered(filtered);
    }

    renderFiltered(todos) {
        this.todoList.innerHTML = '';
        
        if (todos.length === 0) {
            this.emptyState.classList.add('show');
            return;
        }
        
        this.emptyState.classList.remove('show');
        
        todos.forEach(todo => {
            const li = this.createTodoElement(todo);
            this.todoList.appendChild(li);
        });
    }

    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item priority-${todo.priority}`;
        li.dataset.id = todo.id;
        
        const dueDateStatus = this.getDueDateStatus(todo.dueDate);
        if (dueDateStatus) {
            li.classList.add(dueDateStatus);
        }
        
        if (todo.completed) {
            li.classList.add('completed');
        }

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <div class="todo-details">
                <div class="todo-main">
                    <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                </div>
                <div class="todo-meta">
                    <span class="priority-badge">${this.getPriorityText(todo.priority)}</span>
                    ${todo.category ? `<span class="category-badge">${this.getCategoryIcon(todo.category)} ${todo.category}</span>` : ''}
                    ${todo.dueDate ? `<span class="due-date ${dueDateStatus}">${this.formatDueDate(todo.dueDate)}</span>` : ''}
                </div>
            </div>
            <button class="delete-btn">🗑️</button>
        `;

        // Event listeners
        const checkbox = li.querySelector('.todo-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');
        const todoText = li.querySelector('.todo-text');

        checkbox.addEventListener('change', () => this.toggleComplete(todo.id));
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
        
        todoText.addEventListener('dblclick', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = todo.text;
            input.className = 'todo-text editing';
            
            todoText.parentNode.replaceChild(input, todoText);
            input.focus();
            input.select();
            
            const saveEdit = () => {
                const newText = input.value.trim();
                if (newText && newText !== todo.text) {
                    this.editTodo(todo.id, newText);
                } else {
                    this.render();
                }
            };
            
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveEdit();
            });
        });

        return li;
    }

    getPriorityText(priority) {
        const priorities = {
            'high': '🔴 高',
            'medium': '🟡 中',
            'low': '🟢 低'
        };
        return priorities[priority] || '🟡 中';
    }

    render() {
        this.todoList.innerHTML = '';
        
        if (this.todos.length === 0) {
            this.emptyState.classList.add('show');
            return;
        }
        
        this.emptyState.classList.remove('show');
        
        // Sort todos by priority and due date
        const sortedTodos = this.todos.sort((a, b) => {
            // Priority order: high -> medium -> low
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // If same priority, sort by due date (earliest first)
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            
            // If no due dates, sort by creation time
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        sortedTodos.forEach(todo => {
            const li = this.createTodoElement(todo);
            this.todoList.appendChild(li);
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalTasks').textContent = `全タスク: ${total}`;
        document.getElementById('completedTasks').textContent = `完了: ${completed}`;
        document.getElementById('pendingTasks').textContent = `未完了: ${pending}`;
        
        // Update action buttons
        this.clearCompleted.disabled = completed === 0;
        this.clearAll.disabled = total === 0;
    }

    clearCompleted() {
        this.todos = this.todos.filter(todo => !todo.completed);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    clearAll() {
        if (confirm('すべてのタスクを削除しますか？この操作は取り消せません。')) {
            this.todos = [];
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});