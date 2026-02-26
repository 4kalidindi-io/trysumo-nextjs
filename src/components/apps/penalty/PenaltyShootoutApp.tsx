'use client';

import { useState, useCallback, useEffect } from 'react';

type Zone = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Phase =
  | 'menu'
  | 'player-aim'
  | 'player-shooting'
  | 'player-result'
  | 'cpu-aim'
  | 'cpu-shooting'
  | 'cpu-result'
  | 'gameover';

const TOTAL_ROUNDS = 5;

function rng(): Zone {
  return Math.floor(Math.random() * 9) as Zone;
}

// Keeper dive CSS transforms per zone (3×3 grid: TL TC TR / ML MC MR / BL BC BR)
const DIVE: string[] = [
  'translate(-58px,-32px) rotate(-35deg)',
  'translateY(-52px)',
  'translate(58px,-32px) rotate(35deg)',
  'translate(-75px,2px) rotate(-20deg)',
  'translate(0,0) scale(1.05)',
  'translate(75px,2px) rotate(20deg)',
  'translate(-58px,22px) rotate(-30deg)',
  'translateY(22px)',
  'translate(58px,22px) rotate(30deg)',
];

// Ball target positions as [left%, top%] within the 380px game container
// Goal spans ~x:12-88%, y:3-30%
const BALL_TARGETS: [number, number][] = [
  [26, 8],  [50, 7],  [74, 8],
  [26, 16], [50, 16], [74, 16],
  [26, 24], [50, 24], [74, 24],
];
const BALL_START: [number, number] = [50, 73];

// ─── SVG Characters ───────────────────────────────────────────────────────────

function Striker({ color, kicking }: { color: string; kicking: boolean }) {
  return (
    <svg
      width="44" height="66" viewBox="0 0 44 66" fill="none"
      style={{ transform: kicking ? 'rotate(-12deg) translateY(-5px)' : 'none', transition: 'transform 0.15s' }}
    >
      {/* head */}
      <circle cx="22" cy="9" r="8" fill={color} />
      {/* body */}
      <line x1="22" y1="17" x2="22" y2="40" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* left arm */}
      <line x1="22" y1="25" x2="6" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* right arm */}
      <line x1="22" y1="25" x2="38" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* left leg */}
      <line x1="22" y1="40" x2="11" y2="60" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* right leg — raised when kicking */}
      <line
        x1="22" y1="40"
        x2={kicking ? '42' : '33'} y2={kicking ? '48' : '60'}
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
    </svg>
  );
}

