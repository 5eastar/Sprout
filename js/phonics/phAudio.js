// Phoneme Audio System
// Plays audio files for phonemes, falls back to speech synthesis

const PhonemeAudio = {
    audioPath: 'audio/phonemes/',
    audioExtension: '.mp3',
    audioCache: {},

    // Map letters to their phoneme audio files
    phonemeFiles: {
        'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e',
        'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j',
        'k': 'c', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o',
        'p': 'p', 'q': 'qu', 'r': 'r', 's': 's', 't': 't',
        'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y',
        'z': 'z',
        // Digraphs
        'ch': 'ch', 'sh': 'sh', 'th': 'th', 'ng': 'ng', 'ck': 'c', 'qu': 'qu',
        // Phase 3 vowel digraphs
        'ai': 'ai', 'ee': 'ee', 'igh': 'igh', 'oa': 'oa', 'oo': 'oo',
        'ar': 'ar', 'or': 'or', 'ur': 'ur', 'ow': 'ow', 'oi': 'oi',
        'ear': 'ear', 'air': 'air', 'ure': 'ure', 'er': 'er'
    },

    // UK Phonics pronunciations for speech synthesis
    // Based on Letters and Sounds program - pure sounds without added schwa where possible
    fallbackPronunciations: {
        // Short vowels (Phase 2)
        'a': { text: 'a', rate: 0.4, pitch: 1.0 },
        'e': { text: 'e', rate: 0.4, pitch: 1.0 },
        'i': { text: 'i', rate: 0.4, pitch: 1.0 },
        'o': { text: 'o', rate: 0.4, pitch: 0.9 },
        'u': { text: 'u', rate: 0.4, pitch: 1.0 },

        // Continuous consonants - can be stretched
        's': { text: 'ss', rate: 0.3, pitch: 1.2 },
        'f': { text: 'ff', rate: 0.3, pitch: 1.0 },
        'l': { text: 'll', rate: 0.4, pitch: 1.0 },
        'm': { text: 'mm', rate: 0.4, pitch: 0.9 },
        'n': { text: 'nn', rate: 0.4, pitch: 1.0 },
        'r': { text: 'rr', rate: 0.4, pitch: 0.9 },
        'v': { text: 'vv', rate: 0.3, pitch: 0.9 },
        'z': { text: 'zz', rate: 0.3, pitch: 0.9 },
        'h': { text: 'h', rate: 0.5, pitch: 1.0 },

        // Stop consonants - short, no schwa
        'b': { text: 'b', rate: 0.5, pitch: 0.9 },
        'd': { text: 'd', rate: 0.5, pitch: 1.0 },
        'g': { text: 'g', rate: 0.5, pitch: 0.9 },
        'k': { text: 'k', rate: 0.5, pitch: 1.0 },
        'p': { text: 'p', rate: 0.5, pitch: 1.0 },
        't': { text: 't', rate: 0.5, pitch: 1.0 },
        'c': { text: 'k', rate: 0.5, pitch: 1.0 },

        // Other consonants
        'j': { text: 'j', rate: 0.5, pitch: 1.0 },
        'w': { text: 'w', rate: 0.5, pitch: 0.9 },
        'x': { text: 'ks', rate: 0.5, pitch: 1.0 },
        'y': { text: 'y', rate: 0.5, pitch: 1.0 },
        'q': { text: 'kw', rate: 0.5, pitch: 1.0 },

        // Digraphs (Phase 3)
        'ch': { text: 'ch', rate: 0.4, pitch: 1.0 },
        'sh': { text: 'sh', rate: 0.3, pitch: 1.1 },
        'th': { text: 'th', rate: 0.4, pitch: 1.0 },
        'ng': { text: 'ng', rate: 0.4, pitch: 0.9 },
        'ck': { text: 'k', rate: 0.5, pitch: 1.0 },
        'qu': { text: 'kw', rate: 0.5, pitch: 1.0 }
    },

    // Play a phoneme sound and wait for it to finish
    async play(letter, synth = null) {
        const lowerLetter = letter.toLowerCase();
        const filename = this.phonemeFiles[lowerLetter];

        if (!filename) {
            console.warn('No phoneme mapping for:', letter);
            return this.speakFallback(lowerLetter, synth);
        }

        const audioPath = this.audioPath + filename + this.audioExtension;

        try {
            // Check cache first
            if (!this.audioCache[filename]) {
                this.audioCache[filename] = new Audio(audioPath);
            }

            const audio = this.audioCache[filename];
            audio.currentTime = 0;
            audio.volume = 1.0; // Max volume

            // Wait for audio to finish playing
            return new Promise((resolve) => {
                const onEnded = () => {
                    audio.removeEventListener('ended', onEnded);
                    audio.removeEventListener('error', onError);
                    resolve(true);
                };
                const onError = () => {
                    audio.removeEventListener('ended', onEnded);
                    audio.removeEventListener('error', onError);
                    console.log('Audio error for', letter, '- using speech fallback');
                    this.speakFallback(lowerLetter, synth);
                    resolve(false);
                };

                audio.addEventListener('ended', onEnded);
                audio.addEventListener('error', onError);

                audio.play().catch(() => {
                    audio.removeEventListener('ended', onEnded);
                    audio.removeEventListener('error', onError);
                    console.log('Audio not available for', letter, '- using speech fallback');
                    this.speakFallback(lowerLetter, synth);
                    resolve(false);
                });
            });
        } catch (e) {
            console.log('Audio not available for', letter, '- using speech fallback');
            return this.speakFallback(lowerLetter, synth);
        }
    },

    // Get a female UK English voice (uses shared utility)
    getFemaleVoice() {
        return window.getFemaleVoice();
    },

    // Fallback to speech synthesis - returns promise that waits for completion
    speakFallback(letter, synth) {
        const fallback = this.fallbackPronunciations[letter];
        if (!fallback) return Promise.resolve(false);

        const speechSynth = synth || window.speechSynthesis;
        if (!speechSynth) return Promise.resolve(false);

        speechSynth.cancel();

        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(fallback.text);
            utterance.rate = fallback.rate || 0.5;
            utterance.pitch = fallback.pitch || 1;
            utterance.volume = 1;
            utterance.lang = 'en-GB';

            // Use female voice if available
            const femaleVoice = this.getFemaleVoice();
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            utterance.onend = () => resolve(true);
            utterance.onerror = () => resolve(false);

            // Timeout fallback in case onend doesn't fire
            setTimeout(() => resolve(true), 2000);

            speechSynth.speak(utterance);
        });
    },

    // Preload audio files (call on page load for faster playback)
    preload(letters = null) {
        const filenames = letters
            ? [...new Set(letters.map(l => this.phonemeFiles[l.toLowerCase()]).filter(Boolean))]
            : [...new Set(Object.values(this.phonemeFiles))];

        filenames.forEach(filename => {
            if (!this.audioCache[filename]) {
                const audio = new Audio(this.audioPath + filename + this.audioExtension);
                audio.preload = 'auto';
                audio.load();
                this.audioCache[filename] = audio;
            }
        });
    }
};

// Make available globally
window.PhonemeAudio = PhonemeAudio;
