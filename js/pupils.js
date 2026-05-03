// ── Pupil Management helpers ─────────────────────────────────────────────────
// renderPupilGrid() lives in history.js; this file provides addNewPupil()
// and avatar upload utilities used by phonics-setup.js

function addNewPupil() {
    const input = document.getElementById('new-pupil-name');
    const msg = document.getElementById('pupil-msg');
    const name = input?.value.trim();
    if (!name) { if (msg) msg.textContent = 'Enter a name first.'; return; }
    const result = addPupil(name);
    if (!result) { if (msg) msg.textContent = 'That name is already taken.'; return; }
    if (msg) msg.textContent = '';
    input.value = '';
    // Refresh grid if on history page
    if (typeof renderPupilGrid === 'function') renderPupilGrid();
    // Collapse add form
    if (typeof hideAddPupil === 'function') hideAddPupil();
}

window.addNewPupil = addNewPupil;
