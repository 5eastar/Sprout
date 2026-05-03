let phonicsGame;

document.addEventListener('DOMContentLoaded', () => {
    // Request fullscreen on first user interaction
        document.addEventListener('click', async () => {
            try {
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.log('Fullscreen not supported or denied');
            }
        }, { once: true });
    const config = getPhonicsConfig();

    if (!config) {
        alert('No phonics session configured');
        window.location.href = 'pages/phonics-home.html';
        return;
    }
    
    // Preload phoneme audio files
    if (window.PhonemeAudio && window.PhonemeAudio.preload) {
        const usedLetters = config.pupils.flatMap(p =>
            Object.values(p.targets).flat()
        );
        window.PhonemeAudio.preload([...new Set(usedLetters)]);
    }

    const teacherBtn = document.getElementById('teacher-btn');
    if (teacherBtn) {
        teacherBtn.style.display = 'none';
    }

    // Hide toggle on start screen
    const toggle = document.querySelector('.toggle');
    if (toggle) {
        toggle.style.display = 'none';
    }

    // Skip start screen - go straight to program section
    (async () => {
        phonicsGame = new PhonicsGame(config);
        await phonicsGame.init();

        const startScreen = document.getElementById('start-screen');
        const quizScreen = document.getElementById('game-screen');

        if (startScreen) startScreen.style.display = 'none';
        if (quizScreen) quizScreen.style.display = 'flex';

        if (teacherBtn) {
            teacherBtn.style.display = 'block';
        }

        phonicsGame.setupSoundButton();
        phonicsGame.setupAnswerToggle();
        ensureConfirmButton();
        phonicsGame.setupConfirmButton();

        phonicsGame.setupTeacherButton(() => {
            window.location.href = 'pages/results.html';
        });

        await phonicsGame.startProgram();
    })();
});
