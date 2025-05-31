// Task management system
class ESIFilter {
    constructor() {
        console.log('ESIFilter constructor called'); // Debug log
        this.tasks = [];
        this.loadTasksFromStorage();
        this.initializeEventListeners();
        this.renderTasks();
        
        // Set initial layout (will be updated by renderTasks)
        const mainGrid = document.querySelector('.main-grid');
        if (mainGrid) {
            mainGrid.classList.add('two-columns'); // Default to two columns
        }
        
        console.log('ESIFilter initialized'); // Debug log
    }

    initializeEventListeners() {
        const taskForm = document.getElementById('task-form');
        console.log('Task form found:', taskForm); // Debug log
        
        taskForm.addEventListener('submit', (e) => {
            console.log('Form submitted'); // Debug log
            e.preventDefault();
            this.addBrainDumpTasks();
        });
    }

    addBrainDumpTasks() {
        console.log('addBrainDumpTasks called'); // Debug log
        const brainDumpText = document.getElementById('brain-dump-text');
        
        if (!brainDumpText) {
            console.error('brain-dump-text element not found');
            return;
        }
        
        const text = brainDumpText.value;
        console.log('Textarea content:', text); // Debug log
        
        // Split the input by newline (\n) to create an array of tasks
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line !== ''); // Filter out empty or whitespace-only lines
        
        console.log('Parsed lines:', lines); // Debug log
        
        if (lines.length === 0) {
            alert('Please enter at least one task');
            return;
        }
        
        // Create a task object for each line
        const newTasks = lines.map(line => ({
            id: Date.now() + Math.random(), // for uniqueness
            title: line, // task text
            name: line, // keeping both for compatibility
            status: 'unrated',
            dateCreated: new Date().toISOString(),
            createdAt: new Date(), // keeping for compatibility
            excitement: null,
            simplicity: null,
            impact: null,
            score: null,
            notes: ""
        }));
        
        console.log('New tasks created:', newTasks); // Debug log
        
        // Add the resulting tasks to the main task array
        this.tasks = [...this.tasks, ...newTasks];
        
        // Save and render
        this.saveTasksToStorage();
        this.renderTasks();
        
        // Clear the textarea after submission
        brainDumpText.value = '';
        
        // Show success feedback
        this.showSuccessFeedback(`✅ ${lines.length} task${lines.length === 1 ? '' : 's'} added to rating queue!`);
        
