// program-manager.js — shared data functions for program access and export.
// Used by: identify-home, cats-home, game, history, programs pages.
// ProgramModalManager (add/edit UI) lives in js/menu/programs-modal.js.

const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const IMAGE_QUALITY = 0.7;

let programsCache = null;

// Initialize programs from built-in data on first load
async function initializePrograms() {
    // If already loaded this session, return cached version
    if (programsCache !== null) {
        return programsCache;
    }

    const allPrograms = window.quizData?.programs || [];

    if (allPrograms.length === 0) {
        console.error('No programs found in window.quizData');
    }

    programsCache = allPrograms.map(prog => ({
        ...prog,
        builtin: prog.builtin !== false,
        editable: true,
        showQuestionText: prog.showQuestionText !== false // Default true
    }));

    return programsCache;
}

// Get all programs
async function getAllPrograms() {
    return await initializePrograms();
}

// Save all programs — generates and downloads updated data.js
async function saveAllPrograms(programs) {
    programsCache = programs;

    const timestamp = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const totalStimuli = programs.reduce((sum, p) => sum + p.stimulus.length, 0);
    const totalImages = programs.reduce((sum, p) =>
        sum + p.stimulus.reduce((s, st) => s + st.images.length, 0), 0);

    const jsContent = `// Auto-generated quiz data
// Generated on: ${timestamp}
// Total Programs: ${programs.length}
// Total Stimuli: ${totalStimuli}
// Total Images: ${totalImages}

window.quizData = ${JSON.stringify({ programs }, null, 2)};

// Make available for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = quizData;
}
`;

    const blob = new Blob([jsContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(
        '✅ Programs exported!\n\n' +
        'File: data.js\n\n' +
        'REPLACE the existing data.js file in your app folder.\n' +
        'All your programs (built-in + custom) will load automatically next time!'
    );

    return true;
}

// Image compression — max 800×800, JPEG at 0.7 quality
function compressImage(file, maxWidth = MAX_IMAGE_WIDTH, maxHeight = MAX_IMAGE_HEIGHT, quality = IMAGE_QUALITY) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Export for pages that access programs via window.getAllPrograms
window.getAllPrograms = getAllPrograms;
