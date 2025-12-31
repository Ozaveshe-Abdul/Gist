
import React, { useState } from 'react';
import { NewsArticle } from '../types.ts';
import { getDeepAnalysis } from '../services/geminiService.ts';

interface ArticleViewProps {
  article: NewsArticle;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isPlaying: boolean;
  isAudioLoading: boolean;
  onToggleAudio: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ 
  article, 
  onClose, 
  isBookmarked, 
  onToggleBookmark,
  isPlaying,
  isAudioLoading,
  onToggleAudio
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleDeepDive = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await getDeepAnalysis(article.title, article.gist);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openOriginal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-col items-center flex-1 mx-4 overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate w-full text-center">
            {article.source}
          </span>
          <span className="text-xs text-gray-900 font-medium truncate w-full text-center">
            {article.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleBookmark}
            className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isBookmarked ? 'text-amber-500' : 'text-gray-400'}`}
            title={isBookmarked ? "Remove Bookmark" : "Save for later"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button 
            onClick={onToggleAudio}
            className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isPlaying ? 'text-blue-600' : 'text-gray-600'}`}
            title={isPlaying ? "Stop Summary" : "Read Summary"}
          >
            {isAudioLoading ? (
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <button 
            onClick={openOriginal}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Open in new tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </header>
      
      <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
        {/* Floating AI Tool Button */}
        {!analysis && (
          <button 
            onClick={handleDeepDive}
            disabled={isAnalyzing}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black text-white px-8 py-4 rounded-full font-bold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Deep AI Gist Dive
              </>
            )}
          </button>
        )}

        {/* Analysis Modal/Panel */}
        {analysis && (
          <div className="absolute inset-0 z-20 bg-white overflow-y-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-xl mx-auto pb-24">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-gray-900">Analysis</h2>
                  <p className="text-sm text-gray-400 mt-1">AI-powered perspective on "{article.title}"</p>
                </div>
                <button onClick={() => setAnalysis(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-10">
                <section className="bg-blue-50/30 p-6 rounded-2xl border border-blue-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Historical Context</h3>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-lg font-medium">{analysis.context}</p>
                </section>
                
                <section className="bg-purple-50/30 p-6 rounded-2xl border border-purple-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Implications</h3>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-lg font-medium">{analysis.implications}</p>
                </section>
                
                <section className="bg-green-50/30 p-6 rounded-2xl border border-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <h3 className="text-xs font-bold text-green-600 uppercase tracking-widest">Future Outlook</h3>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-lg font-medium">{analysis.conclusion}</p>
                </section>
              </div>
              
              <button 
                onClick={() => setAnalysis(null)}
                className="mt-12 w-full py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg"
              >
                Return to Reader
              </button>
            </div>
          </div>
        )}

        <div className="h-full w-full flex flex-col">
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-amber-800 font-medium">If content fails to load or shows 404, use the button to open directly.</p>
             </div>
             <button 
               onClick={openOriginal}
               className="text-[11px] bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-amber-700 transition-colors whitespace-nowrap shadow-sm"
             >
               Open Source Site
             </button>
          </div>
          <iframe 
            src={article.url} 
            className="flex-1 w-full border-none"
            title={article.title}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
