'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Word Lists ─────────────────────────────────────────
const SINGLE_WORDS = [
  'ADVENTURE', 'BIRTHDAY', 'CHAMPION', 'DINOSAUR', 'ELEPHANT',
  'FIREWORKS', 'GIRAFFE', 'HOMEWORK', 'ICEBERG', 'JUNGLE',
  'KEYBOARD', 'LIBRARY', 'MOUNTAIN', 'NOTEBOOK', 'OCTOPUS',
  'PARADISE', 'QUESTION', 'RAINBOW', 'SUNSHINE', 'TREASURE',
  'UMBRELLA', 'VOLCANO', 'WATERFALL', 'ASTEROID', 'BLANKET',
  'CALENDAR', 'DIAMOND', 'ENVELOPE', 'FOOTBALL', 'GOLDFISH',
  'HARMONY', 'INVENTOR', 'JELLYFISH', 'KINGDOM', 'LANTERN',
  'MIDNIGHT', 'NECKLACE', 'ORCHARD', 'PENGUIN', 'QUARTER',
  'ROBOTICS', 'SANDWICH', 'THUNDER', 'UNICORN', 'VACATION',
  'WHISTLE', 'BACKPACK', 'CINNAMON', 'DOLPHIN', 'EXPLORER',
  'FLAMINGO', 'GUARDIAN', 'HORIZON', 'ILLUSION', 'JOYSTICK',
  'KANGAROO', 'LEMONADE', 'MUSHROOM', 'Neptune', 'OBSTACLE',
  'PLATINUM', 'QUICKSAND', 'REINDEER', 'STARFISH', 'TITANIUM',
];

const TWO_WORD_PHRASES = [
  'ICE CREAM', 'HOT DOG', 'BLUE SKY', 'GOLD FISH', 'SUN RISE',
  'MILK SHAKE', 'POP CORN', 'RAIN DROP', 'STAR DUST', 'SNOW BALL',
  'MOON LIGHT', 'FIRE TRUCK', 'CUP CAKE', 'SAND CASTLE', 'BOOK WORM',
  'JELLY BEAN', 'PINE APPLE', 'RAIN COAT', 'SUN FLOWER', 'TOOTH BRUSH',
  'WATER MELON', 'FLASH LIGHT', 'BUTTER FLY', 'DRUM STICK', 'FISH BOWL',
  'GRAPE FRUIT', 'HAND SHAKE', 'KEY BOARD', 'LIME STONE', 'NECK LACE',
  'OVER COAT', 'PLAY GROUND', 'RED WOOD', 'SEA SHELL', 'TOP SOIL',
  'BACK PACK', 'CAMP FIRE', 'DAY LIGHT', 'EAR RING', 'FOOT PRINT',
  'GREEN HOUSE', 'HALF TIME', 'INK WELL', 'JAM JAR', 'KING PIN',
  'LAMP POST', 'MAIL BOX', 'NIGHT OWL', 'OUT DOOR', 'PAN CAKE',
];

type GameMode = 'menu' | 'playing' | 'won' | 'lost';
type WordMode = '1word' | '2words';

