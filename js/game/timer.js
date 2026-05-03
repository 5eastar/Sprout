// GameCore mixin — timer and incremental save methods.
// Requires: core.js loaded first.

Object.assign(GameCore.prototype, {

    startTimer() {
        this.quizStartTime = Date.now();
    },

    startQuestionTimer() {
        if (!this.isInCorrection) {
            this.questionStartTime = Date.now();
            this.accumulatedAnswerTime = 0;
            // Start answer timer immediately if answers are already enabled
            this.answerModeStartTime = this.answersEnabled ? Date.now() : null;
        }
    },

    // Calculate time spent only in answer-enabled mode
    calculateResponseTime() {
        let totalAnswerTime = this.accumulatedAnswerTime;
        if (this.answerModeStartTime) {
            totalAnswerTime += Date.now() - this.answerModeStartTime;
        }
        return totalAnswerTime / 1000;
    },

    getTotalTime() {
        return this.quizStartTime ? (Date.now() - this.quizStartTime) / 1000 : 0;
    },

    saveProgressIncremental() {
        // Only save if we have new results and a pupil
        if (this.results.length === this.lastSavedQuestionCount) return;
        if (!this.config.pupilId) return;

        const totalTime = this.getTotalTime();
        const totalQuestions = this.results.length;
        const correct = countCorrect(this.results);

        const quizRecord = {
            id: this.sessionId,
            pupilId: this.config.pupilId,
            date: new Date().toISOString(),
            config: this.config,
            results: this.results,
            totalTime,
            summary: {
                totalQuestions,
                correct,
                accuracy: calculateAccuracy(correct, totalQuestions)
            }
        };

        // Update existing record or create new
        const history = getQuizHistory();
        const existingIndex = history.findIndex(q => q.id === this.sessionId);

        if (existingIndex >= 0) {
            history[existingIndex] = quizRecord;
        } else {
            history.push(quizRecord);
        }

        const saved = storage.set(HISTORY_KEY, history);
        if (saved) this.lastSavedQuestionCount = this.results.length;
        else console.error('Storage full: progress not saved. Consider clearing old history.');

        // Update pupil quiz count only once at start
        if (existingIndex < 0) {
            updatePupilQuizCount(this.config.pupilId);
        }
    },

    // Reset timer tracking but preserve current answer mode state
    resetAnswerModeForNewQuestion() {
        this.answerModeStartTime = null;
        this.accumulatedAnswerTime = 0;
        if (this.answersEnabled) {
            this.answerModeStartTime = Date.now();
        }
    },

});
