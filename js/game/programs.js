// IdentifyGame and MatchGame — both extend GameCore.
// Shared helpers and init logic consolidated here.

function _correctionNames(name, isLetter) {
    return {
        label:  isLetter ? `the letter ${name}` : name,
        speech: isLetter ? `the letter ${getLetterSpeechName(name)}` : name
    };
}

// ── IdentifyGame ──────────────────────────────────────────────────────────────

class IdentifyGame extends GameCore {
    constructor(config) {
        super(config);
        this.config.gameType = 'find';
        this.homeUrl = 'identify-home.html';
    }

    // Inject a question-image element above the options grid (once only)
    _ensureQuestionImage() {
        if (document.getElementById('question-image')) return;
        const img = document.createElement('img');
        img.id = 'question-image';
        img.style.cssText = 'display:none; max-height:35vh; max-width:60%; object-fit:contain; margin:0 auto 8px; border-radius:16px;';
        document.getElementById('options-grid')?.before(img);
    }

    async showQuestion() {
        const question = this.questions[this.currentQuestion];
        const allPrograms = await getAllPrograms();
        const program = allPrograms[this.config.programIndex];

        this.currentTarget = question.target.name;
        this.isCurrentTargetLetter = (question.target.textOnly || program.textOnly) && question.target.name.trim().length === 1;
        const isPicToText = this.config.stimulusMode === 'picture-to-text';

        if (isPicToText) {
            this.currentQuestionText = this.isCurrentTargetLetter
                ? `Find the name for this letter`
                : `What is this called?`;
            this.currentSpeechText = this.currentQuestionText;
        } else {
            this.currentQuestionText = this.isCurrentTargetLetter ? `Find the letter ${question.target.name}` : `Find ${question.target.name}`;
            this.currentSpeechText   = this.isCurrentTargetLetter ? `Find the letter, ${getLetterSpeechName(question.target.name)}` : this.currentQuestionText;
        }

        if (!this.isInCorrection) {
            this.currentOptions = this.generateOptions(question.target, program);
        }

        await this.prepareQuestion(program);

        const questionTextElement = document.getElementById('question-text');
        if (questionTextElement) {
            const isTextBased = question.target.textOnly || program.textOnly;
            if (program.showQuestionText === false || isTextBased || isPicToText) {
                questionTextElement.style.display = 'none';
            } else {
                questionTextElement.style.display = 'flex';
                questionTextElement.textContent = this.currentQuestionText;
            }
        }

        // picture-to-text: show target image in question area
        this._ensureQuestionImage();
        const qImg = document.getElementById('question-image');
        if (qImg) {
            if (isPicToText) {
                const imgs = question.target.images || [];
                const src = imgs[Math.floor(Math.random() * imgs.length)];
                if (src) {
                    qImg.src = src;
                    qImg.style.display = 'block';
                } else {
                    qImg.style.display = 'none';
                }
            } else {
                qImg.style.display = 'none';
            }
        }

        this.speak(this.currentSpeechText);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.slideInOptions();
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    processSelectedAnswer(card, selected) {
        const question = this.questions[this.currentQuestion];
        const isCorrect = selected === question.target;
        this.disableAllOptions();
        if (isCorrect) {
            this.handleCorrectAnswer(card);
        } else {
            this.handleIncorrectAnswer(card);
        }
    }

    getCorrectionMessage() {
        const { label, speech } = _correctionNames(
            this.questions[this.currentQuestion].target.name,
            this.isCurrentTargetLetter
        );
        return { feedbackText: `This is ${label}`, speechText: `This is ${speech}` };
    }

    getCorrectCorrectionMessage() {
        const { speech } = _correctionNames(
            this.questions[this.currentQuestion].target.name,
            this.isCurrentTargetLetter
        );
        return { feedbackText: `That's correct!`, speechText: `That's correct, this is ${speech}` };
    }
}

// ── MatchGame ─────────────────────────────────────────────────────────────────

class MatchGame extends GameCore {
    constructor(config) {
        super(config);
        this.config.gameType = 'match';
        this.homeUrl = 'identify-home.html';
        this.currentTargetImage = null;
        this._dragClone = null;
        this._boundMove = null;
        this._boundUp = null;
        this._isLetter = false;
        this._isTextMode = false;
        this._placedCard = null;
        this._placedOption = null;
    }

    // Inject drag zone if not present — placed between question text and options
    _ensureDragZone() {
        if (document.getElementById('drag-zone')) return;
        const zone = document.createElement('div');
        zone.id = 'drag-zone';
        zone.innerHTML = '<div id="draggable-target"></div>';
        document.getElementById('question-text')?.after(zone);
    }

