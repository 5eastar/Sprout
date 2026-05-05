// GameCore — base class definition, constructor, and shared question/display methods.

const TIMING = {
    CONFIRM_LOCK_ANIM: 700,   // confirm button lock animation before processing
    INCORRECT_PAUSE: 2000,    // pause after incorrect before showing correction
    CORRECTION_PAUSE: 3500,   // pause after correction prompt before retry/move-on
    CORRECT_PAUSE: 3000,      // pause after correct answer before next question
    HOLD_PRESS_MS: 1600,      // hold duration to toggle answer mode
    SPEAK_DELAY: 50,          // delay before speech synthesis to avoid cut-off
};

class GameCore {
    constructor(config) {
        this.config = config;
        this.homeUrl = config.homeUrl || 'home.html';

        // Quiz state
        this.sessionId = generateId();
        this.lastSavedQuestionCount = 0;
        this.currentQuestion = 0;
        this.results = [];
        this.correctionAttempts = 0;
        this.isInCorrection = false;
        this.questions = [];

        // Target tracking
        this.currentTarget = null;
        this.currentCorrectAnswer = null;
        this.currentQuestionText = '';

        // Options tracking for correction phase
        this.currentOptions = [];
        this.currentOptionImages = [];

        // Timer variables
        this.quizStartTime = null;
        this.questionStartTime = null;
        this.initialResponseTime = null;

        // Wait mode state
        this.answersEnabled = false;
        this.answerModeStartTime = null;
        this.accumulatedAnswerTime = 0;

        // Teacher button state
        this.teacherClickCount = 0;
        this.teacherClickTimer = null;
        this.teacherMenuOpen = false;

        // Selection state (click to select, then confirm)
        this.selectedCard = null;
        this.selectedOption = null;

        // Speech synthesis
        this.synth = window.speechSynthesis;

        // Bound handler for outside-click (stored so removeEventListener works correctly)
        this._boundOutsideClick = this.handleOutsideClick.bind(this);

        // Disable right-click context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    // ========== ABSTRACT METHOD STUBS ==========

    // Override in subclasses to handle the confirmed answer
    processSelectedAnswer(card, option) {}

    // Override with subclass-specific data (target name, question number etc.)
    getCurrentQuestionData() {
        const q = this.questions[this.currentQuestion];
        return {
            questionNumber: this.currentQuestion + 1,
            target: q?.originalTarget?.name ?? this.currentTarget
        };
    }

    getCorrectionMessage() {
        return {
            feedbackText: `This is ${this.currentTarget}`,
            speechText: `This is ${this.currentTarget}`
        };
    }

    getCorrectCorrectionMessage() {
        return {
            feedbackText: `That's correct!`,
            speechText: `That's correct, this is ${this.currentTarget}`
        };
    }

    // Override in subclass (PhonicsGame has its own implementation)
    async showQuestion() {}

    // ========== SHARED QUESTION GENERATION ==========

    // Shared for Identify and Match — PhonicsGame overrides entirely
    async generateQuestions() {
        const allPrograms = await getAllPrograms();
        const program = allPrograms[this.config.programIndex];

        if (!program) {
            console.error('Program not found');
            return false;
        }

        if (!this.config.selectedStimuli || !Array.isArray(this.config.selectedStimuli) || this.config.selectedStimuli.length === 0) {
            console.error('No selected stimuli found in config:', this.config);
            alert('Error: No stimuli selected. Please go back and select items.');
            window.location.href = this.homeUrl;
            return false;
        }

        const selectedStimuli = this.config.selectedStimuli.map(i => program.stimulus[i]);
        const uniqueTargets = [];
        const seenNames = new Set();
        for (const stim of selectedStimuli) {
            if (!seenNames.has(stim.name)) {
                seenNames.add(stim.name);
                uniqueTargets.push(stim);
            }
        }

        this.questions = [];
        for (let i = 0; i < this.config.maxQuestions; i++) {
            const target = uniqueTargets[i % uniqueTargets.length];
            this.questions.push({ target, originalTarget: target });
        }
        this.questions = this.shuffleArray(this.questions);
        return true;
    }

    // Shared option generation — MatchGame overrides _pickOptionImage only
    generateOptions(target, program) {
        const options = [target];
        const otherStimuli = program.stimulus.filter(s => s.name !== target.name);
        const numDistractors = Math.min(this.config.fieldSize - 1, otherStimuli.length);
        options.push(...this.shuffleArray([...otherStimuli]).slice(0, numDistractors));
        const finalOptions = this.shuffleArray(options);
        this.currentOptionImages = finalOptions.map(opt => this._pickOptionImage(opt, target));
        return finalOptions;
    }

    _pickOptionImage(opt) {
        const imgs = opt.images || [];
        return imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
    }

    // ========== SHARED QUESTION DISPLAY ==========

    // Shared preamble for showQuestion: fade, timer, counter, correction reshuffle, feedback reset, options display
    async prepareQuestion(program) {
        await this.fadeOutQuestion();
        this.startQuestionTimer();
        this.updateQuestionCounter();

        if (this.isInCorrection) {
            const combined = this.currentOptions.map((opt, i) => ({ opt, img: this.currentOptionImages[i] }));
            const s = this.shuffleArray(combined);
            this.currentOptions = s.map(x => x.opt);
            this.currentOptionImages = s.map(x => x.img);
        }

        this.resetFeedback();
        this.displayOptions(this.currentOptions, program);
        this.updateAnswerState();
    }

    // Shared option card rendering — Identify & Match both use this
    displayOptions(options, program) {
        const grid = document.getElementById('options-grid');
        if (!grid) return;

        grid.innerHTML = '';
        grid.classList.remove('fade-out');
        grid.setAttribute('data-size', this.config.fieldSize);

        const question = this.questions[this.currentQuestion];
        if (!question) return;

        const isTextOnlyProgram = program?.textOnly || false;
        const forceTextOptions = this.config.stimulusMode === 'picture-to-text' || this._optionsAsText;
        const renderAsText = isTextOnlyProgram || forceTextOptions;

        if (renderAsText || options.some(o => o.textOnly)) {
            grid.classList.add('text-mode');
        } else {
            grid.classList.remove('text-mode');
        }

        const textColors = this.shuffleArray(TEXT_COLORS);

        options.forEach((option, index) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.dataset.optionName = option.name;

            if (option.name === question.target.name) {
                card.dataset.isTarget = 'true';
            }

            if (renderAsText || option.textOnly) {
                const textDiv = document.createElement('div');
                const isSingleLetter = option.name.trim().length === 1;
                textDiv.className = isSingleLetter ? 'option-text-display option-letter' : 'option-text-display';
                option.name.split(' ').forEach(word => {
                    const span = document.createElement('span');
                    span.className = 'option-word';
                    span.textContent = word;
                    textDiv.appendChild(span);
                });
                textDiv.style.color = textColors[index % textColors.length];
                card.appendChild(textDiv);
            } else {
                const imageSrc = this.currentOptionImages[index];
                if (imageSrc) {
                    const img = document.createElement('img');
                    img.src = (imageSrc.startsWith('data:') || imageSrc.startsWith('http')) ? imageSrc : (window.ASSET_BASE || '') + imageSrc;
                    img.draggable = false;
                    card.appendChild(img);
                }
                // sort "both" mode: show text label below icon
                if (option.showLabel) {
                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'option-label-overlay';
                    labelDiv.textContent = option.name;
                    card.appendChild(labelDiv);
                }
            }

            this.attachOptionInteraction(card, option);
            grid.appendChild(card);
        });
    }

