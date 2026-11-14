export type NoiseColor = "white" | "pink" | "brown";

export const NOISE_OPTIONS: {
  value: NoiseColor;
  label: string;
  hint: string;
}[] = [
  { value: "white", label: "Trắng", hint: "Đều như tiếng quạt, xì xì" },
  { value: "pink", label: "Hồng", hint: "Êm hơn, như mưa rơi" },
  { value: "brown", label: "Nâu", hint: "Trầm, như sóng biển xa" },
];

// Spec §6.12: sleep timer off / 15 / 30 / 60 minutes, fading out over the last 10 s.
export const TIMER_OPTIONS = [0, 15, 30, 60] as const;
export const FADE_MS = 10_000;
export const BUFFER_SECONDS = 2;

const clamp = (x: number) => Math.max(-1, Math.min(1, x));

// Fills `out` with noise of the given colour, every sample in [-1, 1].
export function fillNoise(
  color: NoiseColor,
  out: Float32Array,
  random: () => number = Math.random,
): void {
  // Pink: Paul Kellet's economy filter. Brown: leaky integrator of white noise.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let last = 0;
  for (let i = 0; i < out.length; i++) {
    const white = random() * 2 - 1;
    if (color === "white") out[i] = white;
    else if (color === "pink") {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      out[i] = clamp((b0 + b1 + b2 + white * 0.1848) * 0.2);
    } else {
      last = (last + 0.02 * white) / 1.02;
      out[i] = clamp(last * 3.5);
    }
  }
}

// A loopable buffer: `length + blend` samples are generated and the extra tail is
// cross-faded into the head, so the last sample flows into the first with no click.
export function seamlessNoise(
  color: NoiseColor,
  length: number,
  blend: number,
  random: () => number = Math.random,
): Float32Array {
  const n = Math.max(1, Math.min(blend, Math.floor(length / 2)));
  const full = new Float32Array(length + n);
  fillNoise(color, full, random);
  const out = full.slice(0, length);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    out[i] = full[i] * t + full[length + i] * (1 - t);
  }
  return out;
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
