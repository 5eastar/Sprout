// core.js — shared menu logic for identify-home and cats-home.
// Handles pupil selection/creation and the identify-home program select flow.
// cats-menu.js runs alongside this and overrides updateStartButton for cats-home.

const MAX_SELECTED_STIMULI = 5;

let selectedPupilId = null;

// Initialize menu on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadPupils();

    // Pupil listeners needed on all home pages
    document.getElementById('pupil-select')?.addEventListener('change', handlePupilSelect);
    document.getElementById('add-pupil-btn')?.addEventListener('click', handleAddPupil);
    document.getElementById('new-pupil-name')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleAddPupil();
    });

    // Program/game listeners only needed on identify-home.html
    if (document.getElementById('program-select')) {
        await loadPrograms();
        setupEventListeners();
    }
});

// Load pupils into dropdown
async function loadPupils() {
    const pupils = getAllPupils();
    const pupilSelect = document.getElementById('pupil-select');
    if (!pupilSelect) return;

    // Clear existing options except first
    pupilSelect.innerHTML = '<option value="">-- Select Pupil --</option>';

    pupils.forEach(pupil => {
        const option = document.createElement('option');
        option.value = pupil.id;
        option.textContent = pupil.name;
        pupilSelect.appendChild(option);
    });
}

// Load programs into dropdown
async function loadPrograms() {
    const programSelect = document.getElementById('program-select');
    if (!programSelect) return;
    //include custom programs
    programSelect.innerHTML = '<option value="">-- Select Program --</option>';
    const allPrograms = await getAllPrograms();

    allPrograms.forEach((program, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${program.name}`;
        programSelect.appendChild(option);
    });
  }


// Populate stimulus mode radio buttons based on selected game type
async function updateStimulusModeOptions() {
    const group = document.getElementById('stimulus-mode-group');
    if (!group) return;
    const gameType = document.querySelector('input[name="game-type"]:checked')?.value || 'find';

    let options = gameType === 'match'
        ? [
            { value: 'standard',        label: 'Picture → Picture' },
            { value: 'picture-to-text', label: 'Picture → Text' },
            { value: 'text-to-picture', label: 'Text → Picture' },
          ]
        : [
            { value: 'standard',        label: 'Text → Picture' },
            { value: 'picture-to-text', label: 'Picture → Text' },
          ];

    const modeBox = document.getElementById('question-mode-box');
    const programIndex = document.getElementById('program-select')?.value;
    let isTextOnly = false;

    if (programIndex !== '' && programIndex !== undefined && programIndex !== null) {
        const allPrograms = await getAllPrograms();
        const program = allPrograms[programIndex];
        isTextOnly = program?.textOnly || false;
    }

    if (modeBox) modeBox.style.display = isTextOnly ? 'none' : '';

    if (isTextOnly) {
        // Ensure standard mode is set when box is hidden
        group.innerHTML = `<label><input type="radio" name="stimulus-mode" value="standard" checked> Text → Text</label>`;
        return;
    }

    const currentMode = document.querySelector('input[name="stimulus-mode"]:checked')?.value;
    group.innerHTML = options.map((o, i) => {
        const checked = currentMode ? o.value === currentMode : i === 0;
        return `<label><input type="radio" name="stimulus-mode" value="${o.value}"${checked ? ' checked' : ''}> ${o.label}</label>`;
    }).join('');

    if (currentMode && !options.find(o => o.value === currentMode)) {
        const first = group.querySelector('input[name="stimulus-mode"]');
        if (first) first.checked = true;
    }
}

// Setup event listeners
function setupEventListeners() {
    const programSelect = document.getElementById('program-select');
    const fieldSizeSlider = document.getElementById('field-size');
    const fieldSizeValue = document.getElementById('field-size-value');
    const maxQuestionsSlider = document.getElementById('max-questions');
    const maxQuestionsValue = document.getElementById('max-questions-value');

    fieldSizeSlider.addEventListener('input', (e) => {
        fieldSizeValue.textContent = e.target.value;
        updateStartButton();
    });

    maxQuestionsSlider.addEventListener('input', (e) => {
        maxQuestionsValue.textContent = e.target.value;
        updateStartButton();
    });
    const startBtn = document.getElementById('start-btn');

    programSelect.addEventListener('change', handleProgramChange);
    startBtn.addEventListener('click', startQuiz);

    // Rebuild stimulus mode options when game type changes
    document.querySelectorAll('input[name="game-type"]').forEach(r =>
        r.addEventListener('change', updateStimulusModeOptions)
    );
    // Populate on initial load
    updateStimulusModeOptions();
}


// Handle pupil selection
function handlePupilSelect(e) {
    const pupilId = e.target.value;

    const pupil = getPupilById(pupilId);
    if (pupil) {
        selectedPupilId = pupil.id;


        // Clear new pupil input
        document.getElementById('new-pupil-name').value = '';
    }

    updateStartButton();
}

// Handle add new pupil
async function handleAddPupil() {
    const input = document.getElementById('new-pupil-name');
    const name = input.value.trim();

    if (name === '') {
        alert('Please enter a pupil name');
        return;
    }

    const newPupil = addPupil(name);

    if (!newPupil) {
        alert('A pupil with this name already exists');
        return;
    }

    // Reload pupils and select the new one
    await loadPupils();
    document.getElementById('pupil-select').value = newPupil.id;
    selectedPupilId = newPupil.id;

    const pupilInfo = document.getElementById('pupil-info');
    if (pupilInfo) {
        document.getElementById('selected-pupil-name').textContent = `${newPupil.name} Pupil Data`;
        pupilInfo.style.display = 'flex';
        requestAnimationFrame(() => pupilInfo.classList.add('show'));
    }

    input.value = '';
    updateStartButton();
}

// View pupil history
function viewPupilHistory() {
    if (!selectedPupilId) return;

    sessionStorage.setItem('viewPupilId', selectedPupilId);
    window.location.href = 'history.html';
}

// Handle program selection change
async function handleProgramChange(e) {
    const programIndex = e.target.value;
    const stimulusGroup = document.getElementById('stimulus-group');
    const stimulusList = document.getElementById('stimulus-list');

    if (programIndex === '') {
        stimulusGroup.style.display = 'none';
        updateStartButton();
        return;
    }

    // Show stimulus selection
    stimulusGroup.style.display = 'block';
    stimulusList.innerHTML = '';

    // Load stimuli for selected program
    const allPrograms = await getAllPrograms();
    const program = allPrograms[programIndex];

    if (!program) return;

    updateStimulusModeOptions();

    program.stimulus.forEach((stim, index) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `stim-${index}`;
        checkbox.value = index;
        checkbox.addEventListener('change', handleStimulusChange);

        const label = document.createElement('label');
        label.htmlFor = `stim-${index}`;
        label.textContent = stim.name;

        div.appendChild(checkbox);
        div.appendChild(label);
        stimulusList.appendChild(div);
    });

    updateStartButton();
}

// Handle stimulus checkbox changes
function handleStimulusChange() {
    const checkboxes = document.querySelectorAll('#stimulus-list input[type="checkbox"]');
    const checked = Array.from(checkboxes).filter(cb => cb.checked);

    if (checked.length > MAX_SELECTED_STIMULI) {
        this.checked = false;
        return;
    }

    // Update counter
    document.getElementById('selected-count').textContent = checked.length;
    updateStartButton();
}

// Update start button state
function updateStartButton() {
    const programSelect = document.getElementById('program-select');
    if (!programSelect) return;   // cats-home.html has no single program-select
    const checkboxes = document.querySelectorAll('#stimulus-list input[type="checkbox"]');
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    const startBtn = document.getElementById('start-btn');

    startBtn.disabled = !selectedPupilId || programSelect.value === '' || checked.length === 0;
}

// Start quiz with selected options
function startQuiz() {
    if (!selectedPupilId) {
        alert('Please select a pupil');
        return;
    }

    const programIndex = document.getElementById('program-select').value;
    const fieldSize = document.getElementById('field-size').value;
    const maxQuestions = document.getElementById('max-questions').value;
    const checkboxes = document.querySelectorAll('#stimulus-list input[type="checkbox"]:checked');
    const selectedStimuli = Array.from(checkboxes).map(cb => parseInt(cb.value));

    // Store quiz configuration in sessionStorage
    const gameType = document.querySelector('input[name="game-type"]:checked')?.value || 'find';
    const stimulusMode = document.querySelector('input[name="stimulus-mode"]:checked')?.value || 'standard';

    const config = {
        pupilId: selectedPupilId,
        programIndex: parseInt(programIndex),
        selectedStimuli,
        fieldSize: fieldSize,
        maxQuestions: maxQuestions,
        gameType,
        stimulusMode,
        homeUrl: 'identify-home.html',
    };

    sessionStorage.removeItem('catsConfig');
    sessionStorage.setItem('quizConfig', JSON.stringify(config));
    window.location.href = 'game.html';
}
