const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="m17.71 7.29-3-3a.996.996 0 0 0-1.41 0l-11.01 11A1 1 0 0 0 2 16v3c0 .55.45 1 1 1h3c.27 0 .52-.11.71-.29l11-11a.996.996 0 0 0 0-1.41ZM5.59 18H4v-1.59l7.5-7.5 1.59 1.59zm8.91-8.91L12.91 7.5 14 6.41 15.59 8zM11 18h11v2H11z"></path></svg>`;
const TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17 6V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H2v2h2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8h2V6zM9 4h6v2H9zM6 20V8h12v12z"></path><path d="M9 10h2v8H9zm4 0h2v8h-2z"></path></svg>`;

// Module-level state so edit/delete handlers can mutate and re-render
let currentResultsData = null;
let isPhonics = false;
let editModeActive = false;

// ========== EDIT / DELETE HANDLERS ==========

function getStorageRef() {
    return {
        quizId: currentResultsData.quizId || sessionStorage.getItem('quizResultId') || null,
        sessionId: currentResultsData.sessionId || null
    };
}

function toggleEditMode() {
    editModeActive = !editModeActive;
    applyEditModeState();
}

function applyEditModeState() {
    const section = document.getElementById('question-results');
    if (section) section.classList.toggle('edit-mode-active', editModeActive);
    const btn = document.getElementById('edit-mode-toggle');
    if (btn) btn.innerHTML = editModeActive ? '🔒' : `${EDIT_ICON}`;
    const hint = document.getElementById('edit-mode-hint');
    if (hint) hint.style.display = editModeActive ? '' : 'none';
}

function cycleScore(idx, pupilIdx) {
    if (!editModeActive) return;
    const cycle = { plus: 'minus', minus: 'neutral', neutral: 'plus' };
    if (pupilIdx === null) {
        currentResultsData.results[idx].result = cycle[currentResultsData.results[idx].result] || 'minus';
    } else {
        const r = currentResultsData.pupils[pupilIdx].results[idx];
        r.result = cycle[r.result] || 'minus';
        currentResultsData.results = currentResultsData.pupils.flatMap(p => p.results || []);
    }
    persistResultsEdit();
    rerenderResults();
}

function deleteResultRow(idx, pupilIdx) {
    if (pupilIdx === null) {
        currentResultsData.results.splice(idx, 1);
    } else {
        currentResultsData.pupils[pupilIdx].results.splice(idx, 1);
        currentResultsData.results = currentResultsData.pupils.flatMap(p => p.results || []);
    }
    persistResultsEdit();
    rerenderResults();
}

function persistResultsEdit() {
    sessionStorage.setItem('quizResults', JSON.stringify(currentResultsData));
    const ref = getStorageRef();
    if (ref.quizId && typeof updateQuizResult === 'function') {
        updateQuizResult(ref.quizId, currentResultsData.results);
    }
    if (ref.sessionId && typeof updatePhonicsSessionResults === 'function') {
        updatePhonicsSessionResults(ref.sessionId, currentResultsData.pupils);
    }
}

function rerenderResults() {
    if (isPhonics && currentResultsData.pupils?.length > 0) {
        displayPhonicsResults(currentResultsData);
    } else {
        displaySummary(currentResultsData.results, currentResultsData.totalTime);
        displayQuestionResults(currentResultsData.results);
    }
    applyEditModeState();
}

// ========== LOAD AND DISPLAY ==========

