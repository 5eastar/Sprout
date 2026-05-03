
Object.assign(PhonicsGame.prototype, {

    // Override to process confirmed answer
    processSelectedAnswer(card, selected) {
        let isCorrect = false;

        if (selected.type === 'letter') {
            isCorrect = selected.value === this.currentTarget;
        } else if (selected.type === 'image') {
            isCorrect = selected.value.isCorrect;
        }

        this.handlePhonicsAnswer(isCorrect, card);
    },

    // ========== UNIFIED PHONICS ANSWER HANDLER ==========

    handlePhonicsAnswer(isCorrect, card) {
        this.disableAllOptions();

        if (isCorrect) {
            this.handleCorrectPhonicsAnswer(card);
        } else {
            this.handleIncorrectPhonicsAnswer(card);
        }
    },

    async handleCorrectPhonicsAnswer(card) {
        const pupilIndex = this.pupilOrder[this.currentPupilIndex];

        if (!this.isInCorrection) {
            card.classList.add('correct');
            const randomMessage = this.getRandomCorrectMessage();
            this.setFeedback(randomMessage, 'correct-feedback');
            this.speak(randomMessage);
            soundFX.playCorrect();

            const { result } = this.processAnswer(true, this.getCurrentQuestionData());
            this.pupilResults[pupilIndex].results.push(result);
            this.savePhonicsProgressIncremental();

            // Wait for speech + 1.5s
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            card.classList.add('correction-correct');
            const { feedbackText, phonemeSpeak } = this.getCorrectCorrectionMessage();
            this.setFeedback(feedbackText, 'neutral-feedback');
            await this.speakWithPhoneme(phonemeSpeak.before, phonemeSpeak.letter, phonemeSpeak.after);
            // Result already saved in handleIncorrectPhonicsAnswer on first incorrect

            // Wait 1.5s after speech finishes
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        this.questionsAskedThisPupil++;
        this.questionsCompleted++;
        this.moveToNextPhonicsQuestion();

        this.nextQuestion();
    },

    handleIncorrectPhonicsAnswer(wrongCard) {
        wrongCard.classList.add('incorrect');

        if (!this.isInCorrection && this.initialResponseTime === null) {
            this.initialResponseTime = this.calculateResponseTime();

            // Save result immediately on first incorrect so it's recorded even if session stops mid-correction
            const pupilIndex = this.pupilOrder[this.currentPupilIndex];
            const pupil = this.pupils[pupilIndex];
            const result = {
                questionNumber: this.questionsCompleted + 1,
                pupilName: pupil.name,
                programType: this.currentProgramType,
                target: this.currentTarget,
                result: 'minus',
                responseTime: this.initialResponseTime,
                teacherScored: false
            };
            this.results.push(result);
            this.pupilResults[pupilIndex].results.push(result);
            this.savePhonicsProgressIncremental();
        }

        this.setFeedback('Incorrect', 'incorrect-feedback');
        this.speak('Incorrect');
        soundFX.playIncorrect();

        setTimeout(() => {
            this.showPhonicsCorrection();
        }, 2000);
    },

    async showPhonicsCorrection() {
        const correctCard = document.querySelector('.option-card[data-is-correct="true"]');
        if (correctCard) {
            correctCard.classList.add('correction');
        }

        const { feedbackText, phonemeSpeak } = this.getCorrectionMessage();
        const action = this.handleCorrection();

        this.setFeedback(feedbackText, 'neutral-feedback');

        if (action === 'move-on') {
            // Speak with phoneme audio, then add "Let's move on"
            await this.speakWithPhoneme(phonemeSpeak.before, phonemeSpeak.letter,
                phonemeSpeak.after ? `${phonemeSpeak.after}. Let's move on.` : "Let's move on.");

            // Result already saved in handleIncorrectPhonicsAnswer on first incorrect
            this.questionsAskedThisPupil++;
            this.questionsCompleted++;

            // Wait 1.5s after speech finishes
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.moveToNextPhonicsQuestion();
            this.nextQuestion();
        } else {
            // Speak with phoneme audio, then add "Let's try again"
            await this.speakWithPhoneme(phonemeSpeak.before, phonemeSpeak.letter,
                phonemeSpeak.after ? `${phonemeSpeak.after}. Let's try again.` : "Let's try again.");

            // Wait 1.5s after speech finishes
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.showQuestion();
        }
    },

    moveToNextPhonicsQuestion() {
        this.resetFeedback();
        this.correctionAttempts = 0;
        this.isInCorrection = false;
        this.initialResponseTime = null;
        this.answerModeStartTime = null;
        this.accumulatedAnswerTime = 0;
    },


    savePhonicsProgressIncremental() {
        if (this.results.length === this.lastSavedCount) return;
        
        const totalTime = this.getTotalTime();
        const allResults = this.results;
        const totalQuestions = allResults.length;
        const correct = countCorrect(allResults);

        const phonicsRecord = {
            id: this.phonicsSessionId,
            date: new Date().toISOString(),
            config: {
                ...this.config,
                pupils: this.config.pupils.map(({ photo, ...rest }) => rest)
            },
            pupils: this.pupilResults,
            programOrder: this.programOrder,
            totalTime: totalTime,
            summary: {
                totalQuestions,
                correct,
                accuracy: calculateAccuracy(correct, totalQuestions)
            }
        };

        const history = getPhonicsHistory();
        const existingIndex = history.findIndex(s => s.id === this.phonicsSessionId);
        
        if (existingIndex >= 0) {
            history[existingIndex] = phonicsRecord;
        } else {
            history.push(phonicsRecord);
        }

        const saved = storage.set(PHONICS_HISTORY_KEY, history);
        if (saved) this.lastSavedCount = this.results.length;
        else console.error('Storage full: progress not saved. Consider clearing old history.');
        this.lastSavedCount = this.results.length;
    },


    

    showResults() {
        this.closeTeacherMenu();

        const totalTime = this.getTotalTime();

        // Save current phonics results to sessionStorage
        sessionStorage.setItem('quizResults', JSON.stringify({
            results: this.results,
            totalTime: totalTime,
            type: 'phonics',
            pupils: this.pupilResults,
            programOrder: this.programOrder,
            sessionId: this.phonicsSessionId
        }));
        sessionStorage.setItem('quizResultsSaved', 'true');

        if (this.resultsCallback) {
            this.resultsCallback();
        } else {
            window.location.href = 'results.html';
        }
    },

    async endGame() {
    const totalTime = this.getTotalTime();
    // Save phonics-specific results
    sessionStorage.setItem('quizResults', JSON.stringify({
        results: this.results, totalTime,
        type: 'phonics', pupils: this.pupilResults, programOrder: this.programOrder,
        sessionId: this.phonicsSessionId
    }));
    sessionStorage.setItem('quizResultsSaved', 'true');
    if (typeof savePhonicsResult === 'function') {
        savePhonicsResult(
            { pupils: this.pupilResults, totalTime, programOrder: this.programOrder },
            this.config
        );
    }

    // Shared end-game reinforcer flow
    await this.showEndScreenWithReinforcer("Wow! That was some great work! Choose your reward!");
}

}

)