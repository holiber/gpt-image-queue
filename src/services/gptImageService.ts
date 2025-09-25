import { chatStore, ImageTask } from '../stores/chatStore';

export interface GPTImageResponse {
  created: number;
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

export interface ImageAnalysisResponse {
  analysis: string;
  tasks: Array<{
    prompt: string;
    description: string;
  }>;
}

class GPTImageService {
  private baseUrl = 'https://api.openai.com/v1';

  async analyzeImageRequest(userMessage: string, apiKey: string): Promise<ImageAnalysisResponse> {
    const systemPrompt = `You are an AI assistant that analyzes user requests for image generation. Your job is to:

1. Determine if the user wants to generate images
2. Count how many images they want
3. Create specific prompts for each image
4. Provide a brief analysis of your decision

Respond with a JSON object in this exact format:
{
  "analysis": "Brief explanation of what the user wants and how many images you'll create",
  "tasks": [
    {
      "prompt": "Detailed prompt for DALL-E 3 to generate the first image",
      "description": "Brief description of what this image will show"
    },
    {
      "prompt": "Detailed prompt for DALL-E 3 to generate the second image", 
      "description": "Brief description of what this image will show"
    }
  ]
}

If the user doesn't want images, return:
{
  "analysis": "The user is not requesting image generation",
  "tasks": []
}

Make prompts detailed and specific for DALL-E 3. Include style, composition, lighting, and other visual details.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from ChatGPT');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      throw new Error('Failed to parse ChatGPT response as JSON');
    }
  }

  async generateImage(prompt: string, apiKey: string, quality: 'standard' | 'hd' = 'standard', size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data: GPTImageResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No image generated');
    }

    return data.data[0].url;
  }

  async processImageTasks(tasks: ImageTask[], apiKey: string, quality: 'standard' | 'hd' = 'standard', size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024') {
    for (const task of tasks) {
      if (task.status !== 'pending') continue;

      try {
        // Update task status to generating
        chatStore.updateTaskStatus(task.id, 'generating');

        // Generate image
        const imageUrl = await this.generateImage(task.prompt, apiKey, quality, size);

        // Update task status to completed
        chatStore.updateTaskStatus(task.id, 'completed', imageUrl);
      } catch (error) {
        console.error('Failed to generate image:', error);
        chatStore.updateTaskStatus(
          task.id, 
          'failed', 
          undefined, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

}

export const gptImageService = new GPTImageService();
