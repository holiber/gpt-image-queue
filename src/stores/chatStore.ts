import { makeAutoObservable } from 'mobx';

export interface ImageTask {
  id: string;
  prompt: string;
  description?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  imageTasks?: ImageTask[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ImageQuality = 'standard' | 'hd';
export type ImageSize = '1024x1024' | '1024x1792' | '1792x1024';

class ChatStore {
  chats: Chat[] = [];
  currentChatId: string | null = null;
  apiKey: string = '';
  imageQuality: ImageQuality = 'standard';
  imageSize: ImageSize = '1024x1024';
  isGenerating: boolean = false;
  isInitialized: boolean = false;
  taskQueue: ImageTask[] = [];
  isProcessingQueue: boolean = false;

  constructor() {
    makeAutoObservable(this);
    // Defer initialization to avoid SSR issues
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  initialize() {
    if (this.isInitialized) return;
    this.loadFromLocalStorage();
    this.isInitialized = true;
  }

  // API Key management
  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gpt-api-key', key);
    }
  }

  loadApiKey() {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('gpt-api-key');
      if (key) {
        this.apiKey = key;
      }
    }
  }

  // Image Quality management
  setImageQuality(quality: ImageQuality) {
    this.imageQuality = quality;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gpt-image-quality', quality);
    }
  }

  loadImageQuality() {
    if (typeof window !== 'undefined') {
      const quality = localStorage.getItem('gpt-image-quality') as ImageQuality;
      if (quality && (quality === 'standard' || quality === 'hd')) {
        this.imageQuality = quality;
      }
    }
  }

  // Image Size management
  setImageSize(size: ImageSize) {
    this.imageSize = size;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gpt-image-size', size);
    }
  }

  loadImageSize() {
    if (typeof window !== 'undefined') {
      const size = localStorage.getItem('gpt-image-size') as ImageSize;
      if (size && (size === '1024x1024' || size === '1024x1792' || size === '1792x1024')) {
        this.imageSize = size;
      }
    }
  }

  // Chat management
  createNewChat(): Chat {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.chats.unshift(newChat);
    this.currentChatId = newChat.id;
    this.saveToLocalStorage();
    return newChat;
  }

  setCurrentChat(chatId: string) {
    this.currentChatId = chatId;
  }

  getCurrentChat(): Chat | null {
    return this.chats.find(chat => chat.id === this.currentChatId) || null;
  }

  updateChatTitle(chatId: string, title: string) {
    const chat = this.chats.find(c => c.id === chatId);
    if (chat) {
      chat.title = title;
      chat.updatedAt = new Date();
      this.saveToLocalStorage();
    }
  }

  deleteChat(chatId: string) {
    this.chats = this.chats.filter(chat => chat.id !== chatId);
    if (this.currentChatId === chatId) {
      this.currentChatId = this.chats.length > 0 ? this.chats[0].id : null;
    }
    this.saveToLocalStorage();
  }

  // Message management
  addMessage(chatId: string, content: string, role: 'user' | 'assistant', imageTasks?: ImageTask[]): Message {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) throw new Error('Chat not found');

    const message: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
      imageTasks,
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();
    
    // Update chat title if it's the first user message
    if (role === 'user' && chat.title === 'New Chat') {
      chat.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    this.saveToLocalStorage();
    return message;
  }

  // Image task management
  createImageTask(prompt: string, description?: string): ImageTask {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      prompt,
      description,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  // Task queue management
  addTasksToQueue(tasks: ImageTask[]) {
    this.taskQueue.push(...tasks);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessingQueue || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    this.isGenerating = true;

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      
      try {
        // Update task status to generating
        this.updateTaskStatus(task.id, 'generating');

        // Generate image using the service
        const { gptImageService } = await import('../services/gptImageService');
        const imageUrl = await gptImageService.generateImage(
          task.prompt, 
          this.apiKey, 
          this.imageQuality, 
          this.imageSize
        );

        // Update task status to completed
        this.updateTaskStatus(task.id, 'completed', imageUrl);
      } catch (error) {
        console.error('Failed to generate image:', error);
        this.updateTaskStatus(
          task.id, 
          'failed', 
          undefined, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    this.isProcessingQueue = false;
    this.isGenerating = false;
  }

  getQueueStatus() {
    return {
      totalTasks: this.taskQueue.length,
      isProcessing: this.isProcessingQueue,
      isGenerating: this.isGenerating,
    };
  }

  updateTaskStatus(taskId: string, status: ImageTask['status'], imageUrl?: string, error?: string) {
    for (const chat of this.chats) {
      for (const message of chat.messages) {
        if (message.imageTasks) {
          const task = message.imageTasks.find(t => t.id === taskId);
          if (task) {
            task.status = status;
            if (imageUrl) task.imageUrl = imageUrl;
            if (error) task.error = error;
            this.saveToLocalStorage();
            return;
          }
        }
      }
    }
  }

  // Local storage
  saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gpt-image-queue-chats', JSON.stringify(this.chats));
    }
  }

  loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gpt-image-queue-chats');
      if (saved) {
        try {
          const parsedChats = JSON.parse(saved);
          this.chats = parsedChats.map((chat: Chat) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: chat.messages.map((msg: Message) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              imageTasks: msg.imageTasks?.map((task: ImageTask) => ({
                ...task,
                createdAt: new Date(task.createdAt),
              })),
            })),
          }));
          
          if (this.chats.length > 0 && !this.currentChatId) {
            this.currentChatId = this.chats[0].id;
          }
        } catch (error) {
          console.error('Failed to load chats from localStorage:', error);
        }
      }
    }
    
    this.loadApiKey();
    this.loadImageQuality();
    this.loadImageSize();
  }
}

export const chatStore = new ChatStore();
