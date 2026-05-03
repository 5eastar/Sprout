const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="m17.71 7.29-3-3a.996.996 0 0 0-1.41 0l-11.01 11A1 1 0 0 0 2 16v3c0 .55.45 1 1 1h3c.27 0 .52-.11.71-.29l11-11a.996.996 0 0 0 0-1.41ZM5.59 18H4v-1.59l7.5-7.5 1.59 1.59zm8.91-8.91L12.91 7.5 14 6.41 15.59 8zM11 18h11v2H11z"></path></svg>`;

let currentPupilId = null;
let editModeActive = false;

document.addEventListener('DOMContentLoaded', () => {
    sessionStorage.removeItem('viewPupilId');
    renderPupilGrid();
});

// ========== PUPIL GRID ==========

function renderPupilGrid() {
    const grid = document.getElementById('pupil-select-grid');
    if (!grid) return;
    const pupils = getAllPupils();

    if (pupils.length === 0) {
        grid.innerHTML = '<p class="empty-state">No pupils yet. Click "+ Add Pupil" to get started.</p>';
        return;
    }

    grid.innerHTML = pupils.map(pupil => {
        const photo = getPupilPhonicsData(pupil.id)?.photo;
        const totalSessions = getPupilHistory(pupil.id).length + getPupilPhonicsHistory(pupil.id).length;

        const photoHTML = photo
            ? `<img src="${photo}" alt="${pupil.name}" class="pupil-card-photo">`
            : `<div class="pupil-card-initials">${pupil.name[0].toUpperCase()}</div>`;

        return `
            <div class="pupil-select-card" onclick="openPupilModal('${pupil.id}')">
                ${photoHTML}
                <div class="pupil-card-name">${pupil.name}</div>
                <div class="pupil-card-sessions">${totalSessions} session${totalSessions !== 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');
}

// ========== ADD PUPIL INLINE ==========

function showAddPupil() {
    document.getElementById('add-pupil-row').classList.remove('hidden');
    document.getElementById('new-pupil-name').focus();
    document.getElementById('show-add-pupil-btn').style.display = 'none';
}

function hideAddPupil() {
    document.getElementById('add-pupil-row').classList.add('hidden');
    document.getElementById('show-add-pupil-btn').style.display = '';
    document.getElementById('new-pupil-name').value = '';
    document.getElementById('pupil-msg').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('show-add-pupil-btn')?.addEventListener('click', showAddPupil);
});

// ========== MODAL OPEN/CLOSE ==========

async function openPupilModal(pupilId) {
    const pupil = getPupilById(pupilId);
    if (!pupil) return;
    currentPupilId = pupilId;
    editModeActive = false;

    const modal = document.getElementById('pupil-modal');
    const photo = getPupilPhonicsData(pupilId)?.photo;

    // Header
    document.getElementById('modal-pupil-name').textContent = pupil.name;
    document.getElementById('modal-rename-input').value = pupil.name;

    const photoEl = document.getElementById('modal-pupil-photo');
    const initialsEl = document.getElementById('modal-pupil-initials');
    if (photo) {
        photoEl.src = photo;
        photoEl.style.display = '';
        initialsEl.style.display = 'none';
    } else {
        photoEl.style.display = 'none';
        initialsEl.textContent = pupil.name[0].toUpperCase();
        initialsEl.style.display = '';
    }

    // Reset edit mode
    document.getElementById('modal-edit-panel').classList.add('hidden');
    document.getElementById('modal-edit-btn').innerHTML = EDIT_ICON;

    // Load content
    await loadModalContent(pupil);

    modal.classList.remove('hidden');
    modal.classList.add('show');
}

function closePupilModal() {
    const modal = document.getElementById('pupil-modal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
    currentPupilId = null;
    editModeActive = false;
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pupil-modal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('pupil-modal')) closePupilModal();
    });
});

// ========== EDIT MODE ==========

function toggleEditMode() {
    editModeActive = !editModeActive;
    document.getElementById('modal-edit-panel').classList.toggle('hidden', !editModeActive);
    document.getElementById('modal-edit-btn').innerHTML = editModeActive ? '✕' : EDIT_ICON;
}

function saveRename() {
    if (!currentPupilId) return;
    const input = document.getElementById('modal-rename-input');
    const newName = input.value.trim();
    if (!newName) return;
    const ok = renamePupil(currentPupilId, newName);
    if (!ok) { alert('That name is already taken.'); return; }
    document.getElementById('modal-pupil-name').textContent = newName;
    renderPupilGrid();
}

function triggerPhotoUpload() {
    document.getElementById('modal-photo-input').click();
}

