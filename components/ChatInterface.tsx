
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, MessageType } from '../types';
import { processUserCommand } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import LoadingSpinner from './LoadingSpinner';
import { SendIcon } from './icons';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      type: MessageType.USER,
      text: trimmedInput,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    
    // Reset textarea height after submit using ref
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; 
    }
    setIsLoading(true);

    try {
      const agentResponse = await processUserCommand(trimmedInput);
      const newAgentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: MessageType.AGENT,
        text: agentResponse.text,
        sources: agentResponse.sources,
      };
      setMessages(prev => [...prev, newAgentMessage]);
    } catch (error: any) {
      const errorMessageText = error instanceof Error ? error.message : 'An unknown error occurred.';
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: MessageType.ERROR,
        text: errorMessageText,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Re-focus the textarea after the submission process is complete
      textareaRef.current?.focus();
    }
  }, [inputValue, isLoading, textareaRef]); // Added textareaRef to dependencies

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  useEffect(() => {
    // Add an initial greeting message from the agent
    setMessages([
      {
        id: 'init-greet-' + Date.now(), // Ensure unique ID
        type: MessageType.AGENT,
        text: "Hello! I'm CodeMaster, your expert AI coding partner. How can I help you solve a programming challenge, debug code, or understand a new concept today?",
      }
    ]);
    // Focus the textarea on initial load
    textareaRef.current?.focus();
  }, []); // Empty dependency array ensures this runs only on mount


  return (
    <div className="flex flex-col flex-grow h-full bg-gray-50 overflow-hidden">
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && !messages.some(msg => msg.id === 'loading-placeholder') && (
          <div className="flex justify-center py-2" id="loading-placeholder">
            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-600">CodeMaster is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 md:p-4 bg-white border-t border-gray-200 shadow- ऊपर">
        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef} // Attach the ref here
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter your command..."
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto max-h-40"
            rows={1}
            disabled={isLoading}
            aria-label="Command input"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !inputValue.trim()}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150 self-end"
            aria-label="Send command"
          >
            {isLoading ? <LoadingSpinner size="sm" color="text-white"/> : <SendIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;