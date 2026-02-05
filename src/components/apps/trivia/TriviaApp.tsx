'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Question {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const TRIVIA_QUESTIONS: Question[] = [
  { id: 1, question: "What is the capital of France?", answer: "Paris", category: "Geography" },
  { id: 2, question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci", category: "Art" },
  { id: 3, question: "What is the largest planet in our solar system?", answer: "Jupiter", category: "Science" },
  { id: 4, question: "In what year did World War II end?", answer: "1945", category: "History" },
  { id: 5, question: "What is the chemical symbol for gold?", answer: "Au", category: "Science" },
  { id: 6, question: "Who wrote Romeo and Juliet?", answer: "William Shakespeare", category: "Literature" },
  { id: 7, question: "What is the tallest mountain in the world?", answer: "Mount Everest", category: "Geography" },
  { id: 8, question: "How many continents are there?", answer: "7", category: "Geography" },
  { id: 9, question: "What is the speed of light in km/s (approximately)?", answer: "300000", category: "Science" },
  { id: 10, question: "Who was the first person to walk on the moon?", answer: "Neil Armstrong", category: "History" },
  { id: 11, question: "What is the largest ocean on Earth?", answer: "Pacific Ocean", category: "Geography" },
  { id: 12, question: "What year was the iPhone first released?", answer: "2007", category: "Technology" },
  { id: 13, question: "What is the hardest natural substance on Earth?", answer: "Diamond", category: "Science" },
  { id: 14, question: "Who invented the telephone?", answer: "Alexander Graham Bell", category: "History" },
  { id: 15, question: "What is the smallest country in the world?", answer: "Vatican City", category: "Geography" },
  { id: 16, question: "How many bones are in the adult human body?", answer: "206", category: "Science" },
  { id: 17, question: "What is the capital of Japan?", answer: "Tokyo", category: "Geography" },
  { id: 18, question: "Who wrote the Harry Potter series?", answer: "J.K. Rowling", category: "Literature" },
  { id: 19, question: "What is the largest mammal in the world?", answer: "Blue whale", category: "Science" },
  { id: 20, question: "In what year did the Titanic sink?", answer: "1912", category: "History" },
];

type GameState = 'menu' | 'playing' | 'buzzed' | 'checking' | 'result' | 'gameover';

