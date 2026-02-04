'use client';

import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TripPlannerApp() {
  const [destination, setDestination] = useState('Lake Tahoe Resort');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [kidAges, setKidAges] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const checkInDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const checkOutDate = new Date(checkInDate.getTime() + 5 * 24 * 60 * 60 * 1000);

    setCheckIn(checkInDate.toISOString().split('T')[0]);
    setCheckOut(checkOutDate.toISOString().split('T')[0]);
  }, []);

  // Update kid ages when count changes
  useEffect(() => {
    setKidAges((prev) => {
      if (kids > prev.length) {
        return [...prev, ...Array(kids - prev.length).fill(5)];
      }
      return prev.slice(0, kids);
    });
  }, [kids]);

  const buildPrompt = () => {
    const kidInfo = kids > 0
      ? `Traveling with ${kids} kid(s) aged: ${kidAges.join(', ')}`
      : 'No children traveling';

    return `Plan a family trip to ${destination}.
Check-in: ${checkIn}
Check-out: ${checkOut}
Adults: ${adults}
${kidInfo}

Please provide:
1. Overview of the destination
2. Recommended activities for the family
3. Dining suggestions
4. Any tips for families with children (if applicable)`;
  };

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: 'You are a warm, family-friendly vacation guide. Help families plan amazing trips with personalized itineraries, activity recommendations, dining suggestions, and family-specific guidance. Be enthusiastic but practical.',
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content[0].text,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request. Please try again later.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlan = () => {
    sendMessage(buildPrompt());
  };

  const handleFollowUp = () => {
    if (followUp.trim()) {
      sendMessage(followUp);
      setFollowUp('');
    }
  };

  // Simple markdown to HTML conversion
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h4 class="font-bold text-lg mt-4 mb-2">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="font-bold text-xl mt-6 mb-3">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\* (.+)$/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '<br/><br/>');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Trip Planner</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white border border-primary-200 rounded-card p-6">
          <h2 className="font-semibold text-primary-900 mb-4">Trip Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-600 mb-1">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-1">
                  Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-1">
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-1">
                  Adults
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 bg-primary-100 hover:bg-primary-200 rounded text-primary-600 font-medium"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{adults}</span>
                  <button
                    onClick={() => setAdults(adults + 1)}
                    className="w-8 h-8 bg-primary-100 hover:bg-primary-200 rounded text-primary-600 font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-1">
                  Kids
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setKids(Math.max(0, kids - 1))}
                    className="w-8 h-8 bg-primary-100 hover:bg-primary-200 rounded text-primary-600 font-medium"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{kids}</span>
                  <button
                    onClick={() => setKids(kids + 1)}
                    className="w-8 h-8 bg-primary-100 hover:bg-primary-200 rounded text-primary-600 font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {kids > 0 && (
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-2">
                  Kid Ages
                </label>
                <div className="flex flex-wrap gap-2">
                  {kidAges.map((age, i) => (
                    <input
                      key={i}
                      type="number"
                      min="0"
                      max="17"
                      value={age}
                      onChange={(e) => {
                        const newAges = [...kidAges];
                        newAges[i] = parseInt(e.target.value) || 0;
                        setKidAges(newAges);
                      }}
                      className="w-16 px-2 py-1 border border-primary-200 rounded text-sm text-center focus:outline-none focus:border-primary-400"
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handlePlan}
              disabled={isLoading}
              className="w-full py-3 bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 text-white font-semibold rounded-button transition-colors"
            >
              {isLoading ? 'Planning...' : 'Plan My Trip'}
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-white border border-primary-200 rounded-card p-6 flex flex-col">
          <h2 className="font-semibold text-primary-900 mb-4">Trip Plan</h2>

          <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px] mb-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-primary-400 text-sm">
                Fill in your trip details and click &quot;Plan My Trip&quot; to get started!
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
                      {msg.role === 'user' ? 'You' : 'Trip Planner'}
                    </div>
                    <div
                      className="text-sm text-primary-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  </div>
                ))}
                {isLoading && (
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <div className="text-xs font-medium text-primary-500 mb-1">
                      Trip Planner
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                placeholder="Ask a follow-up question..."
                className="flex-1 px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400"
              />
              <button
                onClick={handleFollowUp}
                disabled={isLoading || !followUp.trim()}
                className="px-4 py-2 bg-primary-900 hover:bg-primary-800 disabled:bg-primary-300 text-white text-sm font-medium rounded-button"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
