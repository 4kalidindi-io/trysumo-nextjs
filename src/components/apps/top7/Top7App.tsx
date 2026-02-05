'use client';

import { useState, useRef, useEffect } from 'react';

interface Prompt {
  id: number;
  question: string;
  answers: string[]; // Ranked from most to least common
}

const PROMPTS: Prompt[] = [
  {
    id: 1,
    question: "Name something sticky",
    answers: ["Honey", "Glue", "Tape", "Syrup", "Gum", "Jelly", "Caramel"],
  },
  {
    id: 2,
    question: "Name a yellow fruit",
    answers: ["Banana", "Lemon", "Pineapple", "Mango", "Grapefruit", "Papaya", "Starfruit"],
  },
  {
    id: 3,
    question: "Name something you find in a wallet",
    answers: ["Money", "Credit Card", "ID", "Photos", "Receipts", "Business Cards", "Gift Cards"],
  },
  {
    id: 4,
    question: "Name a pizza topping",
    answers: ["Pepperoni", "Cheese", "Mushrooms", "Sausage", "Olives", "Peppers", "Onions"],
  },
  {
    id: 5,
    question: "Name something cold",
    answers: ["Ice", "Snow", "Ice Cream", "Refrigerator", "Winter", "Antarctica", "Freezer"],
  },
  {
    id: 6,
    question: "Name a breakfast food",
    answers: ["Eggs", "Bacon", "Cereal", "Pancakes", "Toast", "Waffles", "Oatmeal"],
  },
  {
    id: 7,
    question: "Name something you do before bed",
    answers: ["Brush Teeth", "Shower", "Read", "Watch TV", "Change Clothes", "Set Alarm", "Pray"],
  },
  {
    id: 8,
    question: "Name a type of dog",
    answers: ["Labrador", "German Shepherd", "Bulldog", "Poodle", "Golden Retriever", "Beagle", "Husky"],
  },
  {
    id: 9,
    question: "Name something in a classroom",
    answers: ["Desk", "Chalkboard", "Teacher", "Students", "Books", "Pencils", "Clock"],
  },
  {
    id: 10,
    question: "Name a superhero",
    answers: ["Superman", "Batman", "Spider-Man", "Wonder Woman", "Iron Man", "Captain America", "Hulk"],
  },
  {
    id: 11,
    question: "Name something at a beach",
    answers: ["Sand", "Water", "Waves", "Sunscreen", "Towel", "Umbrella", "Shells"],
  },
  {
    id: 12,
    question: "Name a fast food restaurant",
    answers: ["McDonald's", "Burger King", "Wendy's", "Taco Bell", "KFC", "Subway", "Chick-fil-A"],
  },
  {
    id: 13,
    question: "Name something you plug in",
    answers: ["Phone", "TV", "Lamp", "Computer", "Charger", "Toaster", "Microwave"],
  },
  {
    id: 14,
    question: "Name a color of a car",
    answers: ["Black", "White", "Red", "Blue", "Silver", "Gray", "Green"],
  },
  {
    id: 15,
    question: "Name something in the sky",
    answers: ["Sun", "Moon", "Stars", "Clouds", "Birds", "Airplane", "Rainbow"],
  },
  {
    id: 16,
    question: "Name a musical instrument",
    answers: ["Piano", "Guitar", "Drums", "Violin", "Flute", "Trumpet", "Saxophone"],
  },
  {
    id: 17,
    question: "Name something you wear on your feet",
    answers: ["Shoes", "Socks", "Sandals", "Boots", "Slippers", "Sneakers", "Flip Flops"],
  },
  {
    id: 18,
    question: "Name a social media platform",
    answers: ["Facebook", "Instagram", "Twitter", "TikTok", "YouTube", "Snapchat", "LinkedIn"],
  },
  {
    id: 19,
    question: "Name something in a hospital",
    answers: ["Doctors", "Nurses", "Beds", "Patients", "Medicine", "IV", "Ambulance"],
  },
  {
    id: 20,
    question: "Name a vegetable",
    answers: ["Carrot", "Broccoli", "Lettuce", "Tomato", "Potato", "Corn", "Cucumber"],
  },
];

type GameState = 'menu' | 'playing' | 'reveal' | 'gameover';