        // Focus back on textarea
        brainDumpText.focus();
    }

    sortTasks() {
        this.tasks.sort((a, b) => b.score - a.score);
    }

    updateTaskStatus(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Update status based on current state
            if (task.status === 'start') {
                task.status = 'in-progress';
            } else if (task.status === 'in-progress') {
                task.status = 'complete';
                // Add completion date
                task.completedDate = new Date().toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                });
            }
            // If already complete, do nothing
            
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            this.tasks.splice(taskIndex, 1);
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    toggleNotes(taskId) {
        const notesPanel = document.getElementById(`notes-panel-${taskId}`);
        const textarea = document.getElementById(`notes-textarea-${taskId}`);
        
        if (notesPanel.style.display === 'none') {
            // Show notes panel
            notesPanel.style.display = 'block';
            textarea.focus();
            // Store original value for cancel functionality
            textarea.setAttribute('data-original-value', textarea.value);
        } else {
            // Hide notes panel
            notesPanel.style.display = 'none';
        }
    }

    saveNotes(taskId) {
        const textarea = document.getElementById(`notes-textarea-${taskId}`);
        const notesPanel = document.getElementById(`notes-panel-${taskId}`);
        
        // Find and update the task
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            this.tasks[taskIndex].notes = textarea.value;
            this.saveTasksToStorage();
            
            // Hide notes panel
            notesPanel.style.display = 'none';
            
            // Re-render to update the notes button icon
            this.renderTasks();
            
            // Show success feedback
            this.showSuccessFeedback('📝 Notes saved!');
        }
    }

    cancelNotes(taskId) {
        const textarea = document.getElementById(`notes-textarea-${taskId}`);
        const notesPanel = document.getElementById(`notes-panel-${taskId}`);
        
        // Restore original value
        const originalValue = textarea.getAttribute('data-original-value');
        textarea.value = originalValue;
        
        // Hide notes panel
        notesPanel.style.display = 'none';
    }

    toggleCompletedNotes(taskId) {
        const truncatedText = document.getElementById(`notes-text-${taskId}`);
        const fullText = document.getElementById(`notes-full-${taskId}`);
        const toggleBtn = document.getElementById(`notes-toggle-${taskId}`);
        
        if (fullText.style.display === 'none') {
            // Show full notes
            truncatedText.style.display = 'none';
            fullText.style.display = 'block';
            toggleBtn.textContent = 'Show Less';
        } else {
            // Show truncated notes
            truncatedText.style.display = 'block';
            fullText.style.display = 'none';
            toggleBtn.textContent = 'View Full Notes';
        }
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        const taskCount = document.getElementById('task-count');
        const completedTasksSection = document.getElementById('completed-tasks-section');
        const completedTasksContainer = document.getElementById('completed-tasks-container');
        const completedTaskCount = document.getElementById('completed-task-count');
        const mainGrid = document.querySelector('.main-grid');

        // Separate tasks by status
        const activeTasks = this.tasks.filter(task => task.status !== 'complete' && task.status !== 'unrated');
        const completedTasks = this.tasks.filter(task => task.status === 'complete');
        const unratedTasks = this.tasks.filter(task => task.status === 'unrated');

        // Handle middle column - completely remove/add from DOM
        let toBeRatedSection = document.getElementById('to-be-rated-section');
        
        if (unratedTasks.length > 0) {
            // Create middle column if it doesn't exist
            if (!toBeRatedSection) {
                toBeRatedSection = this.createToBeRatedSection();
                // Insert between input section and tasks section
                const tasksSection = document.querySelector('.tasks-section');
                mainGrid.insertBefore(toBeRatedSection, tasksSection);
            }
            
            // Set three-column layout - equal widths
            mainGrid.classList.remove('two-columns');
            mainGrid.classList.add('three-columns');
            // Force grid template explicitly - 33% each
            mainGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
            
            // Update unrated tasks content
            const unratedTasksContainer = document.getElementById('unrated-tasks-container');
            const unratedTaskCount = document.getElementById('unrated-task-count');
            
            if (unratedTasksContainer && unratedTaskCount) {
                const unratedCount = unratedTasks.length;
                unratedTaskCount.textContent = unratedCount === 1 ? '1 unrated' : `${unratedCount} unrated`;
                
                // Preserve existing dropdown values before re-rendering
                const preservedValues = {};
                unratedTasks.forEach((task) => {
                    const excitementSelect = document.getElementById(`unrated-excitement-${task.id}`);
                    const simplicitySelect = document.getElementById(`unrated-simplicity-${task.id}`);
                    const impactSelect = document.getElementById(`unrated-impact-${task.id}`);
                    
                    if (excitementSelect || simplicitySelect || impactSelect) {
                        preservedValues[task.id] = {
                            excitement: excitementSelect ? excitementSelect.value : '',
                            simplicity: simplicitySelect ? simplicitySelect.value : '',
                            impact: impactSelect ? impactSelect.value : ''
                        };
                    }
                });
                
                unratedTasksContainer.innerHTML = '';
                unratedTasks.forEach((task) => {
                    const taskElement = this.createUnratedTaskElement(task, preservedValues[task.id]);
                    unratedTasksContainer.appendChild(taskElement);
                });
            }
        } else {
            // Remove middle column completely from DOM
            if (toBeRatedSection) {
                toBeRatedSection.remove();
            }
            
            // Set two-column layout - equal widths
            mainGrid.classList.remove('three-columns');
            mainGrid.classList.add('two-columns');
            // Force grid template explicitly - 50% each
            mainGrid.style.gridTemplateColumns = '1fr 1fr';
        }

        // Update active task count
        const activeCount = activeTasks.length;
        taskCount.textContent = activeCount === 1 ? '1 task' : `${activeCount} tasks`;

        // Clear active tasks container
        tasksContainer.innerHTML = '';

        if (activeTasks.length === 0) {
            // Show empty state for active tasks
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No tasks yet</h3>
                    <p>Rated tasks will appear here prioritized by ESI score!</p>
                </div>
            `;
        } else {
            // Render each active task
            activeTasks.forEach((task, index) => {
                const taskElement = this.createTaskElement(task, index);
                tasksContainer.appendChild(taskElement);
            });
        }

        // Handle completed tasks section
        if (completedTasks.length > 0) {
            // Show completed tasks section
            completedTasksSection.classList.remove('hidden');
            
            // Update completed task count
            const completedCount = completedTasks.length;
            completedTaskCount.textContent = completedCount === 1 ? '1 completed' : `${completedCount} completed`;
            
            // Clear and render completed tasks
            completedTasksContainer.innerHTML = '';
            completedTasks.forEach((task) => {
                const taskElement = this.createCompletedTaskElement(task);
                completedTasksContainer.appendChild(taskElement);
            });
        } else {
            // Hide completed tasks section if no completed tasks
            completedTasksSection.classList.add('hidden');
        }
    }

    createTaskElement(task, index) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.setAttribute('data-task-id', task.id);

        // Use title if available, fall back to name for compatibility
        const taskName = task.title || task.name;

        // Add priority indicator based on position
        let priorityText = '';
        let priorityColor = '#6b7280';
        if (index === 0) {
            priorityText = '🏆 Highest Priority';
            priorityColor = '#f59e0b';
        } else if (index === 1) {
            priorityText = '🥈 Second Priority';
            priorityColor = '#8b5cf6';
        } else if (index === 2) {
            priorityText = '🥉 Third Priority';
            priorityColor = '#06b6d4';
        }

        // Get status display info
        let statusDisplay, statusButton, statusClass;
        
        switch(task.status) {
            case 'start':
                statusDisplay = '⚪ Ready to Start';
                statusButton = 'Start';
                statusClass = 'status-start';
                break;
            case 'in-progress':
                statusDisplay = '🟡 In Progress';
                statusButton = 'Complete';
                statusClass = 'status-progress';
                break;
            case 'complete':
                statusDisplay = '✅ Completed';
                statusButton = null; // No button for completed tasks
                statusClass = 'status-complete';
                break;
            default:
                statusDisplay = '⚪ Ready to Start';
                statusButton = 'Start';
                statusClass = 'status-start';
        }

        taskDiv.innerHTML = `
            <div class="task-card">
                <div class="delete-btn" onclick="esiFilter.deleteTask(${task.id})" title="Delete task" aria-label="Delete task">
                    <div class="trash-icon">
                        <div class="trash-lid"></div>
                        <div class="trash-body">
                            <div class="trash-lines">
                                <div class="line"></div>
                                <div class="line"></div>
                                <div class="line"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="task-header-compact">
                    <div class="task-name">
                        ${taskName}
                        ${priorityText ? `<div style="font-size: 0.8rem; color: ${priorityColor}; font-weight: 500; margin-top: 0.25rem;">${priorityText}</div>` : ''}
                        ${task.dateCreated ? `<div style="font-size: 0.8rem; color: #6b7280; font-weight: 500; margin-top: 0.25rem;">
                            added ${new Date(task.dateCreated).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: '2-digit'
                            })}
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="task-metrics-top-right">
                    <div class="metric-compact">
                        <div class="metric-label">E</div>
                        <div class="metric-value">${task.excitement}</div>
                    </div>
                    <div class="metric-compact">
                        <div class="metric-label">S</div>
                        <div class="metric-value">${task.simplicity}</div>
                    </div>
                    <div class="metric-compact">
                        <div class="metric-label">I</div>
                        <div class="metric-value">${task.impact}</div>
                    </div>
                    <div class="task-score-right">${task.score}</div>
                </div>
                
                <div class="task-status-row-compact">
                    <div class="task-status ${statusClass}">
                        ${statusDisplay}
                    </div>
                    <div class="task-actions">
                        <button class="notes-btn ${task.notes ? 'has-notes' : ''}" onclick="esiFilter.toggleNotes(${task.id})" title="${task.notes ? 'Edit notes' : 'Add notes'}">
                            ${task.notes ? '✏️' : '📝'}
                        </button>
                        ${statusButton ? `
                            <button class="status-btn-compact" onclick="esiFilter.updateTaskStatus(${task.id})">
                                ${statusButton}
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="notes-panel" id="notes-panel-${task.id}" style="display: none;">
                    <textarea class="notes-textarea" id="notes-textarea-${task.id}" placeholder="Add your notes here...">${task.notes}</textarea>
                    <div class="notes-actions">
                        <button class="notes-save-btn" onclick="esiFilter.saveNotes(${task.id})">Save</button>
                        <button class="notes-cancel-btn" onclick="esiFilter.cancelNotes(${task.id})">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        return taskDiv;
    }

    createCompletedTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'completed-task-item';
        taskDiv.setAttribute('data-task-id', task.id);

        // Use title if available, fall back to name for compatibility
        const taskName = task.title || task.name;

        taskDiv.innerHTML = `
            <div class="task-header-compact">
                <div class="task-name">
                    ${taskName}
                    ${task.completedDate ? `<div style="font-size: 0.8rem; color: #6b7280; font-weight: 500; margin-top: 0.25rem;">
                        completed ${task.completedDate}
                    </div>` : ''}
                </div>
            </div>
            
            <div class="delete-btn" onclick="esiFilter.deleteTask(${task.id})" title="Delete task" aria-label="Delete task">
                <div class="trash-icon">
                    <div class="trash-lid"></div>
                    <div class="trash-body">
                        <div class="trash-lines">
                            <div class="line"></div>
                            <div class="line"></div>
                            <div class="line"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="task-metrics-top-right">
                <div class="metric-compact">
                    <div class="metric-label">E</div>
                    <div class="metric-value">${task.excitement}</div>
                </div>
                <div class="metric-compact">
                    <div class="metric-label">S</div>
                    <div class="metric-value">${task.simplicity}</div>
                </div>
                <div class="metric-compact">
                    <div class="metric-label">I</div>
                    <div class="metric-value">${task.impact}</div>
                </div>
                <div class="task-score-right">${task.score}</div>
            </div>
            
            <div class="completed-task-bottom-row">
                <div></div>
                <div class="task-actions">
                    <button class="notes-btn ${task.notes ? 'has-notes' : ''}" onclick="esiFilter.toggleNotes(${task.id})" title="${task.notes ? 'Edit notes' : 'Add notes'}">
                        ${task.notes ? '✏️' : '📝'}
                    </button>
                </div>
            </div>
            
            <div class="notes-panel" id="notes-panel-${task.id}" style="display: none;">
                <textarea class="notes-textarea" id="notes-textarea-${task.id}" placeholder="Add your notes here...">${task.notes}</textarea>
                <div class="notes-actions">
                    <button class="notes-save-btn" onclick="esiFilter.saveNotes(${task.id})">Save</button>
                    <button class="notes-cancel-btn" onclick="esiFilter.cancelNotes(${task.id})">Cancel</button>
                </div>
            </div>
        `;

        return taskDiv;
    }

    createUnratedTaskElement(task, preservedValues) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'unrated-task-item';
        taskDiv.setAttribute('data-task-id', task.id);

        // Use title if available, fall back to name for compatibility
        const taskName = task.title || task.name;

        taskDiv.innerHTML = `
            <div class="task-card">
                <div class="delete-btn" onclick="esiFilter.deleteTask(${task.id})" title="Delete task" aria-label="Delete task">
                    <div class="trash-icon">
                        <div class="trash-lid"></div>
                        <div class="trash-body">
                            <div class="trash-lines">
                                <div class="line"></div>
                                <div class="line"></div>
                                <div class="line"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="unrated-task-header">
                    <div class="unrated-task-name">${taskName}</div>
                </div>
                <div class="task-row">
                    <div class="input-group">
                        <label>Excitement</label>
                        <select id="unrated-excitement-${task.id}" data-preserved-value="${preservedValues?.excitement || ''}">
                            <option value="">-</option>
                            <option value="1">1 – Dreading it</option>
                            <option value="2">2 – Meh</option>
                            <option value="3">3 – Neutral</option>
                            <option value="4">4 – Pretty Interested</option>
                            <option value="5">5 – Super Excited</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Simplicity</label>
                        <select id="unrated-simplicity-${task.id}" data-preserved-value="${preservedValues?.simplicity || ''}">
                            <option value="">-</option>
                            <option value="1">1 – Complex, several steps</option>
                            <option value="2">2 – Fairly complex</option>
                            <option value="3">3 – Moderate complexity</option>
                            <option value="4">4 – Pretty simple</option>
                            <option value="5">5 – One single step</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Impact</label>
                        <select id="unrated-impact-${task.id}" data-preserved-value="${preservedValues?.impact || ''}">
                            <option value="">-</option>
                            <option value="1">1 – Little to no impact</option>
                            <option value="2">2 – Minimal impact</option>
                            <option value="3">3 – Small impact</option>
                            <option value="4">4 – Moderate impact</option>
                            <option value="5">5 – Noticeable improvement</option>
                            <option value="6">6 – Significant improvement</option>
                            <option value="7">7 – Major improvement</option>
                            <option value="8">8 – Substantial impact</option>
                            <option value="9">9 – Transformative</option>
                            <option value="10">10 – Life changing</option>
                        </select>
                    </div>
                    <button class="rate-button" onclick="esiFilter.rateTask(${task.id})">
                        Rate
                    </button>
                </div>
            </div>
        `;

        // Add event listeners to handle the display logic for rating selects
        setTimeout(() => {
            this.setupRatingSelectHandlers(task.id);
            
            // Restore preserved values if they exist
            if (preservedValues) {
                const excitementSelect = document.getElementById(`unrated-excitement-${task.id}`);
                const simplicitySelect = document.getElementById(`unrated-simplicity-${task.id}`);
                const impactSelect = document.getElementById(`unrated-impact-${task.id}`);
                
                if (excitementSelect && preservedValues.excitement) {
                    excitementSelect.value = preservedValues.excitement;
                    // Trigger display logic
                    if (preservedValues.excitement !== '') {
                        const selectedOption = excitementSelect.options[excitementSelect.selectedIndex];
                        selectedOption.textContent = preservedValues.excitement;
                        excitementSelect.setAttribute('data-display-mode', 'compact');
                    }
                }
                
                if (simplicitySelect && preservedValues.simplicity) {
                    simplicitySelect.value = preservedValues.simplicity;
                    // Trigger display logic
                    if (preservedValues.simplicity !== '') {
                        const selectedOption = simplicitySelect.options[simplicitySelect.selectedIndex];
                        selectedOption.textContent = preservedValues.simplicity;
                        simplicitySelect.setAttribute('data-display-mode', 'compact');
                    }
                }
                
                if (impactSelect && preservedValues.impact) {
                    impactSelect.value = preservedValues.impact;
                    // Trigger display logic
                    if (preservedValues.impact !== '') {
                        const selectedOption = impactSelect.options[impactSelect.selectedIndex];
                        selectedOption.textContent = preservedValues.impact;
                        impactSelect.setAttribute('data-display-mode', 'compact');
                    }
                }
            }
        }, 0);

        return taskDiv;
    }

    setupRatingSelectHandlers(taskId) {
        const excitementSelect = document.getElementById(`unrated-excitement-${taskId}`);
        const simplicitySelect = document.getElementById(`unrated-simplicity-${taskId}`);
        const impactSelect = document.getElementById(`unrated-impact-${taskId}`);

        [excitementSelect, simplicitySelect, impactSelect].forEach(select => {
            if (select) {
                this.setupSelectDisplayHandler(select);
            }
        });
    }

    setupSelectDisplayHandler(selectElement) {
        // Store original option texts
        const originalOptions = {};
        Array.from(selectElement.options).forEach(option => {
            originalOptions[option.value] = option.textContent;
        });

        selectElement.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            if (selectedValue && selectedValue !== '') {
                // Update the selected option to show only the number
                const selectedOption = e.target.options[e.target.selectedIndex];
                selectedOption.textContent = selectedValue;
                
                // Store the display state
                selectElement.setAttribute('data-display-mode', 'compact');
            }
        });

        selectElement.addEventListener('focus', (e) => {
            // Restore full descriptions when dropdown opens
            if (e.target.getAttribute('data-display-mode') === 'compact') {
                Array.from(e.target.options).forEach(option => {
                    if (option.value && originalOptions[option.value]) {
                        option.textContent = originalOptions[option.value];
                    }
                });
            }
        });

        selectElement.addEventListener('blur', (e) => {
            // Show only number when dropdown closes (if something is selected)
            const selectedValue = e.target.value;
            if (selectedValue && selectedValue !== '') {
                const selectedOption = e.target.options[e.target.selectedIndex];
                selectedOption.textContent = selectedValue;
                e.target.setAttribute('data-display-mode', 'compact');
            }
        });
    }

    rateTask(taskId) {
        const excitementSelect = document.getElementById(`unrated-excitement-${taskId}`);
        const simplicitySelect = document.getElementById(`unrated-simplicity-${taskId}`);
        const impactSelect = document.getElementById(`unrated-impact-${taskId}`);

        const excitement = parseInt(excitementSelect.value);
        const simplicity = parseInt(simplicitySelect.value);
        const impact = parseInt(impactSelect.value);

        // Validate
        if (!excitement || !simplicity || !impact) {
            alert('Please rate all three aspects of this task');
            return;
        }

        // Find and update the task
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            task.excitement = excitement;
            task.simplicity = simplicity;
            task.impact = impact;
            task.score = excitement + simplicity + impact;
            task.status = 'start'; // Move to regular tasks

            // Sort tasks by score
            this.sortTasks();
            
            // Save and render
            this.saveTasksToStorage();
            this.renderTasks();
            
            // Use title if available, fall back to name for compatibility
            const taskName = task.title || task.name;
            
            // Show success feedback
            this.showSuccessFeedback(`✅ Task "${taskName}" rated and added to priority list!`);
        }
    }

    rateAllTasks() {
        const unratedTasks = this.tasks.filter(task => task.status === 'unrated');
        const tasksToRate = [];
        
        // Check which tasks have complete ratings
        unratedTasks.forEach(task => {
            const excitementSelect = document.getElementById(`unrated-excitement-${task.id}`);
            const simplicitySelect = document.getElementById(`unrated-simplicity-${task.id}`);
            const impactSelect = document.getElementById(`unrated-impact-${task.id}`);
            
            const excitement = parseInt(excitementSelect?.value);
            const simplicity = parseInt(simplicitySelect?.value);
            const impact = parseInt(impactSelect?.value);
            
            // Only include tasks with all three ratings
            if (excitement && simplicity && impact) {
                tasksToRate.push({
                    task,
                    excitement,
                    simplicity,
                    impact
                });
            }
        });
        
        if (tasksToRate.length === 0) {
            alert('No tasks have complete ratings to process. Please fill out Excitement, Simplicity, and Impact for at least one task.');
            return;
        }
        
        // Rate all the complete tasks
        let ratedCount = 0;
        tasksToRate.forEach(({task, excitement, simplicity, impact}) => {
            const taskIndex = this.tasks.findIndex(t => t.id === task.id);
            if (taskIndex > -1) {
                this.tasks[taskIndex].excitement = excitement;
                this.tasks[taskIndex].simplicity = simplicity;
                this.tasks[taskIndex].impact = impact;
                this.tasks[taskIndex].score = excitement + simplicity + impact;
                this.tasks[taskIndex].status = 'start'; // Move to regular tasks
                ratedCount++;
            }
        });
        
        // Sort tasks by score
        this.sortTasks();
        
        // Save and render
        this.saveTasksToStorage();
        this.renderTasks();
        
        // Show success feedback
        this.showSuccessFeedback(`✅ ${ratedCount} task${ratedCount === 1 ? '' : 's'} rated and added to priority list!`);
    }

    showSuccessFeedback(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            font-weight: 500;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    saveTasksToStorage() {
        try {
            localStorage.setItem('esi-filter-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    }

    loadTasksFromStorage() {
        try {
            const savedTasks = localStorage.getItem('esi-filter-tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                
                // Add status property to tasks that don't have it (backward compatibility)
                this.tasks.forEach(task => {
                    if (!task.status) {
                        task.status = 'start';
                    }
                    // Ensure tasks with null ratings get unrated status
                    if (task.status !== 'unrated' && (task.excitement === null || task.simplicity === null || task.impact === null)) {
                        task.status = 'unrated';
                        task.score = null;
                    }
                    // Add notes property if it doesn't exist (backward compatibility)
                    if (!task.hasOwnProperty('notes')) {
                        task.notes = "";
                    }
                });
                
                // Ensure tasks are properly sorted
                this.sortTasks();
            }
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
            this.tasks = [];
        }
    }

    // Method to export tasks (bonus feature)
    exportTasks() {
        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            totalTasks: this.tasks.length
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `esi-filter-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Method to clear all tasks
    clearAllTasks() {
        if (this.tasks.length === 0) {
            alert('No tasks to clear!');
            return;
        }
        
        if (confirm(`Are you sure you want to delete all ${this.tasks.length} tasks? This cannot be undone.`)) {
            this.tasks = [];
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    createToBeRatedSection() {
        const section = document.createElement('section');
        section.id = 'to-be-rated-section';
        section.className = 'to-be-rated-section';
        
        section.innerHTML = `
            <div class="card">
                <div class="section-header">
                    <h2>📝 To Be Rated</h2>
                    <div class="header-actions">
                        <div class="task-count">
                            <span id="unrated-task-count">0 unrated</span>
                        </div>
                        <button class="rate-all-btn" onclick="esiFilter.rateAllTasks()" title="Rate all tasks with complete scores">
                            Rate All
                        </button>
                    </div>
                </div>
                
                <div id="unrated-tasks-container" class="unrated-tasks-container">
                    <!-- Unrated tasks will be rendered here -->
                </div>
            </div>
        `;
        
        return section;
    }
}

// Initialize the application
let esiFilter;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ESIFilter'); // Debug log
    esiFilter = new ESIFilter();
    console.log('esiFilter created:', esiFilter); // Debug log
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('task-form');
            const submitEvent = new Event('submit');
            form.dispatchEvent(submitEvent);
        }
        
        // Escape key to clear form
        if (e.key === 'Escape') {
            const form = document.getElementById('task-form');
            form.reset();
        }
    });
    
    // Focus on the textarea input
    const brainDumpText = document.getElementById('brain-dump-text');
    if (brainDumpText) {
        brainDumpText.focus();
    }
    
    console.log('ESIFilter initialization complete'); // Debug log
});

// Add some utility functions for potential future features
const ESIUtils = {
    // Calculate task completion rate (if we add completion tracking)
    calculateCompletionRate(tasks) {
        const completed = tasks.filter(task => task.completed).length;
        return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
    },
    
    // Get task statistics
    getTaskStats(tasks) {
        if (tasks.length === 0) return null;
        
        const excitement = tasks.map(t => t.excitement);
        const simplicity = tasks.map(t => t.simplicity);
        const impact = tasks.map(t => t.impact);
        const scores = tasks.map(t => t.score);
        
        return {
            avgExcitement: excitement.reduce((a, b) => a + b, 0) / excitement.length,
            avgSimplicity: simplicity.reduce((a, b) => a + b, 0) / simplicity.length,
            avgImpact: impact.reduce((a, b) => a + b, 0) / impact.length,
            avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores)
        };
    },
    
    // Format date for display
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};

// Global function for onclick handler
function handleAddBrainDumpTasks(event) {
    console.log('handleAddBrainDumpTasks called via onclick'); // Debug log
    if (event) {
        event.preventDefault();
    }
    
    if (esiFilter) {
        esiFilter.addBrainDumpTasks();
    } else {
        console.error('esiFilter not available');
    }
} 