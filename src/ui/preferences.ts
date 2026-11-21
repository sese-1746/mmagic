import {defaultPreferences,settingsKey,type Preferences} from "../config/game-config";

export function loadPreferences():Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || "null");
    return {
      sound:typeof saved?.sound === "boolean" ? saved.sound : defaultPreferences.sound,
      motion:saved?.motion === "reduced" ? "reduced" : "system"
    };
  } catch { return {...defaultPreferences}; }
}

export function storePreferences(preferences:Preferences) {
  document.documentElement.dataset.motion =
    preferences.motion === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "normal";
  try { localStorage.setItem(settingsKey,JSON.stringify(preferences)); } catch { /* Settings still apply for this tab. */ }
}

let audio:AudioContext | undefined;
export function playFeedback(kind:"impact"|"ward"|"sample",enabled:boolean) {
  if (!enabled || typeof AudioContext === "undefined") return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(()=>{});
    const now=audio.currentTime;
    const note=audio.createOscillator(), volume=audio.createGain();
    note.type=kind === "impact" ? "triangle" : "sine";
    note.frequency.setValueAtTime(kind === "impact" ? 230 : 430,now);
    note.frequency.exponentialRampToValueAtTime(kind === "impact" ? 83 : 620,now+.13);
    volume.gain.setValueAtTime(.001,now);
    volume.gain.exponentialRampToValueAtTime(.085,now+.02);
    volume.gain.exponentialRampToValueAtTime(.001,now+.19);
    note.connect(volume).connect(audio.destination);
    note.start(now);
    note.stop(now+.2);
  } catch { /* Browsers can deny audio without affecting game actions. */ }
}
