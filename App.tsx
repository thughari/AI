import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { getInitializationError, restartChatSession } from './services/geminiService';
import { AgentIcon, RefreshIcon } from './components/icons';

const App: React.FC = () => {
  const initializationError = getInitializationError();
  const [chatInterfaceKey, setChatInterfaceKey] = useState(Date.now());
  const [restartError, setRestartError] = useState<string | null>(null);

  const handleRestartChat = () => {
    setRestartError(null); // Clear previous restart error
    try {
      restartChatSession(); // Resets backend context
      setChatInterfaceKey(Date.now()); // Forces ChatInterface to remount and reset its state
    } catch (error: any) {
      console.error("Failed to restart chat session:", error);
      const errorMessageText = error instanceof Error ? error.message : "An unknown error occurred during restart.";
      setRestartError(`Failed to restart chat: ${errorMessageText}`);
      // Clear the error message after a few seconds
      setTimeout(() => setRestartError(null), 5000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center">
          <AgentIcon className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-semibold ml-3">CodeMaster</h1>
          {!initializationError && (
            <button
              onClick={handleRestartChat}
              className="ml-auto p-2 rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors duration-150"
              aria-label="Restart chat session"
              title="Restart Chat"
            >
              <RefreshIcon className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </header>

      {restartError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mx-auto mt-2 mb-0 w-full max-w-3xl shadow-md rounded-r-md" role="alert">
          <p><strong className="font-bold">Restart Notice:</strong> {restartError}</p>
        </div>
      )}

      {initializationError ? (
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg relative max-w-lg text-center shadow-md" role="alert">
            <strong className="font-bold text-lg">Initialization Error!</strong>
            <p className="mt-2"> {initializationError}</p>
            <p className="mt-3 text-sm text-gray-600">Please ensure the API_KEY environment variable is correctly configured and refresh the application.</p>
          </div>
        </div>
      ) : (
        <ChatInterface key={chatInterfaceKey} />
      )}
    </div>
  );
};

export default App;