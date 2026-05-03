// phSetup.js — phonics home page setup (menu logic for phonics-home.html)

let sessionPupils = []; // Pupils added to this session
let pupilCounter = 0;
let repeatCounts = {}; // Track repeat count per letter: { "sessionId_programType_letter": 1|2|3 }
let fieldSizeCounts = {}; // Track field size per program per pupil: { "sessionId_programType": 2|3|4 }

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateStartButton();
});

function setupEventListeners() {
    document.getElementById('add-pupil-btn')?.addEventListener('click', openPupilSelectModal);
    document.getElementById('close-pupil-modal')?.addEventListener('click', closePupilSelectModal);
    document.getElementById('start-session-btn')?.addEventListener('click', startSession);
    document.querySelectorAll('input[name="program-order"]').forEach(radio => {
        radio.addEventListener('change', handleOrderChange);
    });
}

function handleOrderChange(e) {
    const customOrderDiv = document.getElementById('custom-order');
    if (e.target.value === 'custom') {
        customOrderDiv.classList.remove('hidden');
    } else {
        customOrderDiv.classList.add('hidden');
    }
}

function openPupilSelectModal() {
    const modal = document.getElementById('pupil-select-modal');
    const pupilsList = document.getElementById('available-pupils-list');

    const allPupils = getAllPupils();

    // Filter out pupils already in session
    const sessionPupilIds = sessionPupils.map(p => p.pupilId);
    const availablePupils = allPupils.filter(p => !sessionPupilIds.includes(p.id));

    pupilsList.innerHTML = '';

    // Add new pupil option
    const newPupilDiv = document.createElement('div');
    newPupilDiv.className = 'pupil-option';
    newPupilDiv.style.cssText = 'padding: 15px; margin: 10px 0; border: 2px dashed var(--accent-color); border-radius: 8px; cursor: pointer; text-align: center;';
    newPupilDiv.innerHTML = '<strong>➕ Create New Pupil</strong>';
    newPupilDiv.addEventListener('click', () => {
        const name = prompt('Enter pupil name:');
        if (name && name.trim()) {
            const newPupil = addPupil(name.trim());
            if (newPupil) {
                addPupilToSession(newPupil);
                closePupilSelectModal();
            } else {
                alert('A pupil with this name already exists');
            }
        }
    });
    pupilsList.appendChild(newPupilDiv);

    if (availablePupils.length === 0) {
        const noMoreMsg = document.createElement('p');
        noMoreMsg.style.cssText = 'text-align: center; color: var(--text-muted); margin: 10px 0;';
        noMoreMsg.textContent = 'All existing pupils have been added to the session.';
        pupilsList.appendChild(noMoreMsg);
    } else {
        availablePupils.forEach(pupil => {
            const pupilDiv = document.createElement('div');
            pupilDiv.className = 'pupil-option';
            pupilDiv.style.cssText = 'padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;';
            pupilDiv.innerHTML = `<strong>${pupil.name}</strong>`;
            pupilDiv.addEventListener('click', () => {
                addPupilToSession(pupil);
                closePupilSelectModal();
            });
            pupilsList.appendChild(pupilDiv);
        });
    }

    modal.classList.remove('hidden');
    modal.classList.add('show');
}

