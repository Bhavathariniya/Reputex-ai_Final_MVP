
import React from 'react';

const ArbitrumIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="white"/>
      <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="#28A0F0"/>
    </svg>
  </div>
);

export default ArbitrumIcon;
