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
    const codeBlockPlaceholder = "___CODE_BLOCK___";

    // Process code blocks
    workText = workText.replace(/```(\w*)\n([\s\S]+?)\n```/g, (_, lang, code) => {
      const rawCode = code.trim(); // Store the raw code before any HTML escaping
      const cleanCode = code.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const htmlBlock = `
        <div class="code-block-container relative group my-2">
          <button 
            class="copy-code-btn absolute top-2 right-2 z-10 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150"
            data-clipboard-text="${rawCode.replace(/"/g, '&quot;')}"
            aria-label="Copy code to clipboard"
            type="button"
          >
            Copy
          </button>
          <pre class="bg-gray-800 text-gray-100 p-3 pl-4 rounded-md overflow-x-auto shadow-sm text-sm pt-8">
            <code class="block whitespace-pre ${lang ? `language-${lang}` : ''}">${cleanCode}</code>
          </pre>
        </div>`;
    
      codeBlocks.push(htmlBlock);
      return codeBlockPlaceholder;
    });

    // Process regular text
    workText = workText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    // Restore code blocks
    codeBlocks.forEach(block => {
      workText = workText.replace(codeBlockPlaceholder, block);
    });

    return { __html: workText };
  };

  useEffect(() => {
    
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

    return () => {
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
