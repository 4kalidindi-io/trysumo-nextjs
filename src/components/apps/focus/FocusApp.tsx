'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Event {
  id: string;
  title: string;
  time: string;
  duration: number; // in minutes
}

interface FocusSession {
  startTime: Date;
  duration: number;
  completed: boolean;
}

const FOCUS_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

export default function FocusApp() {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDuration, setNewEventDuration] = useState(30);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionsToday, setSessionsToday] = useState<FocusSession[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load events and sessions from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedEvents = localStorage.getItem(`focus-events-${today}`);
    const savedSessions = localStorage.getItem(`focus-sessions-${today}`);

    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
    if (savedSessions) {
      setSessionsToday(JSON.parse(savedSessions));
    }

    // Create audio element for notification
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleD8V2n6T/Pu5dwAA');
  }, []);

  // Save events to localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(`focus-events-${today}`, JSON.stringify(events));
  }, [events]);

  // Save sessions to localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(`focus-sessions-${today}`, JSON.stringify(sessionsToday));
  }, [sessionsToday]);

  // Timer logic
  useEffect(() => {
    if (isFocusMode && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer completed
            clearInterval(timerRef.current!);
            setIsFocusMode(false);
            audioRef.current?.play();
            setSessionsToday((prev) => [
              ...prev,
              { startTime: new Date(), duration: focusDuration, completed: true },
            ]);
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
  }, [isFocusMode, timeRemaining, focusDuration]);

  const startFocus = useCallback(() => {
    setTimeRemaining(focusDuration * 60);
    setIsFocusMode(true);
  }, [focusDuration]);

  const stopFocus = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const elapsed = focusDuration * 60 - timeRemaining;
    if (elapsed > 60) {
      setSessionsToday((prev) => [
        ...prev,
        { startTime: new Date(), duration: Math.floor(elapsed / 60), completed: false },
      ]);
    }
    setIsFocusMode(false);
    setTimeRemaining(0);
  }, [focusDuration, timeRemaining]);

  const addEvent = () => {
    if (!newEventTitle.trim() || !newEventTime) return;

    const event: Event = {
      id: Date.now().toString(),
      title: newEventTitle.trim(),
      time: newEventTime,
      duration: newEventDuration,
    };

    setEvents((prev) => [...prev, event].sort((a, b) => a.time.localeCompare(b.time)));
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventDuration(30);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalFocusTime = () => {
    return sessionsToday.reduce((acc, s) => acc + s.duration, 0);
  };

  const getCurrentEvent = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return events.find((e) => {
      const eventEnd = new Date();
      const [hours, mins] = e.time.split(':').map(Number);
      eventEnd.setHours(hours, mins + e.duration, 0);
      const endTime = `${eventEnd.getHours().toString().padStart(2, '0')}:${eventEnd.getMinutes().toString().padStart(2, '0')}`;
      return e.time <= currentTime && endTime >= currentTime;
    });
  };

  const currentEvent = getCurrentEvent();

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isFocusMode ? 'bg-primary-900' : 'bg-gradient-to-br from-primary-50 to-white'}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isFocusMode ? 'text-white' : 'text-primary-900'}`}>
            {isFocusMode ? 'Focus Mode' : 'Focus'}
          </h1>
          <p className={`${isFocusMode ? 'text-white/70' : 'text-primary-500'}`}>
            {isFocusMode ? 'Stay concentrated on your task' : 'Plan your day and stay focused'}
          </p>
        </div>

        {/* Focus Mode Active */}
        {isFocusMode ? (
          <div className="flex flex-col items-center justify-center py-12">
            {/* Timer Display */}
            <div className="relative mb-8">
              <div className="w-64 h-64 rounded-full border-8 border-accent-500/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white font-mono">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-white/50 mt-2">remaining</div>
                </div>
              </div>
              {/* Progress ring */}
              <svg className="absolute inset-0 w-64 h-64 -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-accent-500"
                  strokeDasharray={754}
                  strokeDashoffset={754 - (754 * timeRemaining) / (focusDuration * 60)}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {currentEvent && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 mb-6">
                <p className="text-white/70 text-sm">Current event</p>
                <p className="text-white font-semibold">{currentEvent.title}</p>
              </div>
            )}

            <button
              onClick={stopFocus}
              className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-xl border border-red-500/30 transition-colors"
            >
              End Focus Session
            </button>

            <p className="mt-8 text-white/40 text-sm">
              Press ESC or click the button to exit focus mode
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Today&apos;s Schedule
              </h2>

              {/* Add Event Form */}
              <div className="space-y-3 mb-4 p-4 bg-primary-50 rounded-xl">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:border-accent-500"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:border-accent-500"
                  />
                  <select
                    value={newEventDuration}
                    onChange={(e) => setNewEventDuration(Number(e.target.value))}
                    className="px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:border-accent-500"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <button
                  onClick={addEvent}
                  disabled={!newEventTitle.trim() || !newEventTime}
                  className="w-full py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-primary-200 text-white disabled:text-primary-400 font-medium rounded-lg transition-colors"
                >
                  Add Event
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-primary-400 text-center py-6 text-sm">
                    No events scheduled. Add some above!
                  </p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        currentEvent?.id === event.id
                          ? 'bg-accent-50 border-accent-200'
                          : 'bg-white border-primary-100 hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-mono text-primary-500">{event.time}</div>
                        <div>
                          <div className="font-medium text-primary-900">{event.title}</div>
                          <div className="text-xs text-primary-400">{event.duration} min</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeEvent(event.id)}
                        className="p-1 hover:bg-red-50 rounded text-primary-300 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Focus Timer */}
            <div className="bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Focus Timer
              </h2>

              {/* Duration Selection */}
              <div className="mb-6">
                <p className="text-sm text-primary-500 mb-2">Select duration</p>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setFocusDuration(d.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        focusDuration === d.value
                          ? 'bg-accent-500 text-white'
                          : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={startFocus}
                className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-lg rounded-xl transition-all hover:shadow-lg hover:shadow-accent-500/30"
              >
                Start Focus Session
              </button>

              {/* Today's Stats */}
              <div className="mt-6 pt-6 border-t border-primary-100">
                <h3 className="text-sm font-semibold text-primary-900 mb-3">Today&apos;s Progress</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-accent-600">{sessionsToday.length}</div>
                    <div className="text-xs text-primary-500">Sessions</div>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-accent-600">{getTotalFocusTime()}</div>
                    <div className="text-xs text-primary-500">Minutes focused</div>
                  </div>
                </div>

                {sessionsToday.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {sessionsToday.slice(-3).map((session, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-primary-500">
                        <span className={`w-2 h-2 rounded-full ${session.completed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{session.duration} min {session.completed ? 'completed' : 'partial'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
