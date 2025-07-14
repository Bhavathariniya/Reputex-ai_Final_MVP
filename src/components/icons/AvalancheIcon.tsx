
import React from 'react';

const AvalancheIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-red-500 ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L21 20H3L12 2Z" fill="white"/>
      <path d="M12 6L18 16H6L12 6Z" fill="#E84142"/>
    </svg>
  </div>
);

export default AvalancheIcon;
