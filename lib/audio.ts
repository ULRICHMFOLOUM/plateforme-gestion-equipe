/**
 * Audio Synthesizer via Web Audio API for Notification Sounds
 * Zero external audio files required — 100% reliable and instantaneous.
 */

export type SoundType = "chime" | "pop" | "bell" | "digital" | "none";

export const SOUND_LABELS: Record<SoundType, string> = {
  chime: "🔔 Chime Harmonieux",
  pop: "🎈 Pop Moderne",
  bell: "🛎️ Cloche Digitale",
  digital: "⚡ Beep Futuriste",
  none: "🔇 Silencieux",
};

export function playNotificationSound(type: SoundType = "chime") {
  if (type === "none" || typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "chime") {
      // Pleasant dual-tone chime (E5 -> B5)
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.08); // B5
      gain2.gain.setValueAtTime(0.2, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.7);
    } else if (type === "pop") {
      // Bubble pop sound effect
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "bell") {
      // Metallic bell
      const now = ctx.currentTime;
      [800, 1200, 2400].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        const vol = 0.1 / (idx + 1);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      });
    } else if (type === "digital") {
      // Futuristic 3-tone arpeggio
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.15, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    }
  } catch (err) {
    console.warn("Audio playback not supported or blocked by browser gesture policy", err);
  }
}

// Helpers for localStorage sound settings
export function getSavedSoundPreference(): SoundType {
  if (typeof window === "undefined") return "chime";
  return (localStorage.getItem("tf_notification_sound") as SoundType) || "chime";
}

export function saveSoundPreference(sound: SoundType) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tf_notification_sound", sound);
}
