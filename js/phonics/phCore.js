// Phonics Game - class definition, constructor, init, methods

class PhonicsGame extends GameCore {
    constructor(config) {
        super(config);
        this.homeUrl = 'pages/phonics-home.html';

        this.pupils = config.pupils;
        this.programOrder = config.programOrder;
        this.currentProgramIndex = 0;
        this.currentPupilIndex = 0;
        this.pupilOrder = [];
        this.questionsAskedThisPupil = 0;
        this.pupilQuestionProgress = {}; // Track progress for "come back to" pupils
        this.currentProgramType = null;
        this.waitingForTeacherScore = false;
        this.lastScoredResult = null; // Track the last score for button feedback
        this.phonicsSessionId = generateId();
        this.lastSavedCount = 0;

        // Track results per pupil
        this.pupilResults = this.pupils.map(p => ({
            pupilId: p.pupilId,
            name: p.name,
            results: []
        }));

        this.totalQuestionsPlanned = 0;
        this.questionsCompleted = 0;
        this.lastShownPupilIndex = null; // Track last pupil shown on turn screen
        this.lastShownProgramType = null; // Track last program type shown on turn screen

        // Persistent phoneme speech data for sound button replay
        this.currentPhonemeSpeak = null;
    }

    async init() {
        // Calculate total questions
        this.programOrder.forEach(programType => {
            this.pupils.forEach(pupil => {
                const targets = pupil.targets[programType] || [];
                this.totalQuestionsPlanned += targets.length;
            });
        });

        this.startTimer();
    }

    // ========== TEACHER MENU: PUPIL MANAGEMENT ==========

    openTeacherMenu() {
        super.openTeacherMenu();

        const menu = document.getElementById('teacher-menu');
        const quizScreen = document.getElementById('game-screen');
        const isQuizScreen = quizScreen && quizScreen.style.display !== 'none';

        if (!menu || !isQuizScreen || this.currentPupilIndex >= this.pupilOrder.length) return;

        const pupilIndex = this.pupilOrder[this.currentPupilIndex];
        const pupil = this.pupils[pupilIndex];
        const pupilName = pupil.name;

        // Insert buttons before the Menu button
        const menuBtn = document.getElementById('menu-btn');
        if (!menuBtn) return;

        const btnStyle = `
            width: 100%;
            padding: 8px;
            margin-bottom: 6px;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
        `;

        // Only show "Come back to" if there are other pupils remaining
        const remainingPupils = this.pupilOrder.length - this.currentPupilIndex;
        if (remainingPupils > 1) {
            const comeBackBtn = document.createElement('button');
            comeBackBtn.id = 'come-back-btn';
            comeBackBtn.style.cssText = btnStyle + 'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);';
            comeBackBtn.textContent = `Come back to ${pupilName}`;
            comeBackBtn.addEventListener('click', () => this.comeBackToPupil());
            menu.insertBefore(comeBackBtn, menuBtn);
        }

        const skipBtn = document.createElement('button');
        skipBtn.id = 'skip-pupil-btn';
        skipBtn.style.cssText = btnStyle + 'background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%); color: #333;';
        skipBtn.textContent = `Skip ${pupilName}`;
        skipBtn.addEventListener('click', () => this.skipPupil());
        menu.insertBefore(skipBtn, menuBtn);
    }

    comeBackToPupil() {
        this.closeTeacherMenu();

        const pupilIndex = this.pupilOrder[this.currentPupilIndex];
        const pupil = this.pupils[pupilIndex];

        // Save current progress so they resume from where they left off
        const progressKey = `${pupilIndex}_${this.currentProgramType}`;
        this.pupilQuestionProgress[progressKey] = this.questionsAskedThisPupil;

        // Remove pupil from current position and add to end
        this.pupilOrder.splice(this.currentPupilIndex, 1);
        this.pupilOrder.push(pupilIndex);

        // Don't increment currentPupilIndex — next pupil has slid into position
        // Restore saved progress for the next pupil
        const nextPupilIndex = this.pupilOrder[this.currentPupilIndex];
        const nextKey = `${nextPupilIndex}_${this.currentProgramType}`;
        this.questionsAskedThisPupil = this.pupilQuestionProgress[nextKey] || 0;

        // Clear correction state
        this.correctionAttempts = 0;
        this.isInCorrection = false;
        this.initialResponseTime = null;
        this.waitingForTeacherScore = false;
        this.lastScoredResult = null;

        // Hide teacher controls if visible
        const controls = document.getElementById('teacher-controls');
        if (controls) controls.style.display = 'none';

        this.speak(`Let's try later!`);

        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    skipPupil() {
        this.closeTeacherMenu();

        const pupilIndex = this.pupilOrder[this.currentPupilIndex];
        const pupil = this.pupils[pupilIndex];
        const targets = pupil.targets[this.currentProgramType] || [];

        // Subtract remaining questions from total
        const remainingQuestions = targets.length - this.questionsAskedThisPupil;
        this.totalQuestionsPlanned -= remainingQuestions;

        // Clean up any saved progress for skipped pupil
        const skipKey = `${pupilIndex}_${this.currentProgramType}`;
        delete this.pupilQuestionProgress[skipKey];

        // Remove pupil from the order
        this.pupilOrder.splice(this.currentPupilIndex, 1);
        this.correctionAttempts = 0;
        this.isInCorrection = false;
        this.initialResponseTime = null;
        this.waitingForTeacherScore = false;
        this.lastScoredResult = null;

        // Hide teacher controls if visible
        const controls = document.getElementById('teacher-controls');
        if (controls) controls.style.display = 'none';

        // Check if there are any pupils left in this program
        if (this.pupilOrder.length === 0 || this.currentPupilIndex >= this.pupilOrder.length) {
            // No more pupils — move to next program
            this.currentProgramIndex++;
            this.startProgram();
        } else {
            // Restore saved progress for the next pupil (who slid into position)
            const nextPupilIndex = this.pupilOrder[this.currentPupilIndex];
            const nextKey = `${nextPupilIndex}_${this.currentProgramType}`;
            this.questionsAskedThisPupil = this.pupilQuestionProgress[nextKey] || 0;
            this.nextQuestion();
        }
    }

     // Override to speak when answer mode is enabled (for student modes)
    updateAnswerState() {
        super.updateAnswerState();

        // When answers become enabled and we have pending speech, speak it
        if (this.answersEnabled && this.pendingPhonemeSpeak) {
            const { before, letter, after } = this.pendingPhonemeSpeak;
            this.speakWithPhoneme(before, letter, after);
            this.pendingPhonemeSpeak = null;
            this.pendingSpeech = null;
        } else if (this.answersEnabled && this.pendingSpeech) {
            this.speak(this.pendingSpeech);
            this.pendingSpeech = null;
        }
    }
}

window.PhonicsGame = PhonicsGame;