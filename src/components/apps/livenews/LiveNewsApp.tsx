'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
  category: string;
}

type Category = 'all' | 'business' | 'technology' | 'education' | 'health';

const CATEGORIES: { key: Category; label: string; query: string }[] = [
  { key: 'all', label: 'All News', query: 'latest OR breaking OR news' },
  { key: 'business', label: 'Business', query: 'business OR markets OR economy OR finance' },
  { key: 'technology', label: 'Technology', query: 'technology OR tech OR AI OR software OR innovation' },
  { key: 'education', label: 'Kids Research', query: 'kids education OR child development OR learning OR STEM' },
  { key: 'health', label: 'Emotional Intelligence', query: 'emotional intelligence OR mental health OR mindfulness OR psychology' },
];

export default function LiveNewsApp() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [articles, setArticles] = useState<Record<Category, Article[]>>({
    all: [],
    business: [],
    technology: [],
    education: [],
    health: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Initialize API key
  useEffect(() => {
    const savedKey = localStorage.getItem('newsApiKey');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey(process.env.NEXT_PUBLIC_NEWS_API_KEY || '');
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('newsApiKey', apiKey);
    setShowApiKey(false);
    loadAllNews();
  };

  const fetchNewsForCategory = useCallback(async (category: Category) => {
    const cat = CATEGORIES.find((c) => c.key === category);
    if (!cat) return [];

    try {
      // Use server-side API route to avoid CORS issues with NewsAPI
      const url = `/api/news?q=${encodeURIComponent(cat.query)}${apiKey ? `&apiKey=${apiKey}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'ok') {
        return data.articles.map((article: Article) => ({
          ...article,
          category: cat.label,
        }));
      }
      return [];
    } catch (err) {
      console.error(`Error fetching ${category} news:`, err);
      throw err;
    }
  }, [apiKey]);

  const loadAllNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        CATEGORIES.map((cat) => fetchNewsForCategory(cat.key))
      );

      const newArticles: Record<Category, Article[]> = {
        all: results[0] || [],
        business: results[1] || [],
        technology: results[2] || [],
        education: results[3] || [],
        health: results[4] || [],
      };

      setArticles(newArticles);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setIsLoading(false);
    }
  }, [fetchNewsForCategory]);

  // Load news on mount and set up auto-refresh
  useEffect(() => {
    loadAllNews();
    const interval = setInterval(loadAllNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAllNews]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const currentArticles = articles[activeCategory] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-900">📰 Live News Stream</h1>
        <button
          onClick={() => setShowApiKey(!showApiKey)}
          className="text-sm text-primary-500 hover:text-primary-700"
        >
          🔑 API Key
        </button>
      </div>

      {/* API Key Section */}
      {showApiKey && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-card">
          <p className="text-sm text-primary-600 mb-3">
            Enter your NewsAPI key from{' '}
            <a href="https://newsapi.org/register" target="_blank" rel="noopener noreferrer" className="underline">
              newsapi.org
            </a>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your NewsAPI key..."
              className="flex-1 px-3 py-2 border border-primary-200 rounded-button text-sm focus:outline-none focus:border-primary-400"
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-primary-900 text-white text-sm font-medium rounded-button hover:bg-primary-800"
            >
              Save & Load News
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {lastUpdated && (
        <div className="flex items-center justify-center gap-2 p-3 bg-white border border-primary-200 rounded-card mb-6 text-sm text-primary-500">
          <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
          Live • Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-button transition-colors ${
              activeCategory === cat.key
                ? 'bg-primary-900 text-white'
                : 'bg-white border border-primary-200 text-primary-500 hover:border-primary-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-card text-red-700 text-center mb-6">
          {error}. Please check your API key and try again.
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-500">Loading latest news...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && currentArticles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🗞️</div>
          <p className="text-primary-500">
            No news articles found for this category
          </p>
        </div>
      )}

      {/* News Grid */}
      {!isLoading && currentArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentArticles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-primary-200 rounded-card overflow-hidden transition-all hover:border-primary-900 hover:shadow-card-hover hover:-translate-y-0.5"
            >
              {article.urlToImage && (
                <div className="relative h-44 bg-primary-100">
                  <Image
                    src={article.urlToImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-5">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary-900 bg-primary-50 px-2 py-1 rounded mb-3">
                  {article.category}
                </span>
                <h3 className="font-bold text-primary-900 mb-2 line-clamp-2 group-hover:text-accent-600">
                  {article.title}
                </h3>
                <p className="text-sm text-primary-500 line-clamp-2 mb-4">
                  {article.description || 'Click to read more...'}
                </p>
                <div className="flex justify-between items-center text-xs text-primary-400 pt-3 border-t border-primary-100">
                  <span className="font-semibold">{article.source.name}</span>
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