    // Prefer a different image from the draggable target for the correct option card
    _pickOptionImage(opt, target) {
        const imgs = opt.images || [];
        if (opt.name === target.name) {
            const alts = imgs.filter(img => img !== this.currentTargetImage);
            const pool = alts.length > 0 ? alts : imgs;
            return pool[Math.floor(Math.random() * pool.length)] || null;
        }
        return imgs[Math.floor(Math.random() * imgs.length)] || null;
    }

    async showQuestion() {
        const question = this.questions[this.currentQuestion];
        const allPrograms = await getAllPrograms();
        const program = allPrograms[this.config.programIndex];

        this.currentTarget = question.target.name;
        const name = question.target.name;
        this._isLetter   = name.length === 1 && /[a-zA-Z]/.test(name);
        this._isTextMode = !!(program?.textOnly || question.target.textOnly);

        const stimMode = this.config.stimulusMode || 'standard';
        // picture-to-text: drag zone shows image, options show text labels
        // text-to-picture: drag zone shows text, options show images
        this._optionsAsText = stimMode === 'picture-to-text';

        this._ensureDragZone();
        this._clearPlaced();

        if (!this.isInCorrection) {
            const imgs = question.target.images || [];
            // text-to-picture forces the drag zone to show text (no image), options remain images
            const dragAsText = this._isTextMode || stimMode === 'text-to-picture';
            this.currentTargetImage = (!dragAsText && imgs.length > 0)
                ? imgs[Math.floor(Math.random() * imgs.length)]
                : null;
            this.currentOptions = this.generateOptions(question.target, program);
        }

        await this.prepareQuestion(program);

        if (stimMode === 'picture-to-text') {
            this.currentQuestionText = this._isLetter ? `Match this letter` : `Match this picture`;
            this.currentSpeechText   = this.currentQuestionText;
        } else if (stimMode === 'text-to-picture') {
            this.currentQuestionText = this._isLetter ? `Match the letter ${name}` : `Match the word`;
            this.currentSpeechText   = this._isLetter ? `Match the letter, ${getLetterSpeechName(name)}` : `Match the word`;
        } else if (this._isLetter) {
            this.currentQuestionText = `Match the letter ${name}`;
            this.currentSpeechText   = `Match the letter, ${getLetterSpeechName(name)}`;
        } else {
            this.currentQuestionText = `Match ${name}`;
            this.currentSpeechText   = this.currentQuestionText;
        }

        const qEl = document.getElementById('question-text');
        if (qEl) {
            if (program.showQuestionText === false || stimMode === 'picture-to-text') {
                qEl.style.display = 'none';
            } else {
                qEl.style.display = 'flex';
                qEl.textContent = this.currentQuestionText;
            }
        }

        this.speak(this.currentSpeechText);
        await new Promise(r => setTimeout(r, 500));

        this._updateDraggableTarget();
        this._enableDrag();

        await this.slideInOptions();
        await new Promise(r => setTimeout(r, 50));
    }

    // No click handler — drag-and-drop is the answer mechanism
    attachOptionInteraction(card, option) {}

    updateAnswerState() {
        super.updateAnswerState();
        const draggable = document.getElementById('draggable-target');
        if (draggable) draggable.classList.toggle('answers-disabled', !this.answersEnabled);
    }

    processSelectedAnswer(card, selected) {
        const question = this.questions[this.currentQuestion];
        this._clearPlaced();
        this.disableAllOptions();
        const draggable = document.getElementById('draggable-target');
        if (draggable) {
            draggable.style.opacity = '';
            draggable.classList.add('answered');
        }
        if (selected === question.target) {
            this.handleCorrectAnswer(card);
        } else {
            this.handleIncorrectAnswer(card);
        }
    }

    getCorrectionMessage() {
        const { label, speech } = _correctionNames(
            this.questions[this.currentQuestion].target.name,
            this._isLetter
        );
        return { feedbackText: `This is ${label}`, speechText: `This is ${speech}` };
    }

    getCorrectCorrectionMessage() {
        const { speech } = _correctionNames(
            this.questions[this.currentQuestion].target.name,
            this._isLetter
        );
        return { feedbackText: `That's correct!`, speechText: `That's correct, this is ${speech}` };
    }

    // ── Drag content builder ───────────────────────────────────────────────────

    _buildDraggableContent(parent) {
        parent.innerHTML = '';
        if (this.currentTargetImage) {
            const img = document.createElement('img');
            img.src = this.currentTargetImage;
            img.draggable = false;
            parent.appendChild(img);
            parent.classList.remove('text-drag');
        } else if (this.currentTarget) {
            const textDiv = document.createElement('div');
            textDiv.className = 'drag-text-display';
            textDiv.textContent = this.currentTarget;
            parent.appendChild(textDiv);
            parent.classList.add('text-drag');
        }
    }

