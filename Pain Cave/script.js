class PomodoroTimer {
    constructor() {
        this.secondsElapsed = 0;
        this.timerId = null;
        this.isRunning = false;
        this.lastBreakTime = 0;
        this.selectedBreakTime = null;
        this.isRestMode = false;
        this.savedTime = 0;
        this.startTime = null; // Add startTime to track when timer started
        this.intention = ""; // Store the user's intention
        
        // Add break timer properties
        this.breakTimerId = null;
        this.breakTimeElapsed = 0;
        this.breakStartTime = null;
        this.isBreakTimerPaused = false;
        this.breakPausedAt = 0;
        
        // Sound settings
        this.soundEnabled = true;
        this.volume = 0.5;
        
        // DOM Elements
        this.timeDisplay = document.querySelector('.time-display');
        this.breakCountdown = document.getElementById('break-countdown');
        this.breakTimer = document.querySelector('.break-timer');
        this.toggleButton = document.getElementById('toggle');
        this.resetButton = document.getElementById('reset');
        this.soundToggle = document.getElementById('sound-toggle');
        this.volumeSlider = document.getElementById('volume-slider');
        this.collapseToggle = document.getElementById('collapse-toggle');
        this.breakSettings = document.querySelector('.break-settings');
        this.caveImage = document.querySelector('.cave-image');
        this.restModeButton = document.getElementById('rest-mode');
        this.intentionInput = document.getElementById('intention-input');
        this.intentionDisplay = document.getElementById('intention-display');
        
        // Break time elements
        this.breakRadios = document.querySelectorAll('input[name="break-time"]');
        this.customTimeInput = document.getElementById('custom-time');
        
        // Modal elements
        this.breakModal = document.getElementById('break-modal');
        this.breakMessage = document.getElementById('break-message');
        this.takeBreakButton = document.getElementById('take-break');
        this.keepGoingButton = document.getElementById('keep-going');
        
        // Rest end modal elements
        this.restEndModal = document.getElementById('rest-end-modal');
        this.enterPainCaveButton = document.getElementById('enter-pain-cave');
        this.keepChillinButton = document.getElementById('keep-chillin');
        
        // Info modal elements
        this.infoModal = document.getElementById('info-modal');
        this.closeInfoButton = document.getElementById('close-info');
        
        // Sound elements
        this.magicalSound = new Audio('sounds/magical twinkle.mp3');
        this.magicalSound.volume = this.volume;
        
        // Event Listeners
        this.toggleButton.addEventListener('click', () => this.toggle());
        this.resetButton.addEventListener('click', () => this.reset());
        this.collapseToggle.addEventListener('click', () => this.toggleCollapse());
        this.restModeButton.addEventListener('click', () => {
            if (!this.isRestMode) {
                this.toggleRestMode();
                // No need to update text anymore, just show the button as disabled
                this.restModeButton.classList.add('disabled');
                this.restModeButton.classList.remove('ready-to-start');
            } else if (this.isRestMode && this.selectedBreakTime !== null) {
                // Check if the break timer is running
                if (this.breakTimerId) {
                    // Timer is running, pause it
                    this.pauseBreakTimer();
                    this.restModeButton.textContent = 'Chill';
                } else {
                    // Timer is not running or is paused, start/resume it
                    this.startBreakTimer();
                    this.restModeButton.textContent = 'Pause';
                    this.restModeButton.classList.remove('ready-to-start');
                    this.restModeButton.classList.remove('disabled');
                }
            }
        });
        
        // Cave image click for info modal
        this.caveImage.addEventListener('click', (e) => {
            // Only show info modal when clicked and not currently in a timer
            if (!this.isRunning) {
                this.infoModal.style.display = 'block';
                e.stopPropagation();
            }
        });
        
        // Close info modal
        this.closeInfoButton.addEventListener('click', () => {
            this.infoModal.style.display = 'none';
        });
        
        // Close modals when clicking outside the content
        window.addEventListener('click', (e) => {
            if (e.target === this.breakModal) {
                this.breakModal.style.display = 'none';
                this.start(); // Resume the timer
            }
            if (e.target === this.restEndModal) {
                this.restEndModal.style.display = 'none';
            }
            if (e.target === this.infoModal) {
                this.infoModal.style.display = 'none';
            }
        });
        
        // Intention input listener
        this.intentionInput.addEventListener('change', () => {
            this.intention = this.intentionInput.value.trim();
            this.updateIntentionDisplay();
        });
        
        // Break time listeners
        this.breakRadios.forEach(radio => {
            const wrapper = radio.closest('.break-toggle');
            const label = wrapper.querySelector('label');
            
            // Create a custom radio button
            const customRadio = document.createElement('div');
            customRadio.className = 'custom-radio';
            radio.style.display = 'none'; // Hide the original radio
            wrapper.insertBefore(customRadio, label);
            
            // Update the custom radio appearance based on the actual radio state
            const updateCustomRadio = () => {
                customRadio.classList.toggle('checked', radio.checked);
            };
            
            // Handle clicks on the custom radio
            customRadio.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (radio.checked) {
                    // If already checked, uncheck it
                    radio.checked = false;
                    this.selectedBreakTime = null;
                    this.customTimeInput.disabled = true;
                    this.breakCountdown.textContent = '--:--';
                    if (this.isRestMode) {
                        this.breakTimer.textContent = 'select a break duration';
                        // Disable the button when no duration is selected
                        this.restModeButton.classList.remove('ready-to-start');
                        this.restModeButton.classList.add('disabled');
                    }
                } else {
                    // If not checked, check it and uncheck others
                    this.breakRadios.forEach(otherRadio => {
                        otherRadio.checked = false;
                        otherRadio.closest('.break-toggle').querySelector('.custom-radio').classList.remove('checked');
                    });
                    radio.checked = true;
                    this.updateBreakTime(radio);
                }
                updateCustomRadio();
            });
            
            // Update the custom radio when the actual radio changes
            radio.addEventListener('change', updateCustomRadio);
            
                    // Initial state
        updateCustomRadio();
    });
    
    this.checkForESITask();
    
    this.customTimeInput.addEventListener('change', () => {
            if (document.getElementById('break-custom').checked) {
                this.selectedBreakTime = parseInt(this.customTimeInput.value) * 60;
                // If in rest mode, update the break timer display but don't start the timer
                if (this.isRestMode) {
                    const breakMinutes = Math.floor(this.selectedBreakTime / 60);
                    const breakSeconds = this.selectedBreakTime % 60;
                    this.breakTimer.textContent = `break ends in ${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
                    // Don't automatically start the timer
                    
                    // Update the rest mode button to look ready to start
                    this.restModeButton.classList.add('ready-to-start');
                    this.restModeButton.classList.remove('disabled');
                } else {
                    // Update the break countdown timer in light mode
                    const timeUntilBreak = this.selectedBreakTime;
                    if (timeUntilBreak > 0) {
                        const breakMinutes = Math.floor(timeUntilBreak / 60);
                        const breakSeconds = timeUntilBreak % 60;
                        this.breakCountdown.textContent = `${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
                    } else {
                        this.breakCountdown.textContent = '--:--';
                    }
                }
            }
        });
        
        // Modal button listeners
        this.takeBreakButton.addEventListener('click', () => {
            this.pause();
            this.breakModal.style.display = 'none';
            this.toggleRestMode();
        });
        
        this.keepGoingButton.addEventListener('click', () => {
            this.breakModal.style.display = 'none';
            this.start();  // Resume the timer when clicking Keep Going
        });
        
        // Rest end modal button listeners
        this.enterPainCaveButton.addEventListener('click', () => {
            this.restEndModal.style.display = 'none';
            this.toggle(); // Go back to pain cave
        });
        
        this.keepChillinButton.addEventListener('click', () => {
            this.restEndModal.style.display = 'none';
            // Reset the break time selection to allow selecting a new duration
            this.selectedBreakTime = null;
            this.breakRadios.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.closest('.break-toggle').querySelector('.custom-radio').classList.remove('checked');
            });
            this.customTimeInput.disabled = true;
            this.breakTimer.textContent = 'select a break duration';
        });
        
        // Sound control listeners
        this.soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.playTestSound();
        });
        
        // Handle volume changes
        const updateVolume = (e) => {
            this.volume = e.target.value / 100;
            this.magicalSound.volume = this.volume;
        };

        // Update volume while sliding
        this.volumeSlider.addEventListener('input', updateVolume);
        
        // Play test sound only when sliding ends
        this.volumeSlider.addEventListener('change', (e) => {
            updateVolume(e);
            if (this.soundEnabled) {
                this.playTestSound();
            }
        });
        
        this.updateDisplay();
    }
    
    updateBreakTime(checkbox) {
        if (checkbox.id === 'break-custom') {
            this.customTimeInput.disabled = false;
            this.selectedBreakTime = parseInt(this.customTimeInput.value) * 60;
        } else {
            this.customTimeInput.disabled = true;
            this.selectedBreakTime = parseInt(checkbox.value) * 60;
        }
        
        // Set lastBreakTime to current time when break time is changed
        this.lastBreakTime = this.secondsElapsed;
        
        // If in rest mode, update the break timer display but don't start the timer
        if (this.isRestMode) {
            const breakMinutes = Math.floor(this.selectedBreakTime / 60);
            const breakSeconds = this.selectedBreakTime % 60;
            this.breakTimer.textContent = `break ends in ${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
            // Don't automatically start the timer
            
            // Update the rest mode button to look ready to start
            this.restModeButton.classList.add('ready-to-start');
            this.restModeButton.classList.remove('disabled');
        } else {
            // Update the break countdown timer in light mode (when not in cave/rest mode)
            const timeUntilBreak = this.selectedBreakTime;
            if (timeUntilBreak > 0) {
                const breakMinutes = Math.floor(timeUntilBreak / 60);
                const breakSeconds = timeUntilBreak % 60;
                this.breakCountdown.textContent = `${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
            } else {
                this.breakCountdown.textContent = '--:--';
            }
        }
    }
    
    toggleRestMode() {
        if (this.isRestMode) {
            // Don't exit rest mode when clicking the button
            return;
        } else {
            // Save the intention before entering Rest Mode
            this.intention = this.intentionInput.value.trim();
            
            // Enter rest mode
            this.isRestMode = true;
            this.savedTime = this.secondsElapsed; // Save current time
            this.pause();
            this.caveImage.src = 'images/DETOX.png';
            this.caveImage.alt = 'Detox';
            this.toggleButton.textContent = 'Enter Pain Cave';
            this.toggleButton.style.backgroundColor = '#ff8900';
            this.toggleButton.style.color = 'white';
            this.restModeButton.textContent = 'Start Chillin';
            this.restModeButton.classList.remove('ready-to-start');
            this.restModeButton.classList.add('disabled');
            document.querySelector('.container').classList.add('in-rest-mode');
            document.querySelector('.container').classList.remove('in-cave');
            // Show timer in rest mode with light teal color
            this.timeDisplay.style.display = 'block';
            this.timeDisplay.style.color = 'rgba(255, 255, 255, 0.7)';
            // Hide break countdown and show break timer
            this.breakCountdown.parentElement.style.display = 'none';
            this.breakTimer.style.display = 'block';
            // Change break button text
            this.collapseToggle.textContent = 'End break after...';
            
            // Reset break timer display and selection
            this.breakTimer.textContent = 'select a break duration';
            this.selectedBreakTime = null;
            
            // Uncheck all radio buttons to force user selection
            this.breakRadios.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.closest('.break-toggle').querySelector('.custom-radio').classList.remove('checked');
            });
            this.customTimeInput.disabled = true;
            
            // Expand break settings to show the options
            this.breakSettings.classList.remove('collapsed');
            
            // Update intention display
            this.updateIntentionDisplay();
        }
    }
    
    toggle() {
        if (this.isRestMode) {
            // Enter pain cave from rest mode
            this.isRestMode = false;
            this.secondsElapsed = this.savedTime; // Restore saved time
            
            // Stop break timer if it's running
            if (this.breakTimerId) {
                cancelAnimationFrame(this.breakTimerId);
                this.breakTimerId = null;
            }
            
            // Reset break timer pause state
            this.isBreakTimerPaused = false;
            this.breakPausedAt = 0;
            
            this.start();
            this.caveImage.src = 'images/PAIN CAVE.png';
            this.caveImage.alt = 'Pain Cave';
            this.toggleButton.textContent = 'Exit Pain Cave';
            this.toggleButton.style.backgroundColor = '#1abc9c';
            this.toggleButton.style.color = 'white';
            this.restModeButton.textContent = 'Rest Mode';
            document.querySelector('.container').classList.remove('in-rest-mode');
            document.querySelector('.container').classList.add('in-cave');
            // Remove inline color style from timer
            this.timeDisplay.style.color = '';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
            this.breakTimer.style.display = 'none';
            // Reset break button text
            this.collapseToggle.textContent = 'Take a break after...';
            // Update intention display
            this.updateIntentionDisplay();
            return;
        }
        
        if (!this.isRunning) {
            // Save the intention before entering Pain Cave
            this.intention = this.intentionInput.value.trim();
            
            // Enter pain cave
            this.start();
            this.caveImage.src = 'images/PAIN CAVE.png';
            this.caveImage.alt = 'Pain Cave';
            this.toggleButton.textContent = 'Exit Pain Cave';
            this.toggleButton.style.backgroundColor = '#1abc9c';
            this.toggleButton.style.color = 'white';
            document.querySelector('.container').classList.add('in-cave');
            // Remove inline color style from timer
            this.timeDisplay.style.color = '';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
            this.breakTimer.style.display = 'none';
            // Update intention display
            this.updateIntentionDisplay();
        } else {
            // Exit pain cave
            this.pause();
            // Save the current time before exiting
            this.savedTime = this.secondsElapsed;
            this.toggleButton.textContent = 'Enter Pain Cave';
            this.toggleButton.style.backgroundColor = '#ff8900';
            this.toggleButton.style.color = 'white';
            document.querySelector('.container').classList.remove('in-cave');
            // Remove inline color style from timer
            this.timeDisplay.style.color = '';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
            this.breakTimer.style.display = 'none';
        }
    }
    
    playTestSound() {
        if (this.soundEnabled) {
            this.magicalSound.currentTime = 0;
            this.magicalSound.play().catch(error => {
                console.log('Error playing test sound:', error);
            });
        }
    }
    
    startBreakTimer() {
        // Cancel any existing break timer
        if (this.breakTimerId) {
            cancelAnimationFrame(this.breakTimerId);
        }
        
        if (!this.isBreakTimerPaused) {
            // Starting fresh
            this.breakStartTime = new Date(); // Record break start time
            this.breakTimeElapsed = 0;
        } else {
            // Resuming from pause
            this.breakStartTime = new Date(new Date().getTime() - (this.breakPausedAt * 1000));
            this.isBreakTimerPaused = false;
        }
        
        const updateBreakTimer = () => {
            // Calculate elapsed time based on actual time passed
            const now = new Date();
            const elapsed = Math.floor((now - this.breakStartTime) / 1000);
            this.breakTimeElapsed = elapsed;
            
            if (this.isRestMode && this.selectedBreakTime !== null) {
                // Only update the break timer display in rest mode
                const timeUntilEnd = this.selectedBreakTime - this.breakTimeElapsed;
                if (timeUntilEnd > 0) {
                    const breakMinutes = Math.floor(timeUntilEnd / 60);
                    const breakSeconds = timeUntilEnd % 60;
                    this.breakTimer.textContent = `break ends in ${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
                } else {
                    this.breakTimer.textContent = 'break ends in --:--';
                    
                    // Play sound when break is over
                    if (this.soundEnabled) {
                        this.magicalSound.currentTime = 0;
                        this.magicalSound.play().catch(error => {
                            console.log('Error playing sound:', error);
                        });
                    }
                    
                    // Show the rest-end modal
                    this.restEndModal.style.display = 'block';
                    
                    // Stop the break timer
                    cancelAnimationFrame(this.breakTimerId);
                    this.breakTimerId = null;
                    this.isBreakTimerPaused = false;
                    this.restModeButton.textContent = 'Start Chillin';
                    this.restModeButton.classList.add('disabled');
                    return;
                }
            }
            
            this.breakTimerId = requestAnimationFrame(updateBreakTimer);
        };
        
        this.breakTimerId = requestAnimationFrame(updateBreakTimer);
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = new Date(); // Record start time
            // Adjust startTime to account for existing elapsed time
            this.startTime = new Date(new Date().getTime() - (this.secondsElapsed * 1000));
            
            const updateTimer = () => {
                if (!this.isRunning) return;
                
                // Calculate elapsed time based on actual time passed
                const now = new Date();
                const elapsed = Math.floor((now - this.startTime) / 1000);
                this.secondsElapsed = elapsed;
                
                this.updateDisplay();
                
                // Check for break time only if a break time is selected
                if (this.selectedBreakTime !== null && 
                    this.secondsElapsed >= this.selectedBreakTime && 
                    this.secondsElapsed - this.lastBreakTime >= this.selectedBreakTime) {
                    
                    console.log('Break time reached:', {
                        secondsElapsed: this.secondsElapsed,
                        selectedBreakTime: this.selectedBreakTime,
                        lastBreakTime: this.lastBreakTime
                    });
                    
                    const totalMinutes = Math.floor(this.secondsElapsed / 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    
                    let timeString = '';
                    if (hours > 0) {
                        timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
                        if (minutes > 0) {
                            timeString += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`;
                        }
                    } else {
                        timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
                    }
                    
                    this.breakMessage.innerHTML = `you've been in the pain cave for:<br><span class="time-highlight">${timeString}</span>`;
                    this.breakModal.style.display = 'block';
                    this.lastBreakTime = this.secondsElapsed;
                    this.pause();
                    
                    if (this.soundEnabled) {
                        this.magicalSound.currentTime = 0;
                        this.magicalSound.play().catch(error => {
                            console.log('Error playing sound:', error);
                        });
                    }
                }
            };
            
            // Use setInterval for more reliable timing when tab is not in focus
            this.timerId = setInterval(updateTimer, 1000);
            
            // Also use requestAnimationFrame for smoother updates when tab is in focus
            const smoothUpdate = () => {
                if (!this.isRunning) return;
                updateTimer();
                requestAnimationFrame(smoothUpdate);
            };
            requestAnimationFrame(smoothUpdate);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timerId);
            cancelAnimationFrame(this.timerId);
        }
    }
    
    reset() {
        this.pause();
        
        // Also clear any break timer
        if (this.breakTimerId) {
            cancelAnimationFrame(this.breakTimerId);
            this.breakTimerId = null;
        }
        
        // Reset break timer pause state
        this.isBreakTimerPaused = false;
        this.breakPausedAt = 0;
        
        this.secondsElapsed = 0;
        this.breakTimeElapsed = 0;
        this.lastBreakTime = 0;
        this.selectedBreakTime = null; // Clear break time selection
        this.isRestMode = false; // Reset rest mode state
        this.updateDisplay();
        this.toggleButton.textContent = 'Enter Pain Cave';
        this.toggleButton.style.backgroundColor = '#ff8900'; // Orange
        this.toggleButton.style.color = 'white';
        this.restModeButton.textContent = 'Rest Mode';
        this.restModeButton.classList.remove('ready-to-start', 'disabled');
        this.breakCountdown.textContent = '--:--';
        // Reset the break timer text
        this.breakTimer.textContent = 'break ends in --:--';
        document.querySelector('.container').classList.remove('in-cave', 'in-rest-mode'); // Exit both pain cave and rest mode states
        // Remove inline color style from timer
        this.timeDisplay.style.color = '';
        // Show timers
        this.timeDisplay.style.display = 'block';
        this.breakCountdown.parentElement.style.display = 'block';
        this.breakTimer.style.display = 'none';
        // Reset break time selection
        this.breakRadios.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.break-toggle').querySelector('.custom-radio').classList.remove('checked');
        });
        this.customTimeInput.value = '10';
        this.customTimeInput.disabled = true;
        // Reset cave image
        this.caveImage.src = 'images/PAIN CAVE.png';
        this.caveImage.alt = 'Pain Cave';
        // Reset break button text
        this.collapseToggle.textContent = 'Take a break after...';
        // Reset intention
        this.intention = '';
        this.intentionInput.value = '';
        this.updateIntentionDisplay(); // Use the method to properly update the display
    }
    
    updateDisplay() {
        const totalSeconds = this.secondsElapsed;
        let timeString;
        
        if (totalSeconds >= 3600) {
            // Format as HH:MM:SS when over 60 minutes
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // Format as MM:SS when under 60 minutes
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        this.timeDisplay.textContent = timeString;
        
        // Update browser tab title with timer
        document.title = `${timeString} - Pain Cave`;
        
        // Update break countdown only in pain cave mode
        if (this.selectedBreakTime !== null && !this.isRestMode) {
            const timeUntilBreak = this.selectedBreakTime - (this.secondsElapsed - this.lastBreakTime);
            if (timeUntilBreak > 0) {
                const breakMinutes = Math.floor(timeUntilBreak / 60);
                const breakSeconds = timeUntilBreak % 60;
                this.breakCountdown.textContent = `${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
            } else {
                this.breakCountdown.textContent = '--:--';
            }
        }
        
        // We don't need to update break timer here anymore since it's handled in startBreakTimer
    }
    
    toggleCollapse() {
        this.breakSettings.classList.toggle('collapsed');
    }
    
    // Add method to pause the break timer
    pauseBreakTimer() {
        if (this.breakTimerId) {
            cancelAnimationFrame(this.breakTimerId);
            this.breakTimerId = null;
            this.isBreakTimerPaused = true;
            this.breakPausedAt = this.breakTimeElapsed;
        }
    }
    
    // New method to update the intention display
    updateIntentionDisplay() {
        if (this.intention) {
            this.intentionDisplay.textContent = `in the pain cave: ${this.intention}`;
            this.intentionDisplay.style.display = 'block';
        } else {
            this.intentionDisplay.textContent = '';
            this.intentionDisplay.style.display = 'none';
        }
    }
    
    // Check for task from ESI Filter and auto-populate
    checkForESITask() {
        console.log('checkForESITask running');
        const painCaveTask = localStorage.getItem('painCaveTask');
        if (painCaveTask) {
            this.intentionInput.value = painCaveTask;
            this.intention = painCaveTask;
            this.updateIntentionDisplay();
            localStorage.removeItem('painCaveTask');
            console.log('ESI Filter task loaded:', painCaveTask);
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});

// Set break button width to match main buttons
function setBreakButtonWidth() {
    const mainButtons = document.getElementById('main-buttons');
    const breakButton = document.querySelector('.break-button');
    if (mainButtons && breakButton) {
        breakButton.style.width = mainButtons.offsetWidth + 'px';
    }
}

// Call on load and resize
window.addEventListener('load', setBreakButtonWidth);
window.addEventListener('resize', setBreakButtonWidth); 