function Goalkeeper({ color, diveZone }: { color: string; diveZone: Zone | null }) {
  const transform = diveZone !== null ? DIVE[diveZone] : 'translate(0,0)';
  return (
    <div style={{ transform, transition: 'transform 0.38s cubic-bezier(0.1,0,0.2,1)', display: 'inline-block' }}>
      <svg width="66" height="60" viewBox="0 0 66 60" fill="none">
        {/* head */}
        <circle cx="33" cy="9" r="8" fill={color} />
        {/* body */}
        <line x1="33" y1="17" x2="33" y2="39" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {/* left arm spread */}
        <line x1="33" y1="23" x2="4" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {/* right arm spread */}
        <line x1="33" y1="23" x2="62" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {/* gloves */}
        <rect x="0" y="26" width="9" height="8" rx="4" fill={color} />
        <rect x="57" y="26" width="9" height="8" rx="4" fill={color} />
        {/* legs */}
        <line x1="33" y1="39" x2="21" y2="58" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="33" y1="39" x2="45" y2="58" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PenaltyShootoutApp() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [round, setRound] = useState(1);
  const [roundResults, setRoundResults] = useState<{ player: boolean; cpu: boolean }[]>([]);

  const [playerShotZone, setPlayerShotZone] = useState<Zone | null>(null);
  const [cpuKeeperZone, setCpuKeeperZone] = useState<Zone | null>(null);
  const [cpuShotZone, setCpuShotZone] = useState<Zone | null>(null);
  const [playerDiveZone, setPlayerDiveZone] = useState<Zone | null>(null);
  const [playerScoredThisRound, setPlayerScoredThisRound] = useState(false);
  const [cpuScoredThisRound, setCpuScoredThisRound] = useState(false);

  // Fading state for perspective switch
  const [fading, setFading] = useState(false);

  const isPlayerTurn = phase === 'player-aim' || phase === 'player-shooting' || phase === 'player-result';
  const isCpuTurn    = phase === 'cpu-aim'    || phase === 'cpu-shooting'    || phase === 'cpu-result';
  const isShooting   = phase === 'player-shooting' || phase === 'cpu-shooting';
  const isResult     = phase === 'player-result'   || phase === 'cpu-result';
  const isKicking    = isShooting || isResult;
  const isAiming     = phase === 'player-aim' || phase === 'cpu-aim';
  const showBall     = phase !== 'menu' && phase !== 'gameover';

  // Team colours
  const BLUE = '#3b82f6';
  const RED  = '#ef4444';
  const strikerColor = isPlayerTurn ? BLUE : RED;
  const keeperColor  = isPlayerTurn ? RED  : BLUE;

  // Which keeper zone to animate
  const activeKeeperZone: Zone | null = isPlayerTurn ? cpuKeeperZone : playerDiveZone;
  // Which shot zone for ball
  const activeShotZone: Zone | null   = isPlayerTurn ? playerShotZone : cpuShotZone;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    setPhase('player-aim');
    setPlayerScore(0); setCpuScore(0);
    setRound(1); setRoundResults([]);
    setPlayerShotZone(null); setCpuKeeperZone(null);
    setCpuShotZone(null);    setPlayerDiveZone(null);
    setPlayerScoredThisRound(false); setCpuScoredThisRound(false);
  }, []);

  const handlePlayerShoot = useCallback((zone: Zone) => {
    if (phase !== 'player-aim') return;
    const keeper = rng();
    const scored = keeper !== zone;
    setPlayerShotZone(zone);
    setCpuKeeperZone(keeper);
    setPlayerScoredThisRound(scored);
    if (scored) setPlayerScore(s => s + 1);
    setPhase('player-shooting');
  }, [phase]);

  const handlePlayerDefend = useCallback((zone: Zone) => {
    if (phase !== 'cpu-aim') return;
    const cpuShot = rng();
    const saved = zone === cpuShot;
    setPlayerDiveZone(zone);
    setCpuShotZone(cpuShot);
    setCpuScoredThisRound(!saved);
    if (!saved) setCpuScore(s => s + 1);
    setPhase('cpu-shooting');
  }, [phase]);

  const nextRound = useCallback(() => {
    const newResults = [...roundResults, { player: playerScoredThisRound, cpu: cpuScoredThisRound }];
    setRoundResults(newResults);
    if (round >= TOTAL_ROUNDS) {
      setPhase('gameover');
    } else {
      setRound(r => r + 1);
      setPlayerShotZone(null); setCpuKeeperZone(null);
      setCpuShotZone(null);    setPlayerDiveZone(null);
      setPlayerScoredThisRound(false); setCpuScoredThisRound(false);
      setPhase('player-aim');
    }
  }, [roundResults, playerScoredThisRound, cpuScoredThisRound, round]);

  // ── Auto-advance timers ───────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'player-shooting') return;
    const t = setTimeout(() => setPhase('player-result'), 700);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'player-result') return;
    const t = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setCpuShotZone(null);
        setPlayerDiveZone(null);
        setPhase('cpu-aim');
        setFading(false);
      }, 350);
    }, 1800);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'cpu-shooting') return;
    const t = setTimeout(() => setPhase('cpu-result'), 700);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Ball position ─────────────────────────────────────────────────────────

  const getBallStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: 32, height: 32,
      fontSize: '1.9rem', lineHeight: '32px', textAlign: 'center',
      transform: 'translate(-50%, -50%)',
      zIndex: 20, pointerEvents: 'none',
    };

    if (isAiming || (!isPlayerTurn && !isCpuTurn)) {
      return { ...base, left: `${BALL_START[0]}%`, top: `${BALL_START[1]}%`, transition: 'none' };
    }
    if (isShooting || isResult) {
      const [tx, ty] = activeShotZone !== null ? BALL_TARGETS[activeShotZone] : BALL_START;
      return { ...base, left: `${tx}%`, top: `${ty}%`, transition: 'left 0.55s ease-in, top 0.48s ease-in' };
    }
    return { ...base, left: `${BALL_START[0]}%`, top: `${BALL_START[1]}%`, transition: 'none' };
  };

  const onZoneClick = phase === 'player-aim'
    ? handlePlayerShoot
    : phase === 'cpu-aim'
    ? handlePlayerDefend
    : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gradient-to-b from-green-700 via-green-800 to-green-900 rounded-2xl overflow-hidden select-none">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-0">
        <h1 className="text-2xl font-black text-white text-center drop-shadow mb-2">⚽ Penalty Shootout</h1>

        {phase !== 'menu' && phase !== 'gameover' && (
          <div className="flex items-center justify-between bg-black/30 rounded-xl px-6 py-2 mb-3">
            <div className="text-center">
              <div className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">YOU</div>
              <div className="text-3xl font-black text-white leading-none">{playerScore}</div>
            </div>
            <div className="text-center">
              <div className="text-white/40 text-[10px] uppercase tracking-widest">
                Round {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
              </div>
              <div className="text-white/30 font-bold text-lg">vs</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-red-300 uppercase tracking-widest font-bold">CPU</div>
              <div className="text-3xl font-black text-white leading-none">{cpuScore}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── MENU ── */}
      {phase === 'menu' && (
        <div className="flex flex-col items-center gap-5 px-6 pb-6 text-center">
          <div className="flex items-end justify-center gap-10 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-2xl p-3">
                <Striker color="#93c5fd" kicking={false} />
              </div>
              <span className="text-blue-300 text-xs font-black uppercase tracking-widest">You</span>
            </div>
            <div className="text-white/30 text-2xl self-center pb-6">vs</div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-3">
                <Striker color="#fca5a5" kicking={false} />
              </div>
              <span className="text-red-300 text-xs font-black uppercase tracking-widest">CPU</span>
            </div>
          </div>
          <p className="text-white/75 text-sm leading-relaxed max-w-xs">
            Take <strong className="text-white">5 penalties</strong>, then save <strong className="text-white">5 shots</strong>.<br />
            Click inside the goal to aim or dive!
          </p>
          <div className="bg-black/20 rounded-xl p-3 w-full text-left text-white/60 text-xs space-y-1.5 max-w-xs">
            <div className="text-white font-bold text-sm mb-2">How to play</div>
            <div>🎯 Click a zone in the goal to shoot</div>
            <div>🧤 Goalkeeper dives randomly</div>
            <div>🔄 Then switch — CPU shoots, you dive!</div>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="bg-white text-green-800 font-black text-xl px-12 py-4 rounded-2xl hover:bg-green-50 active:scale-95 transition-all shadow-xl w-full max-w-xs"
          >
            Kick Off! 🏟️
          </button>
        </div>
      )}

      {/* ── GAME SCENE ── */}
      {phase !== 'menu' && phase !== 'gameover' && (
        <div
          className="relative mx-4 mb-4 rounded-xl overflow-hidden"
          style={{ height: 390, opacity: fading ? 0 : 1, transition: 'opacity 0.35s ease' }}
        >
          {/* Grass */}
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{
              background: 'repeating-linear-gradient(180deg,#15803d 0px,#15803d 22px,#166534 22px,#166534 44px)'
            }} />
            {/* Penalty area at bottom */}
            <div className="absolute border-2 border-white/15 rounded-sm"
              style={{ bottom: '6%', left: '18%', right: '18%', height: '22%' }} />
            {/* Penalty spot */}
            <div className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{ bottom: '22%', left: 'calc(50% - 4px)' }} />
            {/* Center line */}
            <div className="absolute border-t-2 border-white/15"
              style={{ top: '55%', left: '5%', right: '5%' }} />
            {/* Center circle */}
            <div className="absolute border-2 border-white/15 rounded-full"
              style={{ width: 80, height: 55, top: '40%', left: 'calc(50% - 40px)' }} />
          </div>

          {/* ── GOAL ── */}
          <div className="absolute" style={{ top: 12, left: '10%', width: '80%', height: 108 }}>
            {/* Frame + net */}
            <div
              className="absolute inset-0 border-4 border-white rounded-sm"
              style={{ borderBottom: 'none', background: 'rgba(135,206,235,0.08)' }}
            >
              {/* Net grid */}
              <div className="absolute inset-0" style={{
                backgroundImage: [
                  'repeating-linear-gradient(0deg,rgba(255,255,255,0.13) 0,rgba(255,255,255,0.13) 1px,transparent 1px,transparent 14px)',
                  'repeating-linear-gradient(90deg,rgba(255,255,255,0.13) 0,rgba(255,255,255,0.13) 1px,transparent 1px,transparent 14px)',
                ].join(','),
              }} />
            </div>

            {/* Clickable zone grid (inside goal frame, above keeper) */}
            {isAiming && onZoneClick && (
              <div className="absolute inset-0 grid grid-cols-3 z-30">
                {Array.from({ length: 9 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onZoneClick(i as Zone)}
                    className="hover:bg-white/20 active:bg-white/40 transition-colors cursor-crosshair border border-white/10"
                    aria-label={`Zone ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Keeper */}
            <div
              className="absolute"
              style={{ bottom: 2, left: '50%', transform: 'translateX(-50%)', zIndex: 15 }}
            >
              <Goalkeeper color={keeperColor} diveZone={isKicking ? activeKeeperZone : null} />
            </div>

            {/* Keeper team label */}
            <div className="absolute -top-5 w-full text-center">
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: keeperColor }}
              >
                {isPlayerTurn ? 'CPU Goalkeeper' : 'Your Goalkeeper'}
              </span>
            </div>
          </div>

          {/* Ball */}
          {showBall && (
            <div style={getBallStyle()}>⚽</div>
          )}

          {/* Striker */}
          <div
            className="absolute flex flex-col items-center gap-0.5"
            style={{ bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
          >
            <Striker color={strikerColor} kicking={isKicking} />
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: strikerColor }}
            >
              {isPlayerTurn ? 'You' : 'CPU'}
            </span>
          </div>

          {/* ── Phase Instructions / Results overlay ── */}
          <div
            className="absolute left-0 right-0 text-center"
            style={{ bottom: 100, zIndex: 25 }}
          >
            {phase === 'player-aim' && (
              <span className="inline-block bg-yellow-400/90 text-black font-black text-sm px-5 py-1.5 rounded-full shadow-lg">
                🎯 Click goal zone to shoot!
              </span>
            )}
            {phase === 'cpu-aim' && (
              <span className="inline-block bg-blue-500/90 text-white font-black text-sm px-5 py-1.5 rounded-full shadow-lg">
                🧤 Click goal zone to dive!
              </span>
            )}
            {phase === 'player-result' && (
              <span className={`inline-block font-black text-2xl px-6 py-2 rounded-full shadow-xl animate-bounce ${playerScoredThisRound ? 'bg-green-400/90 text-white' : 'bg-red-400/90 text-white'}`}>
                {playerScoredThisRound ? '⚽ GOAL!' : '🧤 SAVED!'}
              </span>
            )}
            {phase === 'cpu-result' && (
              <span className={`inline-block font-black text-2xl px-6 py-2 rounded-full shadow-xl animate-bounce ${!cpuScoredThisRound ? 'bg-green-400/90 text-white' : 'bg-red-400/90 text-white'}`}>
                {!cpuScoredThisRound ? '🧤 GREAT SAVE!' : '⚽ CPU SCORED!'}
              </span>
            )}
          </div>

          {/* Next round / See results button */}
          {phase === 'cpu-result' && (
            <div className="absolute bottom-2 left-2 right-2" style={{ zIndex: 30 }}>
              <button
                type="button"
                onClick={nextRound}
                className="w-full bg-white text-green-800 font-black text-base py-3 rounded-xl hover:bg-green-50 active:scale-95 transition-all shadow-lg"
              >
                {round >= TOTAL_ROUNDS ? 'See Results 🏆' : `Round ${round + 1} →`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── GAME OVER ── */}
      {phase === 'gameover' && (
        <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center">
          <div className="text-6xl drop-shadow-lg mt-2">
            {playerScore > cpuScore ? '🏆' : playerScore < cpuScore ? '😢' : '🤝'}
          </div>
          <div className="text-4xl font-black text-white drop-shadow">
            {playerScore > cpuScore ? 'You Win!' : playerScore < cpuScore ? 'CPU Wins!' : "It's a Draw!"}
          </div>

          <div className="flex gap-10 bg-black/30 rounded-2xl px-10 py-5 w-full justify-center">
            <div className="text-center">
              <div className="text-blue-300 text-xs uppercase tracking-wide mb-1">You</div>
              <div className="text-5xl font-black text-white">{playerScore}</div>
            </div>
            <div className="text-white/30 text-4xl self-center font-light">—</div>
            <div className="text-center">
              <div className="text-red-300 text-xs uppercase tracking-wide mb-1">CPU</div>
              <div className="text-5xl font-black text-white">{cpuScore}</div>
            </div>
          </div>

          <div className="w-full bg-black/20 rounded-xl p-4 text-sm">
            <div className="font-bold text-white mb-3 text-left">Round Summary</div>
            {roundResults.map((r, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/10 last:border-0 text-white/70">
                <span className="text-white/40 text-xs">Round {i + 1}</span>
                <div className="flex gap-4 text-xs">
                  <span>{r.player ? '⚽ Scored' : '❌ Missed'}</span>
                  <span className="text-white/20">|</span>
                  <span>CPU: {r.cpu ? '⚽ Scored' : '🧤 Saved'}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startGame}
            className="bg-white text-green-800 font-black text-xl px-10 py-4 rounded-2xl hover:bg-green-50 active:scale-95 transition-all shadow-xl w-full"
          >
            Play Again ⚽
          </button>
        </div>
      )}
    </div>
  );
}
