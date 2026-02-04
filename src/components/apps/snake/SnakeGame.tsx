'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const GAME_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type GameState = 'start' | 'playing' | 'gameover';

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Position>({ x: 15, y: 10 });
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('snakeBest');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Generate new food position
  const generateFood = useCallback(() => {
    const snake = snakeRef.current;
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    foodRef.current = newFood;
  }, []);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw food
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(
      foodRef.current.x * CELL_SIZE + 2,
      foodRef.current.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
      4
    );
    ctx.fill();

    // Draw snake
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#818cf8' : '#6366f1';
      ctx.beginPath();
      ctx.roundRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
        4
      );
      ctx.fill();
    });
  }, []);

  // Game tick
  const tick = useCallback(() => {
    const snake = snakeRef.current;
    directionRef.current = nextDirectionRef.current;

    const head = { ...snake[0] };

    switch (directionRef.current) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    // Check self collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      endGame();
      return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore(s => s + 1);
      generateFood();
    } else {
      snake.pop();
    }

    draw();
  }, [draw, generateFood]);

  // End game
  const endGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    const finalScore = snakeRef.current.length - 1;
    if (finalScore > bestScore) {
      setBestScore(finalScore);
      localStorage.setItem('snakeBest', finalScore.toString());
    }

    setGameState('gameover');
  }, [bestScore]);

  // Start game
  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setScore(0);
    generateFood();
    setGameState('playing');

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(tick, GAME_SPEED);
    draw();
  }, [tick, draw, generateFood]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.code === 'Space' || e.code === 'Enter') {
          startGame();
        }
        return;
      }

      const dir = directionRef.current;
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          if (dir !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (dir !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'KeyA':
          if (dir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (dir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  // Handle touch/swipe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== 'playing') return;

      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dir = directionRef.current;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30 && dir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
        else if (dx < -30 && dir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      } else {
        if (dy > 30 && dir !== 'UP') nextDirectionRef.current = 'DOWN';
        else if (dy < -30 && dir !== 'DOWN') nextDirectionRef.current = 'UP';
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">🐍 Snake</h1>

      {/* Score display */}
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-900 tabular-nums">{score}</div>
          <div className="text-xs text-primary-400 font-medium">Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-600 tabular-nums">{bestScore}</div>
          <div className="text-xs text-primary-400 font-medium">Best</div>
        </div>
      </div>

      {/* Game canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="rounded-xl border-2 border-primary-200"
        />

        {/* Overlay for start/gameover */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-900/80 rounded-xl">
            <div className="text-white text-center">
              {gameState === 'gameover' && (
                <div className="text-2xl font-bold mb-2">Game Over!</div>
              )}
              <div className="text-lg mb-4">
                {gameState === 'start' ? 'Ready to play?' : `Score: ${score}`}
              </div>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-button transition-colors"
              >
                {gameState === 'start' ? 'Start Game' : 'Play Again'}
              </button>
              <div className="text-xs text-white/60 mt-3">
                Press Space or Enter to start
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile D-pad */}
      <div className="mt-6 md:hidden grid grid-cols-3 gap-2 w-36">
        <div />
        <button
          onClick={() => { if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP'; }}
          className="w-12 h-12 bg-primary-100 hover:bg-primary-200 rounded-lg flex items-center justify-center text-primary-600 font-bold"
        >
          ↑
        </button>
        <div />
        <button
          onClick={() => { if (directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT'; }}
          className="w-12 h-12 bg-primary-100 hover:bg-primary-200 rounded-lg flex items-center justify-center text-primary-600 font-bold"
        >
          ←
        </button>
        <div className="w-12 h-12 bg-primary-50 rounded-lg" />
        <button
          onClick={() => { if (directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT'; }}
          className="w-12 h-12 bg-primary-100 hover:bg-primary-200 rounded-lg flex items-center justify-center text-primary-600 font-bold"
        >
          →
        </button>
        <div />
        <button
          onClick={() => { if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN'; }}
          className="w-12 h-12 bg-primary-100 hover:bg-primary-200 rounded-lg flex items-center justify-center text-primary-600 font-bold"
        >
          ↓
        </button>
        <div />
      </div>

      <p className="text-xs text-primary-400 mt-6 text-center">
        Use arrow keys or WASD to move • Swipe on mobile
      </p>
    </div>
  );
}
