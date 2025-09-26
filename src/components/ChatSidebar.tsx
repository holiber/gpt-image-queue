'use client';

import { observer } from 'mobx-react-lite';
import { Plus, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatStore } from '@/stores/chatStore';
import { useState } from 'react';

const ChatSidebar = observer(() => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleNewChat = () => {
    chatStore.createNewChat();
  };

  const handleChatSelect = (chatId: string) => {
    chatStore.setCurrentChat(chatId);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    chatStore.deleteChat(chatId);
  };

  const handleEditStart = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleEditSave = () => {
    if (editingChatId) {
      chatStore.updateChatTitle(editingChatId, editingTitle);
      setEditingChatId(null);
      setEditingTitle('');
    }
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className={`w-full justify-start gap-2 ${chatStore.isSidebarCollapsed ? 'px-2' : ''}`}
          variant="outline"
          title={chatStore.isSidebarCollapsed ? 'New Chat' : undefined}
        >
          <Plus className="h-4 w-4" />
          {!chatStore.isSidebarCollapsed && 'New Chat'}
        </Button>
      </div>

      <Separator />

      {/* Chat List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {chatStore.chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative flex items-center rounded-lg p-2 text-sm transition-colors hover:bg-gray-100 ${
                chatStore.currentChatId === chat.id
                  ? 'bg-gray-200'
                  : ''
              } ${chatStore.isSidebarCollapsed ? 'px-2' : ''}`}
              onClick={() => handleChatSelect(chat.id)}
              title={chatStore.isSidebarCollapsed ? chat.title : undefined}
            >
              <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
              
              {!chatStore.isSidebarCollapsed && (
                <>
                  {editingChatId === chat.id ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={handleEditSave}
                      onKeyDown={handleKeyDown}
                      className="h-6 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate">{chat.title}</span>
                  )}

                  {/* Action buttons */}
                  <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleEditStart(chat.id, chat.title, e)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});

export default ChatSidebar;
