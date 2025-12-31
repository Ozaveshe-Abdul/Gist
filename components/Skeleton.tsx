
import React from 'react';

const Skeleton: React.FC = () => {
  return (
    <div className="px-6 py-8 border-b border-gray-50 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 rounded mb-4"></div>
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
      <div className="h-6 w-1/2 bg-gray-200 rounded mb-6"></div>
      <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
      <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
      <div className="h-3 w-2/3 bg-gray-100 rounded mb-6"></div>
      <div className="h-3 w-24 bg-gray-200 rounded"></div>
    </div>
  );
};

export default Skeleton;
