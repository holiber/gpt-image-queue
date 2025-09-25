'use client';

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Download, Loader2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageTask } from '@/stores/chatStore';

interface ImageTaskComponentProps {
  task: ImageTask;
}

const ImageTaskComponent = observer(({ task }: ImageTaskComponentProps) => {
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    if (!task.imageUrl) return;

    try {
      // Create a human-readable filename
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedPrompt = task.prompt
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 50);
      
      const filename = `gpt_image_${timestamp}_${sanitizedPrompt}.png`;
      
      // Use a different approach to avoid CORS issues
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = task.imageUrl;
      link.download = filename;
      link.target = '_blank';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: open image in new tab
      window.open(task.imageUrl, '_blank');
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-yellow-400" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'pending':
        return 'Waiting in queue...';
      case 'generating':
        return 'Generating image...';
      case 'completed':
        return 'Image generated';
      case 'failed':
        return 'Generation failed';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          {task.description && (
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              {task.description}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="font-medium">Prompt:</span> {task.prompt}
          </p>
          
          {task.imageUrl && (
            <div className="mb-3">
              {!imageError ? (
                <img
                  src={task.imageUrl}
                  alt={task.prompt}
                  className="w-full h-auto rounded-lg border"
                  style={{ maxHeight: '250px', objectFit: 'cover' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Image preview not available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click download to save the image
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {task.error && (
            <div className="text-sm text-red-600 dark:text-red-400 mb-3">
              Error: {task.error}
            </div>
          )}
        </div>
        
        {task.status === 'completed' && task.imageUrl && (
          <Button
            onClick={handleDownload}
            size="sm"
            variant="outline"
            className="ml-4 gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
});

export default ImageTaskComponent;
