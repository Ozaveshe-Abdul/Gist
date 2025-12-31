import React from 'react';
import { CategoryType } from '../types.ts';

interface CategoryBarProps {
  activeCategory: CategoryType;
  onSelect: (category: CategoryType) => void;
}

const categories: CategoryType[] = [
  'General', 
  'Home Politics', 
  'Inter Politics', 
  'Technology', 
  'Business', 
  'Science', 
  'Sports', 
  'Entertainment', 
  'Health',
  'Bookmarks'
];

const CategoryBar: React.FC<CategoryBarProps> = ({ activeCategory, onSelect }) => {
  return (
    <div className="sticky top-[68px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-50 flex overflow-x-auto no-scrollbar py-3 px-6 space-x-6">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`whitespace-nowrap text-sm font-medium transition-all ${
            activeCategory === cat 
              ? (cat === 'Bookmarks' ? 'text-amber-600 font-bold' : 'text-blue-600 font-bold') 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {cat === 'Bookmarks' && (
            <span className="inline-block mr-1">★</span>
          )}
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryBar;