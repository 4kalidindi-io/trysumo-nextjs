'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type GameMode = 'menu' | 'single' | 'two-player';
type PowerUpType = 'paddle-grow' | 'paddle-shrink' | 'ball-fast' | 'ball-slow';

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
}

interface GameState {
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  ballSpeed: number;
  paddle1Y: number;
  paddle2Y: number;
  paddle1Height: number;
  paddle2Height: number;
  score1: number;
  score2: number;
  powerUp: PowerUp | null;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 12;
const DEFAULT_PADDLE_HEIGHT = 80;
const BALL_RADIUS = 8;
const DEFAULT_BALL_SPEED = 4;
const PADDLE_SPEED = 8;
const AI_SPEED = 5;
const WINNING_SCORE = 7;

const POWER_UP_COLORS: Record<PowerUpType, string> = {
  'paddle-grow': '#4ECDC4',
  'paddle-shrink': '#FF6B6B',
  'ball-fast': '#F7DC6F',
  'ball-slow': '#BB8FCE',
};

const POWER_UP_ICONS: Record<PowerUpType, string> = {
  'paddle-grow': '↕+',
  'paddle-shrink': '↕-',
  'ball-fast': '⚡',
  'ball-slow': '🐢',
};

export default function ModernPongApp() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number | null>(null);

  const initGame = useCallback(() => {
    gameStateRef.current = {
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballVX: DEFAULT_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      ballVY: (Math.random() - 0.5) * DEFAULT_BALL_SPEED,
      ballSpeed: DEFAULT_BALL_SPEED,
      paddle1Y: CANVAS_HEIGHT / 2 - DEFAULT_PADDLE_HEIGHT / 2,
      paddle2Y: CANVAS_HEIGHT / 2 - DEFAULT_PADDLE_HEIGHT / 2,
      paddle1Height: DEFAULT_PADDLE_HEIGHT,
      paddle2Height: DEFAULT_PADDLE_HEIGHT,
      score1: 0,
      score2: 0,
      powerUp: null,
    };
    setWinner(null);
    setIsPaused(false);
  }, []);

  const resetBall = useCallback((direction: number) => {
    if (!gameStateRef.current) return;
    const state = gameStateRef.current;
    state.ballX = CANVAS_WIDTH / 2;
    state.ballY = CANVAS_HEIGHT / 2;
    state.ballSpeed = DEFAULT_BALL_SPEED;
    state.ballVX = state.ballSpeed * direction;
    state.ballVY = (Math.random() - 0.5) * state.ballSpeed;
  }, []);

  const spawnPowerUp = useCallback(() => {
    if (!gameStateRef.current || gameStateRef.current.powerUp) return;

    if (Math.random() < 0.005) {
      const types: PowerUpType[] = ['paddle-grow', 'paddle-shrink', 'ball-fast', 'ball-slow'];
      gameStateRef.current.powerUp = {
        x: CANVAS_WIDTH / 4 + Math.random() * (CANVAS_WIDTH / 2),
        y: 50 + Math.random() * (CANVAS_HEIGHT - 100),
        type: types[Math.floor(Math.random() * types.length)],
        radius: 15,
      };
    }
  }, []);

  const applyPowerUp = useCallback((player: 1 | 2, type: PowerUpType) => {
    if (!gameStateRef.current) return;
    const state = gameStateRef.current;

    switch (type) {
      case 'paddle-grow':
        if (player === 1) {
          state.paddle1Height = Math.min(150, state.paddle1Height + 30);
        } else {
          state.paddle2Height = Math.min(150, state.paddle2Height + 30);
        }
        break;
      case 'paddle-shrink':
        if (player === 1) {
          state.paddle2Height = Math.max(40, state.paddle2Height - 20);
        } else {
          state.paddle1Height = Math.max(40, state.paddle1Height - 20);
        }
        break;
      case 'ball-fast':
        state.ballSpeed = Math.min(12, state.ballSpeed + 2);
        const speedRatio = state.ballSpeed / Math.sqrt(state.ballVX ** 2 + state.ballVY ** 2);
        state.ballVX *= speedRatio;
        state.ballVY *= speedRatio;
        break;
      case 'ball-slow':
        state.ballSpeed = Math.max(3, state.ballSpeed - 2);
        const slowRatio = state.ballSpeed / Math.sqrt(state.ballVX ** 2 + state.ballVY ** 2);
        state.ballVX *= slowRatio;
        state.ballVY *= slowRatio;
        break;
    }
  }, []);