export default function TriviaApp() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [streak, setStreak] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getRandomQuestion = useCallback(() => {
    const availableQuestions = TRIVIA_QUESTIONS.filter(q => !usedQuestions.includes(q.id));
    if (availableQuestions.length === 0) {
      setGameState('gameover');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  }, [usedQuestions]);

  const startGame = () => {
    setScore(0);
    setTotalAnswered(0);
    setUsedQuestions([]);
    setStreak(0);
    nextQuestion();
  };

  const nextQuestion = useCallback(() => {
    const question = getRandomQuestion();
    if (question) {
      setCurrentQuestion(question);
      setUsedQuestions(prev => [...prev, question.id]);
      setTimeRemaining(10);
      setUserAnswer('');
      setIsCorrect(null);
      setAiExplanation('');
      setGameState('playing');
    }
  }, [getRandomQuestion]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('result');
            setIsCorrect(false);
            setAiExplanation(`Time is up! The correct answer was: ${currentQuestion?.answer}`);
            setStreak(0);
            setTotalAnswered(prev => prev + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, timeRemaining, currentQuestion]);

  const handleBuzzer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameState('buzzed');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    setGameState('checking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a trivia answer checker. Your job is to determine if a user's answer is correct or close enough to be accepted. Be lenient with spelling mistakes, abbreviations, and alternate valid answers. Respond with a JSON object only, no other text: {"correct": true/false, "explanation": "brief explanation"}`,
          messages: [{
            role: 'user',
            content: `Question: "${currentQuestion.question}"\nExpected answer: "${currentQuestion.answer}"\nUser's answer: "${userAnswer}"\n\nIs this answer correct or close enough to accept?`
          }]
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullContent += parsed.delta.text;
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      }

      // Parse the AI response
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setIsCorrect(result.correct);
        setAiExplanation(result.explanation);
        if (result.correct) {
          setScore(prev => prev + 1);
          setStreak(prev => prev + 1);
        } else {
          setStreak(0);
        }
      } else {
        // Fallback: simple string match
        const isMatch = userAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
        setIsCorrect(isMatch);
        setAiExplanation(isMatch ? 'Correct!' : `The correct answer was: ${currentQuestion.answer}`);
        if (isMatch) {
          setScore(prev => prev + 1);
          setStreak(prev => prev + 1);
        } else {
          setStreak(0);
        }
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      // Fallback to simple comparison
      const isMatch = userAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
      setIsCorrect(isMatch);
      setAiExplanation(isMatch ? 'Correct!' : `The correct answer was: ${currentQuestion.answer}`);
      if (isMatch) {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }
    }

    setTotalAnswered(prev => prev + 1);
    setGameState('result');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState === 'buzzed') {
      checkAnswer();
    }
  };

  const getTimerColor = () => {
    if (timeRemaining > 6) return 'text-emerald-500';
    if (timeRemaining > 3) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-purple-900 to-primary-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Trivia Challenge</h1>
          <p className="text-white/60">Test your knowledge with AI-powered answer checking</p>
        </div>

        {/* Menu */}
        {gameState === 'menu' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center">
            <div className="text-6xl mb-6">🧠</div>
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Play?</h2>
            <p className="text-white/70 mb-6">
              You have 10 seconds to read each question. Press the buzzer when you know the answer!
            </p>
            <ul className="text-left text-white/60 text-sm mb-8 max-w-xs mx-auto space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> 20 general knowledge questions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> AI checks your answers
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Accepts close answers
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
        {(gameState === 'playing' || gameState === 'buzzed' || gameState === 'checking') && currentQuestion && (
          <div className="space-y-6">
            {/* Score bar */}
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-white/80 text-sm">
                Question {totalAnswered + 1} / 20
              </div>
              <div className="flex items-center gap-4">
                {streak >= 2 && (
                  <div className="text-amber-400 text-sm font-semibold animate-pulse">
                    🔥 {streak} streak!
                  </div>
                )}
                <div className="text-white font-bold">
                  Score: {score}
                </div>
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8">
              {/* Category & Timer */}
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white/80">
                  {currentQuestion.category}
                </span>
                <div className={`text-4xl font-bold font-mono ${getTimerColor()} ${timeRemaining <= 3 && gameState === 'playing' ? 'animate-pulse' : ''}`}>
                  {timeRemaining}s
                </div>
              </div>

              {/* Question */}
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-relaxed">
                {currentQuestion.question}
              </h2>

              {/* Buzzer */}
              {gameState === 'playing' && (
                <button
                  onClick={handleBuzzer}
                  className="w-full py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-2xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-500/30"
                >
                  🔔 BUZZ IN!
                </button>
              )}

              {/* Answer input */}
              {gameState === 'buzzed' && (
                <div className="space-y-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer..."
                    className="w-full px-6 py-4 bg-white/20 border-2 border-white/30 rounded-xl text-white text-xl placeholder-white/40 focus:outline-none focus:border-amber-400 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={checkAnswer}
                    disabled={!userAnswer.trim()}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-lg rounded-xl transition-all"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

              {/* Checking */}
              {gameState === 'checking' && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-white/80">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>AI is checking your answer...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {gameState === 'result' && currentQuestion && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center">
            <div className={`text-8xl mb-4 ${isCorrect ? 'animate-bounce' : ''}`}>
              {isCorrect ? '🎉' : '😔'}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {isCorrect ? 'Correct!' : 'Not Quite!'}
            </h2>
            <p className="text-white/70 mb-4">
              Your answer: <span className="text-white font-semibold">{userAnswer || '(no answer)'}</span>
            </p>
            <p className="text-white/80 mb-6 bg-white/10 rounded-xl p-4">
              {aiExplanation}
            </p>
            <div className="text-white/60 mb-6">
              Score: {score} / {totalAnswered}
            </div>
            {usedQuestions.length < 20 ? (
              <button
                onClick={nextQuestion}
                className="px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => setGameState('gameover')}
                className="px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
              >
                See Final Score
              </button>
            )}
          </div>
        )}

        {/* Game Over */}
        {gameState === 'gameover' && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
            <div className="text-6xl font-bold text-amber-400 mb-2">
              {score} / {totalAnswered}
            </div>
            <p className="text-white/60 mb-2">
              {score === totalAnswered ? 'Perfect Score! Amazing!' :
               score >= totalAnswered * 0.8 ? 'Excellent work!' :
               score >= totalAnswered * 0.6 ? 'Good job!' :
               score >= totalAnswered * 0.4 ? 'Not bad!' : 'Keep practicing!'}
            </p>
            <p className="text-white/40 text-sm mb-8">
              {Math.round((score / totalAnswered) * 100)}% accuracy
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
