// cats.js — categories home page logic.
// Runs alongside menu/core.js which handles shared pupil functions (loadPupils, handleAddPupil etc.)
// selectedPupilId is declared in core.js and shared via global scope.

// Override core.js updateStartButton so pupil events re-validate the cats form
function updateStartButton() {
    updateCatsStartButton();
}

function updateCompareFsMax() {
    const slider = document.getElementById('field-size');
    const label  = document.getElementById('field-size-value');
    if (!slider) return;
    const selectedIds = Array.from(
        document.querySelectorAll('#compare-program-list input:checked')
    ).map(cb => cb.value);
    const anyScalable = selectedIds.some(id =>
        (window.COMPARE_PROGRAMS || []).find(p => p.id === id)?.canScale
    );
    const newMax = anyScalable ? '6' : '2';
    slider.max = newMax;
    if (parseInt(slider.value) > parseInt(newMax)) {
        slider.value = newMax;
        if (label) label.textContent = newMax;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAllCategoryPrograms();
    populateCompareProgramList();
    setupCatsEventListeners();
    handleCatsGameTypeChange();
});

async function loadAllCategoryPrograms() {
    const allPrograms = await getAllPrograms();
    document.querySelectorAll('.program-select-slot').forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Select Program --</option>';
        allPrograms.forEach((prog, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = prog.name;
            select.appendChild(opt);
        });
        if (currentVal) select.value = currentVal;
    });
}

function populateCompareProgramList() {
    const container = document.getElementById('compare-program-list');
    if (!container || !window.COMPARE_PROGRAMS || !window.COMPARE_PROGRAM_GROUPS) return;

    const progMap = Object.fromEntries(window.COMPARE_PROGRAMS.map(p => [p.id, p]));

    window.COMPARE_PROGRAM_GROUPS.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'compare-group';

        if (group.ids.length > 1) {
            const groupLabel = document.createElement('div');
            groupLabel.className = 'compare-group-label';
            groupLabel.textContent = group.label;
            groupDiv.appendChild(groupLabel);
        }

        group.ids.forEach(id => {
            const prog = progMap[id];
            if (!prog) return;
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = prog.id;
            cb.id = `cp-${prog.id}`;
            cb.addEventListener('change', () => {
                const checked = document.querySelectorAll('#compare-program-list input:checked').length;
                document.getElementById('compare-selected-count').textContent = checked;
                updateCompareFsMax();
                updateCatsStartButton();
            });
            const lbl = document.createElement('label');
            lbl.htmlFor = `cp-${prog.id}`;
            lbl.textContent = prog.question2;
            div.appendChild(cb);
            div.appendChild(lbl);
            groupDiv.appendChild(div);
        });

        container.appendChild(groupDiv);
    });
}

function setupCatsEventListeners() {
    document.querySelectorAll('input[name="game-type"]').forEach(r =>
        r.addEventListener('change', handleCatsGameTypeChange)
    );

    [0, 1, 2].forEach(i => {
        document.getElementById(`program-select-${i}`)?.addEventListener('change', () => handleCatsProgramChange(i));
    });

    document.getElementById('max-questions')?.addEventListener('input', e => {
        document.getElementById('max-questions-value').textContent = e.target.value;
    });

    document.getElementById('field-size')?.addEventListener('input', e => {
        document.getElementById('field-size-value').textContent = e.target.value;
    });

    document.getElementById('add-cat-btn')?.addEventListener('click', () => {
        document.getElementById('slot-2').style.display = '';
        document.getElementById('add-cat-btn').style.display = 'none';
        updateCatsStartButton();
    });

    document.getElementById('start-btn')?.addEventListener('click', startCatsQuiz);
}

function handleCatsGameTypeChange() {
    const type = document.querySelector('input[name="game-type"]:checked')?.value || 'sort';
    const isCompare = type === 'compare';

    // Head title and Manage Programs button
    const headLabel = document.getElementById('cats-order-label');
    const manageProgramsBtn = document.getElementById('openProgramModal');
    if (headLabel) headLabel.textContent = isCompare ? 'Compare Concepts' : 'Categories';
    if (manageProgramsBtn) manageProgramsBtn.style.display = isCompare ? 'none' : '';

    // Field size: visible for all types — label and range differ
    const fieldSizeGroup = document.getElementById('field-size-group');
    const fieldSizeSlider = document.getElementById('field-size');
    const fieldSizeLabel = document.querySelector('label[for="field-size"]');
    if (fieldSizeGroup) fieldSizeGroup.style.display = '';
    if (fieldSizeSlider) {
        fieldSizeSlider.min = '2';
        if (isCompare) {
            updateCompareFsMax();
            if (fieldSizeLabel) fieldSizeLabel.firstChild.textContent = 'Tiles: ';
        } else if (type === 'sort') {
            fieldSizeSlider.max = '3';
            if (parseInt(fieldSizeSlider.value) > 3) {
                fieldSizeSlider.value = '3';
                document.getElementById('field-size-value').textContent = '3';
            }
            if (fieldSizeLabel) fieldSizeLabel.firstChild.textContent = 'Categories: ';
        } else {
            fieldSizeSlider.max = '6';
            if (fieldSizeLabel) fieldSizeLabel.firstChild.textContent = 'Field Size: ';
        }
    }

    // Category display mode: sort only
    document.getElementById('cat-display-group')?.style.setProperty('display', type === 'sort' ? '' : 'none');

    // Categories section vs compare concept picker (both inside the same .order column)
    const categoriesSection = document.getElementById('categories-section');
    if (categoriesSection) categoriesSection.style.display = isCompare ? 'none' : '';

    const compareSection = document.getElementById('compare-section');
    if (compareSection) compareSection.style.display = isCompare ? '' : 'none';

    // Cat C add button: only relevant for sort/label
    if (!isCompare) {
        const addBtn = document.getElementById('add-cat-btn');
        const slot2 = document.getElementById('slot-2');
        if (addBtn && slot2) addBtn.style.display = slot2.style.display === 'none' ? '' : 'none';
    }

    updateCatsStartButton();
}

