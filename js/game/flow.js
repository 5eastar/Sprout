// GameCore mixin — answer flow, correction, animations, end game.
// Requires: core.js, timer.js, speech.js, ui.js loaded first.

Object.assign(GameCore.prototype, {

    // ========== ANIMATIONS ==========

    async fadeOutQuestion() {
        return new Promise((resolve) => {
            const grid = document.getElementById('options-grid');
            const overlay = document.getElementById('answer-overlay');

            if (!grid || grid.children.length === 0) {
                resolve();
                return;
            }

            grid.classList.add('fade-out');
            if (overlay) overlay.classList.add('fade-out');

            setTimeout(() => {
                if (overlay) overlay.remove();
                resolve();
            }, 500);
        });
    },

    async fadeInQuestion() {
        return new Promise((resolve) => {
            const grid = document.getElementById('options-grid');
            grid?.classList.remove('fade-out');
            grid?.classList.add('fade-in');
            setTimeout(() => {
                grid?.classList.remove('fade-in');
                resolve();
            }, 500);
        });
    },

    // Slide option cards in sequentially (shared by Identify and Match)
    slideInOptions() {
        return new Promise(resolve => {
            const grid = document.getElementById('options-grid');
            const cards = grid?.querySelectorAll('.option-card');
            if (!cards || cards.length === 0) { resolve(); return; }
            cards.forEach((card, i) => setTimeout(() => card.classList.add('slide-in'), i * 100));
            setTimeout(resolve, cards.length * 100 + 600);
        });
    },

    // ========== ANSWER PROCESSING ==========

    processAnswer(isCorrect, resultData) {
        const responseTime = this.calculateResponseTime();

        if (!this.isInCorrection && this.initialResponseTime === null) {
            this.initialResponseTime = responseTime;
        }

        const finalResponseTime = this.isInCorrection ? this.initialResponseTime : responseTime;
        const result = {
            ...resultData,
            result: this.isInCorrection ? 'minus' : (isCorrect ? 'plus' : 'minus'),
            responseTime: finalResponseTime
        };

        this.results.push(result);
        return { isCorrect, responseTime: finalResponseTime, result };
    },

    // ========== FEEDBACK ==========

    getRandomCorrectMessage() {
        const messages = ['Well done!', 'Excellent!', 'Good job!', 'Remarkable!', 'Fantastic!', 'Amazing!', 'Superb!', 'Impressive!', 'Phenomenal!', 'You got it!', 'Outstanding!', 'Brilliant!'];
        return messages[Math.floor(Math.random() * messages.length)];
    },

    setFeedback(text, className) {
        const feedbackEl = document.getElementById('feedback');
        if (feedbackEl) {
            feedbackEl.textContent = text;
            feedbackEl.className = `feedback ${className}`;
        }
    },

    resetFeedback() {
        const feedbackEl = document.getElementById('feedback');
        if (feedbackEl) {
            feedbackEl.textContent = '';
            feedbackEl.className = 'feedback';
        }
    },

    // ========== CORRECTION ==========

    handleCorrection() {
        this.correctionAttempts++;
        this.isInCorrection = true;
        return this.correctionAttempts >= 3 ? 'move-on' : 'retry';
    },

    moveToNextQuestion() {
        this.resetFeedback();
        this.clearSelection();
        this.correctionAttempts = 0;
        this.isInCorrection = false;
        this.initialResponseTime = null;
        this.questionStartTime = null;
        this.resetAnswerModeForNewQuestion();
        this.currentQuestion++;
        this.currentOptions = [];
        this.currentOptionImages = [];
    },

    showCorrection() {
        const correctCard = document.querySelector('.option-card[data-is-target="true"]') ||
                            document.querySelector('.option-card[data-is-correct="true"]');
        if (correctCard) correctCard.classList.add('correction');

        const { feedbackText, speechText } = this.getCorrectionMessage();
        const action = this.handleCorrection();

        this.setFeedback(feedbackText, 'neutral-feedback');

        if (action === 'move-on') {
            this.speak(`${speechText}. Let's move on.`);
            setTimeout(() => {
                this.moveToNextQuestion();
                if (this.currentQuestion < this.questions.length) {
                    this.showQuestion();
                } else {
                    this.endGame();
                }
            }, TIMING.CORRECTION_PAUSE);
        } else {
            this.speak(`${speechText}. Let's try again.`);
            setTimeout(() => {
                this.showQuestion();
            }, TIMING.CORRECTION_PAUSE);
        }
    },

    // ========== CORRECT ANSWER ==========

    handleCorrectAnswer(card) {
        if (!this.isInCorrection) {
            card.classList.add('correct');
            const randomMessage = this.getRandomCorrectMessage();
            this.setFeedback(randomMessage, 'correct-feedback');
            this.speak(randomMessage);
            soundFX.playCorrect();
            this.processAnswer(true, this.getCurrentQuestionData());
        } else {
            card.classList.add('correction-correct');
            const { feedbackText, speechText } = this.getCorrectCorrectionMessage();
            this.setFeedback(feedbackText, 'neutral-feedback');
            this.speak(speechText);
            // Result already saved in handleIncorrectAnswer on first incorrect
        }

        setTimeout(() => {
            this.moveToNextQuestion();
            if (this.currentQuestion < this.questions.length) {
                this.showQuestion();
            } else {
                this.endGame();
            }
        }, TIMING.CORRECT_PAUSE);
    },

    // ========== INCORRECT ANSWER ==========

    handleIncorrectAnswer(wrongCard) {
        wrongCard.classList.add('incorrect');

        if (!this.isInCorrection && this.initialResponseTime === null) {
            this.initialResponseTime = this.calculateResponseTime();

            // Save result immediately on first incorrect so it's recorded even if session stops mid-correction
            this.results.push({
                questionNumber: this.currentQuestion + 1,
                ...this.getCurrentQuestionData(),
                result: 'minus',
                responseTime: this.initialResponseTime
            });
        }

        this.setFeedback('Incorrect', 'incorrect-feedback');
        this.speak('Not quite.');
        soundFX.playIncorrect();

        setTimeout(() => {
            this.showCorrection();
        }, TIMING.INCORRECT_PAUSE);
    },

    // ========== END GAME ==========

    async endGame() {
        const totalQuizTime = this.getTotalTime();

        const resultsData = {
            results: this.results,
            totalTime: totalQuizTime
        };

        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));

        if (this.config.pupilId && this.results.length > 0 && typeof saveQuizResult === 'function') {
            try {
                saveQuizResult(this.config.pupilId, resultsData, this.config);
                sessionStorage.setItem('quizResultsSaved', 'true');
            } catch (error) {
                console.error('Error saving quiz result:', error);
                sessionStorage.setItem('quizResultsSaved', 'false');
            }
        } else {
            sessionStorage.setItem('quizResultsSaved', 'false');
        }

        await this.showEndScreenWithReinforcer();

    },

    // Wait for reinforcer selection from the slider and return the chosen type
    waitForReinforcerSelection() {
        return new Promise((resolve) => {
            const reinforcerSelection = document.getElementById('reinforcer-selection');

            if (!reinforcerSelection) {
                resolve(this.config.reinforcer || 'balloons');
                return;
            }

            const slides = reinforcerSelection.querySelectorAll('.slide');
            const slideTrack = reinforcerSelection.querySelector('.slide-track');

            let touchStartX = 0;
            let touchCurrentX = 0;
            let isSwiping = false;
            let dragOffset = 0;
            let baseOffset = 0;
            let resumeTimer = null;
            const slideWidth = 200;
            const totalSlides = Math.round(slides.length / 2); // unique slides (track duplicated)
            const trackWidth = slideWidth * totalSlides;

            const slider = reinforcerSelection.querySelector('.slider');
            if (slider && slideTrack) {
                const pauseAnimation = () => {
                    const matrix = new DOMMatrix(getComputedStyle(slideTrack).transform);
                    baseOffset = matrix.m41;
                    slideTrack.style.animation = 'none';
                    slideTrack.style.transform = `translateX(${baseOffset}px)`;
                    if (resumeTimer) clearTimeout(resumeTimer);
                };

                const resumeAnimation = () => {
                    if (resumeTimer) clearTimeout(resumeTimer);
                    resumeTimer = setTimeout(() => {
                        let currentOffset = ((( baseOffset + dragOffset) % trackWidth) + trackWidth) % trackWidth;
                        if (currentOffset > 0) currentOffset -= trackWidth;
                        const progress = Math.abs(currentOffset) / trackWidth;
                        const duration = totalSlides * 5;
                        slideTrack.style.transform = '';
                        slideTrack.style.animation = `scroll ${duration}s linear infinite`;
                        slideTrack.style.animationDelay = `${-(progress * duration)}s`;
                    }, 3000);
                };

                slider.addEventListener('touchstart', (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchCurrentX = touchStartX;
                    isSwiping = false;
                    dragOffset = 0;
                    pauseAnimation();
                }, { passive: true });

                slider.addEventListener('touchmove', (e) => {
                    if (!touchStartX) return;
                    touchCurrentX = e.touches[0].clientX;
                    dragOffset = touchCurrentX - touchStartX;
                    if (Math.abs(dragOffset) > 10) {
                        isSwiping = true;
                        e.preventDefault();
                    }
                    slideTrack.style.transform = `translateX(${baseOffset + dragOffset}px)`;
                }, { passive: false });

                slider.addEventListener('touchend', () => {
                    baseOffset += dragOffset;
                    dragOffset = 0;
                    touchStartX = 0;
                    resumeAnimation();
                }, { passive: true });
            }

            const handleSelection = (e) => {
                if (isSwiping) { isSwiping = false; return; }

                const slide = e.currentTarget;
                const reinforcerType = slide.dataset.reinforcer;

                if (resumeTimer) clearTimeout(resumeTimer);
                if (slideTrack) slideTrack.style.animation = 'none';

                slides.forEach(s => s.removeEventListener('click', handleSelection));
                slide.classList.add('selected');

                setTimeout(() => { resolve(reinforcerType); }, 500);
            };

            slides.forEach(slide => slide.addEventListener('click', handleSelection));
        });
    },

    showReinforcerCountdown() {
        const tryAgainBtn = document.querySelector('#end-screen .btn-primary');
        if (!tryAgainBtn) return;

        tryAgainBtn.style.display = 'none';

        const correctCount = countCorrect(this.results);
        let countdown = correctCount === 0 ? 30 : 60;

        let countdownEl = document.getElementById('reinforcer-countdown');
        if (!countdownEl) {
            countdownEl = document.createElement('div');
            countdownEl.id = 'reinforcer-countdown';
            countdownEl.style.cssText = `
                position: fixed;
                top: 12px;
                right: 12px;
                width: 82px;
                height: 82px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.45);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.2rem;
                font-weight: 700;
                font-family: 'Fredoka', sans-serif;
                z-index: 9999;
                backdrop-filter: blur(4px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: width 0.4s ease, height 0.4s ease, font-size 0.4s ease;
            `;
            document.body.appendChild(countdownEl);
        }
        countdownEl.textContent = countdown;

        window.countdownInterval = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;

            // Grow larger at 10s remaining
            if (countdown === 10) {
                countdownEl.style.width = '123px';
                countdownEl.style.height = '123px';
                countdownEl.style.fontSize = '3.3rem';
            }

            // Pulse each second for last 5s
            if (countdown <= 5 && countdown > 0) {
                countdownEl.classList.remove('pulse');
                void countdownEl.offsetWidth; // force reflow to restart animation
                countdownEl.classList.add('pulse');
            }

            if (countdown <= 0) {
                clearInterval(window.countdownInterval);
                countdownEl.remove();

                const finishedText = document.createElement('div');
                finishedText.id = 'finished-text';
                finishedText.textContent = 'Finished!';
                finishedText.style.cssText = `
                    position: fixed;
                    top: calc(50% - 70px);
                    left: 0;
                    right: 0;
                    margin: 0 auto;
                    width: fit-content;
                    color: white;
                    font-size: 2rem;
                    font-weight: 700;
                    font-family: 'Fredoka', sans-serif;
                    z-index: 1000;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
                    animation: finishedAppear 0.5s ease-out forwards;
                    white-space: nowrap;
                `;
                document.body.appendChild(finishedText);

                tryAgainBtn.style.display = 'block';
                tryAgainBtn.disabled = false;
                tryAgainBtn.style.opacity = '1';
                tryAgainBtn.style.cursor = 'pointer';
            }
        }, 1000);
    },

    saveResults(pupilId, config) {
        const resultsData = {
            results: this.results,
            totalTime: this.getTotalTime()
        };

        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));
        sessionStorage.setItem('quizResultsSaved', 'false');

        if (pupilId && this.results.length > 0 && typeof saveQuizResult === 'function') {
            try {
                saveQuizResult(pupilId, resultsData, config);
                sessionStorage.setItem('quizResultsSaved', 'true');
            } catch (error) {
                console.error('Error saving quiz result:', error);
            }
        }
    },

});
