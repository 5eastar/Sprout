
Object.assign(PhonicsGame.prototype, {
    
    // ========== OVERRIDE GAMECORE METHODS ==========


   
    getCurrentQuestionData() {
        const pupilIndex = this.pupilOrder[this.currentPupilIndex];
        const pupil = this.pupils[pupilIndex];

        return {
            questionNumber: this.questionsCompleted + 1,
            pupilName: pupil.name,
            programType: this.currentProgramType,
            target: this.currentTarget,
            teacherScored: false
        };
    },

    getCorrectionMessage() {
        let feedbackText = `This one starts with ${this.currentTarget}`;
        let phonemeSpeak = {
            before: 'This one starts with',
            letter: this.currentTarget,
            after: ''
        };

        if (this.currentProgramType === 'phoneme-to-grapheme') {
            feedbackText = `It's this letter`;
            phonemeSpeak = {
                before: 'This letter makes',
                letter: this.currentTarget,
                after: ''
            };
        }

        return { feedbackText, phonemeSpeak };
    },

    getCorrectCorrectionMessage() {
        let phonemeSpeak = {
            before: "That's correct, this one starts with",
            letter: this.currentTarget,
            after: ''
        };

        if (this.currentProgramType === 'phoneme-to-grapheme') {
            phonemeSpeak = {
                before: "That's correct, this letter makes",
                letter: this.currentTarget,
                after: ''
            };
        }

        return {
            feedbackText: `That's correct!`,
            phonemeSpeak
        };
    },

    // ========== HELPER METHODS ==========

    // Update the current pupil indicator in top-right corner
    updateCurrentPupilIndicator(pupil) {
        const indicator = document.getElementById('current-pupil-indicator');
        const photoEl = document.getElementById('current-pupil-photo');
        const nameEl = document.getElementById('current-pupil-name');

        if (!indicator || !nameEl) return;

        nameEl.textContent = `${pupil.name}'s turn`;

        if (photoEl) {
            photoEl.onerror = () => photoEl.style.display = 'none';
            photoEl.style.display = 'block';
            photoEl.src = pupil.photo;
        }

        indicator.style.display = 'flex';
    },

    

    updateQuestionCounter() {
        const counter = document.getElementById('question-counter');
        if (counter) {
            const currentStage = this.currentProgramIndex + 1;
            const programName = PROGRAM_LABELS[this.currentProgramType] || 'Program';
            counter.textContent = `${programName} (${currentStage}/3) - Q${this.questionsCompleted + 1}/${this.totalQuestionsPlanned}`;
        }
    }

    }
)