  const updateGame = useCallback(() => {
    if (!gameStateRef.current || isPaused || winner) return;
    const state = gameStateRef.current;

    // Player 1 controls (W/S)
    if (keysRef.current.has('w') || keysRef.current.has('W')) {
      state.paddle1Y = Math.max(0, state.paddle1Y - PADDLE_SPEED);
    }
    if (keysRef.current.has('s') || keysRef.current.has('S')) {
      state.paddle1Y = Math.min(CANVAS_HEIGHT - state.paddle1Height, state.paddle1Y + PADDLE_SPEED);
    }

    // Player 2 / AI controls
    if (gameMode === 'two-player') {
      if (keysRef.current.has('ArrowUp')) {
        state.paddle2Y = Math.max(0, state.paddle2Y - PADDLE_SPEED);
      }
      if (keysRef.current.has('ArrowDown')) {
        state.paddle2Y = Math.min(CANVAS_HEIGHT - state.paddle2Height, state.paddle2Y + PADDLE_SPEED);
      }
    } else {
      // AI logic
      const paddle2Center = state.paddle2Y + state.paddle2Height / 2;
      const targetY = state.ballX > CANVAS_WIDTH / 2 ? state.ballY : CANVAS_HEIGHT / 2;

      if (paddle2Center < targetY - 20) {
        state.paddle2Y = Math.min(CANVAS_HEIGHT - state.paddle2Height, state.paddle2Y + AI_SPEED);
      } else if (paddle2Center > targetY + 20) {
        state.paddle2Y = Math.max(0, state.paddle2Y - AI_SPEED);
      }
    }

    // Ball movement
    state.ballX += state.ballVX;
    state.ballY += state.ballVY;

    // Top/bottom wall collision
    if (state.ballY - BALL_RADIUS <= 0 || state.ballY + BALL_RADIUS >= CANVAS_HEIGHT) {
      state.ballVY = -state.ballVY;
      state.ballY = Math.max(BALL_RADIUS, Math.min(CANVAS_HEIGHT - BALL_RADIUS, state.ballY));
    }

    // Paddle 1 collision (left)
    if (
      state.ballX - BALL_RADIUS <= PADDLE_WIDTH + 20 &&
      state.ballX - BALL_RADIUS >= 20 &&
      state.ballY >= state.paddle1Y &&
      state.ballY <= state.paddle1Y + state.paddle1Height
    ) {
      state.ballVX = Math.abs(state.ballVX);
      const hitPos = (state.ballY - state.paddle1Y) / state.paddle1Height - 0.5;
      state.ballVY = hitPos * state.ballSpeed * 1.5;
      state.ballX = PADDLE_WIDTH + 20 + BALL_RADIUS;
    }

    // Paddle 2 collision (right)
    if (
      state.ballX + BALL_RADIUS >= CANVAS_WIDTH - PADDLE_WIDTH - 20 &&
      state.ballX + BALL_RADIUS <= CANVAS_WIDTH - 20 &&
      state.ballY >= state.paddle2Y &&
      state.ballY <= state.paddle2Y + state.paddle2Height
    ) {
      state.ballVX = -Math.abs(state.ballVX);
      const hitPos = (state.ballY - state.paddle2Y) / state.paddle2Height - 0.5;
      state.ballVY = hitPos * state.ballSpeed * 1.5;
      state.ballX = CANVAS_WIDTH - PADDLE_WIDTH - 20 - BALL_RADIUS;
    }

    // Power-up collision
    if (state.powerUp) {
      const dx = state.ballX - state.powerUp.x;
      const dy = state.ballY - state.powerUp.y;
      if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS + state.powerUp.radius) {
        const lastHitter = state.ballVX > 0 ? 1 : 2;
        applyPowerUp(lastHitter as 1 | 2, state.powerUp.type);
        state.powerUp = null;
      }
    }

    // Scoring
    if (state.ballX < 0) {
      state.score2++;
      if (state.score2 >= WINNING_SCORE) {
        setWinner(gameMode === 'single' ? 'Computer' : 'Player 2');
      } else {
        resetBall(-1);
      }
    } else if (state.ballX > CANVAS_WIDTH) {
      state.score1++;
      if (state.score1 >= WINNING_SCORE) {
        setWinner('Player 1');
      } else {
        resetBall(1);
      }
    }

    // Spawn power-ups
    spawnPowerUp();
  }, [gameMode, isPaused, winner, resetBall, spawnPowerUp, applyPowerUp]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStateRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(20, state.paddle1Y, PADDLE_WIDTH, state.paddle1Height);

    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 20, state.paddle2Y, PADDLE_WIDTH, state.paddle2Height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Draw power-up
    if (state.powerUp) {
      ctx.beginPath();
      ctx.arc(state.powerUp.x, state.powerUp.y, state.powerUp.radius, 0, Math.PI * 2);
      ctx.fillStyle = POWER_UP_COLORS[state.powerUp.type];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(POWER_UP_ICONS[state.powerUp.type], state.powerUp.x, state.powerUp.y);
    }

