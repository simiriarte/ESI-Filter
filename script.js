// ESI Filter - Updated dropdowns with full scale - v2.1
class ESIFilter {
    constructor() {
        console.log('ESIFilter constructor called'); // Debug log
        this.tasks = [];
        // Initialize filter state for each column - newest is now the default
        this.filters = {
            prioritized: ['newest'],
            'in-progress': ['newest'],
            completed: ['newest']
        };
        this.actionHistory = []; // Track history of actions for undo functionality
        this.maxUndoHistory = 50; // Limit undo history to prevent memory issues
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
        
        // Only add event listener if the form exists
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                console.log('Form submitted'); // Debug log
                e.preventDefault();
                this.addBrainDumpTasks();
            });
        } else {
            console.log('Task form not found - brain dump is now modal-based'); // Debug log
        }

        // Close filter menus when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.filter-container')) {
                document.querySelectorAll('.filter-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });

        // Add keyboard event listeners for undo functionality
        document.addEventListener('keydown', (event) => {
            // Check if user pressed Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                this.handleUndoKeypress();
            }
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
            energy: null,
            simplicity: null,
            impact: null,
            score: null,
            leverage: null, // Initialize leverage property
            notes: "",
            actualEnergy: null,
            actualSimplicity: null,
            actualImpact: null,
            timeSpent: 0, // Total time spent on task in seconds
            lastPainCaveStart: null // Timestamp when pain cave was last entered
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

    applyFilter(column, filterValue) {
        // Update filter state - toggle filter in array
        const currentFilters = this.filters[column];
        const filterIndex = currentFilters.indexOf(filterValue);
        
        if (filterIndex > -1) {
            // Remove filter if it exists
            currentFilters.splice(filterIndex, 1);
        } else {
            // Add filter if it doesn't exist
            currentFilters.push(filterValue);
            
            // Special handling for newest/oldest - they are mutually exclusive
            if (filterValue === 'newest' && currentFilters.includes('oldest')) {
                const oldestIndex = currentFilters.indexOf('oldest');
                currentFilters.splice(oldestIndex, 1);
            } else if (filterValue === 'oldest' && currentFilters.includes('newest')) {
                const newestIndex = currentFilters.indexOf('newest');
                currentFilters.splice(newestIndex, 1);
            }
        }
        
        // Ensure at least one filter is always active (default to 'newest' if empty)
        if (currentFilters.length === 0) {
            currentFilters.push('newest');
        }
        
        // Re-render tasks to apply the filter
        this.renderTasks();
    }

    filterTasks(tasks, filterValues) {
        let filteredTasks = [...tasks];
        
        // Apply each active filter
        const activeFilters = Array.isArray(filterValues) ? filterValues : [filterValues];
        
        // Apply leverage filters (10x, 2x)
        const leverageFilters = activeFilters.filter(f => ['10x', '2x'].includes(f));
        if (leverageFilters.length > 0) {
            filteredTasks = filteredTasks.filter(task => 
                leverageFilters.includes(task.leverage)
            );
        }
        
        // Apply time-sensitive filter
        if (activeFilters.includes('time-sensitive')) {
            filteredTasks = filteredTasks.filter(task => task.isTimeSensitive === true);
        }
        
        // Sort by creation date if newest or oldest filter is active
        if (activeFilters.includes('newest') && !activeFilters.includes('oldest')) {
            filteredTasks = [...filteredTasks].sort((a, b) => {
                const dateA = new Date(a.dateCreated || a.createdAt || 0);
                const dateB = new Date(b.dateCreated || b.createdAt || 0);
                return dateB - dateA; // Most recent first
            });
        } else if (activeFilters.includes('oldest') && !activeFilters.includes('newest')) {
            filteredTasks = [...filteredTasks].sort((a, b) => {
                const dateA = new Date(a.dateCreated || a.createdAt || 0);
                const dateB = new Date(b.dateCreated || b.createdAt || 0);
                return dateA - dateB; // Oldest first
            });
        }
        
        return filteredTasks;
    }

    updateFilterDropdowns() {
        // Update the dropdown values to match the current filter state
        // Since we're only showing filter icons now, no need to update badges
        // The checkmarks will be updated when the dropdown is opened
    }

    toggleFilterMenu(column) {
        const menu = document.getElementById(`${column}-filter-menu`);
        const isHidden = menu.classList.contains('hidden');
        
        // Close all other filter menus first
        document.querySelectorAll('.filter-menu').forEach(otherMenu => {
            if (otherMenu !== menu) {
                otherMenu.classList.add('hidden');
            }
        });
        
        if (isHidden) {
            menu.classList.remove('hidden');
            // Update checkmarks to show current selection
            this.updateFilterMenuCheckmarks(column);
            // Set up click handlers for filter options
            menu.querySelectorAll('.filter-option').forEach(option => {
                option.onclick = () => this.selectFilter(column, option.dataset.value);
            });
        } else {
            menu.classList.add('hidden');
        }
    }

    selectFilter(column, filterValue) {
        // Apply the filter
        this.applyFilter(column, filterValue);
        
        // Update the checkmarks to reflect new state
        this.updateFilterMenuCheckmarks(column);
        
        // Don't close the menu for multiple selection
        // The menu will stay open so users can select multiple filters
    }

    updateFilterMenuCheckmarks(column) {
        const menu = document.getElementById(`${column}-filter-menu`);
        const currentFilters = this.filters[column];
        
        // Remove 'selected' class from all options
        menu.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add 'selected' class to active filter options
        currentFilters.forEach(filterValue => {
            const selectedOption = menu.querySelector(`[data-value="${filterValue}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        });
    }

    updateFilterBadge(column, filterValues) {
        // Since we're showing only the filter icon, we just need to update the internal state
        // The checkmarks in the dropdown will show what's selected
        // This function is now mostly handled by applyFilter
    }



    updateTaskStatus(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            const previousStatus = task.status;
            
            // Update status based on current state
            if (task.status === 'start') {
                // Record action for undo
                this.recordAction('status_change', {
                    taskId: taskId,
                    previousStatus: previousStatus
                });
                
                task.status = 'in-progress';
                this.saveTasksToStorage();
                this.renderTasks();
            } else if (task.status === 'in-progress') {
                // Show reflection modal instead of completing immediately
                this.showCompletionReflectionModal(taskId);
            }
            // If already complete, do nothing
        }
    }

    enterPainCave(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Only allow entering Pain Cave for in-progress tasks
            if (task.status === 'in-progress') {
                // Save the task data to localStorage for Pain Cave
                const taskData = {
                    id: task.id,
                    name: task.title || task.name,
                    timeSpent: task.timeSpent || 0
                };
                localStorage.setItem('painCaveTaskData', JSON.stringify(taskData));
                
                // Switch to Pain Cave tab instead of opening new window
                switchTab('pain-cave');
            }
        }
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Record action for undo
            this.recordAction('delete', {
                task: { ...task } // Create a copy of the task
            });
            
            this.tasks.splice(taskIndex, 1);
            this.saveTasksToStorage();
            this.renderTasks();
            
            const taskName = task.title || task.name;
            this.showSuccessFeedback(`🗑️ Deleted "${taskName}" (Ctrl+Z to undo)`);
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
            const task = this.tasks[taskIndex];
            const previousNotes = task.notes;
            const newNotes = textarea.value;
            
            // Only record action if notes actually changed
            if (previousNotes !== newNotes) {
                // Record action for undo
                this.recordAction('notes_change', {
                    taskId: taskId,
                    previousNotes: previousNotes,
                    newNotes: newNotes
                });
            }
            
            task.notes = newNotes;
            this.saveTasksToStorage();
            
            // Hide notes panel
            notesPanel.style.display = 'none';
            
            // Re-render to update the notes button icon
            this.renderTasks();
            
            // Show success feedback
            this.showSuccessFeedback('📝 Notes saved! (Ctrl+Z to undo)');
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

    toggleReflection(taskId) {
        const reflectionContent = document.getElementById(`reflection-content-${taskId}`);
        if (reflectionContent) {
            if (reflectionContent.style.display === 'none') {
                reflectionContent.style.display = 'block';
            } else {
                reflectionContent.style.display = 'none';
            }
        }
    }

    getRatingDescription(value, type) {
        const descriptions = {
            energy: {
                1: "Draining",
                3: "Neutral",
                5: "Energizing"
            },
            simplicity: {
                1: "Many complex subtasks",
                3: "A few subtasks",
                5: "One clear, single action"
            },
            impact: {
                1: "Minimal",
                5: "Moderate",
                10: "Major"
            }
        };
        
        return descriptions[type]?.[value] || "";
    }

    showCompletionReflectionModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Check if task is already completed
        const isCompleted = task.status === 'complete';
        const modalTitle = isCompleted ? 'Reflection' : 'Wahoo! it\'s DONE!';
        const buttonText = isCompleted ? 'Update' : 'Save Reflection';

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'reflection-modal-overlay';
        modalOverlay.id = `reflection-modal-${taskId}`;
        
        modalOverlay.innerHTML = `
            <div class="reflection-modal" id="reflection-modal-content-${taskId}">
                <div class="scroll-indicator" id="scroll-indicator-${taskId}">↓</div>
                <div class="reflection-modal-header">
                    <h3>${modalTitle}</h3>
                    <p class="task-subtitle">${task.title || task.name}</p>
                </div>
                
                <div class="reflection-content">
                    <div class="actual-ratings-section">
                        <h4>How did it really go down?</h4>
                        <div class="actual-ratings-grid">
                            <div class="metric-label-box">Energy</div>
                            <div class="actual-input-wrapper">
                                <select id="actual-energy-${taskId}" class="actual-rating-dropdown">
                                    <option value="">Select...</option>
                                    <option value="1" ${task.actualEnergy == 1 ? 'selected' : ''}>1 - Draining</option>
                                    <option value="2" ${task.actualEnergy == 2 ? 'selected' : ''}>2</option>
                                    <option value="3" ${task.actualEnergy == 3 ? 'selected' : ''}>3 - Neutral</option>
                                    <option value="4" ${task.actualEnergy == 4 ? 'selected' : ''}>4</option>
                                    <option value="5" ${task.actualEnergy == 5 ? 'selected' : ''}>5 - Energizing</option>
                                </select>
                            </div>
                            
                            <div class="metric-label-box">Simplicity</div>
                            <div class="actual-input-wrapper">
                                <select id="actual-simplicity-${taskId}" class="actual-rating-dropdown">
                                    <option value="">Select...</option>
                                    <option value="1" ${task.actualSimplicity == 1 ? 'selected' : ''}>1 - Many complex subtasks</option>
                                    <option value="2" ${task.actualSimplicity == 2 ? 'selected' : ''}>2</option>
                                    <option value="3" ${task.actualSimplicity == 3 ? 'selected' : ''}>3 - A few subtasks</option>
                                    <option value="4" ${task.actualSimplicity == 4 ? 'selected' : ''}>4</option>
                                    <option value="5" ${task.actualSimplicity == 5 ? 'selected' : ''}>5 - One clear, single action</option>
                                </select>
                            </div>
                            
                            <div class="metric-label-box">Impact</div>
                            <div class="actual-input-wrapper">
                                <select id="actual-impact-${taskId}" class="actual-rating-dropdown">
                                    <option value="">Select...</option>
                                    <option value="1" ${task.actualImpact == 1 ? 'selected' : ''}>1 - Minimal</option>
                                    <option value="2" ${task.actualImpact == 2 ? 'selected' : ''}>2</option>
                                    <option value="3" ${task.actualImpact == 3 ? 'selected' : ''}>3</option>
                                    <option value="4" ${task.actualImpact == 4 ? 'selected' : ''}>4</option>
                                    <option value="5" ${task.actualImpact == 5 ? 'selected' : ''}>5 - Moderate</option>
                                    <option value="6" ${task.actualImpact == 6 ? 'selected' : ''}>6</option>
                                    <option value="7" ${task.actualImpact == 7 ? 'selected' : ''}>7</option>
                                    <option value="8" ${task.actualImpact == 8 ? 'selected' : ''}>8</option>
                                    <option value="9" ${task.actualImpact == 9 ? 'selected' : ''}>9</option>
                                    <option value="10" ${task.actualImpact == 10 ? 'selected' : ''}>10 - Major</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="quick-reflection-section">
                        <h4>What do you wanna remember about this experience?</h4>
                        <textarea 
                            id="quick-reflection-${taskId}" 
                            class="quick-reflection-textarea"
                            placeholder="look at you! building those intuition muscles">${task.quickReflection || ''}</textarea>
                    </div>
                </div>
                
                <div class="reflection-modal-actions">
                    ${!isCompleted ? `
                        <button class="btn-undo" onclick="esiFilter.undoTaskCompletion(${taskId})">
                            Undo
                        </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="esiFilter.closeCompletionReflectionModal(${taskId})">
                        ${isCompleted ? 'Cancel' : 'Skip'}
                    </button>
                    <button class="btn-primary" onclick="esiFilter.saveReflection(${taskId})">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        
        // Set up scroll indicator
        const modalContent = document.getElementById(`reflection-modal-content-${taskId}`);
        const scrollIndicator = document.getElementById(`scroll-indicator-${taskId}`);
        
        // Function to check scroll position and update indicator
        const updateScrollIndicator = () => {
            const scrollTop = modalContent.scrollTop;
            const scrollHeight = modalContent.scrollHeight;
            const clientHeight = modalContent.clientHeight;
            
            // Hide indicator if we can't scroll or if we're near the bottom
            if (scrollHeight <= clientHeight || scrollTop >= scrollHeight - clientHeight - 20) {
                scrollIndicator.classList.add('hidden');
            } else {
                scrollIndicator.classList.remove('hidden');
            }
        };
        
        // Add scroll event listener
        modalContent.addEventListener('scroll', updateScrollIndicator);
        
        // Initial check
        setTimeout(updateScrollIndicator, 100);
        
        // Click indicator to scroll down
        scrollIndicator.addEventListener('click', () => {
            modalContent.scrollBy({
                top: 200,
                behavior: 'smooth'
            });
        });
        
        // Focus on first dropdown
        const firstSelect = document.getElementById(`actual-energy-${taskId}`);
        if (firstSelect) firstSelect.focus();
    }

    saveReflection(taskId) {
        const actualEnergy = parseInt(document.getElementById(`actual-energy-${taskId}`).value);
        const actualSimplicity = parseInt(document.getElementById(`actual-simplicity-${taskId}`).value);
        const actualImpact = parseInt(document.getElementById(`actual-impact-${taskId}`).value);
        const quickReflection = document.getElementById(`quick-reflection-${taskId}`).value.trim();

        // Validate that all fields are filled
        if (!actualEnergy || !actualSimplicity || !actualImpact) {
            alert('Please select all reflection ratings before saving.');
            return;
        }

        // Find and update the task
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            const wasAlreadyCompleted = task.status === 'complete';
            
            // Save actual ratings (can be updated anytime)
            task.actualEnergy = actualEnergy;
            task.actualSimplicity = actualSimplicity;
            task.actualImpact = actualImpact;
            
            // Save quick reflection if provided (can be updated anytime)
            if (quickReflection) {
                task.quickReflection = quickReflection;
            } else {
                // If reflection is cleared, remove it
                delete task.quickReflection;
            }
            
            // Only set completion status and date if not already completed
            if (!wasAlreadyCompleted) {
                task.status = 'complete';
                task.completedDate = new Date().toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                });
            }

            this.saveTasksToStorage();
            this.renderTasks();
            
            // Close modal
            this.closeCompletionReflectionModal(taskId);
            
            // Show success feedback
            const taskName = task.title || task.name;
            const feedbackMessage = wasAlreadyCompleted 
                ? `✅ Reflection for "${taskName}" updated!`
                : `✅ "${taskName}" completed with reflection saved!`;
            this.showSuccessFeedback(feedbackMessage);
        }
    }

    closeCompletionReflectionModal(taskId) {
        const modal = document.getElementById(`reflection-modal-${taskId}`);
        if (modal) {
            modal.remove();
        }
        
        // If user skipped reflection, still complete the task
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            if (task.status === 'in-progress') {
                task.status = 'complete';
                task.completedDate = new Date().toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                });
                
                this.saveTasksToStorage();
                this.renderTasks();
                
                const taskName = task.title || task.name;
                this.showSuccessFeedback(`✅ "${taskName}" completed!`);
            }
        }
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        const taskCount = document.getElementById('task-count');
        const inProgressTasksContainer = document.getElementById('in-progress-tasks-container');
        const inProgressTaskCount = document.getElementById('in-progress-task-count');
        const completedTasksSection = document.getElementById('completed-tasks-section');
        const completedTasksContainer = document.getElementById('completed-tasks-container');
        const completedTaskCount = document.getElementById('completed-task-count');
        const mainGrid = document.querySelector('.main-grid');

        // Separate tasks by status
        const allPrioritizedTasks = this.tasks.filter(task => task.status === 'start');
        const allInProgressTasks = this.tasks.filter(task => task.status === 'in-progress');
        const allCompletedTasks = this.tasks.filter(task => task.status === 'complete');
        const unratedTasks = this.tasks.filter(task => task.status === 'unrated');

        // Apply filters to each column
        const prioritizedTasks = this.filterTasks(allPrioritizedTasks, this.filters.prioritized);
        const inProgressTasks = this.filterTasks(allInProgressTasks, this.filters['in-progress']);
        const completedTasks = this.filterTasks(allCompletedTasks, this.filters.completed);

        // Dynamic layout: determine how many columns we need
        let toBeRatedSection = document.getElementById('to-be-rated-section');
        let columnsNeeded = 0;
        
        // Count columns needed - always show prioritized and in-progress columns
        if (unratedTasks.length > 0) columnsNeeded++;
        columnsNeeded += 2; // Always include prioritized tasks and in-progress columns
        
        // Handle To Be Rated section
        if (unratedTasks.length > 0) {
            // Create To Be Rated section if it doesn't exist
            if (!toBeRatedSection) {
                toBeRatedSection = this.createToBeRatedSection();
                // Insert before prioritized tasks section
                const tasksSection = document.querySelector('.tasks-section');
                mainGrid.insertBefore(toBeRatedSection, tasksSection);
            }
            
            // Update unrated tasks content
            const unratedTasksContainer = document.getElementById('unrated-tasks-container');
            const unratedTaskCount = document.getElementById('unrated-task-count');
            
            if (unratedTasksContainer && unratedTaskCount) {
                const unratedCount = unratedTasks.length;
                unratedTaskCount.textContent = unratedCount === 1 ? '1 unrated' : `${unratedCount} unrated`;
                
                // Preserve existing dropdown values before re-rendering
                const preservedValues = {};
                unratedTasks.forEach((task) => {
                    const energyInput = document.getElementById(`unrated-energy-${task.id}`);
                    const simplicityInput = document.getElementById(`unrated-simplicity-${task.id}`);
                    const impactInput = document.getElementById(`unrated-impact-${task.id}`);
                    const leverage10xBtn = document.getElementById(`leverage-10x-${task.id}`);
                    const leverage2xBtn = document.getElementById(`leverage-2x-${task.id}`);
                    const timeSensitiveToggle = document.getElementById(`time-sensitive-toggle-${task.id}`);
                    
                    if (energyInput || simplicityInput || impactInput || leverage10xBtn || leverage2xBtn || timeSensitiveToggle) {
                        let currentLeverage = '';
                        if (leverage10xBtn && leverage10xBtn.classList.contains('active')) {
                            currentLeverage = '10x';
                        } else if (leverage2xBtn && leverage2xBtn.classList.contains('active')) {
                            currentLeverage = '2x';
                        }
                        
                        preservedValues[task.id] = {
                            energy: energyInput ? energyInput.value : '',
                            simplicity: simplicityInput ? simplicityInput.value : '',
                            impact: impactInput ? impactInput.value : '',
                            leverage: currentLeverage,
                            isTimeSensitive: task.isTimeSensitive || false
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
            // Remove To Be Rated section completely from DOM
            if (toBeRatedSection) {
                toBeRatedSection.remove();
            }
        }
        
        // Set grid layout based on number of columns needed
        mainGrid.classList.remove('one-column', 'two-columns', 'three-columns');
        
        if (columnsNeeded === 1) {
            mainGrid.classList.add('one-column');
        } else if (columnsNeeded === 2) {
            mainGrid.classList.add('two-columns');
        } else if (columnsNeeded === 3) {
            mainGrid.classList.add('three-columns');
        }

        // Update prioritized task count
        const prioritizedCount = prioritizedTasks.length;
        const totalPrioritizedCount = allPrioritizedTasks.length;
        const prioritizedCountText = (this.filters.prioritized.includes('newest') && this.filters.prioritized.length === 1) ||
            (this.filters.prioritized.includes('oldest') && this.filters.prioritized.length === 1)
            ? (prioritizedCount === 1 ? '1 task' : `${prioritizedCount} tasks`)
            : `${prioritizedCount} of ${totalPrioritizedCount} tasks`;
        taskCount.textContent = prioritizedCountText;

        // Clear prioritized tasks container
        tasksContainer.innerHTML = '';

        if (prioritizedTasks.length === 0) {
            // Show empty state for prioritized tasks
            let emptyMessage;
            if (this.filters.prioritized.includes('time-sensitive')) {
                emptyMessage = 'No time-sensitive tasks found in prioritized tasks.';
            } else if (this.filters.prioritized.includes('newest') && !this.filters.prioritized.includes('oldest')) {
                emptyMessage = 'Rated tasks will appear here sorted by newest first!';
            } else if (this.filters.prioritized.includes('oldest') && !this.filters.prioritized.includes('newest')) {
                emptyMessage = 'Rated tasks will appear here sorted by oldest first!';
            } else {
                const filterNames = this.filters.prioritized.join(', ');
                emptyMessage = `No ${filterNames} tasks found in prioritized tasks.`;
            }
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😴</div>
                    <h3>No tasks yet</h3>
                    <p>${emptyMessage}</p>
                </div>
            `;
        } else {
            // Calculate top 20% threshold for prioritized tasks (Pareto principle)
            const top20PercentCount = Math.max(1, Math.ceil(prioritizedTasks.length * 0.2));
            const top20Threshold = prioritizedTasks[top20PercentCount - 1]?.score || 0;
            
            // Render each prioritized task
            prioritizedTasks.forEach((task, index) => {
                const isTop20Percent = index < top20PercentCount;
                const taskElement = this.createTaskElement(task, index, isTop20Percent);
                tasksContainer.appendChild(taskElement);
            });
        }

        // Update in-progress task count and container
        const inProgressCount = inProgressTasks.length;
        const totalInProgressCount = allInProgressTasks.length;
        const inProgressCountText = (this.filters['in-progress'].includes('newest') && this.filters['in-progress'].length === 1) ||
            (this.filters['in-progress'].includes('oldest') && this.filters['in-progress'].length === 1)
            ? (inProgressCount === 1 ? '1 task' : `${inProgressCount} tasks`)
            : `${inProgressCount} of ${totalInProgressCount} tasks`;
        inProgressTaskCount.textContent = inProgressCountText;

        // Clear in-progress tasks container
        inProgressTasksContainer.innerHTML = '';

        if (inProgressTasks.length === 0) {
            // Show empty state for in-progress tasks
            let emptyMessage;
            if (this.filters['in-progress'].includes('time-sensitive')) {
                emptyMessage = 'No time-sensitive tasks found in progress.';
            } else if (this.filters['in-progress'].includes('newest') && !this.filters['in-progress'].includes('oldest')) {
                emptyMessage = 'In-progress tasks will appear here sorted by newest first!';
            } else if (this.filters['in-progress'].includes('oldest') && !this.filters['in-progress'].includes('newest')) {
                emptyMessage = 'In-progress tasks will appear here sorted by oldest first!';
            } else {
                const filterNames = this.filters['in-progress'].join(', ');
                emptyMessage = `No ${filterNames} tasks found in progress.`;
            }
            inProgressTasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <h3>No tasks in progress</h3>
                    <p>${emptyMessage}</p>
                </div>
            `;
        } else {
            // Calculate top 20% threshold for in-progress tasks (Pareto principle)
            const top20PercentCount = Math.max(1, Math.ceil(inProgressTasks.length * 0.2));
            
            // Render each in-progress task
            inProgressTasks.forEach((task, index) => {
                const isTop20Percent = index < top20PercentCount;
                const taskElement = this.createInProgressTaskElement(task, index, isTop20Percent);
                inProgressTasksContainer.appendChild(taskElement);
            });
        }

        // Check if there are any 10x tasks in progress and show warning if none (for all in-progress scenarios)
        // Use all in-progress tasks (not filtered) for this warning since it's about the actual workflow
        const tenXInProgressTasks = allInProgressTasks.filter(task => task.leverage === '10x');
        const existingWarning = document.querySelector('.no-10x-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        if (allInProgressTasks.length > 0 && tenXInProgressTasks.length === 0) {
            const warningElement = document.createElement('div');
            warningElement.className = 'no-10x-warning';
            warningElement.innerHTML = `
                <div class="warning-content">
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">No 10x tasks in progress</span>
                </div>
            `;
            // Insert warning after the section header but before the tasks container
            const inProgressSection = inProgressTasksContainer.parentElement;
            const sectionHeader = inProgressSection.querySelector('.section-header');
            sectionHeader.insertAdjacentElement('afterend', warningElement);
        }

        // Handle completed tasks section
        if (allCompletedTasks.length > 0) {
            // Show completed tasks section
            completedTasksSection.classList.remove('hidden');
            
            // Update completed task count
            const completedCount = completedTasks.length;
            const totalCompletedCount = allCompletedTasks.length;
            const completedCountText = (this.filters.completed.includes('newest') && this.filters.completed.length === 1) ||
                (this.filters.completed.includes('oldest') && this.filters.completed.length === 1)
                ? (completedCount === 1 ? '1 completed' : `${completedCount} completed`)
                : `${completedCount} of ${totalCompletedCount} completed`;
            completedTaskCount.textContent = completedCountText;
            
            // Clear and render completed tasks
            completedTasksContainer.innerHTML = '';
            if (completedTasks.length === 0 && 
                !(this.filters.completed.includes('newest') && this.filters.completed.length === 1) && 
                !(this.filters.completed.includes('oldest') && this.filters.completed.length === 1)) {
                // Show empty state when filter returns no results
                const filterDisplayName = this.filters.completed.includes('time-sensitive') 
                    ? 'time-sensitive' 
                    : this.filters.completed.includes('newest')
                    ? 'newest'
                    : this.filters.completed.includes('oldest')
                    ? 'oldest'
                    : this.filters.completed.join(', ');
                completedTasksContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No ${filterDisplayName} tasks found</h3>
                        <p>Try changing the filter to see more completed tasks.</p>
                    </div>
                `;
            } else {
                completedTasks.forEach((task) => {
                    const taskElement = this.createCompletedTaskElement(task);
                    completedTasksContainer.appendChild(taskElement);
                });
            }
        } else {
            // Hide completed tasks section if no completed tasks
            completedTasksSection.classList.add('hidden');
        }

        // Update dropdown values to reflect current filter state
        this.updateFilterDropdowns();
    }

    createTaskElement(task, index, isTop20Percent = true) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.setAttribute('data-task-id', task.id);

        // Use title if available, fall back to name for compatibility
        const taskName = task.title || task.name;

        // Determine priority text and color
        let priorityText = '';
        let priorityColor = '';
        if (task.priority === 'high') {
            priorityText = 'High Priority';
            priorityColor = '#dc2626';
        } else if (task.priority === 'medium') {
            priorityText = 'Medium Priority';
            priorityColor = '#ea580c';
        } else if (task.priority === 'low') {
            priorityText = 'Low Priority';
            priorityColor = '#16a34a';
        }

        // Determine status button text
        let statusButton = '';
        if (task.status === 'start') {
            statusButton = 'Start';
        } else if (task.status === 'in-progress') {
            statusButton = 'Done!';
        }

        taskDiv.innerHTML = `
            <div class="task-card">
                <div class="undo-btn" onclick="esiFilter.undoPrioritizedTask(${task.id})" title="Send back to unrated" aria-label="Send back to unrated">
                    ↩
                </div>
                
                <div class="delete-btn" onclick="esiFilter.deleteTask(${task.id})" title="Delete task" aria-label="Delete task">
                    ×
                </div>
                
                <div class="task-header-compact">
                    <div class="task-name" title="${taskName}">
                        ${taskName}
                        ${priorityText ? `<div style="font-size: 0.8rem; color: ${priorityColor}; font-weight: 500; margin-top: 0.25rem;">${priorityText}</div>` : ''}
                        ${task.dateCreated || task.timeSpent ? `<div style="font-size: 0.8rem; color: #6b7280; font-weight: 500; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${task.dateCreated ? `<span>added ${new Date(task.dateCreated).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: '2-digit'
                            })}</span>` : ''}
                            ${task.dateCreated && task.timeSpent ? `<span style="color: #d1d5db;">|</span>` : ''}
                            ${task.timeSpent ? `<span style="color: #0097f2; display: flex; align-items: center; gap: 0.25rem;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                                ${this.formatTimeSpent(task.timeSpent)}
                            </span>` : ''}
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="task-metrics-top-right">
                    <div class="metric-compact">
                        <div class="metric-label">E</div>
                        <div class="metric-value">${task.energy}</div>
                    </div>
                    <div class="metric-compact">
                        <div class="metric-label">S</div>
                        <div class="metric-value">${task.simplicity}</div>
                    </div>
                    <div class="metric-compact">
                        <div class="metric-label">I</div>
                        <div class="metric-value">${task.impact}</div>
                    </div>
                    <div class="task-score-right${isTop20Percent ? '' : ' score-standard'}">${task.score}</div>
                </div>
                
                <div class="task-status-row-compact">
                    <div class="task-leverage-area">
                        ${task.leverage ? `<div class="leverage-badge leverage-${task.leverage}">${task.leverage}</div>` : ''}
                        ${task.isTimeSensitive ? `<div class="time-sensitive-indicator" title="Time-Sensitive"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg></div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="notes-btn ${task.notes ? 'has-notes' : ''}" onclick="esiFilter.toggleNotes(${task.id})" title="${task.notes ? 'Edit notes' : 'Add notes'}">
                        </button>
                        <button class="unpack-btn" onclick="esiFilter.openUnpackModal(${task.id})" title="Unpack task">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="7,13 12,18 17,13"/>
                                <polyline points="7,6 12,11 17,6"/>
                            </svg>
                        </button>
                        ${statusButton ? `
                            <button class="status-btn-compact ${statusButton === 'Done!' ? 'done-btn' : ''}" onclick="esiFilter.updateTaskStatus(${task.id})">
                                ${statusButton === 'Done!' ? 
                                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>' :
                                    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>'
                                }
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="notes-panel" id="notes-panel-${task.id}" style="display: none;">
                    <textarea class="notes-textarea" id="notes-textarea-${task.id}" placeholder="break down tasks here or add notes!">${task.notes}</textarea>
                    <div class="notes-actions">
                        <button class="notes-save-btn" onclick="esiFilter.saveNotes(${task.id})">Save</button>
                        <button class="notes-cancel-btn" onclick="esiFilter.cancelNotes(${task.id})">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        return taskDiv;
    }

    createInProgressTaskElement(task, index, isTop20Percent = true) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'in-progress-task-item';
        taskDiv.setAttribute('data-task-id', task.id);

        // Use title if available, fall back to name for compatibility
        const taskName = task.title || task.name;

        taskDiv.innerHTML = `
            <div class="task-card">
                <div class="undo-btn" onclick="esiFilter.undoInProgressTask(${task.id})" title="Send back to prioritized" aria-label="Send back to prioritized">
                    ↩
                </div>
                
                <div class="delete-btn" onclick="esiFilter.deleteTask(${task.id})" title="Delete task" aria-label="Delete task">
                    ×
                </div>
                
                <div class="task-header-compact">
                    <div class="task-name" title="${taskName}">
                        ${taskName}
                        ${task.dateCreated || task.timeSpent ? `<div style="font-size: 0.8rem; color: #6b7280; font-weight: 500; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${task.dateCreated ? `<span>added ${new Date(task.dateCreated).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: '2-digit'
                            })}</span>` : ''}
                            ${task.dateCreated && task.timeSpent ? `<span style="color: #d1d5db;">|</span>` : ''}
                            ${task.timeSpent ? `<span style="color: #0097f2; display: flex; align-items: center; gap: 0.25rem;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                                ${this.formatTimeSpent(task.timeSpent)}
                            </span>` : ''}
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="task-metrics-top-right">
                    <div class="metric-compact">
                        <div class="metric-label">E</div>
                        <div class="metric-value">${task.energy}</div>
                    </div>
                    <div class="metric-compact">
                        <div class="metric-label">S</div>
                        <div class="metric-value">${task.simplicity}</div>
                    </div>
                    <div class="metric-compact">
                        <div class="metric-label">I</div>
                        <div class="metric-value">${task.impact}</div>
                    </div>
                    <div class="task-score-right${isTop20Percent ? '' : ' score-standard'}">${task.score}</div>
                </div>
                
                <div class="task-status-row-compact">
                    <div class="task-leverage-area">
                        ${task.leverage ? `<div class="leverage-badge leverage-${task.leverage}">${task.leverage}</div>` : ''}
                        ${task.isTimeSensitive ? `<div class="time-sensitive-indicator" title="Time-Sensitive"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg></div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="notes-btn ${task.notes ? 'has-notes' : ''}" onclick="esiFilter.toggleNotes(${task.id})" title="${task.notes ? 'Edit notes' : 'Add notes'}">
                        </button>
                        <button class="unpack-btn" onclick="esiFilter.openUnpackModal(${task.id})" title="Unpack task">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="7,13 12,18 17,13"/>
                                <polyline points="7,6 12,11 17,6"/>
                            </svg>
                        </button>
                        <button class="btn-pain-cave-task" onclick="esiFilter.enterPainCave(${task.id})" title="Enter Pain Cave with this task">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="9,18 15,12 9,6"/>
                            </svg>
                        </button>
                        <button class="status-btn-compact done-btn" onclick="esiFilter.updateTaskStatus(${task.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                        </button>
                    </div>
                </div>
                
                <div class="notes-panel" id="notes-panel-${task.id}" style="display: none;">
                    <textarea class="notes-textarea" id="notes-textarea-${task.id}" placeholder="break down tasks here or add notes!">${task.notes}</textarea>
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

        // Check if task has actual ratings for reflection
        const hasReflection = task.actualEnergy && task.actualSimplicity && task.actualImpact;
        
        // Generate reflection insights if available
        let reflectionHTML = '';
        if (hasReflection) {
            // We don't need inline HTML anymore - will show in modal
            reflectionHTML = '';
        }

        // Create the metrics display based on whether we have reflection data
        let metricsHTML = '';
        if (hasReflection) {
            // Display both original and actual scores side by side
            const actualScore = task.actualEnergy + task.actualSimplicity + task.actualImpact;
            metricsHTML = `
                <div class="task-metrics-dual">
                    <div class="metrics-side original-side">
                        <div class="metric-compact">
                            <div class="metric-label">E</div>
                            <div class="metric-value">${task.energy}</div>
                        </div>
                        <div class="metric-compact">
                            <div class="metric-label">S</div>
                            <div class="metric-value">${task.simplicity}</div>
                        </div>
                        <div class="metric-compact">
                            <div class="metric-label">I</div>
                            <div class="metric-value">${task.impact}</div>
                        </div>
                        <div class="task-score-left">${task.score}</div>
                    </div>
                    <div class="metrics-side actual-side">
                        <div class="metric-compact">
                            <div class="metric-label">E</div>
                            <div class="metric-value">${task.actualEnergy}</div>
                        </div>
                        <div class="metric-compact">
                            <div class="metric-label">S</div>
                            <div class="metric-value">${task.actualSimplicity}</div>
                        </div>
                        <div class="metric-compact">
                            <div class="metric-label">I</div>
                            <div class="metric-value">${task.actualImpact}</div>
                        </div>
                        <div class="task-score-right-actual">${actualScore}</div>
                    </div>
                </div>
            `;
        } else {
            // Display only original scores
            metricsHTML = `
                <div class="task-metrics-top-right">
                    <div class="metric-compact">
                        <div class="metric-label">E</div>
                        <div class="metric-value">${task.energy}</div>
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
            `;
        }

        taskDiv.innerHTML = `
            <div class="task-header-compact">
                <div class="task-name" title="${taskName}">
                    ${taskName}
                    ${task.timeSpent ? `<div style="font-size: 0.75rem; color: #059669; font-weight: 600; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                        ${this.formatTimeSpent(task.timeSpent)} spent
                    </div>` : ''}
                    ${task.completedDate ? `<div style="font-size: 0.8rem; color: #6b7280; font-weight: 500; margin-top: 0.25rem;">
                        completed ${task.completedDate}
                    </div>` : ''}
                </div>
            </div>
            
            <div class="undo-btn" onclick="esiFilter.undoTaskCompletion(${task.id})" title="Undo completion" aria-label="Undo completion">
                ↩
            </div>
            
            <div class="delete-btn" onclick="esiFilter.deleteTask(${task.id})" title="Delete task" aria-label="Delete task">
                ×
            </div>
            
            ${metricsHTML}
            
            <div class="completed-task-bottom-row">
                <div class="task-leverage-area">
                    ${task.leverage ? `<div class="leverage-badge leverage-${task.leverage}">${task.leverage}</div>` : ''}
                    ${task.isTimeSensitive ? `<div class="time-sensitive-indicator" title="Time-Sensitive"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg></div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="notes-btn ${task.notes ? 'has-notes' : ''}" onclick="esiFilter.toggleNotes(${task.id})" title="${task.notes ? 'Edit notes' : 'Add notes'}">
                    </button>
                    ${hasReflection ? `
                        <button class="analytics-btn has-reflection" onclick="esiFilter.showCompletionReflectionModal(${task.id})" title="Complete reflection">
                            🧠
                        </button>
                    ` : `
                        <button class="analytics-btn" onclick="esiFilter.showCompletionReflectionModal(${task.id})" title="Complete reflection">
                            🧠
                        </button>
                    `}
                </div>
            </div>
            
            <div class="notes-panel" id="notes-panel-${task.id}" style="display: none;">
                <textarea class="notes-textarea" id="notes-textarea-${task.id}" placeholder="break down tasks here or add notes!">${task.notes}</textarea>
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
                    ×
                </div>

                <div class="unrated-task-header">
                    <div class="unrated-task-name" title="${taskName}">${taskName}</div>
                </div>
                <div class="task-row">
                    <div class="input-group">
                        <select id="unrated-energy-${task.id}" 
                                class="score-input"
                                onkeydown="esiFilter.handleScoreInputKeydown(event, ${task.id}, 'energy')">
                            <option value="" ${!preservedValues?.energy ? 'selected' : ''}>Energy</option>
                            <option value="1" ${preservedValues?.energy == 1 ? 'selected' : ''}>1 - Draining</option>
                            <option value="2" ${preservedValues?.energy == 2 ? 'selected' : ''}>2</option>
                            <option value="3" ${preservedValues?.energy == 3 ? 'selected' : ''}>3 - Neutral</option>
                            <option value="4" ${preservedValues?.energy == 4 ? 'selected' : ''}>4</option>
                            <option value="5" ${preservedValues?.energy == 5 ? 'selected' : ''}>5 - Energizing</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <select id="unrated-simplicity-${task.id}" 
                                class="score-input"
                                onkeydown="esiFilter.handleScoreInputKeydown(event, ${task.id}, 'simplicity')">
                            <option value="" ${!preservedValues?.simplicity ? 'selected' : ''}>Simplicity</option>
                            <option value="1" ${preservedValues?.simplicity == 1 ? 'selected' : ''}>1 - Many complex subtasks</option>
                            <option value="2" ${preservedValues?.simplicity == 2 ? 'selected' : ''}>2</option>
                            <option value="3" ${preservedValues?.simplicity == 3 ? 'selected' : ''}>3 - A few subtasks</option>
                            <option value="4" ${preservedValues?.simplicity == 4 ? 'selected' : ''}>4</option>
                            <option value="5" ${preservedValues?.simplicity == 5 ? 'selected' : ''}>5 - One clear, single action</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <select id="unrated-impact-${task.id}" 
                                class="score-input"
                                onkeydown="esiFilter.handleScoreInputKeydown(event, ${task.id}, 'impact')">
                            <option value="" ${!preservedValues?.impact ? 'selected' : ''}>Impact</option>
                            <option value="1" ${preservedValues?.impact == 1 ? 'selected' : ''}>1 - Minimal</option>
                            <option value="2" ${preservedValues?.impact == 2 ? 'selected' : ''}>2</option>
                            <option value="3" ${preservedValues?.impact == 3 ? 'selected' : ''}>3</option>
                            <option value="4" ${preservedValues?.impact == 4 ? 'selected' : ''}>4</option>
                            <option value="5" ${preservedValues?.impact == 5 ? 'selected' : ''}>5 - Moderate</option>
                            <option value="6" ${preservedValues?.impact == 6 ? 'selected' : ''}>6</option>
                            <option value="7" ${preservedValues?.impact == 7 ? 'selected' : ''}>7</option>
                            <option value="8" ${preservedValues?.impact == 8 ? 'selected' : ''}>8</option>
                            <option value="9" ${preservedValues?.impact == 9 ? 'selected' : ''}>9</option>
                            <option value="10" ${preservedValues?.impact == 10 ? 'selected' : ''}>10 - Major</option>
                        </select>
                    </div>
                </div>
                
                <div class="task-status-row-compact">
                    <div class="task-leverage-area">
                        <div class="leverage-buttons">
                            <button type="button" 
                                    id="leverage-10x-${task.id}" 
                                    class="leverage-btn ${preservedValues?.leverage === '10x' ? 'active' : ''}" 
                                    onclick="esiFilter.setLeverage(${task.id}, '10x')">
                                10x
                            </button>
                            <button type="button" 
                                    id="leverage-2x-${task.id}" 
                                    class="leverage-btn ${preservedValues?.leverage === '2x' ? 'active' : ''}" 
                                    onclick="esiFilter.setLeverage(${task.id}, '2x')">
                                2x
                            </button>
                            <button type="button" 
                                    id="time-sensitive-toggle-${task.id}" 
                                    class="leverage-btn time-sensitive-btn ${preservedValues?.isTimeSensitive || task.isTimeSensitive ? 'active' : ''}" 
                                    onclick="esiFilter.toggleTimeSensitive(${task.id})"
                                    title="Mark as time-sensitive"
                                    aria-label="Mark as time-sensitive">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="rate-button" onclick="esiFilter.rateTask(${task.id})">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return taskDiv;
    }

    setLeverage(taskId, leverageValue) {
        // Find the task to track previous value
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        
        const task = this.tasks[taskIndex];
        const previousLeverage = task.leverage;
        
        // Toggle the selected leverage button
        const leverage10xBtn = document.getElementById(`leverage-10x-${taskId}`);
        const leverage2xBtn = document.getElementById(`leverage-2x-${taskId}`);
        
        let newLeverage = null;
        
        if (leverageValue === '10x') {
            if (leverage10xBtn.classList.contains('active')) {
                // If already active, deactivate
                leverage10xBtn.classList.remove('active');
                newLeverage = null;
            } else {
                // Activate 10x and deactivate 2x
                leverage10xBtn.classList.add('active');
                leverage2xBtn.classList.remove('active');
                newLeverage = '10x';
            }
        } else if (leverageValue === '2x') {
            if (leverage2xBtn.classList.contains('active')) {
                // If already active, deactivate
                leverage2xBtn.classList.remove('active');
                newLeverage = null;
            } else {
                // Activate 2x and deactivate 10x
                leverage2xBtn.classList.add('active');
                leverage10xBtn.classList.remove('active');
                newLeverage = '2x';
            }
        }
        
        // Only record action if leverage actually changed
        if (previousLeverage !== newLeverage) {
            // Record action for undo
            this.recordAction('leverage_change', {
                taskId: taskId,
                previousLeverage: previousLeverage,
                newLeverage: newLeverage
            });
            
            // Update the task
            task.leverage = newLeverage;
            this.saveTasksToStorage();
        }
    }

    handleScoreInputKeydown(event, taskId, fieldType) {
        if (event.key === 'Enter') {
            event.preventDefault();
            
            // Move to next field or submit if on last field
            if (fieldType === 'energy') {
                const simplicityInput = document.getElementById(`unrated-simplicity-${taskId}`);
                if (simplicityInput) simplicityInput.focus();
            } else if (fieldType === 'simplicity') {
                const impactInput = document.getElementById(`unrated-impact-${taskId}`);
                if (impactInput) impactInput.focus();
            } else if (fieldType === 'impact') {
                // On the last field, submit the rating
                this.rateTask(taskId);
            }
        } else if (event.key === 'Tab' && !event.shiftKey && fieldType === 'impact') {
            // When tabbing out of the last input, move to the next task's first input
            event.preventDefault();
            this.focusNextTaskFirstInput(taskId);
        }
    }

    focusNextTaskFirstInput(currentTaskId) {
        const currentTaskElement = document.querySelector(`[data-task-id="${currentTaskId}"]`);
        if (currentTaskElement) {
            const nextTaskElement = currentTaskElement.nextElementSibling;
            if (nextTaskElement) {
                const nextTaskId = nextTaskElement.getAttribute('data-task-id');
                const nextEnergyInput = document.getElementById(`unrated-energy-${nextTaskId}`);
                if (nextEnergyInput) {
                    nextEnergyInput.focus();
                    return;
                }
            }
        }
        
        // If no next task, focus on the Rate All button
        const rateAllBtn = document.querySelector('.to-be-rated-section .btn-primary');
        if (rateAllBtn) rateAllBtn.focus();
    }

    rateTask(taskId) {
        const energyInput = document.getElementById(`unrated-energy-${taskId}`);
        const simplicityInput = document.getElementById(`unrated-simplicity-${taskId}`);
        const impactInput = document.getElementById(`unrated-impact-${taskId}`);
        const leverage10xBtn = document.getElementById(`leverage-10x-${taskId}`);
        const leverage2xBtn = document.getElementById(`leverage-2x-${taskId}`);

        // Extract just the number from the input value (in case full text was selected)
        const energy = parseInt(energyInput.value);
        const simplicity = parseInt(simplicityInput.value);
        const impact = parseInt(impactInput.value);
        
        // Get leverage value
        let leverage = null;
        if (leverage10xBtn && leverage10xBtn.classList.contains('active')) {
            leverage = '10x';
        } else if (leverage2xBtn && leverage2xBtn.classList.contains('active')) {
            leverage = '2x';
        }

        // Validate values are numbers and within range
        if (!energy || energy < 1 || energy > 5) {
            alert('Please select an Energy score (1-5)');
            energyInput.focus();
            return;
        }
        if (!simplicity || simplicity < 1 || simplicity > 5) {
            alert('Please select a Simplicity score (1-5)');
            simplicityInput.focus();
            return;
        }
        if (!impact || impact < 1 || impact > 10) {
            alert('Please select an Impact score (1-10)');
            impactInput.focus();
            return;
        }
        if (!leverage) {
            alert('Please select a leverage category (10x or 2x) before rating this task');
            if (leverage10xBtn) leverage10xBtn.focus();
            return;
        }

        // Find and update the task
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Record action for undo
            this.recordAction('rate', {
                taskId: taskId,
                previousEnergy: task.energy,
                previousSimplicity: task.simplicity,
                previousImpact: task.impact,
                previousScore: task.score,
                previousStatus: task.status,
                previousLeverage: task.leverage,
                previousTimeSensitive: task.isTimeSensitive
            });
            
            task.energy = energy;
            task.simplicity = simplicity;
            task.impact = impact;
            task.score = energy + simplicity + impact;
            task.leverage = leverage; // Save leverage value
            task.status = 'start'; // Move to regular tasks
            // Note: isTimeSensitive is already preserved on the task object

            // Sort tasks by score
            this.sortTasks();
            
            // Save and render
            this.saveTasksToStorage();
            this.renderTasks();
            
            // Use title if available, fall back to name for compatibility
            const taskName = task.title || task.name;
            
            // Show success feedback
            this.showSuccessFeedback(`✅ Task "${taskName}" rated and added to priority list! (Ctrl+Z to undo)`);
        }
    }

    rateAllTasks() {
        const unratedTasks = this.tasks.filter(task => task.status === 'unrated');
        const tasksToRate = [];
        
        // Check which tasks have complete ratings
        unratedTasks.forEach(task => {
            const energyInput = document.getElementById(`unrated-energy-${task.id}`);
            const simplicityInput = document.getElementById(`unrated-simplicity-${task.id}`);
            const impactInput = document.getElementById(`unrated-impact-${task.id}`);
            const leverage10xBtn = document.getElementById(`leverage-10x-${task.id}`);
            const leverage2xBtn = document.getElementById(`leverage-2x-${task.id}`);
            
            // Extract just the number from the input value (in case full text was selected)
            const energy = parseInt(energyInput?.value);
            const simplicity = parseInt(simplicityInput?.value);
            const impact = parseInt(impactInput?.value);
            
            // Get leverage value
            let leverage = null;
            if (leverage10xBtn && leverage10xBtn.classList.contains('active')) {
                leverage = '10x';
            } else if (leverage2xBtn && leverage2xBtn.classList.contains('active')) {
                leverage = '2x';
            }
            
            // Only include tasks with all three valid ratings AND leverage selection
            if (energy >= 1 && energy <= 5 && 
                simplicity >= 1 && simplicity <= 5 && 
                impact >= 1 && impact <= 10 &&
                leverage) {
                tasksToRate.push({
                    task,
                    energy,
                    simplicity,
                    impact,
                    leverage
                });
            }
        });
        
        if (tasksToRate.length === 0) {
            alert('No tasks have complete valid ratings to process. Please fill out Energy (1-5), Simplicity (1-5), Impact (1-10), AND select leverage (10x or 2x) for at least one task.');
            return;
        }
        
        // Rate all the complete tasks
        let ratedCount = 0;
        tasksToRate.forEach(({task, energy, simplicity, impact, leverage}) => {
            const taskIndex = this.tasks.findIndex(t => t.id === task.id);
            if (taskIndex > -1) {
                this.tasks[taskIndex].energy = energy;
                this.tasks[taskIndex].simplicity = simplicity;
                this.tasks[taskIndex].impact = impact;
                this.tasks[taskIndex].score = energy + simplicity + impact;
                this.tasks[taskIndex].leverage = leverage; // Save leverage value
                this.tasks[taskIndex].status = 'start'; // Move to regular tasks
                // Note: isTimeSensitive is already preserved on the task object
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
                    // Ensure tasks with null ratings or missing leverage get unrated status
                    if (task.status !== 'unrated' && (task.energy === null || task.simplicity === null || task.impact === null || !task.leverage)) {
                        task.status = 'unrated';
                        task.score = null;
                    }
                    // Add notes property if it doesn't exist (backward compatibility)
                    if (!task.hasOwnProperty('notes')) {
                        task.notes = "";
                    }
                    // Add isTimeSensitive property if it doesn't exist (backward compatibility)
                    if (!task.hasOwnProperty('isTimeSensitive')) {
                        task.isTimeSensitive = false;
                    }
                    // Add time tracking properties if they don't exist (backward compatibility)
                    if (!task.hasOwnProperty('timeSpent')) {
                        task.timeSpent = 0;
                    }
                    if (!task.hasOwnProperty('lastPainCaveStart')) {
                        task.lastPainCaveStart = null;
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
                    <h2>Filter Tasks</h2>
                    <div class="header-controls">
                        <div class="task-count">
                            <span id="unrated-task-count">0 unrated</span>
                        </div>
                    </div>
                </div>
                
                <div id="unrated-tasks-container" class="unrated-tasks-container">
                    <!-- Unrated tasks will be rendered here -->
                </div>
            </div>
        `;
        
        return section;
    }

    closeReflectionInsightsModal(taskId) {
        const modal = document.getElementById(`reflection-insights-modal-${taskId}`);
        if (modal) {
            modal.remove();
        }
    }

    showReflectionModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.actualEnergy || !task.actualSimplicity || !task.actualImpact) return;

        // Calculate deltas
        const energyDelta = task.actualEnergy - task.energy;
        const simplicityDelta = task.actualSimplicity - task.simplicity;
        const impactDelta = task.actualImpact - task.impact;
        const originalScore = task.energy + task.simplicity + task.impact;
        const actualScore = task.actualEnergy + task.actualSimplicity + task.actualImpact;
        const totalDelta = actualScore - originalScore;

        // Helper function to get delta indicator
        const getDeltaIndicator = (delta) => {
            if (delta > 0) return { icon: '🔺', class: 'delta-positive', text: `+${delta}` };
            if (delta < 0) return { icon: '🔻', class: 'delta-negative', text: `${delta}` };
            return { icon: '◾', class: 'delta-neutral', text: '0' };
        };

        const eDelta = getDeltaIndicator(energyDelta);
        const sDelta = getDeltaIndicator(simplicityDelta);
        const iDelta = getDeltaIndicator(impactDelta);

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'reflection-insights-modal-overlay';
        modalOverlay.id = `reflection-insights-modal-${taskId}`;
        
        const taskName = task.title || task.name;
        
        modalOverlay.innerHTML = `
            <div class="reflection-insights-modal">
                <div class="reflection-insights-modal-header">
                    <h3>💭 Reflection Insights</h3>
                    <p>"${taskName}"</p>
                    <button class="modal-close-btn" onclick="esiFilter.closeReflectionInsightsModal(${taskId})">×</button>
                </div>
                
                <div class="reflection-insights-content">
                    <div class="insights-grid">
                        <div class="insight-metric">
                            <div class="metric-header">
                                <span class="metric-icon">🎯</span>
                                <span class="metric-name">Energy</span>
                            </div>
                            <div class="metric-comparison">
                                <div class="metric-values">
                                    <span class="original-value">Expected: ${task.energy}</span>
                                    <span class="actual-value">Actual: ${task.actualEnergy}</span>
                                </div>
                                <div class="delta-indicator ${eDelta.class}">
                                    ${eDelta.icon} ${eDelta.text}
                                </div>
                            </div>
                            ${energyDelta !== 0 ? `
                                <div class="reflection-prompt">
                                    <div class="prompt-question">💡 Did this end up being more or less enjoyable than expected? Why?</div>
                                    <textarea class="reflection-textarea" placeholder="What made this task ${task.actualEnergy > task.energy ? 'more enjoyable' : 'less enjoyable'} than you thought..."></textarea>
                                </div>
                            ` : `
                                <div class="reflection-prompt">
                                    <div class="prompt-question">🎯 Your energy prediction was spot on! What helped you estimate this accurately?</div>
                                    <textarea class="reflection-textarea" placeholder="What made you able to predict the enjoyment level so well..."></textarea>
                                </div>
                            `}
                        </div>
                        
                        <div class="insight-metric">
                            <div class="metric-header">
                                <span class="metric-icon">⚡</span>
                                <span class="metric-name">Simplicity</span>
                            </div>
                            <div class="metric-comparison">
                                <div class="metric-values">
                                    <span class="original-value">Expected: ${task.simplicity}</span>
                                    <span class="actual-value">Actual: ${task.actualSimplicity}</span>
                                </div>
                                <div class="delta-indicator ${sDelta.class}">
                                    ${sDelta.icon} ${sDelta.text}
                                </div>
                            </div>
                            ${simplicityDelta !== 0 ? `
                                <div class="reflection-prompt">
                                    <div class="prompt-question">💡 Was this easier or harder than you thought? What added or reduced complexity?</div>
                                    <textarea class="reflection-textarea" placeholder="What made this ${task.actualSimplicity > task.simplicity ? 'simpler' : 'more complex'} than expected..."></textarea>
                                </div>
                            ` : `
                                <div class="reflection-prompt">
                                    <div class="prompt-question">🎯 You nailed the complexity prediction! What gave you such good insight?</div>
                                    <textarea class="reflection-textarea" placeholder="What helped you accurately gauge how complex this would be..."></textarea>
                                </div>
                            `}
                        </div>
                        
                        <div class="insight-metric">
                            <div class="metric-header">
                                <span class="metric-icon">🚀</span>
                                <span class="metric-name">Impact</span>
                            </div>
                            <div class="metric-comparison">
                                <div class="metric-values">
                                    <span class="original-value">Expected: ${task.impact}</span>
                                    <span class="actual-value">Actual: ${task.actualImpact}</span>
                                </div>
                                <div class="delta-indicator ${iDelta.class}">
                                    ${iDelta.icon} ${iDelta.text}
                                </div>
                            </div>
                            ${impactDelta !== 0 ? `
                                <div class="reflection-prompt">
                                    <div class="prompt-question">💡 Did this task matter more or less than expected? What changed or opened up?</div>
                                    <textarea class="reflection-textarea" placeholder="What made this ${task.actualImpact > task.impact ? 'more impactful' : 'less impactful'} than you anticipated..."></textarea>
                                </div>
                            ` : `
                                <div class="reflection-prompt">
                                    <div class="prompt-question">🎯 Perfect impact prediction! What helped you see the true value beforehand?</div>
                                    <textarea class="reflection-textarea" placeholder="What made you able to predict the impact so accurately..."></textarea>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="total-score-comparison">
                        <div class="score-row">
                            <span class="score-label">Expected Total Score:</span>
                            <span class="score-value">${originalScore}</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Actual Total Score:</span>
                            <span class="score-value">${actualScore}</span>
                        </div>
                        ${Math.abs(totalDelta) > 0 ? `
                            <div class="total-delta-summary ${totalDelta > 0 ? 'delta-positive' : 'delta-negative'}">
                                ${totalDelta > 0 ? '🔺' : '🔻'} ${Math.abs(totalDelta)} points ${totalDelta > 0 ? 'higher' : 'lower'} than expected
                            </div>
                        ` : `
                            <div class="total-delta-summary delta-neutral">
                                ◾ Score matched expectations exactly
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="reflection-insights-modal-actions">
                    <button class="btn-primary" onclick="esiFilter.closeReflectionInsightsModal(${taskId})">
                        Close Reflection
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        
        // Add click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeReflectionInsightsModal(taskId);
            }
        });
    }

    undoTaskCompletion(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Revert task back to in-progress
            task.status = 'in-progress';
            
            // Remove completion date if it exists
            if (task.completedDate) {
                delete task.completedDate;
            }
            
            this.saveTasksToStorage();
            this.renderTasks();
            
            // Close the modal
            const modal = document.getElementById(`reflection-modal-${taskId}`);
            if (modal) {
                modal.remove();
            }
            
            // Show feedback
            const taskName = task.title || task.name;
            this.showSuccessFeedback(`↩️ "${taskName}" moved back to in-progress!`);
        }
    }

    undoPrioritizedTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Revert task back to unrated
            task.status = 'unrated';
            
            // Clear the ratings but keep the task data
            task.energy = null;
            task.simplicity = null;
            task.impact = null;
            task.score = null;
            task.leverage = null;
            
            this.saveTasksToStorage();
            this.renderTasks();
            
            // Show feedback
            const taskName = task.title || task.name;
            this.showSuccessFeedback(`↩️ "${taskName}" moved back to unrated tasks!`);
        }
    }

    undoInProgressTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Revert task back to prioritized
            task.status = 'start';
            
            this.saveTasksToStorage();
            this.renderTasks();
            
            // Show feedback
            const taskName = task.title || task.name;
            this.showSuccessFeedback(`↩️ "${taskName}" moved back to prioritized tasks!`);
        }
    }

    handleUndoKeypress() {
        // Don't trigger undo if user is typing in an input/textarea
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'SELECT' ||
            activeElement.contentEditable === 'true'
        )) {
            return;
        }

        // Don't trigger if a modal is open
        const modals = document.querySelectorAll('.modal-overlay, .brain-dump-modal-overlay, .reflection-modal-overlay');
        const isModalOpen = Array.from(modals).some(modal => 
            modal.style.display !== 'none' && !modal.classList.contains('hidden')
        );
        if (isModalOpen) {
            return;
        }

        if (this.actionHistory.length === 0) {
            this.showSuccessFeedback('⚠️ No actions to undo');
            return;
        }

        // Get the most recent action from history
        const lastAction = this.actionHistory.pop();

        // Perform the undo based on the action type
        switch (lastAction.type) {
            case 'status_change':
                this.undoStatusChange(lastAction);
                break;
            case 'delete':
                this.undoDelete(lastAction);
                break;
            case 'rate':
                this.undoRate(lastAction);
                break;
            case 'notes_change':
                this.undoNotesChange(lastAction);
                break;
            case 'leverage_change':
                this.undoLeverageChange(lastAction);
                break;
            case 'time_sensitive_change':
                this.undoTimeSensitiveChange(lastAction);
                break;
            default:
                this.showSuccessFeedback('⚠️ Cannot undo this action type');
                // Put the action back since we couldn't process it
                this.actionHistory.push(lastAction);
                return;
        }

        // Undo completed successfully - no notification needed
    }

    recordAction(type, data) {
        const action = {
            type: type,
            data: data,
            timestamp: Date.now()
        };
        
        this.actionHistory.push(action);
        
        // Limit history size to prevent memory issues
        if (this.actionHistory.length > this.maxUndoHistory) {
            this.actionHistory.shift(); // Remove oldest action
        }
    }

    undoStatusChange(action) {
        const task = this.tasks.find(t => t.id === action.data.taskId);
        if (task) {
            task.status = action.data.previousStatus;
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    undoDelete(action) {
        // Restore the deleted task
        this.tasks.push(action.data.task);
        this.saveTasksToStorage();
        this.renderTasks();
    }

    undoRate(action) {
        const task = this.tasks.find(t => t.id === action.data.taskId);
        if (task) {
            // Restore previous ratings
            task.energy = action.data.previousEnergy;
            task.simplicity = action.data.previousSimplicity;
            task.impact = action.data.previousImpact;
            task.score = action.data.previousScore;
            task.status = action.data.previousStatus;
            task.leverage = action.data.previousLeverage;
            task.isTimeSensitive = action.data.previousTimeSensitive;
            
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    undoNotesChange(action) {
        const task = this.tasks.find(t => t.id === action.data.taskId);
        if (task) {
            task.notes = action.data.previousNotes;
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    undoLeverageChange(action) {
        const task = this.tasks.find(t => t.id === action.data.taskId);
        if (task) {
            task.leverage = action.data.previousLeverage;
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    undoTimeSensitiveChange(action) {
        const task = this.tasks.find(t => t.id === action.data.taskId);
        if (task) {
            task.isTimeSensitive = action.data.previousTimeSensitive;
            this.saveTasksToStorage();
            this.renderTasks();
        }
    }

    toggleTimeSensitive(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            const previousTimeSensitive = task.isTimeSensitive;
            
            // Record action for undo
            this.recordAction('time_sensitive_change', {
                taskId: taskId,
                previousTimeSensitive: previousTimeSensitive,
                newTimeSensitive: !previousTimeSensitive
            });
            
            task.isTimeSensitive = !task.isTimeSensitive;
            
            // Update toggle visual state
            const timeSensitiveToggle = document.getElementById(`time-sensitive-toggle-${taskId}`);
            if (timeSensitiveToggle) {
                if (task.isTimeSensitive) {
                    timeSensitiveToggle.classList.add('active');
                } else {
                    timeSensitiveToggle.classList.remove('active');
                }
            }
            
            // Save changes
            this.saveTasksToStorage();
        }
    }

    updateTaskTime(taskId, timeSpent) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const oldTime = this.tasks[taskIndex].timeSpent || 0;
            this.tasks[taskIndex].timeSpent = oldTime + timeSpent;
            console.log(`Updated task time: ${this.tasks[taskIndex].title || this.tasks[taskIndex].name} - Old: ${this.formatTimeSpent(oldTime)}, Added: ${this.formatTimeSpent(timeSpent)}, New Total: ${this.formatTimeSpent(this.tasks[taskIndex].timeSpent)}`);
            this.saveTasksToStorage();
            this.renderTasks();
        } else {
            console.warn('Task not found for time update:', taskId);
        }
    }

    formatTimeSpent(seconds) {
        if (!seconds || seconds < 1) return '';
        
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            let timeString = `${hours}h`;
            if (minutes > 0) timeString += ` ${minutes}m`;
            if (remainingSeconds > 0 && hours === 0) timeString += ` ${remainingSeconds}s`;
            return timeString;
        }
    }

    openUnpackModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const taskName = task.title || task.name;
        
        // Create modal HTML
        const modalHTML = `
            <div id="unpack-modal-${taskId}" class="unpack-modal">
                <div class="unpack-modal-content">
                    <div class="unpack-header">
                        <h3>${taskName}</h3>
                        <button class="close-btn" onclick="esiFilter.closeUnpackModal(${taskId})">×</button>
                    </div>
                    <div class="unpack-body">
                        <label for="unpack-input-${taskId}">What would have to happen for this to be complete?</label>
                        <textarea id="unpack-input-${taskId}" class="unpack-textarea" placeholder="list the steps required to complete this task, but keep in mind you may not know all of them until you start."></textarea>
                    </div>
                    <div class="unpack-actions">
                        <button class="btn-secondary-compact" onclick="esiFilter.closeUnpackModal(${taskId})">Cancel</button>
                        <button class="btn-primary-compact" onclick="esiFilter.saveUnpackedTasks(${taskId})">Unpack</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal (no need to set display since it uses flexbox)
        
        // Focus on textarea
        setTimeout(() => {
            document.getElementById(`unpack-input-${taskId}`).focus();
        }, 100);
    }

    closeUnpackModal(taskId) {
        const modal = document.getElementById(`unpack-modal-${taskId}`);
        if (modal) {
            modal.remove();
        }
    }

    saveUnpackedTasks(taskId) {
        const textarea = document.getElementById(`unpack-input-${taskId}`);
        const content = textarea.value.trim();
        
        if (!content) {
            this.closeUnpackModal(taskId);
            return;
        }
        
        // Parse content into individual tasks (split by lines)
        const subtasks = content.split('\n').filter(line => line.trim());
        
        if (subtasks.length === 0) {
            this.closeUnpackModal(taskId);
            return;
        }
        
        // Create new tasks from subtasks
        subtasks.forEach(subtaskText => {
            const newTask = {
                id: Date.now() + Math.random(),
                name: subtaskText.trim(),
                title: subtaskText.trim(),
                status: 'unrated',
                dateCreated: new Date().toISOString(),
                energy: null,
                simplicity: null,
                impact: null,
                score: null,
                leverage: null,
                isTimeSensitive: false,
                notes: '',
                timeSpent: 0
            };
            this.tasks.push(newTask);
        });
        
        this.saveTasksToStorage();
        this.renderTasks();
        this.closeUnpackModal(taskId);
        
        // Show success message
        this.showSuccessFeedback(`✅ Created ${subtasks.length} subtask${subtasks.length === 1 ? '' : 's'}!`);
    }
}

// Initialize the application
let esiFilter;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ESIFilter'); // Debug log
    esiFilter = new ESIFilter();
    // Make esiFilter globally accessible for iframe communication
    window.esiFilter = esiFilter;
    console.log('esiFilter created:', esiFilter); // Debug log
    
    // Add a global function for Pain Cave to call directly
    window.updateTaskTimeFromPainCave = function(taskId, timeSpent) {
        console.log('updateTaskTimeFromPainCave called with:', taskId, timeSpent);
        if (esiFilter) {
            esiFilter.updateTaskTime(taskId, timeSpent);
            console.log('Time update applied via direct function call');
            return true;
        } else {
            console.error('esiFilter not available for direct call');
            return false;
        }
    };
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Check if brain dump modal is open
        const brainDumpModal = document.getElementById('brain-dump-modal');
        const isModalOpen = brainDumpModal && brainDumpModal.style.display !== 'none';
        
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (isModalOpen) {
                // Submit brain dump modal form
                const modalForm = document.getElementById('brain-dump-modal-form');
                if (modalForm) {
                    e.preventDefault();
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    modalForm.dispatchEvent(submitEvent);
                }
            } else {
                // Submit regular task form (if it exists)
                const form = document.getElementById('task-form');
                if (form) {
                    const submitEvent = new Event('submit');
                    form.dispatchEvent(submitEvent);
                }
            }
        }
        
        // Escape key to close modal or clear form
        if (e.key === 'Escape') {
            if (isModalOpen) {
                closeBrainDumpModal();
            } else {
                const form = document.getElementById('task-form');
                if (form) {
                    form.reset();
                }
            }
        }
    });
    
    // Focus on the textarea input
    const brainDumpText = document.getElementById('brain-dump-text');
    if (brainDumpText) {
        brainDumpText.focus();
    }
    
    // Track processed time updates to prevent duplicates
    const processedTimeUpdates = new Set();
    
    // Function to check for Pain Cave time updates
    const checkForTimeUpdates = () => {
        // Method 1: Check localStorage
        const timeUpdate = localStorage.getItem('painCaveTimeUpdate');
        if (timeUpdate) {
            console.log('Found time update in localStorage:', timeUpdate);
            try {
                const update = JSON.parse(timeUpdate);
                
                // Check if we've already processed this update
                const updateKey = `${update.taskId}-${update.timestamp}`;
                if (processedTimeUpdates.has(updateKey)) {
                    console.log('Skipping duplicate time update:', updateKey);
                    localStorage.removeItem('painCaveTimeUpdate');
                    return;
                }
                
                console.log('Processing time update:', update);
                esiFilter.updateTaskTime(update.taskId, update.timeSpent);
                processedTimeUpdates.add(updateKey);
                localStorage.removeItem('painCaveTimeUpdate');
                console.log('Applied time update from Pain Cave via localStorage');
                return; // Exit early if we found one
            } catch (e) {
                console.error('Error processing time update:', e);
                localStorage.removeItem('painCaveTimeUpdate');
            }
        }
        
        // Method 2: Check window.name of iframe
        try {
            const iframe = document.querySelector('#pain-cave-content iframe');
            if (iframe && iframe.contentWindow && iframe.contentWindow.name) {
                const windowName = iframe.contentWindow.name;
                if (windowName.startsWith('painCaveUpdate:')) {
                    console.log('Found time update in iframe window.name:', windowName);
                    const updateData = windowName.replace('painCaveUpdate:', '');
                    const update = JSON.parse(updateData);
                    console.log('Processing time update from window.name:', update);
                    esiFilter.updateTaskTime(update.taskId, update.timeSpent);
                    iframe.contentWindow.name = ''; // Clear the flag
                    console.log('Applied time update from Pain Cave via window.name');
                }
            }
        } catch (e) {
            console.log('Window.name check failed (this is normal for security reasons):', e.message);
        }
    };
    
    // Check for Pain Cave time updates periodically (less frequently)
    setInterval(checkForTimeUpdates, 2000); // Check every 2 seconds instead of 500ms
    
    // Also check when window gains focus (user comes back from iframe)
    window.addEventListener('focus', checkForTimeUpdates);
    
    // Check when tab becomes visible (user switches back to this tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('Tab became visible, checking for time updates...');
            checkForTimeUpdates();
        }
    });
    
    // Listen for messages from Pain Cave iframe
    window.addEventListener('message', (event) => {
        console.log('Received postMessage from:', event.origin, 'Data:', event.data);
        if (event.data) {
            switch (event.data.type) {
                case 'switchTab':
                    console.log('Switching to tab:', event.data.tab);
                    switchTab(event.data.tab);
                    break;
                case 'timeUpdate':
                    if (event.data.data && esiFilter) {
                        const update = event.data.data;
                        const updateKey = `${update.taskId}-${update.timestamp}`;
                        
                        // Check if we've already processed this update
                        if (processedTimeUpdates.has(updateKey)) {
                            console.log('Skipping duplicate time update via postMessage:', updateKey);
                            return;
                        }
                        
                        console.log('Processing time update via postMessage:', update);
                        esiFilter.updateTaskTime(update.taskId, update.timeSpent);
                        processedTimeUpdates.add(updateKey);
                        console.log('Time update applied successfully via postMessage');
                    } else {
                        console.warn('Time update received but missing data or esiFilter:', {
                            hasData: !!event.data.data,
                            hasEsiFilter: !!esiFilter,
                            data: event.data.data
                        });
                    }
                    break;
                default:
                    console.log('Unknown message type:', event.data.type, 'Full event:', event.data);
            }
        } else {
            console.log('Received postMessage with no data:', event);
        }
    });
    
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
        
        const energy = tasks.map(t => t.energy);
        const simplicity = tasks.map(t => t.simplicity);
        const impact = tasks.map(t => t.impact);
        const scores = tasks.map(t => t.score);
        
        return {
            avgEnergy: energy.reduce((a, b) => a + b, 0) / energy.length,
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

// Global function for brain dump modal
function openBrainDumpModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'brain-dump-modal-overlay';
    modalOverlay.id = 'brain-dump-modal';

    modalOverlay.innerHTML = `
        <div class="brain-dump-modal">
            <div class="brain-dump-modal-header">
                <h3>🧠 Brain Dump</h3>
            </div>
            
            <form id="brain-dump-modal-form">
                <div class="brain-dump-form-group">
                    <textarea id="brain-dump-modal-text" class="brain-dump-textarea" placeholder="Dump all your to-dos in here, one line at a time

Doodle sticker concepts for astrology
Email Mr. Zuck about FB algorithm
Sell old camera gear 

Fun fact: The ESI filter was birthed through Simie's inability to prioritize 103 tasks that felt equally important (but actually weren't)." rows="6"></textarea>
                </div>
                
                <div class="brain-dump-modal-actions">
                    <div class="keyboard-shortcut-text">
                        Add tasks <span class="shortcut-key">${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</span>+<span class="shortcut-key">Enter</span>
                    </div>
                    <button type="button" class="btn-secondary-compact" onclick="closeBrainDumpModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary-compact">
                        Add Tasks
                    </button>
                </div>
            </form>
        </div>
    `;

    // Add click outside to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeBrainDumpModal();
        }
    });

    // Handle form submission
    const form = modalOverlay.querySelector('#brain-dump-modal-form');
    form.addEventListener('submit', handleModalBrainDumpTasks);

    // Add keyboard shortcut listener specifically for the modal
    const textarea = modalOverlay.querySelector('#brain-dump-modal-text');
    textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
        }
    });

    document.body.appendChild(modalOverlay);
    
    // Focus the textarea
    setTimeout(() => {
        const textarea = document.getElementById('brain-dump-modal-text');
        if (textarea) {
            textarea.focus();
        }
    }, 100);
}

// Function to close the modal
function closeBrainDumpModal() {
    const modal = document.getElementById('brain-dump-modal');
    if (modal) {
        modal.remove();
    }
}

// Function to handle modal form submission
function handleModalBrainDumpTasks(event) {
    event.preventDefault();
    
    const brainDumpText = document.getElementById('brain-dump-modal-text');
    if (!brainDumpText) {
        alert('Error: Could not find textarea element');
        return;
    }

    const text = brainDumpText.value.trim();
    if (!text) {
        alert('Please enter some tasks before adding them.');
        return;
    }

    // Split by newlines and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        alert('Please enter some tasks before adding them.');
        return;
    }

    // Simple direct approach - add tasks to localStorage and trigger re-render
    try {
        // Get existing tasks from localStorage
        let tasks = [];
        try {
            const storedTasks = localStorage.getItem('esi-filter-tasks');
            if (storedTasks) {
                tasks = JSON.parse(storedTasks);
            }
        } catch (e) {
            console.warn('Could not load existing tasks from localStorage:', e);
        }

        // Add new tasks
        lines.forEach(line => {
            const taskName = line.trim();
            if (taskName) {
                const newTask = {
                    id: Date.now() + Math.random(),
                    title: taskName,
                    status: 'unrated',
                    dateCreated: new Date().toISOString()
                };
                tasks.push(newTask);
            }
        });

        // Save back to localStorage
        localStorage.setItem('esi-filter-tasks', JSON.stringify(tasks));

        // If esiFilter exists, update it and re-render
        if (esiFilter && typeof esiFilter.loadTasksFromStorage === 'function') {
            esiFilter.loadTasksFromStorage();
            if (typeof esiFilter.renderTasks === 'function') {
                esiFilter.renderTasks();
            }
            if (typeof esiFilter.showSuccessFeedback === 'function') {
                esiFilter.showSuccessFeedback(`✅ ${lines.length} task${lines.length === 1 ? '' : 's'} added for rating!`);
            }
        }

        // Close modal
        closeBrainDumpModal();

        // If esiFilter isn't available, just show a simple success message
        if (!esiFilter) {
            alert(`✅ ${lines.length} task${lines.length === 1 ? '' : 's'} added! Please refresh the page to see them.`);
        }

    } catch (error) {
        console.error('Error adding tasks:', error);
        alert('There was an error adding tasks. Please try again.');
    }
}

// PWA Service Worker Registration - Only register if ?dev is not in URL
const isDev = window.location.search.includes('dev');

if ('serviceWorker' in navigator && !isDev) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('✅ Service worker registered:', reg.scope))
            .catch(err => console.error('❌ Service worker registration failed:', err));
    });
} else if ('serviceWorker' in navigator && isDev) {
    console.log('🛠️ Service worker registration skipped - DEV MODE ACTIVE');
}

// Show dev mode banner if ?dev is in URL
if (window.location.search.includes('dev')) {
    const devBanner = document.createElement('div');
    devBanner.textContent = '🛠️ DEV MODE ACTIVE';
    devBanner.style.position = 'fixed';
    devBanner.style.top = '0';
    devBanner.style.width = '100%';
    devBanner.style.backgroundColor = '#fff3cd';
    devBanner.style.color = '#856404';
    devBanner.style.padding = '6px';
    devBanner.style.textAlign = 'center';
    devBanner.style.fontWeight = 'bold';
    devBanner.style.zIndex = '1000';
    devBanner.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    devBanner.style.fontSize = '12px';
    devBanner.style.borderBottom = '1px solid #ffeaa7';
    document.body.appendChild(devBanner);
    document.body.style.paddingTop = '30px'; // prevent overlap with app content
}

// Tab Navigation Functions
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    // Handle Pain Cave iframe loading
    if (tabName === 'pain-cave') {
        loadPainCaveIframe();
    }
}

function loadPainCaveIframe() {
    const painCaveContent = document.getElementById('pain-cave-content');
    
    // Check if iframe already exists
    if (!painCaveContent.querySelector('iframe')) {
        // Create iframe with Pain Cave
        const iframe = document.createElement('iframe');
        iframe.src = './Pain Cave/index.html';
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100vh - 60px)';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        
        // Clear existing content and add iframe
        painCaveContent.innerHTML = '';
        painCaveContent.appendChild(iframe);
    }
}