    // Default interaction: click to select. MatchGame overrides with a no-op (drag handles it).
    attachOptionInteraction(card, option) {
        card.addEventListener('click', () => this.selectOption(card, option));
    }

    // ========== UTILITY ==========

    shuffleArray(array) { return window.shuffleArray(array); }

    disableAllOptions() {
        document.querySelectorAll('.option-card').forEach(c => c.classList.add('disabled'));
    }

    updateQuestionCounter() {
        const counter = document.getElementById('question-counter');
        if (counter) {
            counter.textContent = `Question ${this.currentQuestion + 1} / ${this.questions.length}`;
        }
    }

    async showEndScreenWithReinforcer(speechText = 'You did it! Great work!') {
        document.querySelector('.toggle')?.style.setProperty('display', 'none');
        document.getElementById('answer-overlay')?.remove();
        document.getElementById('current-pupil-indicator')?.style.setProperty('display', 'none');

        const quizScreen = document.getElementById('game-screen');
        const endScreen = document.getElementById('end-screen');
        if (quizScreen) quizScreen.style.display = 'none';
        if (endScreen) endScreen.style.display = 'flex';

        this.speak(speechText);
        soundFX.playFanfare();

        const selectedReinforcer = await this.waitForReinforcerSelection();
        const reinforcerSelection = document.getElementById('reinforcer-selection');
        ensureReinforcerContainer();
        const reinforcerContainer = document.getElementById('reinforcer-container');
        if (reinforcerSelection) reinforcerSelection.style.display = 'none';
        if (reinforcerContainer) reinforcerContainer.classList.add('active');
        if (endScreen) endScreen.querySelectorAll(':scope > h1').forEach(h => h.style.display = 'none');

        try {
            const stored = JSON.parse(sessionStorage.getItem('quizResults') || '{}');
            stored.reinforcer = selectedReinforcer;
            sessionStorage.setItem('quizResults', JSON.stringify(stored));
        } catch (e) { console.warn('Failed to persist reinforcer to session:', e); }

        if (typeof initializeReinforcer === 'function') initializeReinforcer(selectedReinforcer);
        this.showReinforcerCountdown();
    }

}

