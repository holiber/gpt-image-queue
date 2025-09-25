'use client';

import { observer } from 'mobx-react-lite';
import { Clock, Loader2 } from 'lucide-react';
import { chatStore } from '@/stores/chatStore';

const QueueStatus = observer(() => {
  const queueStatus = chatStore.getQueueStatus();

  if (queueStatus.totalTasks === 0 && !queueStatus.isProcessing) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      {queueStatus.isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      ) : (
        <Clock className="h-4 w-4 text-blue-600" />
      )}
      <span className="text-sm text-blue-700 dark:text-blue-300">
        {queueStatus.isProcessing 
          ? 'Generating images...' 
          : `${queueStatus.totalTasks} task${queueStatus.totalTasks > 1 ? 's' : ''} in queue`
        }
      </span>
    </div>
  );
});

export default QueueStatus;
