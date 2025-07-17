import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GenerationTask {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string;
  error?: string;
  createdAt: Date;
}

interface UseGenerationProps {
  type: 'image' | 'video';
  prompt: string;
  onComplete?: (result: string) => void;
  onError?: (error: string) => void;
}

export function useGeneration({
  type,
  prompt,
  onComplete,
  onError,
}: UseGenerationProps) {
  const [task, setTask] = useState<GenerationTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Start generation
  const startGeneration = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const data = await response.json();
      if (!data.taskId) {
        throw new Error('No task ID received');
      }

      return data.taskId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start generation';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      onError?.(message);
      setIsGenerating(false);
      throw error;
    }
  };

  // Poll task status
  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/generate?taskId=${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task status');
      }

      const taskData: GenerationTask = await response.json();
      setTask(taskData);

      if (taskData.status === 'completed') {
        setIsGenerating(false);
        if (taskData.result) {
          onComplete?.(taskData.result);
          toast({
            title: 'Generation Complete',
            description: `Your ${type} has been generated successfully!`,
          });
        }
        return true;
      } else if (taskData.status === 'failed') {
        setIsGenerating(false);
        const errorMessage = taskData.error || 'Generation failed';
        onError?.(errorMessage);
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return true;
      }

      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check generation status';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setIsGenerating(false);
      onError?.(message);
      return true;
    }
  };

  // Generate function that combines starting and polling
  const generate = async () => {
    try {
      const taskId = await startGeneration();
      
      // Start polling
      const pollInterval = setInterval(async () => {
        const isDone = await pollTaskStatus(taskId);
        if (isDone) {
          clearInterval(pollInterval);
        }
      }, 1000);

      // Cleanup interval after 5 minutes (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          const message = 'Generation timed out';
          toast({
            title: 'Timeout',
            description: message,
            variant: 'destructive',
          });
          onError?.(message);
        }
      }, 300000);

    } catch (error) {
      // Error handling is done in startGeneration
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsGenerating(false);
      setTask(null);
    };
  }, []);

  return {
    generate,
    isGenerating,
    progress: task?.progress || 0,
    result: task?.result,
    error: task?.error,
  };
} 