
import React, { useState } from 'react';
import { NewsArticle } from '../types.ts';

interface NewsCardProps {
  article: NewsArticle;
  onReadMore: (article: NewsArticle) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isPlaying: boolean;
  isAudioLoading: boolean;
  onToggleAudio: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  article, 
  onReadMore, 
  isBookmarked, 
  onToggleBookmark,
  isPlaying,
  isAudioLoading,
  onToggleAudio
}) => {
  const [copied, setCopied] = useState(false);

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleAudio();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.gist,
          url: article.url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(article.publishedAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="group px-6 py-8 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative" onClick={() => onReadMore(article)}>
      {article.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-gray-100 shadow-sm border border-gray-100">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
            {article.source}
          </span>
          <span className="text-[10px] font-medium text-gray-400">
            {formattedDate} • {formattedTime}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className={`p-1.5 rounded-full transition-colors relative ${copied ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
            title="Share article"
          >
            {copied ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
            {copied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 shadow-lg">
                Copied!
              </span>
            )}
          </button>
          
          <button 
            onClick={handleBookmark}
            className={`p-1.5 rounded-full transition-colors hover:bg-gray-100 ${isBookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-gray-500'}`}
            title={isBookmarked ? "Remove Bookmark" : "Save for later"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-blue-700 transition-colors">
            {article.title}
          </h2>
          <p className="text-gray-600 leading-relaxed text-sm mb-4">
            {article.gist}
          </p>
        </div>
        
        <button 
          onClick={handleAudioClick}
          className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full border border-gray-100 hover:bg-white hover:shadow-lg transition-all ${isPlaying ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-400 bg-gray-50'}`}
          title={isPlaying ? "Stop reading" : "Read news"}
        >
          {isAudioLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex items-center text-xs font-semibold text-gray-400 group-hover:text-blue-500">
        READ FULL STORY
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default NewsCard;