// Load and display results
document.addEventListener('DOMContentLoaded', () => {
    const resultsData = JSON.parse(sessionStorage.getItem('quizResults'));
    const config = JSON.parse(sessionStorage.getItem('quizConfig') || sessionStorage.getItem('catsConfig'));

    // Determine quiz type - prioritize quizConfig (identify) over phonicsConfig
    isPhonics = resultsData?.type === 'phonics' || (!config && sessionStorage.getItem('phonicsConfig'));
    currentResultsData = resultsData;

    if (!resultsData || !resultsData.results || resultsData.results.length === 0) {
        document.querySelector('.results-container').innerHTML = `
            <h1>No Results Available</h1>
            <button class="btn-primary" onclick="window.location.href='${isPhonics ? 'phonics-home.html' : 'identify-home.html'}'">
                Back to Menu
            </button>
        `;
        return;
    }

    const alreadySaved = sessionStorage.getItem('quizResultsSaved') === 'true';

    if (!alreadySaved && config && config.pupilId && typeof saveQuizResult === 'function' && !isPhonics) {
        try {
            const savedId = saveQuizResult(config.pupilId, resultsData, config);
            sessionStorage.setItem('quizResultId', savedId);
            sessionStorage.setItem('quizResultsSaved', 'true');
        } catch (error) {
            console.error('Error saving quiz result:', error);
        }
    }

    // Display results based on quiz type
    if (isPhonics && resultsData.pupils && resultsData.pupils.length > 0) {
        displayPhonicsResults(resultsData);
    } else {
        displaySummary(resultsData.results, resultsData.totalTime);
        displayQuestionResults(resultsData.results);
    }
    applyEditModeState();

    document.getElementById('question-results').addEventListener('click', (e) => {
        if (e.target.closest('#edit-mode-toggle')) { toggleEditMode(); return; }
        const scoreEl = e.target.closest('.editable-score');
        if (scoreEl) {
            const rowIdx = parseInt(scoreEl.dataset.rowIdx, 10);
            const pupilIdx = scoreEl.dataset.pupilIdx !== undefined ? parseInt(scoreEl.dataset.pupilIdx, 10) : null;
            cycleScore(rowIdx, pupilIdx);
            return;
        }
        const deleteEl = e.target.closest('.result-delete-btn');
        if (deleteEl) {
            const rowIdx = parseInt(deleteEl.dataset.rowIdx, 10);
            const pupilIdx = deleteEl.dataset.pupilIdx !== undefined ? parseInt(deleteEl.dataset.pupilIdx, 10) : null;
            deleteResultRow(rowIdx, pupilIdx);
        }
    });

    // Setup buttons
    document.getElementById('export-btn').addEventListener('click', () => {
        if (isPhonics && resultsData.pupils) {
            exportPhonicsToCSV(resultsData);
        } else {
            exportToCSV(resultsData);
        }
    });

    // New Quiz button - navigate to correct home page
    document.getElementById('new-quiz-btn')?.addEventListener('click', () => {
        if (isPhonics) { window.location.href = 'phonics-home.html'; return; }
        window.location.href = config?.homeUrl || 'identify-home.html';
    });

    // Restart button - navigate to correct game page
    document.getElementById('restart-btn').addEventListener('click', () => {
        window.location.href = isPhonics ? 'phonics-game.html' : 'game.html';
    });
});

