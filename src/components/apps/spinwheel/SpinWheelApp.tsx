'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const DEFAULT_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'
];

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#FF6F61',
  '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1', '#955251', '#B565A7',
];

interface SpinWheelProps {
  size?: number;
}

export default function SpinWheelApp({ size = 400 }: SpinWheelProps) {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [newName, setNewName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const drawWheel = useCallback((currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas || names.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sliceAngle = (2 * Math.PI) / names.length;

    names.forEach((name, i) => {
      const startAngle = i * sliceAngle + currentRotation;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, Math.min(18, 200 / names.length))}px Inter, system-ui, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      ctx.fillText(name.length > 12 ? name.slice(0, 12) + '...' : name, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(canvas.width - 5, centerY - 15);
    ctx.lineTo(canvas.width - 5, centerY + 15);
    ctx.lineTo(canvas.width - 35, centerY);
    ctx.closePath();
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [names]);

  useEffect(() => {
    drawWheel(rotation);
  }, [drawWheel, rotation, names]);

  const spin = () => {
    if (isSpinning || names.length < 2) return;

    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);

    const spinDuration = 4000 + Math.random() * 2000;
    const totalRotation = rotation + (Math.PI * 2 * (5 + Math.random() * 5));
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing function (ease out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentRotation = startRotation + (totalRotation - startRotation) * easeOut;
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Calculate winner
        const normalizedRotation = currentRotation % (Math.PI * 2);
        const sliceAngle = (Math.PI * 2) / names.length;
        // The pointer is on the right side, so we need to calculate which slice is at 0 degrees
        const winningIndex = Math.floor((Math.PI * 2 - normalizedRotation) / sliceAngle) % names.length;

        setWinner(names[winningIndex]);
        setIsSpinning(false);
        setShowConfetti(true);

        setTimeout(() => setShowConfetti(false), 3000);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const addName = () => {
    const trimmedName = newName.trim();
    if (trimmedName && !names.includes(trimmedName)) {
      setNames([...names, trimmedName]);
      setNewName('');
    }
  };

  const removeName = (index: number) => {
    setNames(names.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setNames([]);
    setWinner(null);
  };

  const resetToDefault = () => {
    setNames(DEFAULT_NAMES);
    setWinner(null);
    setRotation(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addName();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-accent-900 to-primary-800 py-8 px-4">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
                backgroundColor: COLORS[i % COLORS.length],
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Spin the Wheel
          </h1>
          <p className="text-white/70 text-lg">
            Add names, spin, and let fate decide!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Wheel Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="max-w-full h-auto"
              />

              {names.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/50 text-lg">Add names to spin!</p>
                </div>
              )}
            </div>

            {/* Spin Button */}
            <button
              onClick={spin}
              disabled={isSpinning || names.length < 2}
              className={`mt-6 px-12 py-4 text-xl font-bold rounded-full transition-all duration-300 transform ${
                isSpinning || names.length < 2
                  ? 'bg-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 hover:scale-105 hover:shadow-lg hover:shadow-accent-500/30 text-white'
              }`}
            >
              {isSpinning ? 'Spinning...' : 'SPIN!'}
            </button>

            {/* Winner Display */}
            {winner && !isSpinning && (
              <div className="mt-6 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center animate-bounce-in">
                <p className="text-white/70 text-sm uppercase tracking-wider mb-2">Winner</p>
                <p className="text-3xl font-bold text-white mb-4">{winner}</p>
                <button
                  onClick={() => {
                    setNames(names.filter(n => n !== winner));
                    setWinner(null);
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-lg transition-colors border border-red-500/30 flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove from list
                </button>
              </div>
            )}
          </div>

          {/* Names Panel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Entries ({names.length})</h2>

            {/* Add Name Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter a name..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                disabled={isSpinning}
              />
              <button
                onClick={addName}
                disabled={!newName.trim() || isSpinning}
                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={clearAll}
                disabled={isSpinning || names.length === 0}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-300 font-medium rounded-lg transition-colors border border-red-500/30"
              >
                Clear All
              </button>
              <button
                onClick={resetToDefault}
                disabled={isSpinning}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-medium rounded-lg transition-colors border border-white/20"
              >
                Reset
              </button>
            </div>

            {/* Names List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {names.length === 0 ? (
                <p className="text-white/50 text-center py-8">No entries yet. Add some names above!</p>
              ) : (
                names.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-white">{name}</span>
                    </div>
                    <button
                      onClick={() => removeName(index)}
                      disabled={isSpinning}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all disabled:opacity-0"
                    >
                      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bulk Add */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/50 text-sm mb-2">Tip: Press Enter to quickly add names</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
