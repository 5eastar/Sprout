// GameCore mixin — selection, confirm, answer toggle, teacher menu, sound button.
// Requires: core.js, timer.js, speech.js loaded first.

Object.assign(GameCore.prototype, {

    // ========== SELECTION & CONFIRM ==========
    
    
    setupConfirmButton() {
        ensureConfirmButton();
        const confirmBtn = document.getElementById('confirm-answer-btn');
        if (!confirmBtn) return;

        confirmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.selectedCard && this.selectedOption !== null) {
                confirmBtn.classList.add('locked');
                setTimeout(() => this.confirmAnswer(), TIMING.CONFIRM_LOCK_ANIM);
            }
        });
    },

    // ------ SPECIFIC TO IDENTIFY & PHONICS, NOT MATCH ------
    selectOption(card, option) {
        if (!this.answersEnabled || card.classList.contains('disabled')) return;

        const confirmBtn = document.getElementById('confirm-answer-btn');

        // Remove previous selection
        const previousSelected = document.querySelector('.option-card.selected');
        if (previousSelected) previousSelected.classList.remove('selected');

        card.classList.add('selected');
        this.selectedCard = card;
        this.selectedOption = option;

        // Move confirm button inside the selected card
        if (confirmBtn) {
            confirmBtn.classList.remove('locked');
            card.appendChild(confirmBtn);
            confirmBtn.style.display = 'flex';
        }
    },

    confirmAnswer() {
        if (!this.selectedCard || this.selectedOption === null) return;

        const confirmBtn = document.getElementById('confirm-answer-btn');
        if (confirmBtn) {
            confirmBtn.style.display = 'none';
            confirmBtn.classList.remove('locked');
            document.getElementById('options-grid')?.after(confirmBtn);
        }

        this.selectedCard.classList.remove('selected');
        this.processSelectedAnswer(this.selectedCard, this.selectedOption);

        this.selectedCard = null;
        this.selectedOption = null;
    },

    clearSelection() {
        if (this.selectedCard) {
            this.selectedCard.classList.remove('selected');
        }
        this.selectedCard = null;
        this.selectedOption = null;

        const confirmBtn = document.getElementById('confirm-answer-btn');
        if (confirmBtn) {
            confirmBtn.style.display = 'none';
            confirmBtn.classList.remove('locked');
            document.getElementById('options-grid')?.after(confirmBtn);
        }
    },

    // ========== ANSWER TOGGLE (WAIT MODE) ==========

    setupAnswerToggle(startEnabled = true) {
        const toggle = document.getElementById('btn');
        const thumb = document.querySelector('.thumb');
        if (!toggle || !thumb) return;

        let pressTimer = null;
        let isPressed = false;

        const startPress = () => {
            isPressed = true;
            pressTimer = setTimeout(() => {
                if (isPressed) {
                    toggle.checked = !toggle.checked;
                    this.answersEnabled = toggle.checked;

                    if (this.answersEnabled) {
                        this.answerModeStartTime = Date.now();
                    } else {
                        if (this.answerModeStartTime) {
                            this.accumulatedAnswerTime += Date.now() - this.answerModeStartTime;
                            this.answerModeStartTime = null;
                        }
                    }

                    this.updateAnswerState();
                    if (navigator.vibrate) navigator.vibrate(50);
                }
            }, TIMING.HOLD_PRESS_MS);
        };

        const endPress = () => {
            isPressed = false;
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        toggle.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });

        thumb.addEventListener('mousedown', (e) => { e.preventDefault(); startPress(); });
        thumb.addEventListener('mouseup', endPress);
        thumb.addEventListener('mouseleave', endPress);

        thumb.addEventListener('touchstart', (e) => { e.preventDefault(); startPress(); }, { passive: false });
        thumb.addEventListener('touchend', endPress);
        thumb.addEventListener('touchcancel', endPress);

        toggle.checked = startEnabled;
        this.answersEnabled = startEnabled;
    },

    updateAnswerState() {
        const quizScreen = document.getElementById('game-screen');
        const grid = document.getElementById('options-grid');
        let overlay = document.getElementById('answer-overlay');

        const isQuizVisible = quizScreen && quizScreen.style.display !== 'none';

        if (this.answersEnabled) {
            grid?.classList.remove('answers-disabled');
            if (overlay) overlay.remove();
            document.querySelectorAll('.option-card').forEach(c => c.classList.remove('disabled'));
        } else {
            grid?.classList.add('answers-disabled');
            if (overlay) overlay.remove();

            if (!isQuizVisible) return;

            overlay = document.createElement('div');
            overlay.id = 'answer-overlay';

            const span = document.createElement('span');
            span.textContent = '\uD83D\uDC42 Listening...?';
            span.style.cssText = `
                font-size: clamp(1.8rem, 3.5vh, 2.5rem);
                font-weight: 700;
                color: white;
                text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
                padding: 15px 30px;
                background: linear-gradient(135deg, #7474bf 0%, #348ac7 100%);
                border-radius: 24px;
            `;
            overlay.appendChild(span);
            document.body.appendChild(overlay);

            document.querySelectorAll('.option-card').forEach(c => c.classList.add('disabled'));
        }
    },

    // ========== TEACHER MENU ==========

    setupTeacherButton(resultsCallback) {
        const teacherBtn = document.getElementById('teacher-btn');
        if (!teacherBtn) return;

        this.resultsCallback = resultsCallback;

        teacherBtn.style.width = '40px';
        teacherBtn.style.height = '40px';
        teacherBtn.style.fontSize = '1rem';
        teacherBtn.style.opacity = '0.3';
        teacherBtn.style.transition = 'opacity 0.3s';
        teacherBtn.style.zIndex = '20 !important';

        teacherBtn.addEventListener('mouseleave', () => {
            if (!this.teacherMenuOpen) teacherBtn.style.opacity = '0.3';
        });

        teacherBtn.addEventListener('click', () => {
            this.teacherClickCount++;

            if (this.teacherClickCount === 1) {
                this.teacherClickTimer = setTimeout(() => {
                    this.teacherClickCount = 0;
                }, 1000);
            } else if (this.teacherClickCount === 3) {
                clearTimeout(this.teacherClickTimer);
                this.teacherClickCount = 0;
                if (this.teacherMenuOpen) {
                    this.closeTeacherMenu();
                } else {
                    this.openTeacherMenu();
                }
            }
        });
    },

    openTeacherMenu() {
        this.closeTeacherMenu();

        const menu = document.createElement('div');
        menu.id = 'teacher-menu';
        menu.style.cssText = `
            position: fixed;
            bottom: 75px;
            right: 20px;
            background: #ffffff8e;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            padding: 8px;
            z-index: 1001;
            min-width: 100px;
            max-width: 160px;
        `;

        const quizScreen = document.getElementById('game-screen');
        const isQuizScreen = quizScreen && quizScreen.style.display !== 'none';

        const endScreen = document.getElementById('end-screen');
        const isEndScreen = endScreen && endScreen.style.display !== 'none';

        const breakScreen = document.getElementById('break-screen');
        const isBreakScreen = breakScreen && breakScreen.style.display !== 'none';

        const btnStyle = `width:100%;padding:8px;margin-bottom:4px;color:white;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;`;

        const skipCountdownBtn = (isEndScreen || isBreakScreen) ? `
            <button id="skip-countdown-btn" style="${btnStyle}background:linear-gradient(135deg,#ffd93d 0%,#ff6b35 100%);">Skip Countdown ⏰</button>
        ` : '';

        const skipToEndBtn = isQuizScreen ? `
            <button id="skip-to-end-btn" style="${btnStyle}background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);">Skip to End >>>>></button>
        ` : '';

        menu.innerHTML = `
            <button id="results-btn" style="${btnStyle}background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">Results 📊</button>
            ${skipToEndBtn}
            ${skipCountdownBtn}
            <button id="menu-btn" style="${btnStyle}background:linear-gradient(135deg,#9627ec 0%,#17c2d2 100%);">Setup Menu 📋</button>
            <button id="home-btn" style="${btnStyle}background:linear-gradient(135deg,#e7c60c 0%,#f553d7 100%);margin-bottom:0;">Home ⌂</button>
        `;

        document.body.appendChild(menu);
        this.teacherMenuOpen = true;

        document.getElementById('results-btn')?.addEventListener('click', () => this.showResults());
        document.getElementById('skip-to-end-btn')?.addEventListener('click', () => this.skipToEnd());
        document.getElementById('skip-countdown-btn')?.addEventListener('click', () => this.skipCountdown());
        document.getElementById('menu-btn')?.addEventListener('click', () => { window.location.href = this.homeUrl; });
        document.getElementById('home-btn')?.addEventListener('click', () => { window.location.href = 'home.html'; });

        setTimeout(() => {
            document.addEventListener('click', this._boundOutsideClick);
        }, 100);
    },

    handleOutsideClick(e) {
        const menu = document.getElementById('teacher-menu');
        const btn = document.getElementById('teacher-btn');
        if (menu && !menu.contains(e.target) && e.target !== btn) {
            this.closeTeacherMenu();
        }
    },

    closeTeacherMenu() {
        document.getElementById('teacher-menu')?.remove();
        this.teacherMenuOpen = false;
        document.removeEventListener('click', this._boundOutsideClick);

        const teacherBtn = document.getElementById('teacher-btn');
        if (teacherBtn) teacherBtn.style.opacity = '0.3';
    },

    showResults() {
        this.closeTeacherMenu();

        const resultsData = {
            results: this.results,
            totalTime: this.getTotalTime()
        };
        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));

        if (this.config.pupilId && this.results.length > 0 && typeof saveQuizResult === 'function') {
            try {
                const alreadySaved = sessionStorage.getItem('quizResultsSaved') === 'true';
                if (!alreadySaved) {
                    saveQuizResult(this.config.pupilId, resultsData, this.config);
                    sessionStorage.setItem('quizResultsSaved', 'true');
                }
            } catch (error) {
                console.error('Error saving quiz result:', error);
            }
        }

        if (this.resultsCallback) {
            this.resultsCallback();
        } else {
            window.location.href = 'results.html';
        }
    },

    skipToEnd() {
        this.closeTeacherMenu();
        this.endGame();
    },

    skipCountdown() {
        // Clear end-screen countdown
        if (window.countdownInterval) clearInterval(window.countdownInterval);

        document.getElementById('reinforcer-countdown')?.remove();
        document.getElementById('finished-text')?.remove();

        const tryAgainBtn = document.querySelector('#end-screen .btn-primary');
        if (tryAgainBtn) {
            tryAgainBtn.innerHTML = 'Try Again \u27F2';
            tryAgainBtn.style.display = 'block';
            tryAgainBtn.disabled = false;
            tryAgainBtn.style.opacity = '1';
            tryAgainBtn.style.cursor = 'pointer';
        }

        // Clear break-screen countdown
        if (this._breakInterval) {
            clearInterval(this._breakInterval);
            this._breakInterval = null;
        }

        document.getElementById('break-countdown')?.remove();

        if (this._breakResolve) {
            const quizScreen = document.getElementById('game-screen');
            const endScreen = document.getElementById('end-screen');
            const reinforcerContainer = document.getElementById('reinforcer-container');

            if (reinforcerContainer) {
                reinforcerContainer.classList.remove('active');
                reinforcerContainer.querySelector('.balloons')?.style.setProperty('display', 'none');
                reinforcerContainer.querySelectorAll('canvas').forEach(c => { c.style.display = 'none'; });
                document.getElementById('pond-container')?.remove();
                document.getElementById('ballpitCanvas')?.remove();
            }

            if (endScreen) {
                endScreen.style.display = 'none';
                endScreen.querySelectorAll(':scope > h1').forEach(h => h.style.display = '');
                document.getElementById('reinforcer-selection')?.style.setProperty('display', '');
            }

            document.querySelector('#break-reinforcer-selection .slide-track')?.style.setProperty('animation', '');

            if (quizScreen) quizScreen.style.display = 'flex';

            const resolve = this._breakResolve;
            this._breakResolve = null;
            resolve();
        }

        this.closeTeacherMenu();
    },

    // ========== SOUND BUTTON ==========

    setupSoundButton() {
        const soundBtn = document.getElementById('sound-btn');
        if (!soundBtn) return;

        // Replace to remove any existing listeners
        const newSoundBtn = soundBtn.cloneNode(true);
        soundBtn.replaceWith(newSoundBtn);

        newSoundBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            let textToSpeak = this.currentSpeechText || this.currentQuestionText;
            if (!textToSpeak) {
                textToSpeak = document.getElementById('question-text')?.textContent;
            }
            if (textToSpeak) this.speak(textToSpeak);
        });
    },

});