// Display phonics results with per-pupil breakdown
function displayPhonicsResults(resultsData) {
    const summaryEl = document.getElementById('summary');
    const questionResultsEl = document.getElementById('question-results');

    // Overall summary
    const allResults = resultsData.results;
    const totalQuestions = countScored(allResults);
    const plusCount = countCorrect(allResults);
    const accuracy = calculateAccuracy(plusCount, totalQuestions);
    const formattedTotalTime = formatTime(resultsData.totalTime);

    summaryEl.innerHTML = `
        <h2>Session Summary</h2>
        <div class="summary-wrapper">
            <div class="summary-stats">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-value">${plusCount}/${totalQuestions}</div>
                        <div class="summary-label">Correct</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${accuracy}%</div>
                        <div class="summary-label">Accuracy</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${resultsData.pupils.length}</div>
                        <div class="summary-label">Pupils</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${formattedTotalTime}</div>
                        <div class="summary-label">Total Time</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const programTypes = resultsData.programOrder || ['grapheme-to-phoneme', 'phoneme-to-grapheme', 'initial-sounds'];

    // ── Results by Pupil ──────────────────────────────────────────────
    // Each pupil gets a heading + table of all their trials (# | Program | Target | Score | Time)
    let pupilsHTML = `
        <div class="section-header-row">
            <h2>Results by Pupil</h2>
            <button class="btn-icon" id="edit-mode-toggle">${EDIT_ICON} Edit Data</button>
        </div>
        <div id="edit-mode-hint" class="edit-hint" style="display:none;">Tap a score to change it &bull; tap ${TRASH_ICON} to delete a row</div>
    `;
    let hasAnyResults = false;

    resultsData.pupils.forEach((pupil, pupilIdx) => {
        const pupilResults = pupil.results || [];
        if (pupilResults.length === 0) return;
        hasAnyResults = true;

        const pc = countCorrect(pupilResults);
        const ps = countScored(pupilResults);
        const pa = calculateAccuracy(pc, ps);
        const validTimes = pupilResults.filter(r => r.responseTime > 0);
        const avgTime = validTimes.length > 0
            ? (validTimes.reduce((s, r) => s + r.responseTime, 0) / validTimes.length).toFixed(2)
            : null;

        pupilsHTML += `
            <div class="pupil-results-card">
                <h3 class="pupil-card-heading">${escapeHTML(pupil.name)}</h3>
                <div class="" style="padding:10px 14px; border-radius:12px; margin-bottom:10px;">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-value">${pc}/${ps}</div>
                            <div class="summary-label">Total</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${pa}%</div>
                            <div class="summary-label">Accuracy</div>
                        </div>
                        ${avgTime !== null ? `
                        <div class="summary-item">
                            <div class="summary-value">${avgTime}s</div>
                            <div class="summary-label">Avg Response</div>
                        </div>` : ''}
                    </div>
                </div>
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr><th>Program</th><th>Target</th><th>Score</th><th>Time</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${pupilResults.map((r, rIdx) => {
                                const score = getScoreDisplay(r.result);
                                const time = r.responseTime ? r.responseTime.toFixed(2) + 's' : 'N/A';
                                const prog = PROGRAM_LABELS[r.programType] || r.programType || '-';
                                return `<tr>
                                    <td>${prog}</td>
                                    <td>${escapeHTML(r.target)}</td>
                                    <td><span class="score-badge ${score.class} editable-score" data-row-idx="${rIdx}" data-pupil-idx="${pupilIdx}" title="Click to change score">${score.symbol}</span></td>
                                    <td>${time}</td>
                                    <td><button class="result-delete-btn" data-row-idx="${rIdx}" data-pupil-idx="${pupilIdx}" title="Delete row">${TRASH_ICON}</button></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    // ── Session Data – one bubble per program type ────────────────────
    pupilsHTML += '<h2 style="margin-top:30px;">Session Data</h2>';
    pupilsHTML += '<div class="program-bubbles-grid">';

    programTypes.forEach(programType => {
        const programResults = allResults.filter(r => r.programType === programType);
        if (programResults.length === 0) return;
        hasAnyResults = true;

        const progCorrect = countCorrect(programResults);
        const progTotal = countScored(programResults);
        const progAccuracy = calculateAccuracy(progCorrect, progTotal);
        const validTimes = programResults.filter(r => r.responseTime > 0);
        const avgTime = validTimes.length > 0
            ? (validTimes.reduce((s, r) => s + r.responseTime, 0) / validTimes.length).toFixed(1)
            : '-';

        // Per-pupil breakdown within this program (only meaningful with multiple pupils)
        const pupilRows = resultsData.pupils.length > 1
            ? resultsData.pupils.map(pupil => {
                const pr = (pupil.results || []).filter(r => r.programType === programType);
                if (pr.length === 0) return '';
                const pc = countCorrect(pr);
                const ps = countScored(pr);
                const pa = calculateAccuracy(pc, ps);
                return `<div class="prog-bubble-pupil-row">
                    <span class="prog-bubble-pupil-name">${escapeHTML(pupil.name)}</span>
                    <span class="prog-bubble-score">${pc}/${ps}</span>
                    <span class="prog-bubble-acc">${pa}%</span>
                </div>`;
            }).join('')
            : '';

        pupilsHTML += `
            <div class="program-bubble">
                <div class="program-bubble-header">${PROGRAM_LABELS[programType] || programType}</div>
                <div class="prog-bubble-pupils">${pupilRows}</div>
                <div class="prog-bubble-divider"></div>
                <div class="prog-bubble-totals">
                    <div class="prog-bubble-total-row">
                        <span class="prog-bubble-total-label">Total</span>
                        <span class="prog-bubble-score">${progCorrect}/${progTotal}</span>
                        <span class="prog-bubble-acc">${progAccuracy}%</span>
                    </div>
                    <div class="prog-bubble-avg">Avg time: ${avgTime}s</div>
                </div>
            </div>
        `;
    });

    pupilsHTML += '</div>'; // close program-bubbles-grid

    if (hasAnyResults) {
        questionResultsEl.className = 'section';
        questionResultsEl.innerHTML = pupilsHTML;
    }
}


// Shared row builder for results tables
function makeScoreRow(...cells) {
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
}

function makeScoreBadge(result) {
    const score = getScoreDisplay(result);
    return `<span class="score-badge ${score.class}">${score.symbol}</span>`;
}

function formatResponseTime(responseTime) {
    return responseTime ? responseTime.toFixed(2) + 's' : 'N/A';
}

function generateProgramResultsTable(results) {
    if (!results || results.length === 0) return '';

    const rows = results.map((r, i) => makeScoreRow(
        i + 1, r.target, makeScoreBadge(r.result), formatResponseTime(r.responseTime)
    )).join('');

    return `<div class="results-table-wrapper"><table class="results-table">
        <thead><tr><th>#</th><th>Target</th><th>Score</th><th>Time</th></tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;
}

function generateSessionDataTable(resultsData) {
    const allResults = resultsData.results || [];
    if (allResults.length === 0) return '<p>No results available</p>';

    const rows = allResults.map((r, i) => makeScoreRow(
        i + 1,
        r.pupilName,
        PROGRAM_LABELS[r.programType] || r.programType || '-',
        r.target,
        makeScoreBadge(r.result),
        formatResponseTime(r.responseTime)
    )).join('');

    return `<div class="results-table-wrapper"><table class="results-table">
        <thead><tr><th>#</th><th>Pupil</th><th>Program</th><th>Target</th><th>Score</th><th>Time</th></tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;
}

// Display summary statistics (for identify game)
function displaySummary(results, totalTime) {
    const totalQuestions = countScored(results);
    const plusCount = countCorrect(results);
    const accuracy = calculateAccuracy(plusCount, totalQuestions);

    // Calculate average response time (only for recorded times)
    const validTimes = results.filter(r => r.responseTime && r.responseTime > 0);
    const avgResponseTime = validTimes.length > 0
        ? (validTimes.reduce((sum, r) => sum + r.responseTime, 0) / validTimes.length).toFixed(2)
        : '0.00';

    // Format total time
    const formattedTotalTime = formatTime(totalTime);
    const targetSummaryHTML = generateTargetSummary(results);

    const summaryHTML = `
        <h2 id="container">Overall Performance</h2>
        <div class="summary-wrapper" id="container">
            <div class="summary-stats">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-value">${plusCount}/${totalQuestions}</div>
                        <div class="summary-label">Correct</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${accuracy}%</div>
                        <div class="summary-label">Accuracy</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${avgResponseTime}s</div>
                        <div class="summary-label">Avg Response</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${formattedTotalTime}</div>
                        <div class="summary-label">Total Time</div>
                    </div>
                </div>
            </div>
            ${targetSummaryHTML ? `
            <h2>Results by Target</h2>
                ${targetSummaryHTML}
        ` : ''}
        </div>
    `;

    document.getElementById('summary').innerHTML = summaryHTML;
}


// Generate target summary table HTML
function generateTargetSummary(results) {
    // Group by target
    const targetGroups = {};
    results.forEach(result => {
        if (!targetGroups[result.target]) {
            targetGroups[result.target] = [];
        }
        targetGroups[result.target].push(result);
    });
    const targets = Object.keys(targetGroups).sort();
    if (targets.length === 1 || targets.length === 0) {
        return "";
    }

    let html = `<div class="summary-grid">`;

    targets.forEach(target => {
        const targetResults = targetGroups[target];
        const correct = countCorrect(targetResults);
        const total = countScored(targetResults);
        const targetAccuracy = calculateAccuracy(correct, total);

        const validTimes = targetResults.filter(r => r.responseTime && r.responseTime > 0);
        const avgTime = validTimes.length > 0
            ? (validTimes.reduce((sum, r) => sum + r.responseTime, 0) / validTimes.length).toFixed(1)
            : '-';

        html += `
        <div class="summary-item">
                <div class="summary-value"><strong>${correct}/${total}</strong><div class="summary-label">Score</div></div>
                <div class="summary-value"><strong>${avgTime}s</strong><div class="summary-label">Avg Time</div></div>
                <div class="summary-value"><strong>${targetAccuracy}%</strong><div class="summary-label">Accuracy</div></div>
                <div class="summary-label"><h4 id="summary-label">${escapeHTML(target)}</h4></div>

            </div>
        `;
    });

    html += `</div>`;
    return html;
}


// Display question-by-question results (for identify game)
function displayQuestionResults(results) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'results-table-wrapper';

    const table = document.createElement('table');
    table.className = 'results-table';
    table.id = 'questions-table';

    const hasStimulus = results.some(r => r.stimulus);

    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Category</th>
                ${hasStimulus ? '<th>Stimulus</th>' : ''}
                <th>Score</th>
                <th>Response Time</th>
                <th></th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    results.forEach((result, i) => {
        const row = document.createElement('tr');
        const score = getScoreDisplay(result.result);
        const responseTime = result.responseTime ? result.responseTime.toFixed(2) + 's' : 'N/A';

        row.innerHTML = `
            <td>${result.questionNumber}</td>
            <td>${escapeHTML(result.target)}</td>
            ${hasStimulus ? `<td>${escapeHTML(result.stimulus || '-')}</td>` : ''}
            <td><span class="score-badge ${score.class} editable-score" data-row-idx="${i}" title="Click to change score">${score.symbol}</span></td>
            <td>${responseTime}</td>
            <td><button class="result-delete-btn" data-row-idx="${i}" title="Delete row">${TRASH_ICON}</button></td>
        `;

        tbody.appendChild(row);
    });

    tableWrapper.appendChild(table);

    const section = document.getElementById('question-results');
    section.className = 'section';
    section.innerHTML = `
        <div class="section-header-row">
            <h2>Program Data</h2>
            <button class="btn-icon" id="edit-mode-toggle">${EDIT_ICON} Edit Data</button>
        </div>
        <div id="edit-mode-hint" class="edit-hint" style="display:none;">Tap a score to change it &bull; tap ${TRASH_ICON} to delete a row</div>
    `;
    section.appendChild(tableWrapper);
}


// Export results to CSV
function exportToCSV(resultsData) {
    const results = resultsData.results;
    const totalTime = resultsData.totalTime;

    // Calculate summary stats
    const totalQuestions = countScored(results);
    const plusCount = countCorrect(results);
    const accuracy = calculateAccuracy(plusCount, totalQuestions);
    const validTimes = results.filter(r => r.responseTime && r.responseTime > 0);
    const avgResponseTime = validTimes.length > 0
        ? (validTimes.reduce((sum, r) => sum + r.responseTime, 0) / validTimes.length).toFixed(2)
        : '0.00';

    // Build CSV content
    let csv = 'Quiz Results Export\n\n';

    // Summary section
    csv += 'SUMMARY\n';
    csv += 'Total Questions,' + totalQuestions + '\n';
    csv += 'Correct Responses,' + plusCount + '\n';
    csv += 'Accuracy,' + accuracy + '%\n';
    csv += 'Average Response Time,' + avgResponseTime + 's\n';
    csv += 'Total Time,' + formatTime(totalTime) + '\n';
    csv += '\n';

    // Question results
    csv += 'QUESTION RESULTS\n';
    csv += 'Question,Target,Score,Response Time (s)\n';
    results.forEach(result => {
        const score = result.result === 'plus' ? '+' : result.result === 'neutral' ? 'o' : '-';
        const time = result.responseTime ? result.responseTime.toFixed(2) : 'N/A';
        csv += `${result.questionNumber},"${result.target}",${score},${time}\n`;
    });
    csv += '\n';

    // Target summary
    csv += 'RESULTS BY TARGET\n';
    csv += 'Target,Correct,Total,Accuracy,Avg Response Time (s)\n';

    const targetGroups = {};
    results.forEach(result => {
        if (!targetGroups[result.target]) {
            targetGroups[result.target] = [];
        }
        targetGroups[result.target].push(result);
    });

    Object.keys(targetGroups).sort().forEach(target => {
        const targetResults = targetGroups[target];
        const correct = countCorrect(targetResults);
        const total = countScored(targetResults);
        const targetAccuracy = calculateAccuracy(correct, total);

        const validTimes = targetResults.filter(r => r.responseTime && r.responseTime > 0);
        const avgTime = validTimes.length > 0
            ? (validTimes.reduce((sum, r) => sum + r.responseTime, 0) / validTimes.length).toFixed(2)
            : 'N/A';

        csv += `"${target}",${correct},${total},${targetAccuracy}%,${avgTime}\n`;
    });

    downloadCSV(csv, 'quiz_results');
}

// Export phonics results to CSV (with per-pupil breakdown)
function exportPhonicsToCSV(resultsData) {
    const totalTime = resultsData.totalTime;
    const pupils = resultsData.pupils || [];
    const allResults = resultsData.results || [];

    // Calculate overall summary stats
    const totalQuestions = countScored(allResults);
    const plusCount = countCorrect(allResults);
    const accuracy = calculateAccuracy(plusCount, totalQuestions);

    // Build CSV content
    let csv = 'Phonics Session Results Export\n\n';

    // Overall Summary section
    csv += 'SESSION SUMMARY\n';
    csv += 'Total Questions,' + totalQuestions + '\n';
    csv += 'Correct Responses,' + plusCount + '\n';
    csv += 'Accuracy,' + accuracy + '%\n';
    csv += 'Total Time,' + formatTime(totalTime) + '\n';
    csv += 'Number of Pupils,' + pupils.length + '\n';
    csv += '\n';

    // Per-pupil results
    pupils.forEach(pupil => {
        const pupilResults = pupil.results || [];
        const pupilTotal = pupilResults.length;
        const pupilCorrect = countCorrect(pupilResults);
        const pupilScored = countScored(pupilResults);
        const pupilNeutral = pupilResults.filter(r => r.result === 'neutral').length;
        const pupilIncorrect = pupilResults.filter(r => r.result === 'minus').length;
        const pupilAccuracy = calculateAccuracy(pupilCorrect, pupilScored);

        csv += `PUPIL: ${pupil.name}\n`;
        csv += `Correct,${pupilCorrect}\n`;
        csv += `Incorrect,${pupilIncorrect}\n`;
        csv += `No Response,${pupilNeutral}\n`;
        csv += `Accuracy,${pupilAccuracy}%\n`;
        csv += '\n';

        if (pupilTotal > 0) {
            csv += 'Question,Program,Target,Score,Response Time (s)\n';
            pupilResults.forEach((result, index) => {
                const score = result.result === 'plus' ? '+' : result.result === 'neutral' ? 'o' : '-';
                const time = result.responseTime ? result.responseTime.toFixed(2) : 'N/A';
                const program = result.programType || '-';
                csv += `${index + 1},"${program}","${result.target}",${score},${time}\n`;
            });
            csv += '\n';
        }
    });

    downloadCSV(csv, 'phonics_results');
}

// Expose functions called from inline HTML
window.toggleEditMode = toggleEditMode;
window.cycleScore = cycleScore;
window.deleteResultRow = deleteResultRow;