function handleModalPhoto(input) {
    const file = input.files[0];
    if (!file || !currentPupilId) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 200; canvas.height = 200;
            const ctx = canvas.getContext('2d');
            const size = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 200, 200);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            updatePupilPhonicsData(currentPupilId, { photo: base64 });
            const photoEl = document.getElementById('modal-pupil-photo');
            photoEl.src = base64;
            photoEl.style.display = '';
            document.getElementById('modal-pupil-initials').style.display = 'none';
            renderPupilGrid();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function confirmDeletePupil() {
    if (!currentPupilId) return;
    const pupil = getPupilById(currentPupilId);
    if (confirm(`Delete ${pupil?.name} and all their data? This cannot be undone.`)) {
        deletePupil(currentPupilId);
        closePupilModal();
        renderPupilGrid();
    }
}

// ========== MODAL CONTENT ==========

async function loadModalContent(pupil) {
    const identifyHistory = getPupilHistory(pupil.id);
    const phonicsHistory = getPupilPhonicsHistory(pupil.id);
    const matchHistory = getPupilMatchHistory(pupil.id);

    const identifyQuestions = identifyHistory.reduce((sum, q) => sum + q.summary.totalQuestions, 0);
    const identifyCorrect = identifyHistory.reduce((sum, q) => sum + q.summary.correct, 0);
    const { questions: phonicsQuestions, correct: phonicsCorrect } = getPupilPhonicsStats(pupil.id, phonicsHistory);

    const totalQuestions = identifyQuestions + phonicsQuestions;
    const totalCorrect = identifyCorrect + phonicsCorrect;
    const overallAccuracy = calculateAccuracy(totalCorrect, totalQuestions);
    const totalSessions = identifyHistory.length + phonicsHistory.length;

    const statsEl = document.getElementById('modal-stats');
    const actionsEl = document.getElementById('modal-actions');

    if (totalQuestions === 0) {
        statsEl.innerHTML = '<p class="empty-state" style="margin:16px 0;">No session data yet.</p>';
        document.getElementById('modal-history-list').innerHTML = '';
        actionsEl.style.display = 'none';
        return;
    }

    statsEl.innerHTML = `
        <div class="modal-stats-grid">
            <div class="modal-stat-item">
                <div class="modal-stat-value">${totalSessions}</div>
                <div class="modal-stat-label">Sessions</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-value">${totalCorrect}/${totalQuestions}</div>
                <div class="modal-stat-label">Correct</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-value">${overallAccuracy}%</div>
                <div class="modal-stat-label">Accuracy</div>
            </div>
        </div>
    `;

    // Build history list
    const allPrograms = await getAllPrograms();
    const allItems = [];

    identifyHistory.forEach(quiz => {
        const gt = quiz.config?.gameType || 'find';
        const isCats = ['sort', 'label', 'compare'].includes(gt);
        const progName = isCats
            ? ((window.GAME_TYPE_LABELS || {})[gt] || gt)
            : (allPrograms[quiz.config?.programIndex]?.name || 'Unknown Program');
        allItems.push({ type: gt, date: new Date(quiz.date), data: quiz, programName: progName });
    });

    matchHistory.forEach(quiz => {
        allItems.push({
            type: 'match', date: new Date(quiz.date), data: quiz,
            programName: allPrograms[quiz.config?.programIndex]?.name || 'Unknown Program'
        });
    });

    phonicsHistory.forEach(session => {
        const pupilData = session.pupils.find(p => p.pupilId === pupil.id);
        allItems.push({ type: 'phonics', date: new Date(session.date), data: session, pupilData });
    });

    allItems.sort((a, b) => b.date - a.date);

    let historyHTML = '';
    const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17 6V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H2v2h2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8h2V6zM9 4h6v2H9zM6 20V8h12v12z"></path><path d="M9 10h2v8H9zm4 0h2v8h-2z"></path></svg>`;

    allItems.forEach((item, index) => {
        if (item.type !== 'phonics') {
            const quiz = item.data;
            const isCats = ['sort', 'label', 'compare'].includes(item.type);
            const label = isCats ? 'Categories' : ((window.GAME_TYPE_LABELS || {})[item.type] || 'Identify');
            const cssType = isCats ? 'cats' : item.type;
            historyHTML += `
                <div class="history-item ${cssType}-item">
                    <button class="session-trash-btn" onclick="confirmDeleteSession('${quiz.id}')" title="Delete data">${trashIcon}</button>
                    <div class="history-type-badge ${cssType}">${label}</div>
                    <h3>Session ${allItems.length - index} — ${formatDate(quiz.date)}</h3>
                    <p><strong>Program:</strong> ${item.programName}</p>
                    <p><strong>Score:</strong> ${quiz.summary.correct}/${quiz.summary.totalQuestions} (${quiz.summary.accuracy}%)</p>
                    <p><strong>Duration:</strong> ${formatTime(quiz.totalTime)}</p>
                    <button class="btn-primary" onclick="viewQuizDetails('${quiz.id}')">View Data</button>
                </div>
            `;
        } else {
            const session = item.data;
            const pd = item.pupilData;
            const pupilResults = pd?.results || [];
            const pupilCorrect = countCorrect(pupilResults);
            const pupilTotal = pupilResults.length;
            const pupilAccuracy = calculateAccuracy(pupilCorrect, pupilTotal);
            historyHTML += `
                <div class="history-item phonics-item">
                    <button class="session-trash-btn" onclick="confirmDeletePhonicsSession('${session.id}', '${pupil.id}')" title="Delete data">${trashIcon}</button>
                    <div class="history-type-badge phonics">Phonics</div>
                    <h3>Session ${allItems.length - index} — ${formatDate(session.date)}</h3>
                    <p><strong>Your Score:</strong> ${pupilCorrect}/${pupilTotal} (${pupilAccuracy}%)</p>
                    <p><strong>Session Total:</strong> ${session.summary.correct}/${session.summary.totalQuestions}</p>
                    <div class="button-group" style="padding:8px 0 0;">
                        <button class="btn-secondary" onclick="viewPhonicsDetails('${session.id}', '${pupil.id}')">Pupil Data</button>
                        <button class="btn-secondary" onclick="viewPhonicsSession('${session.id}')">Session Data</button>
                    </div>
                </div>
            `;
        }
    });

    document.getElementById('modal-history-list').innerHTML = historyHTML;

    actionsEl.style.display = '';
    document.getElementById('modal-export-btn').onclick = () => exportAllToCSV(pupil);
}

