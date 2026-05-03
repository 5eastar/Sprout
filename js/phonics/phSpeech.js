
Object.assign(PhonicsGame.prototype, {

    // Override sound button to replay full question with phoneme audio
    setupSoundButton() {
        const soundBtn = document.getElementById('sound-btn');
        if (!soundBtn) return;

        const newSoundBtn = soundBtn.cloneNode(true);
        soundBtn.replaceWith(newSoundBtn);

        newSoundBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            newSoundBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                newSoundBtn.style.transform = 'scale(1)';
            }, 200);

            // Use phoneme-aware speech if available for this question type
            if (this.currentPhonemeSpeak) {
                const { before, letter, after } = this.currentPhonemeSpeak;
                this.speakWithPhoneme(before, letter, after);
            } else if (this.currentQuestionText) {
                this.speak(this.currentQuestionText);
            }
        });
    },

    // For phonics: enable answers by default (no wait mode)
    enableAnswersForPhonics() {
        this.answersEnabled = true;
        this.answerModeStartTime = Date.now();
        this.accumulatedAnswerTime = 0;

        const toggle = document.getElementById('btn');
        if (toggle) {
            toggle.checked = true;
        }

        // Remove any overlay
        const overlay = document.getElementById('answer-overlay');
        if (overlay) {
            overlay.remove();
        }

        const grid = document.getElementById('options-grid');
        grid?.classList.remove('answers-disabled');

        const cards = document.querySelectorAll('.option-card');
        cards.forEach(card => card.classList.remove('disabled'));

        // Speak the pending phoneme if any (including during correction retries)
        if (this.pendingPhonemeSpeak) {
            const { before, letter, after } = this.pendingPhonemeSpeak;
            this.speakWithPhoneme(before, letter, after);
            this.pendingPhonemeSpeak = null;
        }
    },

    // Get display text for phoneme - just return the letter
    getSpeakablePhoneme(letter) {
        return letter.toLowerCase();
    },

    // Speak the phoneme sound - uses parent's speakPhoneme method
    speakPhonemeSound(letter) {
        this.speakPhoneme(letter);
    },

    // Speak text with phoneme audio inserted
    // e.g., speakWithPhoneme("Which letter makes the", "a", "sound")
    async speakWithPhoneme(beforeText, letter, afterText = '') {
        // Speak the intro text, ending slightly early to compensate for audio file leading silence
        if (beforeText) {
            await this.speakAndWait(beforeText, 50); // End 50ms early
        }

        // Play the phoneme audio
        if (window.PhonemeAudio) {
            await window.PhonemeAudio.play(letter, this.synth);
        } else {
            await this.speakPhoneme(letter);
        }

        // Speak the outro text
        if (afterText) {
            await this.speakAndWait(afterText);
        }
    },

    // Keep for backwards compatibility but use getSpeakablePhoneme for speech
    getPhonemeSound(letter) {
        const letterData = window.phonicsData.getLetterData(letter);
        return letterData ? letterData.phoneme : letter;
    }


    }

)