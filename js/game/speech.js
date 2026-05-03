// GameCore mixin — speech synthesis methods.
// Requires: core.js loaded first.

Object.assign(GameCore.prototype, {

    // Get a female UK English voice (uses shared utility from utils.js)
    getFemaleVoice() {
        return window.getFemaleVoice(this.synth);
    },

    _makeUtterance(text, rate = 0.8) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = rate; utt.pitch = 1; utt.volume = 1; utt.lang = 'en-GB';
        const voice = this.getFemaleVoice();
        if (voice) utt.voice = voice;
        return utt;
    },

    speak(text, rate = 0.8) {
        if (!text || !this.synth) return;
        this.synth.cancel();
        setTimeout(() => {
            const utterance = this._makeUtterance(text, rate);
            utterance.onerror = (event) => { console.error('Speech synthesis error:', event); };
            this.synth.speak(utterance);
        }, TIMING.SPEAK_DELAY);
    },

     // Helper: speak and wait for completion
    // earlyEnd: resolve this many ms before speech actually ends (to compensate for audio delays)
    speakAndWait(text, earlyEnd = 0) {
        return new Promise((resolve) => {
            if (!text || !this.synth) {
                resolve();
                return;
            }

            this.synth.cancel();
            let resolved = false;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = 'en-GB';

            // Use female voice if available
            const femaleVoice = this.getFemaleVoice();
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            // If earlyEnd is set, estimate speech duration and resolve early
            if (earlyEnd > 0) {
                // Rough estimate: ~80ms per character at rate 0.9
                const estimatedDuration = Math.max(500, text.length * 80);
                const earlyTimeout = Math.max(100, estimatedDuration - earlyEnd);
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }, earlyTimeout);
            }

            utterance.onend = () => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };
            utterance.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };

            // Timeout fallback
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            }, 5000);

            this.synth.speak(utterance);
        });
    },

    // Speak two parts with a pause between them
    speakWithPause(firstPart, secondPart, pauseMs = 800, rate = 0.8) {
        if (!this.synth) return;
        this.synth.cancel();
        setTimeout(() => {
            const utt1 = this._makeUtterance(firstPart, rate);
            utt1.onend = () => {
                setTimeout(() => {
                    this.synth.speak(this._makeUtterance(secondPart, rate));
                }, pauseMs);
            };
            this.synth.speak(utt1);
        }, TIMING.SPEAK_DELAY);
    },

    speakPhoneme(letter) {
        // Use PhonemeAudio system (supports audio files + speech synthesis fallback)
        if (window.PhonemeAudio) {
            window.PhonemeAudio.play(letter, this.synth);
        } else if (this.synth) {
            this.synth.speak(new SpeechSynthesisUtterance(letter.toLowerCase()));
        }
    },

});
