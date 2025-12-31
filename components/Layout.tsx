
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-white border-x border-gray-100 shadow-sm">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">gist.</h1>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Updates</span>
        </div>
      </header>
      <main className="flex-1 pb-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;
