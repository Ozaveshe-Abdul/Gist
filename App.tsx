
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout.tsx';
import CategoryBar from './components/CategoryBar.tsx';
import NewsCard from './components/NewsCard.tsx';
import ArticleView from './components/ArticleView.tsx';
import Skeleton from './components/Skeleton.tsx';
import { NewsArticle, CategoryType } from './types.ts';
import { fetchNewsArticles, getGistAudioBuffer } from './services/geminiService.ts';

const BOOKMARKS_KEY = 'gist_bookmarks_v1';
const PULL_THRESHOLD = 80;

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('General');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>(() => {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string>("your region");

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  // Audio State
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Try to detect user location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_name) {
          setUserLocation(data.country_name);
        }
      } catch (e) {
        console.warn("Failed to detect location, falling back to general region.");
      }
    };
    fetchLocation();
  }, []);

  const loadNews = useCallback(async (category: CategoryType, isManualRefresh = false) => {
    if (category === 'Bookmarks') {
      setArticles(bookmarks);
      setLoading(false);
      setIsRefreshing(false);
      setError(null);
      return;
    }

    if (!isManualRefresh) setLoading(true);
    setError(null);
    try {
      const data = await fetchNewsArticles(category, userLocation);
      if (data.length === 0) {
        setError(`Unable to find ${category} news for ${userLocation}. Please try again later.`);
      } else {
        setArticles(data);
      }
    } catch (err) {
      setError("Something went wrong fetching the latest stories.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [bookmarks, userLocation]);

  useEffect(() => {
    loadNews(activeCategory);
  }, [activeCategory, loadNews]);

  // Touch handlers for Pull to Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && window.scrollY === 0) {
      const dampenedDiff = Math.min(diff * 0.4, 120);
      setPullDistance(dampenedDiff);
      
      if (diff > 10) {
        if (e.cancelable) e.preventDefault();
      }
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      loadNews(activeCategory, true);
    } else {
      setPullDistance(0);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setCurrentlyPlayingId(null);
    setIsAudioLoading(false);
  };

  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
    // Explicitly stop any active audio when switching categories
    stopAudio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const playArticleAudio = async (article: NewsArticle) => {
    // If clicking same article, toggle stop
    if (currentlyPlayingId === article.id) {
      stopAudio();
      return;
    }

    // Stop whatever is currently playing before starting new
    stopAudio();
    setIsAudioLoading(true);
    setCurrentlyPlayingId(article.id);

    try {
      const result = await getGistAudioBuffer(article.title, article.gist);
      
      // Verification: Check if this article is still the one the user wants to hear
      // This prevents audio from playing if the user switched categories or clicked another article
      // while the AI was generating the summary speech.
      if (result && currentlyPlayingId === article.id) {
        const { audioBuffer, audioContext } = result;
        audioContextRef.current = audioContext;
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          // Only auto-play next if we haven't manually stopped or switched
          if (currentlyPlayingId === article.id) {
            const currentIndex = articles.findIndex(a => a.id === article.id);
            if (currentIndex !== -1 && currentIndex < articles.length - 1) {
              playArticleAudio(articles[currentIndex + 1]);
            } else {
              setCurrentlyPlayingId(null);
            }
          }
        };

        audioSourceRef.current = source;
        source.start();
        setIsAudioLoading(false);
      } else if (currentlyPlayingId === article.id) {
        // Only reset if we haven't already moved to a different state
        stopAudio();
      }
    } catch (err) {
      console.error("Audio playback error:", err);
      if (currentlyPlayingId === article.id) stopAudio();
    }
  };

  const handleReadMore = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  const toggleBookmark = (article: NewsArticle) => {
    setBookmarks(prev => {
      const isBookmarked = prev.find(b => b.url === article.url);
      if (isBookmarked) {
        return prev.filter(b => b.url !== article.url);
      } else {
        return [article, ...prev];
      }
    });
  };

  const isArticleBookmarked = (article: NewsArticle) => {
    return !!bookmarks.find(b => b.url === article.url);
  };

  return (
    <Layout>
      <CategoryBar 
        activeCategory={activeCategory} 
        onSelect={handleCategoryChange} 
      />

      <div 
        className="flex flex-col min-h-[60vh] relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="absolute left-0 right-0 flex flex-col items-center justify-center overflow-hidden transition-all duration-200 pointer-events-none"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance / PULL_THRESHOLD,
            zIndex: 50
          }}
        >
          <div className={`p-2 rounded-full bg-white shadow-md border border-gray-100 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
               style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
            {isRefreshing ? 'Updating gist...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>

        {activeCategory === 'Home Politics' && !loading && (
          <div className="px-6 pt-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Politics in {userLocation}
            </p>
          </div>
        )}

        {loading ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : error ? (
          <div className="px-6 py-20 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">{error}</p>
            <button 
              onClick={() => loadNews(activeCategory)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : activeCategory === 'Bookmarks' && articles.length === 0 ? (
          <div className="px-6 py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No bookmarks yet</h3>
            <p className="text-gray-500 text-sm mt-1">Articles you save will appear here.</p>
          </div>
        ) : (
          articles.map((article) => (
            <NewsCard 
              key={article.id || article.url} 
              article={article} 
              onReadMore={handleReadMore}
              isBookmarked={isArticleBookmarked(article)}
              onToggleBookmark={() => toggleBookmark(article)}
              isPlaying={currentlyPlayingId === article.id}
              isAudioLoading={isAudioLoading && currentlyPlayingId === article.id}
              onToggleAudio={() => playArticleAudio(article)}
            />
          ))
        )}
      </div>

      <footer className="px-6 py-12 text-center text-gray-400 text-xs border-t border-gray-50">
        <p>&copy; {new Date().getFullYear()} Gist News. All rights reserved.</p>
        <p className="mt-2">Powered by Gemini AI Engine</p>
      </footer>

      {selectedArticle && (
        <ArticleView 
          article={selectedArticle} 
          onClose={handleCloseArticle}
          isBookmarked={isArticleBookmarked(selectedArticle)}
          onToggleBookmark={() => toggleBookmark(selectedArticle)}
          isPlaying={currentlyPlayingId === selectedArticle.id}
          isAudioLoading={isAudioLoading && currentlyPlayingId === selectedArticle.id}
          onToggleAudio={() => playArticleAudio(selectedArticle)}
        />
      )}
    </Layout>
  );
};

export default App;