window.GameCore = GameCore;

// Inject confirm button and reinforcer container once (avoids duplicating the HTML across every game page)
function ensureConfirmButton() {
    if (document.getElementById('confirm-answer-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'confirm-answer-btn';
    btn.className = 'confirm-answer-btn';
    btn.style.display = 'none';
    btn.innerHTML = `Confirm <svg class="confirm-lock-icon" width="36" height="40" viewBox="0 0 36 40">
        <path class="lockb" d="M27 27C27 34.1797 21.1797 40 14 40C6.8203 40 1 34.1797 1 27C1 19.8203 6.8203 14 14 14C21.1797 14 27 19.8203 27 27ZM15.6298 26.5191C16.4544 25.9845 17 25.056 17 24C17 22.3431 15.6569 21 14 21C12.3431 21 11 22.3431 11 24C11 25.056 11.5456 25.9845 12.3702 26.5191L11 32H17L15.6298 26.5191Z"></path>
        <path class="lock" d="M6 21V10C6 5.58172 9.58172 2 14 2V2C18.4183 2 22 5.58172 22 10V21"></path>
        <path class="bling" d="M29 20L31 22"></path>
        <path class="bling" d="M31.5 15H34.5"></path>
        <path class="bling" d="M29 10L31 8"></path>
    </svg>`;
    document.getElementById('options-grid')?.after(btn);
}

function ensureReinforcerContainer() {
    if (document.getElementById('reinforcer-container')) return;

    const container = document.createElement('div');
    container.id = 'reinforcer-container';
    const ab = window.ASSET_BASE || '';
    container.innerHTML = `
        <div class="balloons">
            <img src="${ab}images/animation/b1.png" alt=""><img src="${ab}images/animation/b2.png" alt="">
            <img src="${ab}images/animation/b3.png" alt=""><img src="${ab}images/animation/b4.png" alt="">
            <img src="${ab}images/animation/b5.png" alt=""><img src="${ab}images/animation/b6.png" alt="">
            <img src="${ab}images/animation/b7.png" alt=""><img src="${ab}images/animation/b8.png" alt="">
            <img src="${ab}images/animation/b1.png" alt=""><img src="${ab}images/animation/b2.png" alt="">
            <img src="${ab}images/animation/b3.png" alt=""><img src="${ab}images/animation/b4.png" alt="">
            <img src="${ab}images/animation/b5.png" alt=""><img src="${ab}images/animation/b6.png" alt="">
            <img src="${ab}images/animation/b7.png" alt=""><img src="${ab}images/animation/b8.png" alt="">
        </div>
        <canvas id="fireworksCanvas" style="display:none;"></canvas>
        <canvas id="particleCanvas" style="display:none;"></canvas>
        <div id="xylophone-reinforcer" class="hidden">
            <div class="xy-song-select">
                <button class="btn-primary" data-song="hickory">Hickory Dickory Dock</button>
                <button class="btn-primary" data-song="baa">Baa Baa Black Sheep</button>
                <button class="btn-primary" data-song="twinkle">Twinkle Twinkle</button>
            </div>
            <div class="xy-keys"></div>
            <div class="xy-mallet"></div>
        </div>
    `;

    const endScreen = document.getElementById('end-screen');
    if (endScreen) endScreen.appendChild(container);
    else document.body.appendChild(container);
}