// ========== NAVIGATION ==========

function navigateToResults(data) {
    sessionStorage.setItem('quizResults', JSON.stringify(data));
    sessionStorage.removeItem('quizResultsSaved');
    window.location.href = 'results.html';
}

function viewQuizDetails(quizId) {
    const quiz = getQuizHistory().find(q => q.id === quizId);
    if (quiz) navigateToResults({ results: quiz.results, totalTime: quiz.totalTime, type: 'identify', quizId: quiz.id });
}

function viewPhonicsDetails(sessionId, pupilId) {
    const session = getPhonicsHistory().find(s => s.id === sessionId);
    if (session) {
        const pupilData = session.pupils.find(p => p.pupilId === pupilId);
        if (pupilData) navigateToResults({ results: pupilData.results, totalTime: session.totalTime, type: 'phonics', pupils: [pupilData], sessionId: session.id });
    }
}

function viewPhonicsSession(sessionId) {
    const session = getPhonicsHistory().find(s => s.id === sessionId);
    if (session) {
        navigateToResults({
            results: session.pupils.flatMap(p => p.results || []),
            totalTime: session.totalTime,
            type: 'phonics',
            pupils: session.pupils,
            programOrder: session.programOrder,
            sessionId: session.id
        });
    }
}

// ========== EXPORT ==========