    // ── Drag zone helpers ──────────────────────────────────────────────────────

    _updateDraggableTarget() {
        const el = document.getElementById('draggable-target');
        if (!el) return;
        this._buildDraggableContent(el);
        el.classList.remove('dragging', 'answers-disabled', 'answered');
        el.style.opacity = '';
    }

    _clearPlaced() {
        document.getElementById('placed-target')?.remove();
        const draggable = document.getElementById('draggable-target');
        if (draggable) draggable.style.opacity = '';
        this.clearSelection();
        this._placedCard = null;
        this._placedOption = null;
    }

    _enableDrag() {
        const draggable = document.getElementById('draggable-target');
        if (!draggable) return;

        document.getElementById('drag-clone')?.remove();

        this._boundMove = e => this._onPointerMove(e);
        this._boundUp   = e => this._onPointerUp(e);

        const onDown = e => {
            if (!this.answersEnabled) return;
            e.preventDefault();

            const clone = draggable.cloneNode(true);
            clone.id = 'drag-clone';
            document.body.appendChild(clone);
            this._dragClone = clone;
            draggable.classList.add('dragging');
            this._moveClone(e.clientX, e.clientY);

            document.addEventListener('pointermove', this._boundMove);
            document.addEventListener('pointerup',   this._boundUp, { once: true });
        };

        draggable.addEventListener('pointerdown', onDown, { once: true });
    }

    _onPointerMove(e) {
        if (this._dragClone) {
            this._moveClone(e.clientX, e.clientY);
            this._dragClone.style.pointerEvents = 'none';
        }
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const card = el?.closest('.option-card');
        document.querySelectorAll('.option-card.drag-over').forEach(c => c.classList.remove('drag-over'));
        if (card) card.classList.add('drag-over');
    }

    _onPointerUp(e) {
        document.removeEventListener('pointermove', this._boundMove);

        if (this._dragClone) {
            this._dragClone.remove();
            this._dragClone = null;
        }
        document.querySelectorAll('.option-card.drag-over').forEach(c => c.classList.remove('drag-over'));

        const draggable = document.getElementById('draggable-target');
        if (draggable) {
            draggable.classList.remove('dragging');
            draggable.style.opacity = '';
        }

        const el = document.elementFromPoint(e.clientX, e.clientY);
        const card = el?.closest('.option-card');

        if (!card || !this.answersEnabled) {
            this._enableDrag();
            return;
        }

        const option = this.currentOptions.find(o => o.name === card.dataset.optionName);
        if (!option) {
            this._enableDrag();
            return;
        }

        this._placeOnCard(card, option, e.clientX, e.clientY);
    }

    _placeOnCard(card, option, dropX, dropY) {
        document.getElementById('placed-target')?.remove();

        const placed = document.createElement('div');
        placed.id = 'placed-target';

        const sharedStyles = [
            'position: fixed',
            'box-sizing: border-box',
            'z-index: 100',
            'border-radius: 16px',
            'box-shadow: 0 4px 20px rgba(0,0,0,0.35)',
            'border: 3px solid white',
            'cursor: grab',
            'touch-action: none',
            'display: flex',
            'align-items: center',
            'justify-content: center',
        ];

        if (this._isTextMode) {
            placed.style.cssText = [
                ...sharedStyles,
                `left: ${dropX}px`,
                `top: ${dropY}px`,
                'transform: translate(-50%, -50%)',
                'width: auto',
                'min-width: 80px',
                'height: auto',
                'min-height: 56px',
                'overflow: visible',
                'padding: 8px 12px',
            ].join('; ') + ';';
        } else {
            const size = 140;
            placed.style.cssText = [
                ...sharedStyles,
                `left: ${dropX - size / 2}px`,
                `top: ${dropY - size / 2}px`,
                `width: ${size}px`,
                `height: ${size}px`,
                'overflow: hidden',
            ].join('; ') + ';';
        }

        this._buildDraggableContent(placed);
        document.body.appendChild(placed);

        this._placedCard = card;
        this._placedOption = option;

        this.selectOption(card, option);

        const draggable = document.getElementById('draggable-target');
        if (draggable) {
            draggable.style.opacity = '0';
            draggable.classList.remove('dragging');
        }

        this._enablePlacedDrag(placed);
    }

