'use client';

import { useState, useCallback, useEffect } from 'react';

type Zone = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Phase =
  | 'menu'
  | 'shooting'
  | 'shot-result'
  | 'defending'
  | 'defend-result'
  | 'gameover';

const TOTAL_ROUNDS = 5;

const ZONE_ARROWS = ['↖', '↑', '↗', '←', '⬤', '→', '↙', '↓', '↘'];
const ZONE_NAMES = [
  'Top Left', 'Top Center', 'Top Right',
  'Mid Left', 'Center', 'Mid Right',
  'Bottom Left', 'Bottom Center', 'Bottom Right',
];

function randomZone(): Zone {
  return Math.floor(Math.random() * 9) as Zone;
}

interface GoalGridProps {
  onSelect?: (zone: Zone) => void;
  shotZone?: Zone | null;
  keeperZone?: Zone | null;
  isDefending?: boolean;
}

function GoalGrid({ onSelect, shotZone, keeperZone, isDefending = false }: GoalGridProps) {
  const isDisabled = !onSelect;
  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Crossbar */}
      <div className="h-3 bg-white rounded-t-sm shadow-md" />
      {/* Goal net */}
      <div className="border-x-4 border-b-4 border-white bg-sky-900/40 p-1.5 rounded-b-sm">
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }, (_, i) => {
            const zone = i as Zone;
            const isShot = shotZone === zone;
            const isKeeper = keeperZone === zone;
            const isBoth = isShot && isKeeper;

            let bgClass = 'bg-white/10 border-white/20';
            let emoji = ZONE_ARROWS[i];

            if (isBoth) {
              // Save: green when defending (good!), red when shooting (blocked)
              bgClass = isDefending ? 'bg-green-500/80 border-green-400' : 'bg-red-500/80 border-red-400';
              emoji = '🧤';
            } else if (isShot) {
              // Goal scored: red when defending (bad!), green when shooting (scored!)
              bgClass = isDefending ? 'bg-red-500/80 border-red-400' : 'bg-green-500/80 border-green-400';
              emoji = '⚽';
            } else if (isKeeper) {
              bgClass = 'bg-blue-500/80 border-blue-400';
              emoji = '🧤';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect?.(zone)}
                disabled={isDisabled}
                className={`
                  h-14 sm:h-16 text-xl sm:text-2xl font-bold rounded border transition-all duration-150
                  ${bgClass}
                  ${!isDisabled ? 'hover:bg-white/30 active:scale-95 cursor-pointer' : 'cursor-default'}
                  text-white
                `}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>
      {/* Goal posts shadow */}
      <div className="flex justify-between px-1">
        <div className="w-3 h-4 bg-white/30 rounded-b" />
        <div className="w-3 h-4 bg-white/30 rounded-b" />
      </div>
    </div>
  );
}

interface ScoreBoardProps {
  playerScore: number;
  cpuScore: number;
  currentRound: number;
  roundResults: { player: boolean; cpu: boolean }[];
  currentPlayerScored?: boolean | null;
  currentCpuScored?: boolean | null;
}