async function handleCatsProgramChange(slotIndex) {
    const select = document.getElementById(`program-select-${slotIndex}`);
    const stimulusGroup = document.getElementById(`stimulus-group-${slotIndex}`);
    const stimulusList = document.getElementById(`stimulus-list-${slotIndex}`);
    const counter = document.getElementById(`selected-count-${slotIndex}`);

    if (!select?.value) {
        stimulusGroup.style.display = 'none';
        updateCatsStartButton();
        return;
    }

    const allPrograms = await getAllPrograms();
    const program = allPrograms[parseInt(select.value)];
    if (!program) return;

    stimulusList.innerHTML = '';
    program.stimulus.forEach((stim, i) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `stim-${slotIndex}-${i}`;
        checkbox.value = i;
        checkbox.addEventListener('change', () => handleCatsStimulusChange(slotIndex, checkbox));

        const label = document.createElement('label');
        label.htmlFor = `stim-${slotIndex}-${i}`;
        label.textContent = stim.name;

        div.appendChild(checkbox);
        div.appendChild(label);
        stimulusList.appendChild(div);
    });

    stimulusGroup.style.display = 'block';
    counter.textContent = '0';
    updateCatsStartButton();
}

function handleCatsStimulusChange(slotIndex, changedCheckbox) {
    const checkboxes = document.querySelectorAll(`#stimulus-list-${slotIndex} input[type="checkbox"]`);
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    if (checked.length > 5) {
        changedCheckbox.checked = false;
        return;
    }
    document.getElementById(`selected-count-${slotIndex}`).textContent = checked.length;
    updateCatsStartButton();
}

function updateCatsStartButton() {
    if (!document.getElementById('start-btn')) return;
    let valid = !!selectedPupilId;

    const type = document.querySelector('input[name="game-type"]:checked')?.value || 'sort';

    if (type === 'compare') {
        const checkedCount = document.querySelectorAll('#compare-program-list input:checked').length;
        if (checkedCount === 0) valid = false;
    } else {
        // Cat A required for sort/label
        const progA = document.getElementById('program-select-0')?.value;
        if (!progA) valid = false;
    }

    document.getElementById('start-btn').disabled = !valid;
}

function startCatsQuiz() {
    if (!selectedPupilId) { alert('Please select a pupil'); return; }

    const gameType = document.querySelector('input[name="game-type"]:checked')?.value || 'sort';

    if (gameType === 'compare') {
        const compareProgramIds = Array.from(
            document.querySelectorAll('#compare-program-list input:checked')
        ).map(cb => cb.value);

        if (compareProgramIds.length === 0) {
            alert('Please select at least one concept');
            return;
        }

        const maxQuestions = parseInt(document.getElementById('max-questions').value);
        const fieldSize = parseInt(document.getElementById('field-size')?.value || 2);
        const config = {
            pupilId: selectedPupilId,
            gameType: 'compare',
            compareProgramIds,
            maxQuestions,
            fieldSize,
            homeUrl: 'cats-home.html',
        };

        sessionStorage.removeItem('quizConfig');
        sessionStorage.setItem('catsConfig', JSON.stringify(config));
        window.location.href = 'game.html';
        return;
    }

    const maxQuestions = parseInt(document.getElementById('max-questions').value);
    const fieldSize = parseInt(document.getElementById('field-size')?.value || 3);
    const catDisplayMode = document.querySelector('input[name="cat-display"]:checked')?.value || 'text';

    const categories = [];
    [0, 1, 2].forEach(i => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot || slot.style.display === 'none') return;
        const select = document.getElementById(`program-select-${i}`);
        if (!select?.value) return;
        const stimuliIndices = Array.from(
            document.querySelectorAll(`#stimulus-list-${i} input:checked`)
        ).map(cb => parseInt(cb.value));
        // Include even if no stimuli selected — treated as distractor-only category
        categories.push({ programIndex: parseInt(select.value), stimuliIndices });
    });

    if (categories.length === 0) {
        alert('Please select at least one category');
        return;
    }

    const config = {
        pupilId: selectedPupilId,
        gameType,
        categories,
        maxQuestions,
        fieldSize,
        catDisplayMode,
        homeUrl: 'cats-home.html',
    };

    sessionStorage.removeItem('quizConfig');
    sessionStorage.setItem('catsConfig', JSON.stringify(config));
    window.location.href = 'game.html';
}