    _enablePlacedDrag(placed) {
        const onDown = e => {
            if (!this.answersEnabled) return;
            e.preventDefault();

            placed.style.opacity = '0';
            placed.style.pointerEvents = 'none';

            const btn = document.getElementById('confirm-answer-btn');
            if (btn) btn.style.display = 'none';

            const clone = placed.cloneNode(true);
            clone.id = 'drag-clone';
            clone.style.opacity = '0.9';
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);
            this._dragClone = clone;
            this._moveClone(e.clientX, e.clientY);

            const moveHandler = e2 => {
                if (this._dragClone) {
                    this._moveClone(e2.clientX, e2.clientY);
                    this._dragClone.style.pointerEvents = 'none';
                }
                const el2 = document.elementFromPoint(e2.clientX, e2.clientY);
                const hovered = el2?.closest('.option-card');
                document.querySelectorAll('.option-card.drag-over').forEach(c => c.classList.remove('drag-over'));
                if (hovered) hovered.classList.add('drag-over');
            };

            const upHandler = e2 => {
                document.removeEventListener('pointermove', moveHandler);
                document.querySelectorAll('.option-card.drag-over').forEach(c => c.classList.remove('drag-over'));

                if (this._dragClone) {
                    this._dragClone.remove();
                    this._dragClone = null;
                }

                const el2 = document.elementFromPoint(e2.clientX, e2.clientY);
                const card = el2?.closest('.option-card');

                if (!card || !this.answersEnabled) {
                    placed.style.opacity = '1';
                    placed.style.pointerEvents = 'auto';
                    if (btn) btn.style.display = 'flex';
                    placed.addEventListener('pointerdown', onDown, { once: true });
                    return;
                }

                const option = this.currentOptions.find(o => o.name === card.dataset.optionName);
                if (!option) {
                    placed.style.opacity = '1';
                    placed.style.pointerEvents = 'auto';
                    if (btn) btn.style.display = 'flex';
                    placed.addEventListener('pointerdown', onDown, { once: true });
                    return;
                }

                placed.remove();
                this._placeOnCard(card, option, e2.clientX, e2.clientY);
            };

            document.addEventListener('pointermove', moveHandler);
            document.addEventListener('pointerup', upHandler, { once: true });
        };

        placed.addEventListener('pointerdown', onDown, { once: true });
    }

    _moveClone(x, y) {
        if (!this._dragClone) return;
        if (this._isTextMode) {
            this._dragClone.style.left = x + 'px';
            this._dragClone.style.top  = y + 'px';
            this._dragClone.style.transform = 'translate(-50%, -50%)';
        } else {
            this._dragClone.style.left = (x - 70) + 'px';
            this._dragClone.style.top  = (y - 70) + 'px';
        }
    }
}

// ── CatCompareGame ────────────────────────────────────────────────────────────
// Two categories — question asks "Which one is [Cat A name]?"

class CatCompareGame extends IdentifyGame {
    constructor(config) {
        super(config);
        this.config.gameType = 'compare';
        this.homeUrl = 'cats-home.html';
        this.catALabel = '';
    }

    async generateQuestions() {
        const allPrograms = await getAllPrograms();
        const { categories, maxQuestions } = this.config;

        const progA = allPrograms[categories[0].programIndex];
        const progB = allPrograms[categories[1].programIndex];
        this.catALabel = progA.name;

        const stimuliA = categories[0].stimuliIndices.map(i => progA.stimulus[i]);
        const stimuliB = categories[1].stimuliIndices.map(i => progB.stimulus[i]);

        this.questions = [];
        for (let i = 0; i < maxQuestions; i++) {
            const stimA = stimuliA[i % stimuliA.length];
            const stimB = stimuliB[i % stimuliB.length];
            this.questions.push({ target: stimA, options: [stimA, stimB] });
        }
        this.questions = this.shuffleArray(this.questions);
        return true;
    }

    async showQuestion() {
        const question = this.questions[this.currentQuestion];
        this.currentTarget = question.target.name;
        this.isCurrentTargetLetter = false;
        this.currentQuestionText = `Which one is ${this.catALabel}?`;
        this.currentSpeechText = this.currentQuestionText;

        if (!this.isInCorrection) {
            this.currentOptions = question.options;
            this.currentOptionImages = question.options.map(opt => this._pickOptionImage(opt, question.target));
        }

        await this.prepareQuestion({});

        const qEl = document.getElementById('question-text');
        if (qEl) { qEl.style.display = 'flex'; qEl.textContent = this.currentQuestionText; }

        this.speak(this.currentSpeechText);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.slideInOptions();
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    getCorrectionMessage() {
        const name = this.questions[this.currentQuestion].target.name;
        return { feedbackText: `This is ${name}`, speechText: `This is ${name}` };
    }

    getCorrectCorrectionMessage() {
        const name = this.questions[this.currentQuestion].target.name;
        return { feedbackText: `That's correct!`, speechText: `That's correct, this is ${name}` };
    }
}

// ── TileCompareGame ───────────────────────────────────────────────────────────
// Perceptual concept comparison using procedurally rendered CSS tiles.
// Programs (bigger, taller, lighter, etc.) live in js/compare-data.js.

class TileCompareGame extends GameCore {
    constructor(config) {
        super(config);
        this.config.gameType = 'compare';
        this.homeUrl = 'cats-home.html';
        this.comparePrograms = [];
        this.currentTileColor = null;
    }

