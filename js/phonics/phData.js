// Phonics Data

window.phonicsData = {
    letters: [
        {
            letter: 's',
            phoneme: '/s/',
            examples: ['sun', 'snake', 'star'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/s/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 'a',
            phoneme: '/æ/',
            examples: ['apple',  'astronaut', 'arrow'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/a/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 't',
            phoneme: '/t/',
            examples: ['tiger', 'tent', 'turtle'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/t/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 'p',
            phoneme: '/p/',
            examples: ['pig', 'pizza', 'panda'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/p/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 'i',
            phoneme: '/ɪ/',
            examples: ['igloo', 'ink', 'insect'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/i/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 'n',
            phoneme: '/n/',
            examples: ['nose', 'net', 'nest'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/n/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 'm',
            phoneme: '/m/',
            examples: ['monkey', 'moon', 'map'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/m/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 'd',
            phoneme: '/d/',
            examples: ['drum', 'doughnut', 'duck'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/d/',
            phase: 1,
            picSounds: 'begins',
        },
        {
            letter: 'g',
            phoneme: '/g/',
            examples: ['goat', 'guitar', 'girl'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/g/', 
            phase: 2,
            picSounds: 'begins',
        },
        {
            letter: 'o',
            phoneme: '/ɒ/',
            examples: ['octopus', 'orange', 'oven'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/o/',
            phase: 2,
            picSounds: 'begins',
        },
        {
            letter: 'c',
            phoneme: '/k/',
            examples: ['cat', 'carrot', 'coat'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/c/',
            phase: 2,
            picSounds: 'begins',
        },
        {
            letter: 'k',
            phoneme: '/k/',
            examples: ['kite', 'kangaroo', 'key'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/k/',
            phase: 2,
            picSounds: 'begins',
        },
        {
            letter: 'ck',
            phoneme: '/k/',
            examples: ['truck', 'rocket', 'stick'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/ck/',
            phase: 2,
            picSounds: 'contains',
        },
        {
            letter: 'e',
            phoneme: '/ɛ/',
            examples: ['elephant', 'eggs', 'elbow'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/e/',
            phase: 2,
            picSounds: 'begins',
        },
        {
            letter: 'u',
            phoneme: '/ʌ/',
            examples: ['umbrella', 'upstairs', 'udder'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/u/',
            phase: 2,
            picSounds: 'begins',
        },
        {
            letter: 'r',
            phoneme: '/r/',
            examples: ['rabbit', 'rainbow', 'robot'],
            imagePath: (window.ASSET_BASE || '') + 'images/phonics/r/',
            phase: 2,
            picSounds: 'begins',
        }
    ],

    // Get letter data by letter
    getLetterData(letter) {
        return this.letters.find(l => l.letter === letter.toLowerCase());
    },

    // Get all available letters
    getAllLetters() {
        return this.letters.map(l => l.letter);
    },

    // Get example words for a letter
    getExamples(letter) {
        const data = this.getLetterData(letter);
        return data ? data.examples : [];
    },

    // Get distractor letters
    getDistractors(targetLetter, count = 3) {
        // Letters that should never appear as distractors for each other
        const confusablePairs = [
            ['m', 'n'],
        ];

        const target = targetLetter.toLowerCase();
        const excluded = new Set();
        confusablePairs.forEach(([a, b]) => {
            if (a === target) excluded.add(b);
            if (b === target) excluded.add(a);
        });

        const allLetters = this.getAllLetters();
        const candidates = allLetters.filter(l => l !== target && !excluded.has(l));

        return [...candidates].sort(() => Math.random() - 0.5).slice(0, count);
    },

    // Get distractor words (words that DON'T start with target letter)
    getDistractorWords(targetLetter, count = 1) {
        const distractors = [];
        const otherLetters = this.getDistractors(targetLetter, count);
        
        otherLetters.forEach(letter => {
            const data = this.getLetterData(letter);
            if (data && data.examples.length > 0) {
                // Pick random example from this letter
                const randomExample = data.examples[Math.floor(Math.random() * data.examples.length)];
                distractors.push({
                    word: randomExample,
                    letter: letter,
                    imagePath: data.imagePath + randomExample + '.jpg'
                });
            }
        });
        
        return distractors;
    },

    // Get image path for a word
    getImagePath(letter, word) {
        const data = this.getLetterData(letter);
        if (!data) return null;
        return data.imagePath + word + '.jpg';
    },


    validateTargets(targets) {
        const validLetters = this.getAllLetters();
        return targets.every(t => validLetters.includes(t.toLowerCase()));
    }
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = phonicsData;
}
