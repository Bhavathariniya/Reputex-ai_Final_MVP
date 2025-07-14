
import React from 'react';

const SolanaIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-purple-400 to-green-400 ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8L8 4H20L16 8H4Z" fill="white"/>
      <path d="M4 16L8 12H20L16 16H4Z" fill="white"/>
      <path d="M4 24L8 20H20L16 24H4Z" fill="white"/>
    </svg>
  </div>
);

export default SolanaIcon;