    async generateQuestions() {
        const ids = this.config.compareProgramIds || [];
        this.comparePrograms = (window.COMPARE_PROGRAMS || []).filter(p => ids.includes(p.id));
        if (!this.comparePrograms.length) { window.location.href = this.homeUrl; return false; }

        // Populate dynamic tile programs (word/picture use real stimulus data)
        const dynamicProgs = this.comparePrograms.filter(p => p.dynamicTiles);
        if (dynamicProgs.length) {
            const allPrograms = await getAllPrograms();
            const stimuli = allPrograms.flatMap(p => (p.stimulus || []).filter(s => s.images?.length && s.name));
            dynamicProgs.forEach(prog => prog._populateTiles(stimuli));
        }

        const fieldSize = parseInt(this.config.fieldSize) || 2;

        // Filter stages to those matching the configured tile count.
        // Programs with canScale:false are always capped at 2 tiles.
        let queue = this.comparePrograms.flatMap(prog => {
            const targetSize = prog.canScale ? fieldSize : 2;
            return prog.stages
                .filter(stage => stage.tiles.length === targetSize)
                .map(stage => ({ prog, stage }));
        });

        if (!queue.length) { window.location.href = this.homeUrl; return false; }
        queue = this.shuffleArray(queue);

        this.questions = [];
        for (let i = 0; i < this.config.maxQuestions; i++) {
            const { prog, stage } = queue[i % queue.length];
            const tileIds = this.shuffleArray([...stage.tiles]);
            this.questions.push({ prog, stage, tileIds, correctId: stage.correct });
        }
        return true;
    }

    async showQuestion() {
        const q = this.questions[this.currentQuestion];

        if (!this.isInCorrection) {
            // New random colour each question (stays same through correction)
            const colors = window.TEXT_COLORS || ['#5063b8', '#764ba2', '#fa709a', '#4facfe', '#1b7539', '#e2612a'];
            this.currentTileColor = colors[Math.floor(Math.random() * colors.length)];
        }

        const fieldSize = parseInt(this.config.fieldSize) || 2;
        const useMulti = q.prog.canScale && fieldSize > 2;

        this.currentTarget = q.correctId;
        this.currentQuestionText = useMulti ? q.prog.questionMulti : q.prog.question2;
        this.currentSpeechText   = this.currentQuestionText;

        if (!this.isInCorrection) {
            this.currentOptions = q.tileIds.map(id => ({ name: id }));
            this.currentOptionImages = [];
        }

        // fieldSize drives the CSS grid column count
        this.config.fieldSize = q.tileIds.length;
        await this.prepareQuestion({});

        const qEl = document.getElementById('question-text');
        if (qEl) { qEl.style.display = 'flex'; qEl.textContent = this.currentQuestionText; }

        this.speak(this.currentSpeechText);
        await new Promise(r => setTimeout(r, 500));
        await this.slideInOptions();
        await new Promise(r => setTimeout(r, 50));
    }

    // Override: render tile elements instead of images or text
    displayOptions(_options, _program) {
        const grid = document.getElementById('options-grid');
        if (!grid) return;
        grid.innerHTML = '';
        grid.classList.remove('fade-out', 'text-mode');

        const q = this.questions[this.currentQuestion];
        if (!q) return;
        grid.setAttribute('data-size', q.tileIds.length);

        const tileMap = Object.fromEntries(q.prog.tiles.map(t => [t.id, t]));

        // currentOptions may be reshuffled by prepareQuestion during correction
        this.currentOptions.forEach(opt => {
            const tileId = opt.name;
            const tileData = tileMap[tileId];
            if (!tileData) return;

            const card = document.createElement('div');
            card.className = 'option-card';
            card.dataset.optionName = tileId;
            if (tileId === q.correctId) card.dataset.isTarget = 'true';

            const inner = document.createElement('div');
            inner.className = 'tile-inner';
            q.prog.renderTile(tileData, inner, this.currentTileColor);
            card.appendChild(inner);

            this.attachOptionInteraction(card, { name: tileId });
            grid.appendChild(card);
        });
    }