function ScoreBoard({ playerScore, cpuScore, currentRound, roundResults, currentPlayerScored, currentCpuScored }: ScoreBoardProps) {
  // Build the full dots array including the in-progress round if result is known
  const playerDots = [...roundResults.map(r => r.player), ...(currentPlayerScored !== null && currentPlayerScored !== undefined ? [currentPlayerScored] : [])];
  const cpuDots = [...roundResults.map(r => r.cpu), ...(currentCpuScored !== null && currentCpuScored !== undefined ? [currentCpuScored] : [])];

  return (
    <div className="flex items-center justify-between w-full max-w-xs mx-auto mb-4">
      <div className="text-center min-w-[80px]">
        <div className="text-xs text-white/60 mb-1 uppercase tracking-wide">You</div>
        <div className="text-5xl font-bold text-white leading-none">{playerScore}</div>
        <div className="flex gap-0.5 mt-2 justify-center">
          {playerDots.map((scored, i) => (
            <span key={i} className="text-base">{scored ? '⚽' : '❌'}</span>
          ))}
          {Array.from({ length: TOTAL_ROUNDS - playerDots.length }, (_, i) => (
            <span key={i} className="text-base opacity-20">⬜</span>
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className="text-white/50 text-xs font-medium uppercase tracking-widest">Round</div>
        <div className="text-2xl font-bold text-white/70">{Math.min(currentRound, TOTAL_ROUNDS)}<span className="text-white/30">/{TOTAL_ROUNDS}</span></div>
        <div className="text-white/30 text-xs">vs</div>
      </div>

      <div className="text-center min-w-[80px]">
        <div className="text-xs text-white/60 mb-1 uppercase tracking-wide">CPU</div>
        <div className="text-5xl font-bold text-white leading-none">{cpuScore}</div>
        <div className="flex gap-0.5 mt-2 justify-center">
          {cpuDots.map((scored, i) => (
            <span key={i} className="text-base">{scored ? '⚽' : '🧤'}</span>
          ))}
          {Array.from({ length: TOTAL_ROUNDS - cpuDots.length }, (_, i) => (
            <span key={i} className="text-base opacity-20">⬜</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PenaltyShootoutApp() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResults, setRoundResults] = useState<{ player: boolean; cpu: boolean }[]>([]);

  const [playerShotZone, setPlayerShotZone] = useState<Zone | null>(null);
  const [keeperZone, setKeeperZone] = useState<Zone | null>(null);
  const [cpuShotZone, setCpuShotZone] = useState<Zone | null>(null);
  const [playerDiveZone, setPlayerDiveZone] = useState<Zone | null>(null);
  const [playerScoredThisRound, setPlayerScoredThisRound] = useState(false);
  const [cpuScoredThisRound, setCpuScoredThisRound] = useState(false);

  const startGame = useCallback(() => {
    setPhase('shooting');
    setPlayerScore(0);
    setCpuScore(0);
    setCurrentRound(1);
    setRoundResults([]);
    setPlayerShotZone(null);
    setKeeperZone(null);
    setCpuShotZone(null);
    setPlayerDiveZone(null);
    setPlayerScoredThisRound(false);
    setCpuScoredThisRound(false);
  }, []);

  const handlePlayerShoot = useCallback((zone: Zone) => {
    if (phase !== 'shooting') return;
    const keeper = randomZone();
    const scored = keeper !== zone;
    setPlayerShotZone(zone);
    setKeeperZone(keeper);
    setPlayerScoredThisRound(scored);
    if (scored) setPlayerScore(s => s + 1);
    setPhase('shot-result');
  }, [phase]);

  const proceedToDefend = useCallback(() => {
    setCpuShotZone(randomZone());
    setPlayerDiveZone(null);
    setPhase('defending');
  }, []);

  const handlePlayerDefend = useCallback((zone: Zone) => {
    if (phase !== 'defending' || cpuShotZone === null) return;
    const saved = zone === cpuShotZone;
    setPlayerDiveZone(zone);
    setCpuScoredThisRound(!saved);
    if (!saved) setCpuScore(s => s + 1);
    setPhase('defend-result');
  }, [phase, cpuShotZone]);

  // Auto-advance from shot-result → defending after 1.5s
  useEffect(() => {
    if (phase !== 'shot-result') return;
    const timer = setTimeout(proceedToDefend, 1500);
    return () => clearTimeout(timer);
  }, [phase, proceedToDefend]);

  const proceedToNextRound = useCallback(() => {
    const newResults = [...roundResults, { player: playerScoredThisRound, cpu: cpuScoredThisRound }];
    setRoundResults(newResults);
    if (currentRound >= TOTAL_ROUNDS) {
      setPhase('gameover');
    } else {
      setCurrentRound(r => r + 1);
      setPlayerShotZone(null);
      setKeeperZone(null);
      setCpuShotZone(null);
      setPlayerDiveZone(null);
      setPlayerScoredThisRound(false);
      setCpuScoredThisRound(false);
      setPhase('shooting');
    }
  }, [roundResults, playerScoredThisRound, cpuScoredThisRound, currentRound]);

  return (
    <div className="min-h-[640px] bg-gradient-to-b from-green-700 via-green-800 to-green-900 rounded-2xl p-5 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white mb-1 drop-shadow">⚽ Penalty Shootout</h1>

      {/* MENU */}
      {phase === 'menu' && (
        <div className="flex flex-col items-center gap-5 mt-6 text-center max-w-xs">
          <div className="text-7xl drop-shadow-lg">⚽</div>
          <p className="text-white/80 text-base leading-relaxed">
            Take <strong className="text-white">5 penalties</strong> and save <strong className="text-white">5 shots</strong>.
            Click a zone in the goal to shoot or dive!
          </p>
          <div className="bg-black/20 rounded-xl p-4 text-white/70 text-sm w-full text-left space-y-1.5">
            <div className="font-bold text-white text-base mb-2">How to play</div>
            <div>🎯 Click a zone to aim your shot</div>
            <div>🧤 The keeper dives to a random zone</div>
            <div className="flex gap-3">
              <span>⚽ = Goal</span>
              <span>🧤 = Saved</span>
            </div>
            <div>Then defend against the CPU!</div>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="bg-white text-green-800 font-bold text-xl px-12 py-4 rounded-2xl hover:bg-green-50 active:scale-95 transition-all shadow-xl w-full"
          >
            Kick Off! 🏟️
          </button>
        </div>
      )}

      {/* SHOOTING PHASE */}
      {(phase === 'shooting' || phase === 'shot-result') && (
        <div className="w-full max-w-sm flex flex-col items-center gap-3 mt-2">
          <ScoreBoard
            playerScore={playerScore}
            cpuScore={cpuScore}
            currentRound={currentRound}
            roundResults={roundResults}
            currentPlayerScored={phase === 'shot-result' ? playerScoredThisRound : null}
          />

          <div className="text-center min-h-[52px] flex flex-col justify-center">
            {phase === 'shooting' ? (
              <>
                <div className="text-white/70 text-sm uppercase tracking-widest mb-1">Round {currentRound}</div>
                <div className="text-yellow-300 font-bold text-xl">🎯 Choose where to shoot!</div>
              </>
            ) : playerScoredThisRound ? (
              <div className="text-green-300 text-3xl font-black animate-bounce drop-shadow">⚽ GOAL!</div>
            ) : (
              <div className="text-red-300 text-3xl font-black animate-bounce drop-shadow">🧤 SAVED!</div>
            )}
          </div>

          <GoalGrid
            onSelect={phase === 'shooting' ? handlePlayerShoot : undefined}
            shotZone={phase === 'shot-result' ? playerShotZone : undefined}
            keeperZone={phase === 'shot-result' ? keeperZone : undefined}
          />

          {phase === 'shot-result' && (
            <p className="text-white/50 text-xs text-center">
              {playerScoredThisRound
                ? `You aimed ${ZONE_NAMES[playerShotZone!]}. Keeper dove ${ZONE_NAMES[keeperZone!]}.`
                : `You aimed ${ZONE_NAMES[playerShotZone!]}. Keeper dove ${ZONE_NAMES[keeperZone!]} — Blocked!`}
              <span className="block mt-1 text-white/30">Defending next…</span>
            </p>
          )}
        </div>
      )}

      {/* DEFENDING PHASE */}
      {(phase === 'defending' || phase === 'defend-result') && (
        <div className="w-full max-w-sm flex flex-col items-center gap-3 mt-2">
          <ScoreBoard
            playerScore={playerScore}
            cpuScore={cpuScore}
            currentRound={currentRound}
            roundResults={roundResults}
            currentPlayerScored={phase === 'defend-result' ? playerScoredThisRound : null}
            currentCpuScored={phase === 'defend-result' ? cpuScoredThisRound : null}
          />

          <div className="text-center min-h-[52px] flex flex-col justify-center">
            {phase === 'defending' ? (
              <>
                <div className="text-white/70 text-sm uppercase tracking-widest mb-1">Round {currentRound}</div>
                <div className="text-yellow-300 font-bold text-xl">🧤 Choose where to dive!</div>
              </>
            ) : !cpuScoredThisRound ? (
              <div className="text-green-300 text-3xl font-black animate-bounce drop-shadow">🧤 GREAT SAVE!</div>
            ) : (
              <div className="text-red-300 text-3xl font-black animate-bounce drop-shadow">⚽ CPU SCORED!</div>
            )}
          </div>

          <GoalGrid
            onSelect={phase === 'defending' ? handlePlayerDefend : undefined}
            shotZone={phase === 'defend-result' ? cpuShotZone : undefined}
            keeperZone={phase === 'defend-result' ? playerDiveZone : undefined}
            isDefending
          />

          {phase === 'defend-result' && (
            <>
              <p className="text-white/50 text-xs text-center">
                {!cpuScoredThisRound
                  ? `CPU aimed ${ZONE_NAMES[cpuShotZone!]}. You dove ${ZONE_NAMES[playerDiveZone!]} — Brilliant save!`
                  : `CPU aimed ${ZONE_NAMES[cpuShotZone!]}. You dove ${ZONE_NAMES[playerDiveZone!]} — CPU scored!`}
              </p>
              <button
                type="button"
                onClick={proceedToNextRound}
                className="mt-1 bg-white text-green-800 font-bold px-8 py-3 rounded-xl hover:bg-green-50 active:scale-95 transition-all shadow-lg w-full"
              >
                {currentRound >= TOTAL_ROUNDS ? 'See Results 🏆' : `Round ${currentRound + 1} →`}
              </button>
            </>
          )}
        </div>
      )}

      {/* GAME OVER */}
      {phase === 'gameover' && (
        <div className="flex flex-col items-center gap-4 mt-4 text-center w-full max-w-sm">
          <div className="text-6xl drop-shadow-lg">
            {playerScore > cpuScore ? '🏆' : playerScore < cpuScore ? '😢' : '🤝'}
          </div>
          <div className="text-4xl font-black text-white drop-shadow">
            {playerScore > cpuScore ? 'You Win!' : playerScore < cpuScore ? 'CPU Wins!' : "It's a Draw!"}
          </div>

          <div className="flex gap-10 bg-black/20 rounded-2xl px-10 py-5 w-full justify-center">
            <div className="text-center">
              <div className="text-white/50 text-xs uppercase tracking-wide mb-1">You</div>
              <div className="text-5xl font-black text-white">{playerScore}</div>
            </div>
            <div className="text-white/30 text-4xl self-center font-light">—</div>
            <div className="text-center">
              <div className="text-white/50 text-xs uppercase tracking-wide mb-1">CPU</div>
              <div className="text-5xl font-black text-white">{cpuScore}</div>
            </div>
          </div>

          {/* Round breakdown */}
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
            className="bg-white text-green-800 font-bold text-xl px-10 py-4 rounded-2xl hover:bg-green-50 active:scale-95 transition-all shadow-xl w-full"
          >
            Play Again ⚽
          </button>
        </div>
      )}
    </div>
  );
}
