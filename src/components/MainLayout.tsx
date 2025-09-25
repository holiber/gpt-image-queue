'use client';

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatInterface from './ChatInterface';
import SettingsModal from './SettingsModal';
import QualitySelector from './QualitySelector';
import { chatStore } from '@/stores/chatStore';

const MainLayout = observer(() => {
  useEffect(() => {
    // Ensure store is initialized on client side
    chatStore.initialize();
    
    // Create initial chat if none exists
    if (chatStore.chats.length === 0) {
      chatStore.createNewChat();
    }
  }, []);

  // Check if API key is missing and should auto-open settings
  const shouldAutoOpenSettings = !chatStore.apiKey && chatStore.isInitialized;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              🎨 GPT Image Queue
            </h1>
            <QualitySelector />
          </div>
          <SettingsModal autoOpen={shouldAutoOpenSettings} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex w-full pt-16 min-h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white">
          <div className="flex h-full flex-col">
            {/* Sidebar Content */}
            <div className="flex-1 pt-4">
              <ChatSidebar />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
});

export default MainLayout;