    processSelectedAnswer(card, selected) {
        const q = this.questions[this.currentQuestion];
        const isCorrect = selected.name === q.correctId;
        this.disableAllOptions();
        if (isCorrect) this.handleCorrectAnswer(card);
        else           this.handleIncorrectAnswer(card);
    }

    _correctionLabel() {
        const q = this.questions[this.currentQuestion];
        const fieldSize = parseInt(this.config.fieldSize) || 2;
        const useMulti = q.prog.canScale && fieldSize > 2;
        return useMulti ? q.prog.correctLabelMulti : q.prog.correctLabel2;
    }

    getCorrectionMessage() {
        const label = this._correctionLabel();
        return { feedbackText: `This one is ${label}`, speechText: `This one is ${label}` };
    }

    getCorrectCorrectionMessage() {
        const label = this._correctionLabel();
        return { feedbackText: `That's right!`, speechText: `That's right, this one is ${label}` };
    }

    getCurrentQuestionData() {
        const q = this.questions[this.currentQuestion];
        const useMulti = q.prog.canScale && q.tileIds.length > 2;
        const label = useMulti ? q.prog.correctLabelMulti : q.prog.correctLabel2;
        return { questionNumber: this.currentQuestion + 1, target: label };
    }
}

// ── LabelGame ─────────────────────────────────────────────────────────────────
// Show a category name, pick the correct stimulus from all categories.

class LabelGame extends IdentifyGame {
    constructor(config) {
        super(config);
        this.config.gameType = 'label';
        this.homeUrl = 'cats-home.html';
    }

    async generateQuestions() {
        const allPrograms = await getAllPrograms();
        const { categories, maxQuestions, fieldSize } = this.config;

        // Build category programs — if no stimuli selected, use all stimuli from that program
        const categoryPrograms = categories.map(cat => ({
            program: allPrograms[cat.programIndex],
            stimuli: cat.stimuliIndices.length > 0
                ? cat.stimuliIndices.map(i => allPrograms[cat.programIndex].stimulus[i])
                : allPrograms[cat.programIndex].stimulus
        }));

        // Flat list of all target stimuli, tagged by category index
        const allStimuli = categoryPrograms.flatMap((cat, ci) =>
            cat.stimuli.map(s => ({ stimulus: s, categoryLabel: cat.program.name, categoryIndex: ci }))
        );

        // Extra distractors from programs not used as categories, split by type for preference
        const usedIndices = new Set(categories.map(c => c.programIndex));
        const extraByType = { text: [], image: [] };
        allPrograms.forEach((prog, pi) => {
            if (usedIndices.has(pi)) return;
            prog.stimulus.forEach(s => extraByType[prog.textOnly ? 'text' : 'image'].push(s));
        });

        const shuffled = this.shuffleArray([...allStimuli]);
        this.questions = [];

        for (let i = 0; i < maxQuestions; i++) {
            const item = shuffled[i % shuffled.length];
            const targetFieldSize = parseInt(fieldSize) || 3;

            // Distractors: first from other categories, then from other programs (type-matched first)
            const inCatPool = allStimuli.filter(x => x.categoryIndex !== item.categoryIndex).map(x => x.stimulus);
            const targetIsText = !!(item.stimulus.textOnly || categoryPrograms[item.categoryIndex].program.textOnly);
            const typeMatchedExtra = targetIsText ? extraByType.text : extraByType.image;
            const typeFallbackExtra = targetIsText ? extraByType.image : extraByType.text;
            const distractorPool = [...inCatPool, ...this.shuffleArray([...typeMatchedExtra]), ...this.shuffleArray([...typeFallbackExtra])];

            const seen = new Set();
            const uniqueDistractors = distractorPool.filter(s => {
                if (seen.has(s.name)) return false;
                seen.add(s.name);
                return true;
            });

            const numDistractors = Math.min(targetFieldSize - 1, uniqueDistractors.length);
            const distractors = uniqueDistractors.slice(0, numDistractors);
            const options = this.shuffleArray([item.stimulus, ...distractors]);

            this.questions.push({ target: item.stimulus, categoryLabel: item.categoryLabel, options });
        }
        return true;
    }