function closePupilSelectModal() {
    const modal = document.getElementById('pupil-select-modal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
}

function addPupilToSession(pupil) {
    // Get existing phonics data for this pupil
    const phonicsData = getPupilPhonicsData(pupil.id);

    const sessionPupil = {
        pupilId: pupil.id,
        name: pupil.name,
        photo: phonicsData.photo,
        targets: phonicsData.targets || {
            'grapheme-to-phoneme': [],
            'phoneme-to-grapheme': [],
            'initial-sounds': []
        },
        sessionId: `pupil-${pupilCounter++}`
    };

    sessionPupils.push(sessionPupil);
    renderPupilCard(sessionPupil);
    updateStartButton();
}

function buildPhaseGrid(sessionPupil, programType, prefix) {
    const phases = [1, 2];
    return phases.map(phase => {
        const phaseLetters = window.phonicsData.letters.filter(l => l.phase === phase);
        const groupId = `${sessionPupil.sessionId}-${prefix}-phase${phase}`;
        const checkboxes = phaseLetters.map(letterObj => {
            const letter = letterObj.letter;
            const checked = (sessionPupil.targets[programType] || []).includes(letter) ? 'checked' : '';
            return `
                <div class="letter-checkbox">
                    <input type="checkbox"
                           id="${sessionPupil.sessionId}-${prefix}-${letter}"
                           value="${letter}"
                           ${checked}
                           onchange="updateTargets('${sessionPupil.sessionId}', '${programType}')">
                    <label for="${sessionPupil.sessionId}-${prefix}-${letter}">${letter}</label>
                    <button class="letter-repeat-btn" onclick="event.stopPropagation(); toggleRepeat('${sessionPupil.sessionId}', '${programType}', '${letter}', this)">x1</button>
                </div>`;
        }).join('');
        return `
            <div class="phase-group">
                <div class="phase-group-header" onclick="togglePhaseGroup('${groupId}', this)">
                    <span>Phase ${phase}</span>
                    <span class="phase-arrow">▼</span>
                </div>
                <div class="letter-checkbox-grid" id="${groupId}">
                    ${checkboxes}
                </div>
            </div>`;
    }).join('');
}

function renderPupilCard(sessionPupil) {
    const container = document.getElementById('pupils-container');

    const card = document.createElement('div');
    card.className = 'pupil-card';
    card.id = sessionPupil.sessionId;

    card.innerHTML = `
        <div class="pupil-header">
            <h3>${escapeHTML(sessionPupil.name)}</h3>
            <button class="btn-remove" onclick="removePupilFromSession('${sessionPupil.sessionId}')">
                Remove
            </button>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div>
                <div class="pupil-photo-upload" onclick="document.getElementById('photo-${sessionPupil.sessionId}').click()">
                    ${sessionPupil.photo
                        ? `<img src="${sessionPupil.photo}" alt="${escapeHTML(sessionPupil.name)}">`
                        : '<div class="placeholder">📷</div>'}
                </div>
                <input type="file" id="photo-${sessionPupil.sessionId}" accept="image/*" style="display: none;"
                       onchange="handlePhotoUpload('${sessionPupil.sessionId}', this)">
            </div>

            <div style="flex: 1;">
                <p style="color: var(--text-muted); margin-bottom: 10px;">
                    Select target letters for each program (up to 4 per program):
                </p>
            </div>
        </div>

        <!-- Produce Phoneme -->
        <div class="program-targets">
            <div class="program-targets-header">
                <h4>🔊 Produce Phoneme</h4>
            </div>
            <div id="${sessionPupil.sessionId}-grapheme-to-phoneme">
                ${buildPhaseGrid(sessionPupil, 'grapheme-to-phoneme', 'gp')}
            </div>
        </div>

        <!-- Select Grapheme -->
        <div class="program-targets">
            <div class="program-targets-header">
                <h4>🔤 Select Grapheme</h4>
                <div class="field-size-control">
                    <span class="field-size-label">Field Size:</span>
                    <button class="field-size-btn" id="fs-${sessionPupil.sessionId}-phoneme-to-grapheme"
                            onclick="toggleFieldSize('${sessionPupil.sessionId}', 'phoneme-to-grapheme', this)"><span class="field-size-num">2</span></button>
                </div>
            </div>
            <div id="${sessionPupil.sessionId}-phoneme-to-grapheme">
                ${buildPhaseGrid(sessionPupil, 'phoneme-to-grapheme', 'pg')}
            </div>
        </div>

        <!-- Select Picture -->
        <div class="program-targets">
            <div class="program-targets-header">
                <h4>🖼️ Select Picture</h4>
                <div class="field-size-control">
                    <span class="field-size-label">Field Size:</span>
                    <button class="field-size-btn" id="fs-${sessionPupil.sessionId}-initial-sounds"
                            onclick="toggleFieldSize('${sessionPupil.sessionId}', 'initial-sounds', this)"><span class="field-size-num">2</span></button>
                </div>
            </div>
            <div id="${sessionPupil.sessionId}-initial-sounds">
                ${buildPhaseGrid(sessionPupil, 'initial-sounds', 'is')}
            </div>
        </div>
    `;

    container.appendChild(card);
}

function togglePhaseGroup(groupId, headerEl) {
    const grid = document.getElementById(groupId);
    const arrow = headerEl.querySelector('.phase-arrow');
    const isOpen = grid.style.display !== 'none';
    grid.style.display = isOpen ? 'none' : '';
    arrow.textContent = isOpen ? '▶' : '▼';
}

function toggleFieldSize(sessionId, programType, btn) {
    const key = `${sessionId}_${programType}`;
    const current = fieldSizeCounts[key] || 2;
    const numSpan = btn.querySelector('.field-size-num');
    let next;
    if (current === 2) {
        next = 3;
        if (numSpan) numSpan.textContent = '3';
        btn.classList.remove('size4');
        btn.classList.add('size3');
    } else if (current === 3) {
        next = 4;
        if (numSpan) numSpan.textContent = '4';
        btn.classList.remove('size3');
        btn.classList.add('size4');
    } else {
        next = 2;
        if (numSpan) numSpan.textContent = '2';
        btn.classList.remove('size3', 'size4');
    }
    fieldSizeCounts[key] = next;
}

function updateTargets(sessionId, programType) {
    const sessionPupil = sessionPupils.find(p => p.sessionId === sessionId);
    if (!sessionPupil) return;

    const container = document.getElementById(`${sessionId}-${programType}`);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');

    // Limit to 4 targets
    if (checkboxes.length > 4) {
        // Uncheck the last one
        checkboxes[checkboxes.length - 1].checked = false;
        alert('Maximum 4 targets per program');
        return;
    }

    // Update targets array
    sessionPupil.targets[programType] = Array.from(checkboxes).map(cb => cb.value);

    updateStartButton();
}

function handlePhotoUpload(sessionId, input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const sessionPupil = sessionPupils.find(p => p.sessionId === sessionId);
        if (sessionPupil) {
            sessionPupil.photo = e.target.result;

            // Update the display
            const photoDiv = input.previousElementSibling;
            photoDiv.innerHTML = `<img src="${e.target.result}" alt="${sessionPupil.name}">`;
        }
    };
    reader.readAsDataURL(file);
}

