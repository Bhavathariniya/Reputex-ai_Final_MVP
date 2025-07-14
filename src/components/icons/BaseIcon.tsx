
import React from 'react';

const BaseIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="white"/>
      <path d="M8 12H16" stroke="#0052FF" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  </div>
);

export default BaseIcon;