    async showQuestion() {
        const question = this.questions[this.currentQuestion];
        this.currentTarget = question.target.name;
        this.isCurrentTargetLetter = false;
        this.currentQuestionText = `Which one belongs to the category ${question.categoryLabel}?`;
        this.currentSpeechText = this.currentQuestionText;

        if (!this.isInCorrection) {
            this.currentOptions = question.options;
            this.currentOptionImages = question.options.map(opt => this._pickOptionImage(opt, question.target));
        }

        await this.prepareQuestion({});

        const qEl = document.getElementById('question-text');
        if (qEl) { qEl.style.display = 'flex'; qEl.textContent = this.currentQuestionText; }

        this.speak(this.currentSpeechText);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.slideInOptions();
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    getCurrentQuestionData() {
        const q = this.questions[this.currentQuestion];
        return {
            questionNumber: this.currentQuestion + 1,
            target: q.categoryLabel,
            stimulus: q.target.name,
        };
    }

    getCorrectionMessage() {
        const q = this.questions[this.currentQuestion];
        const msg = `${q.target.name} belongs in ${q.categoryLabel}`;
        return { feedbackText: msg, speechText: msg };
    }

    getCorrectCorrectionMessage() {
        const q = this.questions[this.currentQuestion];
        return {
            feedbackText: `That's correct!`,
            speechText: `That's right, ${q.target.name} belongs in ${q.categoryLabel}`
        };
    }
}

// ── SortGame ──────────────────────────────────────────────────────────────────
// Deck/stack model — categories stay fixed on screen, stimuli drawn one at a time.
// Extends MatchGame to inherit drag/pointer mechanics.

class SortGame extends MatchGame {
    constructor(config) {
        super(config);
        this.config.gameType = 'sort';
        this.homeUrl = 'cats-home.html';
        this.categoryOptions = [];
    }

    async generateQuestions() {
        const allPrograms = await getAllPrograms();
        const { categories, maxQuestions, fieldSize } = this.config;

        const categoryPrograms = categories.map(cat => ({
            program: allPrograms[cat.programIndex],
            // if no stimuli selected, use all stimuli from that program as targets
            stimuli: cat.stimuliIndices.length > 0
                ? cat.stimuliIndices.map(i => allPrograms[cat.programIndex].stimulus[i])
                : [...allPrograms[cat.programIndex].stimulus]
        }));

        // Auto-fill categories up to fieldSize (min 2), preferring programs that match user's type
        const targetCatCount = Math.max(2, parseInt(fieldSize) || 2);
        if (categoryPrograms.length < targetCatCount) {
            const usedIndices = new Set(categories.map(c => c.programIndex));
            const userTextOnly = categories.every(cat => allPrograms[cat.programIndex].textOnly);
            const available = allPrograms.map((prog, i) => ({ prog, i })).filter(({ i }) => !usedIndices.has(i));
            const preferred = this.shuffleArray(available.filter(({ prog }) => !!prog.textOnly === userTextOnly));
            const fallback = this.shuffleArray(available.filter(({ prog }) => !!prog.textOnly !== userTextOnly));
            [...preferred, ...fallback].slice(0, targetCatCount - categoryPrograms.length).forEach(({ prog }) =>
                categoryPrograms.push({ program: prog, stimuli: [...prog.stimulus] })
            );
        }

        // Build fixed category option cards
        this.categoryOptions = categoryPrograms.map(cat => ({ name: cat.program.name, textOnly: true }));

        // All stimuli from all categories are targets, tagged by category index
        const targetStimuli = categoryPrograms.flatMap((cat, ci) =>
            cat.stimuli.map(s => ({ stimulus: s, categoryIndex: ci }))
        );

        const shuffled = this.shuffleArray([...targetStimuli]);
        this.questions = shuffled.slice(0, maxQuestions).map(item => ({
            stimulus: item.stimulus,
            target: this.categoryOptions[item.categoryIndex]   // index match — robust vs name match
        }));

        this.currentOptionImages = this.categoryOptions.map(opt => opt.images?.[0] || null);
        return true;
    }

    _ensureDragZone() {
        if (document.getElementById('drag-zone')) return;
        const zone = document.createElement('div');
        zone.id = 'drag-zone';
        zone.innerHTML = `
            <div id="sort-stack">
                <div class="stack-ghost ghost-b"></div>
                <div class="stack-ghost ghost-a"></div>
                <div id="draggable-target"></div>
            </div>
        `;
        document.getElementById('question-text')?.after(zone);
    }

    _updateStackGhosts() {
        const remaining = this.questions.length - this.currentQuestion;
        const ghostA = document.querySelector('.ghost-a');
        const ghostB = document.querySelector('.ghost-b');
        if (ghostA) ghostA.style.display = remaining > 1 ? '' : 'none';
        if (ghostB) ghostB.style.display = remaining > 2 ? '' : 'none';
    }