    // Draw scores
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(state.score1.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(state.score2.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    // Draw pause overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '18px sans-serif';
      ctx.fillText('Press SPACE to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    // Draw winner overlay
    if (winner) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#4ECDC4';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(`${winner} Wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '18px sans-serif';
      ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }, [isPaused, winner]);

  const gameLoop = useCallback(() => {
    updateGame();
    draw();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);

  useEffect(() => {
    if (gameMode !== 'menu') {
      initGame();
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameMode, initGame, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);

      if (e.key === ' ') {
        e.preventDefault();
        if (winner) {
          initGame();
        } else {
          setIsPaused((p) => !p);
        }
      }

      if (e.key === 'Escape') {
        setGameMode('menu');
        setWinner(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [winner, initGame]);

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-accent-900 to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Modern Pong</h1>
          <p className="text-white/70 mb-8">Classic arcade game with power-ups!</p>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => setGameMode('single')}
              className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold rounded-xl transition-all hover:scale-105"
            >
              Single Player
              <span className="block text-sm font-normal opacity-80">Play against AI</span>
            </button>
            <button
              onClick={() => setGameMode('two-player')}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all hover:scale-105"
            >
              Two Players
              <span className="block text-sm font-normal opacity-80">Local multiplayer</span>
            </button>
          </div>

          <div className="text-left bg-white/5 rounded-xl p-4 text-sm">
            <h3 className="font-semibold text-white mb-2">Controls</h3>
            <div className="grid grid-cols-2 gap-2 text-white/70">
              <div>
                <span className="text-accent-400">Player 1:</span> W / S
              </div>
              <div>
                <span className="text-pink-400">Player 2:</span> ↑ / ↓
              </div>
            </div>
            <div className="mt-2 text-white/70">
              <span className="text-white">Space:</span> Pause | <span className="text-white">Esc:</span> Menu
            </div>
            <h3 className="font-semibold text-white mt-4 mb-2">Power-ups</h3>
            <div className="grid grid-cols-2 gap-1 text-white/70 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#4ECDC4]"></span> Grow paddle
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#FF6B6B]"></span> Shrink opponent
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#F7DC6F]"></span> Speed up ball
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#BB8FCE]"></span> Slow down ball
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-accent-900 to-primary-800 flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex items-center gap-4">
        <div className="text-white/70 text-sm">
          <span className="text-accent-400 font-semibold">P1</span> W/S
        </div>
        <h1 className="text-2xl font-bold text-white">
          {gameMode === 'single' ? 'vs Computer' : 'Player vs Player'}
        </h1>
        <div className="text-white/70 text-sm">
          {gameMode === 'two-player' ? (
            <>
              <span className="text-pink-400 font-semibold">P2</span> ↑/↓
            </>
          ) : (
            <span className="text-pink-400 font-semibold">AI</span>
          )}
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block max-w-full h-auto"
        />
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => setIsPaused((p) => !p)}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setGameMode('menu')}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Menu
        </button>
      </div>

      <p className="mt-4 text-white/50 text-sm">First to {WINNING_SCORE} wins!</p>
    </div>
  );
}
