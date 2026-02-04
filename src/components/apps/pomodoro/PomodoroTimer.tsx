'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODES = {
  work: { duration: 25 * 60, label: 'Work', color: 'stroke-accent-500' },
  shortBreak: { duration: 5 * 60, label: 'Short Break', color: 'stroke-success-500' },
  longBreak: { duration: 15 * 60, label: 'Long Break', color: 'stroke-success-600' },
};

const RING_RADIUS = 120;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeRemaining, setTimeRemaining] = useState(MODES.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const totalTime = MODES[mode].duration;
  const progress = timeRemaining / totalTime;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play beep sound
  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      for (let i = 0; i < 3; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        const startTime = ctx.currentTime + i * 0.2;
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      }
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, []);

  // Handle timer completion
  const handleComplete = useCallback(() => {
    playBeep();
    setIsRunning(false);

    if (mode === 'work') {
      const newSessions = sessions + 1;
      setSessions(newSessions);

      // After 4 work sessions, take a long break
      if (newSessions % 4 === 0) {
        setMode('longBreak');
        setTimeRemaining(MODES.longBreak.duration);
      } else {
        setMode('shortBreak');
        setTimeRemaining(MODES.shortBreak.duration);
      }
    } else {
      setMode('work');
      setTimeRemaining(MODES.work.duration);
    }
  }, [mode, sessions, playBeep]);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, handleComplete]);

  // Switch mode
  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeRemaining(MODES[newMode].duration);
    setIsRunning(false);
  };

  // Reset timer
  const reset = () => {
    setTimeRemaining(MODES[mode].duration);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold text-primary-900 mb-8">⏱️ Pomodoro Timer</h1>

      {/* Mode selector */}
      <div className="flex gap-2 mb-8">
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-2 text-sm font-medium rounded-button transition-colors ${
              mode === m
                ? 'bg-primary-900 text-white'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative w-[280px] h-[280px] mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
          {/* Background ring */}
          <circle
            cx="140"
            cy="140"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            className="stroke-primary-100"
          />
          {/* Progress ring */}
          <circle
            cx="140"
            cy="140"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`transition-all duration-1000 ${MODES[mode].color}`}
            style={{
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-primary-900 tabular-nums tracking-tight">
            {formatTime(timeRemaining)}
          </span>
          <span className="text-sm text-primary-400 mt-1">{MODES[mode].label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-8 py-3 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-button transition-colors"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary-100 hover:bg-primary-200 text-primary-600 font-semibold rounded-button transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Session dots */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-primary-400 mr-2">Sessions:</span>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < sessions % 4 ? 'bg-accent-500' : 'bg-primary-200'
            }`}
          />
        ))}
        {sessions >= 4 && (
          <span className="text-xs text-primary-500 ml-2">
            ({Math.floor(sessions / 4)} cycles)
          </span>
        )}
      </div>

      <p className="text-xs text-primary-400 mt-8 text-center max-w-sm">
        Work for 25 minutes, then take a 5-minute break. After 4 work sessions, take a 15-minute break.
      </p>
    </div>
  );
}