    async showQuestion() {
        const question = this.questions[this.currentQuestion];
        this.currentTarget = question.stimulus.name;

        // Only pick a new image when not in correction — preserves same image during correction
        if (!this.isInCorrection) {
            const imgs = question.stimulus.images || [];
            this.currentTargetImage = (!question.stimulus.textOnly && imgs.length > 0)
                ? imgs[Math.floor(Math.random() * imgs.length)] : null;
            this._isLetter = false;
            this._isTextMode = !this.currentTargetImage;
        }

        this._ensureDragZone();

        // Always reset option card states (clears .disabled, .correct, .correction etc.)
        document.querySelectorAll('.option-card').forEach(c => {
            c.classList.remove('correct', 'incorrect', 'correction', 'correction-correct',
                               'selected', 'disabled', 'drag-over', 'not-ready');
        });

        if (!this.isInCorrection && this.currentQuestion === 0) {
            // First question — render categories and set question text
            this.currentOptions = this.categoryOptions;
            this.resetFeedback();
            this.displayOptions(this.categoryOptions, {});
            this.updateAnswerState();
            const qEl = document.getElementById('question-text');
            if (qEl) { qEl.style.display = 'flex'; qEl.textContent = 'Sort these into categories:'; }
            // Speak once at the start only
            this.speak('Sort these into categories');
        } else {
            // Subsequent question or correction — categories already on screen
            this.currentOptions = this.categoryOptions;
            this._clearPlaced();
            this.resetFeedback();
            this.updateAnswerState();
        }

        // Update data-is-target for the current question's correct category
        const targetCatName = question.target.name;
        document.querySelectorAll('.option-card').forEach(c => {
            c.dataset.isTarget = c.dataset.optionName === targetCatName ? 'true' : 'false';
        });

        this._updateStackGhosts();
        this.startQuestionTimer();
        this.updateQuestionCounter();
        this._updateDraggableTarget();
        this._enableDrag();
        await new Promise(r => setTimeout(r, 50));
    }

    processSelectedAnswer(card, selected) {
        const question = this.questions[this.currentQuestion];
        this._clearPlaced();
        this.disableAllOptions();
        const draggable = document.getElementById('draggable-target');
        if (draggable) {
            draggable.style.opacity = '';
            draggable.classList.add('answered');
        }
        if (selected.name === question.target.name) {
            this.handleCorrectAnswer(card);
        } else {
            this.handleIncorrectAnswer(card);
        }
    }

    getCurrentQuestionData() {
        const q = this.questions[this.currentQuestion];
        return {
            questionNumber: this.currentQuestion + 1,
            target: q.target.name,
            stimulus: q.stimulus.name,
        };
    }

    getCorrectionMessage() {
        const catName = this.questions[this.currentQuestion].target.name;
        return { feedbackText: `It goes in ${catName}`, speechText: `It goes in ${catName}` };
    }

    getCorrectCorrectionMessage() {
        const catName = this.questions[this.currentQuestion].target.name;
        return { feedbackText: `That's right!`, speechText: `Yes, it goes in ${catName}` };
    }
}

// ── Shared initialisation ─────────────────────────────────────────────────────

function initStandardGame(fallbackHomeUrl) {
    document.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen)
                await document.documentElement.requestFullscreen();
        } catch (err) { console.warn('Fullscreen request failed:', err); }
    }, { once: true });

    try {
        const config = JSON.parse(sessionStorage.getItem('catsConfig') || sessionStorage.getItem('quizConfig'));
        const homeUrl = config?.homeUrl || fallbackHomeUrl || 'home.html';
        if (!config) { window.location.href = homeUrl; return; }

        const GAME_CLASSES = { find: IdentifyGame, match: MatchGame, compare: TileCompareGame, sort: SortGame, label: LabelGame };
        const GameClass = GAME_CLASSES[config.gameType] ?? IdentifyGame;

        const teacherBtn = document.getElementById('teacher-btn');
        if (teacherBtn) teacherBtn.style.display = 'none';

        document.getElementById('begin-btn')?.addEventListener('click', async () => {
            const game = new GameClass(config);
            const success = await game.generateQuestions();
            if (!success) return;

            game.startTimer();
            document.getElementById('start-screen')?.style.setProperty('display', 'none');
            document.getElementById('game-screen')?.style.setProperty('display', 'flex');
            if (teacherBtn) teacherBtn.style.display = 'block';

            game.setupSoundButton();
            game.setupAnswerToggle(true);
            game.setupConfirmButton();
            game.setupTeacherButton();   
            game.updateAnswerState();
            game.updateQuestionCounter();
            game.showQuestion();
        });
    } catch (error) {
        console.error('Initialization error:', error);
        window.location.href = fallbackHomeUrl || 'home.html';
    }
}
