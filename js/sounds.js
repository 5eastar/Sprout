// Sound effects using Web Audio API (no files needed!)
class SoundEffects {
    constructor() {
        this.audioContext = null;
    }
    
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    playCorrect() {
        this.init();
        const ctx = this.audioContext;
        
        // Happy ascending notes
        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, high C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
            }, i * 100);
        });
    }
    
    playIncorrect() {
        this.init();
        const ctx = this.audioContext;
        
        // Gentle "try again" sound
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.2);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }
    
    playClick() {
        this.init();
        const ctx = this.audioContext;
        
        // Fun click sound
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    }
    playPop() {
    this.init();
    const ctx = this.audioContext;
    
    // Exciting burst with multiple frequencies
    const frequencies = [150, 250, 350, 450];
    
    frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
        oscillator.type = i % 2 === 0 ? 'sine' : 'triangle';
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        oscillator.start(ctx.currentTime + i * 0.02);
        oscillator.stop(ctx.currentTime + 0.15 + i * 0.02);
    });
    
    // Add white noise burst for extra impact
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    
    noise.buffer = buffer;
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    noise.start(ctx.currentTime);
}

    playCelebration() {
        this.init();
        const ctx = this.audioContext;
        
        // Victory fanfare
        const melody = [523.25, 587.33, 659.25, 783.99, 880.00];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'triangle';
                
                gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
            }, i * 150);
        });
    }
    playFanfare() {
    this.init();
    const ctx = this.audioContext;
    
    // Triumphant ascending melody
    const melody = [
        { freq: 523.25, time: 0, duration: 0.15 },      // C5
        { freq: 659.25, time: 0.15, duration: 0.15 },   // E5
        { freq: 783.99, time: 0.3, duration: 0.15 },    // G5
        { freq: 1046.50, time: 0.45, duration: 0.3 },   // C6 (hold)
        { freq: 987.77, time: 0.8, duration: 0.15 },    // B5
        { freq: 1046.50, time: 0.95, duration: 0.5 }    // C6 (final hold)
    ];
    
    melody.forEach(note => {
        setTimeout(() => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = note.freq;
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.duration);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + note.duration);
        }, note.time * 1000);
    });
}
}

const soundFX = new SoundEffects();