
Object.assign(PhonicsGame.prototype, {

    // ========== GRAPHEME -> PHONEME (Teacher Scored) ==========

    async showGraphemeToPhoneme(pupil) {
        this.currentQuestionText = `What sound does this letter make?`;
        this.currentPhonemeSpeak = null; // Plain text question, no phoneme audio needed
        const questionTextElement = document.getElementById('question-text');
        if (questionTextElement) {
            questionTextElement.textContent = this.currentQuestionText;
            questionTextElement.className = 'question-text';
        }

        // Display letter on an option card (same styling as other modes)
        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';
        grid.setAttribute('data-size', '2');
        grid.style.display = 'grid';
        grid.style.justifyContent = 'center';
        grid.style.alignItems = 'center';

        const card = document.createElement('div');
        card.className = 'option-card phoneme-display-card';
        card.style.cssText = 'grid-column: 1 / -1; max-width: 400px; margin: 0 auto; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;';

        const letterDiv = document.createElement('div');
        letterDiv.textContent = this.currentTarget.toLowerCase();
        letterDiv.style.cssText = 'font-size: clamp(10rem, 25vh, 18rem); font-weight: 900; color: white; line-height: 1;';

        card.appendChild(letterDiv);
        grid.appendChild(card);

        const controls = document.getElementById('teacher-controls');
        controls.style.display = 'flex';

        // Reset button states
        this.resetTeacherButtonStates();

        this.resetFeedback();
        this.speak(this.currentQuestionText);
        this.waitingForTeacherScore = true;
        this.lastScoredResult = null;
    },

    resetTeacherButtonStates() {
        const buttons = document.querySelectorAll('.teacher-score-btn');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
    },

    teacherScore(score) {
        if (!this.waitingForTeacherScore) return;
        this.waitingForTeacherScore = false;

        // Visual feedback on score button
        this.resetTeacherButtonStates();
        const buttonClass = score === 'plus' ? 'plus' : score === 'minus' ? 'minus' : 'neutral';
        const clickedBtn = document.querySelector(`.teacher-score-btn.${buttonClass}`);
        if (clickedBtn) {
            clickedBtn.classList.add('selected');
            clickedBtn.style.transform = 'scale(1.15)';
            clickedBtn.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
        }

        // Apply colour feedback to the letter card
        const card = document.querySelector('.option-card.phoneme-display-card');
        if (card) {
            const feedbackClass = score === 'plus' ? 'correct' : score === 'minus' ? 'incorrect' : 'neutral';
            card.classList.add(feedbackClass);
        }

        // Feedback message and sound
        if (score === 'plus') {
            const msg = this.getRandomCorrectMessage();
            this.setFeedback(msg, 'correct-feedback');
            this.speak(msg);
            soundFX.playCorrect();
        } else if (score === 'minus') {
            this.setFeedback('Incorrect', 'incorrect-feedback');
            soundFX.playIncorrect();
        }

        // Record result
        const pupilIndex = this.pupilOrder[this.currentPupilIndex];
        const pupil = this.pupils[pupilIndex];
        const result = {
            questionNumber: this.questionsCompleted + 1,
            pupilName: pupil.name,
            programType: this.currentProgramType,
            target: this.currentTarget,
            result: score === 'plus' ? 'plus' : score === 'minus' ? 'minus' : 'neutral',
            responseTime: this.calculateResponseTime(),
            teacherScored: true
        };
        this.pupilResults[pupilIndex].results.push(result);
        this.results.push(result);
        this.savePhonicsProgressIncremental();

        this.questionsAskedThisPupil++;
        this.questionsCompleted++;

        // After feedback window: hide controls, clear display, next question
        setTimeout(() => {
            document.getElementById('teacher-controls').style.display = 'none';

            const questionTextElement = document.getElementById('question-text');
            if (questionTextElement) {
                questionTextElement.className = 'question-text';
                questionTextElement.innerHTML = '';
            }

            const optionsGrid = document.getElementById('options-grid');
            if (optionsGrid) {
                optionsGrid.innerHTML = '';
                optionsGrid.style.display = 'grid';
                optionsGrid.style.justifyContent = '';
                optionsGrid.style.alignItems = '';
                optionsGrid.setAttribute('data-size', '2');
            }

            this.nextQuestion();
        }, 2000);
    },
    
    // ========== PHONEME -> GRAPHEME ==========

    async showPhonemeToGrapheme(pupil) {
        this.currentQuestionText = `What letter makes this sound?`;

        const questionTextElement = document.getElementById('question-text');
        if (questionTextElement) {
            questionTextElement.innerHTML = `What letter makes this sound? <span id="question-sound-btn" class="sound-btn" style="position: relative; display: inline-block; margin-left: 30px;">\uD83D\uDD0A</span>`;
            questionTextElement.className = 'question-text';
        }

        // DON'T speak yet - wait for answer mode to be enabled
        // Store components for phoneme-aware speech
        this.currentPhonemeSpeak = {
            before: 'What letter makes the sound',
            letter: this.currentTarget,
            after: '?'
        };
        this.pendingPhonemeSpeak = { ...this.currentPhonemeSpeak };

        setTimeout(() => {
            const soundBtn = questionTextElement.querySelector('#question-sound-btn');
            if (soundBtn) {
                soundBtn.addEventListener('click', () => {
                    this.speakPhonemeSound(this.currentTarget);
                });
            }
        }, 100);

        const options = await this.getOrGenerateOptions(() => this.generateLetterOptions(this.currentTarget));
        this.displayLetterOptions(options);
    },

        // ========== Select Picture ==========

    async showInitialSounds(pupil) {
        this.currentQuestionText = `Find the picture starting with`;
        const questionTextElement = document.getElementById('question-text');
        if (questionTextElement) {
            questionTextElement.innerHTML = `Find the picture starting with <span id="question-sound-btn" class="sound-btn" style="position: relative; display: inline-block; margin-left: 30px;">\uD83D\uDD0A</span>`;
            questionTextElement.className = 'question-text';
        }

        // Store components for phoneme-aware speech
        this.currentPhonemeSpeak = {
            before: 'Find the picture starting with ',
            letter: this.currentTarget,
            after: ''
        };
        this.pendingPhonemeSpeak = { ...this.currentPhonemeSpeak };

        const soundBtn = document.getElementById('question-sound-btn');
        if (soundBtn) {
            const newSoundBtn = soundBtn.cloneNode(true);
            soundBtn.replaceWith(newSoundBtn);

            newSoundBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Play phoneme audio on button click
                this.speakPhonemeSound(this.currentTarget);

                newSoundBtn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    newSoundBtn.style.transform = 'scale(1)';
                }, 200);
            });
        }

        const options = await this.getOrGenerateOptions(() => this.generateImageOptions(this.currentTarget));
        this.displayImageOptions(options);
    },

    async getOrGenerateOptions(generateFunc) {
        if (!this.isInCorrection) {
            this.currentOptions = await generateFunc();
        } else {
            this.currentOptions = this.shuffleArray(this.currentOptions);
        }
        return this.currentOptions;
    },

    getCurrentFieldSize() {
        const pupilIndex = this.pupilOrder[this.currentPupilIndex];
        const pupil = this.pupils[pupilIndex];
        return (pupil?.fieldSize?.[this.currentProgramType]) || 2;
    },

    getDistractorsForTarget(targetLetter, count) {
        if (this.config.phaseDisplay === 'current') {
            const targetData = window.phonicsData.getLetterData(targetLetter);
            const targetPhase = targetData?.phase;
            if (targetPhase) {
                const pool = window.phonicsData.letters
                    .filter(l => l.phase === targetPhase && l.letter !== targetLetter)
                    .map(l => l.letter);
                return this.shuffleArray([...pool]).slice(0, count);
            }
        }
        return window.phonicsData.getDistractors(targetLetter, count);
    },

    getDistractorWordsForTarget(targetLetter, count) {
        if (this.config.phaseDisplay === 'current') {
            const targetData = window.phonicsData.getLetterData(targetLetter);
            const targetPhase = targetData?.phase;
            if (targetPhase) {
                const phaseLetters = window.phonicsData.letters
                    .filter(l => l.phase === targetPhase && l.letter !== targetLetter);
                const selected = this.shuffleArray([...phaseLetters]).slice(0, count);
                return selected.map(letterObj => {
                    const randomExample = letterObj.examples[Math.floor(Math.random() * letterObj.examples.length)];
                    return { word: randomExample, letter: letterObj.letter, imagePath: letterObj.imagePath + randomExample + '.jpg' };
                });
            }
        }
        return window.phonicsData.getDistractorWords(targetLetter, count);
    },

    generateLetterOptions(targetLetter) {
        const fieldSize = this.getCurrentFieldSize();
        const distractors = this.getDistractorsForTarget(targetLetter, fieldSize - 1);
        return this.shuffleArray([targetLetter, ...distractors]);
    },

    displayLetterOptions(options) {
        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';
        grid.setAttribute('data-size', String(this.getCurrentFieldSize()));
        grid.style.display = 'grid';

        const textColors = this.shuffleArray(TEXT_COLORS);

        options.forEach((letter, index) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.style.animationDelay = `${index * 0.15}s`;

            const letterDiv = document.createElement('div');
            letterDiv.className = 'option-text-display option-letter';
            letterDiv.textContent = letter.toLowerCase();
            letterDiv.style.color = textColors[index % textColors.length];

            card.appendChild(letterDiv);

            if (letter === this.currentTarget) {
                card.dataset.isCorrect = 'true';
            }

            card.addEventListener('click', () => this.selectOption(card, { type: 'letter', value: letter }));
            grid.appendChild(card);
        });
    },

    async generateImageOptions(targetLetter) {
        const letterData = window.phonicsData.getLetterData(targetLetter);
        if (!letterData) return [];

        const correctWord = letterData.examples[Math.floor(Math.random() * letterData.examples.length)];
        const correctImage = {
            word: correctWord,
            letter: targetLetter,
            imagePath: letterData.imagePath + correctWord + '.jpg',
            isCorrect: true
        };

        const fieldSize = this.getCurrentFieldSize();
        const distractors = this.getDistractorWordsForTarget(targetLetter, fieldSize - 1);
        return this.shuffleArray([correctImage, ...distractors]);
    },

    displayImageOptions(options) {
        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';
        grid.setAttribute('data-size', String(this.getCurrentFieldSize()));

        options.forEach((option, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%;';

            const card = document.createElement('div');
            card.className = 'option-card';
            card.style.cssText = 'animation-delay: ' + (index * 0.15) + 's; margin: 0; width: 100%; height: 100%; flex: 1;';

            const img = document.createElement('img');
            img.src = option.imagePath;
            img.onerror = () => { img.src = (window.ASSET_BASE || '') + 'images/placeholder.jpg'; };
            card.appendChild(img);

            if (option.isCorrect) {
                card.dataset.isCorrect = 'true';
            }

            card.addEventListener('click', () => this.selectOption(card, { type: 'image', value: option }));

            const soundBtn = document.createElement('button');
            soundBtn.className = 'option-sound-btn';
            soundBtn.innerHTML = '\uD83D\uDD0A';
            soundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speak(option.word);
            });

            wrapper.appendChild(card);
            wrapper.appendChild(soundBtn);
            grid.appendChild(wrapper);
        });
    },

})