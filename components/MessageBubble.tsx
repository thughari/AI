

import React, { useRef, useEffect } from 'react';
import { ChatMessage, MessageType } from '../types';
import { UserIcon, BotMessageIcon } from './icons';
import SourceLinkPill from './SourceLinkPill';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === MessageType.USER;
  const isError = message.type === MessageType.ERROR;
  const contentRef = useRef<HTMLDivElement>(null);

  const bubbleBaseClasses = 'px-4 py-3 max-w-full break-words';
  const bubbleSpecificClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-t-xl rounded-bl-xl'
    : isError
    ? 'bg-red-100 text-red-700 border border-red-300 self-start rounded-xl'
    : 'bg-white text-gray-800 border border-gray-200 self-start rounded-t-xl rounded-br-xl shadow-sm';
  
  const IconComponent = isUser ? UserIcon : BotMessageIcon;

  // Fix: Corrected function signature to ensure it's clear it returns { __html: string } and address potential parsing issues below.
  const formatText = (text: string): { __html: string } => {
    let workText = text;
    const codeBlocks: string[] = [];
    const codeBlockPlaceholderInternal = "___CODE_BLOCK_PLACEHOLDER___"; 

    // 1. Remove the literal "CODEBLOCKPLACEHOLDER" string from AI's output
    workText = workText.replace(/CODEBLOCKPLACEHOLDER/g, '');

    // 2. Pre-normalize malformed blocks to standard triple-backtick format.
    // Fix: Simplified comments to prevent parser confusion that might lead to "Cannot find name 'bash'" etc. errors.
    //    Handles cases like ``lang\ncode\n` (double-backtick start, single-backtick end)
    workText = workText.replace(/``(\w*)\s*\n([\s\S]+?)\n`/g, (match, lang, code) => {
      return `\`\`\`${lang || 'text'}\n${code.trim()}\n\`\`\``;
    });
    //    Handles cases like `lang\ncode\n` (single-backtick start, single-backtick end, multiline)
    //    The regex uses ^ for start of line and m flag for multiline matching.
    workText = workText.replace(/^`(\w*)\s*\n([\s\S]+?)\n`/gm, (match, lang, code) => {
      return `\`\`\`${lang || 'text'}\n${code.trim()}\n\`\`\``;
    });

    // 3. Process standard and pre-normalized triple-backtick code blocks
    // Fix: Ensured regex and string manipulations are correctly interpreted. Errors like "Cannot find name 'w'" for regex characters or "Cannot find name 'div'" for HTML strings
    // are usually due to the parser being thrown off by an earlier syntax error (like problematic comments).
    workText = workText.replace(/```(\w*)\n([\s\S]+?)\n```(\s*\n)?/g, (match, lang, rawCodeContentUntrimmed) => {
      const rawCodeContent = rawCodeContentUntrimmed.trim(); 

      const escapedHtmlCode = rawCodeContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Escape for use in HTML attribute, using the same trimmed content
      const escapedAttributeCode = rawCodeContent
        .replace(/"/g, '&quot;') // Must be first for attributes if content can have quotes
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const languageClass = lang ? `language-${lang.toLowerCase()}` : 'language-text';
      
      const codeBlockHtml = `
        <div class="code-block-container relative group my-2">
          <button 
            class="copy-code-btn absolute top-2 right-2 z-10 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150"
            data-clipboard-text="${escapedAttributeCode}"
            aria-label="Copy code to clipboard"
            type="button"
          >
            Copy
          </button>
          <pre class="bg-gray-800 text-gray-100 p-3 pl-4 rounded-md overflow-x-auto shadow-sm text-sm pt-8">
            <code class="block whitespace-pre ${languageClass} font-mono">${escapedHtmlCode}</code>
          </pre>
        </div>`;
      codeBlocks.push(codeBlockHtml);
      return codeBlockPlaceholderInternal;
    });

    // 4. Process other markdown (inline code, bold, italic, newlines)
    // Fix: Ensured that 'html' variable is correctly initialized from 'workText' before further replacements.
    // Errors like "Cannot find name 'html'" or arithmetic errors on string ops are symptomatic of earlier parse failures.
    let html = workText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    html = html.replace(/`([^`]+?)`/g, '<code class="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-sm font-mono shadow-sm">$1</code>');
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    html = html.replace(/\n/g, '<br />');

    // Reinsert actual code block HTML
    // Fix: Ensured 'codeBlocks' and 'codeBlockPlaceholderInternal' are accessible. These errors are also likely due to earlier parse failures.
    if (codeBlocks.length > 0) {
      // Handle case where the entire message might be just one code block
      if (html.trim() === codeBlockPlaceholderInternal && codeBlocks.length === 1) {
        html = codeBlocks[0];
      } else {
        // Using split with a string should be safe for the current placeholder.
        // If placeholder could contain regex special chars, a RegExp split would be more robust.
        const parts = html.split(codeBlockPlaceholderInternal);
        html = parts.reduce((acc, part, i) => {
          return acc + part + (codeBlocks[i] || '');
        }, '');
      }
    }
    
    return { __html: html };
  };

  useEffect(() => {
    // Fix: Ensured contentRef is correctly accessed. Errors here are likely symptoms of component-wide parsing issues.
    const currentContentRef = contentRef.current;
    if (!currentContentRef) return;

    const copyButtons = currentContentRef.querySelectorAll<HTMLButtonElement>('.copy-code-btn');

    const handleClick = async (event: MouseEvent) => {
      const button = event.currentTarget as HTMLButtonElement;
      const codeToCopy = button.dataset.clipboardText;

      if (codeToCopy) {
        try {
          await navigator.clipboard.writeText(codeToCopy);
          button.textContent = 'Copied!';
          button.classList.add('bg-green-500', 'hover:bg-green-600');
          button.classList.remove('bg-gray-700', 'hover:bg-gray-600');
          
          setTimeout(() => {
            button.textContent = 'Copy';
            button.classList.remove('bg-green-500', 'hover:bg-green-600');
            button.classList.add('bg-gray-700', 'hover:bg-gray-600');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code: ', err);
          button.textContent = 'Error';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 2000);
        }
      }
    };

    copyButtons.forEach(button => {
      button.addEventListener('click', handleClick);
    });

    return () => { // Cleanup
      copyButtons.forEach(button => {
        button.removeEventListener('click', handleClick);
      });
    };
  // Fix: Ensured message.text and message.id are correctly accessed. Errors here are likely symptoms.
  }, [message.text, message.id]); // Re-run if message text or ID changes (ID for re-renders)


  return (
    <div className={`flex w-full my-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[85%] md:max-w-[75%]`}>
        {!isError && (
            <div className={`flex-shrink-0 p-1 rounded-full h-8 w-8 flex items-center justify-center ${isUser ? 'ml-2 bg-blue-100' : 'mr-2 bg-gray-200'}`}>
                <IconComponent className={`w-5 h-5 ${isUser ? 'text-blue-600' : 'text-blue-600'}`} />
            </div>
        )}
        {isError && (
             <div className="flex-shrink-0 p-1 rounded-full h-8 w-8 flex items-center justify-center mr-2 bg-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
        )}
        <div className={`${bubbleBaseClasses} ${bubbleSpecificClasses}`}>
          <div 
            className="prose prose-sm max-w-none prose-pre:my-0 prose-code:text-sm prose-p:my-1" 
            ref={contentRef} 
            dangerouslySetInnerHTML={formatText(message.text)} 
          />
          {message.sources && message.sources.length > 0 && !isError && (
            <div className={`mt-3 pt-2 border-t border-opacity-50 ${isUser ? 'border-blue-300' : 'border-gray-300'}`}>
              <h4 className={`text-xs font-semibold mb-1.5 ${isUser ? 'text-blue-100' : 'text-gray-600'}`}>Sources:</h4>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, index) => (
                  <SourceLinkPill key={index} source={source} isUserBubble={isUser} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
