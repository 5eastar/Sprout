Object.assign(PhonicsGame.prototype, {

    async startProgram() {
        if (this.currentProgramIndex >= this.programOrder.length) {
            this.endGame();
            return;
        }

        this.currentProgramType = this.programOrder[this.currentProgramIndex];

        const pupilsWithTargets = [];
        this.pupils.forEach((pupil, index) => {
            const targets = pupil.targets[this.currentProgramType] || [];
            if (targets.length > 0) {
                pupilsWithTargets.push(index);
            }
        });

        if (pupilsWithTargets.length === 0) {
            console.log(`No pupils have targets for ${this.currentProgramType}, skipping...`);
            this.currentProgramIndex++;
            await this.startProgram();
            return;
        }

        this.pupilOrder = this.shuffleArray(pupilsWithTargets);
        // Shuffle each pupil's targets for this program type
        this.pupilOrder.forEach(pupilIdx => {
            const pupil = this.pupils[pupilIdx];
            const targets = pupil.targets[this.currentProgramType];
            if (targets && targets.length > 1) {
                pupil.targets[this.currentProgramType] = this.shuffleArray([...targets]);
            }
        });
        this.currentPupilIndex = 0;

        // Restore saved progress for first pupil, or start at 0
        const firstPupilIndex = this.pupilOrder[0];
        const progressKey = `${firstPupilIndex}_${this.currentProgramType}`;
        this.questionsAskedThisPupil = this.pupilQuestionProgress[progressKey] || 0;

        // Show program intro screen and wait for "Let's Go" button
        await this.showProgramIntro();

        await this.nextQuestion();
    },

    // Show intro screen at the start of each program type
    showProgramIntro() {
        return new Promise((resolve) => {
            const programName = Program_Intro_Labels[this.currentProgramType] || 'Next Activity';

            const introScreen = document.getElementById('program-intro-screen');
            const titleEl = document.getElementById('program-intro-title');
            const startBtn = document.getElementById('program-start-btn');

            if (!introScreen || !titleEl || !startBtn) {
                resolve();
                return;
            }

            titleEl.textContent = programName;
            introScreen.style.display = 'flex';

            // Hide toggle and pupil indicator during intro
            const toggle = document.querySelector('.toggle');
            if (toggle) toggle.style.display = 'none';

            const pupilIndicator = document.getElementById('current-pupil-indicator');
            if (pupilIndicator) pupilIndicator.style.display = 'none';

            // Wait for button click
            const handleClick = () => {
                startBtn.removeEventListener('click', handleClick);
                introScreen.style.display = 'none';
                // Show toggle when entering questions
                if (toggle) toggle.style.display = '';
                resolve();
            };

            startBtn.addEventListener('click', handleClick);
        });
    },

    // Show pupil select screen
    showPupilChooser() {
    return new Promise(resolve => {
        const remaining = this.pupilOrder.slice(this.currentPupilIndex);
        const container = document.getElementById('pupil-choose-buttons');
        container.innerHTML = '';

        remaining.forEach(pupilIdx => {
            const pupil = this.pupils[pupilIdx];
            const btn = document.createElement('button');
            btn.className = 'pupil-choose-btn';

            const img = document.createElement('img');
            img.src = pupil.photo;
            img.alt = pupil.name;
            img.onerror = () => img.style.display = 'none';

            const label = document.createElement('span');
            label.textContent = pupil.name;

            btn.appendChild(img);
            btn.appendChild(label);

            btn.addEventListener('click', () => {
                // Move chosen pupil to currentPupilIndex position
                const chosenPos = this.pupilOrder.indexOf(pupilIdx, this.currentPupilIndex);
                if (chosenPos !== this.currentPupilIndex) {
                    [this.pupilOrder[this.currentPupilIndex], this.pupilOrder[chosenPos]] =
                        [this.pupilOrder[chosenPos], this.pupilOrder[this.currentPupilIndex]];
                }
                document.getElementById('pupil-choose-screen').style.display = 'none';
                resolve();
            });

            container.appendChild(btn);
        });

        const toggle = document.querySelector('.toggle');
        if (toggle) toggle.style.display = 'none';
        const pupilIndicator = document.getElementById('current-pupil-indicator');
        if (pupilIndicator) pupilIndicator.style.display = 'none';

        document.getElementById('pupil-choose-screen').style.display = 'flex';
    });
},

    // Show pupil turn screen
    async showPupilTurn(pupil) {
        const turnScreen = document.getElementById('pupil-turn-screen');
        const photoEl = document.getElementById('pupil-turn-photo');
        const nameEl = document.getElementById('pupil-turn-name');
        const readyBtn = document.getElementById('pupil-ready-btn');
        const toggle = document.querySelector('.toggle');
        const pupilIndicator = document.getElementById('current-pupil-indicator');

        // Hide toggle and pupil indicator during pupil turn
        if (toggle) toggle.style.display = 'none';
        if (pupilIndicator) pupilIndicator.style.display = 'none';

        photoEl.onerror = () => photoEl.style.display = 'none';
        photoEl.style.display = 'block';
        photoEl.src = pupil.photo;

        nameEl.textContent = pupil.name;
        turnScreen.style.display = 'flex';
        const isSinglePupil = this.pupils.length === 1;
        const msgEl = document.getElementById('pupil-turn-message');
        if (msgEl) msgEl.textContent = isSinglePupil ? 'Are you ready?' : "It's your turn!";
        const spoken = isSinglePupil ? `${pupil.name}, are you ready?` : `${pupil.name}, it's your turn!`;
        this.speak(spoken);

        // Wait for Ready button click
        await new Promise(resolve => {
            const handleClick = () => {
                readyBtn.removeEventListener('click', handleClick);
                resolve();
            };
            readyBtn.addEventListener('click', handleClick);
        });

        turnScreen.style.display = 'none';

        // Show toggle when returning to questions
        if (toggle) toggle.style.display = '';
    },

    async nextQuestion() {
        const pupilIndex = this.pupilOrder[this.currentPupilIndex];
        const pupil = this.pupils[pupilIndex];
        const targets = pupil.targets[this.currentProgramType] || [];

        if (this.questionsAskedThisPupil >= targets.length) {
            // Clean up any saved progress for this completed pupil
            const doneKey = `${pupilIndex}_${this.currentProgramType}`;
            delete this.pupilQuestionProgress[doneKey];

            this.currentPupilIndex++;

            if (this.currentPupilIndex >= this.pupilOrder.length) {
                this.currentProgramIndex++;
                await this.startProgram();
                return;
            }

            // Restore saved progress for next pupil, or start at 0
            const nextPupilIndex = this.pupilOrder[this.currentPupilIndex];
            const progressKey = `${nextPupilIndex}_${this.currentProgramType}`;
            this.questionsAskedThisPupil = this.pupilQuestionProgress[progressKey] || 0;
        }
        await this.showQuestion();
    },

    async showQuestion() {
        let pupilIndex = this.pupilOrder[this.currentPupilIndex];
        let pupil = this.pupils[pupilIndex];

        this.resetFeedback();

        // Only show pupil turn screen if NOT in correction mode AND (different pupil OR different program type)
        const programChanged = this.currentProgramType !== this.lastShownProgramType;
        const pupilChanged = pupilIndex !== this.lastShownPupilIndex;

        if (!this.isInCorrection && (pupilChanged || programChanged)) {
            const multiPupil = this.pupils.length > 1;
            const remainingCount = this.pupilOrder.length - this.currentPupilIndex;
            if (multiPupil && remainingCount > 1) {
                await this.showPupilChooser();
                // Re-read pupil after chooser may have reordered the queue
                pupilIndex = this.pupilOrder[this.currentPupilIndex];
                pupil = this.pupils[pupilIndex];
                // Restore question progress for the chosen pupil
                const progressKey = `${pupilIndex}_${this.currentProgramType}`;
                this.questionsAskedThisPupil = this.pupilQuestionProgress[progressKey] || 0;
            }
            await this.showPupilTurn(pupil);
            this.lastShownPupilIndex = pupilIndex;
            this.lastShownProgramType = this.currentProgramType;
        }

        // Set current target from (potentially updated) pupil and progress
        const targets = pupil.targets[this.currentProgramType] || [];
        this.currentTarget = targets[this.questionsAskedThisPupil];

        // Update current pupil indicator
        this.updateCurrentPupilIndicator(pupil);

        this.startQuestionTimer();
        this.updateQuestionCounter();

        switch(this.currentProgramType) {
            case 'grapheme-to-phoneme':
                await this.showGraphemeToPhoneme(pupil);
                // No wait mode for teacher-scored mode
                break;
            case 'phoneme-to-grapheme':
                await this.showPhonemeToGrapheme(pupil);
                // Phonics: answers enabled by default (no wait mode unless teacher enables it)
                this.enableAnswersForPhonics();
                break;
            case 'initial-sounds':
                await this.showInitialSounds(pupil);
                // Phonics: answers enabled by default (no wait mode unless teacher enables it)
                this.enableAnswersForPhonics();
                break;
        }

        await this.fadeInQuestion();
    },

    

})
