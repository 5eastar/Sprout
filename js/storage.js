// LocalStorage management for pupil data

const STORAGE_KEY = 'quizApp_pupils';
const HISTORY_KEY = 'quizApp_history';

// Safe localStorage wrapper
const storage = {
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return null;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing ${key}:`, error);
            return false;
        }
    }
};

// Get all pupils
function getAllPupils() {
    return storage.get(STORAGE_KEY) || [];
}

// Add new pupil
function addPupil(name) {
    if (!name?.trim()) return null;
    
    const pupils = getAllPupils();
    const trimmedName = name.trim();
    
    // Check if pupil already exists (case-insensitive)
    if (pupils.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        return null;
    }
    
    const newPupil = {
        id: generateId(),
        name: trimmedName,
        createdAt: new Date().toISOString(),
        quizCount: 0
    };
    
    pupils.push(newPupil);
    storage.set(STORAGE_KEY, pupils);
    return newPupil;
}
// Generate unique ID
function generateId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}
// Get pupil by ID
function getPupilById(id) {
    const pupils = getAllPupils();
    return pupils.find(p => p.id === id);
}

// Update pupil quiz count
function updatePupilQuizCount(pupilId) {
    const pupils = getAllPupils();
    const pupil = pupils.find(p => p.id === pupilId);
    
    if (pupil) {
        pupil.quizCount++;
        storage.set(STORAGE_KEY, pupils);
    }
}

// Save quiz result to history
function saveQuizResult(pupilId, resultsData, config) {
    const history = getQuizHistory();

    const totalQuestions = resultsData.results.length;
    const correct = countCorrect(resultsData.results);

    const quizRecord = {
        id: generateId(),
        pupilId: pupilId,
        date: new Date().toISOString(),
        config: config,
        type: config.gameType,
        results: resultsData.results,
        totalTime: resultsData.totalTime,
        program: config.program,
        summary: {
            totalQuestions,
            correct,
            accuracy: calculateAccuracy(correct, totalQuestions)
        }
    };

    history.push(quizRecord);
    storage.set(HISTORY_KEY, history);

    // Update pupil's quiz count
    updatePupilQuizCount(pupilId);
    return quizRecord.id;
}

// Save reinforcer choice to the last quiz history record
function saveQuizReinforcer(reinforcerType) {
    const history = getQuizHistory();
    if (history.length > 0) {
        history[history.length - 1].reinforcer = reinforcerType;
        storage.set(HISTORY_KEY, history);
    }
}

// Get all quiz history
function getQuizHistory() {
    return storage.get(HISTORY_KEY) || [];
}

// Get quiz history for specific pupil
function getPupilHistory(pupilId) {
    const history = getQuizHistory();
    return history.filter(q => q.pupilId === pupilId && q.type !== 'match');
}

// Get match history for specific pupil
function getPupilMatchHistory(pupilId) {
    const history = getQuizHistory();
    return history.filter(q => q.pupilId === pupilId && q.type === 'match');
}

// Delete pupil and their history
function deletePupil(pupilId) {
    // Remove pupil
    const pupils = getAllPupils().filter(p => p.id !== pupilId);
    storage.set(STORAGE_KEY, pupils);

    // Remove their quiz history
    const history = getQuizHistory().filter(q => q.pupilId !== pupilId);
    storage.set(HISTORY_KEY, history);
}

// ========== PHONICS STORAGE FUNCTIONS ==========

const PHONICS_CONFIG_KEY = 'phonicsConfig';
const PHONICS_HISTORY_KEY = 'quizApp_phonicsHistory';

// Save phonics session config to sessionStorage
function savePhonicsConfig(config) {
    try {
        sessionStorage.setItem(PHONICS_CONFIG_KEY, JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('Error saving phonics config:', error);
        return false;
    }
}

// Get phonics session config from sessionStorage
function getPhonicsConfig() {
    try {
        const data = sessionStorage.getItem(PHONICS_CONFIG_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading phonics config:', error);
        return null;
    }
}

// Save phonics session result to history
function savePhonicsResult(sessionData, config) {
    const history = getPhonicsHistory();

    // Calculate summary stats
    const allResults = sessionData.pupils.flatMap(p => p.results);
    const totalQuestions = allResults.length;
    const correct = countCorrect(allResults);

    const phonicsRecord = {
        id: generateId(),
        date: new Date().toISOString(),
        config: config,
        pupils: sessionData.pupils,
        programOrder: sessionData.programOrder,
        totalTime: sessionData.totalTime,
        summary: {
            totalQuestions,
            correct,
            accuracy: calculateAccuracy(correct, totalQuestions)
        }
    };

    history.push(phonicsRecord);
    storage.set(PHONICS_HISTORY_KEY, history);

    return phonicsRecord;
}

// Save reinforcer choice to the last phonics history record
function savePhonicsReinforcer(reinforcerType) {
    const history = getPhonicsHistory();
    if (history.length > 0) {
        history[history.length - 1].reinforcer = reinforcerType;
        storage.set(PHONICS_HISTORY_KEY, history);
    }
}

// Get all phonics history
function getPhonicsHistory() {
    return storage.get(PHONICS_HISTORY_KEY) || [];
}

// Get phonics history for specific pupil
function getPupilPhonicsHistory(pupilId) {
    const history = getPhonicsHistory();
    return history.filter(session =>
        session.pupils.some(p => p.pupilId === pupilId)
    );
}

// ========== PUPIL PHONICS DATA ==========

const PUPIL_PHONICS_DATA_KEY = 'quizApp_pupilPhonicsData';

// Get phonics data (photo, targets) for a specific pupil
function getPupilPhonicsData(pupilId) {
    const allData = storage.get(PUPIL_PHONICS_DATA_KEY) || {};
    return allData[pupilId] || {
        photo: null,
        targets: {
            'grapheme-to-phoneme': [],
            'phoneme-to-grapheme': [],
            'initial-sounds': []
        }
    };
}

// Update phonics data for a specific pupil
function updatePupilPhonicsData(pupilId, data) {
    const allData = storage.get(PUPIL_PHONICS_DATA_KEY) || {};
    allData[pupilId] = {
        ...getPupilPhonicsData(pupilId),
        ...data
    };
    return storage.set(PUPIL_PHONICS_DATA_KEY, allData);
}

// Rename a pupil (returns false if name is taken or invalid)
function renamePupil(pupilId, newName) {
    const trimmed = newName?.trim();
    if (!trimmed) return false;
    const pupils = getAllPupils();
    const pupil = pupils.find(p => p.id === pupilId);
    if (!pupil) return false;
    if (pupils.some(p => p.id !== pupilId && p.name.toLowerCase() === trimmed.toLowerCase())) return false;
    pupil.name = trimmed;
    return storage.set(STORAGE_KEY, pupils);
}

// ========== REINFORCER SETTINGS ==========

const REINFORCER_SETTINGS_KEY = 'quizApp_reinforcerSettings';
const DEFAULT_REINFORCER_SETTINGS = {
    balloons: true, particles: true, ballpit: true,
    pond: true, window: true, xylophone: true
};

function getReinforceSettings() {
    return { ...DEFAULT_REINFORCER_SETTINGS, ...(storage.get(REINFORCER_SETTINGS_KEY) || {}) };
}

function setReinforceSettings(settings) {
    return storage.set(REINFORCER_SETTINGS_KEY, settings);
}

// ========== RESULT EDITING ==========

function updateQuizResult(quizId, updatedResults) {
    const history = getQuizHistory();
    const idx = history.findIndex(q => q.id === quizId);
    if (idx < 0) return;
    history[idx].results = updatedResults;
    const correct = countCorrect(updatedResults);
    const totalQuestions = updatedResults.length;
    history[idx].summary = { totalQuestions, correct, accuracy: calculateAccuracy(correct, totalQuestions) };
    storage.set(HISTORY_KEY, history);
}

function updatePhonicsSessionResults(sessionId, updatedPupils) {
    const history = getPhonicsHistory();
    const idx = history.findIndex(s => s.id === sessionId);
    if (idx < 0) return;
    history[idx].pupils = updatedPupils;
    const allResults = updatedPupils.flatMap(p => p.results || []);
    const correct = countCorrect(allResults);
    history[idx].summary = { totalQuestions: allResults.length, correct, accuracy: calculateAccuracy(correct, allResults.length) };
    storage.set(PHONICS_HISTORY_KEY, history);
}

// ========== SESSION DELETION ==========

function deleteQuizSession(quizId) {
    const history = getQuizHistory().filter(q => q.id !== quizId);
    storage.set(HISTORY_KEY, history);
}

function deleteAllPupilQuizSessions(pupilId) {
    const history = getQuizHistory().filter(q => q.pupilId !== pupilId);
    storage.set(HISTORY_KEY, history);
}

function removePupilFromPhonicsSession(sessionId, pupilId) {
    const history = getPhonicsHistory();
    const idx = history.findIndex(s => s.id === sessionId);
    if (idx < 0) return;
    history[idx].pupils = history[idx].pupils.filter(p => p.pupilId !== pupilId);
    const allResults = history[idx].pupils.flatMap(p => p.results || []);
    const correct = countCorrect(allResults);
    history[idx].summary = { totalQuestions: allResults.length, correct, accuracy: calculateAccuracy(correct, allResults.length) };
    if (history[idx].pupils.length === 0) {
        history.splice(idx, 1);
    }
    storage.set(PHONICS_HISTORY_KEY, history);
}

function deletePhonicsSession(sessionId) {
    const history = getPhonicsHistory().filter(s => s.id !== sessionId);
    storage.set(PHONICS_HISTORY_KEY, history);
}
