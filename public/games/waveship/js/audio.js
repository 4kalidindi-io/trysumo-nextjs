export default class AudioManager {
  constructor() {
    // don't create AudioContext until a user gesture; create lazily in playTone
    this.ctx = null;
  }

  playTone(freq, type = 'sine', duration = 0.12, gain = 0.12) {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    if (this.ctx.state === 'suspended') {
      // try to resume on user gesture
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gain, now);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(now);
    o.stop(now + duration);
  }

  // create or resume audio context explicitly after user gesture
  resume() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  playThrust() {
    // short clicky tone
    this.playTone(880, 'triangle', 0.06, 0.06);
  }

  playDeath() {
    // descending buzzer
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(400, now);
    o.frequency.exponentialRampToValueAtTime(80, now + 0.5);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(now);
    o.stop(now + 0.6);
  }

}