async function exportAllToCSV(pupil) {
    const identifyHistory = getPupilHistory(pupil.id);
    const phonicsHistory = getPupilPhonicsHistory(pupil.id);
    const matchHistory = getPupilMatchHistory(pupil.id);
    const allPrograms = await getAllPrograms();

    if (identifyHistory.length === 0 && phonicsHistory.length === 0 && matchHistory.length === 0) {
        alert('No quiz history to export.');
        return;
    }

    const identifyQuestions = identifyHistory.reduce((sum, q) => sum + q.summary.totalQuestions, 0);
    const identifyCorrect = identifyHistory.reduce((sum, q) => sum + q.summary.correct, 0);
    const { questions: phonicsQuestions, correct: phonicsCorrect } = getPupilPhonicsStats(pupil.id, phonicsHistory);
    const totalQuestions = identifyQuestions + phonicsQuestions;
    const totalCorrect = identifyCorrect + phonicsCorrect;
    const overallAccuracy = calculateAccuracy(totalCorrect, totalQuestions);

    let csv = `Quiz Results Export - ${pupil.name}\nExport Date: ${new Date().toLocaleString()}\n\n`;
    csv += `OVERALL SUMMARY\nTotal Sessions,${identifyHistory.length + phonicsHistory.length}\n`;
    csv += `Identify Quizzes,${identifyHistory.length}\nPhonics Sessions,${phonicsHistory.length}\n`;
    csv += `Total Questions,${totalQuestions}\nTotal Correct,${totalCorrect}\nOverall Accuracy,${overallAccuracy}%\n\n`;

    if (identifyHistory.length > 0) {
        csv += `${'='.repeat(50)}\nIDENTIFY QUIZZES\n${'='.repeat(50)}\n\n`;
        identifyHistory.forEach((quiz, i) => {
            const programName = allPrograms[quiz.config?.programIndex]?.name || 'Unknown Program';
            csv += `Quiz ${i + 1} - ${new Date(quiz.date).toLocaleString()}\n`;
            csv += `Program,${programName}\nScore,${quiz.summary.correct}/${quiz.summary.totalQuestions}\n`;
            csv += `Accuracy,${quiz.summary.accuracy}%\nDuration,${formatTime(quiz.totalTime)}\n\n`;
            csv += 'Question,Target,Score,Response Time (s)\n';
            quiz.results.forEach(r => {
                const score = r.result === 'plus' ? '+' : r.result === 'neutral' ? 'o' : '-';
                csv += `${r.questionNumber},"${r.target}",${score},${r.responseTime ? r.responseTime.toFixed(2) : 'N/A'}\n`;
            });
            csv += '\n';
        });
    }

    if (phonicsHistory.length > 0) {
        csv += `${'='.repeat(50)}\nPHONICS SESSIONS\n${'='.repeat(50)}\n\n`;
        phonicsHistory.forEach((session, i) => {
            const pupilData = session.pupils.find(p => p.pupilId === pupil.id);
            const results = pupilData?.results || [];
            const correct = countCorrect(results);
            csv += `Session ${i + 1} - ${new Date(session.date).toLocaleString()}\n`;
            csv += `Your Score,${correct}/${results.length}\nSession Total,${session.summary.correct}/${session.summary.totalQuestions}\n\n`;
            if (results.length > 0) {
                csv += 'Question,Program,Target,Score,Response Time (s)\n';
                results.forEach((r, idx) => {
                    const score = r.result === 'plus' ? '+' : r.result === 'neutral' ? 'o' : '-';
                    csv += `${idx + 1},"${r.programType || '-'}","${r.target}",${score},${r.responseTime ? r.responseTime.toFixed(2) : 'N/A'}\n`;
                });
            }
            csv += '\n';
        });
    }

    downloadCSV(csv, `${pupil.name}_all_results`);
}

// ========== SESSION DELETION ==========

function confirmDeleteSession(quizId) {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    deleteQuizSession(quizId);
    loadModalContent(getPupilById(currentPupilId));
}

function confirmDeletePhonicsSession(sessionId, pupilId) {
    if (!confirm('Remove this pupil\'s data from this phonics session?\n\nOther pupils in the session will be unaffected.')) return;
    removePupilFromPhonicsSession(sessionId, pupilId);
    loadModalContent(getPupilById(currentPupilId));
}

function confirmDeleteEntirePhonicsSession(sessionId) {
    if (!confirm('Delete the ENTIRE phonics session for ALL pupils?\n\nThis cannot be undone.')) return;
    deletePhonicsSession(sessionId);
    loadModalContent(getPupilById(currentPupilId));
}

function confirmDeleteAllSessions() {
    if (!currentPupilId) return;
    const pupil = getPupilById(currentPupilId);
    if (!confirm(`Delete ALL quiz sessions for ${pupil?.name}?\n\nPhonics group sessions will NOT be deleted.\n\nThis cannot be undone.`)) return;
    deleteAllPupilQuizSessions(currentPupilId);
    loadModalContent(pupil);
}

// expose for global onclick handlers
window.openPupilModal = openPupilModal;
window.closePupilModal = closePupilModal;
window.toggleEditMode = toggleEditMode;
window.saveRename = saveRename;
window.triggerPhotoUpload = triggerPhotoUpload;
window.handleModalPhoto = handleModalPhoto;
window.confirmDeletePupil = confirmDeletePupil;
window.viewQuizDetails = viewQuizDetails;
window.viewPhonicsDetails = viewPhonicsDetails;
window.viewPhonicsSession = viewPhonicsSession;
window.hideAddPupil = hideAddPupil;
window.confirmDeleteSession = confirmDeleteSession;
window.confirmDeletePhonicsSession = confirmDeletePhonicsSession;
window.confirmDeleteEntirePhonicsSession = confirmDeleteEntirePhonicsSession;
window.confirmDeleteAllSessions = confirmDeleteAllSessions;
