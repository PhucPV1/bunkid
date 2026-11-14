"use client";

import { useEffect, useRef, useState } from "react";
import {
  BUFFER_SECONDS,
  FADE_MS,
  formatRemaining,
  NOISE_OPTIONS,
  seamlessNoise,
  TIMER_OPTIONS,
  type NoiseColor,
} from "@/lib/rules/noise";

type Player = {
  context: AudioContext;
  gain: GainNode;
  // Audio-clock time (s) when the sleep timer ends, or null without a timer.
  end: number | null;
};

// Safari 16.4+: "playback" keeps sound on when the silent switch is on (spec §6.12).
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const FADE_S = FADE_MS / 1000;

// Holds `volume` until 10 s before the end, then ramps to 0 on the audio clock,
// so the fade still happens while the page's own timers are paused (locked screen).
function scheduleVolume(player: Player, volume: number) {
  const { context, gain, end } = player;
  const now = context.currentTime;
  gain.gain.cancelScheduledValues(now);
  if (end === null || end - now > FADE_S) {
    gain.gain.setValueAtTime(volume, now);
    if (end !== null) {
      gain.gain.setValueAtTime(volume, end - FADE_S);
      gain.gain.linearRampToValueAtTime(0, end);
    }
  } else {
    gain.gain.setValueAtTime(volume * ((end - now) / FADE_S), now);
    gain.gain.linearRampToValueAtTime(0, end);
  }
}

export function NoiseScreen() {
  const [color, setColor] = useState<NoiseColor>("white");
  const [volume, setVolume] = useState(0.5);
  const [minutes, setMinutes] = useState<number>(30);
  const [playing, setPlaying] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const player = useRef<Player | null>(null);
  const endsAt = useRef<number | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  function stop() {
    const current = player.current;
    player.current = null;
    endsAt.current = null;
    setPlaying(false);
    setRemaining(null);
    if (current) void current.context.close();
  }

  function start(nextColor: NoiseColor, nextMinutes: number) {
    stop();
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = "playback";
    const context = new AudioContext();
    // Inside the tap, so iOS lets it start even if it was created suspended.
    void context.resume();
    const length = context.sampleRate * BUFFER_SECONDS;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    buffer
      .getChannelData(0)
      .set(
        seamlessNoise(nextColor, length, Math.floor(context.sampleRate * 0.05)),
      );
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = context.createGain();
    source.connect(gain).connect(context.destination);
    const end = nextMinutes > 0 ? context.currentTime + nextMinutes * 60 : null;
    const next: Player = { context, gain, end };
    scheduleVolume(next, volumeRef.current);
    source.start();
    if (end !== null) source.stop(end);
    source.onended = () => {
      if (player.current === next) stop();
    };
    context.onstatechange = () => {
      if (player.current === next) setInterrupted(context.state !== "running");
    };
    player.current = next;
    endsAt.current = nextMinutes > 0 ? Date.now() + nextMinutes * 60_000 : null;
    setRemaining(nextMinutes > 0 ? nextMinutes * 60_000 : null);
    setInterrupted(false);
    setPlaying(true);
  }

  // Countdown text only; the fade and stop are scheduled on the audio clock.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const end = endsAt.current;
      if (end === null) return;
      const left = end - Date.now();
      if (left <= 0) stop();
      else setRemaining(left);
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (player.current) scheduleVolume(player.current, volume);
  }, [volume]);

  useEffect(() => stop, []);

  const pill = (active: boolean) =>
    `min-h-11 flex-1 rounded-xl border px-2 ${active ? "border-accent bg-accent-soft text-accent-ink" : ""}`;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-4">
      <h1 className="text-2xl font-semibold">Tiếng ồn trắng</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Loại âm</h2>
        <div className="flex gap-2">
          {NOISE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={color === option.value}
              onClick={() => {
                setColor(option.value);
                if (playing) start(option.value, minutes);
              }}
              className={pill(color === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">
          {NOISE_OPTIONS.find((o) => o.value === color)?.hint}
        </p>
      </section>
      <label className="flex flex-col gap-2">
        <span className="text-lg font-medium">Âm lượng</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="min-h-11 accent-accent"
        />
      </label>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Hẹn giờ tắt</h2>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={minutes === option}
              onClick={() => {
                setMinutes(option);
                if (playing) start(color, option);
              }}
              className={pill(minutes === option)}
            >
              {option === 0 ? "Không" : `${option} phút`}
            </button>
          ))}
        </div>
      </section>
      <button
        type="button"
        onClick={() => (playing ? stop() : start(color, minutes))}
        className={`min-h-14 rounded-2xl text-lg font-semibold ${playing ? "bg-soft" : "bg-accent text-on-accent"}`}
      >
        {playing ? "Dừng" : "Phát"}
      </button>
      {playing && (
        <p role="status" className="text-center text-muted">
          {interrupted
            ? "Âm đang bị ngắt. Bấm Dừng rồi Phát để chạy lại."
            : remaining === null
              ? "Đang phát, không hẹn giờ tắt."
              : `Tắt sau ${formatRemaining(remaining)}`}
        </p>
      )}
      <p className="text-sm text-muted">
        Đặt điện thoại cách xa bé ít nhất 2 m, để âm lượng vừa đủ nghe. iPhone
        có thể dừng âm khi khóa màn hình; nếu vậy, để màn hình sáng với độ sáng
        thấp.
      </p>
    </main>
  );
}
