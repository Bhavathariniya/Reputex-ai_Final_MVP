
import React from 'react';

const ZkSyncIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-800 ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="white"/>
      <path d="M12 6L16 8.5V15.5L12 18L8 15.5V8.5L12 6Z" fill="#4E529A"/>
    </svg>
  </div>
);

export default ZkSyncIcon;
