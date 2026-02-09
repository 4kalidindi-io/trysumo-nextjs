'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
  category?: string;
}

interface FlashcardDeck {
  title: string;
  cards: Flashcard[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

interface MemoryTrick {
  term: string;
  technique: string;
  trick: string;
  explanation: string;
}

interface VideoRecommendation {
  title: string;
  channel: string;
  description: string;
  searchQuery: string;
}

interface StudySession {
  topic: string;
  mode: string;
  timestamp: number;
  quizScore?: { correct: number; total: number };
  weakAreas?: string[];
}

type TabMode = 'chat' | 'flashcards' | 'quiz' | 'tools';
type ToolsSubMode = 'memory' | 'videos' | 'methods';
type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Study Methods (static) ─────────────────────────────
const STUDY_METHODS = [
  {
    name: 'Pomodoro Technique',
    icon: '🍅',
    description: '25-minute focused study sessions with 5-minute breaks.',
    chatPrompt: 'Help me set up a Pomodoro study session. Ask me what I want to study and create a structured 25-minute study plan.',
  },
  {
    name: 'Feynman Technique',
    icon: '🧑‍🏫',
    description: 'Explain a concept in simple terms to identify gaps.',
    chatPrompt: "Let's use the Feynman Technique. Ask me to explain a concept I'm studying, then point out gaps or inaccuracies in my explanation.",
  },
  {
    name: 'Spaced Repetition',
    icon: '📅',
    description: 'Review material at increasing intervals for retention.',
    chatPrompt: 'Help me create a spaced repetition schedule. Ask me what I need to learn and when my exam is, then create a day-by-day review plan.',
  },
  {
    name: 'Cornell Notes',
    icon: '📋',
    description: 'Structured note-taking with cues, notes, and summary.',
    chatPrompt: "Help me create Cornell-style notes. I'll paste my study material, and you organize it into the Cornell format with cues, notes, and a summary.",
  },
  {
    name: 'Mind Mapping',
    icon: '🗺️',
    description: 'Visual diagram connecting related concepts.',
    chatPrompt: 'Help me create a text-based mind map. Ask me for a topic, then create a structured outline showing how concepts connect to each other.',
  },
  {
    name: 'Active Recall',
    icon: '🔄',
    description: 'Test yourself repeatedly instead of re-reading notes.',
    chatPrompt: "Let's do active recall practice. Ask me what subject I'm studying, then quiz me with increasingly difficult questions. Don't give answers until I try.",
  },
];

const TABS: { key: TabMode; label: string; icon: string }[] = [
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { key: 'quiz', label: 'Quiz', icon: '📝' },
  { key: 'tools', label: 'Study Tools', icon: '🧠' },
];

// ─── Component ───────────────────────────────────────────
export default function ClassmateAIApp() {
  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabMode>('chat');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Flashcard state
  const [flashcardDeck, setFlashcardDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [matchingMode, setMatchingMode] = useState(false);
  const [matchingCards, setMatchingCards] = useState<{ id: number; text: string; type: 'front' | 'back'; pairId: number; matched: boolean }[]>([]);
  const [selectedMatchCards, setSelectedMatchCards] = useState<number[]>([]);
  const [matchMoves, setMatchMoves] = useState(0);
  const [matchComplete, setMatchComplete] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  // Study Tools state
  const [toolsSubMode, setToolsSubMode] = useState<ToolsSubMode>('memory');
  const [memoryTricks, setMemoryTricks] = useState<MemoryTrick[]>([]);
  const [videoRecs, setVideoRecs] = useState<VideoRecommendation[]>([]);
  const [isGeneratingTools, setIsGeneratingTools] = useState(false);

  // Shared input
  const [topicInput, setTopicInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [inputMode, setInputMode] = useState<'topic' | 'material'>('topic');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Adaptive learning
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);

  // Load adaptive learning data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('classmate-ai-sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        setStudySessions(parsed);
        const recent = parsed.slice(-10);
        const weak = recent.flatMap((s: StudySession) => s.weakAreas || []);
        setWeakAreas(Array.from(new Set(weak)) as string[]);
      }
    } catch { /* ignore */ }
  }, []);

  // Save sessions
  useEffect(() => {
    if (studySessions.length > 0) {
      localStorage.setItem('classmate-ai-sessions', JSON.stringify(studySessions.slice(-50)));
    }
  }, [studySessions]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Chat Functions ──────────────────────────────────
  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let systemPrompt = `You are Classmate AI, a friendly and encouraging study buddy. Help students understand topics, explain concepts clearly, and provide study tips. Use analogies and real-world examples.

When highlighting key information:
- Use **bold** for key terms (highlighted in yellow)
- Use ***triple asterisks*** for critical concepts (highlighted in pink)
- Use ==double equals== for definitions (highlighted in green)

Keep responses concise but thorough. Be encouraging and supportive.`;

    if (weakAreas.length > 0) {
      systemPrompt += `\n\nThe student has previously struggled with: ${weakAreas.join(', ')}. When relevant, spend extra time on these areas.`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let fullContent = '';
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
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { role: 'assistant', content: fullContent };
                  return newMessages;
                });
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'Sorry, there was an error. Please try again.',
        };
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleChatSubmit = () => {
    if (chatInput.trim() && !isStreaming) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  // ─── Study Content Generation ────────────────────────
  const generateStudyContent = async (mode: 'flashcards' | 'quiz' | 'memory' | 'videos') => {
    const topic = inputMode === 'topic' ? topicInput : undefined;
    const material = inputMode === 'material' ? materialInput : undefined;
    if (!topic && !material) return;

    const setLoading = mode === 'flashcards' ? setIsGeneratingCards
      : mode === 'quiz' ? setIsGeneratingQuiz
      : setIsGeneratingTools;

    setLoading(true);
    try {
      const response = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          topic,
          material: material?.slice(0, 8000),
          difficulty,
          count: mode === 'flashcards' ? 10 : mode === 'quiz' ? 8 : 6,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (mode === 'flashcards') {
        setFlashcardDeck(data);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setMatchingMode(false);
      } else if (mode === 'quiz') {
        setQuiz(data);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setQuizScore(0);
        setQuizComplete(false);
        setUserAnswers([]);
        setShowExplanation(false);
      } else if (mode === 'memory') {
        setMemoryTricks(data.tricks || []);
      } else if (mode === 'videos') {
        setVideoRecs(data.videos || []);
      }
    } catch (error) {
      console.error(`Error generating ${mode}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Flashcard Functions ─────────────────────────────
  const shuffleDeck = () => {
    if (!flashcardDeck) return;
    const shuffled = [...flashcardDeck.cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setFlashcardDeck({ ...flashcardDeck, cards: shuffled });
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const startMatchingGame = () => {
    if (!flashcardDeck) return;
    const cards = flashcardDeck.cards.slice(0, 6);
    const matchCards: typeof matchingCards = [];
    cards.forEach((card, i) => {
      matchCards.push({ id: i * 2, text: card.front, type: 'front', pairId: i, matched: false });
      matchCards.push({ id: i * 2 + 1, text: card.back, type: 'back', pairId: i, matched: false });
    });
    // Shuffle
    for (let i = matchCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matchCards[i], matchCards[j]] = [matchCards[j], matchCards[i]];
    }
    setMatchingCards(matchCards);
    setSelectedMatchCards([]);
    setMatchMoves(0);
    setMatchComplete(false);
    setMatchingMode(true);
  };

  const handleMatchCardClick = (index: number) => {
    if (matchingCards[index].matched || selectedMatchCards.includes(index)) return;
    if (selectedMatchCards.length === 2) return;

    const newSelected = [...selectedMatchCards, index];
    setSelectedMatchCards(newSelected);

    if (newSelected.length === 2) {
      setMatchMoves(prev => prev + 1);
      const card1 = matchingCards[newSelected[0]];
      const card2 = matchingCards[newSelected[1]];

      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // Match found
        setTimeout(() => {
          setMatchingCards(prev => prev.map(c =>
            c.pairId === card1.pairId ? { ...c, matched: true } : c
          ));
          setSelectedMatchCards([]);
          // Check if all matched
          const allMatched = matchingCards.every(c =>
            c.pairId === card1.pairId ? true : c.matched
          );
          if (allMatched) setMatchComplete(true);
        }, 500);
      } else {
        // No match
        setTimeout(() => setSelectedMatchCards([]), 800);
      }
    }
  };

  // ─── Quiz Functions ──────────────────────────────────
  const submitAnswer = () => {
    if (selectedAnswer === null || !quiz) return;
    const correct = selectedAnswer === quiz.questions[currentQuestionIndex].correctIndex;
    if (correct) setQuizScore(prev => prev + 1);
    setUserAnswers(prev => [...prev, selectedAnswer]);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      setQuizComplete(true);
      const wrongTopics = quiz.questions
        .filter((_, i) => userAnswers[i] !== undefined && userAnswers[i] !== quiz.questions[i].correctIndex)
        .map(q => q.question.slice(0, 50));
      const session: StudySession = {
        topic: topicInput || 'Custom material',
        mode: 'quiz',
        timestamp: Date.now(),
        quizScore: { correct: quizScore + (selectedAnswer === quiz.questions[currentQuestionIndex].correctIndex ? 1 : 0), total: quiz.questions.length },
        weakAreas: wrongTopics.slice(0, 5),
      };
      setStudySessions(prev => [...prev, session]);
      if (wrongTopics.length > 0) {
        setWeakAreas(prev => Array.from(new Set([...prev, ...wrongTopics])) as string[]);
      }
    }
  };

  const reviewFlashcardsFromQuiz = () => {
    if (!quiz) return;
    const wrongQuestions = quiz.questions.filter(
      (_, i) => userAnswers[i] !== undefined && userAnswers[i] !== quiz.questions[i].correctIndex
    );
    const deck: FlashcardDeck = {
      title: 'Review: Questions You Missed',
      cards: wrongQuestions.map((q, i) => ({
        id: i + 1,
        front: q.question,
        back: `${q.options[q.correctIndex]} — ${q.explanation}`,
      })),
    };
    setFlashcardDeck(deck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setMatchingMode(false);
    setActiveTab('flashcards');
  };

  // ─── Study Method Launcher ───────────────────────────
  const startStudyMethod = (chatPrompt: string) => {
    setActiveTab('chat');
    setTimeout(() => sendMessage(chatPrompt), 100);
  };

  // ─── Markdown Renderer ───────────────────────────────
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, '<span class="bg-rose-100 text-rose-800 px-1 rounded font-semibold">$1</span>')
      .replace(/==(.+?)==/g, '<span class="bg-emerald-100 text-emerald-800 px-1 rounded">$1</span>')
      .replace(/^### (.+)$/gm, '<h4 class="font-bold text-lg mt-4 mb-2">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="font-bold text-xl mt-6 mb-3">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<span class="bg-yellow-100 text-yellow-800 px-1 rounded font-semibold">$1</span>')
      .replace(/`([^`]+)`/g, '<code class="bg-primary-100 text-accent-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^\* (.+)$/gm, '<li class="ml-4">&#8226; $1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '<br/><br/>');
  };

  // ─── Input Panel (shared) ────────────────────────────
  const renderInputPanel = (generateLabel: string, onGenerate: () => void, isLoading: boolean) => (
    <div className="bg-white border border-primary-200 rounded-card p-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInputMode('topic')}
          className={`px-4 py-2 text-sm font-medium rounded-button transition-colors ${
            inputMode === 'topic' ? 'bg-accent-600 text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
          }`}
        >
          Enter a topic
        </button>
        <button
          onClick={() => setInputMode('material')}
          className={`px-4 py-2 text-sm font-medium rounded-button transition-colors ${
            inputMode === 'material' ? 'bg-accent-600 text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
          }`}
        >
          Paste study material
        </button>
      </div>

      {inputMode === 'topic' ? (
        <input
          type="text"
          value={topicInput}
          onChange={e => setTopicInput(e.target.value)}
          placeholder="e.g., Photosynthesis, World War II, Calculus..."
          className="w-full px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400 mb-4"
        />
      ) : (
        <div className="mb-4">
          <textarea
            value={materialInput}
            onChange={e => setMaterialInput(e.target.value)}
            placeholder="Paste your notes, textbook excerpt, or study guide here..."
            className="w-full px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400 min-h-[120px] resize-y"
            maxLength={10000}
          />
          <div className="text-xs text-primary-400 text-right mt-1">
            {materialInput.length}/10,000
          </div>
        </div>
      )}

      {(generateLabel.includes('Flashcard') || generateLabel.includes('Quiz')) && (
        <div className="flex gap-2 mb-4">
          <span className="text-sm text-primary-500 self-center mr-2">Difficulty:</span>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                difficulty === d
                  ? d === 'easy' ? 'bg-emerald-500 text-white'
                    : d === 'hard' ? 'bg-rose-500 text-white'
                    : 'bg-accent-600 text-white'
                  : 'bg-primary-100 text-primary-500 hover:bg-primary-200'
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isLoading || (!topicInput.trim() && !materialInput.trim())}
        className="w-full py-3 bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 text-white font-semibold rounded-button transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </span>
        ) : generateLabel}
      </button>
    </div>
  );

  // ─── Stats Bar ───────────────────────────────────────
  const renderStatsBar = () => {
    const quizSessions = studySessions.filter(s => s.quizScore);
    const avgScore = quizSessions.length > 0
      ? Math.round(quizSessions.reduce((acc, s) => acc + ((s.quizScore!.correct / s.quizScore!.total) * 100), 0) / quizSessions.length)
      : 0;

    return (
      <div className="bg-primary-50 border border-primary-100 rounded-button px-4 py-2 mb-4 flex flex-wrap gap-4 text-xs text-primary-500">
        <span>Sessions: {studySessions.length}</span>
        {quizSessions.length > 0 && <span>Quiz avg: {avgScore}%</span>}
        {weakAreas.length > 0 && (
          <span>Focus: {weakAreas.slice(0, 3).map(w => w.slice(0, 25)).join(', ')}</span>
        )}
      </div>
    );
  };

  // ─── Chat Tab ────────────────────────────────────────
  const renderChatTab = () => (
    <div className="bg-white border border-primary-200 rounded-card p-6 flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px] mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-primary-400 text-sm gap-3">
            <span className="text-4xl">📚</span>
            <span>Ask me anything! I&apos;m your AI study buddy.</span>
            <span className="text-xs">Try: &quot;Explain photosynthesis&quot; or &quot;Help me study for my history exam&quot;</span>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-accent-50 border border-accent-100'
                    : 'bg-primary-50'
                }`}
              >
                <div className="text-xs font-medium text-primary-500 mb-1">
                  {msg.role === 'user' ? 'You' : 'Classmate AI'}
                </div>
                <div
                  className="text-sm text-primary-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-center gap-1 mt-2">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
          placeholder="Ask a question or paste something to study..."
          className="flex-1 px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400"
        />
        <button
          onClick={handleChatSubmit}
          disabled={isStreaming || !chatInput.trim()}
          className="px-4 py-2 bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 text-white text-sm font-medium rounded-button"
        >
          Send
        </button>
      </div>
    </div>
  );

  // ─── Flashcards Tab ──────────────────────────────────
  const renderFlashcardsTab = () => {
    if (!flashcardDeck) {
      return renderInputPanel('Generate Flashcards', () => generateStudyContent('flashcards'), isGeneratingCards);
    }

    if (matchingMode) {
      return (
        <div className="bg-white border border-primary-200 rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary-900">Matching Game</h3>
            <div className="flex gap-3 text-sm text-primary-500">
              <span>Moves: {matchMoves}</span>
              <button onClick={() => setMatchingMode(false)} className="text-accent-600 hover:underline">
                Back to Cards
              </button>
            </div>
          </div>

          {matchComplete ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-lg font-semibold text-primary-900 mb-1">All Matched!</p>
              <p className="text-sm text-primary-500 mb-4">Completed in {matchMoves} moves</p>
              <button
                onClick={startMatchingGame}
                className="px-6 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-button"
              >
                Play Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {matchingCards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleMatchCardClick(index)}
                  disabled={card.matched}
                  className={`p-3 min-h-[80px] rounded-lg text-xs font-medium transition-all ${
                    card.matched
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-600 opacity-60'
                      : selectedMatchCards.includes(index)
                      ? 'bg-accent-50 border-2 border-accent-400 text-accent-700'
                      : 'bg-primary-50 border border-primary-200 text-primary-700 hover:border-primary-400 cursor-pointer'
                  }`}
                >
                  {card.matched || selectedMatchCards.includes(index) ? card.text : '?'}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    const card = flashcardDeck.cards[currentCardIndex];
    return (
      <div className="bg-white border border-primary-200 rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary-900">{flashcardDeck.title}</h3>
          <span className="text-sm text-primary-400">
            {currentCardIndex + 1} of {flashcardDeck.cards.length}
          </span>
        </div>

        {card.category && (
          <span className="inline-block px-2 py-0.5 bg-accent-50 text-accent-600 text-xs font-medium rounded-full mb-3">
            {card.category}
          </span>
        )}

        {/* Flashcard */}
        <div
          className="relative w-full h-64 cursor-pointer mb-4"
          style={{ perspective: '1000px' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className="absolute inset-0 transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-white to-primary-50 border border-primary-200 rounded-card p-8 flex items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-xl font-semibold text-primary-900">{card.front}</p>
            </div>
            <div
              className="absolute inset-0 bg-gradient-to-br from-accent-50 to-indigo-50 border border-accent-200 rounded-card p-8 flex items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-lg text-primary-700">{card.back}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-primary-400 mb-4">Click card to flip</p>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setCurrentCardIndex(prev => prev - 1); setIsFlipped(false); }}
            disabled={currentCardIndex === 0}
            className="px-4 py-2 bg-primary-100 hover:bg-primary-200 disabled:opacity-40 text-primary-600 text-sm font-medium rounded-button"
          >
            Previous
          </button>
          <div className="flex gap-2">
            <button
              onClick={shuffleDeck}
              className="px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-600 text-xs font-medium rounded-button"
            >
              Shuffle
            </button>
            <button
              onClick={startMatchingGame}
              className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium rounded-button"
            >
              Matching Game
            </button>
          </div>
          <button
            onClick={() => { setCurrentCardIndex(prev => prev + 1); setIsFlipped(false); }}
            disabled={currentCardIndex === flashcardDeck.cards.length - 1}
            className="px-4 py-2 bg-primary-100 hover:bg-primary-200 disabled:opacity-40 text-primary-600 text-sm font-medium rounded-button"
          >
            Next
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-4">
          {flashcardDeck.cards.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentCardIndex ? 'bg-accent-600' : 'bg-primary-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => { setFlashcardDeck(null); setMatchingMode(false); }}
          className="w-full mt-4 py-2 text-sm text-primary-500 hover:text-primary-700"
        >
          Generate New Deck
        </button>
      </div>
    );
  };

  // ─── Quiz Tab ────────────────────────────────────────
  const renderQuizTab = () => {
    if (!quiz) {
      return renderInputPanel('Generate Quiz', () => generateStudyContent('quiz'), isGeneratingQuiz);
    }

    if (quizComplete) {
      const finalScore = quizScore;
      const total = quiz.questions.length;
      const pct = Math.round((finalScore / total) * 100);
      const wrongQuestions = quiz.questions.filter(
        (_, i) => userAnswers[i] !== undefined && userAnswers[i] !== quiz.questions[i].correctIndex
      );

      return (
        <div className="bg-white border border-primary-200 rounded-card p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">{pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '📖'}</div>
            <h3 className="text-xl font-bold text-primary-900 mb-1">Quiz Complete!</h3>
            <p className={`text-2xl font-bold ${
              pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-accent-600' : 'text-amber-600'
            }`}>
              {finalScore}/{total} ({pct}%)
            </p>
            <p className="text-sm text-primary-500 mt-1">
              {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job, keep studying!' : 'Keep practicing, you\'ll get there!'}
            </p>
          </div>

          {wrongQuestions.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-primary-900 mb-3">Questions to Review:</h4>
              <div className="space-y-3">
                {wrongQuestions.map((q, i) => (
                  <div key={i} className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-primary-900 mb-1">{q.question}</p>
                    <p className="text-xs text-emerald-700">Correct: {q.options[q.correctIndex]}</p>
                    <p className="text-xs text-primary-500 mt-1">{q.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setQuiz(null); setQuizComplete(false); }}
              className="flex-1 py-2 bg-primary-100 hover:bg-primary-200 text-primary-600 font-medium rounded-button text-sm"
            >
              New Quiz
            </button>
            {wrongQuestions.length > 0 && (
              <button
                onClick={reviewFlashcardsFromQuiz}
                className="flex-1 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-button text-sm"
              >
                Review as Flashcards
              </button>
            )}
          </div>
        </div>
      );
    }

    const question = quiz.questions[currentQuestionIndex];
    const answered = showExplanation;

    return (
      <div className="bg-white border border-primary-200 rounded-card p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-primary-900">{quiz.title}</h3>
          <span className="text-sm text-primary-400">
            {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-primary-100 rounded-full h-1.5 mb-6">
          <div
            className="bg-accent-600 h-1.5 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        <p className="text-base font-medium text-primary-900 mb-4">{question.question}</p>

        <div className="space-y-2 mb-4">
          {question.options.map((option, i) => {
            let btnClass = 'bg-white border border-primary-200 hover:border-primary-400 text-primary-700';
            if (answered) {
              if (i === question.correctIndex) {
                btnClass = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-800';
              } else if (i === selectedAnswer && i !== question.correctIndex) {
                btnClass = 'bg-rose-50 border-2 border-rose-400 text-rose-800';
              } else {
                btnClass = 'bg-white border border-primary-100 text-primary-400';
              }
            } else if (selectedAnswer === i) {
              btnClass = 'bg-accent-50 border-2 border-accent-400 text-accent-700';
            }

            return (
              <button
                key={i}
                onClick={() => !answered && setSelectedAnswer(i)}
                disabled={answered}
                className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all ${btnClass}`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-primary-700">{question.explanation}</p>
          </div>
        )}

        {!answered ? (
          <button
            onClick={submitAnswer}
            disabled={selectedAnswer === null}
            className="w-full py-3 bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 text-white font-semibold rounded-button"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="w-full py-3 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-button"
          >
            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    );
  };

  // ─── Study Tools Tab ─────────────────────────────────
  const renderToolsTab = () => (
    <div>
      {/* Sub-tab nav */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'memory' as ToolsSubMode, label: 'Memory Tricks', icon: '🧩' },
          { key: 'videos' as ToolsSubMode, label: 'Video Finder', icon: '🎬' },
          { key: 'methods' as ToolsSubMode, label: 'Study Methods', icon: '📖' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setToolsSubMode(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-button transition-colors ${
              toolsSubMode === tab.key
                ? 'bg-primary-900 text-white'
                : 'bg-primary-100 text-primary-500 hover:bg-primary-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {toolsSubMode === 'memory' && renderMemoryTricks()}
      {toolsSubMode === 'videos' && renderVideoFinder()}
      {toolsSubMode === 'methods' && renderStudyMethods()}
    </div>
  );

  const renderMemoryTricks = () => (
    <div>
      {memoryTricks.length === 0 ? (
        renderInputPanel('Generate Memory Tricks', () => generateStudyContent('memory'), isGeneratingTools)
      ) : (
        <div>
          <div className="space-y-3 mb-4">
            {memoryTricks.map((trick, i) => (
              <div key={i} className="bg-white border border-primary-200 rounded-card p-4">
                <span className="inline-block px-2 py-0.5 bg-accent-50 text-accent-600 text-xs font-medium rounded-full mb-2">
                  {trick.technique}
                </span>
                <p className="font-semibold text-primary-900 text-sm mb-1">{trick.term}</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-primary-800">{trick.trick}</p>
                </div>
                <p className="text-xs text-primary-500">{trick.explanation}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setMemoryTricks([])}
            className="w-full py-2 text-sm text-primary-500 hover:text-primary-700"
          >
            Generate New Tricks
          </button>
        </div>
      )}
    </div>
  );

  const renderVideoFinder = () => (
    <div>
      {videoRecs.length === 0 ? (
        renderInputPanel('Find Videos', () => generateStudyContent('videos'), isGeneratingTools)
      ) : (
        <div>
          <div className="space-y-3 mb-4">
            {videoRecs.map((video, i) => (
              <div key={i} className="bg-white border border-primary-200 rounded-card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎬</span>
                  <div className="flex-1">
                    <p className="font-semibold text-primary-900 text-sm">{video.title}</p>
                    <p className="text-xs text-accent-600 font-medium">{video.channel}</p>
                    <p className="text-xs text-primary-500 mt-1">{video.description}</p>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium mt-2"
                    >
                      Search on YouTube →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setVideoRecs([])}
            className="w-full py-2 text-sm text-primary-500 hover:text-primary-700"
          >
            Find More Videos
          </button>
        </div>
      )}
    </div>
  );

  const renderStudyMethods = () => (
    <div className="grid gap-3 md:grid-cols-2">
      {STUDY_METHODS.map((method, i) => (
        <div key={i} className="bg-white border border-primary-200 rounded-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{method.icon}</span>
            <h4 className="font-semibold text-primary-900 text-sm">{method.name}</h4>
          </div>
          <p className="text-xs text-primary-500 mb-3">{method.description}</p>
          <button
            onClick={() => startStudyMethod(method.chatPrompt)}
            className="w-full py-2 bg-accent-50 hover:bg-accent-100 text-accent-700 text-xs font-medium rounded-button transition-colors"
          >
            Start with AI
          </button>
        </div>
      ))}
    </div>
  );

  // ─── Main Render ─────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary-900">Classmate AI</h1>
        <p className="text-primary-500 text-sm">Your AI-powered study companion</p>
      </div>

      {studySessions.length > 0 && renderStatsBar()}

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-button transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-accent-600 text-white'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'chat' && renderChatTab()}
      {activeTab === 'flashcards' && renderFlashcardsTab()}
      {activeTab === 'quiz' && renderQuizTab()}
      {activeTab === 'tools' && renderToolsTab()}
    </div>
  );
}
