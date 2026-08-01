const FEMALE_VOICE_HINTS = [
  "female",
  "samantha",
  "karen",
  "moira",
  "tessa",
  "victoria",
  "susan",
  "fiona",
  "kate",
  "serena",
  "zira",
  "hazel",
  "google uk english female",
  "google us english",
  "microsoft libby",
  "microsoft sonia",
  "microsoft aria",
];

let voicesPrimed = false;

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices();
  if (!voices.length) {
    if (!voicesPrimed) {
      voicesPrimed = true;
      synth.addEventListener("voiceschanged", () => {}, { once: true });
    }
    return undefined;
  }
  const scored = voices.map((v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang?.toLowerCase() ?? "";
    let score = 0;
    if (lang.startsWith("en-gb")) score += 2;
    else if (lang.startsWith("en")) score += 1;
    if (FEMALE_VOICE_HINTS.some((hint) => name.includes(hint))) score += 3;
    return { v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.v;
}

export function speak(text: string) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.2;
    const voice = pickVoice(synth);
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  } catch {
    // speech synthesis unavailable — fail silently, it's a bonus feature
  }
}

export function chime() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // audio unavailable — fail silently
  }
}
