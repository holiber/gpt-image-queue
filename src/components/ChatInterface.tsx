'use client';

import { observer } from 'mobx-react-lite';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatStore } from '@/stores/chatStore';
import { gptImageService, ImageAnalysisResponse } from '@/services/gptImageService';
import ImageTaskComponent from './ImageTaskComponent';
import QueueStatus from './QueueStatus';

const ChatInterface = observer(() => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentChat = chatStore.getCurrentChat();

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [currentChat?.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentChat || !chatStore.apiKey) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      // Add user message
      chatStore.addMessage(currentChat.id, message, 'user');

      // Analyze the request using ChatGPT
      const analysis: ImageAnalysisResponse = await gptImageService.analyzeImageRequest(message, chatStore.apiKey);
      
      if (analysis.tasks.length > 0) {
        // Create image tasks based on ChatGPT analysis
        const imageTasks = analysis.tasks.map(task => 
          chatStore.createImageTask(task.prompt, task.description)
        );

        // Add assistant message with analysis and image tasks
        const assistantMessage = `${analysis.analysis}\n\nI'll create ${imageTasks.length} image${imageTasks.length > 1 ? 's' : ''}:\n${analysis.tasks.map((task, index) => `${index + 1}. ${task.description}`).join('\n')}`;
        
        chatStore.addMessage(currentChat.id, assistantMessage, 'assistant', imageTasks);

        // Add tasks to queue for processing
        chatStore.addTasksToQueue(imageTasks);
      } else {
        // No image requests found
        chatStore.addMessage(currentChat.id, 
          analysis.analysis || "I didn't detect any image generation requests in your message. Try asking me to 'generate an image of...' or 'create a picture of...'", 
          'assistant'
        );
      }
    } catch (error) {
      console.error('Error processing message:', error);
      chatStore.addMessage(currentChat.id, 
        'Sorry, there was an error processing your request. Please try again.', 
        'assistant'
      );
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentChat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            No chat selected
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create a new chat to start generating images
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-b bg-white px-6 py-4 dark:bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {currentChat.title}
        </h1>
      </div>

      {/* Queue Status */}
      <QueueStatus />

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {currentChat.messages.length === 0 ? (
            <div className="text-center">
              <Bot className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                Start a conversation
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ask me to generate images for you!
              </p>
            </div>
          ) : (
            currentChat.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {message.imageTasks && message.imageTasks.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {message.imageTasks.map((task) => (
                        <ImageTaskComponent key={task.id} task={task} />
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isProcessing && (
            <div className="flex justify-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white p-6 dark:bg-gray-900">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to generate images..."
            disabled={isProcessing || !chatStore.apiKey}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing || !chatStore.apiKey}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!chatStore.apiKey && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Please set your OpenAI API key in settings to generate images.
          </p>
        )}
      </div>
    </div>
  );
});

export default ChatInterface;
