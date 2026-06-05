(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.AudioManager = class {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.currentTheme = null;
      this.timer = 0;
      this.step = 0;
      this.enabled = true;
      this.themes = {
        town: { root: 220, scale: [0, 3, 5, 7, 10, 12], tempo: 0.42, wave: "triangle" },
        forest: { root: 196, scale: [0, 2, 3, 7, 9, 12], tempo: 0.48, wave: "sine" },
        pass: { root: 174.61, scale: [0, 2, 5, 7, 8, 12], tempo: 0.34, wave: "sawtooth" },
        caverns: { root: 146.83, scale: [0, 3, 7, 10, 12, 15], tempo: 0.56, wave: "sine" },
        swamp: { root: 164.81, scale: [0, 1, 5, 6, 10, 12], tempo: 0.52, wave: "triangle" },
        ruins: { root: 130.81, scale: [0, 2, 6, 7, 11, 12], tempo: 0.5, wave: "square" },
        mountains: { root: 246.94, scale: [0, 2, 5, 7, 9, 12], tempo: 0.46, wave: "triangle" },
        citadel: { root: 110, scale: [0, 1, 4, 6, 8, 12], tempo: 0.39, wave: "sawtooth" },
        combat: { root: 196, scale: [0, 2, 3, 7, 8, 12], tempo: 0.22, wave: "square" },
        boss: { root: 98, scale: [0, 1, 5, 6, 7, 11], tempo: 0.2, wave: "sawtooth" },
        house: { root: 261.63, scale: [0, 4, 7, 11, 12, 16], tempo: 0.62, wave: "triangle" }
      };
    }

    init() {
      if (this.ctx || !this.enabled) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.enabled = false;
        return;
      }
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.72;
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.18;
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.34;
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
    }

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }

    setTheme(name) {
      if (this.currentTheme !== name) {
        this.currentTheme = name;
        this.timer = 0;
        this.step = 0;
      }
    }

    update(dt, intensity) {
      if (!this.ctx || !this.currentTheme) return;
      const theme = this.themes[intensity ? "combat" : this.currentTheme] || this.themes.town;
      this.timer -= dt;
      if (this.timer > 0) return;
      this.timer += theme.tempo;
      this.playMusicStep(theme, this.step);
      this.step += 1;
    }

    hz(root, semitone) {
      return root * Math.pow(2, semitone / 12);
    }

    playMusicStep(theme, step) {
      const now = this.ctx.currentTime;
      const index = Math.abs((step * 3 + (step % 5)) % theme.scale.length);
      const note = theme.scale[index] + (step % 8 === 7 ? 12 : 0);
      const bass = theme.scale[step % 2 === 0 ? 0 : 3] - 12;
      this.tone(this.hz(theme.root, note), 0.18, theme.wave, this.musicGain, 0.28, now);
      if (step % 2 === 0) this.tone(this.hz(theme.root, bass), 0.34, "sine", this.musicGain, 0.22, now);
      if (step % 8 === 0) this.noise(0.06, this.musicGain, 0.06, now);
    }

    tone(freq, duration, type, destination, volume, start) {
      if (!this.ctx) return;
      const now = start || this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume || 0.2, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(destination || this.sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    noise(duration, destination, volume, start) {
      if (!this.ctx) return;
      const now = start || this.ctx.currentTime;
      const size = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < size; i += 1) data[i] = Math.random() * 2 - 1;
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      source.buffer = buffer;
      gain.gain.setValueAtTime(volume || 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(gain);
      gain.connect(destination || this.sfxGain);
      source.start(now);
    }

    sfx(name) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (name === "sword") {
        this.tone(440, 0.05, "square", this.sfxGain, 0.24, now);
        this.tone(660, 0.08, "triangle", this.sfxGain, 0.16, now + 0.04);
      } else if (name === "hit") {
        this.noise(0.08, this.sfxGain, 0.24, now);
        this.tone(110, 0.1, "sawtooth", this.sfxGain, 0.16, now);
      } else if (name === "hurt") {
        this.noise(0.1, this.sfxGain, 0.2, now);
        this.tone(92, 0.14, "square", this.sfxGain, 0.18, now);
        this.tone(58, 0.18, "sawtooth", this.sfxGain, 0.12, now + 0.02);
      } else if (name === "dodge") {
        this.noise(0.05, this.sfxGain, 0.1, now);
        this.tone(330, 0.07, "sine", this.sfxGain, 0.14, now);
        this.tone(520, 0.09, "triangle", this.sfxGain, 0.1, now + 0.04);
      } else if (name === "enemyWarn") {
        this.tone(155, 0.09, "triangle", this.sfxGain, 0.14, now);
        this.tone(98, 0.12, "sine", this.sfxGain, 0.1, now + 0.05);
      } else if (name === "coin") {
        this.tone(880, 0.08, "triangle", this.sfxGain, 0.2, now);
        this.tone(1320, 0.1, "triangle", this.sfxGain, 0.14, now + 0.08);
      } else if (name === "magic") {
        this.tone(523.25, 0.13, "sine", this.sfxGain, 0.22, now);
        this.tone(1046.5, 0.18, "triangle", this.sfxGain, 0.14, now + 0.03);
        this.tone(740, 0.1, "sine", this.sfxGain, 0.08, now + 0.07);
      } else if (name === "bow") {
        this.tone(294, 0.07, "triangle", this.sfxGain, 0.18, now);
        this.noise(0.03, this.sfxGain, 0.05, now + 0.01);
      } else if (name === "ward") {
        this.tone(261.63, 0.2, "sine", this.sfxGain, 0.16, now);
        this.tone(392, 0.22, "triangle", this.sfxGain, 0.12, now + 0.04);
        this.noise(0.06, this.sfxGain, 0.04, now);
      } else if (name === "quest") {
        this.tone(523.25, 0.1, "triangle", this.sfxGain, 0.18, now);
        this.tone(659.25, 0.1, "triangle", this.sfxGain, 0.18, now + 0.1);
        this.tone(783.99, 0.14, "triangle", this.sfxGain, 0.18, now + 0.2);
      } else if (name === "thunder") {
        this.noise(0.7, this.sfxGain, 0.28, now);
        this.tone(55, 0.6, "sawtooth", this.sfxGain, 0.18, now);
      } else if (name === "ui") {
        this.tone(660, 0.06, "sine", this.sfxGain, 0.09, now);
        this.tone(910, 0.04, "sine", this.sfxGain, 0.05, now + 0.02);
      }
    }
  };
}());
