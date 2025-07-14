
import React from 'react';

const OptimismIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-red-500 ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="white"/>
      <path d="M8 10C8 8.9 8.9 8 10 8H14C15.1 8 16 8.9 16 10C16 11.1 15.1 12 14 12H10C8.9 12 8 12.9 8 14C8 15.1 8.9 16 10 16H14" stroke="#FF0420" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </div>
);

export default OptimismIcon;
