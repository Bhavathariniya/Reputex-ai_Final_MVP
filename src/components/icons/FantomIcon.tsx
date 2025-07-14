
import React from 'react';

const FantomIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white"/>
      <path d="M12 8L8 10V14L12 16L16 14V10L12 8Z" fill="#1969FF"/>
    </svg>
  </div>
);

export default FantomIcon;