const MAX_WRONG = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function HangmanApp() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [wordMode, setWordMode] = useState<WordMode>('1word');
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Load best streak
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hangman-best-streak');
      if (saved) setBestStreak(parseInt(saved));
    } catch { /* ignore */ }
  }, []);

  // Keyboard listener
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameMode !== 'playing') return;
    const key = e.key.toUpperCase();
    if (ALPHABET.includes(key)) {
      guessLetter(key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, guessedLetters, word]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const pickWord = (mode: WordMode): string => {
    const list = mode === '1word' ? SINGLE_WORDS : TWO_WORD_PHRASES;
    return list[Math.floor(Math.random() * list.length)].toUpperCase();
  };

  const startGame = (mode: WordMode) => {
    setWordMode(mode);
    setWord(pickWord(mode));
    setGuessedLetters(new Set());
    setWrongCount(0);
    setGameMode('playing');
  };

  const guessLetter = (letter: string) => {
    if (guessedLetters.has(letter) || gameMode !== 'playing') return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= MAX_WRONG) {
        setGameMode('lost');
        setStreak(0);
      }
    } else {
      // Check if won
      const letters = word.split('').filter(c => c !== ' ');
      const allGuessed = letters.every(c => newGuessed.has(c));
      if (allGuessed) {
        setGameMode('won');
        const newScore = score + (MAX_WRONG - wrongCount) * 10;
        setScore(newScore);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
          localStorage.setItem('hangman-best-streak', newStreak.toString());
        }
      }
    }
  };

  // ─── Hangman Drawing ─────────────────────────────────
  const renderHangman = () => {
    const parts = [
      // Head
      <circle key="head" cx="150" cy="70" r="20" fill="none" stroke="currentColor" strokeWidth="3" />,
      // Body
      <line key="body" x1="150" y1="90" x2="150" y2="150" stroke="currentColor" strokeWidth="3" />,
      // Left arm
      <line key="larm" x1="150" y1="110" x2="120" y2="140" stroke="currentColor" strokeWidth="3" />,
      // Right arm
      <line key="rarm" x1="150" y1="110" x2="180" y2="140" stroke="currentColor" strokeWidth="3" />,
      // Left leg
      <line key="lleg" x1="150" y1="150" x2="120" y2="190" stroke="currentColor" strokeWidth="3" />,
      // Right leg
      <line key="rleg" x1="150" y1="150" x2="180" y2="190" stroke="currentColor" strokeWidth="3" />,
    ];

    return (
      <svg viewBox="0 0 300 220" className="w-full max-w-[280px] mx-auto text-primary-700">
        {/* Gallows */}
        <line x1="40" y1="210" x2="260" y2="210" stroke="currentColor" strokeWidth="3" />
        <line x1="80" y1="210" x2="80" y2="20" stroke="currentColor" strokeWidth="3" />
        <line x1="80" y1="20" x2="150" y2="20" stroke="currentColor" strokeWidth="3" />
        <line x1="150" y1="20" x2="150" y2="50" stroke="currentColor" strokeWidth="3" />
        {/* Body parts based on wrong count */}
        {parts.slice(0, wrongCount)}
      </svg>
    );
  };

  // ─── Word Display ────────────────────────────────────
  const renderWord = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 my-6">
        {word.split('').map((char, i) => (
          <div
            key={i}
            className={`w-10 h-12 flex items-center justify-center text-xl font-bold rounded-lg ${
              char === ' '
                ? 'w-4'
                : guessedLetters.has(char)
                ? gameMode === 'lost' && !guessedLetters.has(char)
                  ? 'bg-rose-100 border-2 border-rose-300 text-rose-600'
                  : 'bg-accent-50 border-2 border-accent-300 text-accent-700'
                : gameMode === 'lost'
                ? 'bg-rose-50 border-2 border-rose-300 text-rose-600'
                : 'bg-primary-100 border-2 border-primary-300 text-transparent'
            }`}
          >
            {char === ' ' ? '' : (guessedLetters.has(char) || gameMode === 'lost') ? char : '_'}
          </div>
        ))}
      </div>
    );
  };

  // ─── Keyboard ────────────────────────────────────────
  const renderKeyboard = () => {
    const rows = [
      ALPHABET.slice(0, 9),   // A-I
      ALPHABET.slice(9, 18),  // J-R
      ALPHABET.slice(18, 26), // S-Z
    ];

    return (
      <div className="space-y-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1.5">
            {row.map(letter => {
              const isGuessed = guessedLetters.has(letter);
              const isCorrect = isGuessed && word.includes(letter);
              const isWrong = isGuessed && !word.includes(letter);

              return (
                <button
                  key={letter}
                  onClick={() => guessLetter(letter)}
                  disabled={isGuessed || gameMode !== 'playing'}
                  className={`w-9 h-10 md:w-10 md:h-11 text-sm font-bold rounded-lg transition-all ${
                    isCorrect
                      ? 'bg-emerald-500 text-white'
                      : isWrong
                      ? 'bg-rose-400 text-white opacity-50'
                      : isGuessed
                      ? 'bg-primary-200 text-primary-400'
                      : 'bg-white border border-primary-200 text-primary-700 hover:border-accent-400 hover:bg-accent-50 active:scale-95'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ─── Menu Screen ─────────────────────────────────────
  if (gameMode === 'menu') {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-indigo-50 to-purple-50 -mx-6 -mt-10 px-6 pt-10 pb-10 flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🪢</div>
          <h1 className="text-3xl font-bold text-primary-900 mb-2">Hangman</h1>
          <p className="text-primary-500 mb-8">Guess the word before the hangman is complete!</p>

          {bestStreak > 0 && (
            <div className="bg-white/60 border border-primary-200 rounded-lg px-4 py-2 mb-6 text-sm text-primary-600">
              Best streak: {bestStreak} wins
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => startGame('1word')}
              className="w-full py-4 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-card transition-colors text-lg"
            >
              1 Word
              <span className="block text-sm font-normal text-white/70">Single word up to 15 letters</span>
            </button>
            <button
              onClick={() => startGame('2words')}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-card transition-colors text-lg"
            >
              2 Words
              <span className="block text-sm font-normal text-white/70">Two-word phrase up to 15 letters</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Game Screen ─────────────────────────────────────
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-indigo-50 to-purple-50 -mx-6 -mt-10 px-6 pt-10 pb-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setGameMode('menu')}
            className="text-sm text-primary-500 hover:text-primary-700"
          >
            ← Menu
          </button>
          <div className="flex gap-4 text-sm text-primary-500">
            <span>Score: {score}</span>
            <span>Streak: {streak}</span>
          </div>
        </div>

        {/* Mode badge */}
        <div className="text-center mb-2">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
            wordMode === '1word' ? 'bg-accent-100 text-accent-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {wordMode === '1word' ? '1 Word' : '2 Words'}
          </span>
        </div>

        {/* Wrong count */}
        <div className="flex justify-center gap-1 mb-2">
          {Array.from({ length: MAX_WRONG }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < wrongCount ? 'bg-rose-500' : 'bg-primary-200'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-primary-400 mb-4">
          {MAX_WRONG - wrongCount} guess{MAX_WRONG - wrongCount !== 1 ? 'es' : ''} remaining
        </p>

        {/* Hangman drawing */}
        <div className="bg-white border border-primary-200 rounded-card p-4 mb-4">
          {renderHangman()}
        </div>

        {/* Word */}
        {renderWord()}

        {/* Win/Lose overlay */}
        {(gameMode === 'won' || gameMode === 'lost') && (
          <div className="bg-white border border-primary-200 rounded-card p-6 mb-4 text-center">
            <div className="text-4xl mb-2">{gameMode === 'won' ? '🎉' : '😔'}</div>
            <h2 className={`text-xl font-bold mb-1 ${
              gameMode === 'won' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {gameMode === 'won' ? 'You Won!' : 'Game Over'}
            </h2>
            {gameMode === 'lost' && (
              <p className="text-sm text-primary-500 mb-1">The word was: <strong>{word}</strong></p>
            )}
            {gameMode === 'won' && (
              <p className="text-sm text-primary-500 mb-1">+{(MAX_WRONG - wrongCount) * 10} points | Streak: {streak}</p>
            )}
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={() => startGame(wordMode)}
                className="px-6 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-button"
              >
                Play Again
              </button>
              <button
                onClick={() => setGameMode('menu')}
                className="px-6 py-2 bg-primary-100 hover:bg-primary-200 text-primary-600 font-medium rounded-button"
              >
                Menu
              </button>
            </div>
          </div>
        )}

        {/* Keyboard */}
        {gameMode === 'playing' && renderKeyboard()}
      </div>
    </div>
  );
}
