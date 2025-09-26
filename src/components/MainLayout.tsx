'use client';

import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatInterface from './ChatInterface';
import SettingsModal from './SettingsModal';
import QualitySelector from './QualitySelector';
import { chatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const MainLayout = observer(() => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Ensure store is initialized on client side
    chatStore.initialize();
    
    // Create initial chat if none exists
    if (chatStore.chats.length === 0) {
      chatStore.createNewChat();
    }

    // Check if mobile and auto-collapse sidebar
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile) {
        chatStore.setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if API key is missing and should auto-open settings
  const shouldAutoOpenSettings = !chatStore.apiKey && chatStore.isInitialized;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => chatStore.toggleSidebar()}
            >
              {chatStore.isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
            
            <h1 className="text-lg font-semibold text-gray-900">
              🎨 GPT Image Queue
            </h1>
            <div className="hidden md:block">
              <QualitySelector />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <QualitySelector />
            </div>
            <SettingsModal autoOpen={shouldAutoOpenSettings} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex w-full pt-16 min-h-screen">
        {/* Sidebar */}
        <div className={`
          ${chatStore.isSidebarCollapsed ? 'w-0 md:w-16' : 'w-64'} 
          border-r border-gray-200 bg-white 
          transition-all duration-300 ease-in-out
          ${isMobile && chatStore.isSidebarCollapsed ? 'hidden' : ''}
          ${isMobile && !chatStore.isSidebarCollapsed ? 'fixed inset-y-0 left-0 z-20' : ''}
        `}>
          <div className="flex h-full flex-col">
            {/* Desktop collapse button */}
            {!isMobile && (
              <div className="flex justify-end p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => chatStore.toggleSidebar()}
                  className="h-8 w-8 p-0"
                >
                  {chatStore.isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>
            )}
            
            {/* Sidebar Content */}
            <div className={`flex-1 ${chatStore.isSidebarCollapsed ? 'hidden md:block' : ''} ${isMobile ? 'pt-4' : 'pt-2'}`}>
              <ChatSidebar />
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobile && !chatStore.isSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => chatStore.setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 bg-white">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
});

export default MainLayout;
