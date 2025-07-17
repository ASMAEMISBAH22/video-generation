import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

interface Task {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string;
  error?: string;
  createdAt: Date;
}

// In-memory store (should be replaced with a database in production)
let tasks: { [key: string]: Task } = {};

// Maximum number of concurrent tasks
const MAX_CONCURRENT_TASKS = 5;
const MAX_PROMPT_LENGTH = 1000;

// POST /api/generate
export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = headers().get('x-forwarded-for') || 'unknown';
    const { success } = await rateLimit.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, prompt } = body;

    // Input validation
    if (!type || !prompt) {
      return NextResponse.json(
        { error: 'Type and prompt are required' },
        { status: 400 }
      );
    }

    if (type !== 'image' && type !== 'video') {
      return NextResponse.json(
        { error: 'Type must be either "image" or "video"' },
        { status: 400 }
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt must be less than ${MAX_PROMPT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Check concurrent tasks limit
    const activeTasks = Object.values(tasks).filter(
      t => t.status === 'pending' || t.status === 'processing'
    );
    if (activeTasks.length >= MAX_CONCURRENT_TASKS) {
      return NextResponse.json(
        { error: 'Maximum number of concurrent tasks reached. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate unique task ID using crypto for better randomness
    const taskId = crypto.randomUUID();

    // Create new task
    const task: Task = {
      id: taskId,
      type,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    // Add to queue
    tasks[taskId] = task;

    // Start processing in background
    processTask(taskId, type, prompt);

    return NextResponse.json({ taskId });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// GET /api/generate?taskId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = tasks[taskId];
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task status' },
      { status: 500 }
    );
  }
}

async function processTask(taskId: string, type: 'image' | 'video', prompt: string) {
  const task = tasks[taskId];
  if (!task) return;

  try {
    task.status = 'processing';

    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      throw new Error('RUNWAY_API_KEY is not configured');
    }

    // Call Runway API based on type
    const endpoint = type === 'image' 
      ? 'https://api.runwayml.com/v1/inference'
      : 'https://api.runwayml.com/v1/image_to_video';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: type === 'image' ? 'gen-4-turbo' : 'gen-4-turbo',
        inputs: {
          prompt,
          width: 1280,
          height: 720,
          ...(type === 'video' && { duration: 5 }),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Runway API error: ${response.statusText}. ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.output?.[type === 'image' ? 'image' : 'video']) {
      throw new Error(`No ${type} URL returned from Runway API`);
    }

    task.status = 'completed';
    task.progress = 100;
    task.result = data.output[type === 'image' ? 'image' : 'video'];

    // Cleanup task after 1 hour
    setTimeout(() => {
      if (tasks[taskId]) {
        delete tasks[taskId];
      }
    }, 3600000);

  } catch (error) {
    console.error(`Error processing ${type} task:`, error);
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : 'Unknown error';
    
    // Cleanup failed task after 15 minutes
    setTimeout(() => {
      if (tasks[taskId]) {
        delete tasks[taskId];
      }
    }, 900000);
  }
} 