function removePupilFromSession(sessionId) {
    if (!confirm('Remove this pupil from the session?')) return;

    sessionPupils = sessionPupils.filter(p => p.sessionId !== sessionId);
    document.getElementById(sessionId)?.remove();
    updateStartButton();
}

function updateStartButton() {
    const startBtn = document.getElementById('start-session-btn');

    // Check if at least one pupil has targets set
    const hasValidPupils = sessionPupils.length > 0 && sessionPupils.some(pupil => {
        return Object.values(pupil.targets).some(targets => targets.length > 0);
    });

    startBtn.disabled = !hasValidPupils;
}

function toggleRepeat(sessionId, programType, letter, btn) {
    const key = `${sessionId}_${programType}_${letter}`;
    const current = repeatCounts[key] || 1;

    btn.classList.remove('x2', 'x3');

    if (current === 1) {
        repeatCounts[key] = 2;
        btn.textContent = 'x2';
        btn.classList.add('x2');
    } else if (current === 2) {
        repeatCounts[key] = 3;
        btn.textContent = 'x3';
        btn.classList.add('x3');
    } else {
        repeatCounts[key] = 1;
        btn.textContent = 'x1';
    }
}

function startSession() {
    // Validate all pupils have at least one target in at least one program
    const invalidPupils = sessionPupils.filter(pupil => {
        return Object.values(pupil.targets).every(targets => targets.length === 0);
    });

    if (invalidPupils.length > 0) {
        alert(`Please set targets for: ${invalidPupils.map(p => p.name).join(', ')}`);
        return;
    }

    // Save phonics data for each pupil
    sessionPupils.forEach(pupil => {
        updatePupilPhonicsData(pupil.pupilId, {
            photo: pupil.photo,
            targets: pupil.targets
        });
    });

    // Determine program order
    const orderType = document.querySelector('input[name="program-order"]:checked').value;
    let programOrder;

    if (orderType === 'random') {
        programOrder = shuffleArray(['grapheme-to-phoneme', 'phoneme-to-grapheme', 'initial-sounds']);
    } else {
        programOrder = [
            document.getElementById('order-1').value,
            document.getElementById('order-2').value,
            document.getElementById('order-3').value
        ];
    }
    const phaseDisplay = document.querySelector('input[name="phase-display"]:checked')?.value || 'all';

    // Create session config - apply per-letter repeat counts to targets
    const config = {
        pupils: sessionPupils.map(p => {
            const expandedTargets = {};
            const fieldSizePerProgram = {};
            for (const programType in p.targets) {
                const expanded = [];
                p.targets[programType].forEach(letter => {
                    const repeat = repeatCounts[`${p.sessionId}_${programType}_${letter}`] || 1;
                    for (let i = 0; i < repeat; i++) {
                        expanded.push(letter);
                    }
                });
                expandedTargets[programType] = expanded;
                fieldSizePerProgram[programType] = fieldSizeCounts[`${p.sessionId}_${programType}`] || 2;
            }
            return {
                pupilId: p.pupilId,
                name: p.name,
                photo: p.photo,
                targets: expandedTargets,
                fieldSize: fieldSizePerProgram
            };
        }),
        programOrder: programOrder,
        startTime: new Date().toISOString(),
        phaseDisplay: phaseDisplay,
    };

    // Save config and navigate to game
    savePhonicsConfig(config);

    window.location.href = 'phonics-game.html';
}


// Make functions globally available for inline event handlers
window.removePupilFromSession = removePupilFromSession;
window.updateTargets = updateTargets;
window.handlePhotoUpload = handlePhotoUpload;
window.toggleRepeat = toggleRepeat;
window.togglePhaseGroup = togglePhaseGroup;
window.toggleFieldSize = toggleFieldSize;
