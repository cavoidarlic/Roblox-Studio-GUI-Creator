/**
 * Web Audio API synthesizer for authentic Roblox UI feedback sounds.
 * Generates crisp procedural audio without external audio file loading.
 */

class RobloxSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.6;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public play(type: 'click' | 'hover' | 'snap' | 'chime' | 'group' | 'error') {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      if (type === 'click') {
        // Crisp tactile button click (percussive drop)
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'hover') {
        // High-frequency subtle hover blip
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1250, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.025);

        gain.gain.setValueAtTime(0.08 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'snap') {
        // Sharp grid snap tick
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

        gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'chime' || type === 'group') {
        // Harmonic two-tone chord for modal open, code export, or grouping elements
        const freqs = type === 'group' ? [440, 554.37, 659.25] : [523.25, 659.25, 783.99]; // A major / C major
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const subGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);

          subGain.gain.setValueAtTime(0.18 * this.masterVolume, now + idx * 0.03);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28 + idx * 0.03);

          osc.connect(subGain);
          subGain.connect(ctx.destination);
          osc.start(now + idx * 0.03);
          osc.stop(now + 0.32 + idx * 0.03);
        });
      } else if (type === 'error') {
        // Low error buzz
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.12);

        gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // Audio playback fails gracefully if browser restricts
    }
  }
}

export const soundEffects = new RobloxSoundEngine();
