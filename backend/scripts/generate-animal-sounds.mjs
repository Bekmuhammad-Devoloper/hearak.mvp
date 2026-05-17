// Hayvon ovozlarini sintez orqali generatsiya qiladi va `audio/animals/`
// papkasiga `.wav` formatida saqlaydi. Real audio fayllar bo'lmagan paytda
// asosiy zaxira sifatida ishlatiladi.
//
// Ishga tushirish:
//   node scripts/generate-animal-sounds.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../audio/animals");

const SAMPLE_RATE = 22050;
const BITS = 16;
const CHANNELS = 1;

/** WAV header + 16-bit PCM samples (Int16Array) -> Buffer */
function encodeWav(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE((SAMPLE_RATE * CHANNELS * BITS) / 8, 28);
  buffer.writeUInt16LE((CHANNELS * BITS) / 8, 32);
  buffer.writeUInt16LE(BITS, 34);
  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, samples[i])), 44 + i * 2);
  }
  return buffer;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function envelope(t, attack, decay) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (t - attack) / decay;
  return 0;
}

// ─── Synthesizers ──────────────────────────────────────────────────────

/** It — "vov vov vov" — past freqli qisqa partlashlar, tez decay */
function dogBark() {
  const dur = 1.5;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Int16Array(n);
  const barks = [0.0, 0.45, 0.9]; // har bark start vaqti
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;
    for (const b of barks) {
      const local = t - b;
      if (local >= 0 && local < 0.25) {
        const env = envelope(local, 0.005, 0.22);
        // 250-400 Hz tushuvchi pitch + shovqin
        const freq = lerp(380, 240, local / 0.25);
        const tone = Math.sin(2 * Math.PI * freq * local);
        const noise = (Math.random() * 2 - 1) * 0.3;
        sample += (tone * 0.7 + noise) * env;
      }
    }
    out[i] = sample * 18000;
  }
  return out;
}

/** Mushuk — "miyov" — past->baland pitch sweep + soft envelope */
function catMeow() {
  const dur = 1.2;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // 2 ta meow
    const local = (t % 0.6) / 0.6;
    if (local < 0.7) {
      // mi-yov shakli: 1) past pitch ko'tariladi, keyin tushadi
      const phase = local / 0.7;
      const pitch = phase < 0.4
        ? lerp(450, 700, phase / 0.4)
        : lerp(700, 480, (phase - 0.4) / 0.6);
      const env = envelope(local, 0.05, 0.5);
      const main = Math.sin(2 * Math.PI * pitch * local);
      const harm = Math.sin(2 * Math.PI * pitch * 2 * local) * 0.3;
      out[i] = (main + harm) * env * 18000;
    }
  }
  return out;
}

/** Qush — "chir chir" — baland qisqa chirplar */
function birdChirp() {
  const dur = 1.0;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Int16Array(n);
  const chirps = [0.0, 0.15, 0.3, 0.5, 0.65, 0.8];
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;
    for (const c of chirps) {
      const local = t - c;
      if (local >= 0 && local < 0.08) {
        // 2000 -> 3200 Hz sweep
        const phase = local / 0.08;
        const freq = lerp(2200, 3400, phase);
        const env = envelope(local, 0.005, 0.07);
        sample += Math.sin(2 * Math.PI * freq * local) * env;
      }
    }
    out[i] = sample * 14000;
  }
  return out;
}

/** Sigir — "mu-u-u" — past, uzun, ozgina vibrato */
function cowMoo() {
  const dur = 1.8;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    if (t < 1.5) {
      // 120 Hz base, vibrato +- 8 Hz @ 5 Hz
      const vibrato = Math.sin(2 * Math.PI * 5 * t) * 8;
      const freq = 110 + vibrato + Math.max(0, 30 - t * 20); // boshida bir oz baland
      const env = envelope(t, 0.15, 1.4);
      const main = Math.sin(2 * Math.PI * freq * t);
      const harm = Math.sin(2 * Math.PI * freq * 2 * t) * 0.4;
      const noise = (Math.random() * 2 - 1) * 0.05;
      out[i] = (main * 0.7 + harm + noise) * env * 16000;
    }
  }
  return out;
}

/** Qurbaqa — "qurr qurr" — past pulsatsiyali shovqin */
function frogCroak() {
  const dur = 1.3;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Int16Array(n);
  const croaks = [0.0, 0.5, 1.0];
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;
    for (const c of croaks) {
      const local = t - c;
      if (local >= 0 && local < 0.3) {
        const env = envelope(local, 0.02, 0.28);
        // 30 Hz amplitude modulation (qrr qrr pulsatsiya)
        const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * 30 * local);
        const tone = Math.sin(2 * Math.PI * 180 * local);
        const noise = (Math.random() * 2 - 1) * 0.7;
        sample += (tone * 0.5 + noise) * am * env;
      }
    }
    out[i] = sample * 16000;
  }
  return out;
}

/** Sher — "arrrr" — past, qattiq, uzun shovqin (growl) */
function lionRoar() {
  const dur = 2.0;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    if (t < 1.8) {
      // past freq + kuchli shovqin
      const freq = 85 + Math.sin(2 * Math.PI * 3 * t) * 6;
      const env = envelope(t, 0.2, 1.6);
      const main = Math.sin(2 * Math.PI * freq * t);
      const sub = Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.4;
      const noise = (Math.random() * 2 - 1) * 0.6;
      out[i] = (main * 0.5 + sub + noise) * env * 18000;
    }
  }
  return out;
}

// ─── Generate and write ────────────────────────────────────────────────

const animals = {
  dog: dogBark,
  cat: catMeow,
  bird: birdChirp,
  cow: cowMoo,
  frog: frogCroak,
  lion: lionRoar,
};

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

for (const [name, synth] of Object.entries(animals)) {
  const samples = synth();
  const wav = encodeWav(samples);
  const filePath = path.join(OUT, `${name}.wav`);
  fs.writeFileSync(filePath, wav);
  const kb = (wav.length / 1024).toFixed(1);
  console.log(`  ${name.padEnd(6)} ${kb.padStart(6)} KB  ${filePath}`);
}

console.log(`\n✓ ${Object.keys(animals).length} ta hayvon ovozi generatsiya qilindi`);