export default function Top7App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [usedPrompts, setUsedPrompts] = useState<number[]>([]);
  const [guess, setGuess] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState<boolean[]>([]);
  const [strikes, setStrikes] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_STRIKES = 3;
  const TOTAL_ROUNDS = 5;

  const startGame = () => {
    setUsedPrompts([]);
    setTotalScore(0);
    setRound(0);
    nextRound([]);
  };

  const nextRound = (used: number[]) => {
    const prompt = PROMPTS.filter(p => !used.includes(p.id))[
      Math.floor(Math.random() * (PROMPTS.length - used.length))
    ];

    if (!prompt || round >= TOTAL_ROUNDS) {
      setGameState('gameover');
      return;
    }

    setCurrentPrompt(prompt);
    setUsedPrompts([...used, prompt.id]);
    setRevealedAnswers(new Array(7).fill(false));
    setStrikes(0);
    setScore(0);
    setGuess('');
    setRound(prev => prev + 1);
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const normalizeAnswer = (answer: string) => {
    return answer.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  };

  const checkGuess = () => {
    if (!guess.trim() || !currentPrompt) return;

    const normalizedGuess = normalizeAnswer(guess);
    let found = false;

    currentPrompt.answers.forEach((answer, index) => {
      if (revealedAnswers[index]) return;

      const normalizedAnswer = normalizeAnswer(answer);
      // Check if guess matches or is contained in the answer
      if (
        normalizedAnswer === normalizedGuess ||
        normalizedAnswer.includes(normalizedGuess) ||
        normalizedGuess.includes(normalizedAnswer)
      ) {
        const newRevealed = [...revealedAnswers];
        newRevealed[index] = true;
        setRevealedAnswers(newRevealed);
        // Points based on ranking (7 for #1, 6 for #2, etc.)
        const points = 7 - index;
        setScore(prev => prev + points);
        found = true;
      }
    });

    if (!found) {
      setStrikes(prev => prev + 1);
      if (strikes + 1 >= MAX_STRIKES) {
        endRound();
      }
    }

    setGuess('');

    // Check if all answers found
    if (revealedAnswers.filter(Boolean).length + (found ? 1 : 0) === 7) {
      setTimeout(() => endRound(), 500);
    }
  };

  const endRound = () => {
    setTotalScore(prev => prev + score);
    setGameState('reveal');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkGuess();
    }
  };

  const handleNextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      setGameState('gameover');
    } else {
      nextRound(usedPrompts);
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      inputRef.current?.focus();
    }
  }, [gameState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Top 7</h1>
          <p className="text-white/60">Guess the most popular answers!</p>
        </div>

        {/* Menu */}
        {gameState === 'menu' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
            <p className="text-white/70 mb-6">
              Guess the top 7 most popular answers for each question. Higher-ranked answers score more points!
            </p>
            <ul className="text-left text-white/60 text-sm mb-8 max-w-xs mx-auto space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-amber-400">★</span> 5 rounds of fun
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400">★</span> 3 strikes per round
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400">★</span> Top answers = more points
              </li>
            </ul>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Playing */}
        {gameState === 'playing' && currentPrompt && (
          <div className="space-y-6">
            {/* Score & Round */}
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-white/80 text-sm">Round {round} / {TOTAL_ROUNDS}</div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[...Array(MAX_STRIKES)].map((_, i) => (
                    <span key={i} className={`text-2xl ${i < strikes ? 'opacity-100' : 'opacity-30'}`}>
                      ❌
                    </span>
                  ))}
                </div>
                <div className="text-white font-bold">Score: {score}</div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-center shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {currentPrompt.question}
              </h2>
            </div>

            {/* Answer Board */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2">
              {currentPrompt.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    revealedAnswers[index]
                      ? 'bg-emerald-500/30 border border-emerald-400'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      revealedAnswers[index] ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/50'
                    }`}>
                      {index + 1}
                    </span>
                    <span className={`font-semibold ${
                      revealedAnswers[index] ? 'text-white' : 'text-white/30'
                    }`}>
                      {revealedAnswers[index] ? answer : '???'}
                    </span>
                  </div>
                  {revealedAnswers[index] && (
                    <span className="text-amber-400 font-bold">+{7 - index}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your guess..."
                className="flex-1 px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                onClick={checkGuess}
                disabled={!guess.trim()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all"
              >
                Guess
              </button>
            </div>

            {/* Give Up */}
            <button
              onClick={endRound}
              className="w-full py-2 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              Give up and see answers
            </button>
          </div>
        )}

        {/* Reveal */}
        {gameState === 'reveal' && currentPrompt && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Round Complete!</h2>
              <p className="text-white/70">You scored {score} points this round</p>
            </div>

            {/* All Answers */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2">
              <h3 className="text-lg font-semibold text-white mb-3 text-center">
                {currentPrompt.question}
              </h3>
              {currentPrompt.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    revealedAnswers[index]
                      ? 'bg-emerald-500/30 border border-emerald-400'
                      : 'bg-red-500/20 border border-red-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      revealedAnswers[index] ? 'bg-emerald-500 text-white' : 'bg-red-500/50 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-white font-semibold">{answer}</span>
                  </div>
                  <span className={`font-bold ${revealedAnswers[index] ? 'text-amber-400' : 'text-white/40'}`}>
                    {revealedAnswers[index] ? `+${7 - index}` : `${7 - index} pts`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleNextRound}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.02]"
            >
              {round >= TOTAL_ROUNDS ? 'See Final Score' : 'Next Round'}
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'gameover' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
            <div className="text-6xl font-bold text-amber-400 mb-2">
              {totalScore}
            </div>
            <p className="text-white/60 mb-2">Total Points</p>
            <p className="text-white/40 text-sm mb-8">
              {totalScore >= 100 ? 'Amazing! You really know your stuff!' :
               totalScore >= 70 ? 'Great job!' :
               totalScore >= 40 ? 'Not bad!' : 'Keep practicing!'}
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
