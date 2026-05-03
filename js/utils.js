// Escapes user-provided strings before inserting into innerHTML
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Time Formatting
function formatTime(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(isoString) {
    try {
        const date = new Date(isoString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;
    } catch (error) {
        return 'Invalid date';
    }
}

// Score display helper (consolidates 6+ duplications)
function getScoreDisplay(result) {
    return {
        class: result === 'plus' ? 'plus' : result === 'neutral' ? 'neutral' : 'minus',
        symbol: result === 'plus' ? '+' : result === 'neutral' ? '○' : '−'
    };
}

// Count correct answers (consolidates 15+ duplications)
function countCorrect(results) {
    return results.filter(r => r.result === 'plus').length;
}

function countScored(results) {
    return results.filter(r => r.result !== 'neutral').length;
}

// Calculate accuracy percentage (consolidates 6+ duplications)
function calculateAccuracy(correct, total) {
    return total > 0 ? ((correct / total) * 100).toFixed(1) : '0';
}

// Game type display labels
const GAME_TYPE_LABELS = {
    find:    'Find',
    match:   'Match',
    sort:    'Category - Sort',
    label:   'Category - Label',
    compare: 'Category - Compare',
};

// Program labels constant (consolidates 5+ definitions)
const PROGRAM_LABELS = {
    'grapheme-to-phoneme': 'Produce Phoneme',
    'phoneme-to-grapheme': 'Select Grapheme',
    'initial-sounds': 'Select Picture'
};

const Program_Intro_Labels = {
    'grapheme-to-phoneme': 'Can you make this letter sound? 🗣️',
    'phoneme-to-grapheme': 'Which letter makes this sound?',
    'initial-sounds': 'Which picture starts with this sound?'
};

// Shared getFemaleVoice (consolidates 2 duplications)
function getFemaleVoice(synth) {
    const voices = (synth || window.speechSynthesis)?.getVoices() || [];
    return voices.find(v =>
        v.lang.includes('en-GB') && (v.name.includes('Female') || v.name.includes('Hazel') || v.name.includes('Susan') || v.name.includes('Microsoft Hazel'))
    ) || voices.find(v =>
        v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Microsoft Zira'))
    ) || voices.find(v => v.lang.includes('en-GB')) || null;
}

// Letter name pronunciations to force correct TTS reading (e.g. 'f' → 'eff', 'z' → 'zed')
const LETTER_NAMES = {
    'a': 'ay', 'b': 'bee', 'c': 'see', 'd': 'dee', 'e': 'ee',
    'f': 'eff', 'g': 'jee', 'h': 'aitch', 'i': 'eye', 'j': 'jay',
    'k': 'kay', 'l': 'ell', 'm': 'em', 'n': 'en', 'o': 'oh',
    'p': 'pee', 'q': 'cue', 'r': 'ar', 's': 'ess', 't': 'tee',
    'u': 'you', 'v': 'vee', 'w': 'double you', 'x': 'ex', 'y': 'why', 'z': 'zed'
};

function getLetterSpeechName(letter) {
    return LETTER_NAMES[letter.toLowerCase()] || letter;
}

// Colour palette for text-only option cards
const TEXT_COLORS = [
    '#5063b8', '#764ba2', '#be11d1', '#4facfe',
    '#1b7539', '#fa709a', '#ff6b6b', '#da9c16',
    '#29a1bc', '#e2612a', '#54a0ff', '#079a9a'
];

// Fisher-Yates shuffle (GameCore.shuffleArray delegates to this)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

window.formatTime = formatTime;
window.formatDate = formatDate;
window.getScoreDisplay = getScoreDisplay;
window.countCorrect = countCorrect;
window.calculateAccuracy = calculateAccuracy;
window.PROGRAM_LABELS = PROGRAM_LABELS;
window.GAME_TYPE_LABELS = GAME_TYPE_LABELS;
window.getFemaleVoice = getFemaleVoice;
window.countScored = countScored;
window.LETTER_NAMES = LETTER_NAMES;
window.getLetterSpeechName = getLetterSpeechName;
window.TEXT_COLORS = TEXT_COLORS;
window.shuffleArray = shuffleArray;

// Download a string as a .csv file with a timestamped filename
function downloadCSV(csv, prefix) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date();
    const filename = `${prefix}_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Sum phonics stats for a single pupil across all phonics history sessions
function getPupilPhonicsStats(pupilId, phonicsHistory) {
    let questions = 0, correct = 0;
    for (const session of phonicsHistory) {
        const data = session.pupils.find(p => p.pupilId === pupilId);
        if (data?.results) {
            questions += data.results.length;
            correct += countCorrect(data.results);
        }
    }
    return { questions, correct };
}

window.escapeHTML = escapeHTML;
window.downloadCSV = downloadCSV;
window.getPupilPhonicsStats = getPupilPhonicsStats;