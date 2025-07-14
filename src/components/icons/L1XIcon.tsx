
import React from 'react';

const L1XIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 ${className || ''}`}>
    <span className="text-white text-xs font-bold">L1X</span>
  </div>
);

export default L1XIcon;
