'use client';

import { observer } from 'mobx-react-lite';
import { ImageQuality, ImageSize } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { chatStore } from '@/stores/chatStore';

const QualitySelector = observer(() => {
  const handleQualityChange = (quality: ImageQuality) => {
    chatStore.setImageQuality(quality);
  };

  const handleSizeChange = (size: ImageSize) => {
    chatStore.setImageSize(size);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Quality:
        </span>
        <div className="flex gap-1">
          <Button
            variant={chatStore.imageQuality === 'standard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQualityChange('standard')}
            className="h-8 px-3"
          >
            Standard
          </Button>
          <Button
            variant={chatStore.imageQuality === 'hd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQualityChange('hd')}
            className="h-8 px-3"
          >
            HD
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Size:
        </span>
        <div className="flex gap-1">
          <Button
            variant={chatStore.imageSize === '1024x1024' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSizeChange('1024x1024')}
            className="h-8 px-2 text-xs"
          >
            Square
          </Button>
          <Button
            variant={chatStore.imageSize === '1024x1792' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSizeChange('1024x1792')}
            className="h-8 px-2 text-xs"
          >
            Portrait
          </Button>
          <Button
            variant={chatStore.imageSize === '1792x1024' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSizeChange('1792x1024')}
            className="h-8 px-2 text-xs"
          >
            Landscape
          </Button>
        </div>
      </div>
    </div>
  );
});

export default QualitySelector;
