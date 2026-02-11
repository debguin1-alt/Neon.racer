// Audio System
class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = new Map();
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.7;
        this.soundVolume = 0.8;
        this.musicVolume = 0.5;
        this.currentMusic = null;
    }
    
    loadSound(name, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds.set(name, audio);
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', () => {
                console.error(`Failed to load sound: ${name}`);
                reject(new Error(`Failed to load sound: ${name}`));
            }, { once: true });
            
            audio.src = src;
            audio.load();
        });
    }
    
    loadMusic(name, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.loop = true;
            
            audio.addEventListener('canplaythrough', () => {
                this.music.set(name, audio);
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', () => {
                console.error(`Failed to load music: ${name}`);
                reject(new Error(`Failed to load music: ${name}`));
            }, { once: true });
            
            audio.src = src;
            audio.load();
        });
    }
    
    playSound(name, volumeMultiplier = 1.0) {
        if (!this.soundEnabled || !this.sounds.has(name)) return;
        
        const sound = this.sounds.get(name);
        const clone = sound.cloneNode();
        clone.volume = this.masterVolume * this.soundVolume * volumeMultiplier;
        
        clone.play().catch(err => {
            console.warn(`Failed to play sound ${name}:`, err);
        });
        
        // Clean up after playing
        clone.addEventListener('ended', () => {
            clone.remove();
        });
    }
    
    playMusic(name) {
        if (!this.musicEnabled || !this.music.has(name)) return;
        
        // Stop current music
        this.stopMusic();
        
        this.currentMusic = this.music.get(name);
        this.currentMusic.volume = this.masterVolume * this.musicVolume;
        this.currentMusic.currentTime = 0;
        
        this.currentMusic.play().catch(err => {
            console.warn(`Failed to play music ${name}:`, err);
        });
    }
    
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }
    
    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }
    
    resumeMusic() {
        if (this.currentMusic && this.musicEnabled) {
            this.currentMusic.play().catch(err => {
                console.warn('Failed to resume music:', err);
            });
        }
    }
    
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.masterVolume * this.musicVolume;
        }
    }
    
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.masterVolume * this.musicVolume;
        }
    }
    
    // Generate simple beep sound using Web Audio API (fallback)
    generateBeep(frequency = 440, duration = 0.1, type = 'sine') {
        if (!this.soundEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(this.masterVolume * this.soundVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (err) {
            console.warn('Web Audio API not supported:', err);
        }
    }
}

// Export as global
window.AudioManager = AudioManager;
