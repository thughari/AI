import React from 'react';
import { Source } from '../types';

interface SourceLinkPillProps {
  source: Source;
  isUserBubble?: boolean; // To adjust styling if needed within user's message (though sources are typically for agent)
}

const SourceLinkPill: React.FC<SourceLinkPillProps> = ({ source, isUserBubble }) => {

  let displayTitle = source.title;
  if (!displayTitle || displayTitle.trim() === '' || displayTitle.startsWith('http')) {
    try {
      displayTitle = new URL(source.uri).hostname.replace(/^www\./, '');
    } catch (e) {
      displayTitle = source.uri.substring(0, 30) + (source.uri.length > 30 ? '...' : ''); // Fallback for invalid URLs
    }
  }


  const pillClasses = isUserBubble 
    ? 'bg-blue-400 text-white hover:bg-blue-300' 
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800';

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block ${pillClasses} text-xs font-medium px-2.5 py-1 rounded-full transition-colors duration-150 max-w-[200px] truncate`}
      title={source.uri} // Full URI on hover
    >
      {/* Link Icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 inline-block mr-1 align-middle">
        <path d="M7.25 10.25a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z" />
        <path fillRule="evenodd" d="M3.25 2A2.25 2.25 0 0 0 1 4.25v7.5A2.25 2.25 0 0 0 3.25 14h9.5A2.25 2.25 0 0 0 15 11.75V7.75a.75.75 0 0 0-1.5 0V11.75a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75h2a.75.75 0 0 0 0-1.5h-2ZM9.75 2.75a.75.75 0 0 0 0 1.5h1.25V6a.75.75 0 0 0 1.5 0V4.25h1.25a.75.75 0 0 0 0-1.5H9.75Z" clipRule="evenodd" />
      </svg>
      {displayTitle}
    </a>
  );
};

export default SourceLinkPill;
