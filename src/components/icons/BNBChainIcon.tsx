
import React from 'react';

const BNBChainIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-yellow-500 ${className || ''}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L17 7L12 12L7 7L12 2Z" fill="white"/>
        <path d="M2 12L7 7L12 12L7 17L2 12Z" fill="white"/>
        <path d="M22 12L17 7L12 12L17 17L22 12Z" fill="white"/>
        <path d="M12 22L7 17L12 12L17 17L12 22Z" fill="white"/>
      </svg>
    </div>
  );
};

export default BNBChainIcon;
